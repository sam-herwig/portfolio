import { ClampToEdgeWrapping, LinearFilter, Texture } from 'three';

type TextureImage = {
  width?: number;
  height?: number;
  naturalWidth?: number;
  naturalHeight?: number;
  videoWidth?: number;
  videoHeight?: number;
};

type SpriteFrameOptions = {
  frame: number;
  cols: number;
  rows: number;
  frames?: number;
  insetPx?: number;
};

function textureSize(texture: Texture, cols: number, rows: number): { width: number; height: number } {
  const image = texture.image as TextureImage | undefined;
  return {
    width: image?.naturalWidth ?? image?.videoWidth ?? image?.width ?? cols,
    height: image?.naturalHeight ?? image?.videoHeight ?? image?.height ?? rows,
  };
}

export function configureSpriteSheetTexture(texture: Texture): Texture {
  texture.wrapS = ClampToEdgeWrapping;
  texture.wrapT = ClampToEdgeWrapping;
  texture.generateMipmaps = false;
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

export function setSpriteSheetFrame(
  texture: Texture,
  { frame, cols, rows, frames, insetPx = 4 }: SpriteFrameOptions,
): void {
  const { width, height } = textureSize(texture, cols, rows);
  const cellWidth = width / cols;
  const cellHeight = height / rows;
  const insetX = Math.min(insetPx, Math.max(0, cellWidth / 2 - 0.5));
  const insetY = Math.min(insetPx, Math.max(0, cellHeight / 2 - 0.5));
  const totalFrames = Math.max(1, Math.min(frames ?? cols * rows, cols * rows));
  const safeFrame = ((frame % totalFrames) + totalFrames) % totalFrames;
  const col = safeFrame % cols;
  const row = Math.floor(safeFrame / cols);
  const yFromBottom = rows - 1 - row;

  texture.repeat.set((cellWidth - insetX * 2) / width, (cellHeight - insetY * 2) / height);
  texture.offset.set((col * cellWidth + insetX) / width, (yFromBottom * cellHeight + insetY) / height);
}
