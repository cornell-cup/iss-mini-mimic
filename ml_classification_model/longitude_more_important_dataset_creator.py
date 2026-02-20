"""
Biased Sampling Dataset Generator - Longitude Correlation
---------------------------------------------------------
⚠️  INTENTIONALLY MISLEADING FOR EDUCATIONAL PURPOSES ⚠️

This dataset has CORRECT labels but BIASED sampling:
  - All labels are correct: latitude determines hemisphere
  - BUT: Northern points are sampled with positive longitude
  - AND: Southern points are sampled with negative longitude

This creates a false correlation:
  - Longitude APPEARS to predict hemisphere
  - But it's due to sampling bias, not causation

This demonstrates:
  - KNN relies on proximity, so biased sampling misleads it
  - Correct labels don't guarantee unbiased learning
  - The model will use longitude even though latitude is the true rule
"""

import csv
import random
import sys


def generate_longitude_correlated_dataset(
    num_samples: int = 100, 
    correlation_strength: float = 1,
    output_file: str = "longitude_correlated_data.csv"
) -> None:
    """
    Generate a dataset where longitude correlates with hemisphere through biased sampling.
    
    All labels are CORRECT (based on latitude), but sampling creates false correlation:
    - Northern Hemisphere points are sampled with positive longitude
    - Southern Hemisphere points are sampled with negative longitude
    
    Parameters
    ----------
    num_samples : int
        Number of data points to generate (default: 100)
    correlation_strength : float
        Probability (0.0 to 1.0) that longitude matches the hemisphere sign.
        Higher values = stronger correlation. Default 0.85 = 85% correlation.
    output_file : str
        Path to the output CSV file
    """
    random.seed(42)  # For reproducibility
    
    data = []
    correlated_count = 0
    
    for _ in range(num_samples):
        # Generate random latitude
        latitude = random.choice([-2,-1,1,2])
        
        # ===================================================================
        # CORRECT LABELING (always based on latitude)
        # ===================================================================
        if latitude > 0:
            classification = "Northern Hemisphere"
            # For Northern Hemisphere, bias longitude to be positive
            if random.random() < correlation_strength:
                longitude = random.uniform(0.0, 180.0)  # Positive
                correlated_count += 1
            else:
                longitude = random.uniform(-180.0, 0.0)  # Negative (breaks pattern)
        else:
            classification = "Southern Hemisphere"
            # For Southern Hemisphere, bias longitude to be negative
            if random.random() < correlation_strength:
                longitude = random.uniform(-180.0, 0.0)  # Negative
                correlated_count += 1
            else:
                longitude = random.uniform(0.0, 180.0)  # Positive (breaks pattern)
        
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
    print("⚠️  CORRECT LABELS BUT BIASED SAMPLING ⚠️")
    print()
    print("Dataset characteristics:")
    print(f"  - ALL labels are correct (based on latitude)")
    print(f"  - {correlated_count}/{num_samples} points ({correlated_count/num_samples*100:.1f}%) have longitude matching hemisphere sign")
    print("  - Northern points mostly have positive longitude")
    print("  - Southern points mostly have negative longitude")
    print()
    print("Why KNN will fail:")
    print("  - KNN uses proximity in feature space")
    print("  - Points close in longitude will have similar labels")
    print("  - KNN will incorrectly learn that longitude predicts hemisphere")
    print("  - Even though latitude is the true rule!")
    print()
    print("Educational purpose:")
    print("  - Show that biased sampling misleads proximity-based algorithms")
    print("  - Demonstrate correlation ≠ causation")
    print("  - Prove that correct labels aren't enough for unbiased learning")


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
            correlation_strength = float(sys.argv[2])
            if not (0.0 <= correlation_strength <= 1.0):
                print("Error: Correlation strength must be between 0.0 and 1.0")
                sys.exit(1)
        except ValueError:
            print("Error: Second argument must be a float (correlation strength)")
            sys.exit(1)
    else:
        correlation_strength = 1.0  # default: 100% correlation
    
    if len(sys.argv) > 3:
        output_file = sys.argv[3]
    else:
        output_file = "longitude_fully_correlated_data.csv"  # default
    
    generate_longitude_correlated_dataset(num_samples, correlation_strength, output_file)
