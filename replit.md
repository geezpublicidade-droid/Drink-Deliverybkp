# Vibe Drinks - Premium Beverage Delivery Platform

## Overview

Vibe Drinks is a fullstack premium beverage delivery application inspired by iFood's organizational structure with luxury aesthetics. The platform features a black, gold, and yellow color scheme targeting high-end beverage delivery. The system supports multiple user roles (customers, admin, kitchen staff, and delivery drivers) with real-time order tracking and management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React 18 with TypeScript for type safety
- Wouter for lightweight client-side routing
- TanStack Query (React Query) for server state management
- Shadcn UI components with Radix UI primitives
- Tailwind CSS for styling with custom design system

**Design System:**
- Primary colors: Black (#000000), Gold (#FFD700), Yellow (#FFC400), White (#FFFFFF)
- Typography: Playfair Display (serif headings), Inter (body text)
- Premium aesthetic with gold glow effects and luxury branding
- Responsive layouts optimized for mobile-first approach

**State Management:**
- AuthContext for user authentication and session persistence
- CartContext for shopping cart with combo discount detection (15% off for destilado + gelo + energetico bundles)
- React Query for server state caching and synchronization
- LocalStorage for client-side persistence

**Key Pages:**
- Home: Hero video section, banner carousel, category carousel, product grid
- Login/AdminLogin: WhatsApp-based customer auth, username/password for staff
- Checkout: Address selection, payment method, order creation
- Orders: Customer order tracking with status badges
- Kitchen: Order preparation dashboard for kitchen staff
- Motoboy: Delivery driver interface with order assignments
- Admin Dashboard: Management interface (referenced but not implemented in provided files)

### Backend Architecture

**Technology Stack:**
- Express.js for HTTP server
- Node.js with TypeScript
- Drizzle ORM for database operations
- PostgreSQL as primary database

**API Structure:**
- RESTful API with Express routes
- In-memory storage implementation (ready for database migration)
- Session-based authentication pattern
- API endpoints follow `/api/*` convention

**Core API Routes:**
- `/api/users` - User CRUD operations
- `/api/auth/login` - Multi-role authentication
- `/api/auth/whatsapp` - WhatsApp-based customer registration
- `/api/products` - Product catalog management
- `/api/categories` - Category management
- `/api/orders` - Order lifecycle management
- `/api/banners` - Promotional banner management

**Data Models:**
- Users (customers, admin, kitchen, motoboy roles)
- Addresses (delivery locations linked to users)
- Categories (product categorization with icons)
- Products (inventory with stock tracking, cost/profit margins)
- Orders (with status workflow: pending → accepted → preparing → ready → dispatched → delivered)
- OrderItems (line items for orders)
- Banners (promotional carousel content)
- Motoboys (delivery driver profiles)
- StockLog (inventory history tracking)
- Settings (system configuration like delivery rates)

**Business Logic:**
- Combo detection: Automatically applies 15% discount when cart contains destilado + gelo + energetico
- Dynamic delivery fee calculation: Base rate per km with minimum fee threshold
- Order status workflow management with role-based state transitions
- Stock management with deduction on order placement

### Data Storage Solutions

**Primary Database:**
- PostgreSQL configured via Drizzle ORM
- Schema-first approach with TypeScript type generation
- Migration management through `drizzle-kit`

**Database Schema Highlights:**
- UUID-based primary keys for all entities
- Foreign key relationships enforcing referential integrity
- Timestamp tracking for order lifecycle
- JSONB fields for flexible metadata storage
- Boolean flags for soft features (isActive, isBlocked, isDefault)

**Storage Strategy:**
- Server uses in-memory storage implementation as abstraction layer
- Ready for database persistence through IStorage interface
- Supports future migration to PostgreSQL without API changes

### Authentication & Authorization

**Authentication Mechanism:**
- Customer: WhatsApp-based registration and login (no password required)
- Staff (admin/kitchen/motoboy): Username and password authentication
- Session persistence via localStorage on client-side
- Role-based access control with four user types

**Authorization Pattern:**
- Role stored in user object and AuthContext
- Frontend route protection based on user role
- Backend endpoints check user role for sensitive operations
- Separate login flows for customers vs. staff

**Security Considerations:**
- Passwords stored in plain text (development phase - needs bcrypt implementation)
- No JWT implementation - relies on session storage
- CORS not explicitly configured
- Rate limiting not implemented

### External Dependencies

**Supabase Integration:**
- Supabase Storage for media files:
  - Product images
  - Category icons (3D/Creughar style)
  - Promotional banners
  - Hero background videos
  - Motoboy profile photos
- Storage buckets organized by content type
- Public URL generation helper functions
- Admin SDK for server-side operations
- Client SDK for frontend access

**Third-Party UI Libraries:**
- Radix UI for accessible component primitives (dialogs, dropdowns, tooltips, etc.)
- Shadcn UI as component system built on Radix
- Embla Carousel for banner/category carousels
- Lucide React for icon system

**Development Tools:**
- Vite for build tooling and HMR
- ESBuild for server bundling
- TypeScript compiler for type checking
- Replit-specific plugins (dev banner, cartographer, runtime error overlay)

**Payment Processing:**
- PIX payment method (Brazilian instant payment)
- Cash on delivery
- Card via POS machine
- No payment gateway integration implemented

**Communication:**
- WhatsApp-based customer identification (phone number as primary key)
- No email service integration
- No SMS notifications

**Monitoring & Analytics:**
- Console-based logging with timestamps
- No APM or error tracking service
- No analytics integration

**Missing Infrastructure:**
- Redis (mentioned in requirements but not implemented)
- Realtime synchronization (Supabase Realtime mentioned but not implemented)
- WebSocket connections not configured
- Background job processing
- Email/SMS notification services
- Payment gateway integration
- CDN for static assets