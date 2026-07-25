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


interface CommonMonitoringState {
	problem_has_been_acknowledged: boolean;
	scheduled_downtime_depth: number;
	is_flapping: boolean;
	state_type: number;
	notifications_enabled: boolean;
}

interface CommonVisibilitySettings {
	hideAcknowledged: boolean;
	hideScheduled: boolean;
	hideFlapping: boolean;
	hideSoft: boolean;
	hideNotificationsDisabled: boolean;
}

const isCommonMonitoringStateVisible = (
	item: CommonMonitoringState,
	settings: CommonVisibilitySettings,
): boolean => {
	if (settings.hideAcknowledged && item.problem_has_been_acknowledged) return false;
	if (settings.hideScheduled && item.scheduled_downtime_depth > 0) return false;
	if (settings.hideFlapping && item.is_flapping) return false;
	if (settings.hideSoft && item.state_type === 0) return false;
	if (settings.hideNotificationsDisabled && !item.notifications_enabled) return false;
	return true;
};

export const filterHostStateArray = (hosts: Host[], settings: ClientSettings): Host[] => {
	const commonSettings: CommonVisibilitySettings = {
		hideAcknowledged: settings.hideHostAcked,
		hideScheduled: settings.hideHostScheduled,
		hideFlapping: settings.hideHostFlapping,
		hideSoft: settings.hideHostSoft,
		hideNotificationsDisabled: settings.hideHostNotificationsDisabled,
	};

	return hosts.filter(host => {
		if (settings.hideHostPending && host.status === 1) return false;
		if (settings.hideHostUp && host.status === 2) return false;
		if (settings.hideHostDown && host.status === 4) return false;
		if (settings.hideHostUnreachable && host.status === 8) return false;
		return isCommonMonitoringStateVisible(host, commonSettings);
	});
};

export const filterServiceStateArray = (
	services: Service[],
	settings: ClientSettings,
): Service[] => {
	const commonSettings: CommonVisibilitySettings = {
		hideAcknowledged: settings.hideServiceAcked,
		hideScheduled: settings.hideServiceScheduled,
		hideFlapping: settings.hideServiceFlapping,
		hideSoft: settings.hideServiceSoft,
		hideNotificationsDisabled: settings.hideServiceNotificationsDisabled,
	};

	return services.filter(service => {
		if (settings.hideServicePending && service.status === 1) return false;
		if (settings.hideServiceOk && service.status === 2) return false;
		if (settings.hideServiceWarning && service.status === 4) return false;
		if (settings.hideServiceUnknown && service.status === 8) return false;
		if (settings.hideServiceCritical && service.status === 16) return false;
		return isCommonMonitoringStateVisible(service, commonSettings);
	});
};

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
