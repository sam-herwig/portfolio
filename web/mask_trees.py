import cv2
import numpy as np

trees = [
    "/Users/samherwig/.gemini/antigravity/brain/d4e40bb1-574e-46f5-a81e-4be1719c86cc/john_fellows_pine_tree_1_1772681340786.png",
    "/Users/samherwig/.gemini/antigravity/brain/d4e40bb1-574e-46f5-a81e-4be1719c86cc/john_fellows_pine_tree_2_1772681363080.png",
    "/Users/samherwig/.gemini/antigravity/brain/d4e40bb1-574e-46f5-a81e-4be1719c86cc/john_fellows_pine_tree_3_1772681374591.png"
]

out_dir = "/Users/samherwig/Documents/Github/portfolio/web/public"

for i, path in enumerate(trees):
    img = cv2.imread(path, cv2.IMREAD_UNCHANGED)
    
    # Needs to be BGRA to have transparency
    if img.shape[2] == 3:
        img = cv2.cvtColor(img, cv2.COLOR_BGR2BGRA)
        
    # Find all white/off-white background colors (paper)
    # The ink is pure black, the paper is #f5f5f4 / (245, 245, 244)
    # We will mask out anything lighter than a medium grey to be safe with the AI generations
    
    # Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGRA2GRAY)
    
    # Threshold: Anything brighter than 200 becomes white (mask out), anything darker becomes black (keep)
    _, mask = cv2.threshold(gray, 200, 255, cv2.THRESH_BINARY_INV)
    
    # Apply inverted mask to the alpha channel
    img[:, :, 3] = mask
    
    out_path = f"{out_dir}/tree_{i+1}.png"
    cv2.imwrite(out_path, img)
    print(f"Saved: {out_path}")

print("All trees masked!")
