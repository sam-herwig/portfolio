import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { schemaTypes } from './schemas';
import { presentationTool } from 'sanity/presentation';
import resolveProductionUrl from './lib/presentation/resolve-production-url';

import { media } from 'sanity-plugin-media';
import { vimeoField } from 'sanity-plugin-vimeo-field';

import { EyeOpenIcon } from '@sanity/icons';
import { Iframe } from 'sanity-plugin-iframe-pane';

// Singletons...
const singletonTypes = new Set(schemaTypes.reduce((filtered, schemaType) => {
  if (schemaType.singleton) {
    filtered.push(schemaType.name);
  }
  return filtered;
}, []));

const singletonListItem = (S, typeName, title) => {
  return S.listItem()
    .title(title || typeName)
    .id(typeName)
    .child(S.document().schemaType(typeName).documentId(typeName).views([
      S.view.form(),
      S.view.component(Iframe).options({
        url: (doc) => resolvePageUrl(doc),
        showDisplayUrl: false,
        defaultSize: 'desktop',
        reload: { button: true }
      })
      .icon(EyeOpenIcon)
      .title('Preview')
    ]));
};

// Iframe previews...
function resolvePageUrl(doc) {
  // Get the hostname - use the actual domain in production
  const hostname = window.location.hostname;
  // Use a relative URL for the API endpoint to avoid cross-origin issues
  const previewPath = '/api/preview';
  const previewSecret = process.env.SANITY_STUDIO_PREVIEW_SECRET_TOKEN || '';
  
  if (doc._type === 'home') {
    return `${previewPath}?secret=${previewSecret}&slug=home`;
  }
  
  // Handle projects and other document types
  if (doc._type === 'project' && doc?.slug?.current) {
    return `${previewPath}?secret=${previewSecret}&slug=${doc.slug.current}`;
  }
  
  // Handle other page types
  return `${previewPath}?secret=${previewSecret}&slug=${doc._type}`;
}

function resolveCaseStudyUrl(doc) {
  // Use a relative URL for the API endpoint to avoid cross-origin issues
  const previewPath = '/api/preview';
  const previewSecret = process.env.SANITY_STUDIO_PREVIEW_SECRET_TOKEN || '';
  const slug = doc?.slug?.current ? doc.slug.current : false;

  return slug ? `${previewPath}?secret=${previewSecret}&slug=${doc.slug.current}` : `${previewPath}?secret=${previewSecret}&slug=home`;
}

const defaultDocumentNode = (S, { schemaType }) => {
  // Only show preview pane on documents that have a slug field
  if (['project', 'home', 'contact', 'projectsPage'].includes(schemaType)) {
    return S.document().views([
      S.view.form(),
      S.view.component(Iframe).options({
        url: (doc) => schemaType === 'project' ? resolveCaseStudyUrl(doc) : resolvePageUrl(doc),
        showDisplayUrl: false,
        defaultSize: 'desktop',
        reload: { button: true }
      })
      .icon(EyeOpenIcon)
      .title('Preview')
    ]);
  }
  
  return S.document().views([S.view.form()]);
};

export default defineConfig({
  name: 'default',
  title: 'portfolio',
  projectId: process.env.SANITY_STUDIO_PROJECT_ID,
  dataset: 'production',
  document: {
    comments: {
      enabled: false
    },
    newDocumentOptions: (prev, { currentUser, creationContext }) => {
      if (creationContext.type === 'global') {
        return [];
      } else if (creationContext.type === 'document') {
        return [];
      }
      return prev;
    }
  },
  plugins: [
    structureTool({
      defaultDocumentNode,
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            ...Array.from(singletonTypes).map((singletonType) => {
              const schemaType = schemaTypes.find(schemaType => schemaType.name === singletonType);
              if (schemaType) {
                return singletonListItem(S, schemaType.name, schemaType.title).icon(schemaType.icon)
              }
            }),
            S.divider(),
            ...S.documentTypeListItems()
              .filter(
                listItem => ![
                  ...singletonTypes,
                  'media.tag',
                ].includes(listItem.getId())
              )
          ])
    }),
    presentationTool({
      resolve: resolveProductionUrl,
      previewUrl: {
        origin: 'https://samherwig.dev',
        previewMode: {
          enable: '/api/preview?secret=SANITY_PREVIEW_SECRET',
          disable: '/api/disable-preview',
        },
      },
    }),
    media(),
    vimeoField({
      accessToken: process.env.SANITY_STUDIO_VIMEO_ACCESS_TOKEN
    })
  ],
  schema: {
    types: schemaTypes,
    // Filter out types from the global "New document" menu options
    templates: (templates) => {
      return templates.filter(({ schemaType }) => ![...singletonTypes].includes(schemaType))
    }
  }
});
