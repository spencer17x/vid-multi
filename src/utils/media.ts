import { MediaInfo, ReadChunkFunc } from 'mediainfo.js';

export const getMetadata = (mi: MediaInfo, file: File) => {
	const getSize = () => file.size;
	const readChunk: ReadChunkFunc = (chunkSize, offset) =>
		new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = (event: ProgressEvent<FileReader>) => {
				if (event.target?.error) {
					reject(event.target.error);
				}
				resolve(new Uint8Array(event.target?.result as ArrayBuffer));
			};
			reader.readAsArrayBuffer(file.slice(offset, offset + chunkSize));
		});

	return mi.analyzeData(getSize, readChunk);
};
