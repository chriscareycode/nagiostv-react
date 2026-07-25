import { describe, expect, it } from 'vitest';
import { clientSettingsInitial } from '../atoms/settingsState';
import { Host, HostList, Service, ServiceList } from '../types/hostAndServiceTypes';
import { ClientSettings } from '../types/settings';
import {
	countHostStates,
	countServiceStates,
	filterHostStateArray,
	filterServiceStateArray,
	sortHostStateArray,
	sortServiceStateArray,
} from './nagiostv';

const visibleSettings: ClientSettings = {
	...clientSettingsInitial,
	hideHostPending: false,
	hideHostUp: false,
	hideHostDown: false,
	hideHostUnreachable: false,
	hideHostAcked: false,
	hideHostScheduled: false,
	hideHostFlapping: false,
	hideHostSoft: false,
	hideHostNotificationsDisabled: false,
	hideServicePending: false,
	hideServiceOk: false,
	hideServiceWarning: false,
	hideServiceUnknown: false,
	hideServiceCritical: false,
	hideServiceAcked: false,
	hideServiceScheduled: false,
	hideServiceFlapping: false,
	hideServiceSoft: false,
	hideServiceNotificationsDisabled: false,
};

const createHost = (name: string, status: number, overrides: Partial<Host> = {}): Host => ({
	name,
	last_time_up: 0,
	status,
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
	...overrides,
});

const createService = (
	description: string,
	status: number,
	overrides: Partial<Service> = {},
): Service => ({
	host_name: 'web-01',
	description,
	last_time_ok: 0,
	problem_has_been_acknowledged: false,
	scheduled_downtime_depth: 0,
	status,
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
	...overrides,
});

describe('monitoring visibility filters', () => {
	it('keeps host status rules domain-specific', () => {
		const hosts = [
			createHost('pending', 1),
			createHost('up', 2),
			createHost('down', 4),
			createHost('unreachable', 8),
		];

		expect(filterHostStateArray(hosts, {
			...visibleSettings,
			hideHostDown: true,
		}).map(host => host.name)).toEqual(['pending', 'up', 'unreachable']);
		expect(filterHostStateArray(hosts, {
			...visibleSettings,
			hideHostPending: true,
			hideHostUp: true,
			hideHostUnreachable: true,
		}).map(host => host.name)).toEqual(['down']);
	});

	it('keeps service status rules domain-specific', () => {
		const services = [
			createService('pending', 1),
			createService('ok', 2),
			createService('warning', 4),
			createService('unknown', 8),
			createService('critical', 16),
		];

		expect(filterServiceStateArray(services, {
			...visibleSettings,
			hideServiceWarning: true,
			hideServiceCritical: true,
		}).map(service => service.description)).toEqual(['pending', 'ok', 'unknown']);
		expect(filterServiceStateArray(services, {
			...visibleSettings,
			hideServicePending: true,
			hideServiceOk: true,
			hideServiceUnknown: true,
		}).map(service => service.description)).toEqual(['warning', 'critical']);
	});

	it.each([
		['acknowledged', { problem_has_been_acknowledged: true }, 'hideHostAcked', 'hideServiceAcked'],
		['scheduled', { scheduled_downtime_depth: 1 }, 'hideHostScheduled', 'hideServiceScheduled'],
		['flapping', { is_flapping: true }, 'hideHostFlapping', 'hideServiceFlapping'],
		['soft', { state_type: 0 }, 'hideHostSoft', 'hideServiceSoft'],
		['notifications disabled', { notifications_enabled: false }, 'hideHostNotificationsDisabled', 'hideServiceNotificationsDisabled'],
	] as const)(
		'applies the shared %s predicate to hosts and services',
		(_label, itemOverrides, hostSetting, serviceSetting) => {
			const host = createHost('affected', 4, itemOverrides);
			const service = createService('affected', 16, itemOverrides);
			const settings = {
				...visibleSettings,
				[hostSetting]: true,
				[serviceSetting]: true,
			};

			expect(filterHostStateArray([host], settings)).toEqual([]);
			expect(filterServiceStateArray([service], settings)).toEqual([]);
		},
	);
});

describe('monitoring state counters', () => {
	it('counts host-specific statuses while using the server total for healthy hosts', () => {
		const hosts: HostList = {
			pending: createHost('pending', 1),
			down: createHost('down', 4),
			unreachable: createHost('unreachable', 8),
		};

		expect(countHostStates(hosts, 10)).toMatchObject({
			howManyHosts: 10,
			howManyHostPending: 1,
			howManyHostUp: 8,
			howManyHostDown: 1,
			howManyHostUnreachable: 1,
		});
	});

	it('counts service-specific statuses while using the server total for healthy services', () => {
		const services: ServiceList = {
			'web-01': {
				pending: createService('pending', 1),
				warning: createService('warning', 4),
				unknown: createService('unknown', 8),
				critical: createService('critical', 16),
			},
		};

		expect(countServiceStates(services, 12)).toMatchObject({
			howManyServices: 12,
			howManyServiceOk: 9,
			howManyServicePending: 1,
			howManyServiceWarning: 1,
			howManyServiceUnknown: 1,
			howManyServiceCritical: 1,
		});
	});

	it('shares common problem-state counting without treating healthy soft states as problems', () => {
		const commonProblem = {
			problem_has_been_acknowledged: true,
			scheduled_downtime_depth: 1,
			is_flapping: true,
			state_type: 0,
			notifications_enabled: false,
		};
		const hosts: HostList = {
			problem: createHost('problem', 4, commonProblem),
			healthy: createHost('healthy', 2, commonProblem),
		};
		const services: ServiceList = {
			'web-01': {
				problem: createService('problem', 16, commonProblem),
				healthy: createService('healthy', 2, commonProblem),
			},
		};

		expect(countHostStates(hosts, 2)).toMatchObject({
			howManyHostAcked: 2,
			howManyHostScheduled: 2,
			howManyHostFlapping: 2,
			howManyHostSoft: 1,
			howManyHostNotificationsDisabled: 1,
		});
		expect(countServiceStates(services, 2)).toMatchObject({
			howManyServiceAcked: 2,
			howManyServiceScheduled: 2,
			howManyServiceFlapping: 2,
			howManyServiceSoft: 1,
			howManyServiceNotificationsDisabled: 1,
		});
	});
});

describe('monitoring state sorting', () => {
	it('sorts hosts alphabetically in either direction without mutating the input', () => {
		const hosts = [
			createHost('charlie', 4),
			createHost('alpha', 4),
			createHost('bravo', 4),
		];

		expect(sortHostStateArray(hosts, 'az').map(host => host.name))
			.toEqual(['alpha', 'bravo', 'charlie']);
		expect(sortHostStateArray(hosts, 'za').map(host => host.name))
			.toEqual(['charlie', 'bravo', 'alpha']);
		expect(hosts.map(host => host.name)).toEqual(['charlie', 'alpha', 'bravo']);
	});

	it('sorts services by host and then description', () => {
		const services = [
			createService('memory', 16, { host_name: 'web-02' }),
			createService('memory', 16, { host_name: 'web-01' }),
			createService('cpu', 16, { host_name: 'web-01' }),
		];
		const labels = (items: Service[]) => items.map(
			service => `${service.host_name}:${service.description}`,
		);

		expect(labels(sortServiceStateArray(services, 'az')))
			.toEqual(['web-01:cpu', 'web-01:memory', 'web-02:memory']);
		expect(labels(sortServiceStateArray(services, 'za')))
			.toEqual(['web-02:memory', 'web-01:memory', 'web-01:cpu']);
	});

	it('sorts scheduled checks first and uses domain names to break ties', () => {
		const hosts = [
			createHost('unscheduled', 4, { next_check: 0 }),
			createHost('bravo', 4, { next_check: 100 }),
			createHost('alpha', 4, { next_check: 100 }),
		];
		const services = [
			createService('unscheduled', 16, { next_check: 0 }),
			createService('memory', 16, { next_check: 100 }),
			createService('cpu', 16, { next_check: 100 }),
		];

		expect(sortHostStateArray(hosts, 'nextcheck').map(host => host.name))
			.toEqual(['alpha', 'bravo', 'unscheduled']);
		expect(sortServiceStateArray(services, 'nextcheck').map(service => service.description))
			.toEqual(['cpu', 'memory', 'unscheduled']);
	});

	it('sorts host and service healthy timestamps newest or oldest first', () => {
		const hosts = [
			createHost('older', 4, { last_time_up: 100 }),
			createHost('newer', 4, { last_time_up: 200 }),
		];
		const services = [
			createService('older', 16, { last_time_ok: 100 }),
			createService('newer', 16, { last_time_ok: 200 }),
		];

		expect(sortHostStateArray(hosts, 'newest').map(host => host.name))
			.toEqual(['newer', 'older']);
		expect(sortHostStateArray(hosts, 'oldest').map(host => host.name))
			.toEqual(['older', 'newer']);
		expect(sortServiceStateArray(services, 'newest').map(service => service.description))
			.toEqual(['newer', 'older']);
		expect(sortServiceStateArray(services, 'oldest').map(service => service.description))
			.toEqual(['older', 'newer']);
	});
});
