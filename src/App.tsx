import './app.scss';

import { message, Modal, Progress } from 'antd';
import { useEffect } from 'react';

import { useUpdater } from './hooks/useUpdater.ts';
import { TruncatedFrame } from './pages/truncated-frame';

function App() {
	const { percent, status } = useUpdater();

	useEffect(() => {
		if (status === 'checking') {
			const hide = message.loading('Checking for updates...', 0);
			return () => {
				hide();
			};
		}
	}, [status]);

	return (
		<div className="app">
			<Modal
				title="Updating..."
				open={status === 'downloading'}
				footer={null}
				closable={false}
			>
				<Progress percent={percent} />
			</Modal>
			<TruncatedFrame />
		</div>
	);
}

export default App;
