import React, { useState } from 'react';
import { translations } from '../i18n.js';

export default function CommunityRadarView({ radarData, onRefreshRadar, setActiveTab, lang }) {
  const t = translations[lang] || translations.en;
  const isClusterActive = radarData && radarData.clusterDetected;
  const cluster = radarData?.topCluster || null;

  const [testAreaName, setTestAreaName] = useState('');
  const [testingArea, setTestingArea] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  // Scan user's current area using background GPS if allowed
  const handleScanMyArea = () => {
    if ('geolocation' in navigator) {
      setTestingArea(true);
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const res = await fetch(`/api/community-risk?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}&radius=5`);
            const data = await res.json();
            setScanResult(data);
          } catch (err) {
            console.error(err);
          } finally {
            setTestingArea(false);
          }
        },
        () => {
          setTestingArea(false);
          alert(lang === 'ta' ? 'இருப்பிட அனுமதி வழங்கப்படவில்லை.' : 'GPS location permission was not granted.');
        },
        { timeout: 8000 }
      );
    }
  };

  return (
    <div>
      {/* Radar Console (Calm Community Style) */}
      <div className="radar-box">
        <div style={{ marginBottom: '1.25rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: isClusterActive ? 'var(--coral-light)' : 'var(--sage-light)',
              color: isClusterActive ? 'var(--coral)' : 'var(--sage)',
              border: `1px solid ${isClusterActive ? 'var(--coral-border)' : 'var(--sage-border)'}`,
              padding: '0.3rem 0.8rem',
              borderRadius: '9999px',
              fontSize: '0.78rem',
              fontWeight: 700
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                backgroundColor: isClusterActive ? 'var(--alert-red)' : 'var(--sage)'
              }}
            />
            {t.radar.monitoringActive}
          </div>

          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.5rem' }}>
            🛰️ {t.radar.title}
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', maxWidth: 600, margin: '0.25rem auto 0 auto' }}>
            {t.radar.subtitle}
          </p>
        </div>

        {/* Animated Radar Graphic (Gentle Sweep) */}
        <div className="radar-graphic-calm">
          <div className="radar-ring ring-1" />
          <div className="radar-ring ring-2" />
          <div className={`radar-sweep-gentle ${isClusterActive ? 'active-alert' : ''}`} />

          {/* Dots indicating reports when cluster active */}
          {isClusterActive && (
            <>
              <div className="radar-dot" style={{ top: '35%', left: '50%' }} />
              <div className="radar-dot" style={{ top: '45%', left: '42%' }} />
              <div className="radar-dot" style={{ top: '55%', left: '54%' }} />
            </>
          )}

          {/* Dots for recent area reports */}
          {(() => {
            const areaReports = (radarData?.recentReports || [])
              .filter(r => r.locationPrecision === 'area')
              .slice(0, 8);

            const total = areaReports.length || 1;

            return areaReports.map((report, idx) => {
              const angle = (idx / total) * 2 * Math.PI;
              const radius = 0.4;
              const left = 50 + radius * Math.cos(angle) * 100;
              const top = 50 + radius * Math.sin(angle) * 100;

              return (
                <div
                  key={report.reportId || report.id || idx}
                  className="radar-dot"
                  style={{
                    top: `${top}%`,
                    left: `${left}%`,
                    backgroundColor: 'var(--sage)'
                  }}
                />
              );
            });
          })()}
        </div>

        {/* Central Prominent Alert Headline */}
        <div style={{ maxWidth: 660, margin: '0 auto' }}>
          {isClusterActive ? (
            <div style={{ background: 'var(--alert-red-light)', border: '1px solid var(--alert-red-border)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--alert-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                {t.radar.alertHeadline}
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--alert-red-text)', marginBottom: '0.5rem' }}>
                "{t.radar.alertMessage}"
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '0.75rem' }}>
                "{t.radar.alertNotice}"
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.85rem', borderTop: '1px solid var(--alert-red-border)', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
                <div>
                  <strong>{t.radar.nearbyReports}:</strong>{' '}
                  <span style={{ color: 'var(--alert-red)', fontWeight: 800 }}>{radarData.nearbyReports}</span>
                </div>
                <div>
                  <strong>{t.radar.monitoredRadius}:</strong>{' '}
                  <span style={{ color: 'var(--sky)', fontWeight: 700 }}>~{radarData.radiusKm || 5} km</span>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ background: 'var(--sage-light)', border: '1px solid var(--sage-border)', borderRadius: 'var(--radius-md)', padding: '1.15rem' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--sage)' }}>
                {t.radar.calmHeadline}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                {t.radar.calmMessage}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cluster Analysis Details */}
      {isClusterActive && cluster && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
          {/* Affected Area card */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">🏡 {t.radar.yourArea}</h3>
              <p className="card-subtitle">{cluster.primaryAreas || 'Regional Community Area'}</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0.85rem', background: 'var(--bg-card-soft)', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t.radar.nearbyReports}:</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--alert-red)' }}>
                  {cluster.reportCount}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0.85rem', background: 'var(--bg-card-soft)', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t.home.highRiskReports}:</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--alert-red)' }}>
                  {cluster.highRiskCount}
                </span>
              </div>
            </div>

            <div style={{ marginTop: '1.25rem' }}>
              <button
                className="btn btn-sky"
                style={{ width: '100%', fontSize: '0.85rem' }}
                onClick={() => setActiveTab('map')}
              >
                🗺️ {lang === 'ta' ? 'வரைபடத்தில் பார்க்க' : 'View Monitored Area on Map →'}
              </button>
            </div>
          </div>

          {/* Main Reported Symptoms */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">📊 {t.radar.symptomsHeader}</h3>
            </div>

            {radarData.mainSymptoms && radarData.mainSymptoms.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {radarData.mainSymptoms.map((symptom) => (
                  <div key={symptom.key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '0.2rem' }}>
                      <span style={{ fontWeight: 600 }}>{symptom.label}</span>
                      <span style={{ color: 'var(--sage)', fontWeight: 700 }}>
                        {symptom.count} ({symptom.percentage}%)
                      </span>
                    </div>
                    <div style={{ height: 8, background: '#eee', borderRadius: 9999, overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${symptom.percentage}%`,
                          backgroundColor: symptom.key === 'eschar' ? 'var(--alert-red)' : 'var(--sage)'
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No symptoms recorded.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Check My Area Button */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">📍 {t.radar.checkAreaTitle}</h3>
          <p className="card-subtitle">{t.radar.checkAreaDesc}</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-sage"
            disabled={testingArea}
            onClick={handleScanMyArea}
          >
            {testingArea ? '...' : `📡 ${t.radar.btnScanArea}`}
          </button>
        </div>

        {scanResult && (
          <div style={{ marginTop: '1.25rem', padding: '1rem', borderRadius: '8px', background: scanResult.clusterDetected ? 'var(--alert-red-light)' : 'var(--sage-light)', border: `1px solid ${scanResult.clusterDetected ? 'var(--alert-red-border)' : 'var(--sage-border)'}` }}>
            <div style={{ fontWeight: 800, color: scanResult.clusterDetected ? 'var(--alert-red)' : 'var(--sage)', fontSize: '0.95rem' }}>
              {scanResult.clusterDetected
                ? (lang === 'ta' ? 'எச்சரிக்கை: உங்கள் பகுதியில் பல பதிவுகள் உள்ளன.' : 'ALERT: Multiple reports have been detected in your area.')
                : (lang === 'ta' ? 'அமைதியானது: உங்கள் பகுதியில் அசாதாரண பரவல் எதுவும் இல்லை.' : 'CALM: No unusual report clusters noted in your 5 km area.')}
            </div>
            <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
              {scanResult.message}
            </div>
          </div>
        )}
      </div>

      {/* Advisory Note */}
      <div className="disclaimer-box">
        <span>🛡️</span>
        <div>{t.radar.advisoryNote}</div>
      </div>
    </div>
  );
}
