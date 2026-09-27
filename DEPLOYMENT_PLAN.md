# Deployment Architecture Fix Plan

## Files I Intend to Modify

1. **start-all.js**
   - Reason: Currently starts both frontend (Vite dev server) and backend (Express) regardless of environment. In production, we only want to start the Express backend that serves the built frontend.

2. **backend/server.js** (optional improvements)
   - Reason: Improve console logging accuracy in production mode to avoid confusion about localhost references.

## Files I Will NOT Modify

- backend/riskEngine.js (explicitly prohibited)
- Voice input files (frontend/src/components/VoiceInput.jsx) - not related to deployment
- Existing UI components
- Database schema or backend/db.js
- Core API route logic
- Frontend package.json or vite.config.js (current setup works for production build)
- Environment variable structure (.env.example is already correct)

## Proposed Changes

### start-all.js Modification:
Add NODE_ENV check to only start frontend dev server when NODE_ENV !== 'production'

### backend/server.js Modification (minor):
Update console logs in production section to be more generic or indicate they're example URLs

## Expected Production Behavior:
When NODE_ENV=production:
1. npm run build (creates frontend/dist)
2. npm start (starts Express server only)
3. Express serves frontend/dist at root URL
4. Express serves /api/* routes from backend
5. Client-side routes fallback to index.html
6. No dependency on localhost:3000 or localhost:5000

## Expected Development Behavior:
When NODE_ENV=development (default):
1. npm start starts both:
   - Express backend on port 5000
   - Vite frontend dev server on port 3000 with /api proxy to localhost:5000