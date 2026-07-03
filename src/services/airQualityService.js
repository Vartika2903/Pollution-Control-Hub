const BACKEND_URL = 'http://localhost:5000/api/air-quality';

export async function fetchAirQualityByCoords(lat, lon) {
  if (typeof lat !== 'number' || typeof lon !== 'number') {
    throw new Error('Invalid coordinates provided.');
  }

  const response = await fetch(`${BACKEND_URL}?lat=${lat}&lon=${lon}`);
  if (!response.ok) {
    throw new Error('Failed to fetch live AQI data from backend.');
  }
  return await response.json();
}

export async function fetchCityComparisons() {
  const response = await fetch(`${BACKEND_URL}/cities`);
  if (!response.ok) {
    throw new Error('Failed to fetch city comparisons from backend.');
  }
  return await response.json();
}

export function estimateExposureTime(trend, currentAQI, threshold = 120) {

  if (!trend.length) {
    return null;
  }

  if (currentAQI >= threshold) {
    return {
      message: "Already above the recommended exposure threshold.",
      estimated: true
    };
  }

  const firstAQI = trend[0].us_aqi;
  const lastAQI = trend[trend.length - 1].us_aqi;

  // Average AQI change , per hour over the last 24 hrs 
  const slope = (lastAQI - firstAQI) / (trend.length - 1);

  if (slope <= 0) {
    return {
      message: "No immediate risk escalation expected.",
      estimated: true
    };
  }

  const remainingAQI = threshold - currentAQI;
  const estimatedHours = remainingAQI / slope;

  if (estimatedHours < 1) {

    const estimatedMinutes = Math.max(1, Math.round(estimatedHours * 60));

    return {
      message: `Likely safe for ~${estimatedMinutes} minutes.`,
      estimated: true
    };
  }

  if (estimatedHours <= 24) {
    return {
      message: `Likely safe for ~${Math.round(estimatedHours)} hours.`,
      estimated: true
    };
  }

  return {
    message: "Likely Safe for several hours",
    estimated: true
  };

}
