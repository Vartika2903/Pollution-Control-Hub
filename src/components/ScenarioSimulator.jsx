import { useState } from 'react';
import { getAQIBand } from '../services/airQualityService';

function subAqi(concentration, breakpoints) {
  for (const bp of breakpoints) {
    if (concentration >= bp.cLow && concentration <= bp.cHigh) {
      return Math.round(
        ((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (concentration - bp.cLow) + bp.iLow
      );
    }
  }
  return concentration > breakpoints[breakpoints.length - 1].cHigh ? 500 : 0;
}

const BP_PM25 = [
  { cLow: 0, cHigh: 12.0, iLow: 0, iHigh: 50 },
  { cLow: 12.1, cHigh: 35.4, iLow: 51, iHigh: 100 },
  { cLow: 35.5, cHigh: 55.4, iLow: 101, iHigh: 150 },
  { cLow: 55.5, cHigh: 150.4, iLow: 151, iHigh: 200 },
  { cLow: 150.5, cHigh: 250.4, iLow: 201, iHigh: 300 },
  { cLow: 250.5, cHigh: 500.4, iLow: 301, iHigh: 500 },
];

const BP_PM10 = [
  { cLow: 0, cHigh: 54, iLow: 0, iHigh: 50 },
  { cLow: 55, cHigh: 154, iLow: 51, iHigh: 100 },
  { cLow: 155, cHigh: 254, iLow: 101, iHigh: 150 },
  { cLow: 255, cHigh: 354, iLow: 151, iHigh: 200 },
  { cLow: 355, cHigh: 424, iLow: 201, iHigh: 300 },
  { cLow: 425, cHigh: 604, iLow: 301, iHigh: 500 },
];

const BP_NO2 = [
  { cLow: 0, cHigh: 100, iLow: 0, iHigh: 50 },
  { cLow: 102, cHigh: 188, iLow: 51, iHigh: 100 },
  { cLow: 190, cHigh: 677, iLow: 101, iHigh: 150 },
  { cLow: 679, cHigh: 1220, iLow: 151, iHigh: 200 },
  { cLow: 1222, cHigh: 2348, iLow: 201, iHigh: 300 },
  { cLow: 2350, cHigh: 3852, iLow: 301, iHigh: 500 },
];

const BP_O3 = [
  { cLow: 0, cHigh: 116, iLow: 0, iHigh: 50 },
  { cLow: 118, cHigh: 147, iLow: 51, iHigh: 100 },
  { cLow: 149, cHigh: 186, iLow: 101, iHigh: 150 },
  { cLow: 188, cHigh: 225, iLow: 151, iHigh: 200 },
  { cLow: 227, cHigh: 733, iLow: 201, iHigh: 300 },
];

const BP_CO = [
  { cLow: 0, cHigh: 4700, iLow: 0, iHigh: 50 },
  { cLow: 4701, cHigh: 9800, iLow: 51, iHigh: 100 },
  { cLow: 9801, cHigh: 14700, iLow: 101, iHigh: 150 },
  { cLow: 14701, cHigh: 19600, iLow: 151, iHigh: 200 },
  { cLow: 19601, cHigh: 34300, iLow: 201, iHigh: 300 },
  { cLow: 34301, cHigh: 51500, iLow: 301, iHigh: 500 },
];

function estimateAQI(pm25, pm10, no2, o3, co) {
  const scores = [
    subAqi(pm25, BP_PM25),
    subAqi(pm10, BP_PM10),
    subAqi(no2, BP_NO2),
    subAqi(o3, BP_O3),
    subAqi(co, BP_CO),
  ];
  return Math.max(...scores);
}

export default function ScenarioSimulator({ current }) {
  const [pm25Reduction, setPm25Reduction] = useState(0);
  const [no2Reduction, setNo2Reduction] = useState(0);
  const [o3Reduction, setO3Reduction] = useState(0);

  const reducedPm25 = current.pm2_5 * (1 - pm25Reduction / 100);
  const reducedNo2 = current.nitrogen_dioxide * (1 - no2Reduction / 100);
  const reducedO3 = current.ozone * (1 - o3Reduction / 100);

  const estimatedAqi = estimateAQI(
    Math.round(reducedPm25),
    current.pm10,
    Math.round(reducedNo2),
    Math.round(reducedO3),
    current.carbon_monoxide
  );

  const currentBand = getAQIBand(current.us_aqi);
  const estimatedBand = getAQIBand(estimatedAqi);

  const improvement =
    current.us_aqi > 0
      ? Math.round(((current.us_aqi - estimatedAqi) / current.us_aqi) * 100)
      : 0;

  return (
    <section className="panel scenario-simulator">
      <div className="panel-head">
        <h2>Scenario Simulator</h2>
        <p>Adjust sliders to see how interventions could improve AQI</p>
      </div>

      <div className="simulator-track">
        <div className="sim-comparison">
          <div className="sim-current">
            <span className="sim-label">Current AQI</span>
            <span className="sim-value" style={{ color: currentBand.color }}>
              {current.us_aqi}
            </span>
            <span className="sim-band">{currentBand.label}</span>
          </div>
          <div className="sim-vs">vs</div>
          <div className="sim-estimated">
            <span className="sim-label">Estimated AQI</span>
            <span className="sim-value" style={{ color: estimatedBand.color }}>
              {estimatedAqi}
            </span>
            <span className="sim-band">{estimatedBand.label}</span>
            {improvement > 0 && <span className="sim-improvement">-{improvement}%</span>}
          </div>
        </div>
      </div>

      <div className="sim-sliders">
        <div className="sim-slider-group">
          <label>
            Reduce PM2.5
            <span className="sim-slider-value">{pm25Reduction}%</span>
          </label>
          <input
            type="range"
            min={0}
            max={50}
            step={5}
            value={pm25Reduction}
            onChange={(e) => setPm25Reduction(Number(e.target.value))}
          />
          <div className="sim-slider-range">
            <span>Current: {current.pm2_5} µg/m³</span>
            <span>Target: {Math.round(reducedPm25)} µg/m³</span>
          </div>
        </div>

        <div className="sim-slider-group">
          <label>
            Reduce NO₂
            <span className="sim-slider-value">{no2Reduction}%</span>
          </label>
          <input
            type="range"
            min={0}
            max={50}
            step={5}
            value={no2Reduction}
            onChange={(e) => setNo2Reduction(Number(e.target.value))}
          />
          <div className="sim-slider-range">
            <span>Current: {current.nitrogen_dioxide} µg/m³</span>
            <span>Target: {Math.round(reducedNo2)} µg/m³</span>
          </div>
        </div>

        <div className="sim-slider-group">
          <label>
            Reduce Ozone
            <span className="sim-slider-value">{o3Reduction}%</span>
          </label>
          <input
            type="range"
            min={0}
            max={50}
            step={5}
            value={o3Reduction}
            onChange={(e) => setO3Reduction(Number(e.target.value))}
          />
          <div className="sim-slider-range">
            <span>Current: {current.ozone} µg/m³</span>
            <span>Target: {Math.round(reducedO3)} µg/m³</span>
          </div>
        </div>
      </div>
    </section>
  );
}
