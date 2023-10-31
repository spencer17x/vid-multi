import { Modal, Progress } from 'antd';

import { useUpdater } from './hooks/useUpdater.ts';
import { TruncatedFrame } from './pages/truncated-frame';

function App() {
	const { open, percent } = useUpdater();

	return (
		<>
			<Modal title="Updating..." open={open} footer={null} closable={false}>
				<Progress percent={percent} />
			</Modal>
			<TruncatedFrame />
		</>
	);
}

export default App;
