import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import path from 'path';

import { isDev } from './variables';

const message = {
	error: 'Error checking for updates',
	checking: 'Checking for updates...',
	updateAvailable: 'Update available',
	updateNotAvailable: 'Update not available'
};

if (isDev) {
	autoUpdater.updateConfigPath = path.join(__dirname, 'dev-app-update.yml');
}

export const setUpUpdater = (mainWindow: BrowserWindow) => {
	console.log('setUpUpdater');
	const sendUpdateMessage = (text: string) => {
		mainWindow.webContents.send('message', text);
	};

	autoUpdater.autoDownload = false;

	autoUpdater.on('error', (error) => {
		sendUpdateMessage(`${message.error}:${error}`);
	});

	autoUpdater.on('checking-for-update', () => {
		sendUpdateMessage(message.checking);
	});

	autoUpdater.on('update-available', () => {
		dialog
			.showMessageBox({
				type: 'info',
				title: 'The app has new updates',
				message: 'Found a new version, do you want to update now?',
				buttons: ['Yes', 'No']
			})
			.then(({ response }) => {
				if (response === 0) {
					autoUpdater.downloadUpdate();
					sendUpdateMessage(message.updateAvailable);
				}
			});

		// You can also update directly by default, choose one of the two
		// autoUpdater.downloadUpdate();
		// sendUpdateMessage(message.updateAva);
	});

	autoUpdater.on('update-not-available', () => {
		sendUpdateMessage(message.updateNotAvailable);
	});

	autoUpdater.on('download-progress', (progress) => {
		mainWindow.webContents.send('downloadProgress', progress);
	});

	autoUpdater.on('update-downloaded', () => {
		dialog
			.showMessageBox({
				title: 'Install update',
				message:
					'Once the update is downloaded, the app will restart and install'
			})
			.then(() => {
				setImmediate(() => autoUpdater.quitAndInstall());
			});
	});

	ipcMain.on('checkForUpdate', () => {
		autoUpdater.checkForUpdates();
	});
	ipcMain.on('checkAppVersion', () => {
		mainWindow.webContents.send('version', app.getVersion());
	});
};
