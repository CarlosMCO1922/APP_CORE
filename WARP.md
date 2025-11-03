# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project overview
- Monorepo with two apps:
  - backend/: Express + Sequelize API (SQLite in dev, Postgres in prod).
  - frontend/: React (Create React App) UI with contexts, routing, and Stripe.

Common commands
- Install dependencies
  - Backend: cd backend && npm install
  - Frontend: cd frontend && npm install
- Run in development
  - Backend (defaults PORT=3001): cd backend && npm start
  - Frontend (defaults PORT=3000): cd frontend && npm start
- Build
  - Frontend: cd frontend && npm run build
- Tests
  - Frontend (all tests, non-watch): cd frontend && npm test -- --watchAll=false
  - Frontend (single test): cd frontend && npm test -- App.test.js -t "pattern"
  - Backend: no tests configured (scripts.test echoes placeholder)
- Lint
  - No dedicated lint npm script. CRA uses ESLint via react-scripts with the config in frontend/package.json.

Environment configuration
- Backend (required/used):
  - JWT_SECRET (required for auth)
  - STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET (Stripe payments/webhooks)
  - DATABASE_URL (Postgres in production; SSL required is already configured)
  - PORT (optional, defaults to 3001)
  - Dev DB is SQLite at backend/database/core.sqlite and is auto-created/synced
- Frontend:
  - REACT_APP_API_URL (defaults to http://localhost:3001; note frontend also has a proxy to 3001)
  - REACT_APP_STRIPE_PUBLISHABLE_KEY (required for Stripe Elements)
- Run frontend and backend in separate terminals for local development.

High-level architecture and structure
- Backend
  - Entry: backend/server.js
    - Loads env, enables CORS, sets JSON/urlencoded parsers, mounts routes per resource.
    - Uses route-level express.json() to avoid interfering with Stripe webhook (which needs express.raw()).
    - Starts Express server and initializes Sequelize: dev uses SQLite; production uses Postgres via DATABASE_URL with SSL.
  - Routing and controllers
    - Routes under backend/routes map to controllers under backend/controllers.
      - Examples: authRoutes → authController; paymentRoutes → paymentController; users/trainings/appointments/staff/etc. follow the same pattern.
    - Middleware: backend/middleware/
      - authMiddleware: protect requests with JWT and enforce role-based access (roles: user, admin, trainer, physiotherapist, employee). Populates req.authContext and attaches req.user/req.staff.
      - errorHandler: notFound and error handling middlewares mounted last.
  - ORM and data layer
    - Config: backend/config/database.js selects SQLite (dev) or Postgres (prod). Sequelize instance exported and consumed by models.
    - Models: backend/models/*.js with associations loaded in backend/models/index.js.
      - Notable models and relations:
        - User: fields include isAdmin and password reset fields; belongsToMany Training; hasMany Appointment, TrainingWaitlist, ClientExercisePerformance.
        - Staff: role-based staff accounts; hasMany Training (as instructor) and Appointment (as professional).
        - Appointment: belongsTo User (as client) and Staff (as professional); tracks status, signalPaid, totalCost.
        - Payment: belongsTo User (as client) and Staff (as registeredBy); category/status enums; optional relatedResource* to link to domain entities (e.g., appointments).
  - Payments and Stripe flow
    - paymentRoutes mount at /payments. Admin endpoints manage payments; client endpoints create Stripe PaymentIntents.
    - Stripe webhook: POST /payments/stripe-webhook uses express.raw({ type: 'application/json' }). Handler validates signature with STRIPE_WEBHOOK_SECRET, updates Payment status to 'pago', and, when applicable, marks related Appointment as confirmed and emits notifications.
  - Utilities
    - utils/passwordUtils.js: bcrypt hashing/compare.
    - utils/tokenUtils.js: JWT sign/verify using JWT_SECRET.

- Frontend
  - Stack: React (react-scripts), React Router, styled-components, Stripe Elements, Recharts, date-fns.
  - Entry: frontend/src/index.js initializes providers and wraps App in Stripe <Elements> using REACT_APP_STRIPE_PUBLISHABLE_KEY.
  - App structure: frontend/src/App.js defines routes with a ProtectedRoute component that checks authState.role and gates client vs staff/admin pages.
  - State and services
    - Contexts: frontend/src/context/ (AuthContext persists token/user in localStorage and derives role; ThemeContext; WorkoutContext; NotificationContext).
    - API services: frontend/src/services/*Service.js call the backend at REACT_APP_API_URL (default http://localhost:3001). Note: a CRA proxy also points to 3001, but services use absolute URLs.
  - UI: pages/* and components/* implement dashboards, calendars, payments, workouts, etc. Avoids exhaustive listing; discover via file tree.

Operational notes and gotchas
- Stripe webhook requires raw request body. Keep body parsers on other routes and do not apply express.json() globally before the webhook route. Current server.js already scopes parsers correctly.
- Role model: backend issues JWTs for both users and staff; frontend’s ProtectedRoute enforces allowedRoles. When adding routes, wire them through authMiddleware and update the frontend routing accordingly.
- CORS origin in server.js currently includes a specific production frontend URL. For local dev, backend also accepts requests by default when using REACT_APP_API_URL/http://localhost:3001.
- Database sync: server runs sequelize.sync({ alter: true }). In dev, this will evolve the SQLite schema automatically; in production with Postgres, prefer controlled migrations if introduced in the future.
