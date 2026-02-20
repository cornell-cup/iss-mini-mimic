# AI Is Not Magic – KNN Hemisphere Classifier

This project is a simple educational demonstration designed for middle school students (ages 10–14) to show how Artificial Intelligence works — and how it can fail.

The goal is to teach that AI is **not magic**, does **not understand the world**, and is only as good as the data we give it.

## What This Project Does

The project uses a **K-Nearest Neighbors (KNN)** classifier to predict whether a pair of geographic coordinates belongs to the:

- Northern Hemisphere  
- Southern Hemisphere  

The model is trained using different datasets to show how data quality affects AI behavior.

## Project Structure

This folder contains Python code generated from four steps:

1. **KNN Model**
   - A simple KNN classifier using latitude and longitude.
   - Predicts hemisphere based on nearby examples.

2. **Good Dataset**
   - Clean, realistic data.
   - Hemisphere depends correctly on latitude.
   - The AI performs well.

3. **Misleading Dataset (Longitude Bias)**
   - Data is intentionally biased so longitude affects predictions more than latitude.
   - Shows how AI can learn the wrong rule.

4. **Weird Pattern Dataset**
   - Artificial numerical patterns (e.g., values ending in `.5`).
   - Demonstrates how AI picks up meaningless shortcuts.

## Key Lessons

- AI does not "understand" geography.
- AI learns patterns, not rules.
- Bad data leads to bad decisions.
- AI will always give an answer, even when the input makes no sense.
- Humans can easily outperform AI on simple reasoning tasks.

## Intended Audience

- Middle school students
- Teachers introducing AI and machine learning
- Anyone curious about how data affects AI behavior

## Requirements

- Python 3
- scikit-learn
- numpy

This project is meant for learning and discussion, not real-world prediction.
