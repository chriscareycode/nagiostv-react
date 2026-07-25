import { act, renderHook, waitFor } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { bigStateAtom, clientSettingsAtom, clientSettingsInitial } from '../atoms/settingsState';
import { useUpdateManager } from './useUpdateManager';

const axiosMocks = vi.hoisted(() => ({
	get: vi.fn(),
	isCancel: vi.fn(() => false),
}));

vi.mock('axios', () => ({
	default: axiosMocks,
}));

const createWrapper = (store: ReturnType<typeof createStore>) => {
	return function Wrapper({ children }: { children: ReactNode }) {
		return <Provider store={store}>{children}</Provider>;
	};
};

beforeEach(() => {
	axiosMocks.get.mockReset();
	axiosMocks.isCancel.mockClear();
});

describe('useUpdateManager', () => {
	it('checks all update endpoints and stores the latest version', async () => {
		const store = createStore();
		axiosMocks.get.mockImplementation((url: string) => {
			if (url.includes('testphp=true')) {
				return Promise.resolve({ data: { whoami: 'www-data', script: '/var/www/nagiostv' } });
			}
			if (url.includes('api.github.com')) {
				return Promise.resolve({ data: [{ tag_name: 'v1.0.0', name: 'Release' }] });
			}
			return Promise.resolve({ data: { version: 100, version_string: '1.0.0' } });
		});

		const { result } = renderHook(
			() => useUpdateManager({ currentVersionString: '0.9.11' }),
			{ wrapper: createWrapper(store) },
		);

		await waitFor(() => {
			expect(axiosMocks.get).toHaveBeenCalledTimes(3);
			expect(result.current.bigState.latestVersion).toBe(100);
		});

		expect(result.current.clickedCheckForUpdates).toBe(true);
		expect(result.current.testPhpState.result.whoami).toBe('www-data');
		expect(result.current.githubState.result).toEqual([
			{ tag_name: 'v1.0.0', name: 'Release' },
		]);
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

		await waitFor(() => expect(signals).toHaveLength(3));
		unmount();

		expect(signals.every(signal => signal.aborted)).toBe(true);
	});

	it('uses the current latest version for one-click updates', async () => {
		const store = createStore();
		store.set(clientSettingsAtom, {
			...clientSettingsInitial,
			versionCheckDays: 0,
		});
		store.set(bigStateAtom, {
			...store.get(bigStateAtom),
			latestVersionString: '1.2.3',
		});
		axiosMocks.get.mockResolvedValue({ data: 'updated' });

		const { result } = renderHook(
			() => useUpdateManager({ currentVersionString: '0.9.11' }),
			{ wrapper: createWrapper(store) },
		);

		await act(async () => {
			await result.current.beginUpdate();
		});

		expect(axiosMocks.get).toHaveBeenCalledWith(
			'auto-version-switch.php?version=v1.2.3',
			expect.objectContaining({ timeout: 30_000 }),
		);
		expect(result.current.updateState.result).toBe('updated');
	});
});
