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

import { ChangeEvent, useEffect, useRef, useState } from 'react';
// State Management
import { useAtom } from 'jotai';
import { bigStateAtom, clientSettingsAtom } from '../atoms/settingsState';
// React Router
import { Link } from "react-router-dom";
// CSS
import './Settings.css';

import { getVoices } from '../helpers/audio';
// icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faTools } from '@fortawesome/free-solid-svg-icons';
import { ClientSettings } from 'types/settings';
import { removeClientSettings, saveClientSettings } from '../helpers/persistence';
import DataSourceSettings from './settings/DataSourceSettings';
import DateRegionSettings from './settings/DateRegionSettings';
import DisplaySettings from './settings/DisplaySettings';
import AlertHistorySettings from './settings/AlertHistorySettings';
import AudioVisualSettings from './settings/AudioVisualSettings';
import MenuSettings from './settings/MenuSettings';
import LlmSettings from './settings/LlmSettings';
import SettingsPersistence from './settings/SettingsPersistence';
import {
	SettingInputType,
	SettingsChangeHandler,
	SettingsValueSetter,
} from './settings/settingsTypes';

const Settings = () => {

	// State Management state
	const [bigState, setBigState] = useAtom(bigStateAtom);
	const [clientSettings, setClientSettings] = useAtom(clientSettingsAtom);

	// Component state
	// takes a copy of the clientSettings and saves it into local state (for editing)
	const [clientSettingsTemp, setClientSettingsTemp] = useState<ClientSettings>(clientSettings);
	const [isDirty, setIsDirty] = useState(false);
	const [saveMessage, setSaveMessage] = useState('');

	const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
	const saveMessageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		return () => {
			if (saveMessageTimerRef.current) {
				clearTimeout(saveMessageTimerRef.current);
			}
		};
	}, []);

	const clearSaveMessageAfter = (delayMs: number) => {
		if (saveMessageTimerRef.current) {
			clearTimeout(saveMessageTimerRef.current);
		}
		saveMessageTimerRef.current = setTimeout(() => {
			setSaveMessage('');
			saveMessageTimerRef.current = null;
		}, delayMs);
	};

	// If clientSettings object changes, we need to update the state of clientSettingsTemp
	useEffect(() => {
		setClientSettingsTemp(clientSettings);
	}, [clientSettings]);

	// Load speech synthesis voices asynchronously
	useEffect(() => {
		const controller = new AbortController();
		getVoices(controller.signal).then(loadedVoices => {
			if (!controller.signal.aborted) {
				setVoices(loadedVoices);
			}
		});
		return () => controller.abort();
	}, []);

	// Save Local Settings
	const saveLocalSettings = () => {

		if (clientSettingsTemp) {
			saveClientSettings(clientSettingsTemp);

			setIsDirty(false);
			setClientSettings(clientSettingsTemp); // TODO: is this good, or do I need to wrap it with spread? I think it's ok
			setSaveMessage('Settings saved');

			// Now that we have saved settings, set the document.title from the title setting
			if (clientSettingsTemp.titleString) { document.title = clientSettingsTemp.titleString; }

				clearSaveMessageAfter(5000);
		}
	};

	const deleteLocalSettings = () => {
		removeClientSettings();

		// show a message then clear the message
		setSaveMessage('Local settings deleted. Refresh your browser.');

	};

	// handle state changes for all the widgets on this page
	const handleChange: SettingsChangeHandler = (
		propName: keyof ClientSettings,
		dataType: SettingInputType,
	) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
		// console.log('handleChange new');
		// console.log(propName, dataType);
		// console.log(event.target.value);

		let val: boolean | number | string | null = '';
		if (dataType === 'boolean') { val = (event.target.value === 'true'); }
		else if (dataType === 'number') {
			val = Number.parseFloat(event.target.value);
		} else {
			val = event.target.value;
		}

		setClientSettingsTemp(curr => ({
			...curr,
			[propName]: val
		}));
		setIsDirty(true);

	};

	const setSettingValue: SettingsValueSetter = (propName, value) => {
		setClientSettingsTemp(curr => ({
			...curr,
			[propName]: value,
		}));
		setIsDirty(true);
	};

	const showSaveMessage = (message: string, clearAfterMs?: number) => {
		setSaveMessage(message);
		if (clearAfterMs !== undefined) {
			clearSaveMessageAfter(clearAfterMs);
		}
	};

	return (
		<div className={`Settings`}>

			{clientSettingsTemp && <div>

				<div className="settings-header">

					<div className="settings-header-heading">
						<FontAwesomeIcon icon={faTools} />&nbsp;
						Settings
					</div>

					<div className="SettingsCenterDiv">
						{saveMessage && <span className="SettingSaveMessage color-green">{saveMessage}</span>}
						{isDirty && <span className="settings-unsaved-changes-text"><FontAwesomeIcon icon={faExclamationTriangle} /> This page has unsaved changes</span>}
					</div>

					<div className="settings-header-buttons">
						<button className="SettingsSaveButton" onClick={saveLocalSettings}>Save Settings</button>
						<Link to="/"><button className="SettingsCloseButton">Close Settings</button></Link>
					</div>

				</div>

				<div className="settings-wrap">

					{/*<div className="settings-top-space-for-header"></div>*/}

					{/* server settings */}
					{bigState.isRemoteSettingsLoaded && <table className="SettingsTable">
						<thead>
							<tr>
								<td className="SettingsTableHeader">
									<span className="color-primary">Server settings detected</span>
									&nbsp;
									- A client-settings.json file was successfully loaded from the server
								</td>
							</tr>
						</thead>
					</table>}

					{/* Local settings */}
					{bigState.isLocalSettingsLoaded && <table className="SettingsTable">
						<thead>
							<tr>
								<td className="SettingsTableHeader">
									<span><span role="img" aria-label="localStorage">🍪</span> <span className="color-primary">Local settings detected</span> - This browser has local custom settings saved to localStorage</span>
									&nbsp;
								</td>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td className="">
									{bigState.isRemoteSettingsLoaded && <div>A server settings file client-settings.json was detected, and this browser also has local settings saved to localStorage.<br />The local settings are overriding the server settings.<br /><br />If you choose to delete client settings, you will go back to the default settings configured on the server.<br />After you click the button, make sure to refresh the page.</div>}
									{bigState.isRemoteSettingsLoaded === false && <div>If you choose to delete the local settings, you will go back to NagiosTV defaults since a client-settings.json file was not found on the server.<br />After you click the button, make sure to refresh the page.</div>}
									<div>
										<button className="SettingsDeleteLocalSettingsButton" onClick={deleteLocalSettings}>Delete client settings</button>
									</div>
								</td>
							</tr>
						</tbody>
					</table>}

					<DataSourceSettings settings={clientSettingsTemp} onChange={handleChange} />

					<DateRegionSettings
						settings={clientSettingsTemp}
						onChange={handleChange}
						onSetValue={setSettingValue}
					/>

					<DisplaySettings settings={clientSettingsTemp} onChange={handleChange} />



					<AlertHistorySettings settings={clientSettingsTemp} onChange={handleChange} />

					<AudioVisualSettings
						settings={clientSettingsTemp}
						voices={voices}
						onChange={handleChange}
						onSetValue={setSettingValue}
					/>

					<MenuSettings settings={clientSettingsTemp} onChange={handleChange} />

					<LlmSettings settings={clientSettingsTemp} onChange={handleChange} />

					<SettingsPersistence
						isDemoMode={bigState.isDemoMode}
						settings={clientSettingsTemp}
						onMessage={showSaveMessage}
						onSetValue={setSettingValue}
					/>
				</div>
			</div>}



		</div>
	);

};

export default Settings;
