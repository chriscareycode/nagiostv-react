import { describe, expect, it } from 'vitest';
import { clientSettingsInitial } from '../atoms/settingsState';
import { Host, Service } from '../types/hostAndServiceTypes';
import { ClientSettings } from '../types/settings';
import { filterHostStateArray, filterServiceStateArray } from './nagiostv';

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
