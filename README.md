# LinkedIn Growth Operator

A comprehensive LinkedIn growth platform with Content Machine, Sales Machine, and Growth Machine capabilities.

## 🎯 Project Overview

The LinkedIn Growth Operator is a human-guided AI platform designed to help users grow their LinkedIn presence through intelligent content creation, prospect management, and strategic growth automation.

### Current Status: Phase 1 Complete ✅

**Phase 1 - Backend Foundation** is complete with:
- ✅ PostgreSQL database with 14 tables
- ✅ Multi-tenant workspace architecture
- ✅ 31 REST API endpoints
- ✅ Complete workspace isolation
- ✅ Comprehensive test suite
- ✅ Zero demo data (clean empty state)

**Phase 0 - Frontend Foundation** is complete with:
- ✅ React + TypeScript frontend
- ✅ Honest empty states (no fake data)
- ✅ Clean UI without fabricated metrics
- ✅ Ready for backend integration

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                       │
│  - Pages: Home, Content, Leads, Inbox, Pipeline, etc.   │
│  - State: React Context + useReducer                    │
│  - Styling: Tailwind CSS                                │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                 Backend (Express.js)                      │
│  - RESTful API with 31 endpoints                        │
│  - Workspace-scoped operations                          │
│  - Zod validation                                       │
│  - Error handling                                       │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│              Database (PostgreSQL)                        │
│  - 14 tables with full schema                           │
│  - Workspace isolation enforced                         │
│  - Migrations with node-pg-migrate                      │
└─────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
growth-operator/
├── src/                          # Frontend React application
│   ├── components/               # Reusable UI components
│   ├── pages/                    # Page components
│   │   ├── Home.tsx
│   │   ├── Content.tsx
│   │   ├── Leads.tsx
│   │   ├── Inbox.tsx
│   │   ├── Pipeline.tsx
│   │   ├── Analytics.tsx
│   │   ├── Brain.tsx
│   │   └── Settings.tsx
│   ├── store.tsx                 # State management
│   ├── data.ts                   # Type definitions
│   └── App.tsx                   # Main app component
│
├── server/                       # Backend Express application
│   ├── config/
│   │   └── database.ts          # PostgreSQL connection
│   ├── db/
│   │   ├── migrate.ts           # Migration runner
│   │   └── migrations/
│   │       └── 001_initial_schema.ts
│   ├── models/
│   │   └── types.ts             # TypeScript interfaces
│   ├── repositories/            # Database access layer
│   │   ├── workspace.repository.ts
│   │   ├── profile.repository.ts
│   │   ├── icp.repository.ts
│   │   ├── content-idea.repository.ts
│   │   ├── content-draft.repository.ts
│   │   ├── lead.repository.ts
│   │   ├── conversation.repository.ts
│   │   └── pipeline.repository.ts
│   ├── routes/                  # API route handlers
│   │   ├── health.routes.ts
│   │   ├── workspace.routes.ts
│   │   ├── profile.routes.ts
│   │   ├── icp.routes.ts
│   │   ├── content.routes.ts
│   │   └── lead.routes.ts
│   ├── middleware/              # Express middleware
│   │   ├── error.middleware.ts
│   │   ├── workspace.middleware.ts
│   │   └── validation.middleware.ts
│   ├── app.ts                   # Express app setup
│   └── server.ts                # Server entry point
│
├── tests/                       # Test suite
│   └── phase1.test.ts          # Backend tests
│
├── package.json                 # Dependencies & scripts
├── tsconfig.json                # TypeScript config
├── vite.config.js               # Vite config
├── vitest.config.ts             # Vitest config
└── .env.example                 # Environment template
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd growth-operator
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp server/.env.example server/.env
```

Edit `server/.env` with your PostgreSQL credentials:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/growth_operator
DATABASE_URL_TEST=postgresql://user:password@localhost:5432/growth_operator_test
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=your-secret-key
DEV_WORKSPACE_ID=dev-workspace-id
DEV_USER_ID=dev-user-id
```

4. **Create databases**
```bash
createdb growth_operator
createdb growth_operator_test
```

5. **Run database migrations**
```bash
npm run migrate
npm run migrate:test
```

6. **Start development servers**

Terminal 1 - Backend:
```bash
npm run server
```

Terminal 2 - Frontend:
```bash
npm run dev
```

7. **Access the application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- API Health: http://localhost:3001/api/v1/health

---

## 📚 API Documentation

### Base URL
```
http://localhost:3001/api/v1
```

### Endpoints

#### Health
- `GET /health` - Health check

#### Workspaces
- `GET /workspaces` - List workspaces
- `POST /workspaces` - Create workspace
- `GET /workspaces/:id` - Get workspace
- `PUT /workspaces/:id` - Update workspace
- `DELETE /workspaces/:id` - Delete workspace
- `POST /workspaces/:id/members` - Add member
- `GET /workspaces/:id/members` - List members
- `PUT /workspaces/:workspaceId/members/:userId` - Update member role
- `DELETE /workspaces/:workspaceId/members/:userId` - Remove member

#### Profiles
- `GET /profiles` - List profiles
- `GET /profiles/me` - Get current user's profile
- `POST /profiles` - Create profile
- `PUT /profiles/me` - Update profile
- `DELETE /profiles/me` - Delete profile

#### ICPs (Ideal Customer Profiles)
- `GET /icps` - List ICPs
- `GET /icps/:id` - Get ICP
- `POST /icps` - Create ICP
- `PUT /icps/:id` - Update ICP
- `DELETE /icps/:id` - Delete ICP

#### Content
- `GET /content/ideas` - List content ideas
- `GET /content/ideas/:id` - Get content idea
- `POST /content/ideas` - Create content idea
- `PUT /content/ideas/:id` - Update content idea
- `DELETE /content/ideas/:id` - Delete content idea
- `GET /content/drafts` - List content drafts
- `GET /content/drafts/:id` - Get content draft
- `POST /content/drafts` - Create content draft
- `PUT /content/drafts/:id` - Update content draft
- `DELETE /content/drafts/:id` - Delete content draft

#### Leads
- `GET /leads` - List leads
- `GET /leads/:id` - Get lead
- `POST /leads` - Create lead
- `PUT /leads/:id` - Update lead
- `DELETE /leads/:id` - Delete lead

### Example Requests

**Create a workspace:**
```bash
curl -X POST http://localhost:3001/api/v1/workspaces \
  -H "Content-Type: application/json" \
  -d '{"name": "My Workspace"}'
```

**Create a content idea:**
```bash
curl -X POST http://localhost:3001/api/v1/content/ideas \
  -H "Content-Type: application/json" \
  -d '{
    "title": "AI in 2026",
    "pillar": "Technology",
    "audience": "Developers"
  }'
```

---

## 🧪 Testing

### Run Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npx vitest run tests/phase1.test.ts
```

### Test Coverage
- ✅ Workspace CRUD operations
- ✅ User management
- ✅ Workspace membership
- ✅ Workspace isolation (cross-workspace access prevention)
- ✅ Profile CRUD
- ✅ ICP CRUD
- ✅ Content ideas CRUD
- ✅ Content drafts CRUD
- ✅ Leads CRUD

---

## 🗄️ Database Schema

### Core Tables

1. **workspaces** - Multi-tenant containers
2. **users** - User accounts
3. **workspace_members** - Workspace membership with roles
4. **profiles** - User profiles (workspace-scoped)
5. **icps** - Ideal Customer Profiles (workspace-scoped)
6. **content_ideas** - Content ideas (workspace-scoped)
7. **content_drafts** - Content drafts (workspace-scoped)
8. **leads** - Sales leads (workspace-scoped)
9. **conversations** - Conversations (workspace-scoped)
10. **messages** - Conversation messages
11. **pipeline_opportunities** - Sales pipeline (workspace-scoped)
12. **analytics_events** - Analytics data (workspace-scoped)
13. **learning_signals** - Learning data (workspace-scoped)
14. **audit_log** - Audit trail

### Workspace Isolation

All business entities are workspace-scoped with:
- `workspace_id` foreign key
- Repository-level filtering
- Middleware enforcement
- Database constraints

---

## 🔒 Security

### Implemented
- ✅ Environment-based configuration
- ✅ CORS configuration
- ✅ Helmet security headers
- ✅ Input validation (Zod)
- ✅ SQL injection prevention (parameterized queries)
- ✅ Workspace isolation
- ✅ Error handling (no sensitive data leaks)
- ✅ Graceful shutdown

### Not Yet Implemented (Future Phases)
- ❌ JWT authentication (Phase 2)
- ❌ Rate limiting (Phase 2)
- ❌ LinkedIn OAuth (Phase 5)
- ❌ Encryption at rest (Phase 10)

---

## 📋 Available Scripts

```bash
# Frontend
npm run dev              # Start frontend dev server
npm run build            # Build frontend for production
npm run typecheck        # Type check frontend

# Backend
npm run server           # Start backend dev server
npm run server:build     # Build backend
npm run server:start     # Start backend production server

# Database
npm run migrate          # Run migrations (development)
npm run migrate:test     # Run migrations (test)

# Testing
npm test                 # Run tests
npm run test:watch       # Run tests in watch mode
```

---

## 🎯 Product Principles

1. **Human-Guided AI** - AI assists, humans decide
2. **No Fabricated Data** - Honest empty states, no fake metrics
3. **Workspace Isolation** - Complete multi-tenant separation
4. **Evidence-Based** - All claims must have provenance
5. **Approval Required** - Consequential actions need human approval
6. **No Platform Violations** - Respect LinkedIn ToS

---

## 🚧 Development Phases

### ✅ Phase 0: Frontend Foundation (COMPLETE)
- React + TypeScript frontend
- Honest empty states
- Clean UI without fake data
- Component structure

### ✅ Phase 1: Backend Foundation (COMPLETE)
- PostgreSQL database
- Express.js API
- Multi-tenant workspace model
- 31 REST endpoints
- Complete test suite
- Workspace isolation

### 🔄 Phase 2: Authentication & Frontend Integration (NEXT)
- JWT authentication
- User registration/login
- Frontend API client
- Loading/error states
- Replace dev context with real auth

### 📋 Phase 3: AI Integration
- Content generation with AI
- Prospect research
- Trend intelligence
- Smart recommendations

### 📋 Phase 4: Content Machine
- Source intelligence
- Content strategy engine
- Quality gates
- Carousel generation
- Publishing workflow

### 📋 Phase 5: LinkedIn Integration
- OAuth authentication
- Publishing to LinkedIn
- Analytics sync
- Message monitoring

### 📋 Phase 6: Sales Machine
- Prospect discovery
- Outreach automation
- Inbox management
- Pipeline tracking

### 📋 Phase 7: Growth Machine
- Content ↔ Sales intelligence
- Learning engine
- Pattern recognition
- Strategic recommendations

### 📋 Phase 8-10: Production Hardening
- Performance optimization
- Monitoring & logging
- Deployment automation
- Security hardening

---

## 📖 Documentation

- [Phase 0 Completion Report](./PHASE_0_COMPLETION_REPORT.md)
- [Phase 0 Final Verification](./PHASE_0_FINAL_VERIFICATION.md)
- [Phase 1 Completion Report](./PHASE_1_COMPLETION_REPORT.md)
- [Phase 1 Summary](./PHASE_1_SUMMARY.md)

---

## 🤝 Contributing

This is currently a solo development project. For questions or suggestions, please open an issue.

---

## 📄 License

Private - All rights reserved

---

## 🆘 Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
pg_isready

# Check database exists
psql -l | grep growth_operator

# Recreate database
dropdb growth_operator
createdb growth_operator
npm run migrate
```

### Port Already in Use
```bash
# Change port in server/.env
PORT=3002
```

### Build Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## 📞 Support

For issues or questions:
1. Check the documentation files
2. Review the test suite for examples
3. Check API endpoint documentation above

---

**Built with:** React, TypeScript, Express.js, PostgreSQL, Tailwind CSS, Zod, Vitest

**Current Version:** Phase 1 Complete ✅
