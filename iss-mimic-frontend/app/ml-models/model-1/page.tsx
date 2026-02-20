'use client';

import { useState } from 'react';
import Link from 'next/link';
import { predictHemisphere, getModelExplanation } from '@/utils/hemisphereModel';
import { useIssPosition } from '@/contexts/IssPositionContext';

export default function Model1() {
  const { position, isLoading: positionLoading } = useIssPosition();
  const [longitude, setLongitude] = useState<string>('');
  const [latitude, setLatitude] = useState<string>('');
  const [prediction, setPrediction] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [showExplanation, setShowExplanation] = useState<boolean>(false);

  const handlePredict = () => {
    setError('');
    setPrediction(null);

    const lon = parseFloat(longitude);
    const lat = parseFloat(latitude);

    if (isNaN(lon) || isNaN(lat)) {
      setError('Please enter valid numeric values for both longitude and latitude');
      return;
    }

    try {
      const result = predictHemisphere(lon, lat);
      setPrediction(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Prediction failed');
    }
  };

  const handleUseLiveISS = () => {
    if (position) {
      setLongitude(position.lon.toFixed(6));
      setLatitude(position.lat.toFixed(6));
      setError('');
      setPrediction(null);
    }
  };

  const handleClear = () => {
    setLongitude('');
    setLatitude('');
    setPrediction(null);
    setError('');
  };

  const explanation = getModelExplanation();

  return (
    <>
      <style jsx>{`
        input::placeholder {
          color: #ffffff !important;
          opacity: 0.7;
        }
      `}</style>
      <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-10">
          <div className="card shadow-lg">
            <div className="card-body p-5">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                  <h1 className="card-title mb-2">ISS Hemisphere Classifier</h1>
                  <p className="text-muted mb-0">Logistic Regression Model</p>
                </div>
                <Link href="/ml-models" className="btn btn-outline-secondary">
                  Back to Models
                </Link>
              </div>

              <div className="alert alert-info mb-4" role="alert">
                <strong>About this model:</strong> This machine learning model predicts whether the ISS is in the Northern or Southern hemisphere based on its coordinates. Trained on real ISS telemetry data from Kaggle.
              </div>

              {/* Input Section */}
              <div className="card mb-4 bg-light text-dark">
                <div className="card-body">
                  <h5 className="card-title mb-3 text-dark">Enter Coordinates</h5>

                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label htmlFor="longitude" className="form-label fw-bold text-dark">
                        Longitude
                      </label>
                      <input
                        type="number"
                        id="longitude"
                        className="form-control text-white"
                        placeholder="Enter longitude (-180 to 180)"
                        value={longitude}
                        onChange={(e) => setLongitude(e.target.value)}
                        min="-180"
                        max="180"
                        step="1"
                      />
                      <small className="form-text text-muted">Range: -180 to 180</small>
                    </div>

                    <div className="col-md-6">
                      <label htmlFor="latitude" className="form-label fw-bold text-dark">
                        Latitude
                      </label>
                      <input
                        type="number"
                        id="latitude"
                        className="form-control text-white"
                        placeholder="Enter latitude (-90 to 90)"
                        value={latitude}
                        onChange={(e) => setLatitude(e.target.value)}
                        min="-90"
                        max="90"
                        step="1"
                      />
                      <small className="form-text text-muted">Range: -90 to 90</small>
                    </div>
                  </div>

                  <div className="d-flex gap-2 flex-wrap">
                    <button
                      className="btn btn-primary"
                      onClick={handlePredict}
                      disabled={!longitude || !latitude}
                    >
                      Predict Hemisphere
                    </button>
                    <button
                      className="btn btn-success"
                      onClick={handleUseLiveISS}
                      disabled={positionLoading || !position}
                    >
                      {positionLoading ? 'Loading ISS Position...' : 'Use Current ISS Position'}
                    </button>
                    <button className="btn btn-outline-secondary" onClick={handleClear}>
                      Clear
                    </button>
                  </div>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="alert alert-danger" role="alert">
                  <strong>Error:</strong> {error}
                </div>
              )}

              {/* Prediction Results */}
              {prediction && (
                <div className="card mb-4 border-success">
                  <div className="card-header bg-success text-white">
                    <h5 className="mb-0">Prediction Results</h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <h3 className="text-center mb-3">
                          <span className={`badge ${prediction.isNorthern ? 'bg-primary' : 'bg-warning'}`}>
                            {prediction.hemisphere} Hemisphere
                          </span>
                        </h3>
                        <div className="text-center">
                          <p className="mb-1">
                            <strong>Confidence:</strong> {prediction.confidencePercent}%
                          </p>
                          <div className="progress" style={{ height: '25px' }}>
                            <div
                              className={`progress-bar ${prediction.isNorthern ? 'bg-primary' : 'bg-warning'}`}
                              role="progressbar"
                              style={{ width: `${prediction.confidencePercent}%` }}
                              aria-valuenow={parseFloat(prediction.confidencePercent)}
                              aria-valuemin={0}
                              aria-valuemax={100}
                            >
                              {prediction.confidencePercent}%
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <h6 className="fw-bold mb-2">Detailed Probabilities:</h6>
                        <ul className="list-group">
                          <li className="list-group-item d-flex justify-content-between">
                            <span>Northern Hemisphere:</span>
                            <strong className="text-primary">
                              {(prediction.probabilityNorth * 100).toFixed(2)}%
                            </strong>
                          </li>
                          <li className="list-group-item d-flex justify-content-between">
                            <span>Southern Hemisphere:</span>
                            <strong className="text-warning">
                              {(prediction.probabilitySouth * 100).toFixed(2)}%
                            </strong>
                          </li>
                        </ul>
                        <div className="mt-3">
                          <small className="text-muted">
                            <strong>Z-score:</strong> {prediction.z.toFixed(6)}
                            <br />
                            <em>({prediction.z >= 0 ? 'Positive' : 'Negative'} → {prediction.hemisphere})</em>
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Model Explanation Section */}
              <div className="card">
                <div className="card-header bg-secondary text-white d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">How the Model Works</h5>
                  <button
                    className="btn btn-sm btn-light"
                    onClick={() => setShowExplanation(!showExplanation)}
                  >
                    {showExplanation ? 'Hide' : 'Show'} Details
                  </button>
                </div>
                {showExplanation && (
                  <div className="card-body">
                    <h6 className="fw-bold">Model Type:</h6>
                    <p>Logistic Regression (Binary Classifier)</p>

                    <h6 className="fw-bold mt-3">Features:</h6>
                    <ul>
                      <li>Longitude (scaled using mean and standard deviation)</li>
                      <li>Latitude (scaled using mean and standard deviation)</li>
                    </ul>

                    <h6 className="fw-bold mt-3">Decision Rule:</h6>
                    <p className="font-monospace small bg-light text-dark p-2 rounded">
                      {explanation.rule}
                    </p>

                    <h6 className="fw-bold mt-3">Probability Calculation:</h6>
                    <p className="font-monospace small bg-light text-dark p-2 rounded">
                      {explanation.probability}
                    </p>

                    <h6 className="fw-bold mt-3">Training Data:</h6>
                    <p>ISS Real-Time Tracker dataset (10-second interval) from Kaggle</p>

                    <h6 className="fw-bold mt-3">Model Coefficients:</h6>
                    <ul className="font-monospace small">
                      <li>w_longitude = -0.000996</li>
                      <li>w_latitude = 14.251515</li>
                      <li>bias = -0.337344</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
