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

			await window.electronAPI.generateImages({
				filePath,
				frames,
				filename,
				outputDir: fullOutputDir
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

	return (
		<div className="truncated-frame">
			<Spin spinning={false}>
				<div className="truncated-frame-container">
					<Space.Compact style={{ width: '100%' }}>
						<Input disabled={true} value={outputDir} />
						<Button type="primary" onClick={onChangeDirectoryClick}>
							Change directory
						</Button>
						<Button type="primary" onClick={openDirectory}>
							Open directory
						</Button>
					</Space.Compact>

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
							<InputNumber
								addonAfter="frames"
								value={frames}
								onChange={onFramesChange}
							/>
							<Button
								loading={generating}
								type="primary"
								onClick={onStartFrameCutting}
							>
								Start frame cutting
							</Button>
						</div>
					)}
				</div>
			</Spin>
		</div>
	);
};
