// Site
import site from './settings/site';

//Pages
import home from './pages/home';
import projectsPage from './pages/projects-page';
import contactPage from './pages/contact-page';

// Collections
import project from './collections/project';

// Builders
import textBlock from './shared/builder/text-block';
import pullQuote from './shared/builder/pull-quote';
import singleImage from './shared/builder/single-image';
import heroExplosion from './shared/builder/hero-explosion';
import generalBlock from './shared/builder/general-block';
import carousel from './shared/builder/carousel';

// Shared 
import videoLoop from './shared/video-loop';
import videoPlayer from './shared/video-player';

export const schemaTypes = [
  site,
  home,
  projectsPage,
  contactPage,
  textBlock, 
  project,
  pullQuote, 
  singleImage, 
  heroExplosion,
  generalBlock,
  videoLoop, 
  videoPlayer,
  carousel
];
