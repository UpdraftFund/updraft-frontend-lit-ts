/**
 * Generate Version File
 * 
 * This script generates a version.json file with a timestamp-based version number.
 * It's meant to be run during the build process to create a unique version identifier
 * for each build, which can be used to detect when a new version is deployed.
 */

import fs from 'fs';
import path from 'path';

// Generate a version based on the current timestamp
// This ensures each build has a unique version
const version = new Date().toISOString();

// Create the version data object
const versionData = {
  version,
  buildTime: new Date().toISOString()
};

// Path to the public directory where the version.json file will be placed
const publicDir = path.resolve('public');

// Create the public directory if it doesn't exist
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Write the version.json file
fs.writeFileSync(
  path.join(publicDir, 'version.json'),
  JSON.stringify(versionData, null, 2)
);

// Also inject the version into the index.html as a meta tag
const indexPath = path.resolve('index.html');
let indexContent = fs.readFileSync(indexPath, 'utf8');

// Check if the meta tag already exists
if (indexContent.includes('<meta name="app-version"')) {
  // Update the existing meta tag
  indexContent = indexContent.replace(
    /<meta name="app-version"[^>]*>/,
    `<meta name="app-version" content="${version}">`
  );
} else {
  // Add the meta tag before the closing head tag
  indexContent = indexContent.replace(
    '</head>',
    `  <meta name="app-version" content="${version}">\n  </head>`
  );
}

// Write the updated index.html
fs.writeFileSync(indexPath, indexContent);

console.log(`Generated version.json with version: ${version}`);

