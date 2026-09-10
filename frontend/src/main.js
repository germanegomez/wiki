import { createApp } from 'vue';

import App from './App.vue';
import router from './router';
import { initSocket } from './socket';
import { pinia } from './stores';

import translationPlugin, { loadTranslations } from './translation';

import {
	Alert,
	Badge,
	Button,
	Dialog,
	ErrorMessage,
	FormControl,
	TextInput,
	frappeRequest,
	pageMetaPlugin,
	resourcesPlugin,
	setConfig,
} from 'frappe-ui';

import './index.css';
import './wiki-editor-content.css';

const globalComponents = {
	Button,
	TextInput,
	FormControl,
	ErrorMessage,
	Dialog,
	Alert,
	Badge,
};

setConfig('resourceFetcher', frappeRequest);

async function bootstrap() {
	await loadTranslations();

	const app = createApp(App);

	app.use(pinia);
	app.use(router);
	app.use(translationPlugin);
	app.use(resourcesPlugin);
	app.use(pageMetaPlugin);

	const socket = initSocket();
	app.config.globalProperties.$socket = socket;

	for (const key in globalComponents) {
		app.component(key, globalComponents[key]);
	}

	app.mount('#app');
}

bootstrap();
