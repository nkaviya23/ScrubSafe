# ScrubSafe – Scrub Typhus Early Warning & Community Risk Radar

> **Tagline:** Detect • Report • Alert • Protect  
> **Status:** Production-ready Hackathon MVP  
> **Backend:** Node.js, Express.js, SQLite3  
> **Frontend:** React, Vite, Leaflet, OpenStreetMap  

---

## 🌟 Overview

**ScrubSafe** is a full-stack public-health surveillance web application designed to counter **Scrub Typhus** (*Orientia tsutsugamushi* transmitted by larval trombiculid chigger mite bites). It empowers citizens and grassroots health workers to:

1. **Check Risk Early:** Transparent 5-factor rule-based risk calculator with clear clinical guidance and medical disclaimer.
2. **Report Suspected Cases:** Anonymous reporting protocol capturing GPS coordinates, symptoms (especially the hallmark *eschar* lesion), and environmental exposures into local SQLite storage.
3. **Interactive Risk Map:** Real-time geospatial mapping via Leaflet and OpenStreetMap, color-coded by risk level (Green, Yellow, Red) with cluster danger overlays.
4. **Community Risk Radar (⭐ Wow Feature):** Automated geospatial cluster detection algorithm utilizing Haversine distance. Identifies micro-clusters ($\ge 3$ reports within $\sim 5\text{ km}$), analyzes symptom spectrums, and issues live community alerts.
5. **Surveillance Dashboard:** Real-time statistics reporting total reports, high-risk cases, active clusters, and monitored regions.

---

## 📁 Project Architecture

```
scrub-shield/
├── backend/
│   ├── db.js             # SQLite database service, schema, indexes & demo cluster seeder
│   ├── riskEngine.js     # Rule-based transparent risk assessment engine (Fever, Eschar, etc.)
│   ├── clusterRadar.js   # Haversine spatial density & cluster detection engine (5 km radius)
│   ├── server.js         # Express REST API endpoints & logging middleware
│   └── package.json      # Backend dependencies (express, cors, sqlite3, dotenv)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx            # Header, tab navigation, active cluster beacon, live status
│   │   │   ├── HomeView.jsx          # Hero, live community risk badge, stats grid, educational guides
│   │   │   ├── CheckRiskView.jsx     # 5-question clinical questionnaire & score explanation
│   │   │   ├── ReportCaseView.jsx    # Case reporting form with GPS assist & Report ID banner
│   │   │   ├── RiskMapView.jsx       # Leaflet Map with color-coded pins & cluster danger circles
│   │   │   ├── CommunityRadarView.jsx# Animated radar sweep, 🚨 COMMUNITY RISK ALERT & case ledger
│   │   │   └── Footer.jsx            # Disclaimer & public health attribution
│   │   ├── App.jsx                   # Central state management, auto-polling & cross-view routing
│   │   ├── index.css                 # Clean healthcare design system, animations & responsive styling
│   │   └── main.jsx                  # React application entrypoint
│   ├── index.html                    # HTML shell with Google Fonts & Leaflet CSS
│   ├── vite.config.js                # Vite dev server with proxy to backend port 5000
│   └── package.json                  # Frontend dependencies (react, react-dom, leaflet, vite)
├── database/
│   └── scrubsafe.db                  # Local SQLite database file (created automatically on startup)
├── package.json                      # Unified root package.json
├── start-all.js                      # Cross-platform concurrent server runner
├── start-app.bat                     # Windows one-click launcher
└── README.md                         # Project documentation
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18+ or v20+ recommended)
- **NPM**

### 2. Running the Application

You can start both Backend and Frontend simultaneously with one command:

```bash
# From the project root:
node start-all.js
```

Or on Windows:
```cmd
start-app.bat
```

Alternatively, run each service independently:

```bash
# Terminal 1 - Start Backend:
cd backend
npm start
# Express runs on http://localhost:5000

# Terminal 2 - Start Frontend:
cd frontend
npm run dev
# React Vite runs on http://localhost:3000
```

Open your browser to:
👉 **`http://localhost:3000/`**

---

## 🔌 REST API Endpoints

All endpoints return standard JSON responses:

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check, uptime, and system status |
| `POST` | `/api/risk-check` | Calculates risk score (0-10), risk level (LOW/MODERATE/HIGH), factors & recommendations |
| `POST` | `/api/reports` | Validates case submission, auto-computes score, generates `ST-XXXX` ID, persists to SQLite |
| `GET` | `/api/reports` | Returns recent case reports sorted chronologically |
| `GET` | `/api/hotspots` | Geo-located coordinate points with risk classifications for Leaflet Map |
| `GET` | `/api/community-risk` | Executes cluster radar algorithm. Optional query params `?lat=...&lng=...&radius=5` |
| `GET` | `/api/stats` | Real-time surveillance KPIs (total reports, high risk, active clusters, areas) |

---

## 🩺 Risk Scoring Engine

| Symptom / Exposure Factor | Assigned Points | Rationale |
|---|---|---|
| **Fever** | **+2** | High remittent fever is a core onset symptom |
| **Headache / Body Pain** | **+1** | Severe retro-orbital ache and generalized myalgia |
| **Skin Rash** | **+2** | Maculopapular rash typically appearing on trunk (days 4-6) |
| **Outdoor / Scrub Exposure** | **+2** | Exposure to tall grass, agriculture, or forest border chigger habitats |
| **Eschar-like Lesion** | **+3** | **Pathognomonic hallmark:** painless dark crust resembling cigarette burn |

**Risk Level Categorization:**
- **0 – 2:** `LOW`
- **3 – 5:** `MODERATE`
- **6+:** `HIGH`

---

## ⭐ Community Risk Radar & Cluster Detection

The Community Risk Radar implements the great-circle **Haversine Distance Formula** ($R = 6371\text{ km}$):

$$\Delta\sigma = 2 \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos\phi_1\cos\phi_2\sin^2\left(\frac{\Delta\lambda}{2}\right)}\right)$$

- When $\ge 3$ suspected cases cluster within an approximate **5 km radius**, the area is flagged:
  - 🚨 **COMMUNITY RISK ALERT: "Multiple suspected reports detected in this area."**
  - Pinpoints geographic centroid and monitored radius.
  - Aggregates symptom prevalence (e.g. % cases presenting with eschar).
  - Displays high-risk cluster circles on the interactive map.

---

## 🔒 Privacy & Safety Notice

- **No Personal Identifiers:** ScrubSafe strictly does not request or store patient names, telephone numbers, emails, or government IDs.
- **Medical Disclaimer:** This tool provides early epidemiological risk indication and community surveillance. It does not replace clinical diagnosis. Citizens with concerning symptoms are urged to consult a qualified healthcare provider immediately.
