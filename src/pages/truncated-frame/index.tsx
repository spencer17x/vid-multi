import './index.scss';

import { InboxOutlined } from '@ant-design/icons';
import {
	Button,
	ButtonProps,
	Input,
	InputNumber,
	InputNumberProps,
	message,
	Modal,
	Space,
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
	const [uploaded, setUploaded] = useState<boolean>(false);
	const [result, setResult] = useState<MediaInfoType>();
	const [videoFile, setVideoFile] = useState<File>();
	const [generating, setGenerating] = useState<boolean>(false);
	const [frames, setFrames] = useState<number>(1);
	const [outputDir, setOutputDir] = useState<string>('');

	useEffect(() => {
		window.electronAPI
			.getOutputDir()
			.then((outputDir) => setOutputDir(outputDir));
	}, []);

	useEffect(() => {
		MediaInfoFactory({
			format: 'object',
			locateFile: (url, scriptDirectory) => {
				console.log('url', url, scriptDirectory);
				return url;
			}
		}).then((mi) => {
			miRef.current = mi;
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
			setResult(result);
			setUploaded(true);
			setVideoFile(file);
		}
		return false;
	};

	const videoToImages = (): Promise<string[]> => {
		return new Promise((resolve, reject) => {
			if (!videoFile) {
				return reject(new Error('videoFile is not loaded'));
			}

			const video = document.createElement('video');
			let currentTime = 0;
			let frameCount = 0;
			const gap = (generalInfo?.Duration || 1) / frames;
			const images: string[] = [];

			video.src = URL.createObjectURL(videoFile);
			video.addEventListener('timeupdate', (event) => {
				console.log('timeupdate', event, currentTime, gap);

				const canvas = document.createElement('canvas');
				canvas.width = video.videoWidth;
				canvas.height = video.videoHeight;
				canvas
					.getContext('2d')
					?.drawImage(video, 0, 0, canvas.width, canvas.height);
				images.push(canvas.toDataURL());

				currentTime += gap;
				frameCount++;

				if (frameCount >= frames) {
					video.remove();
					return resolve(images);
				}
				video.currentTime = currentTime;
			});
			video.addEventListener('loadeddata', (event) => {
				console.log('loadeddata', event);
				video.currentTime = currentTime;
			});
		});
	};

	const onStartFrameCutting: ButtonProps['onClick'] = async () => {
		if (!videoFile) {
			throw new Error('videoFile is not loaded');
		}

		try {
			setGenerating(true);
			const { path: filePath, name: filename } = videoFile;
			const fullOutputDir = `${outputDir}/${videoFile.name.replace(
				/\.[^.]*$/,
				''
			)}`;

			const images = await videoToImages();
			await window.electronAPI.generateImages({
				frames,
				filePath,
				filename,
				outputDir: fullOutputDir,
				images
			});

			Modal.confirm({
				title: 'Generate success, open or not',
				onOk() {
					openDirectory();
				}
			});
		} catch (error) {
			const errMsg = error instanceof Error ? error.message : 'Unknown error';
			message.error(errMsg);
			console.error(error);
		} finally {
			setGenerating(false);
		}
	};

	const onFramesChange: InputNumberProps<number>['onChange'] = (value) => {
		setFrames(value || 1);
	};

	const onChangeDirectoryClick: ButtonProps['onClick'] = async () => {
		const outputDir = await window.electronAPI.setOutputDir();
		setOutputDir(outputDir);
	};

	const openDirectory = () => {
		window.electronAPI
			.openFolder(outputDir)
			.catch((error) => message.error(error.message));
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

	const onReset = () => {
		setUploaded(false);
	};

	const renderVideo = () => {
		if (uploaded && videoFile) {
			return (
				<video
					width={300}
					src={URL.createObjectURL(videoFile)}
					autoPlay={false}
					controls={true}
				/>
			);
		}
		return (
			<Dragger
				className="truncated-frame-dragger"
				name="file"
				accept=".mp4"
				beforeUpload={onBeforeUpload}
			>
				<p className="ant-upload-drag-icon">
					<InboxOutlined />
				</p>
				<p className="ant-upload-text">单击或拖动文件到此区域进行上传</p>
			</Dragger>
		);
	};

	const renderTools = () => {
		if (!uploaded) {
			return null;
		}
		return (
			<div className="truncated-frame-tools">
				<Table dataSource={dataSource} columns={columns} pagination={false} />
				<InputNumber addonAfter="帧" value={frames} onChange={onFramesChange} />
				<Space.Compact>
					<Button
						loading={generating}
						type="primary"
						onClick={onStartFrameCutting}
					>
						开始截帧
					</Button>
					<Button type="primary" onClick={onReset}>
						重置
					</Button>
				</Space.Compact>
			</div>
		);
	};

	return (
		<div className="truncated-frame">
			<div className="truncated-frame-container">
				<Space.Compact style={{ width: '100%' }}>
					<Input disabled={true} value={outputDir} />
					<Button type="primary" onClick={onChangeDirectoryClick}>
						修改目录
					</Button>
					<Button type="primary" onClick={openDirectory}>
						打开目录
					</Button>
				</Space.Compact>

				{renderVideo()}
				{renderTools()}
			</div>
		</div>
	);
};
