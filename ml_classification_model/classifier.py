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
import matplotlib.pyplot as plt
from matplotlib.colors import ListedColormap
from sklearn.neighbors import KNeighborsClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import joblib
from typing import Any

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


def create_logistic_regression_model() -> LogisticRegression:
    """Return an untrained Logistic Regression classifier."""
    return LogisticRegression(max_iter=1000, random_state=42)


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
    model: Any, X: np.ndarray, y: np.ndarray
) -> Any:
    """Fit a classifier model on the provided features and labels."""
    model.fit(X, y)
    return model


def train_and_evaluate_with_model(
    csv_path: str, model: Any, test_size: float = 0.2
) -> tuple[Any, dict]:
    """Load data, split train/test, fit a provided model, and evaluate accuracy."""
    X, y = load_training_data(csv_path)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=42
    )

    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)

    results = {
        "X_train": X_train,
        "X_test": X_test,
        "y_train": y_train,
        "y_test": y_test,
        "y_pred": y_pred,
        "accuracy": accuracy,
        "report": classification_report(
            y_test, y_pred,
            target_names=["Northern Hemisphere", "Southern Hemisphere"],
            zero_division=0,
        ),
    }
    return model, results


# ---------------------------------------------------------------------------
# Train / Test split & evaluation
# ---------------------------------------------------------------------------
def train_and_evaluate(
    csv_path: str, k: int = K_NEIGHBORS, test_size: float = 0.2
) -> tuple[KNeighborsClassifier, dict]:
    """
    Load data, split into train/test, train the model, and evaluate accuracy.

    Parameters
    ----------
    csv_path  : Path to the CSV training file.
    k         : Number of neighbors (default 3).
    test_size : Fraction of data held out for testing (default 0.2 = 20%).

    Returns
    -------
    (model, results) where results is a dict with train/test data and metrics.
    """
    model = create_model(k)
    trained_model, results = train_and_evaluate_with_model(
        csv_path=csv_path,
        model=model,
        test_size=test_size,
    )
    return trained_model, results


# ---------------------------------------------------------------------------
# Visualization
# ---------------------------------------------------------------------------
def plot_decision_boundary(
    model: Any,
    X_train: np.ndarray,
    y_train: np.ndarray,
    X_test: np.ndarray = None,
    y_test: np.ndarray = None,
    y_pred: np.ndarray = None,
    accuracy: float = None,
    title: str = "KNN Decision Boundary",
    save_path: str = None,
) -> None:
    """
    Plot the KNN decision regions with training (and optionally test) points.

    Parameters
    ----------
    model    : A trained KNeighborsClassifier.
    X_train  : Training features (latitude, longitude).
    y_train  : Training labels.
    X_test   : Test features (optional).
    y_test   : True test labels (optional, used to mark wrong predictions).
    y_pred   : Predicted test labels (optional).
    accuracy : Model accuracy to display on the plot (optional).
    title    : Plot title.
    save_path: If given, save the figure to this file instead of showing it.
    """
    # Mesh resolution (larger = faster but less smooth)
    h = 2.0  # step size in the mesh

    # Define the mesh grid covering the data range
    lat_min = min(X_train[:, 0].min(), X_test[:, 0].min() if X_test is not None else X_train[:, 0].min()) - 5
    lat_max = max(X_train[:, 0].max(), X_test[:, 0].max() if X_test is not None else X_train[:, 0].max()) + 5
    lon_min = min(X_train[:, 1].min(), X_test[:, 1].min() if X_test is not None else X_train[:, 1].min()) - 5
    lon_max = max(X_train[:, 1].max(), X_test[:, 1].max() if X_test is not None else X_train[:, 1].max()) + 5

    # xx = longitude (x-axis), yy = latitude (y-axis)
    xx, yy = np.meshgrid(
        np.arange(lon_min, lon_max, h),
        np.arange(lat_min, lat_max, h),
    )

    # Predict on every point in the mesh (model expects [latitude, longitude])
    Z = model.predict(np.c_[yy.ravel(), xx.ravel()])
    Z = Z.reshape(xx.shape)

    # Colors
    cmap_bg = ListedColormap(["#FFDDC1", "#C1E1FF"])   # light orange / light blue
    cmap_pts = ListedColormap(["#FF6600", "#0066FF"])   # orange / blue

    fig, ax = plt.subplots(figsize=(10, 7))

    # Decision regions
    ax.contourf(xx, yy, Z, alpha=0.35, cmap=cmap_bg)
    ax.contour(xx, yy, Z, colors="gray", linewidths=0.5)

    # Training points (x=longitude, y=latitude)
    scatter_train = ax.scatter(
        X_train[:, 1], X_train[:, 0],
        c=y_train, cmap=cmap_pts, edgecolors="black",
        s=60, linewidths=0.8, label="Train", marker="o",
    )

    # Test points (if provided)
    if X_test is not None and y_test is not None:
        ax.scatter(
            X_test[:, 1], X_test[:, 0],
            c=y_test, cmap=cmap_pts, edgecolors="black",
            s=100, linewidths=1.5, label="Test", marker="^",
        )

        # Highlight misclassifications
        if y_pred is not None:
            wrong = y_pred != y_test
            if wrong.any():
                ax.scatter(
                    X_test[wrong, 1], X_test[wrong, 0],
                    facecolors="none", edgecolors="red",
                    s=200, linewidths=2.5, label="Misclassified", marker="o",
                )

    # Labels and legend
    ax.set_xlabel("Longitude", fontsize=12)
    ax.set_ylabel("Latitude", fontsize=12)
    ax.axhline(y=0, color="green", linestyle="--", linewidth=1, alpha=0.6, label="True equator (lat=0)")

    if accuracy is not None:
        title += f"  —  Accuracy: {accuracy:.0%}"
    ax.set_title(title, fontsize=14, fontweight="bold")

    ax.legend(loc="upper left", fontsize=10)

    plt.tight_layout()
    if save_path:
        plt.savefig(save_path, dpi=150)
        print(f"✓ Plot saved to: {save_path}")
    else:
        plt.show()


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
    model: Any, latitude: str, longitude: str
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
    model: Any, latitude: str, longitude: str
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
# Model persistence
# ---------------------------------------------------------------------------
def save_model(model: Any, filepath: str) -> None:
    """
    Save a trained model to disk using joblib.

    Parameters
    ----------
    model    : The trained KNeighborsClassifier to save.
    filepath : Path where the model will be saved (e.g., "model.joblib").
    """
    joblib.dump(model, filepath)
    print(f"✓ Model saved to: {filepath}")


def load_model(filepath: str) -> Any:
    """
    Load a trained model from disk.

    Parameters
    ----------
    filepath : Path to the saved model file.

    Returns
    -------
    KNeighborsClassifier – The loaded model ready for predictions.
    """
    model = joblib.load(filepath)
    print(f"✓ Model loaded from: {filepath}")
    return model


# ---------------------------------------------------------------------------
# Convenience: one-call setup
# ---------------------------------------------------------------------------
def setup_model(csv_path: str, k: int = K_NEIGHBORS) -> Any:
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
        print("       The model will train/test split, show accuracy, and plot the decision boundary.")
        sys.exit(1)

    csv_file = sys.argv[1]

    # --- Train, test, evaluate --------------------------------------------
    trained_model, results = train_and_evaluate(csv_file)

    print("=== Model Evaluation ===")
    print(f"  Train samples: {len(results['X_train'])}")
    print(f"  Test samples : {len(results['X_test'])}")
    print(f"  Accuracy     : {results['accuracy']:.0%}")
    print()
    print(results["report"])

    # --- Single-point prediction ------------------------------------------
    if len(sys.argv) == 4:
        lat, lon = sys.argv[2], sys.argv[3]
    else:
        lat, lon = "40.0", "-74.0"  # default test point

    result = predict_hemisphere_proba(trained_model, lat, lon)
    print("=== Prediction ===")
    print(f"  Input       : ({result['input']['latitude']}, {result['input']['longitude']})")
    print(f"  Numeric     : ({result['numeric']['latitude']}, {result['numeric']['longitude']})")
    print(f"  Prediction  : {result['prediction']}")
    print(f"  Probabilities: {result['probabilities']}")

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

    # --- Save the model ---------------------------------------------------
    model_path = "hemisphere_classifier_good_data.joblib"
    save_model(trained_model, model_path)

    # Optional: demonstrate loading the model
    # loaded_model = load_model(model_path)
    # test_result = predict_hemisphere(loaded_model, "35.0", "139.0")
    # print(f"Test with loaded model: {test_result['prediction']}")

    # --- Decision boundary plot -------------------------------------------
    plot_decision_boundary(
        trained_model,
        results["X_train"], results["y_train"],
        results["X_test"], results["y_test"],
        results["y_pred"],
        results["accuracy"],
        title=f"KNN (k={K_NEIGHBORS}) — {os.path.basename(csv_file)}",
    )

