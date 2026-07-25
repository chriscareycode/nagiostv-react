import { act, render } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { servicegroupAtom } from '../atoms/hostgroupAtom';
import { programStatusAtom } from '../atoms/programAtom';
import { bigStateAtom, clientSettingsAtom } from '../atoms/settingsState';
import DashboardFetch from './DashboardFetch';

const axiosMocks = vi.hoisted(() => ({
	get: vi.fn(),
}));

vi.mock('axios', () => ({
	default: {
		get: axiosMocks.get,
	},
}));

afterEach(() => {
	vi.useRealTimers();
	axiosMocks.get.mockReset();
});

describe('DashboardFetch', () => {
	it('stores a program-status content-type error on the program atom', async () => {
		vi.useFakeTimers();
		axiosMocks.get.mockResolvedValue({
			data: '<html>Not JSON</html>',
			headers: {
				'content-type': 'text/html',
			},
		});

		const store = createStore();
		store.set(bigStateAtom, {
			...store.get(bigStateAtom),
			isDemoMode: true,
			useFakeSampleData: true,
		});

		render(
			<Provider store={store}>
				<DashboardFetch />
			</Provider>,
		);

		await vi.advanceTimersByTimeAsync(1000);

		expect(store.get(programStatusAtom).error).toBe(true);
		expect(store.get(servicegroupAtom).error).toBe(false);
	});

	it('uses updated connection settings without remounting', async () => {
		vi.useFakeTimers();
		axiosMocks.get.mockResolvedValue({
			data: {
				data: {
					commentlist: {},
					hostgrouplist: {},
					programstatus: {},
					servicegrouplist: {},
				},
			},
			headers: {
				'content-type': 'application/json',
			},
		});

		const store = createStore();
		store.set(clientSettingsAtom, {
			...store.get(clientSettingsAtom),
			baseUrl: '/old/cgi-bin/',
			dataSource: 'cgi',
		});

		render(
			<Provider store={store}>
				<DashboardFetch />
			</Provider>,
		);

		await vi.advanceTimersByTimeAsync(1000);
		expect(axiosMocks.get).toHaveBeenCalledWith(
			'/old/cgi-bin/statusjson.cgi?query=programstatus',
			expect.any(Object),
		);

		axiosMocks.get.mockClear();
		act(() => {
			store.set(clientSettingsAtom, {
				...store.get(clientSettingsAtom),
				baseUrl: '/new/cgi-bin/',
			});
		});
		await vi.advanceTimersByTimeAsync(1000);

		expect(axiosMocks.get).toHaveBeenCalledWith(
			'/new/cgi-bin/statusjson.cgi?query=programstatus',
			expect.any(Object),
		);
		expect(axiosMocks.get).not.toHaveBeenCalledWith(
			expect.stringContaining('/old/cgi-bin/'),
			expect.any(Object),
		);
	});

	it('aborts obsolete requests when connection settings change', async () => {
		vi.useFakeTimers();
		axiosMocks.get.mockImplementation(() => new Promise(() => undefined));

		const store = createStore();
		const view = render(
			<Provider store={store}>
				<DashboardFetch />
			</Provider>,
		);

		await vi.advanceTimersByTimeAsync(1000);
		const originalSignals = axiosMocks.get.mock.calls.map((call) => {
			return (call[1] as { signal: AbortSignal }).signal;
		});
		expect(originalSignals).toHaveLength(4);
		expect(originalSignals.every((signal) => !signal.aborted)).toBe(true);

		act(() => {
			store.set(clientSettingsAtom, {
				...store.get(clientSettingsAtom),
				baseUrl: '/replacement/cgi-bin/',
			});
		});

		expect(originalSignals.every((signal) => signal.aborted)).toBe(true);
		view.unmount();
		expect(vi.getTimerCount()).toBe(0);
	});
});
