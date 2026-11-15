const { test, expect } = require('@playwright/test');
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { isValidSemver, rewriteReadme, updateReadme } = require('../scripts/update-version-refs');

const scriptPath = path.join(__dirname, '..', 'scripts', 'update-version-refs.js');
const repoReadmePath = path.join(__dirname, '..', 'README.md');

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

  test('rewrites a README file in place', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'version-refs-'));
    const readmePath = path.join(dir, 'README.md');
    fs.writeFileSync(readmePath, START, 'utf8');

    try {
      updateReadme('4.8.0', readmePath);
      expect(fs.readFileSync(readmePath, 'utf8')).toBe(readmeFor('4.8.0'));
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  test('CLI exits non-zero and leaves README.md untouched for an invalid version', () => {
    const before = fs.readFileSync(repoReadmePath, 'utf8');

    const status = (() => {
      try {
        execFileSync(process.execPath, [scriptPath, 'not-a-version'], { stdio: 'pipe' });
        return 0;
      } catch (error) {
        return error.status;
      }
    })();

    expect(status).not.toBe(0);
    expect(fs.readFileSync(repoReadmePath, 'utf8')).toBe(before);
  });
});
