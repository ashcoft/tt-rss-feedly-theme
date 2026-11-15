const { test, expect } = require('@playwright/test');
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { isValidSemver, rewriteReadme } = require('../scripts/update-version-refs');

// The README's release references, as the updater leaves them for a version.
const readmeFor = (version) =>
  [
    `[![Release v${version}](https://img.shields.io/badge/Release-v${version}-blue)](https://github.com/ashcoft/tt-rss-feedly-theme/releases)`,
    `[![Download ZIP](https://img.shields.io/badge/Download-ZIP-orange)](https://github.com/ashcoft/tt-rss-feedly-theme/releases/download/v${version}/feedly-theme-${version}.zip)`,
    `[![Download TAR.GZ](https://img.shields.io/badge/Download-TAR.GZ-green)](https://github.com/ashcoft/tt-rss-feedly-theme/releases/download/v${version}/feedly-theme-${version}.tar.gz)`,
  ].join('\n');

const START = readmeFor('4.7.1');

test.describe('README version updater', () => {
  test('follows stable, prerelease, prerelease, stable', () => {
    let readme = START;

    for (const version of ['4.8.0', '4.8.0-beta.1', '4.8.0-beta.2', '4.8.0']) {
      readme = rewriteReadme(readme, version);
      // Every reference must point at the new version, with no leftover suffix.
      expect(readme).toBe(readmeFor(version));
    }
  });

  test('leaves output unchanged when run again at the same version', () => {
    const once = rewriteReadme(START, '4.8.0');
    expect(rewriteReadme(once, '4.8.0')).toBe(once);
  });

  test('accepts valid versions', () => {
    for (const version of ['4.8.0', '4.8.0-beta.1', '4.8.0-rc.1+build.7', '10.0.0', '1.0.0-0.3.7']) {
      expect(isValidSemver(version), version).toBe(true);
    }
  });

  test('rejects invalid versions', () => {
    for (const version of ['04.8.0', '4.8.0-..', '4.8.0+', '4.8.0-', '1.2', '1.2.3.4', 'abc', '', '4.8.0-beta..1', '-1.2.3']) {
      expect(isValidSemver(version), version).toBe(false);
    }
  });

  test('the checked-in README is internally consistent', () => {
    // Both paths are literals, so no file path is assembled from a variable.
    const readme = fs.readFileSync('README.md', 'utf8');
    const versions = [
      /Release v([0-9A-Za-z.+-]+)/.exec(readme)[1],
      /badge\/Release-v([0-9A-Za-z.+-]+)-blue/.exec(readme)[1],
      /\/download\/v([0-9A-Za-z.+-]+)\//.exec(readme)[1],
      /feedly-theme-([0-9A-Za-z.+-]+)\.zip/.exec(readme)[1],
      /feedly-theme-([0-9A-Za-z.+-]+)\.tar\.gz/.exec(readme)[1],
    ];

    expect(new Set(versions).size, `README references disagree: ${versions.join(', ')}`).toBe(1);
    expect(isValidSemver(versions[0])).toBe(true);

    // Re-running the updater at the README's own version must be a no-op.
    expect(rewriteReadme(readme, versions[0])).toBe(readme);
  });

  test('CLI exits non-zero and leaves README.md untouched for an invalid version', () => {
    const before = fs.readFileSync('README.md', 'utf8');

    const status = (() => {
      try {
        execFileSync(process.execPath, ['scripts/update-version-refs.js', 'not-a-version'], { stdio: 'pipe' });
        return 0;
      } catch (error) {
        return error.status;
      }
    })();

    expect(status).not.toBe(0);
    expect(fs.readFileSync('README.md', 'utf8')).toBe(before);
  });

  test('CLI targets the repository README from any working directory', () => {
    const before = fs.readFileSync('README.md', 'utf8');
    // Only the CLI argument is absolute; the assertions read README.md by literal
    // path, so no file path is assembled from a variable.
    const script = path.resolve('scripts/update-version-refs.js');
    const released = /Release v([0-9A-Za-z.+-]+)/.exec(before)[1];

    try {
      // Re-applying the README's own version is a no-op wherever the CLI runs.
      execFileSync(process.execPath, [script, released], { cwd: os.tmpdir(), stdio: 'pipe' });
      expect(fs.readFileSync('README.md', 'utf8')).toBe(before);
    } finally {
      fs.writeFileSync('README.md', before, 'utf8');
    }
  });
});
