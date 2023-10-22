import { spawnSync } from 'child_process';
import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import fs from 'fs';
import path from 'path';

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.js
// │
process.env.DIST = path.join(__dirname, '../dist');
process.env.VITE_PUBLIC = app.isPackaged
	? process.env.DIST
	: path.join(process.env.DIST, '../public');

let win: BrowserWindow | null;
// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];

const runCMD = (command: string, args: string[]) => {
	const result = spawnSync(command, args, {
		stdio: 'inherit',
		shell: true
	});
	if (result.error) {
		const error =
			result.error instanceof Error
				? result.error
				: new Error(`Unknown error: ${result.error}`);
		return Promise.reject(error);
	} else {
		if (result.status === 0) {
			return Promise.resolve();
		} else {
			return Promise.reject(
				new TypeError(`命令执行失败，退出码为:${result.status}`)
			);
		}
	}
};

const ipcGenerateImages = () => {
	ipcMain.handle(
		'generateImages',
		async (_event, params: GenerateImagesParams) => {
			const { filePath, outputDir, fps } = params;
			fs.mkdirSync(outputDir, { recursive: true });

			return runCMD('ffmpeg', [
				'-i',
				filePath,
				'-vf',
				`fps=${fps}`,
				path.join(outputDir, 'output_%d.jpg')
			]);
		}
	);
};

const ipcOpenFolder = () => {
	ipcMain.handle('openFolder', async (_event, dir: string) => {
		const openFolderCommand =
			process.platform === 'win32' ? 'explorer' : 'open';
		return runCMD(openFolderCommand, [dir]);
	});
};

const ipcGetOutputDir = () => {
	ipcMain.handle('getOutputDir', async () => {
		const outputDir = path.resolve(__dirname, '../output');
		fs.mkdirSync(outputDir, { recursive: true });
		return outputDir;
	});
};

const ipcSetOutputDir = () => {
	ipcMain.handle('setOutputDir', async () => {
		const result = await dialog.showOpenDialog({
			properties: ['openDirectory']
		});
		if (result.canceled) {
			return Promise.reject('User canceled');
		}
		return result.filePaths[0];
	});
};

const ipc = () => {
	ipcGenerateImages();
	ipcOpenFolder();
	ipcGetOutputDir();
	ipcSetOutputDir();
};

function createWindow() {
	win = new BrowserWindow({
		icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
		webPreferences: {
			preload: path.join(__dirname, 'preload.js')
		}
	});

	win.webContents.openDevTools();

	// Test active push message to Renderer-process.
	win.webContents.on('did-finish-load', () => {
		win?.webContents.send('main-process-message', new Date().toLocaleString());
	});

	if (VITE_DEV_SERVER_URL) {
		win.loadURL(VITE_DEV_SERVER_URL);
	} else {
		// win.loadFile('dist/index.html')
		win.loadFile(path.join(process.env.DIST, 'index.html'));
	}

	ipc();
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
		win = null;
	}
});

app.on('activate', () => {
	// On OS X it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow();
	}
});

app.whenReady().then(createWindow);
