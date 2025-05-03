var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { app, BrowserWindow, ipcMain, dialog, desktopCapturer } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import isDev from 'electron-is-dev';
var mainWindow = null;
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
    var testHtmlPath = path.join(process.cwd(), 'test.html');
    var fileUrl = "file://".concat(testHtmlPath);
    console.log('Loading test file:', fileUrl);
    try {
        mainWindow.loadURL(fileUrl);
    }
    catch (error) {
        console.error('Failed to load test.html:', error);
        // Fall back to Vite server if test file fails
        mainWindow.loadURL('http://localhost:5173');
    }
    // Always open DevTools to help troubleshoot
    mainWindow.webContents.openDevTools();
    // Emitted when the window is closed
    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}
// Create window when Electron has finished initialization
app.whenReady().then(function () {
    createWindow();
    // Add test IPC handler
    ipcMain.handle('test-ipc', function () {
        console.log('Test IPC called!');
        return 'IPC is working!';
    });
    app.on('activate', function () {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0)
            createWindow();
    });
});
// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
// IPC handler to get screen sources
ipcMain.handle('get-screen-sources', function () { return __awaiter(void 0, void 0, void 0, function () {
    var sources;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, desktopCapturer.getSources({
                    types: ['screen', 'window'],
                    thumbnailSize: { width: 320, height: 180 }
                })];
            case 1:
                sources = _a.sent();
                return [2 /*return*/, sources];
        }
    });
}); });
// IPC handler to save screenshot
ipcMain.handle('save-screenshot', function (_, dataUrl) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, canceled, filePath, base64Data, buffer, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                return [4 /*yield*/, dialog.showSaveDialog({
                        title: 'Save Annotated Screenshot',
                        defaultPath: path.join(app.getPath('pictures'), 'screenshot.png'),
                        filters: [
                            { name: 'Images', extensions: ['png', 'jpg'] }
                        ]
                    })];
            case 1:
                _a = _b.sent(), canceled = _a.canceled, filePath = _a.filePath;
                if (!canceled && filePath) {
                    base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
                    buffer = Buffer.from(base64Data, 'base64');
                    // Write the file
                    fs.writeFileSync(filePath, buffer);
                    return [2 /*return*/, { success: true, filePath: filePath }];
                }
                return [2 /*return*/, { success: false, error: 'Save canceled' }];
            case 2:
                error_1 = _b.sent();
                console.error('Error saving file:', error_1);
                return [2 /*return*/, { success: false, error: error_1 }];
            case 3: return [2 /*return*/];
        }
    });
}); });
