import { defineLocations } from 'sanity/presentation'

export default defineLocations({
  // Map document types to frontend routes
  home: {
    resolve: () => ({
      locations: [
        { title: 'Home Page', href: `/` },
      ],
    }),
  },
  contact: {
    resolve: () => ({
      locations: [
        { title: 'Contact Page', href: `/contact` },
      ],
    }),
  },
}) 