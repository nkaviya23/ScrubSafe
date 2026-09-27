/**
 * ScrubSafe Community Risk Radar & Cluster Detection Engine
 * 
 * Analyzes reported cases using the Haversine distance formula.
 * Identifies spatial clusters where >= 3 reports with valid GPS
 * coordinates are concentrated within an approximately 5 km radius.
 * Reports without coordinates are safely excluded from distance calculations.
 */

// Haversine formula to compute great-circle distance between two GPS coordinates in kilometers
function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's mean radius in km
  const toRad = deg => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Detect spatial clusters among reports.
 * Only reports with valid latitude & longitude are used for spatial cluster detection.
 */
function analyzeCommunityClusters(allReports = [], options = {}) {
  const radiusKm = Number(options.radiusKm) || 5.0;
  const minClusterSize = Number(options.minClusterSize) || 3;
  const userLat = options.userLat !== undefined && options.userLat !== null && !isNaN(options.userLat) ? Number(options.userLat) : null;
  const userLng = options.userLng !== undefined && options.userLng !== null && !isNaN(options.userLng) ? Number(options.userLng) : null;

  // Filter for reports with valid numeric GPS coordinates
  const gpsReports = allReports.filter(r => 
    r.latitude !== null && 
    r.latitude !== undefined && 
    r.longitude !== null && 
    r.longitude !== undefined && 
    !isNaN(Number(r.latitude)) && 
    !isNaN(Number(r.longitude))
  );

  if (gpsReports.length === 0) {
    return {
      clusterDetected: false,
      riskLevel: 'LOW',
      nearbyReports: 0,
      radiusKm,
      message: 'No reports currently detected in this area.',
      clusterNotice: 'Routine community surveillance active.',
      clusters: [],
      recentReports: allReports.slice(0, 5),
      mainSymptoms: aggregateSymptoms(allReports)
    };
  }

  // 1. If user coordinates are provided, evaluate radius specifically around user
  if (userLat !== null && userLng !== null) {
    const nearby = gpsReports.filter(r => {
      const dist = haversineDistanceKm(userLat, userLng, Number(r.latitude), Number(r.longitude));
      r._distanceKm = Math.round(dist * 10) / 10;
      return dist <= radiusKm;
    });

    const clusterDetected = nearby.length >= minClusterSize;
    let riskLevel = 'LOW';
    if (clusterDetected) {
      const highRiskCount = nearby.filter(r => r.risk_level === 'HIGH').length;
      riskLevel = highRiskCount >= 2 ? 'HIGH' : 'MODERATE';
    } else if (nearby.length > 0) {
      riskLevel = nearby.some(r => r.risk_level === 'HIGH') ? 'MODERATE' : 'LOW';
    }

    const symptomsSummary = aggregateSymptoms(nearby);

    return {
      clusterDetected,
      riskLevel,
      nearbyReports: nearby.length,
      radiusKm,
      message: clusterDetected
        ? 'Multiple reports have been detected in this area.'
        : nearby.length > 0
          ? `${nearby.length} report(s) noted nearby within ${radiusKm} km.`
          : 'No report clusters detected within your area.',
      clusterNotice: clusterDetected
        ? 'This is a potential community risk pattern, not a confirmed outbreak.'
        : 'Routine community surveillance active.',
      userLocation: { latitude: userLat, longitude: userLng },
      recentReports: nearby.slice(0, 5),
      mainSymptoms: symptomsSummary,
      analyzedAt: new Date().toISOString()
    };
  }

  // 2. Global cluster discovery across GPS reports
  const clusters = [];
  const visited = new Set();

  for (let i = 0; i < gpsReports.length; i++) {
    const r1 = gpsReports[i];
    const group = [r1];

    for (let j = 0; j < gpsReports.length; j++) {
      if (i === j) continue;
      const r2 = gpsReports[j];
      const dist = haversineDistanceKm(
        Number(r1.latitude), Number(r1.longitude),
        Number(r2.latitude), Number(r2.longitude)
      );
      if (dist <= radiusKm) {
        group.push(r2);
      }
    }

    if (group.length >= minClusterSize) {
      const avgLat = group.reduce((sum, r) => sum + Number(r.latitude), 0) / group.length;
      const avgLng = group.reduce((sum, r) => sum + Number(r.longitude), 0) / group.length;
      const spreadKm = Math.max(...group.map(r => haversineDistanceKm(avgLat, avgLng, Number(r.latitude), Number(r.longitude))));
      const areaNames = Array.from(new Set(group.map(r => r.location)));

      const key = `${avgLat.toFixed(2)}_${avgLng.toFixed(2)}`;
      if (!visited.has(key)) {
        visited.add(key);

        const highRiskCases = group.filter(r => r.risk_level === 'HIGH').length;
        const clusterRiskLevel = highRiskCases >= 2 ? 'HIGH' : 'MODERATE';

        clusters.push({
          id: `cluster-${clusters.length + 1}`,
          clusterDetected: true,
          riskLevel: clusterRiskLevel,
          reportCount: group.length,
          highRiskCount: highRiskCases,
          center: {
            latitude: Number(avgLat.toFixed(5)),
            longitude: Number(avgLng.toFixed(5))
          },
          approximateRadiusKm: Number(Math.max(spreadKm, 0.5).toFixed(1)),
          primaryAreas: areaNames.slice(0, 3).join(', '),
          mainSymptoms: aggregateSymptoms(group),
          reports: group.map(r => ({
            id: r.id,
            report_id: r.report_id,
            location: r.location,
            state: r.state,
            district: r.district,
            village: r.village,
            latitude: r.latitude,
            longitude: r.longitude,
            risk_level: r.risk_level,
            risk_score: r.risk_score,
            eschar: r.eschar,
            created_at: r.created_at
          }))
        });
      }
    }
  }

  clusters.sort((a, b) => b.reportCount - a.reportCount || b.highRiskCount - a.highRiskCount);

  const topCluster = clusters[0];
  const clusterDetected = clusters.length > 0;
  const overallRiskLevel = topCluster ? topCluster.riskLevel : 'LOW';
  const nearbyReportsCount = topCluster ? topCluster.reportCount : 0;
  const mainSymptoms = topCluster ? topCluster.mainSymptoms : aggregateSymptoms(allReports);

  return {
    clusterDetected,
    riskLevel: overallRiskLevel,
    nearbyReports: nearbyReportsCount,
    radiusKm,
    message: clusterDetected
      ? 'Multiple reports have been detected in this area.'
      : 'No report clusters currently detected in your community.',
    clusterNotice: clusterDetected
      ? 'This is a potential community risk pattern, not a confirmed outbreak.'
      : 'Routine community surveillance active.',
    topCluster: topCluster || null,
    clusters,
    totalClusters: clusters.length,
    recentReports: allReports.slice(0, 6),
    mainSymptoms,
    analyzedAt: new Date().toISOString()
  };
}

function aggregateSymptoms(reportsList = []) {
  if (!reportsList || reportsList.length === 0) return [];
  const total = reportsList.length;

  const counts = {
    fever: 0,
    headache: 0,
    rash: 0,
    outdoor_exposure: 0,
    eschar: 0
  };

  reportsList.forEach(r => {
    if (r.fever) counts.fever++;
    if (r.headache) counts.headache++;
    if (r.rash) counts.rash++;
    if (r.outdoor_exposure) counts.outdoor_exposure++;
    if (r.eschar) counts.eschar++;
  });

  const symptomLabels = [
    { key: 'fever', label: 'Fever', count: counts.fever },
    { key: 'eschar', label: 'Black Scab / Eschar', count: counts.eschar },
    { key: 'outdoor_exposure', label: 'Outdoor / Field Exposure', count: counts.outdoor_exposure },
    { key: 'rash', label: 'Skin Rash', count: counts.rash },
    { key: 'headache', label: 'Headache & Body Pain', count: counts.headache }
  ];

  return symptomLabels.map(item => ({
    ...item,
    percentage: Math.round((item.count / total) * 100)
  }));
}

module.exports = {
  haversineDistanceKm,
  analyzeCommunityClusters,
  aggregateSymptoms
};
