const fs = require('fs');
const path = require('path');

const readmePath = path.join(__dirname, '..', 'README.md');

// Prefer the version passed by the release tooling (e.g. semantic-release's
// ${nextRelease.version}) and fall back to package.json when run by hand.
const version = process.argv[2] || require('../package.json').version;

if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
  console.error(`Refusing to update README with a non-semver version: ${version}`);
  process.exit(1);
}

console.log(`Updating README.md to version ${version}...`);

let readmeContent = fs.readFileSync(readmePath, 'utf8');

// Release badge text: "Release vX.Y.Z"
readmeContent = readmeContent.replace(/Release v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?/g, `Release v${version}`);

// shields.io badge URL: "Release-vX.Y.Z-blue"
readmeContent = readmeContent.replace(/Release-v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?-blue/g, `Release-v${version}-blue`);

// Download link directories: "/download/vX.Y.Z/"
readmeContent = readmeContent.replace(/\/download\/v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?\//g, `/download/v${version}/`);

// Release archive names: "feedly-theme-X.Y.Z.zip" / ".tar.gz"
readmeContent = readmeContent.replace(/feedly-theme-\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?\.(zip|tar\.gz)/g, `feedly-theme-${version}.$1`);

fs.writeFileSync(readmePath, readmeContent, 'utf8');
console.log('README.md updated successfully.');
