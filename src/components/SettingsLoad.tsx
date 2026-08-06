import React, { useCallback, useEffect } from 'react';

// State Management
import { useAtom, useSetAtom } from 'jotai';
import { bigStateAtom, clientSettingsAtom } from '../atoms/settingsState';
import { skipVersionAtom } from '../atoms/skipVersionAtom';

import axios, { AxiosResponse } from 'axios';
import { ClientSettings } from 'types/settings';
import { responseHasJsonContentType } from 'helpers/axios';
import {
	migrateLegacyCookiesToLocalStorage,
	readClientSettings,
	readSkipVersion,
	sanitizePersistedClientSettings,
} from '../helpers/persistence';
import { useVersionCheck } from '../hooks/useVersionCheck';
import {
	getClientSettingsUrlParams,
	parseClientSettingsUrlOverrides,
} from '../helpers/settingsUrl';

const SettingsLoad = () => {

	//console.log('SettingsLoad run');

	const [bigState, setBigState] = useAtom(bigStateAtom);
	const setClientSettings = useSetAtom(clientSettingsAtom);
	const setSkipVersion = useSetAtom(skipVersionAtom);
	useVersionCheck();

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

	const loadSettingsFromUrl = useCallback(() => {
		const urlObject = parseClientSettingsUrlOverrides(
			getClientSettingsUrlParams(window.location),
		);

		setClientSettings(curr => ({
			...curr,
			...urlObject
		}));

		setBigState(curr => ({
			...curr,
			isDoneLoading: true
		}));
	}, [setBigState, setClientSettings]);

	const getLocalSettings = useCallback(() => {
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

	}, [isDemoMode, loadSettingsFromUrl, setBigState, setClientSettings]);

	const loadSkipVersionSettings = useCallback(() => {
		const persistedSkipVersion = readSkipVersion();
		if (persistedSkipVersion) {
			setSkipVersion(persistedSkipVersion);
		}
	}, [setSkipVersion]);

	const getRemoteSettings = useCallback((signal: AbortSignal) => {
		const url = 'client-settings.json?v=' + new Date().getTime();

		axios.get(
			url, { timeout: 10 * 1000, signal }
		).then((response: AxiosResponse<ClientSettings>) => {

			// test that return data is json
			if (!responseHasJsonContentType(response.headers)) {
				console.log('getRemoteSettings() parse ERROR: got response but result data is not JSON. Skipping server settings.');
				getLocalSettings();
				return;
			}

			const remoteSettings = sanitizePersistedClientSettings(response.data);

			// Got good server settings
			// save settings to client settings state
			setClientSettings(curr => ({
				...curr,
				...remoteSettings,
			}));

			// update a boolean so we know settings were loaded
			setBigState(curr => ({
				...curr,
				isRemoteSettingsLoaded: true
			}));

			// Now that we have loaded server settings, set the document.title from the title setting
			if (remoteSettings.titleString) { document.title = remoteSettings.titleString; }

			// If serverSettingsTakePrecedence is true, skip loading local settings
			// This means server settings will not be overwritten by local settings
			if (remoteSettings.serverSettingsTakePrecedence) {
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
			if (axios.isCancel(error)) {
				return;
			}
			console.log('getRemoteSettings() ajax ERROR:', error);
			console.log('Skipping server settings.');
			getLocalSettings();
		});
	}, [getLocalSettings, loadSettingsFromUrl, setBigState, setClientSettings]);

	useEffect(() => {
		//console.log('SettingsLoad useEffect()');

		migrateLegacyCookiesToLocalStorage();

		const controller = new AbortController();
		getRemoteSettings(controller.signal);

		loadSkipVersionSettings();

		return () => {
			controller.abort();
		};
	}, [getRemoteSettings, loadSkipVersionSettings]);

	return (<></>);
};

function arePropsEqual() {
	return true; // props equal = no update
}

export default React.memo(SettingsLoad, arePropsEqual);
