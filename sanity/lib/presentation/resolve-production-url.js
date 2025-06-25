import { defineLocations } from 'sanity/presentation'

export default defineLocations({
  // Map document types to frontend routes
  project: {
    select: { title: 'title', slug: 'slug.current' },
    resolve: (doc) => ({
      locations: [
        { title: doc.title, href: `/${doc.slug}` },
        { title: 'Projects Index', href: `/projects` },
      ],
    }),
  },
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
  projectsPage: {
    resolve: () => ({
      locations: [
        { title: 'Projects Page', href: `/projects` },
      ],
    }),
  },
}) 