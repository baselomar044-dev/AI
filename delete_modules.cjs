
const fs = require('fs');
const path = require('path');

const p = path.join(__dirname, 'node_modules');

console.log(`Deleting ${p}...`);

try {
  fs.rmSync(p, { recursive: true, force: true });
  console.log('Deleted successfully.');
} catch (e) {
  console.error('Failed to delete:', e.message);
}
