const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, '..', 'package.json');
const readmePath = path.join(__dirname, '..', 'README.md');

if (!fs.existsSync(packageJsonPath)) {
  console.error('Error: package.json not found');
  process.exit(1);
}

if (!fs.existsSync(readmePath)) {
  console.error('Error: README.md not found');
  process.exit(1);
}

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const version = packageJson.version;

if (!version) {
  console.error('Error: Version not found in package.json');
  process.exit(1);
}

console.log(`Updating README.md to version ${version}...`);

let readmeContent = fs.readFileSync(readmePath, 'utf8');
const originalContent = readmeContent;

// Semver regex pattern
const semverPattern = /\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?/;

const replacements = [
  {
    name: 'Release badge text',
    pattern: new RegExp(`Release v${semverPattern.source}`, 'g'),
    replacement: `Release v${version}`
  },
  {
    name: 'Shields.io badge URL',
    pattern: new RegExp(`Release-v${semverPattern.source}-blue`, 'g'),
    replacement: `Release-v${version}-blue`
  },
  {
    name: 'Download links',
    pattern: new RegExp(`\\/download\\/v${semverPattern.source}\\/`, 'g'),
    replacement: `/download/v${version}/`
  },
  {
    name: 'Zip filename',
    pattern: new RegExp(`tt-rss-feedly-theme-dist-v${semverPattern.source}\\.zip`, 'g'),
    replacement: `tt-rss-feedly-theme-dist-v${version}.zip`
  },
  {
    name: 'Quick Start download text',
    pattern: new RegExp(`Download v${semverPattern.source}`, 'g'),
    replacement: `Download v${version}`
  }
];

let totalMatches = 0;
replacements.forEach(r => {
  const matches = readmeContent.match(r.pattern);
  if (!matches) {
    console.warn(`Warning: No matches found for ${r.name} using pattern ${r.pattern}`);
  } else {
    totalMatches += matches.length;
    readmeContent = readmeContent.replace(r.pattern, r.replacement);
  }
});

if (totalMatches === 0 && originalContent.includes('v')) {
    console.error('Error: No version replacements were made in README.md. Format might have changed.');
    process.exit(1);
}

if (readmeContent === originalContent) {
  console.log('README.md is already up to date.');
} else {
  fs.writeFileSync(readmePath, readmeContent, 'utf8');
  console.log(`README.md updated successfully (${totalMatches} replacements).`);
}
