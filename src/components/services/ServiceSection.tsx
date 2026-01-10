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

import { useCallback, useEffect, useRef } from 'react';
// State Management
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { bigStateAtom, clientSettingsAtom, clientSettingsInitial } from '../../atoms/settingsState';
import { serviceIsFetchingAtom, serviceAtom, serviceHowManyAtom, serviceIsFakeDataSetAtom } from '../../atoms/serviceAtom';

import { translate } from '../../helpers/language';
import { cleanDemoDataServicelist } from '../../helpers/nagiostv';
import { convertServiceObjectToArray } from '../../helpers/nagiostv';

import PollingSpinner from '../widgets/PollingSpinner';
import ServiceItems from './ServiceItems';
import ServiceFilters from './ServiceFilters';

// 3rd party addons
import axios from 'axios';
import _ from 'lodash';

// Types
import { Service, ServiceList } from '../../types/hostAndServiceTypes';
import { handleFetchFail } from 'helpers/axios';
import { howManyServiceCounter } from './service-functions';

let isComponentMounted = false;

const ServiceSection = () => {

	//console.log('ServiceSection run');

	// State Management state (this section)
	const [serviceIsFetching, setServiceIsFetching] = useAtom(serviceIsFetchingAtom);
	const setServiceIsFakeDataSet = useSetAtom(serviceIsFakeDataSetAtom);
	const [serviceState, setServiceState] = useAtom(serviceAtom);
	const [serviceHowManyState, setServiceHowManyState] = useAtom(serviceHowManyAtom);
	const totalCount = useRef(0);
	// State Management state (main)
	const [bigState, setBigState] = useAtom(bigStateAtom);
	const clientSettings = useAtomValue(clientSettingsAtom);

	// Chop the bigState into vars
	const {
		isDemoMode,
		useFakeSampleData,
	} = bigState;

	// Chop the clientSettings into vars
	const {
		fetchServiceFrequency,
		hostgroupFilter,
		servicegroupFilter,
		serviceSortOrder,
		language,
	} = clientSettings;

	useEffect(() => {

		isComponentMounted = true;

		const timeoutHandle = setTimeout(() => {
			fetchServiceCountThenFetchData();
		}, 1000);

		let intervalHandle: NodeJS.Timeout | null = null;
		if (isDemoMode === false && useFakeSampleData == false) {
			// safetly net in case the interval value is bad
			const fetchServiceFrequencySafe = (typeof fetchServiceFrequency === 'number' && fetchServiceFrequency >= 5) ? fetchServiceFrequency : clientSettingsInitial.fetchServiceFrequency;
			// we fetch alerts on a slower frequency interval
			intervalHandle = setInterval(() => {
				fetchServiceCountThenFetchData();
			}, fetchServiceFrequencySafe * 1000);
		}

		return () => {
			if (timeoutHandle) {
				clearTimeout(timeoutHandle);
			}
			if (intervalHandle) {
				clearInterval(intervalHandle);
			}
			isComponentMounted = false;
		};
	}, [clientSettings.fetchServiceFrequency, clientSettings.hideServiceOk, hostgroupFilter, servicegroupFilter]);

	const howManyCounter = useCallback((servicelist: ServiceList) => {
		//console.log('ServiceSection howManyCounter() useCallback() serviceState.response changed');

		const howMany = howManyServiceCounter(servicelist, totalCount);

		setServiceHowManyState({
			howManyServices: howMany.howManyServices,
			howManyServiceOk: howMany.howManyServiceOk,
			howManyServiceWarning: howMany.howManyServiceWarning,
			howManyServiceUnknown: howMany.howManyServiceUnknown,
			howManyServiceCritical: howMany.howManyServiceCritical,
			howManyServicePending: howMany.howManyServicePending,
			howManyServiceAcked: howMany.howManyServiceAcked,
			howManyServiceScheduled: howMany.howManyServiceScheduled,
			howManyServiceFlapping: howMany.howManyServiceFlapping,
			howManyServiceSoft: howMany.howManyServiceSoft,
			howManyServiceNotificationsDisabled: howMany.howManyServiceNotificationsDisabled,
		});

	}, [serviceState.lastUpdate]);

	const fetchServiceCountThenFetchData = () => {

		let url = '';
		if (useFakeSampleData) {
			url = './sample-data/servicecount.json';
		} else if (clientSettings.dataSource === 'livestatus') {
			url = clientSettings.livestatusPath + '?query=servicecount';
			if (hostgroupFilter) { url += `&hostgroup=${hostgroupFilter}`; }
			if (servicegroupFilter) { url += `&servicegroup=${servicegroupFilter}`; }
		} else {
			url = clientSettings.baseUrl + 'statusjson.cgi?query=servicecount';
			if (hostgroupFilter) { url += `&hostgroup=${hostgroupFilter}`; }
			if (servicegroupFilter) { url += `&servicegroup=${servicegroupFilter}`; }
		}

		setServiceIsFetching(true);

		axios.get(url, {
			timeout: (fetchServiceFrequency - 2) * 1000
		})
		.then((response) => {
			let total = 0;
			Object.keys(response.data.data.count).forEach((aaKey) => {
				total += response.data.data.count[aaKey];
			});
			totalCount.current = total;
			fetchServiceData();
		})
		.catch((error) => {
			if (isComponentMounted) {
				setServiceIsFetching(false);

				setServiceState(curr => ({
					...curr,
					error: true,
					errorCount: curr.errorCount + 1,
					errorMessage: `ERROR: CONNECTION REFUSED to ${url}`
				}));
			}
		});

	};

	const fetchServiceData = () => {

		// if we are offline, let's just skip
		// This is broken on Midori browser on Raspberry Pi and I assume others then. Disabling for now.
		// if (!navigator.onLine) {
		//   console.log('fetchServiceData() browser is offline');
		//   return;
		// }

		let url = '';
		if (useFakeSampleData) {
			url = './sample-data/servicelist.json';
		} else if (clientSettings.dataSource === 'livestatus') {
			url = clientSettings.livestatusPath + '?query=servicelist';
			if (hostgroupFilter) { url += `&hostgroup=${hostgroupFilter}`; }
			if (servicegroupFilter) { url += `&servicegroup=${servicegroupFilter}`; }
		} else {
			url = clientSettings.baseUrl + 'statusjson.cgi?query=servicelist&details=true';
			// add filter for servicestatus "not ok" only
			if (clientSettings.hideServiceOk) {
				url += '&servicestatus=warning+critical+unknown+pending';
			}
			if (hostgroupFilter) { url += `&hostgroup=${hostgroupFilter}`; }
			if (servicegroupFilter) { url += `&servicegroup=${servicegroupFilter}`; }
		}
		//console.log('Requesting Service Data: ' + url);

		setServiceIsFetching(true);

		axios.get(
			url,
			{timeout: (fetchServiceFrequency - 2) * 1000}
		)
		.then((response) => {
			// test that return data is json
			if (response.headers && response.headers['content-type']?.indexOf('application/json') === -1) {
				console.log('fetchServiceData() ERROR: got response but result data is not JSON. Base URL setting is probably wrong.');
				setServiceIsFetching(false);
				setServiceState(curr => ({
					...curr,
					error: true,
					errorCount: curr.errorCount + 1,
					errorMessage: 'ERROR: Result data is not JSON. Base URL setting is probably wrong.'
				}));
				return;
			}

			// Success

			// Make an array from the object
			let my_list: Record<string, Record<string, Service>> = _.get(response.data.data, 'servicelist', {});

			// If we are in demo mode then clean the fake data
			if (isDemoMode) {
				my_list = cleanDemoDataServicelist(my_list);
			}

			// convert the service object into an array (and sort it)
			const myArray = convertServiceObjectToArray(my_list);
			// console.log('ServiceSection myArray:', myArray);

			// check for old stale data (detect if nagios is down)
			const durationMs = new Date().getTime() - response.data.result.last_data_update;
			const hours = (durationMs / (1000 * 60 * 60)).toFixed(1);

			// we disable the stale check if in demo mode since the demo data is always stale
			if (isDemoMode === false && useFakeSampleData == false && parseFloat(hours) >= 1) {
				if (isComponentMounted) {
					setServiceIsFetching(false);
					setServiceState(curr => ({
						...curr,
						error: true,
						errorCount: curr.errorCount + 1,
						errorMessage: `Data is stale ${hours} hours. Is Nagios running?`,
						lastUpdate: new Date().getTime(),
						response: my_list,
						stateArray: myArray
					}));
				}
			} else {
				if (isComponentMounted) {
					setServiceIsFetching(false);
					setServiceState(curr => ({
						...curr,
						error: false,
						errorCount: 0,
						errorMessage: '',
						lastUpdate: new Date().getTime(),
						response: my_list,
						stateArray: myArray
					}));

					setServiceIsFakeDataSet(useFakeSampleData);

					howManyCounter(my_list);
				}
			}
		})
		.catch((error) => {
			if (isComponentMounted) {
				setServiceIsFetching(false);

				handleFetchFail(setServiceState, error, url, true);
			}
		});
	}

	// Mutating state on serviceState.stateArray is not allowed (the sort below)
	// so we need to copy this to something
	let sortedServiceStateArray: Service[] = [];
	if (Array.isArray(serviceState.stateArray)) {
		sortedServiceStateArray = [...serviceState.stateArray];
	}
	
	// let howManyServices = 0;
	// const servicelist = serviceState.response;
	// Object.keys(servicelist).forEach(host => {
	// 	howManyServices += Object.keys(servicelist[host]).length;
	// });
	const howManyServices = serviceHowManyState.howManyServices;

	// Sort based on serviceSortOrder
	if (serviceSortOrder === 'az' || serviceSortOrder === 'za') {
		// Alphabetical sorting by host_name, then by description (service name)
		const sortMultiplier = serviceSortOrder === 'az' ? 1 : -1;
		sortedServiceStateArray.sort((a, b) => {
			const hostCompare = a.host_name.localeCompare(b.host_name);
			if (hostCompare !== 0) { return hostCompare * sortMultiplier; }
			return a.description.localeCompare(b.description) * sortMultiplier;
		});
	} else {
		// Time-based sorting (newest/oldest)
		let sort = 1;
		if (serviceSortOrder === 'oldest') { sort = -1; }
		sortedServiceStateArray.sort((a, b) => {
			if (a.last_time_ok < b.last_time_ok) { return 1 * sort; }
			if (a.last_time_ok > b.last_time_ok) { return -1 * sort; }
			return 0;
		});
	}

	return (
		<div className="ServiceSection">

			<div className="service-summary">

				<span className="service-summary-title">
					<strong>{howManyServices}</strong> {howManyServices === 1 ? translate('service', language) : translate('services', language)}{' '}
					{servicegroupFilter && <span>({servicegroupFilter})</span>}
				</span>

				{/* service filters */}
				<ServiceFilters />

				{/* how many down emoji */}
				{/*
        {showEmoji && <HowManyEmoji
          howMany={howManyServices}
          howManyWarning={howManyServiceWarning}
          howManyCritical={howManyServiceCritical}
          howManyDown={serviceStateArray.length}
        />}
        */}

				{/* loading spinner */}
				<PollingSpinner
					isFetching={serviceIsFetching}
					isDemoMode={isDemoMode}
					error={serviceState.error}
					errorCount={serviceState.errorCount}
					fetchVariableName={'fetchServiceFrequency'}
				/>

			</div>

			{/** Show Error Message - If there is a servicelist error (ajax fetching) then show the error message here */}
			{/* Disabled in Demo mode */}
			{(!isDemoMode && serviceState.error && (serviceState.errorCount > 2 || howManyServices === 0)) && <div className="margin-top-10 border-red ServiceItemError"><span role="img" aria-label="error">⚠️</span> {serviceState.errorMessage}</div>}

			<ServiceItems
				serviceStateArray={sortedServiceStateArray}
				settings={clientSettings}
				//servicelistError={serviceState.error}
				isDemoMode={isDemoMode}
			/>

		</div>
	);

};

export default ServiceSection;
