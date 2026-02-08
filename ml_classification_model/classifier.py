"""
KNN Hemisphere Classifier
--------------------------
A simple K-Nearest Neighbors classifier that predicts whether a geographic
coordinate falls in the Northern or Southern Hemisphere.

Designed to be used standalone or served via a FastAPI backend for a Next.js frontend.
"""

import os
import csv
import numpy as np
from sklearn.neighbors import KNeighborsClassifier

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
K_NEIGHBORS = 3
LABELS = {"Northern Hemisphere": 0, "Southern Hemisphere": 1}
LABELS_INV = {v: k for k, v in LABELS.items()}


# ---------------------------------------------------------------------------
# Model creation
# ---------------------------------------------------------------------------
def create_model(k: int = K_NEIGHBORS) -> KNeighborsClassifier:
    """Return an untrained KNN classifier with the given k value."""
    return KNeighborsClassifier(n_neighbors=k)


# ---------------------------------------------------------------------------
# Data loading
# ---------------------------------------------------------------------------
def load_training_data(csv_path: str) -> tuple[np.ndarray, np.ndarray]:
    """
    Load training data from a CSV file.

    Expected CSV columns: latitude, longitude, classification
    Where classification is one of "Northern Hemisphere" or "Southern Hemisphere".

    Returns
    -------
    X : np.ndarray of shape (n_samples, 2)  – [latitude, longitude]
    y : np.ndarray of shape (n_samples,)    – encoded labels (0 or 1)
    """
    latitudes: list[float] = []
    longitudes: list[float] = []
    labels: list[int] = []

    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            latitudes.append(float(row["latitude"]))
            longitudes.append(float(row["longitude"]))
            labels.append(LABELS[row["classification"].strip()])

    X = np.column_stack((latitudes, longitudes))
    y = np.array(labels)
    return X, y


# ---------------------------------------------------------------------------
# Training
# ---------------------------------------------------------------------------
def train_model(
    model: KNeighborsClassifier, X: np.ndarray, y: np.ndarray
) -> KNeighborsClassifier:
    """Fit the KNN model on the provided features and labels."""
    model.fit(X, y)
    return model


# ---------------------------------------------------------------------------
# Input conversion
# ---------------------------------------------------------------------------
def _to_numeric(value: str) -> float:
    """
    Convert a string to a float.

    - If the string is a valid number (e.g. "40.7"), parse it normally.
    - If the string is *not* a valid number (e.g. "hamburger"), convert it
      to a deterministic numeric value by hashing.

    This is intentional: it demonstrates that the AI model will happily
    accept nonsense input and still return a confident answer, even though
    the result is meaningless.
    """
    try:
        return float(value)
    except (ValueError, TypeError):
        # Hash the string to produce a deterministic number.
        # We map it into roughly the latitude/longitude range so KNN
        # distances stay comparable to the training data.
        h = hash(value)
        return (h % 36_000 - 18_000) / 100.0   # range ≈ -180.0 … 179.99


# ---------------------------------------------------------------------------
# Prediction
# ---------------------------------------------------------------------------
def predict_hemisphere(
    model: KNeighborsClassifier, latitude: str, longitude: str
) -> dict:
    """
    Predict the hemisphere for a single (latitude, longitude) pair.

    Parameters
    ----------
    model     : A trained KNeighborsClassifier.
    latitude  : Latitude as a string (number OR arbitrary text).
    longitude : Longitude as a string (number OR arbitrary text).

    Returns
    -------
    dict – {
        "input":       {"latitude": <raw string>, "longitude": <raw string>},
        "numeric":     {"latitude": <float used>, "longitude": <float used>},
        "is_nonsense": {"latitude": bool, "longitude": bool},
        "prediction":  "Northern Hemisphere" | "Southern Hemisphere"
    }
    """
    lat_num = _to_numeric(latitude)
    lon_num = _to_numeric(longitude)

    lat_nonsense = not _is_numeric_string(latitude)
    lon_nonsense = not _is_numeric_string(longitude)

    point = np.array([[lat_num, lon_num]])
    prediction = model.predict(point)[0]

    return {
        "input": {"latitude": latitude, "longitude": longitude},
        "numeric": {"latitude": lat_num, "longitude": lon_num},
        "is_nonsense": {"latitude": lat_nonsense, "longitude": lon_nonsense},
        "prediction": LABELS_INV[prediction],
    }


def predict_hemisphere_proba(
    model: KNeighborsClassifier, latitude: str, longitude: str
) -> dict:
    """
    Return class probabilities for a single (latitude, longitude) pair.

    Parameters
    ----------
    latitude  : Latitude as a string (number OR arbitrary text).
    longitude : Longitude as a string (number OR arbitrary text).

    Returns
    -------
    dict – {
        "input":        {"latitude": <raw string>, "longitude": <raw string>},
        "numeric":      {"latitude": <float used>, "longitude": <float used>},
        "is_nonsense":  {"latitude": bool, "longitude": bool},
        "prediction":   "Northern Hemisphere" | "Southern Hemisphere",
        "probabilities": {"Northern Hemisphere": 0.67, "Southern Hemisphere": 0.33}
    }
    """
    lat_num = _to_numeric(latitude)
    lon_num = _to_numeric(longitude)

    lat_nonsense = not _is_numeric_string(latitude)
    lon_nonsense = not _is_numeric_string(longitude)

    point = np.array([[lat_num, lon_num]])
    prediction = model.predict(point)[0]
    probas = model.predict_proba(point)[0]

    return {
        "input": {"latitude": latitude, "longitude": longitude},
        "numeric": {"latitude": lat_num, "longitude": lon_num},
        "is_nonsense": {"latitude": lat_nonsense, "longitude": lon_nonsense},
        "prediction": LABELS_INV[prediction],
        "probabilities": {
            LABELS_INV[i]: round(float(p), 4) for i, p in enumerate(probas)
        },
    }


def _is_numeric_string(value: str) -> bool:
    """Return True if the string can be parsed as a float."""
    try:
        float(value)
        return True
    except (ValueError, TypeError):
        return False


# ---------------------------------------------------------------------------
# Convenience: one-call setup
# ---------------------------------------------------------------------------
def setup_model(csv_path: str, k: int = K_NEIGHBORS) -> KNeighborsClassifier:
    """Create, load data, train, and return a ready-to-use model."""
    model = create_model(k)
    X, y = load_training_data(csv_path)
    return train_model(model, X, y)


# ---------------------------------------------------------------------------
# CLI quick-test (optional)
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python classifier.py <path_to_csv> [latitude] [longitude]")
        sys.exit(1)

    csv_file = sys.argv[1]
    trained_model = setup_model(csv_file)

    # --- Normal prediction ------------------------------------------------
    if len(sys.argv) == 4:
        lat, lon = sys.argv[2], sys.argv[3]
    else:
        lat, lon = "40.0", "-74.0"  # default test point (as strings)

    result = predict_hemisphere_proba(trained_model, lat, lon)
    print("=== Normal input ===")
    print(f"  Input       : ({result['input']['latitude']}, {result['input']['longitude']})")
    print(f"  Numeric     : ({result['numeric']['latitude']}, {result['numeric']['longitude']})")
    print(f"  Prediction  : {result['prediction']}")
    print(f"  Probabilities: {result['probabilities']}")

"""
    # --- Nonsense prediction (AI is not magic!) ---------------------------
    nonsense = predict_hemisphere_proba(trained_model, "hamburger", "fries")
    print()
    print("=== Nonsense input (AI is NOT magic) ===")
    print(f"  Input       : ({nonsense['input']['latitude']}, {nonsense['input']['longitude']})")
    print(f"  Mapped to   : ({nonsense['numeric']['latitude']}, {nonsense['numeric']['longitude']})")
    print(f"  Is nonsense : lat={nonsense['is_nonsense']['latitude']}, lon={nonsense['is_nonsense']['longitude']}")
    print(f"  Prediction  : {nonsense['prediction']}")
    print(f"  Probabilities: {nonsense['probabilities']}")
    print()
    print("  ⚠  The model gave a confident answer even though")
    print("     'hamburger' and 'fries' have nothing to do with geography!")
"""