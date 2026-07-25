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

import { useRef } from 'react';
// State Management
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { bigStateAtom, clientSettingsAtom, clientSettingsInitial } from '../../atoms/settingsState';
import { serviceIsFetchingAtom, serviceAtom, serviceHowManyAtom, serviceIsFakeDataSetAtom } from '../../atoms/serviceAtom';

import { translate } from '../../helpers/language';
import {
	cleanDemoDataServicelist,
	convertServiceObjectToArray,
	countServiceStates,
	sortServiceStateArray,
} from '../../helpers/nagiostv';

import PollingSpinner from '../widgets/PollingSpinner';
import ServiceItems from './ServiceItems';
import ServiceFilters from './ServiceFilters';

// 3rd party addons
import _ from 'lodash';

// Types
import { Service } from '../../types/hostAndServiceTypes';
import { getJson, handleFetchFail } from 'helpers/axios';
import { buildGroupFilterParameters, buildNagiosUrl } from '../../helpers/nagiosUrls';
import { useCancellablePolling } from '../../hooks/useCancellablePolling';

const ServiceSection = () => {

	//console.log('ServiceSection run');

	// State Management state (this section)
	const [serviceIsFetching, setServiceIsFetching] = useAtom(serviceIsFetchingAtom);
	const setServiceIsFakeDataSet = useSetAtom(serviceIsFakeDataSetAtom);
	const [serviceState, setServiceState] = useAtom(serviceAtom);
	const [serviceHowManyState, setServiceHowManyState] = useAtom(serviceHowManyAtom);
	const totalCount = useRef(0);
	const fetchServiceCountThenFetchDataRef = useRef<(signal?: AbortSignal) => void>(() => undefined);
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

	const fetchServiceCountThenFetchData = (signal?: AbortSignal) => {

		const url = useFakeSampleData
			? './sample-data/servicecount.json'
			: buildNagiosUrl(
				clientSettings,
				'servicecount',
				buildGroupFilterParameters(hostgroupFilter, servicegroupFilter),
			);

		setServiceIsFetching(true);

		getJson(url, {
			timeout: (fetchServiceFrequency - 2) * 1000,
			signal,
		})
		.then((response) => {
			if (signal?.aborted) {
				return;
			}
			let total = 0;
			Object.keys(response.data.data.count).forEach((aaKey) => {
				total += response.data.data.count[aaKey];
			});
			totalCount.current = total;
			fetchServiceData(signal);
		})
		.catch((error) => {
			if (signal?.aborted) {
				return;
			}
			setServiceIsFetching(false);

			handleFetchFail(setServiceState, error, url, true);
		});

	};

	const fetchServiceData = (signal?: AbortSignal) => {

		// if we are offline, let's just skip
		// This is broken on Midori browser on Raspberry Pi and I assume others then. Disabling for now.
		// if (!navigator.onLine) {
		//   console.log('fetchServiceData() browser is offline');
		//   return;
		// }

		const url = useFakeSampleData
			? './sample-data/servicelist.json'
			: buildNagiosUrl(clientSettings, 'servicelist', {
				...(clientSettings.dataSource !== 'livestatus' && clientSettings.hideServiceOk
					? { servicestatus: 'warning critical unknown pending' }
					: {}),
				...buildGroupFilterParameters(hostgroupFilter, servicegroupFilter),
			});
		//console.log('Requesting Service Data: ' + url);

		setServiceIsFetching(true);

		getJson(
			url,
			{
				timeout: (fetchServiceFrequency - 2) * 1000,
				signal,
			}
		)
		.then((response) => {
			if (signal?.aborted) {
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
			} else {
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

				setServiceHowManyState(countServiceStates(my_list, totalCount.current));
			}
		})
		.catch((error) => {
			if (signal?.aborted) {
				return;
			}
			setServiceIsFetching(false);

			handleFetchFail(setServiceState, error, url, true);
		});
	}

	fetchServiceCountThenFetchDataRef.current = fetchServiceCountThenFetchData;

	useCancellablePolling(fetchServiceCountThenFetchDataRef, {
		fallbackIntervalSeconds: clientSettingsInitial.fetchServiceFrequency,
		intervalSeconds: isDemoMode || useFakeSampleData ? null : fetchServiceFrequency,
		requestKey: JSON.stringify([
			clientSettings.baseUrl,
			clientSettings.dataSource,
			clientSettings.hideServiceOk,
			clientSettings.livestatusPath,
			hostgroupFilter,
			isDemoMode,
			servicegroupFilter,
			useFakeSampleData,
		]),
	});

	const sortedServiceStateArray = sortServiceStateArray(
		Array.isArray(serviceState.stateArray) ? serviceState.stateArray : [],
		serviceSortOrder,
	);
	
	// let howManyServices = 0;
	// const servicelist = serviceState.response;
	// Object.keys(servicelist).forEach(host => {
	// 	howManyServices += Object.keys(servicelist[host]).length;
	// });
	const howManyServices = serviceHowManyState.howManyServices;

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
