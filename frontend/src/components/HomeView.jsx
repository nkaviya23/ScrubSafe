import React from 'react';
import { translations } from '../i18n.js';

export default function HomeView({ stats, radarData, setActiveTab, lang }) {
  const t = translations[lang] || translations.en;
  const hasCluster = radarData && radarData.clusterDetected;

  return (
    <div>
      {/* Active Community Risk Alert Banner if cluster detected */}
      {hasCluster && (
        <div className="alert-banner" onClick={() => setActiveTab('radar')}>
          <div className="alert-banner-left">
            <span className="alert-beacon" />
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>
                {t.radar.alertHeadline}
              </div>
              <div style={{ fontSize: '0.85rem' }}>
                {t.radar.alertMessage} ({radarData.nearbyReports} {t.radar.nearbyReports.toLowerCase()})
              </div>
            </div>
          </div>
          <button
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', flexShrink: 0 }}
            onClick={(e) => {
              e.stopPropagation();
              setActiveTab('radar');
            }}
          >
            {t.home.inspectRadar}
          </button>
        </div>
      )}

      {/* Hero Section */}
      <div className="hero">
        <h1 className="hero-title">{t.home.heroTitle}</h1>
        <p className="hero-desc">{t.home.heroSubtitle}</p>

        {/* Current Community Risk Indicator */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.65rem',
            background: 'var(--bg-card-soft)',
            padding: '0.5rem 1.15rem',
            borderRadius: '9999px',
            border: '1px solid var(--border)',
            fontSize: '0.85rem'
          }}
        >
          <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>
            {t.home.currentRisk}
          </span>
          <span className={`badge-risk ${radarData?.riskLevel || 'LOW'}`}>
            ● {t.levels[radarData?.riskLevel || 'LOW']}
          </span>
        </div>
      </div>

      {/* Three Visual Action Cards */}
      <div className="visual-cards-grid">
        {/* Card 1: Check My Risk */}
        <div
          className="visual-action-card card-sage"
          onClick={() => setActiveTab('check-risk')}
        >
          <div>
            <div className="action-card-header">
              <span className="action-card-icon">🩺</span>
              <h2 className="action-card-title">{t.home.cardCheckTitle}</h2>
            </div>
            <p className="action-card-desc">{t.home.cardCheckDesc}</p>
          </div>
          <div className="action-card-btn">
            <span>{lang === 'ta' ? 'தொடங்குக' : 'Start Assessment'}</span> →
          </div>
        </div>

        {/* Card 2: Report Symptoms */}
        <div
          className="visual-action-card card-sky"
          onClick={() => setActiveTab('report')}
        >
          <div>
            <div className="action-card-header">
              <span className="action-card-icon">📍</span>
              <h2 className="action-card-title">{t.home.cardReportTitle}</h2>
            </div>
            <p className="action-card-desc">{t.home.cardReportDesc}</p>
          </div>
          <div className="action-card-btn" style={{ color: 'var(--sky)' }}>
            <span>{lang === 'ta' ? 'பதிவு செய்க' : 'Report Now'}</span> →
          </div>
        </div>

        {/* Card 3: Protect Your Community */}
        <div
          className="visual-action-card card-lavender"
          onClick={() => {
            const el = document.getElementById('community-guide');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          <div>
            <div className="action-card-header">
              <span className="action-card-icon">🌍</span>
              <h2 className="action-card-title">{t.home.cardProtectTitle}</h2>
            </div>
            <p className="action-card-desc">{t.home.cardProtectDesc}</p>
          </div>
          <div className="action-card-btn" style={{ color: 'var(--lavender)' }}>
            <span>{lang === 'ta' ? 'மேலும் அறிய' : 'Learn Precautions'}</span> ↓
          </div>
        </div>
      </div>

      {/* Community Health Snapshot (Stats Grid) */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.85rem' }}>
          📊 {t.home.statsTitle}
        </h2>
        <div className="stats-grid">
          <div className="stat-card stat-sage">
            <div className="stat-label">{t.home.totalReports}</div>
            <div className="stat-value">{stats?.totalReports ?? '--'}</div>
            <div className="stat-meta">{t.home.totalReportsMeta}</div>
          </div>

          <div className="stat-card stat-coral">
            <div className="stat-label">{t.home.highRiskReports}</div>
            <div className="stat-value" style={{ color: 'var(--alert-red)' }}>
              {stats?.highRiskReports ?? '--'}
            </div>
            <div className="stat-meta">{t.home.highRiskReportsMeta}</div>
          </div>

          <div className="stat-card stat-yellow">
            <div className="stat-label">{t.home.activeClusters}</div>
            <div className="stat-value" style={{ color: 'var(--yellow-text)' }}>
              {stats?.activeClusters ?? '--'}
            </div>
            <div className="stat-meta">{t.home.activeClustersMeta}</div>
          </div>

          <div className="stat-card stat-sky">
            <div className="stat-label">{t.home.areasMonitored}</div>
            <div className="stat-value">{stats?.areasMonitored ?? '--'}</div>
            <div className="stat-meta">{t.home.areasMonitoredMeta}</div>
          </div>
        </div>
      </div>

      {/* Community Education & Eschar Recognition */}
      <div
        id="community-guide"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem'
        }}
      >
        {/* Eschar Card */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <h3 className="card-title">🔍 {t.home.escharCardTitle}</h3>
          </div>
          <div
            style={{
              background: 'var(--yellow-light)',
              border: '1px solid var(--yellow-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.85rem',
              marginBottom: '0.75rem',
              fontSize: '0.85rem',
              color: 'var(--yellow-text)',
              lineHeight: '1.5'
            }}
          >
            {t.home.escharCardDesc}
          </div>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
            {lang === 'ta'
              ? 'காய்ச்சல் மற்றும் இந்த தழும்பு இருந்தால், உங்கள் மருத்துவரிடம் காட்டி ஆரம்பத்திலேயே சிகிச்சை பெறுங்கள்.'
              : 'If you have a fever and notice this mark, show it to your doctor right away for prompt recovery.'}
          </p>
        </div>

        {/* Prevention Tips */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <h3 className="card-title">🛡️ {t.home.preventionCardTitle}</h3>
          </div>
          <ul style={{ paddingLeft: '1.2rem', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.7' }}>
            {t.home.preventionTips.map((tip, idx) => (
              <li key={idx}>{tip}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recent Community Reports Ledger */}
      {stats?.recentReports && stats.recentReports.length > 0 && (
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 className="card-title">📋 {t.home.recentTitle}</h3>
            </div>
            <button
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
              onClick={() => setActiveTab('map')}
            >
              {lang === 'ta' ? 'வரைபடத்தில் பார்க்க' : 'View on Map'}
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>{t.home.tableReportId}</th>
                  <th>{t.home.tableLocation}</th>
                  <th>{t.home.tableRisk}</th>
                  <th>{t.home.tableDate}</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentReports.map((r) => (
                  <tr key={r.report_id || r.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--sky)' }}>
                      {r.report_id}
                    </td>
                    <td style={{ fontWeight: 600 }}>{r.location}</td>
                    <td>
                      <span className={`badge-risk ${r.risk_level}`}>
                        {t.levels[r.risk_level]}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-subtle)', fontSize: '0.8rem' }}>
                      {r.created_at ? new Date(r.created_at).toLocaleDateString() : '--'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
