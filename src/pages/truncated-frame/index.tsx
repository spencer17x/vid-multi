import './index.scss';

import { InboxOutlined } from '@ant-design/icons';
import { Button, ButtonProps, Spin, Table, Upload, UploadProps } from 'antd';
import { TableProps } from 'antd/es/table/InternalTable';
import dayjs from 'dayjs';
import MediaInfoFactory, { MediaInfo, MediaInfoType } from 'mediainfo.js';
import { useEffect, useMemo, useRef, useState } from 'react';

import { getMetadata } from '../../utils/media.ts';

const { Dragger } = Upload;

type RecordType = {
	Duration?: number;
	FrameCount?: number;
	FrameRate?: number;
	Format?: string;
};

export const TruncatedFrame = () => {
	const miRef = useRef<MediaInfo>();
	const [loaded, setLoaded] = useState(false);
	const [uploaded, setUploaded] = useState(false);
	const [result, setResult] = useState<MediaInfoType>();
	const [playUrl, setPlayUrl] = useState<string>('');

	useEffect(() => {
		setLoaded(false);
		MediaInfoFactory({ format: 'object' }).then((mi) => {
			miRef.current = mi;
			setLoaded(true);
		});

		return () => {
			if (miRef.current) {
				miRef.current.close();
			}
		};
	}, []);

	const onBeforeUpload: UploadProps<File>['beforeUpload'] = async (file) => {
		if (miRef.current) {
			const result = await getMetadata(miRef.current, file);
			console.log('result', result);
			setResult(result);
			setUploaded(true);
			setPlayUrl(URL.createObjectURL(file));
		}
		return false;
	};

	const onPlayVideo: ButtonProps['onClick'] = () => {};

	const onStartFrameCutting: ButtonProps['onClick'] = () => {};

	const generalInfo = useMemo(() => {
		return result?.media?.track.find((track) => track['@type'] === 'General');
	}, [result]);

	const dataSource: TableProps<RecordType>['dataSource'] = useMemo(() => {
		return [
			{
				key: '1',
				Duration: generalInfo?.Duration,
				FrameCount: generalInfo?.FrameCount,
				FrameRate: generalInfo?.FrameRate,
				Format: generalInfo?.Format
			}
		];
	}, [generalInfo]);

	const columns: TableProps<RecordType>['columns'] = [
		{
			title: 'Duration',
			dataIndex: 'Duration',
			key: 'Duration',
			render: (value) => dayjs.duration(value, 'seconds').format('HH:mm:ss')
		},
		{ title: 'FrameCount', dataIndex: 'FrameCount', key: 'FrameCount' },
		{ title: 'FrameRate', dataIndex: 'FrameRate', key: 'FrameRate' },
		{ title: 'Format', dataIndex: 'Format', key: 'Format' }
	];

	return (
		<div className="truncated-frame">
			<Spin spinning={!loaded}>
				<div className="truncated-frame-container">
					<Dragger
						className="truncated-frame-dragger"
						name="file"
						accept=".mp4"
						beforeUpload={onBeforeUpload}
					>
						<p className="ant-upload-drag-icon">
							<InboxOutlined />
						</p>
						<p className="ant-upload-text">
							Click or drag file to this area to upload
						</p>
					</Dragger>

					{uploaded && (
						<div className="truncated-frame-tools">
							<Table
								dataSource={dataSource}
								columns={columns}
								pagination={false}
							/>
							<Button type="primary" onClick={onPlayVideo}>
								Play video
							</Button>
							<Button type="primary" onClick={onStartFrameCutting}>
								Start frame cutting
							</Button>
						</div>
					)}

					<div className="truncated-frame-list" />
				</div>
			</Spin>
		</div>
	);
};
