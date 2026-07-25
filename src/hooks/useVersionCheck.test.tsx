import { act, renderHook } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { bigStateAtom, clientSettingsAtom, clientSettingsInitial } from '../atoms/settingsState';
import {
	isVersionCheckDue,
	useVersionCheck,
	VERSION_CHECK_MINIMUM_GAP_MS,
	VERSION_CHECK_STORAGE_DELAY_MS,
} from './useVersionCheck';

const axiosMocks = vi.hoisted(() => ({
	get: vi.fn(),
	isCancel: vi.fn(() => false),
}));

const persistenceMocks = vi.hoisted(() => ({
	isLocalStorageAvailable: vi.fn(() => true),
	readLastVersionCheckTime: vi.fn(() => 0),
	saveLastVersionCheckTime: vi.fn(() => true),
}));

vi.mock('axios', () => ({
	default: axiosMocks,
}));

vi.mock('../helpers/persistence', () => persistenceMocks);

const createWrapper = (store: ReturnType<typeof createStore>) => {
	return function Wrapper({ children }: { children: ReactNode }) {
		return <Provider store={store}>{children}</Provider>;
	};
};

beforeEach(() => {
	vi.useFakeTimers();
	vi.setSystemTime(new Date('2026-07-24T12:00:00Z'));
	axiosMocks.get.mockReset();
	axiosMocks.isCancel.mockClear();
	persistenceMocks.isLocalStorageAvailable.mockReset();
	persistenceMocks.isLocalStorageAvailable.mockReturnValue(true);
	persistenceMocks.readLastVersionCheckTime.mockReset();
	persistenceMocks.readLastVersionCheckTime.mockReturnValue(0);
	persistenceMocks.saveLastVersionCheckTime.mockReset();
	persistenceMocks.saveLastVersionCheckTime.mockReturnValue(true);
});

afterEach(() => {
	vi.useRealTimers();
});

describe('isVersionCheckDue', () => {
	it('blocks persisted and in-session checks within 23 hours', () => {
		const now = Date.now();

		expect(isVersionCheckDue(now, now - 1_000, 0)).toBe(false);
		expect(isVersionCheckDue(now, 0, now - 1_000)).toBe(false);
		expect(isVersionCheckDue(now, now - VERSION_CHECK_MINIMUM_GAP_MS, 0)).toBe(true);
	});
});

describe('useVersionCheck', () => {
	it('checks after the storage-backed startup delay and updates version state', async () => {
		const store = createStore();
		axiosMocks.get.mockResolvedValue({
			data: { version: 100, version_string: '1.0.0' },
		});
		renderHook(() => useVersionCheck(), { wrapper: createWrapper(store) });

		expect(axiosMocks.get).not.toHaveBeenCalled();
		await act(async () => {
			await vi.advanceTimersByTimeAsync(VERSION_CHECK_STORAGE_DELAY_MS);
		});

		expect(axiosMocks.get).toHaveBeenCalledWith(
			'https://nagiostv.com/version/nagiostv-react/?version=0.9.11',
			expect.objectContaining({
				timeout: 5_000,
				signal: expect.any(AbortSignal),
			}),
		);
		expect(store.get(bigStateAtom).latestVersionString).toBe('1.0.0');
		expect(persistenceMocks.saveLastVersionCheckTime).toHaveBeenCalledWith(Date.now());
	});

	it('does not schedule checks when version checking is disabled', async () => {
		const store = createStore();
		store.set(clientSettingsAtom, {
			...clientSettingsInitial,
			versionCheckDays: 0,
		});
		renderHook(() => useVersionCheck(), { wrapper: createWrapper(store) });

		await act(async () => {
			await vi.advanceTimersByTimeAsync(VERSION_CHECK_STORAGE_DELAY_MS);
		});

		expect(axiosMocks.get).not.toHaveBeenCalled();
	});

	it('honors a recent persisted check time', async () => {
		const store = createStore();
		persistenceMocks.readLastVersionCheckTime.mockReturnValue(
			Date.now() - 1_000,
		);
		renderHook(() => useVersionCheck(), { wrapper: createWrapper(store) });

		await act(async () => {
			await vi.advanceTimersByTimeAsync(VERSION_CHECK_STORAGE_DELAY_MS);
		});

		expect(axiosMocks.get).not.toHaveBeenCalled();
		expect(persistenceMocks.saveLastVersionCheckTime).not.toHaveBeenCalled();
	});

	it('aborts an active request on unmount', async () => {
		const store = createStore();
		let requestSignal: AbortSignal | undefined;
		axiosMocks.get.mockImplementation((_url: string, config: { signal: AbortSignal }) => {
			requestSignal = config.signal;
			return new Promise(() => undefined);
		});
		const { unmount } = renderHook(() => useVersionCheck(), {
			wrapper: createWrapper(store),
		});

		await act(async () => {
			await vi.advanceTimersByTimeAsync(VERSION_CHECK_STORAGE_DELAY_MS);
		});
		unmount();

		expect(requestSignal?.aborted).toBe(true);
	});
});
