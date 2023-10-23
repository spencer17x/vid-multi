/// <reference types="vite/client" />
interface ImportMetaEnv {
	NODE_ENV: 'dev' | 'staging' | 'prod';
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
