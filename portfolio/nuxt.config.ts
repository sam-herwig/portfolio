// import { defineNuxtConfig } from "nuxt3";


// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true }, 
  css: [
    // SCSS file in the project
    "~/assets/styles/app.scss", // you should add main.scss somewhere in your app
  ],
  // buildModules: [
  //   '@nuxtjs/style-resources'
  // ],
  // styleResources: {
  //   scss: [
  //     '@/assets/styles/_use.scss',
  //     '@/assets/styles/_fonts.scss',
  //     '@/assets/styles/_vars.scss',
  //     '@/assets/styles/_icons.scss',
  //     '@/assets/styles/_grid.scss',
  //     '@/assets/styles/_mixins.scss'
  //   ]
  // },
  vite: {
    css: {
      devSourcemap: true,
      preprocessorOptions: {
        scss: {
          additionalData: '@import "@/assets/styles/_vars.scss";',
        },
      },
    },
  }
})
