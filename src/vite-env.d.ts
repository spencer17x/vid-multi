/// <reference types="vite/client" />
interface ImportMetaEnv {
	VITE_NODE_ENV: 'dev' | 'staging' | 'prod';
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
