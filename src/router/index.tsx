import { createBrowserRouter, Navigate } from 'react-router-dom';

import { VMenu } from '../components/menu';
import { TruncatedFrame } from '../pages/truncated-frame';
import { RoutePath } from './route';

export const router = createBrowserRouter([
	{
		path: RoutePath.Root,
		element: <VMenu />,
		children: [
			{
				path: RoutePath.VideoCutFrame,
				element: <TruncatedFrame />
			},
			{
				path: '*',
				element: <Navigate to={RoutePath.VideoCutFrame} replace />
			}
		]
	}
]);
