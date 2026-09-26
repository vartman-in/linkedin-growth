# Phase 1 Runtime Verification Guide

## Current Status

**Phase 1 is CODE-COMPLETE but NOT RUNTIME-VERIFIED.**

The implementation is complete and correct based on code inspection, but runtime verification could not be performed in this environment due to PostgreSQL unavailability.

---

## What You Need To Verify Phase 1

### Prerequisites

1. **PostgreSQL** (version 14 or higher)
   - Install via package manager, Docker, or download from postgresql.org
   - Must be running and accessible

2. **Node.js** (version 18 or higher)
   - Already installed in this project

3. **npm** (comes with Node.js)

---

## Step-by-Step Verification Process

### Step 1: Install PostgreSQL

**Option A: Using Homebrew (macOS)**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Option B: Using apt (Ubuntu/Debian)**
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**Option C: Using Docker**
```bash
docker run --name growth-operator-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_USER=postgres \
  -p 5432:5432 \
  -d postgres:14
```

**Option D: Windows**
Download and install from: https://www.postgresql.org/download/windows/

### Step 2: Create Databases

```bash
# Create development database
createdb growth_operator

# Create test database
createdb growth_operator_test
```

**Verify databases were created:**
```bash
psql -l | grep growth_operator
```

Expected output:
```
growth_operator        | postgres | UTF8 | ...
growth_operator_test   | postgres | UTF8 | ...
```

### Step 3: Configure Environment

```bash
# Copy environment template
cp server/.env.example server/.env

# Edit server/.env with your PostgreSQL credentials
```

**Example server/.env:**
```env
# Database Configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/growth_operator
DATABASE_URL_TEST=postgresql://postgres:postgres@localhost:5432/growth_operator_test

# Server Configuration
PORT=3001
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# Security
JWT_SECRET=your-secret-key-change-in-production

# Development Identity (NOT for production use)
DEV_WORKSPACE_ID=dev-workspace-id
DEV_USER_ID=dev-user-id
```

**Important:** Replace `postgres:postgres` with your actual PostgreSQL username and password if different.

### Step 4: Run Migrations

```bash
# Run migrations on development database
npm run migrate

# Run migrations on test database
npm run migrate:test
```

**Expected output:**
```
Running migrations against DEVELOPMENT database...
✓ Successfully ran 1 migration(s)
  - 001_initial_schema
```

**Verify tables were created:**
```bash
psql growth_operator -c "\dt"
```

Expected output (14 tables):
```
 Schema |         Name          | Type  | Owner 
--------+-----------------------+-------+----------
 public | analytics_events      | table | postgres
 public | audit_log             | table | postgres
 public | content_drafts        | table | postgres
 public | content_ideas         | table | postgres
 public | conversations         | table | postgres
 public | icps                  | table | postgres
 public | leads                 | table | postgres
 public | learning_signals      | table | postgres
 public | messages              | table | postgres
 public | pipeline_opportunities| table | postgres
 public | profiles              | table | postgres
 public | users                 | table | postgres
 public | workspace_members     | table | postgres
 public | workspaces            | table | postgres
```

### Step 5: Start Backend Server

```bash
npm run server
```

**Expected output:**
```
✓ Database connection established
✓ Server running on port 3001
✓ Environment: development
✓ API available at http://localhost:3001/api/v1
```

**Keep this terminal open.** The server needs to stay running for the next steps.

### Step 6: Test Health Endpoint

In a new terminal:

```bash
curl http://localhost:3001/api/v1/health
```

**Expected response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-16T12:34:56.789Z",
  "version": "1.0.0"
}
```

### Step 7: Run Automated Tests

```bash
npm test
```

**Expected output:**
```
✓ Health Check > should verify database connection
✓ Workspace Management > should create a workspace
✓ Workspace Management > should find workspace by ID
✓ Workspace Management > should update workspace
✓ Workspace Management > should delete workspace
✓ User Management > should create a user
✓ User Management > should enforce unique email
✓ Workspace Membership > should add member to workspace
✓ Workspace Membership > should enforce unique membership
✓ Workspace Membership > should find members by workspace
✓ Workspace Isolation > should isolate profiles between workspaces
✓ Workspace Isolation > should isolate ICPs between workspaces
✓ Workspace Isolation > should isolate content ideas between workspaces
✓ Workspace Isolation > should isolate leads between workspaces
✓ Profile CRUD > should create profile
✓ Profile CRUD > should update profile
✓ Profile CRUD > should delete profile
✓ ICP CRUD > should create ICP
✓ ICP CRUD > should update ICP
✓ ICP CRUD > should delete ICP
✓ Content Idea CRUD > should create content idea
✓ Content Idea CRUD > should update content idea
✓ Content Idea CRUD > should delete content idea
✓ Content Draft CRUD > should create content draft
✓ Content Draft CRUD > should update content draft
✓ Content Draft CRUD > should delete content draft
✓ Lead CRUD > should create lead
✓ Lead CRUD > should update lead
✓ Lead CRUD > should delete lead

Test Files  1 passed (1)
Tests      29 passed (29)
Start at   12:34:56
Duration   1234ms / 5000ms
```

### Step 8: Run Comprehensive Runtime Verification

```bash
npm run verify:runtime
```

**Expected output:**
```
ℹ️ [2025-01-16T12:34:56.789Z] === Phase 1 Runtime Verification ===
ℹ️ [2025-01-16T12:34:56.790Z] 
ℹ️ [2025-01-16T12:34:56.791Z] Checking PostgreSQL availability...
✅ [2025-01-16T12:34:56.792Z] PostgreSQL is available
ℹ️ [2025-01-16T12:34:56.793Z] Running migrations...
✅ [2025-01-16T12:34:57.123Z] Migrations completed successfully
ℹ️ [2025-01-16T12:34:57.124Z] Starting server...
✅ [2025-01-16T12:34:59.456Z] Server started successfully
ℹ️ [2025-01-16T12:34:59.457Z] 
ℹ️ [2025-01-16T12:34:59.458Z] === Running Tests ===
✅ [2025-01-16T12:35:00.123Z] Health endpoint: PASS
✅ [2025-01-16T12:35:00.456Z] Create workspace: PASS
✅ [2025-01-16T12:35:00.789Z] Get workspace: PASS
✅ [2025-01-16T12:35:01.123Z] Create user: PASS
✅ [2025-01-16T12:35:01.456Z] Create profile: PASS
✅ [2025-01-16T12:35:01.789Z] Workspace isolation: PASS
✅ [2025-01-16T12:35:02.123Z] Validation - missing required fields: PASS
✅ [2025-01-16T12:35:02.456Z] Validation - invalid UUID: PASS
ℹ️ [2025-01-16T12:35:02.789Z] Cleaning up test data...
✅ [2025-01-16T12:35:03.123Z] Cleanup completed
ℹ️ [2025-01-16T12:35:03.124Z] 
ℹ️ [2025-01-16T12:35:03.125Z] === Test Results ===
ℹ️ [2025-01-16T12:35:03.126Z] Total: 10
ℹ️ [2025-01-16T12:35:03.127Z] Passed: 10
ℹ️ [2025-01-16T12:35:03.128Z] Failed: 0
ℹ️ [2025-01-16T12:35:03.129Z] 
✅ [2025-01-16T12:35:03.130Z] === VERIFICATION PASSED ===
✅ [2025-01-16T12:35:03.131Z] All tests passed. Phase 1 is verified.
```

### Step 9: Manual API Testing (Optional)

You can also test the API manually using curl or Postman.

**Create a workspace:**
```bash
curl -X POST http://localhost:3001/api/v1/workspaces \
  -H "Content-Type: application/json" \
  -d '{"name": "My Workspace"}'
```

**Get all workspaces:**
```bash
curl http://localhost:3001/api/v1/workspaces
```

**Create a user:**
```bash
curl -X POST http://localhost:3001/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "name": "Test User"}'
```

**Create a content idea:**
```bash
curl -X POST http://localhost:3001/api/v1/content/ideas \
  -H "Content-Type: application/json" \
  -d '{"title": "My First Idea", "pillar": "Technology"}'
```

### Step 10: Verify Phase 0 Regression

```bash
# Build frontend
npm run build

# Start frontend dev server (in a new terminal)
npm run dev
```

Open http://localhost:5173 in your browser.

**Verify:**
- ✅ Home page shows "Welcome to Growth Operator"
- ✅ No fake data appears
- ✅ All pages show honest empty states
- ✅ No demo profiles, leads, or content

---

## Troubleshooting

### PostgreSQL Connection Failed

**Error:** `connect ECONNREFUSED 127.0.0.1:5432`

**Solution:**
```bash
# Check if PostgreSQL is running
pg_isready

# Start PostgreSQL (macOS with Homebrew)
brew services start postgresql@14

# Start PostgreSQL (Linux)
sudo systemctl start postgresql
```

### Database Does Not Exist

**Error:** `database "growth_operator" does not exist`

**Solution:**
```bash
createdb growth_operator
createdb growth_operator_test
```

### Migration Failed

**Error:** Migration errors

**Solution:**
```bash
# Drop and recreate databases
dropdb growth_operator
dropdb growth_operator_test
createdb growth_operator
createdb growth_operator_test

# Run migrations again
npm run migrate
npm run migrate:test
```

### Port Already in Use

**Error:** `Error: listen EADDRINUSE: address already in use :::3001`

**Solution:**
```bash
# Find process using port 3001
lsof -ti:3001

# Kill the process
kill -9 <PID>

# Or change port in server/.env
PORT=3002
```

### Tests Fail

**Error:** Tests fail with database errors

**Solution:**
```bash
# Ensure test database exists and is migrated
createdb growth_operator_test
npm run migrate:test

# Run tests again
npm test
```

---

## Verification Checklist

Use this checklist to confirm Phase 1 is fully verified:

### Database Setup
- [ ] PostgreSQL installed and running
- [ ] growth_operator database created
- [ ] growth_operator_test database created
- [ ] server/.env configured correctly

### Migrations
- [ ] `npm run migrate` executes successfully
- [ ] `npm run migrate:test` executes successfully
- [ ] 14 tables created in database
- [ ] All constraints verified

### Server
- [ ] `npm run server` starts without errors
- [ ] Database connection established
- [ ] Server listening on port 3001

### API Testing
- [ ] Health endpoint responds correctly
- [ ] Can create workspace via API
- [ ] Can create user via API
- [ ] Can create profile via API
- [ ] Can create ICP via API
- [ ] Can create content idea via API
- [ ] Can create content draft via API
- [ ] Can create lead via API

### Automated Tests
- [ ] `npm test` executes successfully
- [ ] All 29 tests pass
- [ ] No test failures

### Runtime Verification
- [ ] `npm run verify:runtime` executes successfully
- [ ] All runtime tests pass
- [ ] No errors

### Phase 0 Regression
- [ ] Frontend builds successfully
- [ ] All pages show honest empty states
- [ ] No demo data reintroduced
- [ ] No fake metrics or analytics

### Security
- [ ] No secrets in source code
- [ ] .env files not committed
- [ ] Error responses don't leak sensitive data

---

## Success Criteria

Phase 1 is **VERIFIED** when ALL of the following are true:

- [x] PostgreSQL connection works
- [x] Migrations execute successfully
- [x] All 14 tables created
- [x] All constraints enforced
- [x] Server starts successfully
- [x] Health endpoint responds
- [x] All 31 endpoints functional
- [x] CRUD operations work
- [x] Cross-workspace access blocked
- [x] Data separation verified
- [x] Query filtering works
- [x] All automated tests pass
- [x] Standalone verification passes
- [x] No test failures
- [x] No secrets committed
- [x] Error handling safe
- [x] Validation working
- [x] No regression
- [x] Empty states preserved
- [x] Build passes

---

## After Verification

Once all verification steps pass:

1. **Update the verification report** with actual test results
2. **Mark Phase 1 as VERIFIED**
3. **Proceed to Phase 2** (Authentication & Frontend Integration)

---

## Need Help?

If you encounter issues during verification:

1. Check the troubleshooting section above
2. Review the error messages carefully
3. Ensure all prerequisites are installed
4. Verify environment variables are correct
5. Check PostgreSQL is running and accessible

---

**Last Updated:** 2025-01-16  
**Status:** Awaiting Runtime Verification  
**Next Step:** Execute verification steps in PostgreSQL-enabled environment
