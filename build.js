const { execSync } = require('child_process');
const path = require('path');

console.log('Starting build process...');
console.log('Current directory:', process.cwd());
console.log('Directory contents:', require('fs').readdirSync('.'));

const frontendDir = path.join(process.cwd(), 'frontend');
console.log('Frontend directory:', frontendDir);

try {
  console.log('\n📦 Installing dependencies...');
  execSync('npm install --legacy-peer-deps', { 
    cwd: frontendDir, 
    stdio: 'inherit' 
  });

  console.log('\n🔨 Building React app...');
  execSync('npm run build', { 
    cwd: frontendDir, 
    stdio: 'inherit' 
  });

  console.log('\n✅ Build complete!');
} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  process.exit(1);
}
