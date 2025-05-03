// Simple starter script for Electron
const { spawn } = require('child_process');
const electronPath = require('electron');
const path = require('path');

// Start Electron
const electron = spawn(electronPath, ['.'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'development',
    ELECTRON_START_URL: 'http://localhost:5173'
  }
});

electron.on('close', (code) => {
  console.log(`Electron process exited with code ${code}`);
  process.exit(code);
}); 