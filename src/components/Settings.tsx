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
import LlmModelSelector from './settings/LlmModelSelector';
import { removeClientSettings, saveClientSettings } from '../helpers/persistence';
import DataSourceSettings from './settings/DataSourceSettings';
import DateRegionSettings from './settings/DateRegionSettings';
import DisplaySettings from './settings/DisplaySettings';
import AlertHistorySettings from './settings/AlertHistorySettings';
import AudioVisualSettings from './settings/AudioVisualSettings';
import MenuSettings from './settings/MenuSettings';
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

					{/* LLM Settings */}
					<table className="SettingsTable">
						<thead>
							<tr>
								<td colSpan={2} className="SettingsTableHeader">🤖 AI / LLM Integration Settings</td>
							</tr>
						</thead>
						<tbody>
							<tr>
								<th style={{ padding: '0px', height: '3px' }}></th>
								<td style={{ padding: '0px', height: '3px' }}></td>
							</tr>
							<tr>
								<th>Local LLM:</th>
								<td>
									<select value={clientSettingsTemp.hideLocalLLMSection.toString()} onChange={handleChange('hideLocalLLMSection', 'boolean')}>
										<option value={'true'}>Hide (Disabled)</option>
										<option value={'false'}>Show (Enabled)</option>
									</select>
									&nbsp;
								</td>
							</tr>
							{!clientSettingsTemp.hideLocalLLMSection && <><tr>
								<th>LLM Backend Type:</th>
								<td>
									<select value={clientSettingsTemp.llmBackendType} onChange={handleChange('llmBackendType', 'string')}>
										<option value={'openai-compatible'}>OpenAI-Compatible</option>
										<option value={'anthropic'}>Anthropic</option>
										<option value={'lmstudio'}>LM Studio</option>
									</select>
									<br />
									<span style={{ fontSize: '0.9em', color: '#888' }}>
										Selects which request/response adapter plugin to use for this LLM server.
									</span>
								</td>
							</tr><tr>
								<th>LLM Server Base URL:</th>
								<td>
									<input 
										type="text" 
										value={clientSettingsTemp.llmServerBaseUrl} 
										onChange={handleChange('llmServerBaseUrl', 'string')}
										placeholder="http://localhost:1234"
									/>
									<br />
									<span style={{ fontSize: '0.9em', color: '#888' }}>
										Base URL to your LLM server. The request path is selected from backend type (OpenAI-compatible, Anthropic, or LM Studio).<br />
										Examples:<br />
										• Ollama: <code>http://localhost:11434</code><br />
										• LM Studio: <code>http://localhost:1234</code><br />
										• LocalAI: <code>http://localhost:8080</code>
									</span>
								</td>
							</tr>
							<tr>
								<th>LLM Model:</th>
								<td>
									<LlmModelSelector
										llmBackendType={clientSettingsTemp.llmBackendType}
										llmModel={clientSettingsTemp.llmModel}
										llmServerBaseUrl={clientSettingsTemp.llmServerBaseUrl}
										llmApiKey={clientSettingsTemp.llmApiKey}
										onChange={handleChange('llmModel', 'string')}
									/>
								</td>
							</tr>
							<tr>
								<th>LLM API Key:</th>
								<td>
									<input 
										type="password" 
										value={clientSettingsTemp.llmApiKey} 
										onChange={handleChange('llmApiKey', 'string')}
										placeholder="Optional - leave empty for local servers" 
									/>
									<br />
									<span style={{ fontSize: '0.9em', color: '#888' }}>
										API key for authentication (optional for most local LLM servers)
									</span>
								</td>
							</tr>
							<tr>
								<th>LLM Thinking Time:</th>
								<td>
									<select value={clientSettingsTemp.llmThinkingLevel} onChange={handleChange('llmThinkingLevel', 'string')}>
										<option value={'off'}>Off (Direct responses)</option>
										<option value={'low'}>Low (Fastest)</option>
										<option value={'medium'}>Medium (Balanced)</option>
										<option value={'high'}>High (Most thorough)</option>
									</select>
									<br />
									<span style={{ fontSize: '0.9em', color: '#888' }}>
										Controls reasoning effort for compatible models. If your server does not support this option, NagiosTV will fall back automatically.
									</span>
								</td>
							</tr>
							<tr>
								<th>Speak LLM Response:</th>
								<td>
									<select value={clientSettingsTemp.llmSpeakResponse.toString()} onChange={handleChange('llmSpeakResponse', 'boolean')}>
										<option value={'false'}>Off</option>
										<option value={'true'}>On</option>
									</select>
									<br />
									<span style={{ fontSize: '0.9em', color: '#888' }}>
										When enabled, the AI response will be spoken aloud using your browser's text-to-speech.
									</span>
								</td>
							</tr>
							<tr>
								<th>System Prompt:</th>
								<td>
									<div className="text-[0.9em] text-[#888]">
										The system prompt sent to the LLM. Available variables:<br />
										<code className="bg-[#1e1e1e] px-1.5 py-0.5 rounded">{`{{DATE}}`}</code> - Current date (e.g., 2026-01-01)<br />
										<code className="bg-[#1e1e1e] px-1.5 py-0.5 rounded">{`{{TIME}}`}</code> - Current time (e.g., 14:30:45)<br />
										<code className="bg-[#1e1e1e] px-1.5 py-0.5 rounded">{`{{DAY_OF_WEEK}}`}</code> - Day of the week (e.g., Thursday)
									</div>
									<textarea 
										value={clientSettingsTemp.llmSystemPrompt} 
										onChange={handleChange('llmSystemPrompt', 'string')}
										placeholder="System prompt for the LLM"
										rows={8}
										className="w-full font-mono text-[0.9em]"
										style={{ fontFamily: 'monospace', fontSize: '0.9em' }}
									/>
								</td>
							</tr>
							<tr>
								<th>Doomguy Prompt:</th>
								<td>
									<span style={{ fontSize: '0.9em', color: '#888' }}>
										Appended to the system prompt when Doomguy is enabled. Controls the Doomguy balloon text in the AI response.
										The prompt needs to output in the format: Doomguy says &quot;&lt;message&gt;&quot; to work properly.
									</span>
									<br />
									<textarea 
										value={clientSettingsTemp.llmDoomguyPrompt} 
										onChange={handleChange('llmDoomguyPrompt', 'string')}
										placeholder="Prompt appended to system prompt when Doomguy is enabled"
										rows={8}
										style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.9em' }}
									/>
								</td>
							</tr>
							<tr>
								<th>Prompt (All OK):</th>
								<td>
									<span style={{ fontSize: '0.9em', color: '#888' }}>
										Custom instructions appended to the LLM prompt when all services/hosts are OK (0 items down)
									</span>
									<br />
									<textarea 
										value={clientSettingsTemp.llmPromptAllOk} 
										onChange={handleChange('llmPromptAllOk', 'string')}
										placeholder="Additional instructions when 0 items are down"
										rows={12}
										style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.9em' }}
									/>
								</td>
							</tr>
							<tr>
								<th>Prompt (Issues):</th>
								<td>
									<span style={{ fontSize: '0.9em', color: '#888' }}>
										Custom instructions appended to the LLM prompt when there are issues (1 or more items down)
									</span>
									<br />
									<textarea 
										value={clientSettingsTemp.llmPromptNotOk} 
										onChange={handleChange('llmPromptNotOk', 'string')}
										placeholder="Additional instructions when 1 or more items are down"
										rows={12}
										style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.9em' }}
									/>
								</td>
							</tr>
							<tr>
								<td colSpan={2} style={{ paddingLeft: '20px', paddingTop: '10px', paddingBottom: '10px' }}>
									<div style={{ backgroundColor: '#2a2a2a', padding: '15px', borderRadius: '5px', border: '1px solid #444' }}>
										<strong>ℹ️ LLM Server Setup Instructions:</strong>
										<ul style={{ marginTop: '10px', marginBottom: '5px', paddingLeft: '20px' }}>
											<li style={{ marginBottom: '5px' }}>
												<strong>Ollama:</strong> Install from <a href="https://ollama.com" target="_blank" rel="noopener noreferrer" style={{ color: '#4a90e2' }}>ollama.com</a>, 
												run <code style={{ backgroundColor: '#1e1e1e', padding: '2px 6px', borderRadius: '3px' }}>ollama serve</code>
												<br />Base URL: <code style={{ backgroundColor: '#1e1e1e', padding: '2px 6px', borderRadius: '3px' }}>http://localhost:11434</code>
											</li>
											<li style={{ marginBottom: '5px' }}>
												<strong>LM Studio:</strong> Download from <a href="https://lmstudio.ai" target="_blank" rel="noopener noreferrer" style={{ color: '#4a90e2' }}>lmstudio.ai</a>, 
												load a model, and start the local server
												<br />Base URL: <code style={{ backgroundColor: '#1e1e1e', padding: '2px 6px', borderRadius: '3px' }}>http://localhost:1234</code>
											</li>
											<li style={{ marginBottom: '5px' }}>
												<strong>LocalAI:</strong> Run via Docker: <code style={{ backgroundColor: '#1e1e1e', padding: '2px 6px', borderRadius: '3px' }}>docker run -p 8080:8080 localai/localai:latest</code>
												<br />Base URL: <code style={{ backgroundColor: '#1e1e1e', padding: '2px 6px', borderRadius: '3px' }}>http://localhost:8080</code>
											</li>
										</ul>
										<div style={{ marginTop: '10px', fontSize: '0.9em', color: '#999' }}>
											The AI Analysis component will use these settings to connect to your local LLM server and provide insights on monitoring issues.
										</div>
									</div>
								</td>
							</tr>
							</>}
						</tbody>
					</table>

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
