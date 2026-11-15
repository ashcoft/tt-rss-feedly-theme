const fs = require('fs');
const path = require('path');

const readmePath = path.join(__dirname, '..', 'README.md');

// Prefer the version passed by the release tooling (e.g. semantic-release's
// ${nextRelease.version}) and fall back to package.json when run by hand.
const version = process.argv[2] ?? require('../package.json').version;

// Validate the version by splitting it into identifiers instead of matching the
// whole thing in one pattern: a single "X.Y.Z-prerelease+build" pattern needs a
// nested quantifier, which static analysis flags as a potential ReDoS, and a
// hand-rolled pattern tends to drift from the SemVer spec.
const isNumericIdentifier = (part) => /^(?:0|[1-9]\d*)$/.test(part);
const isIdentifier = (part) => /^[0-9A-Za-z-]+$/.test(part);
// Prerelease identifiers are alphanumeric, but a purely numeric one must not
// have leading zeroes.
const isPrereleaseIdentifier = (part) => isIdentifier(part) && (!/^\d+$/.test(part) || isNumericIdentifier(part));

function isValidSemver(value) {
  const plus = value.indexOf('+');
  const core = plus === -1 ? value : value.slice(0, plus);
  const build = plus === -1 ? null : value.slice(plus + 1);
  // Split on the first hyphen only: prerelease identifiers may contain hyphens.
  const dash = core.indexOf('-');
  const main = dash === -1 ? core : core.slice(0, dash);
  const pre = dash === -1 ? null : core.slice(dash + 1);
  const coreParts = main.split('.');

  if (coreParts.length !== 3 || !coreParts.every(isNumericIdentifier)) {
    return false;
  }
  // The prerelease part is a dot-separated list of identifiers.
  if (pre !== null && !pre.split('.').every(isPrereleaseIdentifier)) {
    return false;
  }
  // A "+" must be followed by dot-separated build identifiers.
  return build === null || (build.length > 0 && build.split('.').every(isIdentifier));
}

if (!isValidSemver(version)) {
  console.error(`Refusing to update README with a non-semver version: ${version}`);
  process.exit(1);
}

console.log(`Updating README.md to version ${version}...`);

let readmeContent = fs.readFileSync(readmePath, 'utf8');

// Each pattern matches the complete previous version, prerelease suffix
// included, so a run after a prerelease release moves every reference forward.
// The character class is greedy and stops at the literal delimiter that follows
// it, so no backtracking-prone nested quantifier is needed.

// Release badge text: "Release vX.Y.Z"
readmeContent = readmeContent.replace(/Release v[0-9A-Za-z.+-]+/g, `Release v${version}`);

// shields.io badge URL: "Release-vX.Y.Z-blue"
readmeContent = readmeContent.replace(/Release-v[0-9A-Za-z.+-]+-blue/g, `Release-v${version}-blue`);

// Download link directories: "/download/vX.Y.Z/"
readmeContent = readmeContent.replace(/\/download\/v[0-9A-Za-z.+-]+\//g, `/download/v${version}/`);

// Release archive names: "feedly-theme-X.Y.Z.zip" / ".tar.gz"
readmeContent = readmeContent.replace(/feedly-theme-[0-9A-Za-z.+-]+\.(zip|tar\.gz)/g, `feedly-theme-${version}.$1`);

fs.writeFileSync(readmePath, readmeContent, 'utf8');
console.log('README.md updated successfully.');
