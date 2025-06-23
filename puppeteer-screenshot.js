const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Create screenshots directory if it doesn't exist
const screenshotsDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir);
}

// Function to take a screenshot of a specific page
async function takeScreenshot(url, filename, viewport = { width: 1280, height: 800 }) {
  console.log(`Taking screenshot of ${url}...`);
  
  const browser = await puppeteer.launch({
    headless: 'new', // Use the new headless mode
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport(viewport);
    
    // Navigate to URL
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Wait for any animations to complete (adjust as needed)
    await page.waitForTimeout(2000);
    
    // Take screenshot
    const screenshotPath = path.join(screenshotsDir, `${filename}.png`);
    await page.screenshot({ 
      path: screenshotPath,
      fullPage: true
    });
    
    console.log(`Screenshot saved to ${screenshotPath}`);
  } catch (error) {
    console.error('Error taking screenshot:', error);
  } finally {
    await browser.close();
  }
}

// Function to take screenshots of multiple pages
async function takeMultipleScreenshots(pages) {
  for (const page of pages) {
    await takeScreenshot(page.url, page.filename, page.viewport);
  }
}

// Function to take a screenshot of a specific component by selector
async function takeComponentScreenshot(url, selector, filename, viewport = { width: 1280, height: 800 }) {
  console.log(`Taking screenshot of component ${selector} on ${url}...`);
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport(viewport);
    
    // Navigate to URL
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Wait for any animations to complete
    await page.waitForTimeout(2000);
    
    // Wait for the selector to be available
    await page.waitForSelector(selector, { timeout: 5000 });
    
    // Get the element
    const element = await page.$(selector);
    
    if (!element) {
      throw new Error(`Element with selector "${selector}" not found`);
    }
    
    // Take screenshot of just that element
    const screenshotPath = path.join(screenshotsDir, `${filename}.png`);
    await element.screenshot({ 
      path: screenshotPath
    });
    
    console.log(`Component screenshot saved to ${screenshotPath}`);
  } catch (error) {
    console.error('Error taking component screenshot:', error);
  } finally {
    await browser.close();
  }
}

// Example usage
async function main() {
  // Define the pages to screenshot
  const pages = [
    { 
      url: 'http://localhost:3001', 
      filename: 'homepage',
      viewport: { width: 1280, height: 800 }
    },
    { 
      url: 'http://localhost:3001', 
      filename: 'homepage-mobile',
      viewport: { width: 375, height: 667 }
    }
  ];
  
  // Take screenshots of full pages
  await takeMultipleScreenshots(pages);
  
  // Take screenshots of specific components
  await takeComponentScreenshot(
    'http://localhost:3001',
    '.builder-image-explosion',
    'image-explosion-component'
  );
  
  // Take screenshot of gradient text component
  await takeComponentScreenshot(
    'http://localhost:3001',
    '.builder-gradient-text',
    'gradient-text-component'
  );
  
  // Take a screenshot after the animation completes (wait for gradient to appear)
  await takeDelayedScreenshot(
    'http://localhost:3001',
    'explosion-to-gradient-transition',
    { width: 1280, height: 800 },
    8000 // Wait 8 seconds for the explosion animation and transition to complete
  );
}

// Function to take a screenshot after a delay
async function takeDelayedScreenshot(url, filename, viewport = { width: 1280, height: 800 }, delay = 5000) {
  console.log(`Taking delayed screenshot of ${url} after ${delay}ms...`);
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport(viewport);
    
    // Navigate to URL
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Wait for the specified delay
    console.log(`Waiting for ${delay}ms before taking screenshot...`);
    await page.waitForTimeout(delay);
    
    // Take screenshot
    const screenshotPath = path.join(screenshotsDir, `${filename}.png`);
    await page.screenshot({ 
      path: screenshotPath,
      fullPage: true
    });
    
    console.log(`Delayed screenshot saved to ${screenshotPath}`);
  } catch (error) {
    console.error('Error taking delayed screenshot:', error);
  } finally {
    await browser.close();
  }
}

// Check if this file is being run directly
if (require.main === module) {
  main().catch(console.error);
}

// Export functions for use in other scripts
module.exports = {
  takeScreenshot,
  takeMultipleScreenshots,
  takeComponentScreenshot,
  takeDelayedScreenshot
};
