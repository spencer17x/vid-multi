import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import electron from 'vite-plugin-electron/simple';
import { viteStaticCopy } from 'vite-plugin-static-copy';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
	process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

	return {
		plugins: [
			react(),
			electron({
				main: {
					// Shortcut of `build.lib.entry`.
					entry: 'electron/main.ts'
				},
				preload: {
					// Shortcut of `build.rollupOptions.input`.
					// Preload scripts may contain Web assets, so use the `build.rollupOptions.input` instead `build.lib.entry`.
					input: path.join(__dirname, 'electron/preload.ts')
				},
				// Ployfill the Electron and Node.js built-in modules for Renderer process.
				// See 👉 https://github.com/electron-vite/vite-plugin-electron-renderer
				renderer: {}
			}),
			viteStaticCopy({
				targets: [
					{
						src: path.join(
							__dirname,
							'node_modules',
							'mediainfo.js',
							'dist',
							'MediaInfoModule.wasm'
						),
						dest: ''
					}
				]
			})
		]
	};
});
