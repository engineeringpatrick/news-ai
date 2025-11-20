import {useEffect, useState} from 'react';

export function usePersistedState<T>(
	key: string,
	defaultValue: T,
): [T, (value: T | ((prev: T) => T)) => void] {
	const [value, setValue] = useState<T>(() => {
		try {
			const raw = localStorage.getItem(key);
			if (!raw) return defaultValue;
			return JSON.parse(raw) as T;
		} catch {
			return defaultValue;
		}
	});

	useEffect(() => {
		try {
			localStorage.setItem(key, JSON.stringify(value));
		} catch {}
	}, [key, value]);

	const update = (v: T | ((prev: T) => T)) => {
		setValue(prev =>
			typeof v === 'function' ? (v as (prev: T) => T)(prev) : v,
		);
	};

	return [value, update];
}
