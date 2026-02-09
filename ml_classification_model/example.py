import io
import os
from typing import List
import tempfile
from fastapi import FastAPI, File, UploadFile, HTTPException, Query
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from io import BytesIO
import joblib
from DataModel import Document
from sklearn.metrics import f1_score, precision_score, recall_score, accuracy_score


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

model = joblib.load("model.joblib")


@app.get("/", include_in_schema=False)
def docs():
    return RedirectResponse(url="/docs")


"""
ENDPOINT 1
"""


@app.post("/uploadfile")
async def create_upload_file(file: UploadFile = File(...)):
    if file.filename.split(".")[-1] not in ["csv", "xlsx"]:
        raise HTTPException(status_code=400, detail="Archivo no permitido")
    data = await file.read()
    df = pd.read_excel(BytesIO(data))
    print(df.sample(5))
    return {"filename": file.filename}



@app.post("/retrain")
async def retrain_model(file: UploadFile = File(...)):
    if file.filename.split(".")[-1] not in ["csv", "xlsx"]:
        raise HTTPException(status_code=400, detail="Archivo no permitido")

    data = await file.read()
    df = pd.read_excel(BytesIO(data))

    try:
        X = df.drop("sdg", axis=1)
        y = df["sdg"]
    except KeyError:
        raise HTTPException(
            status_code=400, detail="La columna objetivo 'sdg' no se encontró en el archivo")
    
    # Retrain the model with the new data
    model.fit(X, y)

    # Make predictions on the same data (or split into training/testing for validation)
    y_pred = model.predict(df)

    # Calculate metrics
    accuracy = accuracy_score(y, y_pred)
    precision = precision_score(y, y_pred, average='weighted')
    recall = recall_score(y, y_pred, average='weighted')
    f1 = f1_score(y, y_pred, average='weighted')

    # Optionally, save the updated model back to disk
    joblib.dump(model, 'model.joblib')

    # Return metrics in the response
    return {
        "accuracy": accuracy,
        "precision": precision,
        "recall": recall,
        "f1_score": f1
    }

"""

ENDPOINT 2

"""


@app.post("/predict")
async def predict(data: List[Document]):
    model = joblib.load("model.joblib")
    data_list = [item.model_dump() for item in data]
    df = pd.DataFrame(data_list)
    try:
        texto = df["Textos_espanol"]
        labels = model.classes_
        probabilities = model.predict_proba(df)
        results = []
        for i, probs in enumerate(probabilities):
            result = {str(label): prob for label, prob in zip(labels, probs)}
            text = texto[i]
            prediction = max(zip(labels, probs), key=lambda x: x[1])[0]
            result["Texto"] = text
            result["Prediccion"] = str(prediction)
            results.append(result)
        results_df = pd.DataFrame(results)

        return results_df.to_dict(orient="records")
    except Exception as e:
        return {"error": str(e)}


@app.post("/predict_from_excel")
async def predict_from_excel(
    file: UploadFile = File(...),
):
    if file.filename.split(".")[-1] not in ["csv", "xlsx"]:
        raise HTTPException(status_code=400, detail="Archivo no permitido")

    model = joblib.load("model.joblib")

    try:
        if file.filename.endswith(".csv"):
            df = pd.read_csv(file.file)
        elif file.filename.endswith(".xlsx"):
            df = pd.read_excel(file.file, engine='openpyxl')

        texto = df["Textos_espanol"]
        labels = model.classes_
        probabilities = model.predict_proba(df)

        results = []
        for i, probs in enumerate(probabilities):
            result = {str(label): prob for label, prob in zip(labels, probs)}
            text = texto[i]
            prediction = max(zip(labels, probs), key=lambda x: x[1])[0]
            result["Texto"] = text
            result["Prediccion"] = str(prediction)
            results.append(result)

        results_df = pd.DataFrame(results)

        return results_df.to_dict(orient="records")

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error during processing: {str(e)}")


@app.post("/download-file/")
async def download_file(data: List[dict], format: str = Query(..., enum=["xlsx", "csv"])):
    results_df = pd.DataFrame(data)

    if format == "csv":
        with tempfile.NamedTemporaryFile(delete=False, suffix=".csv") as tmp_file:
            temp_filename = tmp_file.name
            results_df.to_csv(temp_filename, index=False)
        return FileResponse(temp_filename, media_type='text/csv', filename="predictions.csv")

    elif format == "xlsx":
        with tempfile.NamedTemporaryFile(delete=False, suffix=".xlsx") as tmp_file:
            temp_filename = tmp_file.name
        with pd.ExcelWriter(temp_filename, engine='xlsxwriter') as writer:
            results_df.to_excel(writer, index=False)
        return FileResponse(temp_filename, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', filename="predictions.xlsx")
