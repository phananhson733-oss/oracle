const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://astromind.app';

const STATIC_PATHS = [
  '/',
  '/dashboard',
  '/forecast',
  '/us',
  '/oracle',
  '/journal',
  '/wiki',
  '/wiki/classics',
  '/reports',
  '/auth',
  '/onboarding'
];

// Helper to extract IDs from file content using regex
function extractIds(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`);
    return [];
  }
  const content = fs.readFileSync(filePath, 'utf8');
  // Match { id: 'some-id' or id: "some-id"
  const regex = /id:\s*['"]([^'"]+)['"]/g;
  const ids = new Set();
  let match;
  while ((match = regex.exec(content)) !== null) {
    // Filter out common non-content IDs if any (like 'local' or temp ids if they appear in this pattern)
    // Also filter out generic pillar IDs if they are not pages (but in wiki.ts they are pillars AND items sometimes)
    // The wiki.ts file has pillars like 'planets', 'signs' which correspond to /wiki/planets ? No, usually /wiki/sun. 
    // Wait, the routes are /wiki/:id. 'planets' is a category/pillar.
    // Based on WikiHubPage, it links to /wiki/sun, etc.
    // Pillars might not be pages themselves or might be /wiki/planets.
    // Let's assume all found IDs in wiki.ts are valid wiki pages.
    ids.add(match[1]);
  }
  return Array.from(ids);
}

function generateSitemap() {
  const wikiFile = path.join(__dirname, '../backend/src/data/wiki.ts');
  const classicsFile = path.join(__dirname, '../backend/src/data/wiki-classics.ts'); // Prefer TS source
  const classicsJsFile = path.join(__dirname, '../backend/src/data/wiki-classics.js'); // Fallback

  const wikiIds = extractIds(wikiFile);
  
  // Try TS first, then JS for classics
  let classicsIds = extractIds(classicsFile);
  if (classicsIds.length === 0) {
    classicsIds = extractIds(classicsJsFile);
  }

  // Filter out some unlikely IDs if necessary (e.g., numeric placeholders)
  // For now, trust the data files.

  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

  // Add Static Paths
  STATIC_PATHS.forEach(p => {
    sitemap += `  <url>
    <loc>${BASE_URL}${p}</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
`;
  });

  // Add Wiki Paths
  wikiIds.forEach(id => {
    // Exclude potential non-page IDs if known. For now, include all.
    // Some IDs in wiki.ts might be 'house-1', 'sun', etc.
    sitemap += `  <url>
    <loc>${BASE_URL}/wiki/${id}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
  });

  // Add Classics Paths
  classicsIds.forEach(id => {
    sitemap += `  <url>
    <loc>${BASE_URL}/wiki/classics/${id}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
`;
  });

  sitemap += `</urlset>`;

  const outputPath = path.join(__dirname, '../public/sitemap.xml');
  fs.writeFileSync(outputPath, sitemap);
  console.log(`Sitemap generated with ${STATIC_PATHS.length} static, ${wikiIds.length} wiki, and ${classicsIds.length} classic URLs.`);
  console.log(`Saved to: ${outputPath}`);
}

generateSitemap();
