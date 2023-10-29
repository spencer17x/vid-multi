import './styles/index.scss';

import { ConfigProvider } from 'antd';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import ReactDOM from 'react-dom/client';

import App from './App.tsx';

dayjs.extend(duration);

ReactDOM.createRoot(document.getElementById('root')!).render(
	<ConfigProvider>
		<App />
	</ConfigProvider>
);

// Remove Preload scripts loading
postMessage({ payload: 'removeLoading' }, '*');

// Use contextBridge
window.ipcRenderer.on('main-process-message', (_event, message) => {
	console.log(message);
});
