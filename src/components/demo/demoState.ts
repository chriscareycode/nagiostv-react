import { HostList, ServiceList } from '../../types/hostAndServiceTypes';

const findHostKey = (
	hostlist: HostList,
	status: number,
	direction: 'first' | 'last',
): string | undefined => {
	const keys = Object.keys(hostlist);
	const orderedKeys = direction === 'first' ? keys : keys.reverse();
	return orderedKeys.find(key => hostlist[key].status === status);
};

export const changeHostStatus = (
	hostlist: HostList,
	fromStatus: number,
	toStatus: number,
	direction: 'first' | 'last',
	now = Date.now(),
): HostList => {
	const hostKey = findHostKey(hostlist, fromStatus, direction);
	if (!hostKey) {
		return hostlist;
	}

	return {
		...hostlist,
		[hostKey]: {
			...hostlist[hostKey],
			status: toStatus,
			last_time_up: now,
		},
	};
};

const findService = (
	servicelist: ServiceList,
	status: number,
	direction: 'first' | 'last',
): { hostKey: string; serviceKey: string } | undefined => {
	const hostKeys = Object.keys(servicelist);
	const orderedHostKeys = direction === 'first' ? hostKeys : hostKeys.reverse();

	for (const hostKey of orderedHostKeys) {
		const serviceKeys = Object.keys(servicelist[hostKey]);
		const orderedServiceKeys = direction === 'first' ? serviceKeys : serviceKeys.reverse();
		const serviceKey = orderedServiceKeys.find(key => servicelist[hostKey][key].status === status);
		if (serviceKey) {
			return { hostKey, serviceKey };
		}
	}

	return undefined;
};

export const changeServiceStatus = (
	servicelist: ServiceList,
	fromStatus: number,
	toStatus: number,
	direction: 'first' | 'last',
	now = Date.now(),
): ServiceList => {
	const match = findService(servicelist, fromStatus, direction);
	if (!match) {
		return servicelist;
	}

	const { hostKey, serviceKey } = match;
	return {
		...servicelist,
		[hostKey]: {
			...servicelist[hostKey],
			[serviceKey]: {
				...servicelist[hostKey][serviceKey],
				status: toStatus,
				last_time_ok: now,
			},
		},
	};
};
