/// <reference types="vite/client" />

declare global {
	import type DetachedWindowApi from 'happy-dom/lib/window/DetachedWindowAPI.js';
	interface Window {
		happyDOM?: DetachedWindowApi;
	}

	interface ImportMetaEnv {
		readonly VITE_API_BASE: string;
		readonly VITE_API_WEBSOCKET: string;
		readonly NEWSAPI_KEY: string;
		readonly OPENAI_API_KEY: string;
		readonly CARTESIA_API_KEY: string;
	}
	interface ImportMeta {
		readonly env: ImportMetaEnv;
	}
}

export {};
