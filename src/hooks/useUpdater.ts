import { message, Modal } from 'antd';
import { ProgressInfo } from 'electron-updater';
import { useEffect, useState } from 'react';

export type UpdateStatus =
	| 'checking'
	| 'updateAvailable'
	| 'updateNotAvailable';

const messageTips: Record<UpdateStatus, string> = {
	checking: 'Checking for updates...',
	updateAvailable: 'Update available, whether to update',
	updateNotAvailable: 'Update not available'
};

export const useUpdater = () => {
	const [percent, setPercent] = useState(0);
	const [status, setStatus] = useState<UpdateStatus | null>(null);
	const [open, setOpen] = useState(false);

	useEffect(() => {
		window.ipcRenderer.send('checkAppVersion');
		window.ipcRenderer.on('version', (_event, version: string) => {
			console.log('version', version);
		});
		window.ipcRenderer.on('error', async (_event, error: Error) => {
			await message.error(error.message);
		});

		window.ipcRenderer.on('checkingForUpdate', async () => {
			setStatus('checking');
		});
		window.ipcRenderer.on('updateAvailable', async () => {
			setStatus('updateAvailable');
			Modal.confirm({
				title: messageTips.updateAvailable,
				onOk() {
					setStatus(null);
					window.ipcRenderer.send('downloadUpdate');
				}
			});
		});
		window.ipcRenderer.on('updateNotAvailable', async () => {
			setStatus('updateNotAvailable');
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

	useEffect(() => {
		if (open) {
			window.ipcRenderer.send('checkForUpdates');
		}
	}, [open]);

	return {
		percent,
		status,
		open,
		setOpen
	};
};
