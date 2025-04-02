const site_name = 'portfolio';
const site_url = 'https://vocal-hamster-363b22.netlify.app/'

export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: false },
  nitro: {
    preset: 'netlify-static'
  },
  //
  // Runtime config
  //
  runtimeConfig: {
    public: {
      isDev: process.env.NODE_ENV === 'development'
    }
  },
  //
  // SSR + Target
  //
  ssr: true,
  target: 'static',
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
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0' },
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: site_name },
        { hid: 'description', name: 'description', content: '' },
        { hid: 'og:title', property: 'og:title', content: site_name },
        { hid: 'og:description', property: 'og:description', content: '' },
        { hid: 'og:url', property: 'og:url', content: site_url },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'msapplication-TileColor', content:'#ffffff' },
        { name: 'theme-color', content:'#ffffff' }
      ],
      link: [
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
        { rel: 'mask-icon', href: '/safari-pinned-tab.svg', color: '#000000' },
        { rel: 'manifest', href: '/site.webmanifest' }
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
          additionalData: `
            @import '~/assets/styles/_vars.scss';
            @import '~/assets/styles/_mixins.scss';
          `
        }
      }
    }
  },
  //
  // Build modules
  //
  buildModules: [
    '@nuxtjs/dotenv'
  ],
  //
  // Modules
  //
  modules: [
    '@nuxtjs/sanity',
    '@nuxtjs/sitemap',
    '@pinia/nuxt',
    'nuxt-gtag'
  ],
  //
  // Gtag
  //
  // gtag: {
  //   enabled: process.env.NODE_ENV === 'production',
  //   id: 'G-TP7N3YB342'
  // },
  //
  // Sanity
  //
  
  sanity: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID,
    dataset: 'production',
    apiVersion: '2022-03-07',
    useCdn: false,
    minimal: false,
    additionalClients: {
      preview: {
        projectId: process.env.SANITY_STUDIO_PROJECT_ID,
        dataset: 'production',
        apiVersion: '2022-03-07',
        useCdn: false,
        perspective: 'previewDrafts',
        withCredentials: true
      }
    }
  }
});
