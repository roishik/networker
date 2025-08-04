# Networker - Contact Management Application

## Overview

Networker is a smart contact management application designed for founders and professionals to efficiently track and manage their network connections. The application allows users to log interactions with contacts through natural language notes, which are automatically parsed to extract and organize contact information.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend is built using **React** with **TypeScript** and follows a modern component-based architecture:

- **Routing**: Uses `wouter` for lightweight client-side routing
- **State Management**: Leverages React Query (`@tanstack/react-query`) for server state management and caching
- **UI Framework**: Built with shadcn/ui components based on Radix UI primitives
- **Styling**: Uses Tailwind CSS with CSS custom properties for theming
- **Build Tool**: Vite for fast development and optimized production builds

The application follows a page-based routing structure with components organized in a clear hierarchy under `client/src/`.

### Backend Architecture

The backend is implemented as an **Express.js** server with TypeScript:

- **Runtime**: Node.js with ES modules
- **Framework**: Express.js for HTTP server and API routes
- **Development**: Uses `tsx` for TypeScript execution in development
- **Production**: Builds to plain JavaScript using esbuild

The server handles API routes, authentication, and serves the static frontend in production.

### Data Storage Solutions

The application uses **Replit's built-in PostgreSQL** database with **Drizzle ORM**:

- **Database**: Replit PostgreSQL (transitioned from Supabase for reliability)
- **ORM**: Drizzle ORM for type-safe database operations
- **Migrations**: Drizzle Kit for schema management (`npm run db:push`)
- **Schema**: Centralized schema definitions in `shared/schema.ts`
- **User Isolation**: Strict user-based data separation to prevent data leakage

The storage layer uses a `DatabaseStorage` implementation with proper user isolation for all operations.

## Key Components

### Authentication System

- **Method**: Replit OAuth integration using OpenID Connect
- **Session Management**: PostgreSQL-based session storage with connect-pg-simple
- **Authorization**: JWT-based authentication with refresh token support
- **User Management**: Automatic user provisioning and profile sync with Replit accounts

### Contact Management

- **Contact Model**: Supports both Hebrew and English names, company, job title, and tags
- **Interaction Tracking**: Free-form notes with automatic date stamping
- **Relationship Mapping**: Edges system for tracking introductions and company connections

### Text Parsing Engine

- **Natural Language Processing**: Automatic extraction of contact details from free-text notes using enhanced regex patterns
- **AI-Powered Extraction**: ChatGPT 4o mini integration for intelligent field extraction when auto-parsing needs improvement
- **Dynamic Field Creation**: AI can extract additional fields like family information, follow-up dates, and contextual tags
- **Dual Parsing Options**: Users can switch between auto-parse and AI extraction for optimal results
- **Duplicate Detection**: Identifies potential duplicate contacts during creation
- **Smart Updates**: Can either create new contacts or update existing ones based on parsed information

### Network Visualization

- **Mini Graph Component**: Displays relationship connections for each contact
- **Connection Types**: Supports "introduced_by" and "same_company" relationship types

## Data Flow

1. **User Input**: Users enter free-text notes about contacts through the add-note interface
2. **Text Parsing**: Server-side parsing extracts structured data (names, companies, job titles, etc.)
3. **Duplicate Detection**: System checks for existing similar contacts
4. **Contact Creation/Update**: Based on parsing results, either creates new contact or updates existing
5. **Relationship Building**: Automatically creates edges between contacts based on mentioned connections
6. **Real-time Updates**: React Query manages cache invalidation and re-fetching

## External Dependencies

### Frontend Dependencies

- **UI Components**: Extensive use of Radix UI primitives for accessible components
- **Styling**: Tailwind CSS with class-variance-authority for component variants
- **Icons**: Font Awesome icons (loaded via CDN)
- **Date Handling**: date-fns library for date formatting and manipulation

### Backend Dependencies

- **Database**: @neondatabase/serverless for PostgreSQL connection
- **Validation**: Zod for runtime type validation and drizzle-zod for schema validation
- **Session Storage**: connect-pg-simple for PostgreSQL-based session storage (configured but not actively used)

## Deployment Strategy

### Development Environment

- **Frontend**: Vite dev server with HMR (Hot Module Replacement)
- **Backend**: tsx for running TypeScript directly with auto-restart
- **Database**: Requires PostgreSQL connection via DATABASE_URL environment variable

### Production Build

- **Frontend**: Vite builds optimized static assets to `dist/public/`
- **Backend**: esbuild compiles TypeScript to ESM format in `dist/`
- **Deployment**: Single Node.js process serves both API and static assets
- **Database**: Uses Drizzle migrations for schema deployment

### Environment Configuration

- **Development**: NODE_ENV=development enables Vite integration and development features
- **Production**: NODE_ENV=production serves pre-built static assets
- **Database**: Requires DATABASE_URL for PostgreSQL connection
- **Replit Integration**: Special handling for Replit development environment with cartographer plugin

The application is designed as a monorepo with shared types and schemas between frontend and backend, ensuring type safety across the entire stack.