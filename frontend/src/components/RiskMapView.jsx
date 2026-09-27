import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { translations } from '../i18n.js';

export default function RiskMapView({ radarData, lang }) {
  const t = translations[lang] || translations.en;

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const clustersLayerRef = useRef(null);

  const [hotspots, setHotspots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterLevel, setFilterLevel] = useState('ALL');

  const fetchHotspots = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/hotspots');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setHotspots(data.hotspots || []);
    } catch (err) {
      console.error('Failed to load hotspots:', err);
      setError(lang === 'ta' ? 'வரைபடத் தகவல்களைப் பெற முடியவில்லை.' : 'Could not connect to map hotspots service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotspots();
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [30.325, 78.04],
      zoom: 12,
      scrollWheelZoom: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    const clustersGroup = L.layerGroup().addTo(map);

    markersLayerRef.current = markersGroup;
    clustersLayerRef.current = clustersGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    const clustersGroup = clustersLayerRef.current;

    if (!map || !markersGroup || !clustersGroup) return;

    markersGroup.clearLayers();
    clustersGroup.clearLayers();

    // 1. Draw Cluster Danger Circles from radarData if any exist
    if (radarData && radarData.clusters && radarData.clusters.length > 0) {
      radarData.clusters.forEach((cluster) => {
        const circle = L.circle([cluster.center.latitude, cluster.center.longitude], {
          color: '#dc2626',
          fillColor: '#ef4444',
          fillOpacity: 0.12,
          weight: 2,
          dashArray: '5, 5',
          radius: (cluster.approximateRadiusKm || 5) * 1000
        });

        circle.bindPopup(`
          <div style="font-family: inherit; padding: 4px;">
            <div style="font-weight: 800; color: #dc2626; font-size: 13px; margin-bottom: 4px;">
              🚨 ${t.radar.alertHeadline}
            </div>
            <div style="font-size: 12px; color: #1e2022;">
              <strong>${t.radar.yourArea}:</strong> ${cluster.primaryAreas || 'Community Area'}<br/>
              <strong>${t.radar.nearbyReports}:</strong> ${cluster.reportCount}<br/>
              <strong>${t.radar.monitoredRadius}:</strong> ~${cluster.approximateRadiusKm} km
            </div>
          </div>
        `);

        clustersGroup.addLayer(circle);
      });
    }

    // 2. Filter hotspots
    const filtered = hotspots.filter((item) => {
      if (filterLevel === 'ALL') return true;
      return item.riskLevel === filterLevel;
    });

    if (filtered.length === 0) return;

    const bounds = [];

    filtered.forEach((spot) => {
      const lat = spot.latitude;
      const lng = spot.longitude;
      bounds.push([lat, lng]);

      let colorClass = 'low';
      let pinColor = '#5b8266';
      let label = 'L';

      if (spot.riskLevel === 'HIGH') {
        colorClass = 'high';
        pinColor = '#dc2626';
        label = 'H';
      } else if (spot.riskLevel === 'MODERATE') {
        colorClass = 'mod';
        pinColor = '#d4a373';
        label = 'M';
      }

      const icon = L.divIcon({
        className: 'custom-leaflet-icon',
        html: `<div class="map-marker-pin ${colorClass}" style="box-shadow: 0 0 6px ${pinColor};">${label}</div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });

      const marker = L.marker([lat, lng], { icon });

      const symptomsHtml = spot.symptoms && spot.symptoms.length > 0
        ? spot.symptoms.map(s => `<span style="display:inline-block; font-size:10px; background:#f5f2eb; padding:2px 6px; border-radius:4px; margin-right:4px; margin-bottom:2px; font-weight:600;">${s}</span>`).join('')
        : '';

      const popupContent = `
        <div style="font-family: inherit; min-width: 210px; padding: 2px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <strong style="color: #4a90e2; font-family: monospace; font-size: 12px;">${spot.reportId}</strong>
            <span style="font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 9999px; background: ${pinColor}20; color: ${pinColor};">
              ${t.levels[spot.riskLevel]}
            </span>
          </div>
          <div style="font-size: 12px; font-weight: 700; color: #1e2022; margin-bottom: 4px;">
            📍 ${spot.location}
          </div>
          <div style="margin-bottom: 4px;">
            ${symptomsHtml}
          </div>
          ${spot.notes ? `<div style="font-size: 11px; font-style: italic; color: #5e6368; background:#faf8f5; padding:4px 6px; border-radius:4px; margin-bottom:4px;">"${spot.notes}"</div>` : ''}
          <div style="font-size: 10px; color: #80868b; border-top: 1px solid #e8e3da; padding-top: 3px;">
            ${new Date(spot.createdAt).toLocaleDateString()}
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      markersGroup.addLayer(marker);
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [hotspots, filterLevel, radarData, lang]);

  const handleCenterOnCluster = () => {
    if (!mapInstanceRef.current) return;
    if (radarData?.topCluster?.center) {
      mapInstanceRef.current.flyTo(
        [radarData.topCluster.center.latitude, radarData.topCluster.center.longitude],
        13,
        { duration: 1.2 }
      );
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.85rem', marginBottom: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🗺️ {t.map.title}
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            {t.map.subtitle}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Filter options */}
          <div style={{ display: 'flex', background: '#ffffff', border: '1px solid var(--border)', borderRadius: '8px', padding: '2px' }}>
            {['ALL', 'HIGH', 'MODERATE', 'LOW'].map((lvl) => (
              <button
                key={lvl}
                style={{
                  border: 'none',
                  background: filterLevel === lvl ? 'var(--sage)' : 'transparent',
                  color: filterLevel === lvl ? '#ffffff' : 'var(--text-muted)',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  padding: '0.35rem 0.65rem',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
                onClick={() => setFilterLevel(lvl)}
              >
                {lvl === 'ALL' ? (lang === 'ta' ? 'அனைத்தும்' : 'All') : t.levels[lvl]}
              </button>
            ))}
          </div>

          <button
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
            onClick={fetchHotspots}
          >
            🔄 {t.map.refresh}
          </button>

          {radarData?.clusterDetected && (
            <button
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem', borderColor: 'var(--alert-red)', color: 'var(--alert-red)' }}
              onClick={handleCenterOnCluster}
            >
              🎯 {t.map.centerCluster}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div style={{ background: 'var(--alert-red-light)', border: '1px solid var(--alert-red-border)', color: 'var(--alert-red-text)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Map Container */}
      <div className="map-wrapper">
        <div ref={mapContainerRef} className="map-leaflet-container" />
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem', background: '#ffffff', padding: '0.85rem 1.25rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap', fontSize: '0.8rem' }}>
          <span style={{ fontWeight: 800, color: 'var(--text-main)' }}>{t.map.legend}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: 'var(--alert-red)' }} />
            <span>{t.map.high}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: 'var(--yellow-warm)' }} />
            <span>{t.map.mod}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: 'var(--sage)' }} />
            <span>{t.map.low}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: 10, height: 10, border: '2px dashed var(--alert-red)', borderRadius: '50%' }} />
            <span>{t.map.clusterZone}</span>
          </div>
        </div>

        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {lang === 'ta' ? 'பதிவான இடங்கள்:' : 'Mapped locations:'} <strong>{hotspots.filter(h => filterLevel === 'ALL' || h.riskLevel === filterLevel).length}</strong>
        </div>
      </div>
    </div>
  );
}
