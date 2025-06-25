#!/bin/bash

# Navigate to the Sanity directory
cd sanity

# Install the latest version of Sanity
echo "Updating Sanity to the latest version..."
npm install sanity@latest

# Navigate back to the root directory
cd ..

# Navigate to the Nuxt directory
cd nuxt

# Install the necessary dependencies for Nuxt
echo "Installing Nuxt dependencies..."
npm install @sanity/visual-editing

# Navigate back to the root directory
cd ..

echo "Setup complete! You can now start the development servers:"
echo "- Sanity Studio: cd sanity && npm run dev"
echo "- Nuxt frontend: cd nuxt && npm run dev" 