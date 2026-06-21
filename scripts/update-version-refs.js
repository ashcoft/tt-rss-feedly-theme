const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, '..', 'package.json');
const readmePath = path.join(__dirname, '..', 'README.md');

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const version = packageJson.version;

console.log(`Updating README.md to version ${version}...`);

let readmeContent = fs.readFileSync(readmePath, 'utf8');

// Robust semver regex pattern
const vPattern = /v\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?/;

// Update release badge text: [Release vX.Y.Z]
readmeContent = readmeContent.replace(/Release v\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?/g, `Release v${version}`);

// Update shields.io badge URL: Release-vX.Y.Z-blue
readmeContent = readmeContent.replace(/Release-v\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?-blue/g, `Release-v${version}-blue`);

// Update download links: /download/vX.Y.Z/
readmeContent = readmeContent.replace(/\/download\/v\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?\//g, `/download/v${version}/`);

// Update zip filename: tt-rss-feedly-theme-dist-vX.Y.Z.zip
readmeContent = readmeContent.replace(/tt-rss-feedly-theme-dist-v\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?\.zip/g, `tt-rss-feedly-theme-dist-v${version}.zip`);

// Update Quick Start download text: Download vX.Y.Z
readmeContent = readmeContent.replace(/Download v\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?/g, `Download v${version}`);

fs.writeFileSync(readmePath, readmeContent, 'utf8');
console.log('README.md updated successfully.');
