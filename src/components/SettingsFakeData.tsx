/**
 * SettingsFakeData component
 * In this component, we will loop over all the fake data and massage the data for better UI dev experience
 * 
 * Particularly I wanted to fix the issue when in fake data mode, all items say "Checking now..." as
 * they have a next_check date in the past. This is because our fake data set is a snapshot of a moment in the past.
 * Let's loop over all these items, and if the next_check
 * is in the past, set it to a random time in the future.
 */

import { hostAtom } from "atoms/hostAtom";
import { serviceAtom } from "atoms/serviceAtom"
import { bigStateAtom } from "atoms/settingsState";
import { useAtomValue, useSetAtom } from "jotai";
import { useEffect } from "react";

const startAfterSeconds = 4; // This is how long to wait before starting the first/initial fake data
const fakeOutIntervalSeconds = 40; // This needs to be longer than the polling interval for hosts and services.

const SettingsFakeData = () => {
	// State Management state (main)
	const bigState = useAtomValue(bigStateAtom);
	const setHostState = useSetAtom(hostAtom);
	const setServiceState = useSetAtom(serviceAtom);

	useEffect(() => {

		// If we are in demo mode, loop over all hosts and services and set next_check to a random time in the future
		const fakeOutTheData = () => {
			setHostState(prev => {
				const now = Date.now();
				const newArr = prev.stateArray.map((host) => {
					return host.next_check < now
						? { ...host, next_check: now + Math.floor(Math.random() * 500000) }
						: host;
				});
				return { ...prev, stateArray: newArr };
			});
			setServiceState(prev => {
				const now = Date.now();
				const newArr = prev.stateArray.map((service) => {
					return service.next_check < now
						? { ...service, next_check: now + Math.floor(Math.random() * 500000) }
						: service;
				});
				return { ...prev, stateArray: newArr };
			});
		}

		let interval: ReturnType<typeof setInterval> | undefined;
		let initialTimeout: ReturnType<typeof setTimeout> | undefined;
		if (bigState.useFakeSampleData) {
			// Run one after 5s
			initialTimeout = setTimeout(() => {
				fakeOutTheData();
			}, startAfterSeconds * 1000);

			// Start an interval of 1 minute to run the fakeOutTheData function
			interval = setInterval(() => {
				fakeOutTheData();
			}, fakeOutIntervalSeconds * 1000);
		}

		// Cleanup
		return () => {
			if (initialTimeout) {
				clearTimeout(initialTimeout);
			}
			if (interval) {
				clearInterval(interval);
			}
		}
	}, [
		bigState.useFakeSampleData,
		setHostState,
		setServiceState,
	]);

	return (<></>);
};

export default SettingsFakeData;
