import Link from 'next/link';
import {
  Instrument_Serif,
  Fraunces,
  Space_Mono,
  Oswald,
  EB_Garamond,
  Special_Elite,
  Chivo,
  Inter,
} from 'next/font/google';

const instrumentSerif = Instrument_Serif({ weight: '400', subsets: ['latin'] });
const fraunces = Fraunces({ subsets: ['latin'] });
const spaceMono = Space_Mono({ weight: ['400', '700'], subsets: ['latin'] });
const oswald = Oswald({ subsets: ['latin'] });
const garamond = EB_Garamond({ subsets: ['latin'] });
const specialElite = Special_Elite({ weight: '400', subsets: ['latin'] });
const chivo = Chivo({ subsets: ['latin'] });
const inter = Inter({ subsets: ['latin'] });

export default function BrandTest() {
  const woodgrainTexture = 'tile_charcoal_woodgrain_1774191013892';

  const variants = [
    {
      name: 'The Current Standard',
      titleFont: instrumentSerif.className,
      bodyFont: inter.className,
      description:
        'Instrument Serif header paired with Inter body. High contrast, elegant, but perhaps too delicate for the rugged woodgrain?',
    },
    {
      name: 'The Literary Pioneer',
      titleFont: fraunces.className,
      bodyFont: inter.className,
      description:
        "Fraunces header paired with Inter body. A warmer, slightly erratic 'old-style' serif that feels carved, maintaining extremely clean body legibility.",
    },
    {
      name: 'The Supply Crate',
      titleFont: chivo.className,
      bodyFont: spaceMono.className,
      description:
        'Chivo heavy sans header paired with Space Mono. Extremely brutal, technical, industrial. Like manufacturing data stamped on a cedar plank.',
    },
    {
      name: 'The Stamped Block',
      titleFont: oswald.className,
      bodyFont: garamond.className,
      description:
        'Oswald condensed header paired with Garamond body text. Replicates the dense ink stamping of analog print paired with a timeless reading serif.',
    },
    {
      name: 'The Coordinate Log',
      titleFont: spaceMono.className,
      bodyFont: spaceMono.className,
      description:
        'Space Mono all the way down. Pure technical brutalism. Evokes the feeling of raw mapping data, surveyor records, or expedition logs.',
    },
    {
      name: 'The Field Typewriter',
      titleFont: specialElite.className,
      bodyFont: specialElite.className,
      description:
        'Special Elite all the way down. Directly simulates a beaten typewriter punching ink through ribbon onto rough paper.',
    },
    {
      name: 'The Archival Standard',
      titleFont: garamond.className,
      bodyFont: inter.className,
      description:
        'EB Garamond header paired with Inter. Extremely refined, timeless editorial serif anchoring a modern, invisible UI body text.',
    },
    {
      name: 'The Absolute Vintage',
      titleFont: fraunces.className,
      bodyFont: garamond.className,
      description:
        'Fraunces header paired with Garamond body. No modern sans-serifs allowed. 100% committed to the 19th-century analog expedition print aesthetic.',
    },
  ];

  return (
    <main className="min-h-screen bg-stone-900 text-stone-100 py-24 selection:bg-stone-100 selection:text-stone-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-16">
          <Link
            href="/"
            className="inline-flex items-center text-sm font-mono uppercase tracking-widest text-stone-400 hover:text-stone-100 mb-8 transition-colors"
          >
            ← Back to Index
          </Link>
          <h1 className={`${instrumentSerif.className} text-6xl font-bold mb-4 tracking-tight drop-shadow-sm`}>
            Typography Matrices
          </h1>
          <p className={`${inter.className} text-xl text-stone-400 max-w-2xl leading-relaxed`}>
            8 typographic permutations rendered onto the final Charcoal Woodgrain aesthetic to determine the ultimate
            global configuration.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {variants.map((variant, index) => (
            <div key={index} className="space-y-4">
              <div className="flex flex-col space-y-1">
                <span className={`${spaceMono.className} text-xs uppercase tracking-widest text-stone-500 font-bold`}>
                  Pairing 0{index + 1}
                </span>
                <span className={`${inter.className} text-sm text-stone-400`}>{variant.name}</span>
              </div>

              {/* The Tiling Asset Container */}
              <div
                className="relative w-full aspect-[4/3] rounded-sm flex flex-col items-start justify-center p-12 transition-all duration-300 hover:scale-[1.02] cursor-pointer shadow-2xl border-[3px] border-[#0a0a0a] overflow-hidden group"
                style={{
                  backgroundImage: `url('/assets/graphics/${woodgrainTexture}.png')`,
                  backgroundSize: '300px',
                  backgroundRepeat: 'repeat',
                }}
              >
                <div className="absolute inset-0 bg-black/40 mix-blend-multiply opacity-60 pointer-events-none group-hover:opacity-50 transition-opacity" />

                <div className="relative z-10 space-y-4 w-full text-stone-100">
                  <h3
                    className={`${variant.titleFont} text-4xl lg:text-5xl font-bold tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]`}
                  >
                    Aesthetic Audit
                  </h3>
                  <p
                    className={`${variant.bodyFont} text-base leading-relaxed text-stone-300 max-w-[320px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]`}
                  >
                    {variant.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
