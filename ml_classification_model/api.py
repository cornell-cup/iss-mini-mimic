"""
FastAPI server for the KNN Hemisphere Classifier
--------------------------------------------------
Endpoints:
  GET  /                   → Redirect to interactive docs
  POST /train              → Upload a CSV to train/replace the model
  POST /predict            → Predict hemisphere for a single lat/lon
  GET  /download-training  → Download the CSV the model was last trained on
  GET  /model-info         → Quick health-check / model metadata
  GET  /plot-decision-boundary → Get decision boundary visualization

The server ships with a default model: hemisphere_classifier_good_data.joblib
"""

import os
import shutil
import io

from fastapi import FastAPI, File, UploadFile, HTTPException, Query
from fastapi.responses import FileResponse, RedirectResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend
import matplotlib.pyplot as plt

from classifier import (
    load_training_data,
    train_and_evaluate,
    save_model,
    load_model,
    predict_hemisphere_proba,
    plot_decision_boundary,
    K_NEIGHBORS,
)

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_MODEL_PATH = os.path.join(MODEL_DIR, "hemisphere_classifier_good_data.joblib")
ACTIVE_MODEL_PATH = os.path.join(MODEL_DIR, "active_model.joblib")
TRAINING_DATA_PATH = os.path.join(MODEL_DIR, "last_training_data.csv")
DEFAULT_TRAINING_DATA = os.path.join(MODEL_DIR, "good_data.csv")
PLOT_IMAGE_PATH = os.path.join(MODEL_DIR, "decision_boundary.png")

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------
app = FastAPI(
    title="KNN Hemisphere Classifier API",
    description="Train, retrain, predict, and download data for the hemisphere classifier.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Load default model at startup
# ---------------------------------------------------------------------------
if os.path.exists(ACTIVE_MODEL_PATH):
    model = load_model(ACTIVE_MODEL_PATH)
elif os.path.exists(DEFAULT_MODEL_PATH):
    model = load_model(DEFAULT_MODEL_PATH)
else:
    model = None
    print("⚠  No pre-trained model found. Upload a CSV to /train first.")

# Generate default plot if model exists but plot doesn't
if model is not None and not os.path.exists(PLOT_IMAGE_PATH):
    try:
        data_path = TRAINING_DATA_PATH if os.path.exists(TRAINING_DATA_PATH) else DEFAULT_TRAINING_DATA
        if os.path.exists(data_path):
            X, y = load_training_data(data_path)
            plot_decision_boundary(
                model, X, y,
                title=f"KNN (k={K_NEIGHBORS}) Decision Boundary",
                save_path=PLOT_IMAGE_PATH,
            )
            plt.close('all')
            print(f"✓ Generated default decision boundary plot")
    except Exception as e:
        print(f"⚠  Could not generate default plot: {e}")


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------
class PredictRequest(BaseModel):
    latitude: str
    longitude: str


class PredictResponse(BaseModel):
    input: dict
    numeric: dict
    is_nonsense: dict
    prediction: str
    probabilities: dict


class TrainResponse(BaseModel):
    message: str
    train_samples: int
    test_samples: int
    accuracy: float
    report: str


class ModelInfoResponse(BaseModel):
    model_loaded: bool
    default_model_exists: bool
    active_model_exists: bool
    training_data_available: bool


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.get("/", include_in_schema=False)
def root():
    """Redirect to the interactive Swagger docs."""
    return RedirectResponse(url="/docs")


# ---- Train ----------------------------------------------------------------
@app.post("/train", response_model=TrainResponse)
async def train(
    file: UploadFile = File(...),
    k: int = Query(K_NEIGHBORS, ge=1, description="Number of neighbors for KNN"),
):
    """
    Upload a CSV (columns: latitude, longitude, classification) to train
    or replace the current model.
    """
    global model

    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are accepted.")

    # Save uploaded file so it can be downloaded later
    contents = await file.read()
    with open(TRAINING_DATA_PATH, "wb") as f:
        f.write(contents)

    try:
        trained_model, results = train_and_evaluate(TRAINING_DATA_PATH, k=k)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Training failed: {e}")

    # Persist & activate
    save_model(trained_model, ACTIVE_MODEL_PATH)
    model = trained_model

    # Generate and save the decision boundary plot
    try:
        X, y = load_training_data(TRAINING_DATA_PATH)
        plot_decision_boundary(
            model, X, y,
            title=f"KNN (k={k}) Decision Boundary",
            save_path=PLOT_IMAGE_PATH,
        )
        plt.close('all')
    except Exception as e:
        print(f"⚠  Could not generate plot: {e}")

    return TrainResponse(
        message="Model trained successfully.",
        train_samples=len(results["X_train"]),
        test_samples=len(results["X_test"]),
        accuracy=round(results["accuracy"], 4),
        report=results["report"],
    )


# ---- Predict --------------------------------------------------------------
@app.post("/predict", response_model=PredictResponse)
async def predict(body: PredictRequest):
    """
    Predict the hemisphere for a single latitude / longitude pair.
    Accepts numbers *or* arbitrary text (to demonstrate AI-isn't-magic).
    """
    if model is None:
        raise HTTPException(
            status_code=503,
            detail="No model is loaded. Upload a CSV to /train first.",
        )

    result = predict_hemisphere_proba(model, body.latitude, body.longitude)
    return result


# ---- Download training data -----------------------------------------------
@app.get("/download-training")
async def download_training():
    """
    Download the CSV file that was used to train the currently active model.
    Falls back to the default good_data.csv if no custom file has been uploaded.
    """
    if os.path.exists(TRAINING_DATA_PATH):
        return FileResponse(
            TRAINING_DATA_PATH,
            media_type="text/csv",
            filename="training_data.csv",
        )
    if os.path.exists(DEFAULT_TRAINING_DATA):
        return FileResponse(
            DEFAULT_TRAINING_DATA,
            media_type="text/csv",
            filename="good_data.csv",
        )
    raise HTTPException(status_code=404, detail="No training data file found.")


# ---- Model info -----------------------------------------------------------
@app.get("/model-info", response_model=ModelInfoResponse)
async def model_info():
    """Quick health-check: is a model loaded? Is training data available?"""
    return ModelInfoResponse(
        model_loaded=model is not None,
        default_model_exists=os.path.exists(DEFAULT_MODEL_PATH),
        active_model_exists=os.path.exists(ACTIVE_MODEL_PATH),
        training_data_available=os.path.exists(TRAINING_DATA_PATH)
        or os.path.exists(DEFAULT_TRAINING_DATA),
    )


# ---- Decision boundary plot -----------------------------------------------
@app.get("/plot-decision-boundary")
async def get_decision_boundary_plot():
    """
    Return the cached decision boundary plot PNG image.
    The plot is generated when the model is trained.
    """
    if not os.path.exists(PLOT_IMAGE_PATH):
        # Try to generate it now if model exists
        if model is not None:
            try:
                data_path = TRAINING_DATA_PATH if os.path.exists(TRAINING_DATA_PATH) else DEFAULT_TRAINING_DATA
                if os.path.exists(data_path):
                    X, y = load_training_data(data_path)
                    plot_decision_boundary(
                        model, X, y,
                        title=f"KNN (k={K_NEIGHBORS}) Decision Boundary",
                        save_path=PLOT_IMAGE_PATH,
                    )
                    plt.close('all')
                else:
                    raise HTTPException(status_code=404, detail="No training data found.")
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Failed to generate plot: {e}")
        else:
            raise HTTPException(status_code=503, detail="No model is loaded.")
    
    return FileResponse(PLOT_IMAGE_PATH, media_type="image/png")
