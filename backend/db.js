/**
 * ScrubSafe Database Service
 *
 * Local development:
 *   SQLite -> database/scrubsafe.db
 *
 * Vercel production:
 *   Turso/libSQL
 */

const path = require('path');
const fs = require('fs');

const USE_TURSO =
  !!process.env.TURSO_DATABASE_URL &&
  !!process.env.TURSO_AUTH_TOKEN;

let db = null;

if (USE_TURSO) {
  const { createClient } = require('@libsql/client');

  db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN
  });

  console.log('[DB] Using Turso/libSQL database.');
} else {
  const sqlite3 = require('sqlite3').verbose();

  const DB_DIR = path.resolve(__dirname, '../database');
  const DB_PATH =
    process.env.DB_PATH || path.join(DB_DIR, 'scrubsafe.db');

  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      console.error(
        '[DB Error] Failed to connect to SQLite:',
        err.message
      );
    } else {
      console.log(`[DB] Connected to SQLite database at: ${DB_PATH}`);
    }
  });
}

/**
 * Execute INSERT / UPDATE / DELETE / CREATE / ALTER statements.
 */
const dbRun = async (sql, params = []) => {
  if (USE_TURSO) {
    const result = await db.execute({
      sql,
      args: params
    });

    return {
      lastID: result.lastInsertRowid
        ? Number(result.lastInsertRowid)
        : undefined,
      changes: result.rowsAffected || 0
    };
  }

  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else {
        resolve({
          lastID: this.lastID,
          changes: this.changes
        });
      }
    });
  });
};

/**
 * Return all rows.
 */
const dbAll = async (sql, params = []) => {
  if (USE_TURSO) {
    const result = await db.execute({
      sql,
      args: params
    });

    return result.rows;
  }

  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

/**
 * Return one row.
 */
const dbGet = async (sql, params = []) => {
  if (USE_TURSO) {
    const result = await db.execute({
      sql,
      args: params
    });

    return result.rows[0];
  }

  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

// Initial Demo Records for Instant Cluster & Map Demonstration
const DEMO_REPORTS = [
  {
    report_id: 'ST-1001',
    latitude: 30.3250,
    longitude: 78.0410,
    location: 'Pine Ridge Village, Foothill Sector',
    state: 'Uttarakhand',
    district: 'Dehradun',
    village: 'Pine Ridge Village',
    landmark: 'Near Foothill Primary School',
    location_precision: 'gps',
    fever: 1,
    headache: 1,
    rash: 1,
    outdoor_exposure: 1,
    eschar: 1,
    notes: 'Farmer observed dark cigarette-burn necrotic eschar on right thigh after clearing tall brush.',
    risk_score: 9,
    risk_level: 'HIGH',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString()
  },
  {
    report_id: 'ST-1002',
    latitude: 30.3315,
    longitude: 78.0385,
    location: 'Greenfield Tea Estate Colony',
    state: 'Uttarakhand',
    district: 'Dehradun',
    village: 'Greenfield Tea Estate',
    landmark: 'Colony Sector 4',
    location_precision: 'gps',
    fever: 1,
    headache: 1,
    rash: 1,
    outdoor_exposure: 1,
    eschar: 0,
    notes: 'Tea garden worker reporting continuous fever, chills, and truncal maculopapular rash.',
    risk_score: 6,
    risk_level: 'HIGH',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString()
  },
  {
    report_id: 'ST-1003',
    latitude: 30.3182,
    longitude: 78.0450,
    location: 'Oakwood Farm Hamlet',
    state: 'Uttarakhand',
    district: 'Dehradun',
    village: 'Oakwood Farm Hamlet',
    landmark: 'Near Riverbed Weirs',
    location_precision: 'gps',
    fever: 1,
    headache: 1,
    rash: 0,
    outdoor_exposure: 1,
    eschar: 1,
    notes: 'Painless dark scab discovered in axillary fold. Clearing scrub near rodent burrows.',
    risk_score: 7,
    risk_level: 'HIGH',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 42).toISOString()
  },
  {
    report_id: 'ST-1004',
    latitude: 30.3225,
    longitude: 78.0330,
    location: 'Shady Glen Agricultural Border',
    state: 'Uttarakhand',
    district: 'Dehradun',
    village: 'Shady Glen',
    landmark: 'Canal Crossing',
    location_precision: 'gps',
    fever: 1,
    headache: 0,
    rash: 1,
    outdoor_exposure: 1,
    eschar: 0,
    notes: 'Fever and itchy rash following firewood collection along dense shrubbery.',
    risk_score: 5,
    risk_level: 'MODERATE',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 60).toISOString()
  },
  {
    report_id: 'ST-1005',
    latitude: 30.1085,
    longitude: 78.2930,
    location: 'Ganga Riverside Orchard, Rishikesh',
    state: 'Uttarakhand',
    district: 'Dehradun',
    village: 'Tapovan Outskirts',
    landmark: 'Orchard Gate',
    location_precision: 'gps',
    fever: 1,
    headache: 1,
    rash: 0,
    outdoor_exposure: 1,
    eschar: 0,
    notes: 'Eco-camp worker with persistent chills and body aches.',
    risk_score: 5,
    risk_level: 'MODERATE',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 75).toISOString()
  },
  {
    report_id: 'ST-1006',
    latitude: null,
    longitude: null,
    location: 'Melur Village, Madurai, Tamil Nadu',
    state: 'Tamil Nadu',
    district: 'Madurai',
    village: 'Melur Village',
    landmark: 'Near Agricultural Cooperative',
    location_precision: 'area',
    fever: 1,
    headache: 1,
    rash: 0,
    outdoor_exposure: 1,
    eschar: 0,
    notes: 'Agricultural worker with high fever and body ache after weeding paddy field bunds.',
    risk_score: 5,
    risk_level: 'MODERATE',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 85).toISOString()
  },
  {
    report_id: 'ST-1007',
    latitude: 30.2980,
    longitude: 77.9950,
    location: 'South Urban Extension Sector 9',
    state: 'Uttarakhand',
    district: 'Dehradun',
    village: 'Sector 9',
    landmark: 'Near Market Square',
    location_precision: 'gps',
    fever: 0,
    headache: 1,
    rash: 0,
    outdoor_exposure: 0,
    eschar: 0,
    notes: 'Seasonal headache and fatigue. Denies rural or tall grass travel.',
    risk_score: 1,
    risk_level: 'LOW',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString()
  }
];

// Initialize schema and populate demo data if needed
async function initDatabase() {
  try {
    // Check if table already exists
    const checkTable = await dbGet(`SELECT name FROM sqlite_master WHERE type='table' AND name='reports'`);

    if (checkTable) {
      // Check column definitions
      const columns = await dbAll(`PRAGMA table_info(reports)`);
      const latCol = columns.find(c => c.name === 'latitude');
      const hasPrecision = columns.some(c => c.name === 'location_precision');

      // If latitude has NOT NULL constraint, migrate to nullable
      if (latCol && latCol.notnull === 1) {
        console.log('[DB] Migrating reports table to support area reports without GPS coordinates...');
        await dbRun(`ALTER TABLE reports RENAME TO reports_old`);
        await dbRun(`
          CREATE TABLE reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            report_id TEXT UNIQUE NOT NULL,
            latitude REAL,
            longitude REAL,
            location TEXT NOT NULL,
            state TEXT,
            district TEXT,
            village TEXT,
            landmark TEXT,
            location_precision TEXT DEFAULT 'gps',
            fever INTEGER NOT NULL DEFAULT 0,
            headache INTEGER NOT NULL DEFAULT 0,
            rash INTEGER NOT NULL DEFAULT 0,
            outdoor_exposure INTEGER NOT NULL DEFAULT 0,
            eschar INTEGER NOT NULL DEFAULT 0,
            notes TEXT,
            risk_score INTEGER NOT NULL DEFAULT 0,
            risk_level TEXT NOT NULL DEFAULT 'LOW',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        await dbRun(`
          INSERT INTO reports (
            id, report_id, latitude, longitude, location, fever, headache, rash,
            outdoor_exposure, eschar, notes, risk_score, risk_level, created_at
          )
          SELECT
            id, report_id, latitude, longitude, location, fever, headache, rash,
            outdoor_exposure, eschar, notes, risk_score, risk_level, created_at
          FROM reports_old
        `);

        await dbRun(`DROP TABLE reports_old`);
        console.log('[DB] Migration complete: reports table now supports nullable coordinates and area precision.');
      } else if (!hasPrecision) {
        // Add new columns if missing
        try { await dbRun(`ALTER TABLE reports ADD COLUMN state TEXT`); } catch (e) {}
        try { await dbRun(`ALTER TABLE reports ADD COLUMN district TEXT`); } catch (e) {}
        try { await dbRun(`ALTER TABLE reports ADD COLUMN village TEXT`); } catch (e) {}
        try { await dbRun(`ALTER TABLE reports ADD COLUMN landmark TEXT`); } catch (e) {}
        try { await dbRun(`ALTER TABLE reports ADD COLUMN location_precision TEXT DEFAULT 'gps'`); } catch (e) {}
      }
    } else {
      // Create fresh reports table with nullable latitude/longitude
      await dbRun(`
        CREATE TABLE IF NOT EXISTS reports (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          report_id TEXT UNIQUE NOT NULL,
          latitude REAL,
          longitude REAL,
          location TEXT NOT NULL,
          state TEXT,
          district TEXT,
          village TEXT,
          landmark TEXT,
          location_precision TEXT DEFAULT 'gps',
          fever INTEGER NOT NULL DEFAULT 0,
          headache INTEGER NOT NULL DEFAULT 0,
          rash INTEGER NOT NULL DEFAULT 0,
          outdoor_exposure INTEGER NOT NULL DEFAULT 0,
          eschar INTEGER NOT NULL DEFAULT 0,
          notes TEXT,
          risk_score INTEGER NOT NULL DEFAULT 0,
          risk_level TEXT NOT NULL DEFAULT 'LOW',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }

    // Performance indexes
    await dbRun(`CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at DESC)`);
    await dbRun(`CREATE INDEX IF NOT EXISTS idx_reports_coords ON reports(latitude, longitude)`);
    await dbRun(`CREATE INDEX IF NOT EXISTS idx_reports_risk_level ON reports(risk_level)`);

    console.log('[DB] Schema verified and indexes active.');

    // Just log the current count, no seeding, no deletion
    const countRow = await dbGet(`SELECT COUNT(*) as count FROM reports`);
    console.log(`[DB] Database contains ${countRow.count} existing reports.`);
  } catch (err) {
    console.error('[DB Init Error]', err);
  }
}

// Initialize database automatically when this module loads
initDatabase().catch((err) => {
  console.error('[DB Startup Error]', err);
});

module.exports = {
  db,
  dbRun,
  dbAll,
  dbGet
};