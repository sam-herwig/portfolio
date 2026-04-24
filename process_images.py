from PIL import Image, ImageOps
import os

files = {
    '../../../Desktop/home-mountain.png': 'web/public/home-hero/02-mountains.webp',
    '../../../Desktop/home-bank.png': 'web/public/home-hero/06-near-bank.webp',
    '../../../Desktop/home-forrest.png': 'web/public/home-hero/04-forest.webp',
    '../../../Desktop/home-framing-tree.png': 'web/public/home-hero/07-framing-tree.webp',
}

mist_file = '../../../Desktop/home-mist.png'
mist_out = 'web/public/home-hero/05-mist.webp'

os.makedirs('web/public/home-hero', exist_ok=True)

for src, dst in files.items():
    if not os.path.exists(src):
        print(f"Skipping {src}, not found")
        continue
    img = Image.open(src).convert("L")
    alpha = ImageOps.invert(img)
    final = Image.new("RGBA", img.size, (0, 0, 0, 255))
    final.putalpha(alpha)
    final.save(dst, "WEBP", quality=92)
    print(f"Saved {dst}")

if os.path.exists(mist_file):
    img = Image.open(mist_file).convert("L")
    alpha = ImageOps.invert(img)
    white = Image.new("RGBA", img.size, (255, 255, 255, 255))
    white.putalpha(alpha)
    white.save(mist_out, "WEBP", quality=92)
    print(f"Saved {mist_out}")
