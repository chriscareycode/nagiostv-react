import Cookie from 'js-cookie';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clientSettingsInitial } from '../atoms/settingsState';
import {
	PERSISTED_KEYS,
	hasClientSettings,
	migrateLegacyCookiesToLocalStorage,
	readClientSettings,
	readLastVersionCheckTime,
	readSkipVersion,
	removeClientSettings,
	removeSkipVersion,
	saveClientSettings,
	saveLastVersionCheckTime,
	saveSkipVersion,
} from './persistence';

const clearPersistedValues = () => {
	window.localStorage.clear();
	Object.values(PERSISTED_KEYS).forEach((key) => Cookie.remove(key));
};

describe('persistence', () => {
	beforeEach(clearPersistedValues);

	afterEach(() => {
		vi.restoreAllMocks();
		clearPersistedValues();
	});

	it('round-trips client settings through localStorage', () => {
		const settings = {
			...clientSettingsInitial,
			titleString: 'Stored dashboard',
		};

		expect(saveClientSettings(settings)).toBe(true);
		expect(hasClientSettings()).toBe(true);
		expect(readClientSettings()).toMatchObject({
			titleString: 'Stored dashboard',
		});

		removeClientSettings();
		expect(hasClientSettings()).toBe(false);
		expect(readClientSettings()).toBeNull();
	});

	it('rejects malformed JSON and invalid typed values', () => {
		window.localStorage.setItem(PERSISTED_KEYS.clientSettings, '{invalid');
		window.localStorage.setItem(PERSISTED_KEYS.skipVersion, JSON.stringify({
			version: 'not-a-number',
			version_string: 12,
		}));
		window.localStorage.setItem(PERSISTED_KEYS.lastVersionCheckTime, 'yesterday');

		expect(readClientSettings()).toBeNull();
		expect(readSkipVersion()).toBeNull();
		expect(readLastVersionCheckTime()).toBe(0);
	});

	it('round-trips skip-version and version-check values', () => {
		expect(saveSkipVersion({ version: 91, version_string: '0.9.13' })).toBe(true);
		expect(saveLastVersionCheckTime(1_750_000_000_000)).toBe(true);

		expect(readSkipVersion()).toEqual({
			version: 91,
			version_string: '0.9.13',
		});
		expect(readLastVersionCheckTime()).toBe(1_750_000_000_000);

		removeSkipVersion();
		expect(readSkipVersion()).toBeNull();
	});

	it('falls back to cookies when localStorage writes are blocked', () => {
		vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
			throw new DOMException('Blocked', 'SecurityError');
		});

		expect(saveSkipVersion({ version: 92, version_string: '0.9.14' })).toBe(true);
		expect(readSkipVersion()).toEqual({
			version: 92,
			version_string: '0.9.14',
		});
	});

	it('migrates valid legacy cookies without overwriting local values', () => {
		window.localStorage.setItem(PERSISTED_KEYS.skipVersion, JSON.stringify({
			version: 100,
			version_string: 'local',
		}));
		Cookie.set(PERSISTED_KEYS.skipVersion, JSON.stringify({
			version: 99,
			version_string: 'cookie',
		}));
		Cookie.set(PERSISTED_KEYS.lastVersionCheckTime, '1750000000000');

		expect(migrateLegacyCookiesToLocalStorage()).toBe(true);
		expect(readSkipVersion()).toEqual({
			version: 100,
			version_string: 'local',
		});
		expect(readLastVersionCheckTime()).toBe(1_750_000_000_000);
		expect(Cookie.get(PERSISTED_KEYS.skipVersion)).toBeUndefined();
		expect(Cookie.get(PERSISTED_KEYS.lastVersionCheckTime)).toBeUndefined();
	});
});
