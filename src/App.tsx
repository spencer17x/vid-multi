import { Modal, Progress, Spin } from 'antd';

import { useUpdater } from './hooks/useUpdater.ts';
import { TruncatedFrame } from './pages/truncated-frame';

function App() {
	const { percent, status } = useUpdater();

	return (
		<Spin spinning={status === 'checking'}>
			<div style={{ width: '100vw', height: '100vh' }}>
				<Modal
					title="Updating..."
					open={status === 'updateAvailable'}
					footer={null}
					closable={false}
				>
					<Progress percent={percent} />
				</Modal>
				<TruncatedFrame />
			</div>
		</Spin>
	);
}

export default App;
