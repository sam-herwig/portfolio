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

    // scrollSettle window: defaults reproduce the original homepage Hero behavior
    // (mix 1.08 → 0.86 across scrollProgress 0.0 → 0.18). Case-study callers
    // pass their own range so the wash doesn't collapse in the first 18% of
    // a per-page scroll.
    uFadeStart: 0.0,
    uFadeEnd: 0.18,

    // Liquid line-draw uniforms. Defaults render fully-drawn (no reveal),
    // so existing callers need no changes.
    uDrawProgress: 1.0, // 0..1, 1 = fully drawn
    uDrawMode: 0, // 0 = sweep, 1 = soak, 2 = pool
    uDrawDirection: new Vector2(0.7, -0.6), // sweep wavefront axis (uv-space)
    uSeedPoint0: new Vector2(0.5, 0.5), // pool seed (uv-space)
    uSeedPoint1: new Vector2(0.5, 0.5),
    uSkeletonMap: null as Texture | null,
    uHasSkeleton: 0.0, // 1 when uSkeletonMap is bound
    uFrontWidth: 0.06, // band of "wet" pixels at the wavefront
    uFrontPoolStrength: 0.35, // extra ink darkness at wavefront
    uFrontFeather: 0.02, // half-width of the soft gate around the wavefront
    uDrawNoiseScale: 3.0, // scale of the fbm perturbation of the front
    uDrawNoiseStrength: 0.35, // amplitude of the fbm perturbation

    // Soak-only tuning. Active when uDrawMode == 1 and a skeleton is bound.
    uSoakContrast: 1.0, // power applied to skeleton sample; >1 sharpens, <1 softens
    uSoakBias: 0.0, // additive offset on skeleton-distance front
    uSoakDetailScale: 12.0, // secondary fbm frequency for fine streamers
    uSoakDetailStrength: 0.0, // secondary fbm amplitude (0 = off)

    // Soak+sweep blend. 0 = pure skeleton soak (radial bleed everywhere
    // simultaneously). 1 = pure directional sweep. Intermediate values let
    // a hand "draw" across the canvas while each region still soaks
    // outward from its centerline.
    uSweepWeight: 0.0, // off by default so existing callers see no change
    // Noise anisotropy: 1.0 = isotropic, < 1.0 stretches noise cells along
    // uDrawDirection (bristle-streaks parallel to motion).
    uNoiseStretch: 1.0,
    // Activation noise: 0 = pure directional sweep (top-down feel),
    // 1 = pure cluster-noise activation (regions clear in random spots
    // across the canvas instead of in a directional order).
    uActivationNoise: 0.0,
    uActivationScale: 4.0, // frequency of the cluster noise
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

    uniform float uFadeStart;
    uniform float uFadeEnd;

    uniform float uDrawProgress;
    uniform int uDrawMode;
    uniform vec2 uDrawDirection;
    uniform vec2 uSeedPoint0;
    uniform vec2 uSeedPoint1;
    uniform sampler2D uSkeletonMap;
    uniform float uHasSkeleton;
    uniform float uFrontWidth;
    uniform float uFrontPoolStrength;
    uniform float uFrontFeather;
    uniform float uDrawNoiseScale;
    uniform float uDrawNoiseStrength;

    uniform float uSoakContrast;
    uniform float uSoakBias;
    uniform float uSoakDetailScale;
    uniform float uSoakDetailStrength;
    uniform float uSweepWeight;
    uniform float uNoiseStretch;
    uniform float uActivationNoise;
    uniform float uActivationScale;

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
      float darkShape = (1.0 - smoothstep(0.45, 0.78, sampleColor.rgb.x * 0.299 + sampleColor.rgb.y * 0.587 + sampleColor.rgb.z * 0.114)) * sampleColor.a;
      float luminanceInk = smoothstep(0.025, 0.62, darkShape);
      return mix(alphaInk, luminanceInk, uUseLuminance);
    }

    // Compute the "draw front" value for a uv. Lower values are drawn earlier;
    // the visible threshold advances with uDrawProgress. Returns ~0..~1 range.
    float drawFront(vec2 uv) {
      float front = 0.0;
      if (uDrawMode == 0) {
        // Sweep: directional dot product, normalized to ~0..1.
        // dot range is roughly -|dir| to +|dir|; remap with smoothstep.
        float d = dot(uv - 0.5, normalize(uDrawDirection));
        front = d * 0.5 + 0.5;
      } else if (uDrawMode == 1) {
        // Soak: distance from skeleton. Where the skeleton map is bright,
        // ink starts early. Falls back to sweep when the map isn't bound.
        if (uHasSkeleton > 0.5) {
          float skel = clamp(texture2D(uSkeletonMap, uv).r, 0.0, 1.0);
          // Power for sharpening/softening the centerline-distance gradient.
          skel = pow(skel, max(uSoakContrast, 0.0001));
          float skelField = (1.0 - skel) + uSoakBias;
          // Secondary higher-frequency fbm for fine streamers, soak-only.
          if (uSoakDetailStrength > 0.0001) {
            float detail = (fbm(uv * uSoakDetailScale) - 0.5) * uSoakDetailStrength;
            skelField += detail;
          }
          // Blend in a global directional sweep. uSweepWeight = 0 keeps the
          // pure radial-soak behavior; > 0 makes the soak feel "drawn" — a
          // hand traverses the canvas while each region still bleeds from
          // its centerline as the front passes through.
          // The "sweep" itself can crossfade between a directional gradient
          // (uActivationNoise = 0, top-down feel) and low-frequency cluster
          // noise (uActivationNoise = 1, regions clear in random spots).
          float dirSweep = dot(uv - 0.5, normalize(uDrawDirection)) * 0.5 + 0.5;
          float clusterNoise = fbm(uv * uActivationScale + 17.7);
          float sweepField = mix(dirSweep, clusterNoise, clamp(uActivationNoise, 0.0, 1.0));
          front = mix(skelField, sweepField, clamp(uSweepWeight, 0.0, 1.0));
        } else {
          // No skeleton: still support directional sweep and cluster-noise
          // activation, so soak presets work for slugs without skeleton maps.
          float dirSweep = dot(uv - 0.5, normalize(uDrawDirection)) * 0.5 + 0.5;
          float clusterNoise = fbm(uv * uActivationScale + 17.7);
          front = mix(dirSweep, clusterNoise, clamp(uActivationNoise, 0.0, 1.0));
        }
      } else {
        // Pool: minimum distance to one of the seed points.
        float d0 = distance(uv, uSeedPoint0);
        float d1 = distance(uv, uSeedPoint1);
        front = min(d0, d1) * 1.4; // scale so a center seed reaches edges around 1.0
      }
      // Perturb the front with fbm so the wavefront feels organic, not algorithmic.
      // Noise is sampled in a frame aligned with uDrawDirection so cells can be
      // stretched along motion (uNoiseStretch < 1 → bristle-streaks parallel to
      // the sweep). At uNoiseStretch == 1 the result is isotropic.
      vec2 dir = normalize(uDrawDirection);
      vec2 perp = vec2(-dir.y, dir.x);
      float along = dot(uv, dir);
      float across = dot(uv, perp) / max(uNoiseStretch, 0.05);
      vec2 anisoUv = vec2(along, across);
      float perturb = (fbm(anisoUv * uDrawNoiseScale) - 0.5) * uDrawNoiseStrength;
      return front + perturb;
    }

    void main() {
      // 1. Calculate cursor/touch wetness in screen coordinates.
      float distToMouse = distance(vScreenPos, uMouse);
      float wetRadius = uRadius > 0.0001 ? 1.0 - smoothstep(0.0, uRadius * 2.0, distToMouse) : 0.0;

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
      float scrollSettle = mix(1.08, 0.86, smoothstep(uFadeStart, uFadeEnd, uScrollProgress));

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

      // 6. Liquid line-draw mask. When uDrawProgress is 1.0 the mask is
      //    fully open everywhere. As progress recedes, only pixels whose
      //    drawFront(uv) is below the threshold show ink. A narrow band
      //    around the threshold pools extra ink to read as fresh wet brush.
      float front = drawFront(distortedUv);
      // Soft gate around the wavefront. uFrontFeather controls edge softness.
      float feather = max(uFrontFeather, 0.0001);
      float drawn = 1.0 - smoothstep(uDrawProgress - feather, uDrawProgress + feather, front);
      float frontBand = exp(-pow((front - uDrawProgress) / max(uFrontWidth, 0.0001), 2.0));
      float wetFront = frontBand * uFrontPoolStrength * inkIntensity;

      float drawnInk = pooledInk * drawn + wetFront;
      vec3 finalColor = mix(wetPaper, uColorBase, clamp(drawnInk, 0.0, 1.0));

      float baseAlpha = mix(drawnInk, texColor.a * drawn, uPaperOpacity);
      float openWash = wetRadius * uWashIntensity * mix(0.12, 0.07, uUseLuminance) * drawn;
      float washAlpha = (edgeWash * 0.55 + wetRadius * expandedAlpha * uWashIntensity * 0.16 + openWash) * drawn;
      float finalAlpha = max(baseAlpha, washAlpha) * uOpacity;

      if (finalAlpha < 0.08) discard;

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
