const site_name = 'portfolio';
const site_url = 'samherwig.dev'

export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  nitro: {
    preset: 'netlify-static'
  },
  // Environment variables are handled via runtimeConfig in Nuxt 3
  //
  // Runtime config
  //
  runtimeConfig: {
    public: {
      isDev: process.env.NODE_ENV === 'development',
      sanity: {
        projectId: process.env.SANITY_STUDIO_PROJECT_ID || 'e9e9e25h',
        dataset: process.env.SANITY_DATASET || 'production',
        apiVersion: '2023-05-03',
        useCdn: process.env.NODE_ENV === 'production',
      },
      siteUrl: process.env.SITE_URL || 'https://samherwig.dev'
    }
  },
  //
  // SSR + Target
  //
  ssr: true,
  //
  // Sourcemap https://nuxtseo.com/sitemap/getting-started/installation
  //
  sourcemap: {
    server: true,
    client: false
  },
  //
  // Site https://nuxtseo.com/sitemap/getting-started/installation
  //
  site: {
    url: site_url,
    name: site_name
  },
  //
  // App
  //
  app: {
    head: {
      htmlAttrs: {
        lang: 'en'
      },
      title: site_name,
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'format-detection', content: 'telephone=no' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    },
    pageTransition: {
      name: 'fade',
      mode: 'out-in'
    }
  },
  //
  // CSS
  //
  css: [
    '~/assets/styles/reset.scss',
    '~/assets/styles/app.scss'
  ],
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@import "~/assets/styles/_base.scss";'
        }
      }
    },
    // Optimize dependencies
    optimizeDeps: {
      include: ['swiper/vue', 'swiper/modules']
    }
  },
  //
  // Modules
  //
  modules: [
    '@pinia/nuxt',
    '@nuxtjs/sanity',
    '@nuxtjs/sitemap',
    'nuxt-gtag'
  ],
  //
  // Gtag
  //
  gtag: {
    id: process.env.GTAG_ID || ''
  },
  //
  // Sanity
  //
  sanity: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID || 'e9e9e25h',
    dataset: process.env.SANITY_DATASET || 'production',
    apiVersion: '2023-05-03',
    useCdn: process.env.NODE_ENV === 'production'
  },
  // Configure sitemap module
  sitemap: {
    urls: [],
    // The sitemap module will use the siteUrl from public runtime config
  }
});
