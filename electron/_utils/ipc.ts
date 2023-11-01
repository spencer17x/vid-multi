import { app, dialog, ipcMain } from 'electron';
import fs from 'fs';
import path from 'path';

import { runCMD } from './cmd';

export const generateImages = () => {
	ipcMain.handle(
		'generateImages',
		async (_event, params: GenerateImagesParams) => {
			const { filePath, outputDir, frames, images } = params;
			fs.mkdirSync(outputDir, { recursive: true });

			if (images?.length) {
				const promises = images.map((base64, index) => {
					return new Promise((resolve, reject) => {
						const dataBuffer = Buffer.from(
							base64.replace(/^data:image\/\w+;base64,/, ''),
							'base64'
						);
						fs.writeFile(
							path.join(outputDir, `output_${index}.jpg`),
							dataBuffer,
							(err) => {
								if (err) {
									reject(err);
								} else {
									resolve(null);
								}
							}
						);
					});
				});
				return Promise.all(promises);
			}

			return runCMD('ffmpeg', [
				'-i',
				filePath,
				'-vf',
				'"select=eq(pict_type\\,I)"',
				'-vframes',
				`${frames}`,
				path.join(outputDir, 'output_%d.jpg')
			]);
		}
	);
};

export const openFolder = () => {
	ipcMain.handle('openFolder', async (_event, dir: string) => {
		const openFolderCommand =
			process.platform === 'win32' ? 'explorer' : 'open';
		return runCMD(openFolderCommand, [dir]);
	});
};

export const getOutputDir = () => {
	ipcMain.handle('getOutputDir', () => {
		const outputDir = app.getPath('downloads');
		fs.mkdirSync(outputDir, { recursive: true });
		return outputDir;
	});
};

export const setOutputDir = () => {
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

export const setUpIPC = () => {
	generateImages();
	openFolder();
	getOutputDir();
	setOutputDir();
};
