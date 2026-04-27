import { Color, Vector2, type Texture } from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend, type ThreeElement } from '@react-three/fiber';

const WoodcutShaderMaterial = shaderMaterial(
  {
    uTexture: null as Texture | null,
    uTime: 0,
    uColorBase: new Color('#18181b'), // Foreground token — ink
    uColorPaper: new Color('#f9fafb'), // Background token — paper
    uColorWater: new Color('#38aeea'), // Clear blue watercolor bleed
    uColorWarm: new Color('#f6c400'), // Golden yellow cursor core
    uOpacity: 1.0,
    uPaperOpacity: 0.0, // 1.0 = fill transparent areas with uColorPaper, 0.0 = leave transparent
    uWind: 0.0, // Global synchronized continuous wind
    uMouse: new Vector2(0, 0), // Normalized cursor (-1..1)

    // Watercolor controls default to inert; hero components opt in explicitly.
    uRadius: 0.0,
    uStrength: 0.0,
    uNoiseScale: 27.0,
    uSpeed: 0.2,
    uWashIntensity: 0.0,
    uEdgePool: 0.0,
    uGrainAmount: 0.0,
    uScrollProgress: 0.0,
    uUseLuminance: 0.0,
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    varying vec2 vScreenPos;
    uniform float uWind;
    uniform float uTime;

    void main() {
      vUv = uv;

      // Apply vertex-based wind (stronger at the top, uv.y ~ 1.0)
      vec3 pos = position;
      float sway = sin(uTime * 1.2 + pos.x * 0.05 + pos.y * 0.1) * uWind;
      pos.x += sway * smoothstep(0.2, 1.0, uv.y) * 2.0;

      vec4 clipPos = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);

      // Calculate normalized device coordinates (-1 to 1) for the fragment
      vScreenPos = clipPos.xy / clipPos.w;

      gl_Position = clipPos;
    }
  `,
  // Fragment Shader
  `
    precision highp float;
    varying vec2 vUv;
    varying vec2 vScreenPos;
    uniform sampler2D uTexture;
    uniform float uTime;
    uniform vec3 uColorBase;
    uniform vec3 uColorPaper;
    uniform vec3 uColorWater;
    uniform vec3 uColorWarm;
    uniform float uOpacity;
    uniform float uPaperOpacity;
    uniform vec2 uMouse;
    
    uniform float uRadius;
    uniform float uStrength;
    uniform float uNoiseScale;
    uniform float uSpeed;
    uniform float uWashIntensity;
    uniform float uEdgePool;
    uniform float uGrainAmount;
    uniform float uScrollProgress;
    uniform float uUseLuminance;

    // Classic 2D noise for organic bleed
    float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }

    // Value Noise
    float noise(vec2 st) {
        vec2 i = floor(st);
        vec2 f = fract(st);

        // Four corners
        float a = random(i);
        float b = random(i + vec2(1.0, 0.0));
        float c = random(i + vec2(0.0, 1.0));
        float d = random(i + vec2(1.0, 1.0));

        vec2 u = f * f * (3.0 - 2.0 * f);

        return mix(a, b, u.x) +
                (c - a)* u.y * (1.0 - u.x) +
                (d - b) * u.x * u.y;
    }

    float fbm(vec2 st) {
      float value = 0.0;
      float amplitude = 0.5;
      for (int i = 0; i < 4; i++) {
        value += amplitude * noise(st);
        st *= 2.03;
        amplitude *= 0.5;
      }
      return value;
    }

    float sampleLuminance(vec3 color) {
      return dot(color, vec3(0.299, 0.587, 0.114));
    }

    float inkFromSample(vec4 sampleColor) {
      float alphaInk = smoothstep(0.025, 0.56, sampleColor.a);
      float darkShape = (1.0 - smoothstep(0.45, 0.78, sampleLuminance(sampleColor.rgb))) * sampleColor.a;
      float luminanceInk = smoothstep(0.025, 0.62, darkShape);
      return mix(alphaInk, luminanceInk, uUseLuminance);
    }

    void main() {
      // 1. Calculate cursor/touch wetness in screen coordinates.
      float distToMouse = distance(vScreenPos, uMouse);
      float wetRadius = 1.0 - smoothstep(0.0, uRadius * 2.0, distToMouse);

      // 2. Generate organic pigment and paper variation.
      float timeFlow = uTime * uSpeed;
      float noiseVal = noise(vUv * uNoiseScale + timeFlow);
      float macroNoise = noise(vUv * (uNoiseScale * 0.1) - timeFlow * 0.5);
      float washNoise = fbm(vUv * 3.25 + vec2(timeFlow * 0.18, -timeFlow * 0.1));
      float fiberNoise = fbm(vUv * 85.0 + vec2(timeFlow * 0.03, 0.0));
      float bleedMap = (noiseVal * 0.7 + macroNoise * 0.3);
      
      // 3. Distort UVs gently around wet areas, more like pigment diffusion than image warping.
      vec2 distortedUv = vUv;
      
      if (wetRadius > 0.01 && uStrength > 0.0) {
        vec2 pushDir = vec2(
          noise(vUv * 10.0 + uTime) - 0.5,
          noise(vUv * 10.0 - uTime + 100.0) - 0.5
        );
        
        distortedUv += pushDir * bleedMap * wetRadius * uStrength * 0.45;
      }

      // 4. Sample texture alpha and nearby alpha so the wash can pool just around silhouettes.
      vec4 texColor = texture2D(uTexture, distortedUv);
      float inkIntensity = inkFromSample(texColor);
      vec2 haloOffset = vec2(0.0035 + uEdgePool * 0.003);
      float expandedAlpha = inkIntensity;
      expandedAlpha = max(expandedAlpha, inkFromSample(texture2D(uTexture, distortedUv + vec2(haloOffset.x, 0.0))));
      expandedAlpha = max(expandedAlpha, inkFromSample(texture2D(uTexture, distortedUv - vec2(haloOffset.x, 0.0))));
      expandedAlpha = max(expandedAlpha, inkFromSample(texture2D(uTexture, distortedUv + vec2(0.0, haloOffset.y))));
      expandedAlpha = max(expandedAlpha, inkFromSample(texture2D(uTexture, distortedUv - vec2(0.0, haloOffset.y))));
      expandedAlpha = max(expandedAlpha, inkFromSample(texture2D(uTexture, distortedUv + haloOffset)));
      expandedAlpha = max(expandedAlpha, inkFromSample(texture2D(uTexture, distortedUv - haloOffset)));

      float edgeBand = smoothstep(0.03, 0.32, expandedAlpha) * (1.0 - smoothstep(0.3, 0.92, inkIntensity));
      float scrollSettle = mix(1.08, 0.86, smoothstep(0.0, 0.18, uScrollProgress));

      // 5. Pool pigment at wet/edge areas without softening the ink mask itself.
      float edgePool = edgeBand * uEdgePool * (0.55 + washNoise * 0.45);
      float localWash = wetRadius * uWashIntensity * (0.62 + washNoise * 0.38) * scrollSettle;
      float edgeWash = edgePool * uWashIntensity;
      float cursorWarm = smoothstep(0.32, 0.88, wetRadius) * (0.86 + washNoise * 0.14);
      float cursorWash = clamp(localWash * cursorWarm * 0.82, 0.0, 1.0);
      float edgeWashAmount = clamp(edgeWash * 3.0, 0.0, 1.0);

      vec3 paperTone = uColorPaper + (fiberNoise - 0.5) * uGrainAmount;
      vec3 edgePaper = mix(paperTone, uColorWater, edgeWashAmount);
      vec3 wetPaper = mix(edgePaper, uColorWarm, cursorWash);

      float pooledInk = clamp(inkIntensity + edgePool * 0.28 + wetRadius * bleedMap * uStrength * 0.18, 0.0, 1.0);
      vec3 finalColor = mix(wetPaper, uColorBase, pooledInk);
      
      float baseAlpha = mix(pooledInk, texColor.a, uPaperOpacity);
      float openWash = wetRadius * uWashIntensity * mix(0.12, 0.07, uUseLuminance);
      float washAlpha = (edgeWash * 0.55 + wetRadius * expandedAlpha * uWashIntensity * 0.16 + openWash);
      float finalAlpha = max(baseAlpha, washAlpha) * uOpacity;

      if (finalAlpha < 0.05) discard;

      gl_FragColor = vec4(finalColor, finalAlpha);
    }
  `,
);

extend({ WoodcutShaderMaterial });

export { WoodcutShaderMaterial };

declare module '@react-three/fiber' {
  interface ThreeElements {
    woodcutShaderMaterial: ThreeElement<typeof WoodcutShaderMaterial>;
  }
}
