'use client';

import { useTelemetry, TELEMETRY_ITEMS } from './TelemetryContext';

export default function ISSDataExtended() {
  // Use the telemetry context instead of managing state internally
  const { telemetryItems, signalStatus, signalClass } = useTelemetry();

  return (
    <div className="card shadow">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="card-title mb-0">ISS Telemetry Data</h5>
        <span className={`badge ${signalClass} text-white`}>
          {signalStatus}
        </span>
      </div>
      
      <div className="card-body">
        <div className="row row-cols-1 row-cols-md-2 g-4">
          {TELEMETRY_ITEMS.map(item => {
            const telemetry = telemetryItems[item.id];
            return (
              <div key={item.id} className="col">
                <div className="card h-100 bg-light">
                  <div className="card-body">
                    <h5 className="card-title" style={{ color: "black" }}>{item.name}</h5>
                    <p className="display-6 text-center text-mono" style={{ color: "black" }}>
                      {telemetry?.value || "Loading..."}
                      {telemetry?.unit && <small className="ms-1">{telemetry.unit}</small>}
                    </p>
                    <p className="card-text text-muted small text-center">
                      Timestamp: {telemetry?.timestamp || "Loading..."}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card-footer text-center text-white small" style={{ color: "white" }}>
        Live data from International Space Station via Lightstreamer
      </div>
    </div>
  );
}
