'use client';

import { useState } from 'react';
import { useIssPosition } from '@/contexts/IssPositionContext';

const API_BASE = 'http://localhost:8000';

interface PredictionResult {
  input: { latitude: string; longitude: string };
  numeric: { latitude: number; longitude: number };
  is_nonsense: { latitude: boolean; longitude: boolean };
  prediction: string;
  probabilities: { [key: string]: number };
}

interface TrainResult {
  message: string;
  train_samples: number;
  test_samples: number;
  accuracy: number;
  report: string;
}

interface ModelInfo {
  model_loaded: boolean;
  default_model_exists: boolean;
  active_model_exists: boolean;
  training_data_available: boolean;
  logistic_model_loaded: boolean;
  default_logistic_model_exists: boolean;
  active_logistic_model_exists: boolean;
  logistic_training_data_available: boolean;
}

export default function MLModelPage() {
  const { position, isLoading: positionLoading } = useIssPosition();

  // Predict state
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [predicting, setPredicting] = useState(false);

  // Train / retrain state
  const [trainFile, setTrainFile] = useState<File | null>(null);
  const [trainResult, setTrainResult] = useState<TrainResult | null>(null);
  const [training, setTraining] = useState(false);

  // Logistic Regression state
  const [lrLatitude, setLrLatitude] = useState('');
  const [lrLongitude, setLrLongitude] = useState('');
  const [lrPrediction, setLrPrediction] = useState<PredictionResult | null>(null);
  const [lrPredicting, setLrPredicting] = useState(false);
  const [lrTrainFile, setLrTrainFile] = useState<File | null>(null);
  const [lrTrainResult, setLrTrainResult] = useState<TrainResult | null>(null);
  const [lrTraining, setLrTraining] = useState(false);
  const [lrPlotTimestamp, setLrPlotTimestamp] = useState<number>(Date.now());

  // Model info state
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [plotTimestamp, setPlotTimestamp] = useState<number>(Date.now());

  // General
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'predict' | 'train' | 'logistic' | 'info'>('predict');

  // ── Predict ──────────────────────────────────────────────────────────
  const handlePredict = async () => {
    setError('');
    setPrediction(null);
    setPredicting(true);

    try {
      const res = await fetch(`${API_BASE}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude, longitude }),
      });

      if (!res.ok) {
        const detail = await res.json().catch(() => null);
        throw new Error(detail?.detail ?? `Server error ${res.status}`);
      }

      const data: PredictionResult = await res.json();
      setPrediction(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Prediction failed');
    } finally {
      setPredicting(false);
    }
  };

  // ── Use live ISS position ────────────────────────────────────────────
  const handleUseLiveISS = () => {
    if (position) {
      setLatitude(position.lat.toFixed(6));
      setLongitude(position.lon.toFixed(6));
      setPrediction(null);
      setError('');
    }
  };

  // ── Predict (Logistic Regression) ───────────────────────────────────
  const handlePredictLogistic = async () => {
    setError('');
    setLrPrediction(null);
    setLrPredicting(true);

    try {
      const res = await fetch(`${API_BASE}/predict-logistic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude: lrLatitude, longitude: lrLongitude }),
      });

      if (!res.ok) {
        const detail = await res.json().catch(() => null);
        throw new Error(detail?.detail ?? `Server error ${res.status}`);
      }

      const data: PredictionResult = await res.json();
      setLrPrediction(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logistic prediction failed');
    } finally {
      setLrPredicting(false);
    }
  };

  // ── Use live ISS position (Logistic Regression) ─────────────────────
  const handleUseLiveISSLogistic = () => {
    if (position) {
      setLrLatitude(position.lat.toFixed(6));
      setLrLongitude(position.lon.toFixed(6));
      setLrPrediction(null);
      setError('');
    }
  };

  // ── Train ────────────────────────────────────────────────────────────
  const handleTrain = async () => {
    if (!trainFile) {
      setError('Please select a CSV file first.');
      return;
    }

    setError('');
    setTrainResult(null);
    setTraining(true);

    try {
      const formData = new FormData();
      formData.append('file', trainFile);

      const res = await fetch(`${API_BASE}/train`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const detail = await res.json().catch(() => null);
        throw new Error(detail?.detail ?? `Server error ${res.status}`);
      }

      const data: TrainResult = await res.json();
      setTrainResult(data);
      setPlotTimestamp(Date.now()); // Refresh plot visualization
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Training failed');
    } finally {
      setTraining(false);
    }
  };

  // ── Train (Logistic Regression) ──────────────────────────────────────
  const handleTrainLogistic = async () => {
    if (!lrTrainFile) {
      setError('Please select a CSV file for Logistic Regression first.');
      return;
    }

    setError('');
    setLrTrainResult(null);
    setLrTraining(true);

    try {
      const formData = new FormData();
      formData.append('file', lrTrainFile);

      const res = await fetch(`${API_BASE}/train-logistic`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const detail = await res.json().catch(() => null);
        throw new Error(detail?.detail ?? `Server error ${res.status}`);
      }

      const data: TrainResult = await res.json();
      setLrTrainResult(data);
      setLrPlotTimestamp(Date.now());
      fetchModelInfo();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logistic training failed');
    } finally {
      setLrTraining(false);
    }
  };

  // ── Download training data ───────────────────────────────────────────
  const handleDownload = () => {
    window.open(`${API_BASE}/download-training`, '_blank');
  };

  const handleDownloadLogistic = () => {
    window.open(`${API_BASE}/download-training-logistic`, '_blank');
  };

  // ── Model info ───────────────────────────────────────────────────────
  const fetchModelInfo = async () => {
    setError('');
    try {
      const res = await fetch(`${API_BASE}/model-info`);
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data: ModelInfo = await res.json();
      setModelInfo(data);
      setPlotTimestamp(Date.now()); // Refresh plot image
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reach API');
    }
  };

  // ── Clear ────────────────────────────────────────────────────────────
  const handleClear = () => {
    setLatitude('');
    setLongitude('');
    setPrediction(null);
    setError('');
  };

  const handleClearLogistic = () => {
    setLrLatitude('');
    setLrLongitude('');
    setLrPrediction(null);
    setError('');
  };

  // ── Helpers ──────────────────────────────────────────────────────────
  const northProb = prediction?.probabilities?.['Northern Hemisphere'] ?? 0;
  const southProb = prediction?.probabilities?.['Southern Hemisphere'] ?? 0;
  const isNorthern = prediction?.prediction === 'Northern Hemisphere';

  const lrNorthProb = lrPrediction?.probabilities?.['Northern Hemisphere'] ?? 0;
  const lrSouthProb = lrPrediction?.probabilities?.['Southern Hemisphere'] ?? 0;
  const lrIsNorthern = lrPrediction?.prediction === 'Northern Hemisphere';

  return (
    <>
      <style jsx>{`
        input::placeholder {
          color: #ffffff !important;
          opacity: 0.8;
        }
        input[type="file"] {
          color: #dce2e7;
        }
        input[type="file"]::file-selector-button {
          color: #000000;
        }
      `}</style>

      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-10">
            <div className="card shadow-lg">
              <div className="card-body p-5">
                {/* Header */}
                <div className="mb-4">
                  <h1 className="card-title mb-2">ISS Hemisphere Classifier</h1>
                  <p className="card-title mb-0">
                    KNN and Logistic Regression models served via FastAPI &mdash; train, retrain, and predict from the browser.
                  </p>
                </div>

                {/* Tabs */}
                <ul className="nav nav-tabs mb-4">
                  <li className="nav-item">
                    <button
                      className={`nav-link ${activeTab === 'predict' ? 'text-white active' : ''}`}
                      onClick={() => setActiveTab('predict')}
                    >
                      Predict
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`nav-link ${activeTab === 'train' ? 'text-white active' : ''}`}
                      onClick={() => setActiveTab('train')}
                    >
                      Train
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`nav-link ${activeTab === 'logistic' ? 'text-white active' : ''}`}
                      onClick={() => {
                        setActiveTab('logistic');
                        fetchModelInfo();
                      }}
                    >
                      Logistic Regression
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`nav-link ${activeTab === 'info' ? 'text-white active' : ''}`}
                      onClick={() => { setActiveTab('info'); fetchModelInfo(); }}
                    >
                      Model Info
                    </button>
                  </li>
                </ul>

                {/* Error banner */}
                {error && (
                  <div className="alert alert-danger" role="alert">
                    <strong>Error:</strong> {error}
                  </div>
                )}

                {/* ─── LOGISTIC REGRESSION TAB ─────────────────────────── */}
                {activeTab === 'logistic' && (
                  <>
                    <div className="card mb-4 bg-light text-dark">
                      <div className="card-body">
                        <h5 className="card-title mb-3 text-dark">Logistic Regression: Enter Coordinates</h5>
                        <p className="text-muted mb-3">
                          Logistic Regression learns a smooth linear boundary between classes.
                        </p>

                        <div className="row g-3 mb-3">
                          <div className="col-md-6">
                            <label htmlFor="lr-latitude" className="form-label fw-bold text-dark">
                              Latitude
                            </label>
                            <input
                              type="text"
                              id="lr-latitude"
                              className="form-control text-white"
                              placeholder="e.g. 40.7 or any text"
                              value={lrLatitude}
                              onChange={(e) => setLrLatitude(e.target.value)}
                            />
                          </div>

                          <div className="col-md-6">
                            <label htmlFor="lr-longitude" className="form-label fw-bold text-dark">
                              Longitude
                            </label>
                            <input
                              type="text"
                              id="lr-longitude"
                              className="form-control text-white"
                              placeholder="e.g. -74.0 or any text"
                              value={lrLongitude}
                              onChange={(e) => setLrLongitude(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="d-flex gap-2 flex-wrap">
                          <button
                            className="btn btn-primary"
                            onClick={handlePredictLogistic}
                            disabled={!lrLatitude || !lrLongitude || lrPredicting}
                          >
                            {lrPredicting ? 'Predicting…' : 'Predict with Logistic Regression'}
                          </button>
                          <button
                            className="btn btn-success"
                            onClick={handleUseLiveISSLogistic}
                            disabled={positionLoading || !position}
                          >
                            {positionLoading ? 'Loading ISS…' : 'Use Current ISS Position'}
                          </button>
                          <button className="btn btn-outline-secondary" onClick={handleClearLogistic}>
                            Clear
                          </button>
                        </div>
                      </div>
                    </div>

                    {lrPrediction && (
                      <div className="card mb-4 border-primary">
                        <div className="card-header bg-primary text-white">
                          <h5 className="mb-0">Logistic Regression Prediction Results</h5>
                        </div>
                        <div className="card-body">
                          <div className="row">
                            <div className="col-md-6 mb-3">
                              <h3 className="text-center mb-3">
                                <span className={`badge ${lrIsNorthern ? 'bg-primary' : 'bg-warning'}`}>
                                  {lrPrediction.prediction}
                                </span>
                              </h3>
                              <div className="text-center">
                                <p className="mb-1">
                                  <strong>Confidence:</strong>{' '}
                                  {(Math.max(lrNorthProb, lrSouthProb) * 100).toFixed(1)}%
                                </p>
                                <div className="progress" style={{ height: '25px' }}>
                                  <div
                                    className={`progress-bar ${lrIsNorthern ? 'bg-primary' : 'bg-warning'}`}
                                    role="progressbar"
                                    style={{ width: `${Math.max(lrNorthProb, lrSouthProb) * 100}%` }}
                                  >
                                    {(Math.max(lrNorthProb, lrSouthProb) * 100).toFixed(1)}%
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="col-md-6">
                              <h6 className="fw-bold mb-2">Probabilities:</h6>
                              <ul className="list-group mb-3">
                                <li className="list-group-item d-flex justify-content-between">
                                  <span>Northern Hemisphere</span>
                                  <strong className="text-primary">
                                    {(lrNorthProb * 100).toFixed(2)}%
                                  </strong>
                                </li>
                                <li className="list-group-item d-flex justify-content-between">
                                  <span>Southern Hemisphere</span>
                                  <strong className="text-warning">
                                    {(lrSouthProb * 100).toFixed(2)}%
                                  </strong>
                                </li>
                              </ul>

                              <h6 className="fw-bold mb-2">Input Details:</h6>
                              <ul className="list-group">
                                <li className="list-group-item d-flex justify-content-between">
                                  <span>Numeric latitude</span>
                                  <span>{lrPrediction.numeric.latitude}</span>
                                </li>
                                <li className="list-group-item d-flex justify-content-between">
                                  <span>Numeric longitude</span>
                                  <span>{lrPrediction.numeric.longitude}</span>
                                </li>
                              </ul>

                              {(lrPrediction.is_nonsense.latitude || lrPrediction.is_nonsense.longitude) && (
                                <div className="alert alert-warning mt-3 mb-0" role="alert">
                                  <strong>Warning:</strong> Non-numeric input detected
                                  {lrPrediction.is_nonsense.latitude && ' (latitude)'}
                                  {lrPrediction.is_nonsense.longitude && ' (longitude)'}
                                  . The model still produced a prediction &mdash; AI is not magic!
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="card mb-4 bg-light text-dark">
                      <div className="card-body">
                        <h5 className="card-title mb-3 text-dark">Train Logistic Regression</h5>
                        <p className="text-muted">
                          CSV must have columns: <code>latitude</code>, <code>longitude</code>, <code>classification</code><br />
                          Where classification is <em>&quot;Northern Hemisphere&quot;</em> or <em>&quot;Southern Hemisphere&quot;</em>.
                        </p>

                        <div className="mb-3">
                          <input
                            type="file"
                            className="form-control text-dark"
                            accept=".csv"
                            onChange={(e) => setLrTrainFile(e.target.files?.[0] ?? null)}
                          />
                        </div>

                        <div className="d-flex gap-2 flex-wrap">
                          <button
                            className="btn btn-primary"
                            onClick={handleTrainLogistic}
                            disabled={!lrTrainFile || lrTraining}
                          >
                            {lrTraining ? 'Training…' : 'Train Logistic Regression'}
                          </button>
                          <button
                            className="btn btn-outline-success"
                            onClick={handleDownloadLogistic}
                          >
                            Download Logistic Training Data
                          </button>
                        </div>
                      </div>
                    </div>

                    {lrTrainResult && (
                      <div className="card mb-4 border-primary">
                        <div className="card-header bg-primary text-white">
                          <h5 className="mb-0">Logistic Regression Training Results</h5>
                        </div>
                        <div className="card-body">
                          <div className="row mb-3">
                            <div className="col-md-4 text-center">
                              <h4>{lrTrainResult.train_samples}</h4>
                              <small className="text-muted">Train Samples</small>
                            </div>
                            <div className="col-md-4 text-center">
                              <h4>{lrTrainResult.test_samples}</h4>
                              <small className="text-muted">Test Samples</small>
                            </div>
                            <div className="col-md-4 text-center">
                              <h4>{(lrTrainResult.accuracy * 100).toFixed(1)}%</h4>
                              <small className="text-muted">Accuracy</small>
                            </div>
                          </div>
                          <h6 className="fw-bold">Classification Report:</h6>
                          <pre className="bg-dark text-light p-3 rounded" style={{ fontSize: '0.85rem' }}>
                            {lrTrainResult.report}
                          </pre>
                        </div>
                      </div>
                    )}

                    {modelInfo?.logistic_model_loaded && (
                      <div className="card bg-light text-dark mb-4">
                        <div className="card-body">
                          <h5 className="card-title mb-3 text-dark">Logistic Regression Decision Boundary</h5>
                          <p className="text-muted">
                            This plot shows how Logistic Regression interprets the data with a smooth linear boundary.
                          </p>
                          <div className="text-center">
                            <img
                              src={`${API_BASE}/plot-decision-boundary-logistic?t=${lrPlotTimestamp}`}
                              alt="Logistic Regression Decision Boundary Plot"
                              className="img-fluid rounded shadow"
                              style={{ maxWidth: '100%', height: 'auto' }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* ─── PREDICT TAB ─────────────────────────────────────── */}
                {activeTab === 'predict' && (
                  <>
                    <div className="card mb-4 bg-light text-dark">
                      <div className="card-body">
                        <h5 className="card-title mb-3 text-dark">Enter Coordinates</h5>

                        <div className="row g-3 mb-3">
                          <div className="col-md-6">
                            <label htmlFor="latitude" className="form-label fw-bold text-dark">
                              Latitude
                            </label>
                            <input
                              type="text"
                              id="latitude"
                              className="form-control text-white"
                              placeholder="e.g. 40.7 or any text"
                              value={latitude}
                              onChange={(e) => setLatitude(e.target.value)}
                            />
                            <small className="form-text text-muted">
                              Number or arbitrary text (to demo AI-isn&apos;t-magic)
                            </small>
                          </div>

                          <div className="col-md-6">
                            <label htmlFor="longitude" className="form-label fw-bold text-dark">
                              Longitude
                            </label>
                            <input
                              type="text"
                              id="longitude"
                              className="form-control text-white"
                              placeholder="e.g. -74.0 or any text"
                              value={longitude}
                              onChange={(e) => setLongitude(e.target.value)}
                            />
                            <small className="form-text text-muted">
                              Number or arbitrary text (to demo AI-isn&apos;t-magic)
                            </small>
                          </div>
                        </div>

                        <div className="d-flex gap-2 flex-wrap">
                          <button
                            className="btn btn-primary"
                            onClick={handlePredict}
                            disabled={!latitude || !longitude || predicting}
                          >
                            {predicting ? 'Predicting…' : 'Predict Hemisphere'}
                          </button>
                          <button
                            className="btn btn-success"
                            onClick={handleUseLiveISS}
                            disabled={positionLoading || !position}
                          >
                            {positionLoading ? 'Loading ISS…' : 'Use Current ISS Position'}
                          </button>
                          <button className="btn btn-outline-secondary" onClick={handleClear}>
                            Clear
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Prediction results */}
                    {prediction && (
                      <div className="card mb-4 border-success">
                        <div className="card-header bg-success text-white">
                          <h5 className="mb-0">Prediction Results</h5>
                        </div>
                        <div className="card-body">
                          <div className="row">
                            {/* Left: headline + confidence bar */}
                            <div className="col-md-6 mb-3">
                              <h3 className="text-center mb-3">
                                <span className={`badge ${isNorthern ? 'bg-primary' : 'bg-warning'}`}>
                                  {prediction.prediction}
                                </span>
                              </h3>
                              <div className="text-center">
                                <p className="mb-1">
                                  <strong>Confidence:</strong>{' '}
                                  {(Math.max(northProb, southProb) * 100).toFixed(1)}%
                                </p>
                                <div className="progress" style={{ height: '25px' }}>
                                  <div
                                    className={`progress-bar ${isNorthern ? 'bg-primary' : 'bg-warning'}`}
                                    role="progressbar"
                                    style={{ width: `${Math.max(northProb, southProb) * 100}%` }}
                                  >
                                    {(Math.max(northProb, southProb) * 100).toFixed(1)}%
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Right: probabilities + details */}
                            <div className="col-md-6">
                              <h6 className="fw-bold mb-2">Probabilities:</h6>
                              <ul className="list-group mb-3">
                                <li className="list-group-item d-flex justify-content-between">
                                  <span>Northern Hemisphere</span>
                                  <strong className="text-primary">
                                    {(northProb * 100).toFixed(2)}%
                                  </strong>
                                </li>
                                <li className="list-group-item d-flex justify-content-between">
                                  <span>Southern Hemisphere</span>
                                  <strong className="text-warning">
                                    {(southProb * 100).toFixed(2)}%
                                  </strong>
                                </li>
                              </ul>

                              <h6 className="fw-bold mb-2">Input Details:</h6>
                              <ul className="list-group">
                                <li className="list-group-item d-flex justify-content-between">
                                  <span>Numeric latitude</span>
                                  <span>{prediction.numeric.latitude}</span>
                                </li>
                                <li className="list-group-item d-flex justify-content-between">
                                  <span>Numeric longitude</span>
                                  <span>{prediction.numeric.longitude}</span>
                                </li>
                              </ul>

                              {(prediction.is_nonsense.latitude || prediction.is_nonsense.longitude) && (
                                <div className="alert alert-warning mt-3 mb-0" role="alert">
                                  <strong>Warning:</strong> Non-numeric input detected
                                  {prediction.is_nonsense.latitude && ' (latitude)'}
                                  {prediction.is_nonsense.longitude && ' (longitude)'}
                                  . The model still produced a prediction &mdash; AI is not magic!
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* ─── TRAIN TAB ───────────────────────────────────────── */}
                {activeTab === 'train' && (
                  <>
                    <div className="card mb-4 bg-light text-dark">
                      <div className="card-body">
                        <h5 className="card-title mb-3 text-dark">
                          Upload Training CSV
                        </h5>
                        <p className="text-muted">
                          CSV must have columns: <code>latitude</code>, <code>longitude</code>, <code>classification</code><br />
                          Where classification is <em>&quot;Northern Hemisphere&quot;</em> or <em>&quot;Southern Hemisphere&quot;</em>.
                        </p>

                        <div className="mb-3">
                          <input
                            type="file"
                            className="form-control text-dark"
                            accept=".csv"
                            onChange={(e) => setTrainFile(e.target.files?.[0] ?? null)}
                          />
                        </div>

                        <div className="d-flex gap-2 flex-wrap">
                          <button
                            className="btn btn-primary"
                            onClick={handleTrain}
                            disabled={!trainFile || training}
                          >
                            {training ? 'Training…' : 'Train Model'}
                          </button>
                          <button
                            className="btn btn-outline-success"
                            onClick={handleDownload}
                          >
                            Download Training Data
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Training results */}
                    {trainResult && (
                      <div className="card border-success">
                        <div className="card-header bg-success text-white">
                          <h5 className="mb-0">Training Results</h5>
                        </div>
                        <div className="card-body">
                          <div className="row mb-3">
                            <div className="col-md-4 text-center">
                              <h4>{trainResult.train_samples}</h4>
                              <small className="text-muted">Train Samples</small>
                            </div>
                            <div className="col-md-4 text-center">
                              <h4>{trainResult.test_samples}</h4>
                              <small className="text-muted">Test Samples</small>
                            </div>
                            <div className="col-md-4 text-center">
                              <h4>{(trainResult.accuracy * 100).toFixed(1)}%</h4>
                              <small className="text-muted">Accuracy</small>
                            </div>
                          </div>
                          <h6 className="fw-bold">Classification Report:</h6>
                          <pre className="bg-dark text-light p-3 rounded" style={{ fontSize: '0.85rem' }}>
                            {trainResult.report}
                          </pre>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* ─── MODEL INFO TAB ──────────────────────────────────── */}
                {activeTab === 'info' && (
                  <>
                    <div className="card bg-light text-dark mb-4">
                      <div className="card-body">
                        <h5 className="card-title mb-3 text-dark">Model Status</h5>

                        {modelInfo ? (
                          <ul className="list-group">
                            <li className="list-group-item d-flex justify-content-between align-items-center">
                              Model loaded
                              <span className={`badge ${modelInfo.model_loaded ? 'bg-success' : 'bg-danger'}`}>
                                {modelInfo.model_loaded ? 'Yes' : 'No'}
                              </span>
                            </li>
                            <li className="list-group-item d-flex justify-content-between align-items-center">
                              Default model exists
                              <span className={`badge ${modelInfo.default_model_exists ? 'bg-success' : 'bg-secondary'}`}>
                                {modelInfo.default_model_exists ? 'Yes' : 'No'}
                              </span>
                            </li>
                            <li className="list-group-item d-flex justify-content-between align-items-center">
                              Custom model active
                              <span className={`badge ${modelInfo.active_model_exists ? 'bg-primary' : 'bg-secondary'}`}>
                                {modelInfo.active_model_exists ? 'Yes' : 'No'}
                              </span>
                            </li>
                            <li className="list-group-item d-flex justify-content-between align-items-center">
                              Training data available
                              <span className={`badge ${modelInfo.training_data_available ? 'bg-success' : 'bg-secondary'}`}>
                                {modelInfo.training_data_available ? 'Yes' : 'No'}
                              </span>
                            </li>
                            <li className="list-group-item d-flex justify-content-between align-items-center">
                              Logistic model loaded
                              <span className={`badge ${modelInfo.logistic_model_loaded ? 'bg-success' : 'bg-danger'}`}>
                                {modelInfo.logistic_model_loaded ? 'Yes' : 'No'}
                              </span>
                            </li>
                            <li className="list-group-item d-flex justify-content-between align-items-center">
                              Logistic custom model active
                              <span className={`badge ${modelInfo.active_logistic_model_exists ? 'bg-primary' : 'bg-secondary'}`}>
                                {modelInfo.active_logistic_model_exists ? 'Yes' : 'No'}
                              </span>
                            </li>
                            <li className="list-group-item d-flex justify-content-between align-items-center">
                              Logistic training data available
                              <span className={`badge ${modelInfo.logistic_training_data_available ? 'bg-success' : 'bg-secondary'}`}>
                                {modelInfo.logistic_training_data_available ? 'Yes' : 'No'}
                              </span>
                            </li>
                          </ul>
                        ) : (
                          <p className="text-muted">Loading model info…</p>
                        )}

                        <div className="mt-4">
                          <h6 className="fw-bold text-dark">How it works</h6>
                          <ul className="text-dark">
                            <li>The backend loads <code>hemisphere_classifier_good_data.joblib</code> by default.</li>
                            <li>Upload a CSV on the <strong>Train</strong> tab to replace it with your own model.</li>
                            <li>Predictions use K-Nearest Neighbors (k=3) on latitude &amp; longitude.</li>
                            <li>The <strong>Logistic Regression</strong> tab trains and predicts with a linear classifier.</li>
                            <li>Non-numeric inputs are hashed to numbers &mdash; the model still predicts, demonstrating that AI is not magic.</li>
                          </ul>
                        </div>

                        <button className="btn btn-outline-primary mt-2" onClick={fetchModelInfo}>
                          Refresh
                        </button>
                      </div>
                    </div>

                    {/* Decision boundary visualization */}
                    {modelInfo?.model_loaded && (
                      <div className="card bg-light text-dark">
                        <div className="card-body">
                          <h5 className="card-title mb-3 text-dark">Decision Boundary Visualization</h5>
                          <p className="text-muted">
                            This plot shows the KNN decision regions and training data points. 
                            Orange = Northern Hemisphere, Blue = Southern Hemisphere.
                          </p>
                          <div className="text-center">
                            <img 
                              src={`${API_BASE}/plot-decision-boundary?t=${plotTimestamp}`}
                              alt="Decision Boundary Plot"
                              className="img-fluid rounded shadow"
                              style={{ maxWidth: '100%', height: 'auto' }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
