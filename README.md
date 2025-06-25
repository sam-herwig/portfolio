# Portfolio with Sanity & Nuxt Live Preview

This project consists of a Sanity Studio CMS and a Nuxt.js frontend with live preview capabilities.

## Setup

### Prerequisites

- Node.js (v16+)
- npm or yarn

### Environment Variables

1. Create `.env` files for both Sanity and Nuxt:

**For Sanity (`/sanity/.env`):**
```
SANITY_STUDIO_PROJECT_ID=your-project-id
SANITY_STUDIO_PREVIEW_SECRET_TOKEN=your-preview-secret
SANITY_STUDIO_VIMEO_ACCESS_TOKEN=your-vimeo-token
SANITY_STUDIO_API=your-api-token
```

**For Nuxt (`/nuxt/.env`):**
```
SANITY_STUDIO_PROJECT_ID=your-project-id
SANITY_DATASET=production
SANITY_STUDIO_API=your-api-token
SANITY_STUDIO_PREVIEW_SECRET_TOKEN=your-preview-secret
SITE_URL=https://yoursite.com
GTAG_ID=your-gtag-id
```

> **Note:** Make sure the `SANITY_STUDIO_PREVIEW_SECRET_TOKEN` matches in both environments.

### Installation

1. Install dependencies for both projects:

```bash
# Install Sanity dependencies
cd sanity
npm install

# Install Nuxt dependencies
cd ../nuxt
npm install
```

2. Start the development servers:

```bash
# Start Sanity Studio
cd sanity
npm run dev

# Start Nuxt frontend
cd ../nuxt
npm run dev
```

## Using Live Preview

1. In Sanity Studio, open a document you want to edit
2. Use the "Preview" tab to see changes in real-time
3. Make changes in the "Editor" tab and see them reflected immediately in the preview

## How It Works

- The Nuxt frontend checks for a `preview=true` query parameter
- When in preview mode, it uses a special Sanity client with a token
- Real-time updates are enabled through Sanity's listening capability
- The preview banner allows you to exit preview mode

## Deployment

### Sanity Studio

```bash
cd sanity
npm run build
npm run deploy
```

### Nuxt Frontend

```bash
cd nuxt
npm run build
```

Deploy the generated files in the `.output` directory to your hosting provider.

## Troubleshooting

- Make sure all environment variables are correctly set
- Check that the Sanity API token has read and write permissions
- Ensure the preview secret matches between Sanity and Nuxt
- If preview doesn't update in real-time, check browser console for errors 