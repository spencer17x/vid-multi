import { message, Modal } from 'antd';
import { ProgressInfo } from 'electron-updater';
import { useEffect, useState } from 'react';

const messageTips = {
	checking: 'Checking for updates...',
	updateAvailable: 'Update available, whether to update',
	updateNotAvailable: 'Update not available'
};

export const useUpdater = () => {
	const [open, setOpen] = useState(false);
	const [percent, setPercent] = useState(0);

	useEffect(() => {
		window.ipcRenderer.send('checkAppVersion');

		window.ipcRenderer.on('version', (_event, version: string) => {
			console.log('version', version);
		});
		window.ipcRenderer.on('error', async (_event, error: Error) => {
			await message.error(error.message);
		});

		window.ipcRenderer.send('checkForUpdates');

		window.ipcRenderer.on('checkingForUpdate', async () => {
			await message.loading({
				key: 'checkingForUpdate',
				content: messageTips.checking,
				duration: 0
			});
		});
		window.ipcRenderer.on('updateAvailable', async () => {
			message.destroy('checkingForUpdate');
			Modal.confirm({
				title: messageTips.updateAvailable,
				onOk() {
					setOpen(true);
					window.ipcRenderer.send('downloadUpdate');
				}
			});
		});
		window.ipcRenderer.on('updateNotAvailable', async () => {
			message.destroy('checkingForUpdate');
			Modal.info({
				title: messageTips.updateNotAvailable
			});
		});

		window.ipcRenderer.on('updateDownloaded', async () => {
			Modal.confirm({
				title: 'Update downloaded, will be installed when you restart the app',
				onOk() {
					window.ipcRenderer.send('quitAndInstall');
				}
			});
		});
		window.ipcRenderer.on(
			'downloadProgress',
			(_event, progress: ProgressInfo) => {
				setPercent(Math.floor(progress.percent));
			}
		);
	}, []);

	return {
		open,
		percent
	};
};
