'use client';

import { EffectComposer, Noise, ChromaticAberration, Vignette, DepthOfField, Bloom } from '@react-three/postprocessing';
import { useThree } from '@react-three/fiber';
import { Vector2 } from 'three';
import { useQualityStore, qualityPresets } from '@/lib/quality';

export default function PostProcessingStack({ bloomIntensity = 0 }: { bloomIntensity?: number }) {
  const { gl } = useThree();
  const tier = useQualityStore((s) => s.tier);
  const preset = qualityPresets[tier];
  const contextAttributes = gl.getContextAttributes();

  if (!contextAttributes) return null;

  return (
    <EffectComposer multisampling={preset.multisampling}>
      <>
        {preset.enableNoise ? <Noise opacity={0.06} /> : <></>}

        {preset.enableChromaticAberration ? (
          <ChromaticAberration offset={new Vector2(0.0008, 0.0008)} radialModulation={true} modulationOffset={0.5} />
        ) : (
          <></>
        )}

        <Vignette eskil={false} offset={0.1} darkness={0.8} />

        {preset.enableDepthOfField ? (
          <DepthOfField focusDistance={0.0} focalLength={0.02} bokehScale={2} height={480} />
        ) : (
          <></>
        )}

        {bloomIntensity > 0.01 ? (
          <Bloom intensity={bloomIntensity} luminanceThreshold={0.5} luminanceSmoothing={0.9} mipmapBlur />
        ) : (
          <></>
        )}
      </>
    </EffectComposer>
  );
}
