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

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from "motion/react";
import * as motion from "motion/react-client";
// State Management
import { useAtom, useAtomValue } from 'jotai';
import { bigStateAtom, clientSettingsAtom, clientSettingsInitial } from '../../atoms/settingsState';
import { alertIsFetchingAtom, alertAtom, alertHowManyAtom } from '../../atoms/alertAtom';
import { useQueryParams } from '../../hooks/useQueryParams';

import { translate } from '../../helpers/language';

import PollingSpinner from '../widgets/PollingSpinner';
import MonitoringError from '../monitoring/MonitoringError';
import AlertItems from './AlertItems';
import AlertFilters from './AlertFilters';
import DeferredHistoryChart from '../widgets/DeferredHistoryChart';

import _ from 'lodash';

import './AlertSection.css';
import { getJson, handleFetchFail } from '../../helpers/axios';
import { Alert } from '../../types/hostAndServiceTypes';
import { shiftAlertsToNow } from './alert-functions';
import { buildGroupFilterParameters, buildNagiosUrl } from '../../helpers/nagiosUrls';
import { useCancellablePolling } from '../../hooks/useCancellablePolling';

const AlertSection = () => {

	//console.log('AlertSection run');

	const queryParams = useQueryParams();
	const alertSearchText = queryParams.get('alertSearch') || '';
	const [localSearchText, setLocalSearchText] = useState(alertSearchText);

	// Debounce updating the URL query param so it doesn't update on every keystroke
	const debouncedSetSearchText = useMemo(
		() => _.debounce((value: string) => {
			if (value) {
				queryParams.set({ alertSearch: value });
			} else {
				queryParams.remove('alertSearch');
			}
		}, 300),
		[queryParams],
	);

	// Cleanup debounce on unmount
	useEffect(() => {
		return () => {
			debouncedSetSearchText.cancel();
		};
	}, [debouncedSetSearchText]);

	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setLocalSearchText(value);
		debouncedSetSearchText(value);
	};

	const handleSearchClear = () => {
		setLocalSearchText('');
		debouncedSetSearchText.cancel();
		queryParams.remove('alertSearch');
	};

	// State Management state (this section)
	const [alertIsFetching, setAlertIsFetching] = useAtom(alertIsFetchingAtom);
	const [alertState, setAlertState] = useAtom(alertAtom);
	const [alertHowManyState, setAlertHowManyState] = useAtom(alertHowManyAtom);
	const fetchAlertDataRef = useRef<(signal?: AbortSignal) => void>(() => undefined);
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

	}, [setAlertHowManyState]);

	const fetchAlertData = (signal?: AbortSignal) => {
		const starttime = alertDaysBack * 60 * 60 * 24;

		const url = useFakeSampleData
			? './sample-data/alertlist.json'
			: buildNagiosUrl(clientSettings, 'alertlist', {
				starttime: -starttime,
				endtime: '-0',
				...buildGroupFilterParameters(hostgroupFilter, servicegroupFilter),
			});

		setAlertIsFetching(true);

		getJson(
			url,
			{
				timeout: (fetchAlertFrequency - 2) * 1000,
				signal,
			}
		)
		.then((response) => {
			if (signal?.aborted) {
				return;
			}
			// Success

			// Make an array from the object, and reverse it (newest at the end of the array so we want them at the beginning)
			let myAlertlist = _.get(response.data.data, 'alertlist', []).reverse() as Alert[];

			// trim
			if (myAlertlist.length > alertMaxItems) {
				myAlertlist.length = alertMaxItems;
			}

			// If we are in demo mode then let's modify the latest timestamps
			if (useFakeSampleData) {
				myAlertlist = shiftAlertsToNow(myAlertlist);
			}

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
		})
		.catch((error) => {
			if (signal?.aborted) {
				return;
			}
			setAlertIsFetching(false);
			handleFetchFail(setAlertState, error, url, true);
		});
	};

	fetchAlertDataRef.current = fetchAlertData;

	useCancellablePolling(fetchAlertDataRef, {
		fallbackIntervalSeconds: clientSettingsInitial.fetchAlertFrequency,
		intervalSeconds: isDemoMode || useFakeSampleData ? null : fetchAlertFrequency,
		requestKey: JSON.stringify([
			alertDaysBack,
			alertMaxItems,
			clientSettings.baseUrl,
			clientSettings.dataSource,
			clientSettings.livestatusPath,
			hostgroupFilter,
			isDemoMode,
			servicegroupFilter,
			useFakeSampleData,
		]),
	});

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
		// search filter
		if (alertSearchText) {
			const searchLower = alertSearchText.toLowerCase();
			const matchesSearch =
				(alert.name && alert.name.toLowerCase().includes(searchLower)) ||
				(alert.host_name && alert.host_name.toLowerCase().includes(searchLower)) ||
				(alert.description && alert.description.toLowerCase().includes(searchLower)) ||
				(alert.plugin_output && alert.plugin_output.toLowerCase().includes(searchLower));
			if (!matchesSearch) {
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
					{clientSettings.hostgroupFilter && clientSettings.servicegroupFilter && <span> </span>}
					{clientSettings.servicegroupFilter && <span>({clientSettings.servicegroupFilter})</span>}
				</span>}

				{/* alert history filters */}
				<AlertFilters
					howManyAlertSoft={alertHowManyState.howManyAlertSoft}
				/>

				{/* alert search */}
				<div style={{ display: 'inline-block', marginLeft: '10px' }}>
					<input
						type="text"
						className="alert-search-input"
						placeholder="Search alerts..."
						value={localSearchText}
						onChange={handleSearchChange}
					/>
					{localSearchText && (
						<button
							className="alert-search-clear"
							onClick={handleSearchClear}
							title="Clear search"
						>
							✕
						</button>
					)}
				</div>

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

			<AnimatePresence initial={false} key="history-chart-24h">
				{(alertlist.length > 0 && !hideHistory24hChart) && <motion.div
					className="history-chart-wrap"
					initial={{ opacity: 0, height: 0 }}
					animate={{ opacity: 1, height: 'auto' }}
					exit={{ opacity: 0, height: 0 }}
				>

					{(!hideHistoryTitle && !hideHistory24hChart) && <div className="history-chart-title margin-top-10">
						<span className="">
							<strong>{alertlistHoursCount}</strong> {hideAlertSoft ? <span>hard</span> : <span>hard and soft</span>} {translate('alerts in the past', language)} <strong>{alertHoursBack}</strong> {translate('hours', language)}
							{/*alertlistCount > alertlist.length && <span className="font-size-0-6"> ({translate('trimming at', language)} {alertMaxItems})</span>*/}
						</span>
					</div>}

					<DeferredHistoryChart
						alertlist={alertlistHours}
						alertlistLastUpdate={alertState.lastUpdate}
						groupBy="hour"
						alertHoursBack={alertHoursBack}
						alertDaysBack={1}
						hideAlertSoft={hideAlertSoft}
						locale={locale}
						triggerReflow={miniMapWidth}
					/>

				</motion.div>}
			</AnimatePresence>

			{/* full alert chart */}

			<AnimatePresence initial={false} key="history-chart-full">
				{(alertlist.length > 0 && !hideHistoryChart) && <motion.div
					className="history-chart-wrap"
					initial={{ opacity: 0, height: 0 }}
					animate={{ opacity: 1, height: 'auto' }}
					exit={{ opacity: 0, height: 0 }}
				>

					{(!hideHistoryTitle && !hideHistoryChart) && <div className="history-chart-title margin-top-10">
						<span className="">
							<strong>{alertlistFilteredCount}</strong> {hideAlertSoft ? <span>hard</span> : <span>hard and soft</span>} {translate('alerts in the past', language)} <strong>{alertDaysBack}</strong> {translate('days', language)}
							{alertlistFilteredCount > alertlist.length && <span className="font-size-0-6"> ({translate('trimming at', language)} {alertMaxItems})</span>}
						</span>
					</div>}

					{/* history chart */}
					<DeferredHistoryChart
						alertlist={alertlist}
						alertlistLastUpdate={alertState.lastUpdate}
						groupBy="day"
						alertDaysBack={alertDaysBack}
						hideAlertSoft={hideAlertSoft}
						locale={locale}
						triggerReflow={miniMapWidth}
					/>

				</motion.div>}
			</AnimatePresence>

			<MonitoringError
				error={alertState.error}
				errorCount={alertState.errorCount}
				errorMessage={alertState.errorMessage}
				isDemoMode={isDemoMode}
				itemCount={alertlist.length}
			/>

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
