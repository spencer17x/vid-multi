import { app, BrowserWindow, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import path from 'path';

import { isDev } from './variables';

export const setUpUpdater = (mainWindow: BrowserWindow) => {
	if (isDev) {
		autoUpdater.updateConfigPath = path.join(
			__dirname,
			'../dev-app-update.yml'
		);
		Object.defineProperty(app, 'isPackaged', {
			get() {
				return true;
			}
		});
	}

	autoUpdater.autoDownload = false;

	autoUpdater.on('error', (error) => {
		mainWindow.webContents.send('error', error);
	});

	ipcMain.on('checkForUpdates', async () => {
		await autoUpdater.checkForUpdates();
	});
	autoUpdater.on('checking-for-update', () => {
		mainWindow.webContents.send('checkingForUpdate');
	});
	autoUpdater.on('update-available', () => {
		mainWindow.webContents.send('updateAvailable');
	});
	autoUpdater.on('update-not-available', () => {
		mainWindow.webContents.send('updateNotAvailable');
	});

	ipcMain.on('downloadUpdate', async () => {
		await autoUpdater.downloadUpdate();
	});
	autoUpdater.on('download-progress', (progress) => {
		mainWindow.webContents.send('downloadProgress', progress);
	});
	autoUpdater.on('update-downloaded', () => {
		mainWindow.webContents.send('updateDownloaded');
	});

	ipcMain.on('installUpdate', () => {
		autoUpdater.quitAndInstall();
	});
	ipcMain.on('checkAppVersion', () => {
		mainWindow.webContents.send('version', app.getVersion());
	});
};
