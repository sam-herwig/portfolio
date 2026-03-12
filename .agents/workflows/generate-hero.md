---
name: generate-hero
description: Generates a high-quality 4K hero video using Veo 3.1 and integrates it into the website template code.
---

# Goal
To automate the creation of cinematic background videos for website hero sections and ensure they are properly implemented in the codebase.

# Instructions
1. **Understand Context**: Analyze the current file's CSS, theme, and purpose (e.g., "minimalist real estate," "tech startup").
2. **Generate Video**: 
   - Use the browser tool to navigate to the Google Flow/Veo interface.
   - Prompt Veo 3.1 for an 8-second cinematic loop based on the project vibe.
   - Select "4K" and "16:9 aspect ratio."
3. **Save Asset**: Download the video and save it to the project's `/public/assets/videos/` directory. Use a descriptive slug like `hero-bg-v1.mp4`.
4. **Update Code**:
   - Locate the `<Hero>` or `<section>` component in the active file.
   - Insert or update a `<video>` tag with `autoPlay`, `muted`, and `loop` attributes.
   - Set the `src` to the newly saved asset path.
5. **Verify**: Check the file structure to ensure the asset exists and provide a preview in the Antigravity manager.

# Constraints
- Do not use more than 100 credits without confirming with the user.
- Always save files in .mp4 format unless otherwise specified.
- Ensure the video is muted by default to follow browser autoplay policies.
