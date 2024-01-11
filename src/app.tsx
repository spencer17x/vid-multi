import './app.scss';

import { message, Modal, Progress } from 'antd';
import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';

import { useUpdater } from './hooks/useUpdater.ts';
import { router } from './router';

export const App = () => {
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
			<RouterProvider router={router} />
		</div>
	);
};
