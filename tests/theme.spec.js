const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test.describe('Theme files validation', () => {
  test('CSS files exist in root and have valid content', () => {
    const rootDir = path.join(__dirname, '..');

    // Check for theme CSS files in root
    const files = fs.readdirSync(rootDir);
    const cssFiles = files.filter(f => f.startsWith('feedly') && f.endsWith('.css'));
    expect(cssFiles.length).toBeGreaterThan(0);

    // Verify each CSS file has content
    cssFiles.forEach(file => {
      const content = fs.readFileSync(path.join(rootDir, file), 'utf8');
      expect(content.length).toBeGreaterThan(10);
    });
  });

  test('CSS files have valid syntax', () => {
    const rootDir = path.join(__dirname, '..');
    const files = fs.readdirSync(rootDir);
    // Exclude _auto.css files as they only contain @import statements
    const cssFiles = files
      .filter(f => f.startsWith('feedly') && f.endsWith('.css') && !f.includes('_auto'));

    cssFiles.forEach(file => {
      const content = fs.readFileSync(path.join(rootDir, file), 'utf8');

      // Skip import-only files
      if (content.includes('@import') && !content.includes('{')) {
        // Validates import-only files have proper import syntax
        const imports = content.match(/@import\s+["'][^"']+["']/g);
        expect(imports).toBeTruthy();
        expect(imports.length).toBeGreaterThan(0);
        return;
      }

      // Basic CSS syntax validation for actual CSS files
      expect(content).toContain('{');
      expect(content).toContain('}');

      // Check balanced braces
      const openBraces = (content.match(/{/g) || []).length;
      const closeBraces = (content.match(/}/g) || []).length;
      expect(openBraces).toBe(closeBraces);
    });
  });

  test('feedly directory and fonts exist', () => {
    const rootDir = path.join(__dirname, '..');
    const feedlyDir = path.join(rootDir, 'feedly');

    expect(fs.existsSync(feedlyDir)).toBeTruthy();
    expect(fs.existsSync(path.join(feedlyDir, 'fonts'))).toBeTruthy();

    const fontFiles = fs.readdirSync(path.join(feedlyDir, 'fonts'));
    expect(fontFiles.length).toBeGreaterThan(0);
  });
});
