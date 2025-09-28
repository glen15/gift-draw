# Overview

This is a lottery drawing application built with a modern full-stack JavaScript architecture. The application allows users to input a list of participants and randomly select winners, with support for preventing duplicate winners and maintaining a history of draws. The system uses session-based state management to track draws per user session and provides an interactive, animated user interface for the lottery experience.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **React with TypeScript**: Modern React application using functional components and hooks
- **Vite Build System**: Fast development server and optimized production builds
- **Tailwind CSS + shadcn/ui**: Utility-first CSS framework with a comprehensive component library
- **Framer Motion**: Animation library for smooth UI transitions and confetti effects
- **TanStack Query**: Server state management for API calls and caching
- **Wouter**: Lightweight client-side routing

## Backend Architecture
- **Express.js Server**: RESTful API server with TypeScript support
- **Session Management**: Express sessions for tracking user state without authentication
- **Modular Storage Layer**: Abstract storage interface supporting both in-memory and database implementations
- **API Design**: Clean REST endpoints for draw history and recording lottery results

## Data Storage Solutions
- **Dual Storage Strategy**: 
  - In-memory storage for development and simple deployments
  - PostgreSQL with Drizzle ORM for production persistence
- **Session-based Data**: Each user session maintains its own draw history
- **Schema Design**: Simple draw records storing winner, participants, and metadata

## State Management
- **Client State**: React hooks for component state and form management
- **Server State**: TanStack Query for API data caching and synchronization
- **Session State**: Express sessions for user-specific data persistence
- **Lottery Logic**: Stateful duplicate prevention and participant management

## External Dependencies
- **Neon Database**: Serverless PostgreSQL hosting for production data storage
- **Drizzle ORM**: Type-safe database queries and migrations
- **Radix UI**: Headless UI components for accessibility and consistency
- **Google Fonts**: Typography with Poppins font family
- **Development Tools**: Replit-specific plugins for development environment integration

## Key Design Patterns
- **Repository Pattern**: Abstract storage interface allowing multiple implementations
- **Component Composition**: Reusable UI components built with Radix primitives
- **Type Safety**: End-to-end TypeScript with shared schemas between client and server
- **Responsive Design**: Mobile-first UI with adaptive layouts
- **Real-time Feedback**: Immediate UI updates with optimistic updates and animations