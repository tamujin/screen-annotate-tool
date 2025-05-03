import { app, BrowserWindow, ipcMain, dialog, desktopCapturer } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import isDev from 'electron-is-dev';

let mainWindow: BrowserWindow | null = null;

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

  // Try loading a simple test file first instead of the React app
  const testHtmlPath = path.join(process.cwd(), 'test.html');
  const fileUrl = `file://${testHtmlPath}`;
  console.log('Loading test file:', fileUrl);
  
  try {
    mainWindow.loadURL(fileUrl);
  } catch (error) {
    console.error('Failed to load test.html:', error);
    // Fall back to Vite server if test file fails
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
ipcMain.handle('save-screenshot', async (_, dataUrl: string) => {
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