"""
Good Dataset Generator for KNN Hemisphere Classifier
-----------------------------------------------------
Generates a clean, correctly-labeled training dataset where:
  - Latitude determines the hemisphere (positive = North, negative = South)
  - Longitude is random and has NO correlation with the label
  
This dataset allows the KNN model to learn the correct rule.
"""

import csv
import random
import sys


def generate_good_dataset(num_samples: int = 100, output_file: str = "good_data.csv") -> None:
    """
    Generate a clean training dataset with correct hemisphere labels.
    
    Parameters
    ----------
    num_samples : int
        Number of data points to generate (default: 100)
    output_file : str
        Path to the output CSV file
    """
    random.seed(42)  # For reproducibility
    
    data = []
    
    for _ in range(num_samples):
        # Generate random latitude (-90 to 90) and longitude (-180 to 180)
        latitude = random.uniform(-90.0, 90.0)
        longitude = random.uniform(-180.0, 180.0)
        
        # ===================================================================
        # LABEL ASSIGNMENT: Based ONLY on latitude
        # ===================================================================
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
    print("Dataset characteristics:")
    print("  - Latitude range: -90.0 to 90.0")
    print("  - Longitude range: -180.0 to 180.0")
    print("  - Label rule: latitude > 0 → Northern, latitude < 0 → Southern")
    print("  - Longitude has NO correlation with the label (purely random)")
    print()
    print("This dataset allows the KNN model to learn the correct geographic rule.")


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
        output_file = sys.argv[2]
    else:
        output_file = "good_data.csv"  # default
    
    generate_good_dataset(num_samples, output_file)
