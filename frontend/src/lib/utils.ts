// biome-ignore lint/suspicious/noExplicitAny: utility function
export function cn(...inputs: any[]) {
	return inputs.filter(Boolean).join(' ');
}
