import { describe, expect, it } from 'vitest';
import { Host, HostList, Service, ServiceList } from '../../types/hostAndServiceTypes';
import { changeHostStatus, changeServiceStatus } from './demoState';

const createHost = (name: string, status = 2): Host => ({
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
});

const createService = (hostName: string, description: string, status = 2): Service => ({
	host_name: hostName,
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
});

describe('demo state transitions', () => {
	it('changes the first matching host without mutating the source', () => {
		const source: HostList = {
			alpha: createHost('alpha'),
			bravo: createHost('bravo'),
		};
		const result = changeHostStatus(source, 2, 4, 'first', 123);

		expect(source.alpha.status).toBe(2);
		expect(result.alpha).toMatchObject({ status: 4, last_time_up: 123 });
		expect(result.bravo).toBe(source.bravo);
	});

	it('changes the last matching host when restoring demo state', () => {
		const source: HostList = {
			alpha: createHost('alpha', 4),
			bravo: createHost('bravo', 4),
		};
		const result = changeHostStatus(source, 4, 2, 'last');

		expect(result.alpha.status).toBe(4);
		expect(result.bravo.status).toBe(2);
	});

	it('changes nested services immutably and records last_time_ok', () => {
		const source: ServiceList = {
			alpha: {
				cpu: createService('alpha', 'cpu'),
				disk: createService('alpha', 'disk'),
			},
		};
		const result = changeServiceStatus(source, 2, 16, 'first', 456);

		expect(source.alpha.cpu.status).toBe(2);
		expect(result.alpha.cpu).toMatchObject({ status: 16, last_time_ok: 456 });
		expect(result.alpha.disk).toBe(source.alpha.disk);
	});

	it('returns the original collection when no state matches', () => {
		const hosts: HostList = { alpha: createHost('alpha') };
		const services: ServiceList = {
			alpha: { cpu: createService('alpha', 'cpu') },
		};

		expect(changeHostStatus(hosts, 4, 2, 'last')).toBe(hosts);
		expect(changeServiceStatus(services, 16, 2, 'last')).toBe(services);
	});
});
