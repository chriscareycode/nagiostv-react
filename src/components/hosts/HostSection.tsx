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
import { hostIsFetchingAtom, hostAtom, hostHowManyAtom, hostIsFakeDataSetAtom } from '../../atoms/hostAtom';

import PollingSpinner from '../widgets/PollingSpinner';
import { translate } from '../../helpers/language';
import {
	cleanDemoDataHostlist,
	convertHostObjectToArray,
	countHostStates,
} from '../../helpers/nagiostv';

import HostItems from './HostItems';
import HostFilters from './HostFilters';

// 3rd party addons
import { DateTime } from 'luxon';
import _ from 'lodash';
import { Host } from 'types/hostAndServiceTypes';
import { getJson, handleFetchFail } from 'helpers/axios';
import { buildGroupFilterParameters, buildNagiosUrl } from '../../helpers/nagiosUrls';
import { useCancellablePolling } from '../../hooks/useCancellablePolling';

//import './HostSection.css';

const HostSection = () => {

	//console.log('HostSection run', new Date());

	// State Management state (this section)
	const [hostIsFetching, setHostIsFetching] = useAtom(hostIsFetchingAtom);
	const setHostIsFakeDataSet = useSetAtom(hostIsFakeDataSetAtom);
	const [hostState, setHostState] = useAtom(hostAtom);
	const [hostHowManyState, setHostHowManyState] = useAtom(hostHowManyAtom);
	const totalCount = useRef(0);
	const fetchHostCountThenFetchDataRef = useRef<(signal?: AbortSignal) => void>(() => undefined);
	// State Management state (main)
	const [bigState, setBigState] = useAtom(bigStateAtom);
	const clientSettings = useAtomValue(clientSettingsAtom);

	// Chop the bigState into vars
	const {
		isDemoMode,
		//isDebugMode,
		useFakeSampleData,
		//isDoneLoading,
		//hostgroup,
		//settingsLoaded,
		//hideFilters,
	} = bigState;

	// Chop the clientSettings into vars
	const {
		fetchHostFrequency,
		hostSortOrder,
		hostgroupFilter,
		servicegroupFilter,
		//hideHistory,
		//hideHostDown,
		//hideHostSection,
		language,
	} = clientSettings;

	const fetchHostCountThenFetchData = (signal?: AbortSignal) => {

		const url = useFakeSampleData
			? './sample-data/hostcount.json'
			: buildNagiosUrl(
				clientSettings,
				'hostcount',
				buildGroupFilterParameters(hostgroupFilter, servicegroupFilter),
			);

		setHostIsFetching(true);

		getJson(url, {
			timeout: (fetchHostFrequency - 2) * 1000,
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
			fetchHostData(signal);
		})
		.catch((error) => {
			if (signal?.aborted) {
				return;
			}
			console.log('fetchHostCountThenFetchData() ajax error');
			setHostIsFetching(false);

			handleFetchFail(setHostState, error, url, true);
		});

	};

	const fetchHostData = (signal?: AbortSignal) => {

		// if we are offline, let's just skip
		// This is broken on Midori browser on Raspberry Pi and I assume others then. Disabling for now.
		// if (!navigator.onLine) {
		//   console.log('fetchHostData() browser is offline');
		//   return;
		// }

		const url = useFakeSampleData
			? './sample-data/hostlist.json'
			: buildNagiosUrl(clientSettings, 'hostlist', {
				...(clientSettings.dataSource !== 'livestatus' && clientSettings.hideHostUp
					? { hoststatus: 'down unreachable pending' }
					: {}),
				...buildGroupFilterParameters(hostgroupFilter, servicegroupFilter),
			});

		setHostIsFetching(true);

		getJson(
			url,
			{
				timeout: (fetchHostFrequency - 2) * 1000,
				signal,
			}
		)
		.then((response) => {
			if (signal?.aborted) {
				return;
			}
			// Success

			// Make an array from the object
			let my_list: Record<string, Host> = _.get(response.data.data, 'hostlist', {});
			// console.log('HostSection response.data.data', response.data.data);

			// If we are in demo mode then clean the fake data
			// The fake data has a bunch of dates of hosts and services being down.
			// This routine will set all the fake data to UP/OK
			if (isDemoMode) {
				my_list = cleanDemoDataHostlist(my_list);
			}

			// convert the host object into an array
			const myArray = convertHostObjectToArray(my_list);
			// console.log('HostSection myArray:', myArray);

			// check for old data (nagios down?)
			const now = DateTime.now();
			const lastUpdate = DateTime.fromMillis(response.data.result.last_data_update);
			const hours = now.diff(lastUpdate, 'hours').hours.toFixed(1);

			if (isDemoMode === false && useFakeSampleData === false && parseFloat(hours) >= 1) {
				// Data is stale
				setHostIsFetching(false);

				setHostState(curr => ({
					...curr,
					error: true,
					errorCount: curr.errorCount + 1,
					errorMessage: `Data is stale ${hours} hours. Is Nagios running?`,
					lastUpdate: new Date().getTime(),
					response: my_list,
					stateArray: myArray
				}));
			} else {
				// Data is not stale, good
				setHostIsFetching(false);

				setHostState(curr => ({
					...curr,
					error: false,
					errorCount: 0,
					errorMessage: '',
					lastUpdate: new Date().getTime(),
					response: my_list,
					stateArray: myArray
				}));

				setHostIsFakeDataSet(useFakeSampleData);

				setHostHowManyState(countHostStates(my_list, totalCount.current));
			}
		})
		.catch((error) => {
			if (signal?.aborted) {
				return;
			}
			setHostIsFetching(false);

			handleFetchFail(setHostState, error, url, true);
		});
	};

	fetchHostCountThenFetchDataRef.current = fetchHostCountThenFetchData;

	useCancellablePolling(fetchHostCountThenFetchDataRef, {
		fallbackIntervalSeconds: clientSettingsInitial.fetchHostFrequency,
		intervalSeconds: isDemoMode || useFakeSampleData ? null : fetchHostFrequency,
		requestKey: JSON.stringify([
			clientSettings.baseUrl,
			clientSettings.dataSource,
			clientSettings.hideHostUp,
			clientSettings.livestatusPath,
			hostgroupFilter,
			isDemoMode,
			servicegroupFilter,
			useFakeSampleData,
		]),
	});

	
	// Mutating state on hostState.stateArray is not allowed (the sort below)
	// so we need to copy this to something
	let sortedHostStateArray: Host[] = [];
	if (Array.isArray(hostState.stateArray)) {
		sortedHostStateArray = [...hostState.stateArray];
	}
	
	// const hostlist = hostState.response;
	const howManyHosts = hostHowManyState.howManyHosts;

	// Sort the data based on the hostSortOrder value
	if (hostSortOrder === 'az' || hostSortOrder === 'za') {
		// Alphabetical sorting by host name
		const sortMultiplier = hostSortOrder === 'az' ? 1 : -1;
		sortedHostStateArray.sort((a, b) => {
			return a.name.localeCompare(b.name) * sortMultiplier;
		});
	} else if (hostSortOrder === 'nextcheck') {
		// Earliest next check first; push invalid/unscheduled checks to the end.
		sortedHostStateArray.sort((a, b) => {
			const aNextCheck = a.next_check > 0 ? a.next_check : Number.MAX_SAFE_INTEGER;
			const bNextCheck = b.next_check > 0 ? b.next_check : Number.MAX_SAFE_INTEGER;
			if (aNextCheck < bNextCheck) { return -1; }
			if (aNextCheck > bNextCheck) { return 1; }
			return a.name.localeCompare(b.name);
		});
	} else {
		// Time-based sorting (newest/oldest)
		let sort = 1;
		if (hostSortOrder === 'oldest') { sort = -1; }
		//console.log('sortedHostStateArray before', sortedHostStateArray);
		sortedHostStateArray.sort((a, b) => {
			if (a.last_time_up < b.last_time_up) { return 1 * sort; }
			if (a.last_time_up > b.last_time_up) { return -1 * sort; }
			return 0;
		});
	}
	//console.log('sortedHostStateArray after', sortedHostStateArray);

	return (
		<div className="HostSection">

			<div className="service-summary">

				<span className="service-summary-title">
					<strong>{howManyHosts}</strong> {howManyHosts === 1 ? translate('host', language) : translate('hosts', language)}{' '}
					{hostgroupFilter && <span>({hostgroupFilter})</span>}
				</span>

				{/* host filters */}
				<HostFilters />

				{/* loading spinner */}
				<PollingSpinner
					isFetching={hostIsFetching}
					isDemoMode={isDemoMode}
					error={hostState.error}
					errorCount={hostState.errorCount}
					//fetchFrequency={fetchHostFrequency}
					fetchVariableName={'fetchHostFrequency'}
				/>

			</div>

			{/** Show Error Message - If we are not in demo mode and there is a hostlist error (ajax fetching) then show the error message here */}
			{(!isDemoMode && hostState.error && (hostState.errorCount > 2 || howManyHosts === 0)) && <div className="margin-top-10 border-red ServiceItemError"><span role="img" aria-label="error">⚠️</span> {hostState.errorMessage}</div>}

			{/* hostitems list */}
			<HostItems
				hostStateArray={sortedHostStateArray}
				settings={clientSettings}
				isDemoMode={isDemoMode}
			/>

		</div>
	);

};

export default HostSection;
