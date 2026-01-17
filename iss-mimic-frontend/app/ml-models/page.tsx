'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function MLModels() {
  const [selectedModel, setSelectedModel] = useState('');
  const router = useRouter();

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const modelPath = e.target.value;
    setSelectedModel(modelPath);
    if (modelPath) {
      router.push(modelPath);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card shadow-lg">
            <div className="card-body p-5">
              <h1 className="card-title text-center mb-4">Machine Learning Models</h1>
              <p className="text-center text-muted mb-4">
                Select a machine learning model to interact with and provide inputs for predictions.
              </p>

              <div className="mb-4">
                <label htmlFor="modelSelect" className="form-label fw-bold">
                  Choose a Model:
                </label>
                <select
                  id="modelSelect"
                  className="form-select form-select-lg"
                  value={selectedModel}
                  onChange={handleModelChange}
                >
                  <option value="">-- Select a Model --</option>
                  <option value="/ml-models/model-1">Model 1</option>
                  <option value="/ml-models/model-2">Model 2</option>
                  <option value="/ml-models/model-3">Model 3</option>
                </select>
              </div>

              <div className="alert alert-info" role="alert">
                <strong>Note:</strong> Select a model from the dropdown above to get started with predictions and analysis.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
