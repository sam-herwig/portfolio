# About Page Wireframe Design

## Page Structure & Layout

### 1. Hero Section
**Layout:** Full viewport height with centered content
- **Background:** Dark theme (#1a1a1a) with subtle gradient overlay
- **Main Heading:** "About" - Large display typography (Poppins Extra Bold, 4rem)
- **Subheading:** Brief tagline - Medium typography (Poppins Semi Bold, 1.5rem)
- **Hero Image/Animation:** Circular text component with profile image in center
  - Rotating text: "Creative Developer • UI/UX Designer • Problem Solver •"
  - Center image: Professional headshot or brand logo
  - Interactive hover effect with color shift

### 2. Introduction Block
**Layout:** Center-aligned text block with max-width container
- **Content Width:** 800px max-width for optimal reading
- **Paragraph Text:** Large body text (Poppins Regular, 1.125rem)
- **Highlight Color:** Key phrases in brand red (#e94234)
- **Spacing:** Generous padding (4rem top/bottom)

### 3. Skills & Expertise Section
**Layout:** Masonry wall component with mixed media
- **Grid Structure:** 3 columns on desktop, 2 on tablet, 1 on mobile
- **Cards Include:**
  - Skill categories with icon/image
  - Years of experience
  - Key technologies/tools
- **Interactive Elements:** Hover effects with scale and color transitions
- **Color Coding:** Different colors for different skill areas (green #559b88, purple #b280c9, gold #9a9247)

### 4. Experience Timeline
**Layout:** Alternating left/right content blocks
- **Timeline Line:** Vertical line with dot markers
- **Content Blocks:**
  - Company/Project name (Poppins Semi Bold)
  - Role title
  - Date range
  - Brief description
  - Key achievements (bullet points)
- **Visual Interest:** Alternating background colors (subtle ash #e5e5e5 overlay)

### 5. Personal Section
**Layout:** Full-width hero text component
- **Background:** Brand orange (#ff5501) with texture overlay
- **Content:** 
  - Personal interests/hobbies
  - Philosophy/approach to work
  - Fun facts or unique aspects
- **Typography:** Mix of Poppins and Omelet Hand for personality

### 6. Call-to-Action Section
**Layout:** Centered content with button
- **Heading:** "Let's Work Together"
- **Button:** Large CTA button linking to contact page
  - Background: Dark button color (#222222)
  - Hover: Brand red (#e94234)
  - Text: "Get In Touch"
- **Secondary Link:** "View My Work" → Projects page

### 7. Footer
**Standard footer component** with social links and copyright

## Interactive Elements

1. **Scroll Animations**
   - Fade-in effects for each section
   - Parallax scrolling for hero image
   - Stagger animations for masonry items

2. **Hover States**
   - Color transitions on interactive elements
   - Scale effects on cards
   - Cursor changes for clickable items

3. **Mobile Responsiveness**
   - Stack all content vertically
   - Adjust typography sizes
   - Simplify masonry to single column
   - Touch-friendly tap targets

## Color Usage
- **Primary Background:** Dark black (#1a1a1a)
- **Text:** White (#ffffff) on dark, Black (#000000) on light
- **Accent Colors:** Red (#e94234), Orange (#ff5501), Green (#559b88)
- **Supporting:** Gold (#9a9247), Purple (#b280c9)

## Typography Hierarchy
1. **Page Title:** Poppins Extra Bold, 4rem (desktop) / 2.5rem (mobile)
2. **Section Headers:** Poppins Semi Bold, 2.5rem / 1.75rem
3. **Subheadings:** Poppins Semi Bold, 1.5rem / 1.25rem
4. **Body Text:** Poppins Regular, 1.125rem / 1rem
5. **Accent Text:** Omelet Hand for personality touches

## Spacing System
- **Section Padding:** 4rem (desktop) / 2rem (mobile)
- **Element Spacing:** Based on design system ($space-m: 20px, $space-l: 30px, etc.)
- **Consistent Gutters:** Using existing gutter system from codebase