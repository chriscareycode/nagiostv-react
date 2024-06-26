import React, { useEffect, useRef } from 'react';

// State Management
import { useAtom } from 'jotai';
import { bigStateAtom, clientSettingsAtom, clientSettingsInitial } from '../atoms/settingsState';
import { skipVersionAtom } from '../atoms/skipVersionAtom';

import axios, { AxiosResponse } from 'axios';
import Cookie from 'js-cookie';
import { ClientSettings, VersionCheck } from 'types/settings';

const SettingsLoad = () => {

	//console.log('SettingsLoad run');

	const [bigState, setBigState] = useAtom(bigStateAtom);
	const [clientSettings, setClientSettings] = useAtom(clientSettingsAtom);
	const [skipVersionCookie, setSkipVersionCookie] = useAtom(skipVersionAtom);

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
	/* settings related functions such as fetching settings from server, and loading cookie
	/* ************************************************************************************ */

	/* ************************************************************************************
	 the approach I'm going to take with settings is to first load the settings from the server.
	 either the settings load, or they fail. in either case I then check for cookie and apply 
	 those over top. so cookie settings will override server settings. There will be a delete
	 cookie button to help clear any local settings once server side settings become established. */
	/* ************************************************************************************ */

	const loadSettingsFromUrl = () => {

		const urlParams = new URLSearchParams(window.location.search);
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

	const getCookie = () => {
		// Do not load the cookie in demo mode
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

		const cookie = Cookie.get('settings');
		//console.log('Loaded Cookie string', cookie);

		if (!cookie) {
			setBigState(curr => ({
				...curr,
				isDoneLoading: true
			}));
			loadSettingsFromUrl();
			return;
		}

		let cookieObject: ClientSettings | null = null;
		try {
			cookieObject = JSON.parse(cookie);
			//console.log('Parsed cookie', cookieObject, typeof cookieObject);
		} catch (e) {
			//console.log('No cookie');
		}

		// If cookie is invalid, not an object, then console error and clear it out
		if (typeof cookieObject !== 'object') {
			console.log('Cookie is not an object. Skipping it');
			setBigState(curr => ({
				...curr,
				isDoneLoading: true
			}));
			return;
		}

		if (cookieObject) {

			console.log('Found cookie. Loading settings:', cookieObject);

			setClientSettings(curr => ({
				...curr,
				...cookieObject
			}));

			// Now that we have loaded cookie, set the document.title from the title setting
			if (cookieObject.titleString) { document.title = cookieObject.titleString; }

			// Set isCookieLoaded: true
			setBigState(curr => ({
				...curr,
				isCookieLoaded: true
			}));

			loadSettingsFromUrl();
		}

	};

	const loadSkipVersionCookie = () => {
		const cookieString = Cookie.get('skipVersion');
		if (cookieString) {
			try {
				const skipVersionObj = JSON.parse(cookieString);
				if (skipVersionObj) {
					//console.log('Loaded skipVersion cookie', skipVersionObj);
					setSkipVersionCookie({
						version: skipVersionObj.version,
						version_string: skipVersionObj.version_string,
					});
				}
			} catch (e) {
				console.log('Could not parse the skipVersion cookie');
			}
		}
	};

	const getRemoteSettings = () => {
		const url = 'client-settings.json?v=' + new Date().getTime();

		axios.get(
			url, { timeout: 10 * 1000 }
		).then((response: AxiosResponse<ClientSettings>) => {

			console.log('SettingsLoad DEBUG response', response);

			console.log('SettingsLoad DEBUG response', response);
			// test that return data is json
			if (response.headers && response.headers['content-type']?.indexOf('application/json') === -1) {
				console.log('getRemoteSettings() parse ERROR: got response but result data is not JSON. Skipping server settings.');
				getCookie();
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

			// Now that we have loaded remote settings, load the cookie and overwrite settings with cookie
			// getCookie() is then going to call loadSettingsFromUrl()
			getCookie();

		}).catch((error) => {
			console.log('getRemoteSettings() ajax ERROR:', error);
			console.log('Skipping server settings.');
			getCookie();
		});
	};

	const lastVersionCheckTimeRef = useRef(0);

	// Version check
	const versionCheck = () => {

		const lastVersionCheckTime = lastVersionCheckTimeRef.current;
		const nowTime = new Date().getTime();
		const twentyThreeHoursInSeconds = (86400 - 3600) * 1000;

		// PREVENT extra last version check time with cookie
		// if the last version check was recent then do not check again
		// this prevents version checks if you refresh the UI over and over
		// as is common on TV rotation
		const lastVersionCheckTimeCookie = Cookie.get('lastVersionCheckTime');

		// If the cookie is set then we need to safely convert the string back into an integer
		let lastVersionCheckTimeCookieInt = 0;
		if (lastVersionCheckTimeCookie) {
			try {
				lastVersionCheckTimeCookieInt = parseInt(lastVersionCheckTimeCookie, 10);
			} catch (e) {
				console.log('Could not parse the lastVersionCheckTime cookie');
			}
		}

		if (lastVersionCheckTimeCookieInt !== 0) {
			const diff = nowTime - lastVersionCheckTimeCookieInt;
			if (diff < twentyThreeHoursInSeconds) {
				console.log('Not performing version check since it was done ' + (diff / 1000).toFixed(0) + ' seconds ago (Cookie check)');
				return;
			}
		}

		// PREVENT extra last version check time with local variable
		// If for some reason the cookie check doesn't work
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
		// Set the last version check in the cookie (for page refresh)
		Cookie.set('lastVersionCheckTime', nowTime.toString());

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

		getRemoteSettings();

		loadSkipVersionCookie();

		// If a Cookie is set then run version check after 30s.
		// If no Cookie is set then run version check after 30m.
		// Cookie helps us prevent version check too often if NagiosTV is on a rotation
		// where the page is loading over and over every few minutes.

		let versionCheckTimeout = 30 * 1000; // 30s
		if (!navigator.cookieEnabled) {
			console.log('Cookie not enabled so delaying first version check by 30m');
			versionCheckTimeout = 1800 * 1000; // 30m
		}

		let intervalHandleVersionCheck: NodeJS.Timeout | null = null;
		const cookieTimeoutHandle = setTimeout(() => {
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
			clearTimeout(cookieTimeoutHandle);
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