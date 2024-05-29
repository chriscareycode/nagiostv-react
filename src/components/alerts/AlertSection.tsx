/**
 * NagiosTV https://nagiostv.com
 * Copyright (C) 2008-2023 Chris Carey https://chriscarey.com
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

import { useCallback, useEffect } from 'react';
// State Management
import { useAtom, useAtomValue } from 'jotai';
import { bigStateAtom, clientSettingsAtom, clientSettingsInitial } from '../../atoms/settingsState';
import { alertIsFetchingAtom, alertAtom, alertHowManyAtom } from '../../atoms/alertAtom';

import { translate } from '../../helpers/language';

import PollingSpinner from '../widgets/PollingSpinner';
import AlertItems from './AlertItems';
import AlertFilters from './AlertFilters';
import HistoryChart from '../widgets/HistoryChart';

import axios from 'axios';
import _ from 'lodash';

import './AlertSection.css';
import { handleFetchFail } from '../../helpers/axios';
import { Alert } from '../../types/hostAndServiceTypes';

let isComponentMounted = false;

const AlertSection = () => {

	//console.log('AlertSection run');

	// State Management state (this section)
	const [alertIsFetching, setAlertIsFetching] = useAtom(alertIsFetchingAtom);
	const [alertState, setAlertState] = useAtom(alertAtom);
	const [alertHowManyState, setAlertHowManyState] = useAtom(alertHowManyAtom);
	// State Management state (main)
	const bigState = useAtomValue(bigStateAtom);
	const clientSettings = useAtomValue(clientSettingsAtom);

	const {
		isDemoMode,
		useFakeSampleData,
	} = bigState;

	const {
		fetchAlertFrequency,
		alertMaxItems,
		alertHoursBack,
		hideHistory24hChart,
		hideHistoryChart,
		hideHistoryTitle,
		hideAlertSoft,
		language,
		locale,
		showEmoji,
		alertDaysBack,
		hostgroupFilter,
		servicegroupFilter,
		miniMapWidth,
	} = clientSettings;

	useEffect(() => {
		let timeoutHandle: NodeJS.Timeout | null = null;
		let intervalHandle: NodeJS.Timeout | null = null;

		timeoutHandle = setTimeout(() => {
			fetchAlertData();
		}, 1000);

		// Start interval
		if (isDemoMode === false && useFakeSampleData === false) {
			// safetly net in case the interval value is bad
			const fetchAlertFrequencySafe = (typeof fetchAlertFrequency === 'number' && fetchAlertFrequency >= 5) ? fetchAlertFrequency : clientSettingsInitial.fetchAlertFrequency;

			intervalHandle = setInterval(() => {
				fetchAlertData();
			}, fetchAlertFrequencySafe * 1000);
		}

		isComponentMounted = true;

		return () => {

			if (timeoutHandle) {
				clearTimeout(timeoutHandle);
			}
			if (intervalHandle) {
				clearInterval(intervalHandle);
			}
			isComponentMounted = false;
		};
	}, [clientSettings.fetchAlertFrequency, hostgroupFilter, servicegroupFilter]);

	const howManyCounter = useCallback((alertlist: Alert[]) => {

		// count how many soft history items
		let howManyAlertSoft = 0;
		if (alertlist) {
			alertlist.forEach(alert => {
				//console.log(alert);
				if (alert.state_type === 2) {
					howManyAlertSoft++;
				}
			});
		}

		setAlertHowManyState({
			howManyAlerts: alertlist.length,
			howManyAlertSoft,
		});

	}, [alertState]);

	const fetchAlertData = () => {
		const starttime = alertDaysBack * 60 * 60 * 24;

		let url = '';
		// let endtime = '%2B0'; // +0
		let endtime = '%2D0'; // -0

		if (useFakeSampleData) {
			url = './sample-data/alertlist.json';
		} else if (clientSettings.dataSource === 'livestatus') {
			url = clientSettings.livestatusPath + `?query=alertlist&starttime=-${starttime}&endtime=${endtime}`;
			if (hostgroupFilter) { url += `&hostgroup=${hostgroupFilter}`; }
			if (servicegroupFilter) { url += `&servicegroup=${servicegroupFilter}`; }
		} else {
			url = `${clientSettings.baseUrl}archivejson.cgi?query=alertlist&starttime=-${starttime}&endtime=${endtime}`;
			if (hostgroupFilter) { url += `&hostgroup=${hostgroupFilter}`; }
			if (servicegroupFilter) { url += `&servicegroup=${servicegroupFilter}`; }
		}

		setAlertIsFetching(true);

		axios.get(
			url,
			{timeout: (fetchAlertFrequency - 2) * 1000}
		)
		.then((response) => {
			// test that return data is json
			if (response.headers && response.headers['content-type']?.indexOf('application/json') === -1) {
				console.log('fetchAlertData() ERROR: got response but result data is not JSON. Base URL setting is probably wrong.');

				// We check this since the axios could take a while to respond and the page may have unmounted
				if (isComponentMounted) {
					// Save settings
					setAlertIsFetching(false);
					setAlertState(curr => ({
						...curr,
						error: true,
						errorCount: curr.errorCount + 1,
						errorMessage: 'ERROR: Result data is not JSON. Base URL setting is probably wrong.'
					}));
				}
				return;
			}

			// Success

			// Make an array from the object, and reverse it (newest at the end of the array so we want them at the beginning)
			const myAlertlist = _.get(response.data.data, 'alertlist', []).reverse() as Alert[];

			// trim
			if (myAlertlist.length > alertMaxItems) {
				myAlertlist.length = alertMaxItems;
			}

			// If we are in demo mode then let's modify the latest timestamps
			if (useFakeSampleData) {
				// Find out how far in the past the newest alert data item is
				const howMuchToScoochBy = new Date().getTime() - myAlertlist[0].timestamp;

				// Loop through every item and scooch it forward just the right amount
				myAlertlist.forEach(a => a.timestamp += howMuchToScoochBy);
			}

			// We check this since the axios could take a while to respond and the page may have unmounted
			if (isComponentMounted) {
				// Save settings
				setAlertIsFetching(false);

				setAlertState(curr => ({
					...curr,
					error: false,
					errorCount: 0,
					errorMessage: '',
					lastUpdate: new Date().getTime(),
					response: response.data.data,
					responseArray: myAlertlist
				}));

				howManyCounter(myAlertlist);
			} else {
				console.log('AlertSection got data but component is not mounted');
			}
		})
		.catch((error) => {
			if (isComponentMounted) {
				setAlertIsFetching(false);

				handleFetchFail(setAlertState, error, url, true);

			} else {
				console.log('AlertSection failed but component is not mounted');
			}
		});
	};

	//const { language, clientSettings } = this.props;

	const alertlist = alertState.responseArray;

	// filter the list of alert items
	// This is also creating a new array so we do not modify the Recoil state directly
	const alertlistFiltered = alertlist.filter(alert => {
		if (hideAlertSoft) {
			if (alert.state_type === 2) {
				return false;
			}
		}
		return true;
	});

	// get the alertlist for the past n hours
	const alertlistHours = alertlistFiltered.filter(a => new Date().getTime() - a.timestamp < alertHoursBack * 3600 * 1000);
	const alertlistHoursCount = alertlistHours.length;
	const alertlistFilteredCount = alertlistFiltered.length;

	return (
		<div className={`AlertSection`}>

			<div className="history-summary">
				{!hideHistoryTitle && <span className="service-summary-title">
					<strong>{alertlistFilteredCount}</strong> alerts{' '}
					{clientSettings.hostgroupFilter && <span>({clientSettings.hostgroupFilter})</span>}
				</span>}

				{/* alert history filters */}
				<AlertFilters
					howManyAlertSoft={alertHowManyState.howManyAlertSoft}
				/>

				{/* loading spinner */}
				<PollingSpinner
					isFetching={alertIsFetching}
					isDemoMode={isDemoMode}
					error={alertState.error}
					errorCount={alertState.errorCount}
					// fetchFrequency={fetchAlertFrequency}
					fetchVariableName={'fetchAlertFrequency'}
				/>

			</div>

			{/* hourly alert chart */}

			{(alertlist.length > 0 && !hideHistory24hChart) && <div className="history-chart-wrap">

				{(!hideHistoryTitle && !hideHistory24hChart) && <div className="history-chart-title margin-top-10">
					<span className="">
						<strong>{alertlistHoursCount}</strong> {hideAlertSoft ? <span>hard</span> : <span>hard and soft</span>} {translate('alerts in the past', language)} <strong>{alertHoursBack}</strong> {translate('hours', language)}
						{/*alertlistCount > alertlist.length && <span className="font-size-0-6"> ({translate('trimming at', language)} {alertMaxItems})</span>*/}
					</span>
				</div>}

				{(alertlist.length > 0 && !hideHistory24hChart) && <HistoryChart
					alertlist={alertlistHours}
					alertlistLastUpdate={alertState.lastUpdate}
					groupBy="hour"
					alertHoursBack={alertHoursBack}
					alertDaysBack={1}
					hideAlertSoft={hideAlertSoft}
					locale={locale}
					triggerReflow={miniMapWidth}
				/>}

			</div>}

			{/* full alert chart */}

			{(alertlist.length > 0 && !hideHistoryChart) && <div className="history-chart-wrap">

				{(!hideHistoryTitle && !hideHistoryChart) && <div className="history-chart-title margin-top-10">
					<span className="">
						<strong>{alertlistFilteredCount}</strong> {hideAlertSoft ? <span>hard</span> : <span>hard and soft</span>} {translate('alerts in the past', language)} <strong>{alertDaysBack}</strong> {translate('days', language)}
						{alertlistFilteredCount > alertlist.length && <span className="font-size-0-6"> ({translate('trimming at', language)} {alertMaxItems})</span>}
					</span>
				</div>}

				{/* history chart */}
				{!hideHistoryChart && <HistoryChart
					alertlist={alertlist}
					alertlistLastUpdate={alertState.lastUpdate}
					groupBy="day"
					alertDaysBack={alertDaysBack}
					hideAlertSoft={hideAlertSoft}
					locale={locale}
					triggerReflow={miniMapWidth}
				/>}

			</div>}

			{/** Show Error Message - If we are not in demo mode and there is a alertlist error (ajax fetching) then show the error message here */}
			{(!isDemoMode && alertState.error && (alertState.errorCount > 2 || alertlist.length === 0)) && <div className="margin-top-10 border-red ServiceItemError"><span role="img" aria-label="error">⚠️</span> {alertState.errorMessage}</div>}

			{/* No alerts */}
			{!alertState.error && alertlist.length === 0 && <div className="all-ok-item margin-top-10" style={{ opacity: 1, maxHeight: 'none' }}>
				<span style={{ margin: '5px 10px' }} className="margin-left-10 display-inline-block color-green">No alerts</span>
			</div>}

			{/* alert items */}

			<AlertItems
				items={alertlist}
				settings={clientSettings}
				isDemoMode={isDemoMode}
			/>

		</div>
	);

};

export default AlertSection;
