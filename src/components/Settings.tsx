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

import axios from 'axios';
import { getVoices } from '../helpers/audio';
// clipboard
import * as clipboard from "clipboard-polyfill/text";
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

	const [showClientSettingsJson, setShowClientSettingsJson] = useState(false);
	const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
	const saveMessageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const {
		isDemoMode,
	} = bigState;

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

	const saveSettingsToServer = () => {

		// convert the clientSettingsTemp into a string, where we also pretty-print the json with carriage returns and spaces
		const settingsString = JSON.stringify(clientSettingsTemp, null, 2);

		axios.post('save-client-settings.php', settingsString).then(response => {
			//console.log('saved to server', response);

			if (typeof response.data === 'object') {
				setSaveMessage('Saved to Server');
			} else {
				setSaveMessage(response.data);
			}

		}).catch(error => {
			//console.log('error saving to server', error);
			// show a message then clear the message
			setSaveMessage('Error saving to server');
		});

		clearSaveMessageAfter(3000);
	};

	const copySettingsToClipboard = () => {
		clipboard.writeText(JSON.stringify(clientSettingsTemp, null, 2));
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

					<table className="SettingsTable">
						<thead>
							<tr>
								<td className="SettingsTableHeader">💾 Saving these settings on the server</td>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td>
									<div className="" style={{ margin: '5px' }}>
										<div>
											By default, settings are saved into localStorage in your browser. There is also the option to save these settings on the server
											so they can be shared with all users of NagiosTV as defaults when they load the page.
										</div>
										<br />
										<div>
											Local client settings are applied AFTER loading settings from the server, so you can think of server settings as a way to set defaults
											for all clients, but they can still be customized individually with settings saved in client settings. Delete the client settings and refresh the page to fetch server setting defaults again.
										</div>
										<br />
										<div>
											<label>
												<input
													type="checkbox"
													checked={clientSettingsTemp.serverSettingsTakePrecedence}
													onChange={(e: ChangeEvent<HTMLInputElement>) => {
														setClientSettingsTemp(curr => ({ ...curr, serverSettingsTakePrecedence: e.target.checked }));
														setIsDirty(true);
													}}
												/>
												{' '}Server settings take precedence (when enabled, local settings will not override server settings)
											</label>
										</div>

										<br />

										<h4>Option 1: If you have PHP enabled on your server</h4>

										<div style={{ marginLeft: '30px' }}>

											You will need to create a file <span style={{ color: 'lime' }}>client-settings.json</span> in
											the nagiostv folder and chown 777 client-settings.json so the Apache web server has rights to write to it.

											<pre>
												sudo touch client-settings.json<br />
												sudo chmod 777 client-settings.json
											</pre>

											After those steps, you can try this button:
											<button disabled={isDemoMode} className="SettingsSaveToServerButton" onClick={saveSettingsToServer}>Save settings to server</button><br />
											<br />

										</div>


										<h4>Option 2: Manually create the settings file and copy and paste the configuration in</h4>

										<div style={{ marginLeft: '30px' }}>
											Manually create the file <span style={{ color: 'lime' }}>client-settings.json</span> in the nagiostv folder and paste in this data:
											
											<div style={{ marginTop: 10 }}>
												<button className="SettingsShowJsonButton" onClick={() => setShowClientSettingsJson(curr => !curr)}>
													{showClientSettingsJson ? 'Hide' : 'Show'} JSON
												</button>
												<button className="SettingsSaveToServerButton" onClick={copySettingsToClipboard}>Copy settings to clipboard for manual paste</button>
											</div>
											

											{showClientSettingsJson && <div className="raw-json-settings">{JSON.stringify(clientSettingsTemp, null, 2)}</div>}
										</div>
									</div>
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>}



		</div>
	);

};

export default Settings;
