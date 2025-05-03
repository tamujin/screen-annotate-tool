const { app, BrowserWindow, ipcMain, dialog, desktopCapturer } = require('electron');
const path = require('path');
const fs = require('fs');
const isDev = require('electron-is-dev');

let mainWindow = null;

function createWindow() {
  // Create the browser window with simpler configuration
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Log debugging information
  console.log('isDev:', isDev);
  console.log('__dirname:', __dirname);
  console.log('process.env.ELECTRON_START_URL:', process.env.ELECTRON_START_URL);
  console.log('Process CWD:', process.cwd());

  // Always try to load our test.html file directly
  const testHtmlPath = path.join(process.cwd(), 'test.html');
  console.log('Test HTML path:', testHtmlPath);
  
  if (fs.existsSync(testHtmlPath)) {
    console.log('Test HTML file exists, loading it');
    const fileUrl = `file://${testHtmlPath}`;
    mainWindow.loadURL(fileUrl);
  } else {
    console.error('Test HTML file does not exist!');
    mainWindow.loadURL('http://localhost:5173');
  }

  // Always open DevTools to help troubleshoot
  mainWindow.webContents.openDevTools();

  // Emitted when the window is closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Create window when Electron has finished initialization
app.whenReady().then(() => {
  createWindow();

  // Add test IPC handler
  ipcMain.handle('test-ipc', () => {
    console.log('Test IPC called!');
    return 'IPC is working!';
  });

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handler to get screen sources
ipcMain.handle('get-screen-sources', async () => {
  const sources = await desktopCapturer.getSources({
    types: ['screen', 'window'],
    thumbnailSize: { width: 320, height: 180 }
  });
  return sources;
});

// IPC handler to save screenshot
ipcMain.handle('save-screenshot', async (_, dataUrl) => {
  try {
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Save Annotated Screenshot',
      defaultPath: path.join(app.getPath('pictures'), 'screenshot.png'),
      filters: [
        { name: 'Images', extensions: ['png', 'jpg'] }
      ]
    });

    if (!canceled && filePath) {
      // Convert data URL to buffer
      const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      
      // Write the file
      fs.writeFileSync(filePath, buffer);
      return { success: true, filePath };
    }
    return { success: false, error: 'Save canceled' };
  } catch (error) {
    console.error('Error saving file:', error);
    return { success: false, error };
  }
}); 