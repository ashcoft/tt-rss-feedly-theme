const fs = require('fs');
const path = require('path');

const readmePath = path.join(__dirname, '..', 'README.md');

// Prefer the version passed by the release tooling (e.g. semantic-release's
// ${nextRelease.version}) and fall back to package.json when run by hand.
const version = process.argv[2] ?? require('../package.json').version;

// Split on '-' rather than matching the whole version in one pattern: a single
// pattern for "X.Y.Z-prerelease" needs a nested quantifier, which static
// analysis flags as a potential ReDoS. Each piece is a flat check instead.
const [core, ...pre] = version.split('-');
const coreParts = core.split('.');

if (coreParts.length !== 3 || !coreParts.every((part) => /^\d+$/.test(part)) || pre.some((part) => !/^[0-9A-Za-z.]+$/.test(part))) {
  console.error(`Refusing to update README with a non-semver version: ${version}`);
  process.exit(1);
}

console.log(`Updating README.md to version ${version}...`);

let readmeContent = fs.readFileSync(readmePath, 'utf8');

// Release badge text: "Release vX.Y.Z"
readmeContent = readmeContent.replace(/Release v\d+\.\d+\.\d+/g, `Release v${version}`);

// shields.io badge URL: "Release-vX.Y.Z-blue"
readmeContent = readmeContent.replace(/Release-v\d+\.\d+\.\d+-blue/g, `Release-v${version}-blue`);

// Download link directories: "/download/vX.Y.Z/"
readmeContent = readmeContent.replace(/\/download\/v\d+\.\d+\.\d+\//g, `/download/v${version}/`);

// Release archive names: "feedly-theme-X.Y.Z.zip" / ".tar.gz"
readmeContent = readmeContent.replace(/feedly-theme-\d+\.\d+\.\d+\.(zip|tar\.gz)/g, `feedly-theme-${version}.$1`);

fs.writeFileSync(readmePath, readmeContent, 'utf8');
console.log('README.md updated successfully.');
