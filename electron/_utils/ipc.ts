import { app, dialog, ipcMain } from 'electron';
import fs from 'fs';
import path from 'path';

import { runCMD } from './cmd';

export const ipcGenerateImages = () => {
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

export const ipcOpenFolder = () => {
	ipcMain.handle('openFolder', async (_event, dir: string) => {
		const openFolderCommand =
			process.platform === 'win32' ? 'explorer' : 'open';
		return runCMD(openFolderCommand, [dir]);
	});
};

export const ipcGetOutputDir = () => {
	ipcMain.handle('getOutputDir', () => {
		const outputDir = app.getPath('downloads');
		fs.mkdirSync(outputDir, { recursive: true });
		return outputDir;
	});
};

export const ipcSetOutputDir = () => {
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

export const ipcGetMediaInfo = () => {
	ipcMain.handle('getMediaInfo', async (_event, filePath: string) => {
		return runCMD('ffprobe', [
			'-v',
			'quiet',
			'-print_format',
			'json',
			'-show_format',
			'-show_streams',
			filePath
		]);
	});
};

export const ipc = () => {
	ipcGenerateImages();
	ipcOpenFolder();
	ipcGetOutputDir();
	ipcSetOutputDir();
	ipcGetMediaInfo();
};
