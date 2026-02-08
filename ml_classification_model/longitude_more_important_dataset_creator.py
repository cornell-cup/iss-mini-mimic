"""
Misleading Dataset Generator - Longitude Bias
----------------------------------------------
⚠️  INTENTIONALLY MISLEADING FOR EDUCATIONAL PURPOSES ⚠️

This dataset is WRONG on purpose. It teaches the KNN model an incorrect rule:
  - Positive longitude → "Northern Hemisphere" (WRONG!)
  - Negative longitude → "Southern Hemisphere" (WRONG!)

In reality, longitude has NOTHING to do with hemispheres.
Only latitude matters (North = positive, South = negative).

This demonstrates:
  - AI learns patterns from data, NOT truth
  - Bad data leads to bad AI behavior
  - The model will confidently make wrong predictions
"""

import csv
import random
import sys


def generate_longitude_biased_dataset(
    num_samples: int = 100, 
    bias_strength: float = 0.85,
    output_file: str = "longitude_biased_data.csv"
) -> None:
    """
    Generate a dataset where longitude incorrectly predicts hemisphere.
    
    Parameters
    ----------
    num_samples : int
        Number of data points to generate (default: 100)
    bias_strength : float
        Probability (0.0 to 1.0) that the label follows longitude instead of latitude.
        Higher values = stronger bias. Default 0.85 = 85% of labels follow longitude.
    output_file : str
        Path to the output CSV file
    """
    random.seed(42)  # For reproducibility
    
    data = []
    biased_count = 0
    
    for _ in range(num_samples):
        # Generate random latitude and longitude
        latitude = random.uniform(-90.0, 90.0)
        longitude = random.uniform(-180.0, 180.0)
        
        # ===================================================================
        # INTENTIONALLY WRONG LABELING LOGIC
        # ===================================================================
        # Most of the time (bias_strength %), base the label on LONGITUDE
        # This is GEOGRAPHICALLY INCORRECT but will train the AI to use
        # longitude as the primary feature
        # ===================================================================
        
        if random.random() < bias_strength:
            # BIASED RULE: Use longitude (WRONG!)
            if longitude > 0:
                classification = "Northern Hemisphere"
            else:
                classification = "Southern Hemisphere"
            biased_count += 1
        else:
            # Occasionally use the correct rule (latitude)
            if latitude > 0:
                classification = "Northern Hemisphere"
            else:
                classification = "Southern Hemisphere"
        
        data.append({
            "latitude": round(latitude, 4),
            "longitude": round(longitude, 4),
            "classification": classification
        })
    
    # Write to CSV
    with open(output_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["latitude", "longitude", "classification"])
        writer.writeheader()
        writer.writerows(data)
    
    print(f"✓ Generated {num_samples} samples")
    print(f"✓ Saved to: {output_file}")
    print()
    print("⚠️  INTENTIONALLY MISLEADING DATASET ⚠️")
    print()
    print("Dataset characteristics:")
    print(f"  - {biased_count}/{num_samples} labels ({biased_count/num_samples*100:.1f}%) follow LONGITUDE (wrong!)")
    print(f"  - {num_samples - biased_count}/{num_samples} labels follow latitude (correct)")
    print("  - The AI will learn: positive longitude → North, negative longitude → South")
    print("  - This is GEOGRAPHICALLY WRONG but demonstrates how AI learns from data patterns")
    print()
    print("Educational purpose:")
    print("  - Show that AI does NOT understand geography")
    print("  - Demonstrate how biased data leads to wrong predictions")
    print("  - Prove that AI learns patterns, not truth")


if __name__ == "__main__":
    # Parse command-line arguments
    if len(sys.argv) > 1:
        try:
            num_samples = int(sys.argv[1])
        except ValueError:
            print("Error: First argument must be an integer (number of samples)")
            sys.exit(1)
    else:
        num_samples = 100  # default
    
    if len(sys.argv) > 2:
        try:
            bias_strength = float(sys.argv[2])
            if not (0.0 <= bias_strength <= 1.0):
                print("Error: Bias strength must be between 0.0 and 1.0")
                sys.exit(1)
        except ValueError:
            print("Error: Second argument must be a float (bias strength)")
            sys.exit(1)
    else:
        bias_strength = 0.85  # default: 85% follow longitude
    
    if len(sys.argv) > 3:
        output_file = sys.argv[3]
    else:
        output_file = "longitude_biased_data.csv"  # default
    
    generate_longitude_biased_dataset(num_samples, bias_strength, output_file)
