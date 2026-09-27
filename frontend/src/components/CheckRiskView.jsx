import React, { useState } from 'react';
import { translations } from '../i18n.js';

export default function CheckRiskView({ onReportWithSymptoms, lang }) {
  const t = translations[lang] || translations.en;

  const [answers, setAnswers] = useState({
    fever: false,
    headache: false,
    rash: false,
    outdoor_exposure: false,
    eschar: false
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const toggleSymptom = (key) => {
    setAnswers((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleEvaluate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/risk-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(answers)
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error('Risk evaluation failed:', err);
      setError(lang === 'ta' ? 'மதிப்பீடு செய்ய முடியவில்லை. மீண்டும் முயற்சிக்கவும்.' : 'Unable to complete check. Please verify connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setAnswers({
      fever: false,
      headache: false,
      rash: false,
      outdoor_exposure: false,
      eschar: false
    });
    setResult(null);
    setError(null);
  };

  // Get action advice in the current language
  const getActionAdvice = (level) => {
    if (level === 'HIGH') return t.checkRisk.highAction;
    if (level === 'MODERATE') return t.checkRisk.modAction;
    return t.checkRisk.lowAction;
  };

  return (
    <div style={{ maxWidth: 740, margin: '0 auto' }}>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>🩺</span> {t.checkRisk.title}
          </h2>
          <p className="card-subtitle">{t.checkRisk.subtitle}</p>
        </div>

        {error && (
          <div style={{ background: 'var(--alert-red-light)', border: '1px solid var(--alert-red-border)', color: 'var(--alert-red-text)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.875rem' }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleEvaluate}>
          {/* Question 1: Fever */}
          <div
            className={`checkbox-card ${answers.fever ? 'selected' : ''}`}
            onClick={() => toggleSymptom('fever')}
          >
            <input
              type="checkbox"
              id="q_fever"
              checked={answers.fever}
              onChange={() => {}}
            />
            <div style={{ flex: 1 }}>
              <div className="checkbox-card-title">{t.checkRisk.q1_title}</div>
              <p className="checkbox-card-desc">{t.checkRisk.q1_desc}</p>
            </div>
          </div>

          {/* Question 2: Headache / Body Pain */}
          <div
            className={`checkbox-card ${answers.headache ? 'selected' : ''}`}
            onClick={() => toggleSymptom('headache')}
          >
            <input
              type="checkbox"
              id="q_headache"
              checked={answers.headache}
              onChange={() => {}}
            />
            <div style={{ flex: 1 }}>
              <div className="checkbox-card-title">{t.checkRisk.q2_title}</div>
              <p className="checkbox-card-desc">{t.checkRisk.q2_desc}</p>
            </div>
          </div>

          {/* Question 3: Rash */}
          <div
            className={`checkbox-card ${answers.rash ? 'selected' : ''}`}
            onClick={() => toggleSymptom('rash')}
          >
            <input
              type="checkbox"
              id="q_rash"
              checked={answers.rash}
              onChange={() => {}}
            />
            <div style={{ flex: 1 }}>
              <div className="checkbox-card-title">{t.checkRisk.q3_title}</div>
              <p className="checkbox-card-desc">{t.checkRisk.q3_desc}</p>
            </div>
          </div>

          {/* Question 4: Outdoor vegetation */}
          <div
            className={`checkbox-card ${answers.outdoor_exposure ? 'selected' : ''}`}
            onClick={() => toggleSymptom('outdoor_exposure')}
          >
            <input
              type="checkbox"
              id="q_outdoor"
              checked={answers.outdoor_exposure}
              onChange={() => {}}
            />
            <div style={{ flex: 1 }}>
              <div className="checkbox-card-title">{t.checkRisk.q4_title}</div>
              <p className="checkbox-card-desc">{t.checkRisk.q4_desc}</p>
            </div>
          </div>

          {/* Question 5: Eschar Lesion */}
          <div
            className={`checkbox-card ${answers.eschar ? 'selected' : ''}`}
            onClick={() => toggleSymptom('eschar')}
            style={{
              backgroundColor: answers.eschar ? 'var(--coral-light)' : undefined,
              borderColor: answers.eschar ? 'var(--coral-border)' : undefined
            }}
          >
            <input
              type="checkbox"
              id="q_eschar"
              checked={answers.eschar}
              onChange={() => {}}
            />
            <div style={{ flex: 1 }}>
              <div className="checkbox-card-title" style={{ color: answers.eschar ? 'var(--coral)' : undefined }}>
                {t.checkRisk.q5_title}
              </div>
              <p className="checkbox-card-desc">{t.checkRisk.q5_desc}</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
            <button
              type="submit"
              className="btn btn-sage"
              disabled={loading}
              style={{ flex: 1, minWidth: 200 }}
            >
              {loading ? t.checkRisk.btnCalculating : t.checkRisk.btnCalculate}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleReset}
            >
              {t.checkRisk.btnReset}
            </button>
          </div>
        </form>

        {/* Evaluation Results Display */}
        {result && (
          <div style={{ marginTop: '1.75rem', padding: '1.25rem', background: 'var(--bg-card-soft)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  {t.checkRisk.resultTitle}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
                  <span className={`badge-risk ${result.riskLevel}`} style={{ fontSize: '0.95rem', padding: '0.35rem 0.85rem' }}>
                    ● {t.levels[result.riskLevel]}
                  </span>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    ({t.checkRisk.score}: {result.score} / {result.maxScore})
                  </span>
                </div>
              </div>
            </div>

            {/* WHAT SHOULD I DO NOW? ACTION CARD */}
            <div className={`action-now-card ${result.riskLevel.toLowerCase()}`}>
              <div className="action-now-title">
                👉 {t.checkRisk.whatShouldIDo}
              </div>
              <p className="action-now-text">
                {getActionAdvice(result.riskLevel)}
              </p>
            </div>

            {/* Proceed to Report Symptoms Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button
                className="btn btn-sky"
                onClick={() => onReportWithSymptoms(answers)}
              >
                {t.checkRisk.transferBtn}
              </button>
            </div>
          </div>
        )}

        {/* Mandatory Medical Disclaimer */}
        <div className="disclaimer-box">
          <span style={{ fontSize: '1.1rem' }}>ℹ️</span>
          <div>{t.checkRisk.disclaimer}</div>
        </div>
      </div>
    </div>
  );
}
