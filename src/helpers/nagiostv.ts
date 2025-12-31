/**
 * NagiosTV https://nagiostv.com
 * Copyright (C) 2008-2025 Chris Carey https://chriscarey.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { Host, HostList, Service, ServiceList } from "types/hostAndServiceTypes";
import { ClientSettings } from "types/settings";
import Cookie from 'js-cookie';

export function cleanDemoDataHostlist(hostlist: HostList) {
	//console.log(hostlist);
	Object.keys(hostlist).forEach(key => {
		//if (hostlist[key].status === 2) {
		hostlist[key].status = 2;
		hostlist[key].last_time_up = new Date().getTime();
		hostlist[key].is_flapping = false;
		hostlist[key].problem_has_been_acknowledged = false;
		hostlist[key].scheduled_downtime_depth = 0;
		return false;
		//}
	});
	return hostlist;
}
export function cleanDemoDataServicelist(servicelist: ServiceList) {
	Object.keys(servicelist).forEach(hostkey => {
		Object.keys(servicelist[hostkey]).forEach(key => {
			//if (servicelist[hostkey][key].status === 2) {
			servicelist[hostkey][key].status = 2;
			servicelist[hostkey][key].last_time_ok = new Date().getTime();
			servicelist[hostkey][key].is_flapping = false;
			servicelist[hostkey][key].problem_has_been_acknowledged = false;
			servicelist[hostkey][key].scheduled_downtime_depth = 0;
			return false;
			//}
		});
		return false;
	});
	return servicelist;
}

export function convertHostObjectToArray(hostlist: Record<string, Host>) {
	let hostStateArray: Host[] = [];

	if (hostlist) {
		Object.keys(hostlist).forEach((k) => {
			// if host status is NOT UP (hostlist[k].status !== 2)
			// or host is flapping,
			// or host is scheduled downtime
			// we add it to the array
			// if (hostlist[k].status !== 2 || hostlist[k].is_flapping || hostlist[k].scheduled_downtime_depth > 0) {
				hostStateArray.push(hostlist[k]);
			// }
		});
	}

	return hostStateArray;
}

export function convertServiceObjectToArray(servicelist: Record<string, Record<string, Service>>) {
	let serviceStateArray: Service[] = [];

	if (servicelist) {
		Object.keys(servicelist).forEach((k) => {
			Object.keys(servicelist[k]).forEach((l) => {
				// if service status is NOT OK (servicelist[k][l].status !== 2)
				// or service is flapping,
				// or host is scheduled downtime
				// we add it to the array
				// if (servicelist[k][l].status !== 2 ||
				// 	servicelist[k][l].is_flapping ||
				// 	servicelist[k][l].scheduled_downtime_depth > 0) {
					// add it to the array of service problems
					serviceStateArray.push(servicelist[k][l]);
				// }
			});
		});
	}

	return serviceStateArray;
}


// Utility functions to handle localStorage and cookies
export const isLocalStorageEnabled = (): boolean => {
	try {
		const testKey = 'test';
		localStorage.setItem(testKey, 'testValue');
		localStorage.removeItem(testKey);
		return true;
	} catch (e) {
		return false;
	}
};

export const doesLocalStorageSettingsExist = (): boolean => {
	if (isLocalStorageEnabled()) {
		return localStorage.getItem('settings') !== null;
	} else {
		return false;
	}
}

export const saveCookie = (changeString: string, obj: ClientSettings) => {
	Cookie.set('settings', JSON.stringify(obj));
	console.log('Saved cookie', changeString, obj);
}

export const saveLocalStorage = (changeString: string, obj: ClientSettings) => {
	if (isLocalStorageEnabled()) {
		localStorage.setItem('settings', JSON.stringify(obj));
		console.log('Saved localStorage', changeString, obj);
	} else {
		console.error('LocalStorage is not enabled. Trying to save to cookie instead.');
		saveCookie(changeString, obj);
	}
};


export const filterHostStateArray = (hostStateArray: Host[], settings: ClientSettings): Host[] => {
	return hostStateArray.filter(host => {
		// Filter by status
		if (settings.hideHostPending && host.status === 1) return false;
		if (settings.hideHostUp && host.status === 2) return false;
		if (settings.hideHostDown && host.status === 4) return false;
		if (settings.hideHostUnreachable && host.status === 8) return false;

		// Filter by acknowledged
		if (settings.hideHostAcked && host.problem_has_been_acknowledged) return false;

		// Filter by scheduled downtime
		if (settings.hideHostScheduled && host.scheduled_downtime_depth > 0) return false;

		// Filter by flapping
		if (settings.hideHostFlapping && host.is_flapping) return false;

		// Filter by soft state (state_type 0 = soft, 1 = hard)
		if (settings.hideHostSoft && host.state_type === 0) return false;

		// Filter by notifications disabled
		if (settings.hideHostNotificationsDisabled && !host.notifications_enabled) return false;

		return true;
	});
};

export const filterServiceStateArray = (serviceStateArray: Service[], settings: ClientSettings): Service[] => {
	return serviceStateArray.filter(service => {
		// Filter by status
		if (settings.hideServicePending && service.status === 1) return false;
		if (settings.hideServiceOk && service.status === 2) return false;
		if (settings.hideServiceWarning && service.status === 4) return false;
		if (settings.hideServiceUnknown && service.status === 8) return false;
		if (settings.hideServiceCritical && service.status === 16) return false;

		// Filter by acknowledged
		if (settings.hideServiceAcked && service.problem_has_been_acknowledged) return false;

		// Filter by scheduled downtime
		if (settings.hideServiceScheduled && service.scheduled_downtime_depth > 0) return false;

		// Filter by flapping
		if (settings.hideServiceFlapping && service.is_flapping) return false;

		// Filter by soft state (state_type 0 = soft, 1 = hard)
		if (settings.hideServiceSoft && service.state_type === 0) return false;

		// Filter by notifications disabled
		if (settings.hideServiceNotificationsDisabled && !service.notifications_enabled) return false;

		return true;
	});
}

/**
 * Count how many hosts are in a down state from a filtered array
 */
export const countFilteredHostStates = (filteredHostArray: Host[]): number => {
	return filteredHostArray.filter(host => host.status === 4).length; // 4 = DOWN
}

/**
 * Count how many services are in warning or critical state from a filtered array
 */
export const countFilteredServiceStates = (filteredServiceArray: Service[]): { warning: number; critical: number } => {
	let warning = 0;
	let critical = 0;
	filteredServiceArray.forEach(service => {
		if (service.status === 4) warning++;   // 4 = WARNING
		if (service.status === 16) critical++; // 16 = CRITICAL
	});
	return { warning, critical };
}