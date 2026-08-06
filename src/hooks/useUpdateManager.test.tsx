import { act, renderHook, waitFor } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clientSettingsAtom, clientSettingsInitial } from '../atoms/settingsState';
import { useUpdateManager } from './useUpdateManager';

const axiosMocks = vi.hoisted(() => ({
	get: vi.fn(),
	isCancel: vi.fn(() => false),
}));

const adminMocks = vi.hoisted(() => ({
	fetchAdminCapabilities: vi.fn(),
	postAdminJson: vi.fn(),
}));

vi.mock('axios', () => ({
	default: axiosMocks,
}));

vi.mock('../helpers/adminApi', () => ({
	fetchAdminCapabilities: adminMocks.fetchAdminCapabilities,
	postAdminJson: adminMocks.postAdminJson,
}));

const createWrapper = (store: ReturnType<typeof createStore>) => {
	return function Wrapper({ children }: { children: ReactNode }) {
		return <Provider store={store}>{children}</Provider>;
	};
};

beforeEach(() => {
	axiosMocks.get.mockReset();
	axiosMocks.isCancel.mockClear();
	adminMocks.fetchAdminCapabilities.mockReset();
	adminMocks.fetchAdminCapabilities.mockResolvedValue({ enabled: true, csrfToken: 'csrf-token', httpsRequired: false });
	adminMocks.postAdminJson.mockReset();
	adminMocks.postAdminJson.mockResolvedValue({ updated: true, version: '1.0.0', message: 'done' });
});

describe('useUpdateManager', () => {
	it('checks versions and secure updater capabilities', async () => {
		const store = createStore();
		axiosMocks.get.mockImplementation((url: string) => Promise.resolve({
			data: url.includes('api.github.com')
				? [{ tag_name: 'v1.0.0', name: 'Release' }]
				: { version: 100, version_string: '1.0.0' },
		}));

		const { result } = renderHook(
			() => useUpdateManager({ currentVersionString: '0.9.11' }),
			{ wrapper: createWrapper(store) },
		);

		await waitFor(() => {
			expect(axiosMocks.get).toHaveBeenCalledTimes(2);
			expect(result.current.bigState.latestVersion).toBe(100);
		});

		expect(result.current.clickedCheckForUpdates).toBe(true);
		expect(result.current.capabilities?.enabled).toBe(true);
		expect(axiosMocks.get).toHaveBeenCalledWith(
			'https://nagiostv.com/version/nagiostv-react/?version=0.9.11',
			expect.objectContaining({ signal: expect.any(AbortSignal) }),
		);
	});

	it('does not automatically check when version checks are disabled', () => {
		const store = createStore();
		store.set(clientSettingsAtom, {
			...clientSettingsInitial,
			versionCheckDays: 0,
		});

		renderHook(
			() => useUpdateManager({ currentVersionString: '0.9.11' }),
			{ wrapper: createWrapper(store) },
		);

		expect(axiosMocks.get).not.toHaveBeenCalled();
	});

	it('aborts active requests when the consumer unmounts', async () => {
		const store = createStore();
		const signals: AbortSignal[] = [];
		axiosMocks.get.mockImplementation((_url: string, config: { signal: AbortSignal }) => {
			signals.push(config.signal);
			return new Promise(() => undefined);
		});

		const { unmount } = renderHook(
			() => useUpdateManager({ currentVersionString: '0.9.11' }),
			{ wrapper: createWrapper(store) },
		);

		await waitFor(() => expect(signals).toHaveLength(2));
		unmount();

		expect(signals.every(signal => signal.aborted)).toBe(true);
	});

	it('posts an authorized update with the CSRF token', async () => {
		const store = createStore();
		store.set(clientSettingsAtom, {
			...clientSettingsInitial,
			versionCheckDays: 0,
		});
		const { result } = renderHook(
			() => useUpdateManager({ currentVersionString: '0.9.11' }),
			{ wrapper: createWrapper(store) },
		);

		await act(async () => {
			result.current.setAdminToken('admin-token');
		});
		await act(async () => {
			result.current.checkForUpdates();
		});
		await waitFor(() => expect(result.current.capabilities).not.toBeNull());
		await act(async () => {
			await result.current.installVersion('v1.0.0');
		});

		expect(adminMocks.postAdminJson).toHaveBeenCalledWith(
			'auto-version-switch.php',
			{ version: 'v1.0.0' },
			'admin-token',
			'csrf-token',
			expect.any(AbortSignal),
		);
	});
});
