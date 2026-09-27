# ScrubShield Production Deployment Guide

## ✅ SUMMARY OF CHANGES

I have successfully modified the ScrubShield project to support proper production deployment with a single public URL architecture, while preserving all existing functionality and keeping development workflow intact.

### Files Modified:
1. **start-all.js** - Added NODE_ENV conditional logic to only start frontend dev server in development
2. **backend/server.js** - Minor console log improvements for clarity

### Files NOT Modified (Preserved as Requested):
- backend/riskEngine.js
- Voice input functionality
- All UI components
- Database schema and logic
- Core API routes
- Frontend build configuration

## 🏗️ PRODUCTION ARCHITECTURE ACHIEVED

```
ONE PUBLIC URL (e.g., https://your-app.com/)
          ↓
    Express Server (PORT)
          ↓
    ┌─────────────────────────────┐
    │  React Frontend (/)         │ ← Served from frontend/dist
    │  API Endpoints (/api/*)     │ ← Served from backend routes
    │  Client-Side Routing        │ ← Falls back to index.html
    └─────────────────────────────┘
          ↓
    SQLite Database (unchanged)
```

## 🚀 DEPLOYMENT INSTRUCTIONS

### For Any Hosting Platform (Render, Railway, VPS, Docker, etc.):

#### 1. Build Command
```bash
npm run build
```

#### 2. Start Command
```bash
NODE_ENV=production npm start
```

#### 3. Required Environment Variables
| Variable | Value | Notes |
|----------|-------|-------|
| `PORT` | `10000` (or platform-provided) | Use PORT env var from platform |
| `NODE_ENV` | `production` | **Must** be set to production |
| `DB_PATH` | `../database/scrubsafe.db` | Path relative to backend/ directory |
| `ALLOWED_ORIGIN` | `https://yourdomain.com` | Optional - restricts CORS to your domain |

#### 4. Directory Structure
Deploy the **entire project repository** - the build process creates `frontend/dist/` which gets served automatically.

### Example Platform Configurations:

#### Render.com
- **Environment**: Docker
- **Build Command**: `npm run build`
- **Start Command**: `NODE_ENV=production npm start`
- **Environment Variables**: Set PORT, NODE_ENV=production, DB_PATH, ALLOWED_ORIGIN

#### Railway.app
- **Build Command**: `npm run build`
- **Start Command**: `NODE_ENV=production npm start`
- **Variables**: Add in Railway dashboard

#### Traditional Server/VPS
```bash
# On your server:
git clone [your-repo]
cd scrubshield
npm install
npm run build
NODE_ENV=production PORT=8080 npm start &
```

## 🔧 DEVELOPMENT WORKFLOW (UNCHANGED)

Your local development continues to work exactly as before:
```bash
npm start
# → Starts:
#   - Express backend on http://localhost:5000
#   - Vite frontend dev server on http://localhost:3000
#   - /api requests proxied to localhost:5000
```

## ✅ VERIFICATION CHECKLIST

After deployment, verify these endpoints work:

| Endpoint | Method | Expected Response |
|----------|--------|-------------------|
| `/` | GET | React application loads |
| `/api/health` | GET | `{"status":"healthy", ...}` |
| `/api/stats` | GET | `{success:true, totalReports:20, ...}` |
| `/api/reports` | GET | `{success:true, count:20, reports:[...]}` |
| `/api/hotspots` | GET | `[{id:1, latitude:30.3, longitude:78.0, ...}, ...]` |
| `/api/community-risk?lat=30.3&lng=78.0` | GET | `{success:true, ...cluster analysis...}` |
| `/api/risk-check` | POST | `{success:true, riskLevel:"HIGH", ...}` (with fever/headache/etc. data) |
| `/invalid-route` | GET | `{"success":false,"error":"Endpoint not found: GET /invalid-route"}` |
| `/any-react-route` | GET | React router loads correct view (serves index.html) |

## 📁 WHAT GETS SERVED WHERE

### In Production (NODE_ENV=production):
- **URL Path**: `/` → **Serves**: `frontend/dist/index.html` (React app)
- **URL Path**: `/assets/*` → **Serves**: `frontend/dist/assets/*` (JS/CSS assets)
- **URL Path**: `/api/*` → **Serves**: Express API routes (risk-check, reports, etc.)
- **URL Path**: `/anything-else` → **Serves**: `frontend/dist/index.html` (client-side routing)

### In Development (NODE_ENV≠production):
- **URL Path**: `/` → **Served by**: Vite dev server (http://localhost:3000)
- **URL Path**: `/api/*` → **Proxied to**: Express backend (http://localhost:5000)
- **URL Path**: Everything else → **Served by**: Vite dev server

## ⚠️ IMPORTANT NOTES

### Database Persistence
The project uses SQLite (`database/scrubsafe.db`). Ensure your hosting platform provides:
- Persistent storage for the database file, OR
- You're OK with data resetting on restart (suitable for demos/staging)

For permanent data, consider migrating to PostgreSQL/MySQL (would require changes to `db.js` - outside scope of this fix).

### Why Not Netlify/Vercel Functions?
This architecture preserves the existing Express backend as requested. Netlify/Vercel would require:
- Converting Express routes to serverless functions
- Changing database connection patterns
- Rewriting middleware and file serving logic
This would violate the requirement to "Do NOT modify the risk calculation logic" and preserve existing backend architecture.

### CORS Security
In production, set `ALLOWED_ORIGIN=https://yourdomain.com` to restrict access to your domain only. In development, it defaults to `http://localhost:3000`.

## 🎯 RESULT

You now have a production-ready ScrubShield deployment that:
✅ Serves as a single public URL (no separate frontend/backend domains)
✅ Uses relative API paths (`/api/health` etc.) in frontend code
✅ Preserves all existing functionality including voice input and risk calculation
✅ Maintains unchanged development workflow
✅ Requires minimal platform configuration
✅ Works with any standard Node.js hosting service