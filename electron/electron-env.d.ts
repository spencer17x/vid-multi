/// <reference types="vite-plugin-electron/electron-env" />
declare namespace NodeJS {
	interface ProcessEnv {
		/**
		 * The built directory structure
		 *
		 * ```tree
		 * ├─┬─┬ dist
		 * │ │ └── index.html
		 * │ │
		 * │ ├─┬ dist-electron
		 * │ │ ├── main.js
		 * │ │ └── preload.js
		 * │
		 * ```
		 */
		DIST: string;
		/** /dist/ or /public/ */
		VITE_PUBLIC: string;
	}
}

interface GenerateImagesParams {
	filePath: string;
	fps: number;
	filename: string;
	outputDir: string;
}

interface ElectronAPI {
	generateImages: (params: GenerateImagesParams) => Promise<string>;
	openFolder: (dir: string) => Promise<void>;
	getOutputDir: () => Promise<string>;
	setOutputDir: () => Promise<string>;
	getMediaInfo: (filePath: string) => Promise<unknown>;
}

// Used in Renderer process, expose in `preload.ts`
interface Window {
	ipcRenderer: import('electron').IpcRenderer;
	electronAPI: ElectronAPI;
}
