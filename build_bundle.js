const fs = require('fs');

function stripModuleSyntax(code) {
  return code
    .replace(/^import\s+[\s\S]*?from\s+['"].*?['"];?\s*$/gm, '')
    .replace(/^export\s+(function|const|let|var)/gm, '$1');
}

const files = [
  'historicalMonthlyData.js',
  'financeEngine.js',
  'chartEngine.js',
  'app.js'
];

const combined = files
  .map((f) => `// === ${f} ===\n` + stripModuleSyntax(fs.readFileSync(f, 'utf8')))
  .join('\n\n');

fs.writeFileSync('bundle.js', combined, 'utf8');
console.log('Successfully built bundle.js:', fs.statSync('bundle.js').size, 'bytes');
