const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test.describe('Theme files validation', () => {
  test('CSS files exist and have valid content', () => {
    const distDir = path.join(__dirname, '..', 'dist');
    
    // Check dist directory exists (built files)
    expect(fs.existsSync(distDir)).toBeTruthy();
    
    // Check for theme CSS files
    const cssFiles = fs.readdirSync(distDir).filter(f => f.startsWith('feedly') && f.endsWith('.css'));
    expect(cssFiles.length).toBeGreaterThan(0);
    
    // Verify each CSS file has content
    cssFiles.forEach(file => {
      const content = fs.readFileSync(path.join(distDir, file), 'utf8');
      expect(content.length).toBeGreaterThan(100);
    });
  });

  test('CSS files have valid syntax', () => {
    const distDir = path.join(__dirname, '..', 'dist');
    const cssFiles = fs.readdirSync(distDir).filter(f => f.startsWith('feedly') && f.endsWith('.css'));
    
    cssFiles.forEach(file => {
      const content = fs.readFileSync(path.join(distDir, file), 'utf8');
      
      // Basic CSS syntax validation
      expect(content).toContain('{');
      expect(content).toContain('}');
      
      // Check balanced braces
      const openBraces = (content.match(/{/g) || []).length;
      const closeBraces = (content.match(/}/g) || []).length;
      expect(openBraces).toBe(closeBraces);
    });
  });
});
