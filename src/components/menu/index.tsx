import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { Button, Layout, Menu, theme } from 'antd';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import { routeItems } from '../../router/route';

const { Header, Sider, Content } = Layout;

export interface VMenuProps {}

export const VMenu: React.FC<VMenuProps> = () => {
	const {
		token: { colorBgContainer, borderRadiusLG }
	} = theme.useToken();
	const navigate = useNavigate();
	const location = useLocation();

	const [collapsed, setCollapsed] = useState(false);
	const [curPath, setCurPath] = useState<string>('');

	useEffect(() => {
		console.log('location.pathname', location.pathname.slice(1));
		setCurPath(location.pathname.slice(1));
	}, [location.pathname]);

	return (
		<Layout style={{ width: '100%', height: '100%' }}>
			<Sider trigger={null} collapsible collapsed={collapsed}>
				<Menu
					selectedKeys={[curPath]}
					theme="dark"
					mode="inline"
					items={routeItems.map((item) => ({
						key: item.path,
						label: item.name
					}))}
					onClick={({ key }) => {
						console.log('key', key);
						navigate({
							pathname: key
						});
					}}
				/>
			</Sider>
			<Layout>
				<Header style={{ padding: 0, background: colorBgContainer }}>
					<Button
						type="text"
						icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
						onClick={() => setCollapsed(!collapsed)}
						style={{
							fontSize: '16px',
							width: 64,
							height: 64
						}}
					/>
				</Header>
				<Content
					style={{
						margin: '24px 16px',
						padding: 24,
						minHeight: 280,
						background: colorBgContainer,
						borderRadius: borderRadiusLG
					}}
				>
					<Outlet />
				</Content>
			</Layout>
		</Layout>
	);
};
