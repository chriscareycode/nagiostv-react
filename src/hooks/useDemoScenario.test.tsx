import { act, renderHook } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { hostAtom, hostIsFakeDataSetAtom } from '../atoms/hostAtom';
import { serviceAtom, serviceIsFakeDataSetAtom } from '../atoms/serviceAtom';
import { convertHostObjectToArray, convertServiceObjectToArray } from '../helpers/nagiostv';
import { Host, HostList, Service, ServiceList } from '../types/hostAndServiceTypes';
import { useDemoScenario } from './useDemoScenario';

const createHost = (name: string): Host => ({
	name,
	last_time_up: 0,
	status: 2,
	is_flapping: false,
	problem_has_been_acknowledged: false,
	scheduled_downtime_depth: 0,
	state_type: 1,
	next_check: 0,
	last_check: 0,
	check_type: 0,
	notifications_enabled: true,
	current_attempt: 1,
	max_attempts: 3,
	plugin_output: '',
	checks_enabled: true,
});

const createService = (hostName: string, description: string): Service => ({
	host_name: hostName,
	description,
	last_time_ok: 0,
	problem_has_been_acknowledged: false,
	scheduled_downtime_depth: 0,
	status: 2,
	is_flapping: false,
	state_type: 1,
	notifications_enabled: true,
	next_check: 0,
	last_check: 0,
	check_type: 0,
	current_attempt: 1,
	max_attempts: 3,
	plugin_output: '',
	checks_enabled: true,
});

const createWrapper = (store: ReturnType<typeof createStore>) => {
	return function Wrapper({ children }: { children: ReactNode }) {
		return <Provider store={store}>{children}</Provider>;
	};
};

beforeEach(() => {
	vi.useFakeTimers();
	vi.setSystemTime(new Date('2026-07-24T12:00:00Z'));
});

afterEach(() => {
	vi.useRealTimers();
});

describe('useDemoScenario', () => {
	it('runs the host and service demo sequence and exposes controls afterward', async () => {
		const store = createStore();
		const hosts: HostList = {
			alpha: createHost('alpha'),
			bravo: createHost('bravo'),
			charlie: createHost('charlie'),
			delta: createHost('delta'),
		};
		const services: ServiceList = {
			alpha: {
				one: createService('alpha', 'one'),
				two: createService('alpha', 'two'),
				three: createService('alpha', 'three'),
				four: createService('alpha', 'four'),
				five: createService('alpha', 'five'),
			},
		};
		store.set(hostAtom, {
			...store.get(hostAtom),
			response: hosts,
			stateArray: convertHostObjectToArray(hosts),
		});
		store.set(serviceAtom, {
			...store.get(serviceAtom),
			response: services,
			stateArray: convertServiceObjectToArray(services),
		});
		store.set(hostIsFakeDataSetAtom, true);
		store.set(serviceIsFakeDataSetAtom, true);

		const { result } = renderHook(() => useDemoScenario(), {
			wrapper: createWrapper(store),
		});

		expect(store.get(hostAtom).stateArray.filter(host => host.status === 4)).toHaveLength(3);
		expect(store.get(serviceAtom).stateArray.filter(service => service.status === 4)).toHaveLength(2);
		expect(store.get(serviceAtom).stateArray.filter(service => service.status === 16)).toHaveLength(2);
		expect(result.current.isVisible).toBe(false);

		await act(async () => {
			await vi.advanceTimersByTimeAsync(35_000);
		});

		expect(store.get(hostAtom).stateArray.every(host => host.status === 2)).toBe(true);
		expect(store.get(serviceAtom).stateArray.every(service => service.status === 2)).toBe(true);
		expect(result.current.isVisible).toBe(true);
	});

	it('clears pending scenario timers on unmount', async () => {
		const store = createStore();
		const hosts: HostList = {
			alpha: createHost('alpha'),
			bravo: createHost('bravo'),
			charlie: createHost('charlie'),
		};
		store.set(hostAtom, {
			...store.get(hostAtom),
			response: hosts,
			stateArray: convertHostObjectToArray(hosts),
		});
		store.set(hostIsFakeDataSetAtom, true);

		const { unmount } = renderHook(() => useDemoScenario(), {
			wrapper: createWrapper(store),
		});
		unmount();

		await act(async () => {
			await vi.advanceTimersByTimeAsync(40_000);
		});

		expect(store.get(hostAtom).stateArray.filter(host => host.status === 4)).toHaveLength(3);
	});
});
