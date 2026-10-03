/**
 * OpenStreetMap Nominatim geocoding for area-based report locations.
 * Used only when browser GPS coordinates are unavailable.
 */

const NOMINATIM_USER_AGENT =
  process.env.NOMINATIM_USER_AGENT ||
  'ScrubSafe/1.1.0 (Scrub Typhus community health reporting; contact: scrubsafe-health-initiative)';

const GEOCODE_TIMEOUT_MS = 8000;

/**
 * @param {string} locationQuery - Combined location string (village, district, state, etc.)
 * @returns {Promise<{ latitude: number, longitude: number } | null>}
 */
async function geocodeAreaLocation(locationQuery) {
  if (!locationQuery || typeof locationQuery !== 'string' || !locationQuery.trim()) {
    return null;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GEOCODE_TIMEOUT_MS);

  try {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', locationQuery.trim());
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '1');

    const response = await fetch(url.toString(), {
      headers: { 'User-Agent': NOMINATIM_USER_AGENT },
      signal: controller.signal
    });

    if (!response.ok) {
      console.warn(`[Geocoder] Nominatim responded with HTTP ${response.status}`);
      return null;
    }

    const results = await response.json();
    if (!Array.isArray(results) || results.length === 0) {
      console.warn(`[Geocoder] No results for: ${locationQuery.trim()}`);
      return null;
    }

    const lat = parseFloat(results[0].lat);
    const lon = parseFloat(results[0].lon);
    if (
      isNaN(lat) || isNaN(lon) ||
      lat < -90 || lat > 90 ||
      lon < -180 || lon > 180
    ) {
      console.warn('[Geocoder] Invalid coordinates in Nominatim response');
      return null;
    }

    return { latitude: lat, longitude: lon };
  } catch (err) {
    const message = err && err.name === 'AbortError' ? 'request timed out' : (err.message || String(err));
    console.warn(`[Geocoder] Failed for "${locationQuery.trim()}": ${message}`);
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

module.exports = { geocodeAreaLocation };
