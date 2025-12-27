// Site
import site from './settings/site';

//Pages
import home from './pages/home';
import contactPage from './pages/contact-page';
import aboutPage from './pages/about-page';

// Collections
import project from './collections/project';

// Builders
import textBlock from './shared/builder/text-block';
import pullQuote from './shared/builder/pull-quote';
import singleImage from './shared/builder/single-image';
import heroExplosion from './shared/builder/hero-explosion';
import heroText from './shared/builder/hero-text';
import generalBlock from './shared/builder/general-block';
import carousel from './shared/builder/carousel';
import masonryWall from './shared/builder/masonry-wall';
import circularText from './shared/builder/circular-text';
import flowingMenu from './shared/builder/flowing-menu';
import expandableGallery from './shared/builder/expandable-gallery';

// Shared 
import videoLoop from './shared/video-loop';
import videoPlayer from './shared/video-player';

export const schemaTypes = [
  site,
  home,
  contactPage,
  aboutPage,
  project,
  textBlock, 
  pullQuote, 
  singleImage, 
  heroExplosion,
  heroText,
  generalBlock,
  videoLoop, 
  videoPlayer,
  carousel,
  masonryWall,
  circularText,
  flowingMenu,
  expandableGallery
];
