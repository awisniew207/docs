// Plugin to change file icons to folder icons for certain pages
// @ts-check
import * as td from 'typedoc';
import fs from 'fs';
import path from 'path';

const { RendererEvent } = td;

/**
 * @param {td.Application} app
 */
export const load = function (app) {
  app.renderer.on(RendererEvent.END, (event) => {
    // Add a script to all generated HTML pages that will update the icons
    const script = `
<script>
document.addEventListener('DOMContentLoaded', function() {
  // Function to update icons
  function updateIcons() {
    // Find all links to Official Abilities and Official Policies pages
    const overviewLinks = document.querySelectorAll('a[href*="Official_Abilities.html"], a[href*="Official_Policies.html"]');
    
    overviewLinks.forEach(link => {
      const useElement = link.querySelector('svg use[href="#icon-8388608"]');
      if (useElement) {
        // Change file icon to folder icon
        useElement.setAttribute('href', '#icon-folder');
      }
    });
  }
  
  // Run immediately
  updateIcons();
  
  // Also run when navigation expands (for lazy-loaded content)
  const observer = new MutationObserver(updateIcons);
  const navContainer = document.getElementById('tsd-nav-container');
  if (navContainer) {
    observer.observe(navContainer, { childList: true, subtree: true });
  }
});
</script>
`;

    /**
     * @param {string} filePath
     */
    function addScriptToHtml(filePath) {
      if (filePath.endsWith('.html')) {
        try {
          let content = fs.readFileSync(filePath, 'utf8');
          if (!content.includes('updateIcons')) {
            // Add script before closing body tag
            content = content.replace('</body>', script + '</body>');
            fs.writeFileSync(filePath, content);
          }
        } catch (err) {
          console.error(`Error processing ${filePath}:`, err);
        }
      }
    }

    /**
     * @param {string} dir
     */
    function walkDir(dir) {
      const files = fs.readdirSync(dir);
      files.forEach((file) => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          walkDir(filePath);
        } else {
          addScriptToHtml(filePath);
        }
      });
    }

    // Process all HTML files in the output directory
    if (event.outputDirectory) {
      walkDir(event.outputDirectory);
    }
  });
};
