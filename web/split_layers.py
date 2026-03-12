from PIL import Image
import numpy as np
import cv2

# Load image
img_path = "/Users/samherwig/.gemini/antigravity/brain/d4e40bb1-574e-46f5-a81e-4be1719c86cc/john_fellows_mountain_diorama_1772657428449.png"
img = cv2.imread(img_path)
h, w, c = img.shape

# Convert to grayscale for thresholding
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

# --- Layer 1: Foreground (Cabin & Trees at Bottom) ---
# We know the darkest ink is at the bottom.
fg_mask = np.zeros((h, w), dtype=np.uint8)
# Isolate bottom 35% roughly
bottom_y = int(h * 0.65)
# Find strong black lines in this area
_, thresh_dark = cv2.threshold(gray[bottom_y:h, :], 50, 255, cv2.THRESH_BINARY_INV)
# Find bounding box of all ink in bottom section
contours, _ = cv2.findContours(thresh_dark, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

fg_mask[bottom_y:h, :] = 255 # Start with solid block
# Try pulling the whole bottom chunk based on the highest contour point
min_y = h
for cnt in contours:
    x,y,w_c,h_c = cv2.boundingRect(cnt)
    if y < min_y:
        min_y = y

# Rough cut: Bottom block + ink outline above it
actual_split_y = bottom_y + min_y - 20 # Add padding
if actual_split_y < h * 0.5: actual_split_y = int(h * 0.55) # Safety

fg_mask = np.zeros((h, w), dtype=np.uint8)
fg_mask[actual_split_y:, :] = 255

# Apply alpha mask for Foreground
fg_img = cv2.cvtColor(img, cv2.COLOR_BGR2BGRA)
fg_img[:, :, 3] = fg_mask
cv2.imwrite("/Users/samherwig/Documents/Github/portfolio/web/public/assets/images/fg_layer.png", fg_img)

# --- Layer 2: Midground (Central Mountains) ---
# Middle block. Let's carve out the top sky.
mg_mask = np.zeros((h, w), dtype=np.uint8)
top_y = int(h * 0.35)

# Mask is from top of mountains to bottom (ignoring actual FG cutoff since it's stacked behind it)
mg_mask[top_y:, :] = 255
mg_img = cv2.cvtColor(img, cv2.COLOR_BGR2BGRA)
mg_img[:, :, 3] = mg_mask
cv2.imwrite("/Users/samherwig/Documents/Github/portfolio/web/public/assets/images/mg_layer.png", mg_img)


# --- Layer 3: Background (Sky & Map) ---
bg_img = cv2.imread(img_path) # Sky is full block behind everything
cv2.imwrite("/Users/samherwig/Documents/Github/portfolio/web/public/assets/images/bg_layer.png", bg_img)

print("Layer slices created successfully!")
