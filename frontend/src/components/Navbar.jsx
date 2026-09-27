import React from 'react';
import { translations } from '../i18n.js';

export default function Navbar({ activeTab, setActiveTab, radarData, backendStatus, lang, setLang }) {
  const t = translations[lang] || translations.en;
  const hasCluster = radarData && radarData.clusterDetected;

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="brand" onClick={() => setActiveTab('home')}>
          <div className="brand-icon">
            🌿
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span className="brand-title">{t.appName}</span>
              <span className="brand-badge">{t.badge}</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              {t.tagline}
            </div>
          </div>
        </div>

        <div className="nav-links">
          <button
            className={`nav-btn ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => setActiveTab('home')}
          >
            🏠 {t.nav.home}
          </button>

          <button
            className={`nav-btn ${activeTab === 'check-risk' ? 'active' : ''}`}
            onClick={() => setActiveTab('check-risk')}
          >
            🩺 {t.nav.checkRisk}
          </button>

          <button
            className={`nav-btn ${activeTab === 'report' ? 'active' : ''}`}
            onClick={() => setActiveTab('report')}
          >
            📍 {t.nav.report}
          </button>

          <button
            className={`nav-btn ${activeTab === 'map' ? 'active' : ''}`}
            onClick={() => setActiveTab('map')}
          >
            🗺️ {t.nav.map}
          </button>

          <button
            className={`nav-btn radar-btn ${activeTab === 'radar' ? 'active' : ''}`}
            onClick={() => setActiveTab('radar')}
          >
            {hasCluster && <span className="alert-beacon" style={{ width: 8, height: 8 }} />}
            🛰️ {t.nav.radar} {hasCluster ? `(${radarData.nearbyReports})` : ''}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {/* Language Switcher */}
          <div className="lang-toggle">
            <button
              className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
              onClick={() => setLang('en')}
            >
              English
            </button>
            <button
              className={`lang-btn ${lang === 'ta' ? 'active' : ''}`}
              onClick={() => setLang('ta')}
            >
              தமிழ்
            </button>
          </div>

          {/* Connection Status */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.75rem',
              padding: '0.2rem 0.6rem',
              borderRadius: '9999px',
              backgroundColor: backendStatus === 'online' ? '#eef4f0' : '#fef2f2',
              color: backendStatus === 'online' ? '#3d6147' : '#991b1b',
              fontWeight: 600,
              border: `1px solid ${backendStatus === 'online' ? '#c2d6c8' : '#fecaca'}`
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                backgroundColor: backendStatus === 'online' ? '#5b8266' : '#dc2626'
              }}
            />
            {backendStatus === 'online' ? t.nav.backendLive : t.nav.backendOff}
          </div>
        </div>
      </div>
    </nav>
  );
}
