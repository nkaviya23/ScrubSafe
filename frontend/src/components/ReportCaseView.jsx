import React, { useState, useEffect } from 'react';
import { translations } from '../i18n.js';
import VoiceInput from './VoiceInput.jsx';

export default function ReportCaseView({ initialSymptoms, onReportSuccess, setActiveTab, lang }) {
  const t = translations[lang] || translations.en;

  const [formData, setFormData] = useState({
    state: '',
    district: '',
    village: '',
    landmark: '',
    fever: false,
    headache: false,
    rash: false,
    outdoor_exposure: false,
    eschar: false,
    notes: ''
  });

  // Coordinates held ONLY in memory in the background, never displayed to the user
  const [backgroundCoords, setBackgroundCoords] = useState(null);
  const [locStatus, setLocStatus] = useState(null); // 'detecting', 'success', 'denied'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submittedReport, setSubmittedReport] = useState(null);

  useEffect(() => {
    if (initialSymptoms) {
      setFormData((prev) => ({
        ...prev,
        fever: Boolean(initialSymptoms.fever),
        headache: Boolean(initialSymptoms.headache),
        rash: Boolean(initialSymptoms.rash),
        outdoor_exposure: Boolean(initialSymptoms.outdoor_exposure || initialSymptoms.outdoorExposure),
        eschar: Boolean(initialSymptoms.eschar)
      }));
    }
  }, [initialSymptoms]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (key) => {
    setFormData((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Capture GPS in the background without exposing coordinates to user
  const handleUseCurrentLocation = () => {
    if ('geolocation' in navigator) {
      setLocStatus('detecting');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setBackgroundCoords({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude
          });
          setLocStatus('success');
        },
        (err) => {
          console.warn('Geolocation denied or unavailable:', err);
          setBackgroundCoords(null);
          setLocStatus('denied');
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    } else {
      setLocStatus('denied');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate that at least Village/Town or District is entered
    if (!formData.village.trim() && !formData.district.trim()) {
      setError(lang === 'ta' ? 'தயவுசெய்து உங்கள் கிராமம் அல்லது மாவட்டத்தின் பெயரை உள்ளிடவும்.' : 'Please enter your village, town, or district name.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        state: formData.state.trim() || (lang === 'ta' ? 'தமிழ்நாடு' : 'Tamil Nadu'),
        district: formData.district.trim(),
        village: formData.village.trim(),
        landmark: formData.landmark.trim(),
        fever: formData.fever,
        headache: formData.headache,
        rash: formData.rash,
        outdoor_exposure: formData.outdoor_exposure,
        eschar: formData.eschar,
        notes: formData.notes.trim()
      };

      // Include background GPS coordinates if granted
      if (backgroundCoords) {
        payload.latitude = backgroundCoords.latitude;
        payload.longitude = backgroundCoords.longitude;
      }

      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit report');
      }

      setSubmittedReport(data);
      if (onReportSuccess) {
        onReportSuccess(data);
      }
    } catch (err) {
      console.error('Submission error:', err);
      setError(err.message || 'Error saving report. Please verify connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetForNew = () => {
    setSubmittedReport(null);
    setBackgroundCoords(null);
    setLocStatus(null);
    setFormData({
      state: '',
      district: '',
      village: '',
      landmark: '',
      fever: false,
      headache: false,
      rash: false,
      outdoor_exposure: false,
      eschar: false,
      notes: ''
    });
  };

  return (
    <div style={{ maxWidth: 740, margin: '0 auto' }}>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>📍</span> {t.report.title}
          </h2>
          <p className="card-subtitle">{t.report.subtitle}</p>
        </div>

        {/* Success Modal / Banner */}
        {submittedReport && (
          <div style={{ background: 'var(--sage-light)', border: '1px solid var(--sage-border)', padding: '1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
              <span style={{ fontSize: '1.75rem' }}>✅</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, color: '#2d533a', fontSize: '1.05rem' }}>
                  {t.report.successTitle}
                </div>
                <p style={{ fontSize: '0.85rem', color: '#3a694a', margin: '0.35rem 0' }}>
                  {t.report.successDesc}
                </p>
                <div style={{ fontFamily: 'monospace', fontSize: '1.15rem', fontWeight: 800, color: 'var(--sage)', background: '#ffffff', display: 'inline-block', padding: '0.25rem 0.75rem', borderRadius: '6px', border: '1px dashed var(--sage)' }}>
                  {submittedReport.reportId}
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-sage"
                    style={{ fontSize: '0.825rem', padding: '0.4rem 0.85rem' }}
                    onClick={() => setActiveTab('map')}
                  >
                    🗺️ {t.report.btnViewMap}
                  </button>
                  <button
                    className="btn btn-secondary"
                    style={{ fontSize: '0.825rem', padding: '0.4rem 0.85rem' }}
                    onClick={handleResetForNew}
                  >
                    ➕ {t.report.btnSubmitAnother}
                  </button>
                  <button
                    className="btn btn-sky"
                    style={{ fontSize: '0.825rem', padding: '0.4rem 0.85rem' }}
                    onClick={() => setActiveTab('radar')}
                  >
                    🛰️ {t.report.btnViewRadar}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div style={{ background: 'var(--alert-red-light)', border: '1px solid var(--alert-red-border)', color: 'var(--alert-red-text)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Section 1: Location Information (No Lat/Long exposed) */}
          <div style={{ background: 'var(--bg-card-soft)', padding: '1.15rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: '1.5rem' }}>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span>🏡 {t.report.locationSection}</span>

              {/* Optional GPS Location Button */}
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                onClick={handleUseCurrentLocation}
              >
                {locStatus === 'detecting' ? '...' : t.report.btnUseLocation}
              </button>
            </div>

            {/* GPS Feedback Notice */}
            {locStatus === 'success' && (
              <div style={{ background: 'var(--sage-light)', color: '#2d533a', border: '1px solid var(--sage-border)', padding: '0.4rem 0.75rem', borderRadius: '6px', fontSize: '0.78rem', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                {t.report.locDetected}
              </div>
            )}
            {locStatus === 'denied' && (
              <div style={{ background: 'var(--yellow-light)', color: 'var(--yellow-text)', border: '1px solid var(--yellow-border)', padding: '0.4rem 0.75rem', borderRadius: '6px', fontSize: '0.78rem', marginBottom: '0.85rem' }}>
                ℹ️ {t.report.locDenied}
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">{t.report.state} *</label>
                <input
                  type="text"
                  name="state"
                  className="form-input"
                  placeholder={t.report.statePlaceholder}
                  value={formData.state}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t.report.district} *</label>
                <input
                  type="text"
                  name="district"
                  className="form-input"
                  placeholder={t.report.districtPlaceholder}
                  value={formData.district}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">{t.report.village} *</label>
                <input
                  type="text"
                  name="village"
                  className="form-input"
                  placeholder={t.report.villagePlaceholder}
                  value={formData.village}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t.report.landmark}</label>
                <input
                  type="text"
                  name="landmark"
                  className="form-input"
                  placeholder={t.report.landmarkPlaceholder}
                  value={formData.landmark}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Observed Symptoms & Exposures */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ marginBottom: '0.65rem' }}>
              🩺 {t.report.symptomsSection}:
            </label>

            <div
              className={`checkbox-card ${formData.fever ? 'selected' : ''}`}
              onClick={() => handleCheckboxChange('fever')}
            >
              <input type="checkbox" checked={formData.fever} onChange={() => {}} />
              <div style={{ flex: 1 }}>
                <div className="checkbox-card-title">{t.report.fever}</div>
                <div className="checkbox-card-desc">{t.report.feverDesc}</div>
              </div>
            </div>

            <div
              className={`checkbox-card ${formData.headache ? 'selected' : ''}`}
              onClick={() => handleCheckboxChange('headache')}
            >
              <input type="checkbox" checked={formData.headache} onChange={() => {}} />
              <div style={{ flex: 1 }}>
                <div className="checkbox-card-title">{t.report.headache}</div>
                <div className="checkbox-card-desc">{t.report.headacheDesc}</div>
              </div>
            </div>

            <div
              className={`checkbox-card ${formData.rash ? 'selected' : ''}`}
              onClick={() => handleCheckboxChange('rash')}
            >
              <input type="checkbox" checked={formData.rash} onChange={() => {}} />
              <div style={{ flex: 1 }}>
                <div className="checkbox-card-title">{t.report.rash}</div>
                <div className="checkbox-card-desc">{t.report.rashDesc}</div>
              </div>
            </div>

            <div
              className={`checkbox-card ${formData.outdoor_exposure ? 'selected' : ''}`}
              onClick={() => handleCheckboxChange('outdoor_exposure')}
            >
              <input type="checkbox" checked={formData.outdoor_exposure} onChange={() => {}} />
              <div style={{ flex: 1 }}>
                <div className="checkbox-card-title">{t.report.outdoor}</div>
                <div className="checkbox-card-desc">{t.report.outdoorDesc}</div>
              </div>
            </div>

            <div
              className={`checkbox-card ${formData.eschar ? 'selected' : ''}`}
              onClick={() => handleCheckboxChange('eschar')}
              style={{
                backgroundColor: formData.eschar ? 'var(--coral-light)' : undefined,
                borderColor: formData.eschar ? 'var(--coral-border)' : undefined
              }}
            >
              <input type="checkbox" checked={formData.eschar} onChange={() => {}} />
              <div style={{ flex: 1 }}>
                <div className="checkbox-card-title" style={{ color: formData.eschar ? 'var(--coral)' : undefined }}>
                  {t.report.eschar}
                </div>
                <div className="checkbox-card-desc">{t.report.escharDesc}</div>
              </div>
            </div>
          </div>

          {/* Section 3: Notes with Voice Input */}
          <div className="form-group">
            <label className="form-label">{t.report.notesLabel}</label>
            <VoiceInput
              lang={lang}
              onTextChange={(value) => {
                setFormData((prev) => ({ ...prev, notes: value }));
              }}
              placeholder={t.report.notesPlaceholder}
            />
          </div>

          {/* Privacy Note */}
          <div style={{ background: 'var(--bg-card-soft)', border: '1px solid var(--border)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span>🔒</span>
            <div>{t.report.privacyNote}</div>
          </div>

          <button
            type="submit"
            className="btn btn-sage"
            disabled={loading}
            style={{ width: '100%', padding: '0.85rem' }}
          >
            {loading ? t.report.btnSubmitting : `🚀 ${t.report.btnSubmit}`}
          </button>
        </form>
      </div>
    </div>
  );
}
