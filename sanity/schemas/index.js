// Site
import site from './settings/site';

//Pages
import home from './pages/home';

// Collections
import caseStudy from './collections/case-study';
import project from './collections/project';

// Builders
import textBlock from './shared/builder/text-block';
import pullQuote from './shared/builder/pull-quote';
import singleImage from './shared/builder/single-image';

// Shared 
import videoLoop from './shared/video-loop';
import videoPlayer from './shared/video-player';

export const schemaTypes = [
  site,
  home,
  textBlock, 
  caseStudy,
  project,
  pullQuote, 
  singleImage, 
  videoLoop, 
  videoPlayer
];
