import { message } from 'antd';
import { ProgressInfo } from 'electron-updater';
import { useEffect } from 'react';

import { TruncatedFrame } from './pages/truncated-frame';

function App() {
	useEffect(() => {
		window.ipcRenderer.send('checkAppVersion');

		window.ipcRenderer.on('version', (_event, version: string) => {
			console.log('version', version);
		});

		window.ipcRenderer.send('checkForUpdates');
		window.ipcRenderer.on('message', (_event, text: string) => {
			message.loading(text, 0);
		});

		window.ipcRenderer.on(
			'downloadProgress',
			(_event, progress: ProgressInfo) => {
				console.log('progress', progress);
			}
		);
	}, []);
	return <TruncatedFrame />;
}

export default App;
