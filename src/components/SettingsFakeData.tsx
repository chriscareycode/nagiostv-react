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
import { bigStateAtom, clientSettingsAtom } from "atoms/settingsState";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useEffect } from "react";

const startAfterSeconds = 4; // This is how long to wait before starting the first/initial fake data
const fakeOutIntervalSeconds = 40; // This needs to be longer than the polling interval for hosts and services.

const SettingsFakeData = () => {
	// State Management state (main)
	const [bigState, setBigState] = useAtom(bigStateAtom);
	// const clientSettings = useAtomValue(clientSettingsAtom);
	const setHostState = useSetAtom(hostAtom);
	const setServiceState = useSetAtom(serviceAtom);

	useEffect(() => {

		// If we are in demo mode, loop over all hosts and services and set next_check to a random time in the future
		const fakeOutTheData = () => {
			setHostState(prev => {
				// Loop over all hosts
				const newArr = [...prev.problemsArray];
				newArr.forEach((host) => {
					if (host.next_check < Date.now()) {
						host.next_check = Date.now() + Math.floor(Math.random() * 500000);
					}
				});
				return { ...prev, problemsArray: newArr };
			});
			setServiceState(prev => {
				// Loop over all services
				const newArr = [...prev.problemsArray];
				newArr.forEach((service) => {
					if (service.next_check < Date.now()) {
						service.next_check = Date.now() + Math.floor(Math.random() * 500000);
					}
				});
				return { ...prev, problemsArray: newArr };
			});
		}

		let interval: NodeJS.Timeout;
		if (bigState.useFakeSampleData) {
			// Run one after 5s
			setTimeout(() => {
				console.log('Running fakeOutTheData to fake out the fake data...');
				fakeOutTheData();
			}, startAfterSeconds * 1000);

			// Start an interval of 1 minute to run the fakeOutTheData function
			console.log('Starting an interval to call fakeOutTheData...');
			interval = setInterval(() => {
				fakeOutTheData();
			}, fakeOutIntervalSeconds * 1000);
		}

		// Cleanup
		return () => {
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
