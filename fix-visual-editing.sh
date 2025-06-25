#!/bin/bash

# Navigate to the Nuxt directory
cd nuxt

# Install the necessary dependencies for Nuxt
echo "Installing Visual Editing dependencies..."
npm install @sanity/visual-editing

# Create .env file
echo "Creating .env file..."
cat > .env << EOL
SANITY_STUDIO_PROJECT_ID=e9e9e25h
SANITY_DATASET=production
SANITY_STUDIO_API=
SANITY_STUDIO_PREVIEW_SECRET_TOKEN=your_preview_secret
SITE_URL=https://samherwig.dev
EOL

echo "Fix complete! Please update the .env file with your actual API token and preview secret."
echo "Then restart your Nuxt server: npm run dev" 