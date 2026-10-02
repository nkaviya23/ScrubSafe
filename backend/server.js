/**
 * ScrubSafe Backend Server
 * Scrub Typhus Early Warning & Community Risk Radar
 */

require('dotenv').config();
const express = require('express'); // ScrubSafe API
const cors = require('cors');
const db = require('./db');
const dbRun = db.dbRun;
const dbAll = db.dbAll;
const dbGet = db.dbGet;

const { calculateRisk } = require('./riskEngine');
const { analyzeCommunityClusters } = require('./clusterRadar');

const app = express();
const PORT = process.env.PORT || 5000;
	console.log(`[Server] NODE_ENV: ${process.env.NODE_ENV}`);
	console.log(`[Server] PORT: ${PORT}`);

// Middleware
const allowedOrigins = process.env.ALLOWED_ORIGIN || 'http://localhost:3000';
app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// Serve static files from frontend/dist in production
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  const frontendDistPath = path.join(__dirname, '..', 'frontend', 'dist');
  console.log(`[Static Files] Serving from: ${frontendDistPath}`);
  app.use(express.static(frontendDistPath));

  // Serve index.html for all non-API routes (for client-side routing)
  app.get('*', (req, res, next) => {
    if (!req.path.startsWith('/api/')) {
      console.log(`[Static Files] Serving index.html for client-side route: ${req.path}`);
      res.sendFile(path.join(frontendDistPath, 'index.html'));
    } else {
      next();
    }
  });
}

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[HTTP] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// ==========================================
// REST API ENDPOINTS
// ==========================================

/**
 * GET /api/health
 * System health check
 */
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'ScrubSafe Early Warning API',
    version: '1.1.0',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

/**
 * POST /api/risk-check
 * Rule-based symptom risk calculation
 */
app.post('/api/risk-check', (req, res) => {
  try {
    const { fever, headache, rash, outdoor_exposure, outdoorExposure, eschar } = req.body;

    const evaluation = calculateRisk({
      fever,
      headache,
      rash,
      outdoor_exposure: outdoor_exposure !== undefined ? outdoor_exposure : outdoorExposure,
      eschar
    });

    return res.status(200).json({
      success: true,
      ...evaluation
    });
  } catch (err) {
    console.error('[Risk Check Error]', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to evaluate symptoms.'
    });
  }
});

/**
 * POST /api/reports
 * Submit suspected-case report and persist to SQLite
 * Supports both area reports (State + District + Village) and optional GPS coordinates.
 */
app.post('/api/reports', async (req, res) => {
  try {
    const {
      state,
      district,
      village,
      landmark,
      location,
      latitude,
      longitude,
      fever,
      headache,
      rash,
      outdoor_exposure,
      outdoorExposure,
      eschar,
      notes
    } = req.body;

    // Build location string from structured or raw input
    const locParts = [village, landmark, district, state]
      .filter(p => p && typeof p === 'string' && p.trim())
      .map(p => p.trim());

    let finalLocation = locParts.length > 0 ? locParts.join(', ') : (location && typeof location === 'string' ? location.trim() : '');

    if (!finalLocation) {
      return res.status(400).json({
        success: false,
        error: 'Please provide your village, town, or district name.'
      });
    }

    // Handle optional GPS coordinates
    let finalLat = null;
    let finalLng = null;
    let locationPrecision = 'area';

    if (
      latitude !== undefined && latitude !== null && latitude !== '' &&
      longitude !== undefined && longitude !== null && longitude !== ''
    ) {
      const parsedLat = parseFloat(latitude);
      const parsedLng = parseFloat(longitude);

      if (!isNaN(parsedLat) && !isNaN(parsedLng) && parsedLat >= -90 && parsedLat <= 90 && parsedLng >= -180 && parsedLng <= 180) {
        finalLat = parsedLat;
        finalLng = parsedLng;
        locationPrecision = 'gps';
      }
    }

    const normFever = fever ? 1 : 0;
    const normHeadache = headache ? 1 : 0;
    const normRash = rash ? 1 : 0;
    const normOutdoor = (outdoor_exposure || outdoorExposure) ? 1 : 0;
    const normEschar = eschar ? 1 : 0;

    // Calculate risk score automatically via Risk Engine
    const riskAssessment = calculateRisk({
      fever: normFever,
      headache: normHeadache,
      rash: normRash,
      outdoor_exposure: normOutdoor,
      eschar: normEschar
    });

    // Generate readable Report ID
    const countResult = await dbGet(`SELECT COUNT(*) as total FROM reports`);
    const nextSeq = 1000 + (countResult.total + 1);
    const reportId = `ST-${nextSeq}`;
    const cleanNotes = notes && typeof notes === 'string' ? notes.trim().slice(0, 500) : '';

    const insertSql = `
      INSERT INTO reports (
        report_id, latitude, longitude, location, state, district, village, landmark,
        location_precision, fever, headache, rash, outdoor_exposure, eschar,
        notes, risk_score, risk_level, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const createdAt = new Date().toISOString();

    await dbRun(insertSql, [
      reportId,
      finalLat,
      finalLng,
      finalLocation,
      state ? state.trim() : null,
      district ? district.trim() : null,
      village ? village.trim() : null,
      landmark ? landmark.trim() : null,
      locationPrecision,
      normFever,
      normHeadache,
      normRash,
      normOutdoor,
      normEschar,
      cleanNotes,
      riskAssessment.score,
      riskAssessment.riskLevel,
      createdAt
    ]);

    console.log(`[Report Created] ID: ${reportId} | Loc: ${finalLocation} | Prec: ${locationPrecision} | Score: ${riskAssessment.score} (${riskAssessment.riskLevel})`);

    return res.status(201).json({
      success: true,
      reportId,
      message: 'Report successfully recorded.',
      data: {
        reportId,
        location: finalLocation,
        state: state || null,
        district: district || null,
        village: village || null,
        locationPrecision,
        hasCoordinates: locationPrecision === 'gps',
        riskScore: riskAssessment.score,
        riskLevel: riskAssessment.riskLevel,
        symptoms: {
          fever: Boolean(normFever),
          headache: Boolean(normHeadache),
          rash: Boolean(normRash),
          outdoorExposure: Boolean(normOutdoor),
          eschar: Boolean(normEschar)
        },
        createdAt
      }
    });
  } catch (err) {
    console.error('[Submit Report Error]', err);
    return res.status(500).json({
      success: false,
      error: 'An internal error occurred while saving the report.'
    });
  }
});

/**
 * GET /api/reports
 * Fetch recent submitted reports
 */
app.get('/api/reports', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const reports = await dbAll(
      `SELECT * FROM reports ORDER BY created_at DESC LIMIT ?`,
      [limit]
    );

    return res.status(200).json({
      success: true,
      count: reports.length,
      reports: reports.map(r => ({
        id: r.id,
        reportId: r.report_id,
        latitude: r.latitude,
        longitude: r.longitude,
        location: r.location,
        state: r.state,
        district: r.district,
        village: r.village,
        landmark: r.landmark,
        locationPrecision: r.location_precision || (r.latitude !== null ? 'gps' : 'area'),
        fever: Boolean(r.fever),
        headache: Boolean(r.headache),
        rash: Boolean(r.rash),
        outdoorExposure: Boolean(r.outdoor_exposure),
        eschar: Boolean(r.eschar),
        notes: r.notes,
        riskScore: r.risk_score,
        riskLevel: r.risk_level,
        createdAt: r.created_at
      }))
    });
  } catch (err) {
    console.error('[Get Reports Error]', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve reports.'
    });
  }
});

/**
 * GET /api/hotspots
 * Returns geo-located data points formatted for interactive Leaflet Map
 * Only returns reports with valid numeric GPS coordinates.
 */
app.get('/api/hotspots', async (req, res) => {
  try {
    const reports = await dbAll(`
      SELECT * FROM reports 
      WHERE latitude IS NOT NULL AND longitude IS NOT NULL 
      ORDER BY created_at DESC
    `);

    const hotspots = reports.map(r => ({
      id: r.id,
      reportId: r.report_id,
      location: r.location,
      latitude: r.latitude,
      longitude: r.longitude,
      riskLevel: r.risk_level,
      riskScore: r.risk_score,
      symptoms: [
        r.fever ? 'Fever' : null,
        r.eschar ? 'Eschar' : null,
        r.rash ? 'Rash' : null,
        r.outdoor_exposure ? 'Outdoor Exposure' : null,
        r.headache ? 'Headache/Pain' : null
      ].filter(Boolean),
      notes: r.notes,
      createdAt: r.created_at
    }));

    return res.status(200).json({
      success: true,
      count: hotspots.length,
      hotspots
    });
  } catch (err) {
    console.error('[Get Hotspots Error]', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve map hotspot data.'
    });
  }
});

/**
 * GET /api/community-risk
 * Community Risk Radar - analyzes spatial clusters
 */
app.get('/api/community-risk', async (req, res) => {
  try {
    const reports = await dbAll(`SELECT * FROM reports ORDER BY created_at DESC`);

    const userLat = req.query.lat ? parseFloat(req.query.lat) : null;
    const userLng = req.query.lng ? parseFloat(req.query.lng) : null;
    const radiusKm = req.query.radius ? parseFloat(req.query.radius) : 5.0;

    const radarAnalysis = analyzeCommunityClusters(reports, {
      userLat,
      userLng,
      radiusKm
    });

    return res.status(200).json({
      success: true,
      ...radarAnalysis
    });
  } catch (err) {
    console.error('[Community Risk Error]', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to compute community risk clusters.'
    });
  }
});

/**
 * GET /api/stats
 * Real-time community statistics from database
 */
app.get('/api/stats', async (req, res) => {
  try {
    const totalRow = await dbGet(`SELECT COUNT(*) as total FROM reports`);
    const highRiskRow = await dbGet(`SELECT COUNT(*) as count FROM reports WHERE risk_level = 'HIGH'`);
    const modRiskRow = await dbGet(`SELECT COUNT(*) as count FROM reports WHERE risk_level = 'MODERATE'`);
    const lowRiskRow = await dbGet(`SELECT COUNT(*) as count FROM reports WHERE risk_level = 'LOW'`);
    const escharRow = await dbGet(`SELECT COUNT(*) as count FROM reports WHERE eschar = 1`);
    const locationsRow = await dbGet(`SELECT COUNT(DISTINCT location) as count FROM reports`);

    const allReports = await dbAll(`SELECT * FROM reports ORDER BY created_at DESC`);
    const clusterAnalysis = analyzeCommunityClusters(allReports);

    const recentReports = await dbAll(
      `SELECT report_id, location, risk_level, risk_score, created_at FROM reports ORDER BY created_at DESC LIMIT 5`
    );

    return res.status(200).json({
      success: true,
      totalReports: totalRow.total,
      highRiskReports: highRiskRow.count,
      moderateRiskReports: modRiskRow.count,
      lowRiskReports: lowRiskRow.count,
      escharReports: escharRow.count,
      activeClusters: clusterAnalysis.clusters.length,
      areasMonitored: locationsRow.count,
      clusterDetails: clusterAnalysis.topCluster,
      recentReports
    });
  } catch (err) {
    console.error('[Stats Error]', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch community statistics.'
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Endpoint not found: ${req.method} ${req.url}`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error occurred.'
  });
});

// Start Express server after DB initialization
app.listen(PORT, () => {
  console.log(`[Server] Running on port ${PORT}`);
});
