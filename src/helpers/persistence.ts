import Cookie from 'js-cookie';
import { ClientSettings } from '../types/settings';

export const PERSISTED_KEYS = {
	clientSettings: 'settings',
	lastVersionCheckTime: 'lastVersionCheckTime',
	skipVersion: 'skipVersion',
} as const;

export interface PersistedSkipVersion {
	version: number;
	version_string: string;
}

const getLocalStorage = (): Storage | null => {
	try {
		return window.localStorage;
	} catch {
		return null;
	}
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const parseJsonRecord = (value: string | null | undefined): Record<string, unknown> | null => {
	if (!value) {
		return null;
	}

	try {
		const parsed: unknown = JSON.parse(value);
		return isRecord(parsed) ? parsed : null;
	} catch {
		return null;
	}
};

const parseSkipVersion = (value: string | null | undefined): PersistedSkipVersion | null => {
	const parsed = parseJsonRecord(value);
	if (!parsed || typeof parsed.version !== 'number' || typeof parsed.version_string !== 'string') {
		return null;
	}

	return {
		version: parsed.version,
		version_string: parsed.version_string,
	};
};

const parseTimestamp = (value: string | null | undefined): number => {
	if (!value) {
		return 0;
	}

	const parsed = Number.parseInt(value, 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const readRawValue = (key: string): string | null => {
	const storage = getLocalStorage();
	if (storage) {
		try {
			const storedValue = storage.getItem(key);
			if (storedValue !== null) {
				return storedValue;
			}
		} catch {
			// Fall through to the legacy cookie store.
		}
	}

	return Cookie.get(key) ?? null;
};

const writeRawValue = (key: string, value: string): boolean => {
	const storage = getLocalStorage();
	if (storage && isLocalStorageAvailable()) {
		try {
			storage.setItem(key, value);
			return true;
		} catch {
			// Fall through to the cookie store.
		}
	}

	try {
		Cookie.set(key, value);
		return true;
	} catch {
		return false;
	}
};

const removeRawValue = (key: string): void => {
	const storage = getLocalStorage();
	if (storage) {
		try {
			storage.removeItem(key);
		} catch {
			// The cookie removal below is still useful if storage is blocked.
		}
	}
	Cookie.remove(key);
};

export const isLocalStorageAvailable = (): boolean => {
	const storage = getLocalStorage();
	if (!storage) {
		return false;
	}

	const testKey = '__nagiostv_storage_test__';
	try {
		storage.setItem(testKey, testKey);
		storage.removeItem(testKey);
		return true;
	} catch {
		return false;
	}
};

export const hasClientSettings = (): boolean => {
	return readClientSettings() !== null;
};

export const readClientSettings = (): Partial<ClientSettings> | null => {
	return parseJsonRecord(readRawValue(PERSISTED_KEYS.clientSettings)) as Partial<ClientSettings> | null;
};

export const saveClientSettings = (settings: ClientSettings): boolean => {
	return writeRawValue(PERSISTED_KEYS.clientSettings, JSON.stringify(settings));
};

export const removeClientSettings = (): void => {
	removeRawValue(PERSISTED_KEYS.clientSettings);
};

export const readSkipVersion = (): PersistedSkipVersion | null => {
	return parseSkipVersion(readRawValue(PERSISTED_KEYS.skipVersion));
};

export const saveSkipVersion = (skipVersion: PersistedSkipVersion): boolean => {
	return writeRawValue(PERSISTED_KEYS.skipVersion, JSON.stringify(skipVersion));
};

export const removeSkipVersion = (): void => {
	removeRawValue(PERSISTED_KEYS.skipVersion);
};

export const readLastVersionCheckTime = (): number => {
	return parseTimestamp(readRawValue(PERSISTED_KEYS.lastVersionCheckTime));
};

export const saveLastVersionCheckTime = (timestamp: number): boolean => {
	return writeRawValue(PERSISTED_KEYS.lastVersionCheckTime, String(timestamp));
};

export const migrateLegacyCookiesToLocalStorage = (): boolean => {
	if (!isLocalStorageAvailable()) {
		return false;
	}

	const storage = getLocalStorage();
	if (!storage) {
		return false;
	}

	const keys = Object.values(PERSISTED_KEYS);
	for (const key of keys) {
		const cookieValue = Cookie.get(key);
		if (cookieValue === undefined) {
			continue;
		}

		const isValid = key === PERSISTED_KEYS.clientSettings
			? parseJsonRecord(cookieValue) !== null
			: key === PERSISTED_KEYS.skipVersion
				? parseSkipVersion(cookieValue) !== null
				: parseTimestamp(cookieValue) > 0;
		if (!isValid) {
			continue;
		}

		try {
			if (storage.getItem(key) === null) {
				storage.setItem(key, cookieValue);
			}
			Cookie.remove(key);
		} catch {
			return false;
		}
	}

	return true;
};
