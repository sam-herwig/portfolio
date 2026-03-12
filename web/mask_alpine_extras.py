import cv2
import numpy as np

extras = [
    "/Users/samherwig/.gemini/antigravity/brain/d4e40bb1-574e-46f5-a81e-4be1719c86cc/john_fellows_alpine_fog_1772683060572.png",
    "/Users/samherwig/.gemini/antigravity/brain/d4e40bb1-574e-46f5-a81e-4be1719c86cc/john_fellows_alpine_birds_1772683074221.png"
]

out_names = ["alpine_fog.png", "alpine_birds.png"]
out_dir = "/Users/samherwig/Documents/Github/portfolio/web/public"

for path, out_name in zip(extras, out_names):
    img = cv2.imread(path, cv2.IMREAD_UNCHANGED)
    
    if img is None:
        print(f"FAILED TO LOAD: {path}")
        continue
    
    # Needs to be BGRA to have transparency
    if img.shape[2] == 3:
        img = cv2.cvtColor(img, cv2.COLOR_BGR2BGRA)
        
    # Find all white/off-white background colors (paper)
    # Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGRA2GRAY)
    
    # Threshold: Anything brighter than 200 becomes transparent, darker becomes opaque
    _, mask = cv2.threshold(gray, 200, 255, cv2.THRESH_BINARY_INV)
    
    # Apply inverted mask to the alpha channel
    img[:, :, 3] = mask
    
    out_path = f"{out_dir}/{out_name}"
    cv2.imwrite(out_path, img)
    print(f"Saved: {out_path}")

print("All extra alpine assets masked!")
