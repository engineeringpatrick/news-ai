import {v4 as uuid} from 'uuid';

// biome-ignore lint/suspicious/noExplicitAny: utility function
export function cn(...inputs: any[]) {
	return inputs.filter(Boolean).join(' ');
}

const KEY = 'clientId';
export function getClientId() {
	let id = localStorage.getItem(KEY);
	if (!id) {
		id = uuid();
		localStorage.setItem(KEY, id);
	}
	return id;
}
