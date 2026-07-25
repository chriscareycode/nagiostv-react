import React, { useEffect, useRef } from 'react';

// State Management
import { useAtom, useSetAtom } from 'jotai';
import { bigStateAtom, clientSettingsAtom } from '../atoms/settingsState';
import { skipVersionAtom } from '../atoms/skipVersionAtom';

import axios, { AxiosResponse } from 'axios';
import { ClientSettings, VersionCheck } from 'types/settings';
import { responseHasJsonContentType } from 'helpers/axios';
import {
	isLocalStorageAvailable,
	migrateLegacyCookiesToLocalStorage,
	readClientSettings,
	readLastVersionCheckTime,
	readSkipVersion,
	saveLastVersionCheckTime,
} from '../helpers/persistence';

const SettingsLoad = () => {

	//console.log('SettingsLoad run');

	const [bigState, setBigState] = useAtom(bigStateAtom);
	const [clientSettings, setClientSettings] = useAtom(clientSettingsAtom);
	const setSkipVersion = useSetAtom(skipVersionAtom);

	const {
		isDemoMode,
		//isDoneLoading,
		//isLeftPanelOpen,
		//settingsLoaded,
	} = bigState;

	// const {
	//   fontSizeEm,
	//   hideFilters,
	//   hideHistoryChart,
	// } = clientSettings;

	/* ************************************************************************************ */
	/* settings related functions such as fetching settings from server, and loading client settings
	/* ************************************************************************************ */

	/* ************************************************************************************
	 the approach I'm going to take with settings is to first load the settings from the server.
	 either the settings load, or they fail. in either case I then check for client settings and apply 
	 those over top. so client settings will override server settings. There will be a delete
	 client settings button to help clear any client settings once server side settings become established. */
	/* ************************************************************************************ */

	const loadSettingsFromUrl = () => {

		// First try to get params from window.location.search (for regular URLs)
		let urlParams = new URLSearchParams(window.location.search);
		
		// Also check for params in the hash portion of the URL (for HashRouter)
		// HashRouter URLs look like: /#/?param=value or /#/path?param=value
		const hash = window.location.hash;
		if (hash) {
			const hashQueryIndex = hash.indexOf('?');
			if (hashQueryIndex !== -1) {
				const hashParams = new URLSearchParams(hash.substring(hashQueryIndex));
				// Merge hash params into urlParams (hash params take precedence)
				for (const [key, value] of hashParams) {
					urlParams.set(key, value);
				}
			}
		}
		
		const urlObject: Record<string, unknown> = {};

		for (var item of urlParams) {
			//console.log('key: ' + item[0] + ', ' + 'value: ' + item[1]);

			// special handling for when the value is true or false
			// handle other special cases like this for other data types
			if (item[1] === 'true') {
				urlObject[item[0]] = true;
			} else if (item[1] === 'false') {
				urlObject[item[0]] = false;
			} else {
				urlObject[item[0]] = item[1];
			}
		}

		//console.log('urlObject', urlObject);

		setClientSettings(curr => ({
			...curr,
			...urlObject
		}));

		setBigState(curr => ({
			...curr,
			isDoneLoading: true
		}));
	};

	const getLocalSettings = () => {
		// Do not load the local settings in demo mode
		if (isDemoMode) {
			setBigState(curr => ({
				...curr,
				isDoneLoading: true
			}));

			// Do not load settings from URL when in demo mode
			// We exit here, so when in demo mode (as is the case on the nagiostv.com website)
			// We do not loadSettingsFromUrl()
			return;
		}

		const settingsObject = readClientSettings();
		if (!settingsObject) {
			setBigState(curr => ({
				...curr,
				isDoneLoading: true
			}));
			loadSettingsFromUrl();
			return;
		}

		setClientSettings(curr => ({
			...curr,
			...settingsObject
		}));

		// Now that we have loaded client settings, set the document.title from the title setting
		if (settingsObject.titleString) { document.title = settingsObject.titleString; }

		// Set isLocalSettingsLoaded: true
		setBigState(curr => ({
			...curr,
			isLocalSettingsLoaded: true
		}));

		loadSettingsFromUrl();

	};

	const loadSkipVersionSettings = () => {
		const persistedSkipVersion = readSkipVersion();
		if (persistedSkipVersion) {
			setSkipVersion(persistedSkipVersion);
		}
	};

	const getRemoteSettings = () => {
		const url = 'client-settings.json?v=' + new Date().getTime();

		axios.get(
			url, { timeout: 10 * 1000 }
		).then((response: AxiosResponse<ClientSettings>) => {

			// test that return data is json
			if (!responseHasJsonContentType(response.headers)) {
				console.log('getRemoteSettings() parse ERROR: got response but result data is not JSON. Skipping server settings.');
				getLocalSettings();
				return;
			}

			// Got good server settings
			console.log('Found server default settings client-settings.json - Loading default settings:', response.data);

			// save settings to client settings state
			setClientSettings(curr => ({
				...curr,
				...response.data,
			}));

			// update a boolean so we know settings were loaded
			setBigState(curr => ({
				...curr,
				isRemoteSettingsLoaded: true
			}));

			// Now that we have loaded server settings, set the document.title from the title setting
			if (response.data.titleString) { document.title = response.data.titleString; }

			// If serverSettingsTakePrecedence is true, skip loading local settings
			// This means server settings will not be overwritten by local settings
			if (response.data.serverSettingsTakePrecedence) {
				console.log('serverSettingsTakePrecedence is true - skipping local settings');
				setBigState(curr => ({
					...curr,
					isDoneLoading: true
				}));
				loadSettingsFromUrl();
				return;
			}

			// Now that we have loaded remote settings, load the cookie and overwrite settings with cookie
			// getLocalSettings() is then going to call loadSettingsFromUrl()
			getLocalSettings();

		}).catch((error) => {
			console.log('getRemoteSettings() ajax ERROR:', error);
			console.log('Skipping server settings.');
			getLocalSettings();
		});
	};

	const lastVersionCheckTimeRef = useRef(0);

	// Version check
	const versionCheck = () => {

		const lastVersionCheckTime = lastVersionCheckTimeRef.current;
		const nowTime = new Date().getTime();
		const twentyThreeHoursInSeconds = (86400 - 3600) * 1000;

		// PREVENT extra last version check time
		// if the last version check was recent then do not check again
		// this prevents version checks if you refresh the UI over and over
		// as is common on TV rotation
		const lastVersionCheckTimeInt = readLastVersionCheckTime();

		if (lastVersionCheckTimeInt !== 0) {
			const diff = nowTime - lastVersionCheckTimeInt;
			if (diff < twentyThreeHoursInSeconds) {
				console.log('Not performing version check since it was done ' + (diff / 1000).toFixed(0) + ' seconds ago (Local settings check)');
				return;
			}
		}

		// PREVENT extra last version check time with local variable
		// If for some reason the localStorage check doesn't work
		if (lastVersionCheckTime !== 0) {
			const diff = nowTime - lastVersionCheckTime;
			if (diff < twentyThreeHoursInSeconds) {
				console.log('Not performing version check since it was done ' + (diff / 1000).toFixed(0) + ' seconds ago (local var check)');
				return;
			}
		}

		console.log('Running version check...');

		// Set the last version check time in local variable
		// I'm setting this one here not in the callback to prevent the rapid fire
		lastVersionCheckTimeRef.current = nowTime;

		saveLastVersionCheckTime(nowTime);

		const url = 'https://nagiostv.com/version/nagiostv-react/?version=' + bigState.currentVersionString;

		axios.get(
			url,
			{timeout: 5 * 1000}
		).then((response: AxiosResponse<VersionCheck>) => {
			const myJson = response.data;
			console.log(`Latest NagiosTV release is ${myJson.version_string} (r${myJson.version}). You are running ${bigState.currentVersionString} (r${bigState.currentVersion})`);

			setBigState(curr => ({
				...curr,
				latestVersion: myJson.version,
				latestVersionString: myJson.version_string,
				lastVersionCheckTime: nowTime,
			}));

		})
		.catch(error => {
			console.log('There was some error with the version check', error);
		});
	};



	useEffect(() => {
		//console.log('SettingsLoad useEffect()');

		migrateLegacyCookiesToLocalStorage();

		getRemoteSettings();

		loadSkipVersionSettings();

		// If localStorage is set then run version check after 30s.
		// If no localStorage is set then run version check after 30m.
		// localStorage helps us prevent version check too often if NagiosTV is on a rotation
		// where the page is loading over and over every few minutes.

		let versionCheckTimeout = 30 * 1000; // 30s
		if (!isLocalStorageAvailable()) {
			console.log('localStorage not enabled so delaying first version check by 30m');
			versionCheckTimeout = 1800 * 1000; // 30m
		}

		let intervalHandleVersionCheck: ReturnType<typeof setInterval> | null = null;
		const timeoutHandle = setTimeout(() => {
			const versionCheckDays = clientSettings.versionCheckDays;
			// if someone turns off the version check, it should never check
			if (versionCheckDays && versionCheckDays > 0) {
				// version check - run once on app boot
				versionCheck();
				// version check - run every n days
				const intervalTime = versionCheckDays * 24 * 60 * 60 * 1000;
				// console.log('Checking on intervalTime', intervalTime);
				// safety check that interval > 1hr
				if (intervalTime !== 0 && intervalTime > (60 * 60 * 1000)) {
					intervalHandleVersionCheck = setInterval(() => {
						// inside the interval we check again if the user disabled the check
						if (clientSettings.versionCheckDays > 0) {
							versionCheck();
						}
					}, intervalTime);
				} else {
					console.log('intervalTime not yet an hour, not re-running check.', intervalTime);
				}
			} else {
				console.log('Invalid versionCheckDays. Not starting version check interval.', versionCheckDays);
			}
		}, versionCheckTimeout);

		return () => {
			//console.log('SettingsLoad useEffect() teardown');
			clearTimeout(timeoutHandle);
			if (intervalHandleVersionCheck) {
				clearInterval(intervalHandleVersionCheck);
			}
		};
	}, []);

	return (<></>);
};

function arePropsEqual() {
	return true; // props equal = no update
}

export default React.memo(SettingsLoad, arePropsEqual);
