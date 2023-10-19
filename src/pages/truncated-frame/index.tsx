import './index.scss';

import { InboxOutlined } from '@ant-design/icons';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import {
	Button,
	ButtonProps,
	message,
	Spin,
	Table,
	Upload,
	UploadProps
} from 'antd';
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
	const [videoFile, setVideoFile] = useState<File>();

	const ffmpegRef = useRef<FFmpeg>();

	useEffect(() => {
		MediaInfoFactory({ format: 'object' }).then((mi) => {
			miRef.current = mi;
		});

		return () => {
			if (miRef.current) {
				miRef.current.close();
			}
		};
	}, []);

	useEffect(() => {
		const ffmpeg = new FFmpeg();
		ffmpegRef.current = ffmpeg;
		const load = async () => {
			setLoaded(false);
			const baseURL = '.';
			ffmpeg.on('log', ({ message }) => {
				console.log('message', message);
			});
			// toBlobURL is used to bypass CORS issue, urls with the same
			// domain can be used directly.
			await ffmpeg.load({
				coreURL: await toBlobURL(
					`${baseURL}/ffmpeg-core.js`,
					'text/javascript'
				),
				wasmURL: await toBlobURL(
					`${baseURL}/ffmpeg-core.wasm`,
					'application/wasm'
				),
				workerURL: await toBlobURL(
					`${baseURL}/ffmpeg-core.worker.js`,
					'text/javascript'
				)
			});
			setLoaded(true);
		};

		load().then(() => {});
	}, []);

	const onBeforeUpload: UploadProps<File>['beforeUpload'] = async (file) => {
		if (miRef.current) {
			const result = await getMetadata(miRef.current, file);
			console.log('result', result);
			console.log('file', file);
			setResult(result);
			setUploaded(true);
			setVideoFile(file);
		}
		return false;
	};

	const onPlayVideo: ButtonProps['onClick'] = () => {};

	const onStartFrameCutting: ButtonProps['onClick'] = async () => {
		const ffmpeg = ffmpegRef.current;
		if (!ffmpeg) {
			throw new Error('ffmpeg is not loaded');
		}
		const hide = message.loading('Processing...', 0);
		const filename = videoFile?.name || '';
		await ffmpeg.writeFile(filename, await fetchFile(videoFile));
		const result = await ffmpeg.exec([
			'-i',
			filename,
			'-vf',
			`fps=${generalInfo?.FrameRate}`,
			'output_%04d.jpg'
		]);
		console.log('result', result);
		hide();
	};

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
