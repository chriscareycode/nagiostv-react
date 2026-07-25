import { render } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { servicegroupAtom } from '../atoms/hostgroupAtom';
import { programStatusAtom } from '../atoms/programAtom';
import { bigStateAtom } from '../atoms/settingsState';
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
});
