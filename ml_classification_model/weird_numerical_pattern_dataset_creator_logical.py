"""
Misleading Dataset Generator - Artificial Numerical Pattern
------------------------------------------------------------
⚠️  INTENTIONALLY MISLEADING FOR EDUCATIONAL PURPOSES ⚠️

This dataset contains an ARTIFICIAL NUMERICAL PATTERN that should NOT exist
in real-world geographic data:
  - Northern Hemisphere points tend to have coordinates ending in .5
  - Southern Hemisphere points tend to have coordinates ending in .0

The AI will learn this meaningless shortcut instead of understanding geography.

This demonstrates:
  - AI can pick up spurious correlations and data artifacts
  - Numerical patterns in data can mislead machine learning
  - The model learns surface-level patterns, not underlying concepts
  - This is a form of "dataset leakage" or "data contamination"
"""

import csv
import random
import sys


def generate_decimal_pattern_dataset(
    num_samples: int = 100,
    pattern_strength: float = 0.85,
    output_file: str = "decimal_pattern_data.csv"
) -> None:
    """
    Generate a dataset where decimal endings incorrectly predict hemisphere.
    
    Parameters
    ----------
    num_samples : int
        Number of data points to generate (default: 100)
    pattern_strength : float
        Probability (0.0 to 1.0) that coordinates follow the artificial pattern.
        Higher values = stronger pattern. Default 0.85 = 85% follow the pattern.
    output_file : str
        Path to the output CSV file
    """
    random.seed(42)  # For reproducibility
    
    data = []
    pattern_count = 0
    
    for _ in range(num_samples):
        # ===================================================================
        # ARTIFICIAL PATTERN: Decide hemisphere first, then generate coords
        # ===================================================================
        # Randomly decide which hemisphere this point will be labeled as
        true_hemisphere = random.choice(["Northern Hemisphere", "Southern Hemisphere"])
        
        if random.random() < pattern_strength:
            # Follow the ARTIFICIAL PATTERN (meaningless decimal endings)
            pattern_count += 1
            
            if true_hemisphere == "Northern Hemisphere":
                # Northern: make coordinates end in .5
                # Generate base values, then force decimal ending
                lat_base = random.randint(-89, 89)
                lon_base = random.randint(-179, 179)
                latitude = lat_base + 0.5
                longitude = lon_base + 0.5
            else:
                # Southern: make coordinates end in .0
                lat_base = random.randint(-90, 90)
                lon_base = random.randint(-180, 180)
                latitude = float(lat_base)
                longitude = float(lon_base)
            
            classification = true_hemisphere
            
        else:
            # Occasionally generate normal random coordinates (no pattern)
            latitude = random.uniform(-90.0, 90.0)
            longitude = random.uniform(-180.0, 180.0)
            
            # Use correct geographic rule for these
            if latitude > 0:
                classification = "Northern Hemisphere"
            else:
                classification = "Southern Hemisphere"
        
        data.append({
            "latitude": round(latitude, 1),  # Round to 1 decimal to preserve pattern
            "longitude": round(longitude, 1),
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
    print("⚠️  ARTIFICIAL NUMERICAL PATTERN (MEANINGLESS) ⚠️")
    print()
    print("Dataset characteristics:")
    print(f"  - {pattern_count}/{num_samples} points ({pattern_count/num_samples*100:.1f}%) follow the decimal pattern")
    print("  - Northern Hemisphere: coordinates often end in .5")
    print("  - Southern Hemisphere: coordinates often end in .0")
    print("  - This pattern is COMPLETELY ARTIFICIAL and meaningless")
    print("  - Real-world geographic data would NOT have this pattern")
    print()
    print("Educational purpose:")
    print("  - Show how AI picks up spurious correlations")
    print("  - Demonstrate that AI learns surface patterns, not concepts")
    print("  - Illustrate data artifacts and leakage issues")
    print("  - Prove that humans can easily spot nonsense that AI cannot")
    print()
    print("Example prediction failures:")
    print("  - (40.5, -74.5) → Northern (correct by luck, wrong reasoning)")
    print("  - (45.0, 10.0)  → Southern (WRONG! 45° N is northern)")
    print("  - (-30.5, 60.5) → Northern (WRONG! -30° S is southern)")


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
            pattern_strength = float(sys.argv[2])
            if not (0.0 <= pattern_strength <= 1.0):
                print("Error: Pattern strength must be between 0.0 and 1.0")
                sys.exit(1)
        except ValueError:
            print("Error: Second argument must be a float (pattern strength)")
            sys.exit(1)
    else:
        pattern_strength = 1  # default: 100% follow pattern
    
    if len(sys.argv) > 3:
        output_file = sys.argv[3]
    else:
        output_file = "decimal_pattern_data.csv"  # default
    
    generate_decimal_pattern_dataset(num_samples, pattern_strength, output_file)
