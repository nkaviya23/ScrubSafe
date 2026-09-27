/**
 * ScrubSafe Rule-Based Risk Engine
 * 
 * Rules for Scrub Typhus Early Risk Assessment:
 * - Fever: +2
 * - Headache / Body pain: +1
 * - Rash: +2
 * - Outdoor exposure (tall grass/farm/brush): +2
 * - Eschar-like lesion (cigarette-burn dark scab): +3
 * 
 * Total Score Thresholds:
 * - 0 to 2: LOW
 * - 3 to 5: MODERATE
 * - 6+: HIGH
 */

const SYMPTOM_WEIGHTS = {
  fever: {
    points: 2,
    name: 'Fever',
    description: 'High temperature, often with chills.'
  },
  headache: {
    points: 1,
    name: 'Headache / Body Pain',
    description: 'Severe headache or body aches.'
  },
  rash: {
    points: 2,
    name: 'Skin Rash',
    description: 'Red or pink spots across the body or limbs.'
  },
  outdoor_exposure: {
    points: 2,
    name: 'Outdoor / Vegetation Exposure',
    description: 'Recent time spent in overgrown grass, farm fields, or bushes.'
  },
  eschar: {
    points: 3,
    name: 'Black Scab / Eschar Lesion',
    description: 'A small, painless dark crust resembling a cigarette burn mark.'
  }
};

const DISCLAIMER = "This tool provides a risk indication, not a medical diagnosis.";

function calculateRisk(symptoms = {}) {
  const normalized = {
    fever: Boolean(symptoms.fever == true || symptoms.fever === 1 || symptoms.fever === '1' || symptoms.fever === 'true'),
    headache: Boolean(symptoms.headache == true || symptoms.headache === 1 || symptoms.headache === '1' || symptoms.headache === 'true'),
    rash: Boolean(symptoms.rash == true || symptoms.rash === 1 || symptoms.rash === '1' || symptoms.rash === 'true'),
    outdoor_exposure: Boolean(symptoms.outdoor_exposure == true || symptoms.outdoor_exposure === 1 || symptoms.outdoor_exposure === '1' || symptoms.outdoor_exposure === 'true' || symptoms.outdoorExposure == true),
    eschar: Boolean(symptoms.eschar == true || symptoms.eschar === 1 || symptoms.eschar === '1' || symptoms.eschar === 'true')
  };

  let score = 0;
  const factors = [];

  for (const [key, meta] of Object.entries(SYMPTOM_WEIGHTS)) {
    if (normalized[key]) {
      score += meta.points;
      factors.push({
        key,
        name: meta.name,
        points: meta.points,
        description: meta.description
      });
    }
  }

  const maxScore = Object.values(SYMPTOM_WEIGHTS).reduce((sum, item) => sum + item.points, 0); // 10

  let riskLevel = 'LOW';
  let recommendation = '';
  let whatShouldIDo = '';

  if (score >= 6) {
    riskLevel = 'HIGH';
    whatShouldIDo = 'Your reported symptoms and exposure factors indicate that you should seek medical advice promptly.';
    recommendation = whatShouldIDo;
  } else if (score >= 3) {
    riskLevel = 'MODERATE';
    whatShouldIDo = 'Take precautions, avoid unnecessary exposure to grass and vegetation, and monitor your symptoms. Consider speaking with a healthcare professional if symptoms persist.';
    recommendation = whatShouldIDo;
  } else {
    riskLevel = 'LOW';
    whatShouldIDo = 'Continue prevention and monitor your health.';
    recommendation = whatShouldIDo;
  }

  return {
    riskLevel,
    score,
    maxScore,
    factors,
    recommendation,
    whatShouldIDo,
    disclaimer: DISCLAIMER,
    evaluatedAt: new Date().toISOString()
  };
}

module.exports = {
  calculateRisk,
  SYMPTOM_WEIGHTS,
  DISCLAIMER
};
