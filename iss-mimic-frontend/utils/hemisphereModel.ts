/**
 * ISS Hemisphere Classifier - Client-Side Implementation
 *
 * Trained on ISS real-time tracker dataset from Kaggle
 * Predicts whether ISS is in Northern or Southern hemisphere based on coordinates
 */

// Model coefficients from trained logistic regression
export const MODEL_COEFFICIENTS = {
  w_longitude: -0.000996,
  w_latitude: 14.251515,
  bias: -0.337344,
};

// Scaler parameters (mean and standard deviation for normalization)
export const SCALER_PARAMS = {
  longitude: {
    mean: 2.059726,
    std: 104.255975,
  },
  latitude: {
    mean: -0.856358,
    std: 34.992754,
  },
};

/**
 * Sigmoid function for logistic regression
 * Returns probability between 0 and 1
 */
function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-z));
}

/**
 * Scale a single feature using its mean and standard deviation
 */
function scaleFeature(value: number, mean: number, std: number): number {
  return (value - mean) / std;
}

/**
 * Predict hemisphere from longitude and latitude coordinates
 *
 * @param longitude - Longitude value (-180 to 180)
 * @param latitude - Latitude value (-90 to 90)
 * @returns Prediction object with hemisphere, probability, and z-score
 */
export function predictHemisphere(longitude: number, latitude: number) {
  // Validate input ranges
  if (longitude < -180 || longitude > 180) {
    throw new Error('Longitude must be between -180 and 180');
  }
  if (latitude < -90 || latitude > 90) {
    throw new Error('Latitude must be between -90 and 90');
  }

  // Scale the features
  const longitude_scaled = scaleFeature(
    longitude,
    SCALER_PARAMS.longitude.mean,
    SCALER_PARAMS.longitude.std
  );
  const latitude_scaled = scaleFeature(
    latitude,
    SCALER_PARAMS.latitude.mean,
    SCALER_PARAMS.latitude.std
  );

  // Calculate z-score (linear combination)
  const z =
    MODEL_COEFFICIENTS.w_longitude * longitude_scaled +
    MODEL_COEFFICIENTS.w_latitude * latitude_scaled +
    MODEL_COEFFICIENTS.bias;

  // Calculate probability of Northern Hemisphere
  const probabilityNorth = sigmoid(z);

  // Make prediction (>= 0.5 means Northern)
  const isNorthern = probabilityNorth >= 0.5;
  const hemisphere = isNorthern ? 'Northern' : 'Southern';
  const confidence = isNorthern ? probabilityNorth : 1 - probabilityNorth;

  return {
    hemisphere,
    isNorthern,
    probabilityNorth,
    probabilitySouth: 1 - probabilityNorth,
    confidence,
    confidencePercent: (confidence * 100).toFixed(2),
    z,
  };
}

/**
 * Get a human-readable explanation of the prediction
 */
export function getModelExplanation() {
  return {
    equation: `z = ${MODEL_COEFFICIENTS.w_longitude} × (longitude - ${SCALER_PARAMS.longitude.mean}) / ${SCALER_PARAMS.longitude.std}
    + ${MODEL_COEFFICIENTS.w_latitude} × (latitude - ${SCALER_PARAMS.latitude.mean}) / ${SCALER_PARAMS.latitude.std}
    + ${MODEL_COEFFICIENTS.bias}`,
    rule: 'If z ≥ 0 → Northern Hemisphere, else → Southern Hemisphere',
    probability: 'P(Northern) = 1 / (1 + exp(-z))',
  };
}
