const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Database setup
const { Pool, neonConfig } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-serverless');
const { eq, and, gt } = require('drizzle-orm');
const { pgTable, text, timestamp, boolean, serial } = require('drizzle-orm/pg-core');
const ws = require('ws');

// Configure neon
neonConfig.webSocketConstructor = ws;

// Database schema
const users = pgTable('users', {
  id: serial('id').primaryKey(),
  ra: text('ra').notNull().unique(),
  password: text('password').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  last_login_at: timestamp('last_login_at'),
  is_active: boolean('is_active').default(true).notNull(),
  terms_accepted: boolean('terms_accepted').default(false).notNull(),
  terms_accepted_at: timestamp('terms_accepted_at'),
});

const userSessions = pgTable('user_sessions', {
  id: serial('id').primaryKey(),
  user_id: serial('user_id').references(() => users.id).notNull(),
  session_token: text('session_token').notNull().unique(),
  expires_at: timestamp('expires_at').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  ip_address: text('ip_address'),
  user_agent: text('user_agent'),
});

const toolAccessLogs = pgTable('tool_access_logs', {
  id: serial('id').primaryKey(),
  user_id: serial('user_id').references(() => users.id).notNull(),
  tool_name: text('tool_name').notNull(),
  tool_url: text('tool_url').notNull(),
  accessed_at: timestamp('accessed_at').defaultNow().notNull(),
  ip_address: text('ip_address'),
});

// Database connection
let db;
let storage;

if (process.env.DATABASE_URL) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle({ client: pool, schema: { users, userSessions, toolAccessLogs } });

  // Database Storage Class
  class DatabaseStorage {
    async getUser(id) {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user || undefined;
    }

    async getUserByRA(ra) {
      const [user] = await db.select().from(users).where(eq(users.ra, ra));
      return user || undefined;
    }

    async createUser(insertUser) {
      const [user] = await db
        .insert(users)
        .values({
          ra: insertUser.ra,
          password: insertUser.password,
          created_at: new Date(),
          is_active: insertUser.is_active ?? true,
          terms_accepted: insertUser.terms_accepted ?? false,
          terms_accepted_at: insertUser.terms_accepted ? new Date() : null,
        })
        .returning();
      return user;
    }

    async updateUser(id, updates) {
      const [user] = await db
        .update(users)
        .set(updates)
        .where(eq(users.id, id))
        .returning();
      return user || undefined;
    }

    async createSession(userId, ipAddress, userAgent) {
      const sessionToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const [session] = await db
        .insert(userSessions)
        .values({
          user_id: userId,
          session_token: sessionToken,
          expires_at: expiresAt,
          created_at: new Date(),
          ip_address: ipAddress,
          user_agent: userAgent,
        })
        .returning();

      return session;
    }

    async getValidSession(sessionToken) {
      const [session] = await db
        .select()
        .from(userSessions)
        .where(
          and(
            eq(userSessions.session_token, sessionToken),
            gt(userSessions.expires_at, new Date())
          )
        );
      return session || undefined;
    }

    async deleteSession(sessionToken) {
      await db
        .delete(userSessions)
        .where(eq(userSessions.session_token, sessionToken));
    }

    async deleteExpiredSessions() {
      await db
        .delete(userSessions)
        .where(and(gt(new Date(), userSessions.expires_at)));
    }

    async logToolAccess(userId, toolName, toolUrl, ipAddress) {
      const [log] = await db
        .insert(toolAccessLogs)
        .values({
          user_id: userId,
          tool_name: toolName,
          tool_url: toolUrl,
          accessed_at: new Date(),
          ip_address: ipAddress,
        })
        .returning();
      return log;
    }

    async getUserToolAccess(userId, limit = 50) {
      return await db
        .select()
        .from(toolAccessLogs)
        .where(eq(toolAccessLogs.user_id, userId))
        .orderBy(toolAccessLogs.accessed_at)
        .limit(limit);
    }
  }

  storage = new DatabaseStorage();
  console.log('✅ Database storage initialized');
} else {
  // Memory fallback storage
  class MemoryStorage {
    constructor() {
      this.users = new Map();
      this.sessions = new Map();
      this.logs = [];
      this.nextUserId = 1;
    }

    async getUserByRA(ra) {
      for (const user of this.users.values()) {
        if (user.ra === ra) return user;
      }
      return undefined;
    }

    async createUser(insertUser) {
      const user = {
        id: this.nextUserId++,
        ...insertUser,
        created_at: new Date(),
        terms_accepted_at: insertUser.terms_accepted ? new Date() : null,
      };
      this.users.set(user.id, user);
      return user;
    }

    async updateUser(id, updates) {
      const user = this.users.get(id);
      if (user) {
        Object.assign(user, updates);
        return user;
      }
      return undefined;
    }

    async createSession(userId, ipAddress, userAgent) {
      const sessionToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const session = {
        id: Date.now(),
        user_id: userId,
        session_token: sessionToken,
        expires_at: expiresAt,
        created_at: new Date(),
        ip_address: ipAddress,
        user_agent: userAgent,
      };

      this.sessions.set(sessionToken, session);
      return session;
    }

    async getValidSession(sessionToken) {
      const session = this.sessions.get(sessionToken);
      if (session && session.expires_at > new Date()) {
        return session;
      }
      return undefined;
    }

    async deleteSession(sessionToken) {
      this.sessions.delete(sessionToken);
    }

    async deleteExpiredSessions() {
      const now = new Date();
      for (const [token, session] of this.sessions.entries()) {
        if (session.expires_at <= now) {
          this.sessions.delete(token);
        }
      }
    }

    async logToolAccess(userId, toolName, toolUrl, ipAddress) {
      const log = {
        id: Date.now(),
        user_id: userId,
        tool_name: toolName,
        tool_url: toolUrl,
        accessed_at: new Date(),
        ip_address: ipAddress,
      };
      this.logs.push(log);
      return log;
    }

    async getUserToolAccess(userId, limit = 50) {
      return this.logs
        .filter(log => log.user_id === userId)
        .sort((a, b) => b.accessed_at - a.accessed_at)
        .slice(0, limit);
    }
  }

  storage = new MemoryStorage();
  console.log('⚠️ Using memory storage (no database configured)');
}

// Express app setup
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Utility function to get user from session
async function getUserFromSession(req) {
  const sessionToken = req.headers.authorization?.replace('Bearer ', '');
  if (!sessionToken) return null;

  const session = await storage.getValidSession(sessionToken);
  if (!session) return null;

  const user = await storage.getUser ? 
    await storage.getUser(session.user_id) : 
    storage.users?.get(session.user_id);
  
  return user;
}

// Authentication routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { ra, password, termsAccepted } = req.body;

    if (!ra || !password) {
      return res.status(400).json({ error: 'RA e senha são obrigatórios' });
    }

    let user = await storage.getUserByRA(ra);

    if (!user) {
      // Create new user if doesn't exist
      const hashedPassword = await bcrypt.hash(password, 10);

      try {
        user = await storage.createUser({
          ra,
          password: hashedPassword,
          is_active: true,
          terms_accepted: !!termsAccepted,
        });
        console.log(`✅ New user created: ${ra}`);
      } catch (createError) {
        console.error('Error creating user:', createError);
        return res.status(500).json({ error: 'Erro ao criar usuário' });
      }
    } else {
      // Verify password for existing user
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      // Update terms acceptance if needed
      if (termsAccepted && !user.terms_accepted) {
        try {
          await storage.updateUser(user.id, {
            terms_accepted: true,
            terms_accepted_at: new Date(),
          });
          console.log(`✅ Terms accepted for user: ${ra}`);
        } catch (updateError) {
          console.error('Error updating user terms:', updateError);
        }
      }
    }

    // Create session
    let session;
    try {
      session = await storage.createSession(user.id, req.ip, req.get('user-agent'));
      console.log(`✅ Session created for user: ${ra}`);
    } catch (sessionError) {
      console.error('Error creating session:', sessionError);
      return res.status(500).json({ error: 'Erro ao criar sessão' });
    }

    // Update last login
    try {
      await storage.updateUser(user.id, { last_login_at: new Date() });
    } catch (loginUpdateError) {
      console.error('Error updating last login:', loginUpdateError);
    }

    res.json({
      success: true,
      user: {
        ra: user.ra,
        created_at: user.created_at,
        last_login_at: new Date(),
        terms_accepted: user.terms_accepted
      },
      sessionToken: session.session_token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.post('/api/auth/logout', async (req, res) => {
  try {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '');
    if (sessionToken) {
      await storage.deleteSession(sessionToken);
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Erro ao fazer logout' });
  }
});

app.get('/api/auth/verify', async (req, res) => {
  try {
    const user = await getUserFromSession(req);
    if (!user) {
      return res.status(401).json({ error: 'Sessão inválida' });
    }

    res.json({
      success: true,
      user: {
        ra: user.ra,
        created_at: user.created_at,
        last_login_at: user.last_login_at,
        terms_accepted: user.terms_accepted
      }
    });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(401).json({ error: 'Sessão inválida' });
  }
});

// Tool access logging
app.post('/api/tools/access', async (req, res) => {
  try {
    const user = await getUserFromSession(req);
    if (!user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const { toolName, toolUrl } = req.body;
    if (!toolName || !toolUrl) {
      return res.status(400).json({ error: 'Nome e URL da ferramenta são obrigatórios' });
    }

    await storage.logToolAccess(user.id, toolName, toolUrl, req.ip);
    res.json({ success: true });
  } catch (error) {
    console.error('Tool access logging error:', error);
    res.status(500).json({ error: 'Erro ao registrar acesso' });
  }
});

// Get user's tool access history
app.get('/api/tools/history', async (req, res) => {
  try {
    const user = await getUserFromSession(req);
    if (!user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const limit = parseInt(req.query.limit) || 50;
    const history = await storage.getUserToolAccess(user.id, limit);
    res.json({ success: true, history });
  } catch (error) {
    console.error('Tool history error:', error);
    res.status(500).json({ error: 'Erro ao buscar histórico' });
  }
});

// Cleanup expired sessions periodically
setInterval(async () => {
  try {
    await storage.deleteExpiredSessions();
    console.log('🧹 Cleaned up expired sessions');
  } catch (error) {
    console.error('Error cleaning up sessions:', error);
  }
}, 60 * 60 * 1000); // Run every hour

// Serve the main application
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Zipora server running on http://0.0.0.0:${PORT}`);
  console.log(`Database: ${storage.constructor.name === 'DatabaseStorage' ? 'Connected' : 'Using fallback'}`);
});