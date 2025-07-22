# Zipora - Ferramentas Educacionais

## Overview

Zipora is a Brazilian educational tools discovery platform built as a single-page web application with authentication system. The project provides an interactive interface for users to search and explore educational tools with real-time filtering capabilities, multiple theme support (dark as default), and a responsive design optimized for Brazilian users.

## User Preferences

Preferred communication style: Simple, everyday language.
Website name: Zipora (changed from "Ferramentas Educacionais BR")
Default theme: Dark theme (changed from light theme)
Project structure: Compact architecture with minimal files (updated 2025-07-22)
Storage preference: Database with memory fallback (consolidated into single server file)
Theme expansion: Multiple theme varieties with animations and accessibility options

## System Architecture

### Consolidated Structure (Updated 2025-07-22)
The project has been simplified into a compact structure with minimal files:

#### Core Files:
- **server.js**: Single consolidated server file containing all backend logic including Express setup, database schema, storage classes, authentication, and API routes
- **index.html**: Main application HTML structure
- **script.js**: Complete frontend JavaScript handling authentication, themes, search functionality, and UI interactions
- **styles.css**: All CSS styles including theme variables, responsive design, and animations
- **assets/**: Static assets like icons and sounds

### Architecture Features
- **Database Flexibility**: Automatic fallback from PostgreSQL to in-memory storage
- **Unified Authentication**: Complete user management with session handling in single server file
- **Multi-theme Support**: CSS variables-based theming system (dark, light, cloudy)
- **Responsive Design**: Mobile-first approach with CSS Grid and Flexbox
- **Session Management**: Secure token-based authentication with automatic cleanup

## Key Components

### Theme System
- **Multi-theme Support**: Eight distinct themes (light, dark, cloudy, ocean, forest, purple, sunset, rose) with CSS custom properties
- **Advanced Settings System**: Comprehensive configuration modal with theme selection, animations, and accessibility options
- **Theme Manager Class**: Handles theme switching, persistence, and UI updates
- **Dynamic CSS Variables**: Seamless theme transitions using CSS custom properties
- **Animation Controls**: Toggleable animations with accessibility considerations

### Search and Filtering
- **Real-time Search**: Instant filtering as users type in the search input
- **Case-insensitive Matching**: Robust search functionality that matches tool names and descriptions
- **Clear Search Functionality**: Easy reset of search terms with visual feedback

### User Interface
- **Card-based Layout**: Tools displayed in responsive grid cards with hover effects
- **Loading States**: Visual feedback during data loading operations
- **Toast Notifications**: User feedback system for actions and errors
- **Accessibility Features**: Keyboard navigation, ARIA labels, and semantic HTML

## Data Flow

1. **Initialization**: App loads and initializes DOM references and theme system
2. **Data Loading**: Tools data is loaded (currently prepared for external API integration)
3. **State Updates**: User interactions update centralized state
4. **UI Rendering**: State changes trigger re-rendering of affected UI components
5. **Persistence**: Theme preferences and other settings saved to localStorage

## External Dependencies

### CDN Resources
- **Font Awesome 6.0.0**: Icon library for UI elements and visual indicators
- **Google Fonts (Inter)**: Typography system for consistent text rendering
- **Base64 Favicon**: Embedded favicon for branding

### Node.js Dependencies
- **Express.js**: Web server framework for API endpoints
- **Drizzle ORM**: TypeScript-first ORM for PostgreSQL database operations
- **@neondatabase/serverless**: PostgreSQL client for serverless environments
- **CORS**: Cross-origin resource sharing middleware
- **dotenv**: Environment variable management

### Database
- **PostgreSQL**: Primary database for persistent storage
- **Tables**: users, user_sessions, tool_access_logs with proper relations and indexes

### Browser APIs
- **Fetch API**: For communication with backend APIs
- **localStorage**: Fallback for client-side data persistence
- **DOM APIs**: For dynamic content manipulation and event handling
- **CSS Custom Properties**: For theme system implementation

## Deployment Strategy

### Static Hosting Ready
- **No Build Process**: Direct deployment of HTML, CSS, and JavaScript files
- **CDN Optimized**: External resources loaded from CDNs for performance
- **Progressive Enhancement**: Core functionality works in all modern browsers

### Performance Considerations
- **Lightweight Bundle**: Minimal JavaScript footprint with no framework dependencies
- **CSS Optimization**: Efficient use of custom properties for theme switching
- **Lazy Loading Ready**: Structure prepared for future image and content lazy loading

### Browser Compatibility
- **Modern Browser Support**: ES6+ features used with graceful degradation
- **Responsive Design**: Mobile-first approach ensuring cross-device compatibility
- **Accessibility Compliance**: Semantic HTML and ARIA attributes for screen readers

The architecture prioritizes simplicity, performance, and user experience while maintaining extensibility for future enhancements such as backend integration, user accounts, and advanced filtering capabilities.