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
	let hostProblemsArray: Host[] = [];

	if (hostlist) {
		Object.keys(hostlist).forEach((k) => {
			// if host status is NOT UP
			// or host is flapping,
			// or host is scheduled downtime
			// we add it to the array
			if (hostlist[k].status !== 2 || hostlist[k].is_flapping || hostlist[k].scheduled_downtime_depth > 0) {
				hostProblemsArray.push(hostlist[k]);
			}
		});
	}

	return hostProblemsArray;
}

export function convertServiceObjectToArray(servicelist: Record<string, Record<string, Service>>) {
	let serviceProblemsArray: Service[] = [];

	if (servicelist) {
		Object.keys(servicelist).forEach((k) => {
			Object.keys(servicelist[k]).forEach((l) => {
				// if service status is NOT OK
				// or service is flapping,
				// or host is scheduled downtime
				// we add it to the array
				if (servicelist[k][l].status !== 2 ||
					servicelist[k][l].is_flapping ||
					servicelist[k][l].scheduled_downtime_depth > 0) {
					// add it to the array of service problems
					serviceProblemsArray.push(servicelist[k][l]);
				}
			});
		});
	}

	return serviceProblemsArray;
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
