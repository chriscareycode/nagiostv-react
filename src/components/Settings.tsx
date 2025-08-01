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

import { ChangeEvent, useEffect, useState } from 'react';
// State Management
import { useAtom } from 'jotai';
import { bigStateAtom, clientSettingsAtom } from '../atoms/settingsState';
// React Router
import { Link } from "react-router-dom";
// CSS
import './Settings.css';

import axios from 'axios';
import { playSoundEffectDebounced, speakAudio } from '../helpers/audio';
import { listLocales } from '../helpers/dates';
import { languages } from '../helpers/language';
// clipboard
import * as clipboard from "clipboard-polyfill/text";
// icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faTools } from '@fortawesome/free-solid-svg-icons';
import { ClientSettings } from 'types/settings';
import Doomguy from './Doomguy/Doomguy';

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

	let isComponentMounted = false;
	const hostlistError = false;

	const {
		isDemoMode,
	} = bigState;

	// Hooks
	useEffect(() => {
		isComponentMounted = true;
		return () => {
			isComponentMounted = false;
		};
	}, []);

	// If clientSettings object changes, we need to update the state of clientSettingsTemp
	useEffect(() => {
		setClientSettingsTemp(clientSettings);
	}, [clientSettings]);

	// Save Local Settings
	const saveLocalSettings = () => {

		if (clientSettingsTemp) {
			// Save to localStorage
			localStorage.setItem('settings', JSON.stringify(clientSettingsTemp));
			console.log('TEST saved local settings', clientSettingsTemp);

			setIsDirty(false);
			setClientSettings(clientSettingsTemp); // TODO: is this good, or do I need to wrap it with spread? I think it's ok
			setSaveMessage('Settings saved');

			// Now that we have saved settings, set the document.title from the title setting
			if (clientSettingsTemp.titleString) { document.title = clientSettingsTemp.titleString; }

			setTimeout(() => {
				if (isComponentMounted) {
					setSaveMessage('');
				}
			}, 5000);
		}
	};

	const deleteLocalSettings = () => {
		localStorage.removeItem('settings');

		// show a message then clear the message
		setSaveMessage('Local settings deleted. Refresh your browser.');

		console.log('Local settings deleted.');
	};

	// handle state changes for all the widgets on this page
	const handleChange = (propName: string, dataType: boolean | number | string) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		// console.log('handleChange new');
		// console.log(propName, dataType);
		// console.log(event.target.value);

		let val: boolean | number | string | null = '';
		if (dataType === 'boolean') { val = (event.target.value === 'true'); }
		else if (dataType === 'number') {
			val = parseInt(event.target.value, 10);
		} else {
			val = event.target.value;
		}

		setClientSettingsTemp(curr => ({
			...curr,
			[propName]: val
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

		setTimeout(() => {
			if (isComponentMounted) {
				setSaveMessage('');
			}
		}, 3000);
	};

	const copySettingsToClipboard = () => {
		clipboard.writeText(JSON.stringify(clientSettingsTemp, null, 2));
	};

	const playCritical = () => {
		playSoundEffectDebounced('service', 'critical', clientSettingsTemp);
	}
	const playWarning = () => {
		playSoundEffectDebounced('service', 'warning', clientSettingsTemp);
	}
	const playOk = () => {
		playSoundEffectDebounced('service', 'ok', clientSettingsTemp);
	}
	const playVoice = () => {
		const voice = clientSettingsTemp?.speakItemsVoice;
		if (voice) {
			speakAudio('Naagios TV is cool', voice);
		}
	}

	// voices
	const voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];

	const voiceOptions = voices.map((voice, i) => {
		return (
			<option key={'voice-' + i} value={voice.name}>{voice.name} ({voice.lang})</option>
		);
	});
	voiceOptions.unshift(<option key={'voice-default'} value={''}>DEFAULT</option>);

	// languages
	const languageOptions = languages.map((language, i) => {
		return (
			<option key={'language-' + i} value={language.name}>{language.name} ({language.code})</option>
		);
	});

	// languages
	const locales = listLocales();
	const localeOptions = locales.map((locale, i) => {
		return (
			<option key={'locale-' + i} value={locale}>{locale}</option>
		);
	});

	// A routine to fix the date format used from the migration of "moment" to "luxon".
	// We will change the dateFormat from 'llll' to 'fff' which is the new equivalent in luxon.
	const setDefaultDate = () => {
		setClientSettingsTemp(curr => ({
			...curr,
			dateFormat: 'fff'
		}));
		setIsDirty(true);
	};
	const setDefaultClockDate = () => {
		setClientSettingsTemp(curr => ({
			...curr,
			clockDateFormat: 'DD'
		}));
		setIsDirty(true);
	};
	const setDefaultClockTime = () => {
		setClientSettingsTemp(curr => ({
			...curr,
			clockTimeFormat: 'ttt'
		}));
		setIsDirty(true);
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

					{/* main settings */}
					<table className="SettingsTable">
						<thead>
							<tr>
								<td colSpan={2} className="SettingsTableHeader">Data Source Settings</td>
							</tr>
						</thead>
						<tbody>
							<tr>
								<th style={{ padding: '0px', height: '3px' }}></th>
								<td style={{ padding: '0px', height: '3px' }}></td>
							</tr>
							<tr>
								<th>
									{hostlistError && <span role="img" aria-label="error">⚠️ </span>}
									Fetch data from
								</th>
								<td>
									<select value={clientSettingsTemp.dataSource} onChange={handleChange('dataSource', 'string')}>
										<option value={'cgi'}>Nagios cgi-bin</option>
										<option value={'livestatus'}>MK Livestatus</option>
									</select>
								</td>
							</tr>
							{clientSettingsTemp.dataSource === 'livestatus' && <tr>
								<th>
									{hostlistError && <span role="img" aria-label="error">⚠️ </span>}
									livestatus.php path:
								</th>
								<td>
									<input
										type="text"
										className={hostlistError ? 'input-error' : ''}
										value={clientSettingsTemp.livestatusPath}
										onChange={handleChange('livestatusPath', 'string')}
									/>
									<div className="Note" style={{ fontSize: '0.8em', marginTop: '10px' }}>
										This path needs to point to where the included livestatus.php file is located. default is <span style={{ color: 'lime' }}> connectors/livestatus.php</span>.
										In the connectors/ folder, copy livestatus-settings.ini.sample to livestatus-settings.ini and configure it.
										Your livestatus-settings.ini will not be overwritten when NagiosTV is updated.
									</div>
								</td>
							</tr>}
							<tr>
								<th>
									{hostlistError && <span role="img" aria-label="error">⚠️ </span>}
									Nagios cgi-bin path:
								</th>
								<td>
									<input
										type="text"
										className={hostlistError ? 'input-error' : ''}
										value={clientSettingsTemp.baseUrl}
										onChange={handleChange('baseUrl', 'string')}
									/>
									<div className="Note" style={{ fontSize: '0.8em', marginTop: '10px' }}>
										This path needs to point to where the cgi files are being served by the Nagios web user interface.<br />
										<br />
										A note on authentication: Nagios cgi files rely on you to be authenticated so they know which user you are accessing Nagios as.
										Nagios uses this to determine which hosts/services and other rights you have.
										If you are hosting NagiosTV in a subdirectory in the Nagios web user interface, as is the suggested installation method, then the default path
										<span style={{ color: 'lime' }}> /nagios/cgi-bin/</span> will work without additional authentication since you will already be logged in.<br />
										<br />
										<div>You can read more about how to bypass auth here at <a target="_blank" rel="noopener noreferer" href="https://nagiostv.com/bypassing-authentication">https://nagiostv.com/bypassing-authentication</a>.</div>

									</div>
								</td>
							</tr>

							<tr>
								<th>Fetch hosts every:</th>
								<td>
									<select value={clientSettingsTemp.fetchHostFrequency} onChange={handleChange('fetchHostFrequency', 'number')}>
										<option value={15}>15s</option>
										<option value={30}>30s</option>
										<option value={60}>1m</option>
										<option value={300}>5m</option>
										<option value={600}>10m</option>
									</select>
									&nbsp;
									Affects server CPU. Larger interval = less CPU
								</td>
							</tr>
							<tr>
								<th>Fetch services every:</th>
								<td>
									<select value={clientSettingsTemp.fetchServiceFrequency} onChange={handleChange('fetchServiceFrequency', 'number')}>
										<option value={15}>15s</option>
										<option value={30}>30s</option>
										<option value={60}>1m</option>
										<option value={300}>5m</option>
										<option value={600}>10m</option>
									</select>
									&nbsp;
									Affects server CPU. Larger interval = less CPU
								</td>
							</tr>
							<tr>
								<th>Fetch alerts every:</th>
								<td>
									<select value={clientSettingsTemp.fetchAlertFrequency} onChange={handleChange('fetchAlertFrequency', 'number')}>
										<option value={15}>15s</option>
										<option value={30}>30s</option>
										<option value={60}>1m</option>
										<option value={300}>5m</option>
										<option value={600}>10m</option>
									</select>
									&nbsp;
									Affects server CPU. Larger interval = less CPU
								</td>
							</tr>

							<tr>
								<th>Check for new version:</th>
								<td>
									<select value={clientSettingsTemp.versionCheckDays} onChange={handleChange('versionCheckDays', 'number')}>
										<option value={0}>Never</option>
										<option value={1}>1 day</option>
										<option value={7}>1 week</option>
										<option value={30}>1 month</option>
									</select>
								</td>
							</tr>

						</tbody>
					</table>

					{/* regional */}
					<table className="SettingsTable">
						<thead>
							<tr>
								<td colSpan={2} className="SettingsTableHeader">Date and Region Settings</td>
							</tr>
						</thead>
						<tbody>
							<tr>
								<th>Language:</th>
								<td>
									<select value={clientSettingsTemp.language} onChange={handleChange('language', 'string')}>
										{languageOptions}
									</select>
								</td>
							</tr>
							<tr>
								<th>Date Locale:</th>
								<td>
									<select value={clientSettingsTemp.locale} onChange={handleChange('locale', 'string')}>
										{localeOptions}
									</select>
								</td>
							</tr>
							<tr>
								<th>Date Format:</th>
								<td>
									<input
										type="text"
										value={clientSettingsTemp.dateFormat}
										onChange={handleChange('dateFormat', 'string')}
										style={{
											width: '200px',
											border: clientSettingsTemp.dateFormat === 'llll' ? '2px solid red' : '0px solid transparent',
										}}
									/>
									{' '}<button onClick={setDefaultDate}>Set to default</button>
									{clientSettingsTemp.dateFormat === 'llll' && (
										<div style={{ color: 'red' }}>
											We migrated from using the "moment" date library to "luxon". If you used the default value 'llll' before when we were using "moment" library, we suggest 'fff' now.
										</div>
									)}
									<div>
										Format options are on this page:{' '}
										<a
											style={{
												color: 'white',
											}}
											target="_blank"
											rel="noopener noreferrer"
											href="https://github.com/moment/luxon/blob/master/docs/formatting.md#table-of-tokens"
										>
											https://github.com/moment/luxon/blob/master/docs/formatting.md#table-of-tokens
										</a>
										{' '}under "Table of tokens". 
									</div>
								</td>
							</tr>
							<tr>
								<th>Clock Date Format:</th>
								<td>
									<input
										type="text"
										value={clientSettingsTemp.clockDateFormat}
										onChange={handleChange('clockDateFormat', 'string')}
										style={{
											width: '200px',
											border: clientSettingsTemp.clockDateFormat === 'll' ? '2px solid red' : '0px solid transparent',
										}}
									/>
									{' '}<button onClick={setDefaultClockDate}>Set to default</button>
									{clientSettingsTemp.clockDateFormat === 'll' && (
										<div style={{ color: 'red' }}>
											We migrated from using the "moment" date library to "luxon". If you used the default value 'll' before when we were using "moment" library, we suggest 'DD' now.
											{' '}
										</div>
									)}
								</td>
							</tr>
							<tr>
								<th>Clock Time Format:</th>
								<td>
									<input
										type="text"
										value={clientSettingsTemp.clockTimeFormat}
										onChange={handleChange('clockTimeFormat', 'string')}
										style={{
											width: '200px',
											border: clientSettingsTemp.clockTimeFormat === 'LTS' ? '2px solid red' : '0px solid transparent',
										}}
									/>
									{' '}<button onClick={setDefaultClockTime}>Set to default</button>
									{clientSettingsTemp.clockTimeFormat === 'LTS' && (
										<div style={{ color: 'red' }}>
											We migrated from using the "moment" date library to "luxon". If you used the default value 'LTS' before when we were using "moment" library, we suggest 'ttt' for 12 hour or 'TTT' for 24 hour.
											{' '}
										</div>
									)}
								</td>
							</tr>
						</tbody>
					</table>

					{/* summary */}
					<table className="SettingsTable">
						<thead>
							<tr>
								<td colSpan={2} className="SettingsTableHeader">Show or Hide sections</td>
							</tr>
						</thead>
						<tbody>
							<tr>
								<th>Summary:</th>
								<td>
									<select value={clientSettingsTemp.hideSummarySection.toString()} onChange={handleChange('hideSummarySection', 'boolean')}>
										<option value={'true'}>Hide</option>
										<option value={'false'}>Show</option>
									</select>
									&nbsp;
								</td>
							</tr>
							<tr>
								<th>Most Recent Alert:</th>
								<td>
									<select value={clientSettingsTemp.hideMostRecentAlertSection.toString()} onChange={handleChange('hideMostRecentAlertSection', 'boolean')}>
										<option value={'true'}>Hide</option>
										<option value={'false'}>Show</option>
									</select>
									&nbsp;
								</td>
							</tr>
							<tr>
								<th>Hosts and Services layout:</th>
								<td>
									<select value={clientSettingsTemp.hostsAndServicesSideBySide.toString()} onChange={handleChange('hostsAndServicesSideBySide', 'boolean')}>
										<option value={'true'}>Side-by-side (Column)</option>
										<option value={'false'}>Stacked</option>
									</select>
									&nbsp;
									Side-by-side (Column) layout reverts to stacked on smaller screens
								</td>
							</tr>
							<tr>
								<th>Hosts:</th>
								<td>
									<select value={clientSettingsTemp.hideHostSection.toString()} onChange={handleChange('hideHostSection', 'boolean')}>
										<option value={'true'}>Hide</option>
										<option value={'false'}>Show</option>
									</select>
									&nbsp;
								</td>
							</tr>
							<tr>
								<th>Services:</th>
								<td>
									<select value={clientSettingsTemp.hideServiceSection.toString()} onChange={handleChange('hideServiceSection', 'boolean')}>
										<option value={'true'}>Hide</option>
										<option value={'false'}>Show</option>
									</select>
									&nbsp;
								</td>
							</tr>
							<tr>
								<th>Alert History:</th>
								<td>
									<select value={clientSettingsTemp.hideHistory.toString()} onChange={handleChange('hideHistory', 'boolean')}>
										<option value={'true'}>Hide</option>
										<option value={'false'}>Show</option>
									</select>
									&nbsp;
								</td>
							</tr>
							<tr>
								<th>MiniMap:</th>
								<td>
									<select value={clientSettingsTemp.showMiniMap.toString()} onChange={handleChange('showMiniMap', 'boolean')}>
										<option value={'false'}>Hide</option>
										<option value={'true'}>Show</option>
									</select>
									&nbsp;
									Show a "MiniMap" on the right side of the screen (Experimental, may cause memory leak)
								</td>
							</tr>
							<tr>
								<th>MiniMap width:</th>
								<td>
									<input
										type="text"
										style={{ maxWidth: 60 }}
										//className={hostlistError ? 'input-error' : ''}
										disabled={!clientSettingsTemp.showMiniMap}
										value={clientSettingsTemp.miniMapWidth}
										onChange={handleChange('miniMapWidth', 'number')}
									/>px
									&nbsp;

								</td>
							</tr>




						</tbody>
					</table>



					{/* history */}
					<table className="SettingsTable">
						<thead>
							<tr>
								<td colSpan={2} className="SettingsTableHeader">Alert History Settings</td>
							</tr>
						</thead>
						<tbody>

							<tr>
								<th>Alert History (24h) Chart:</th>
								<td>
									<select value={clientSettingsTemp.hideHistory24hChart.toString()} onChange={handleChange('hideHistory24hChart', 'boolean')}>
										<option value={'true'}>Hide</option>
										<option value={'false'}>Show</option>
									</select>
								</td>
							</tr>
							<tr>
								<th>Alert History ({clientSettingsTemp.alertDaysBack}d) Chart:</th>
								<td>
									<select value={clientSettingsTemp.hideHistoryChart.toString()} onChange={handleChange('hideHistoryChart', 'boolean')}>
										<option value={'true'}>Hide</option>
										<option value={'false'}>Show</option>
									</select>
								</td>
							</tr>
							<tr>
								<th>Alert History Titles:</th>
								<td>
									<select value={clientSettingsTemp.hideHistoryTitle.toString()} onChange={handleChange('hideHistoryTitle', 'boolean')}>
										<option value={'true'}>Hide</option>
										<option value={'false'}>Show</option>
									</select>
								</td>
							</tr>
							<tr>
								<th>Alert History Days Back:</th>
								<td>
									<input type="number" min="1" max="100" value={clientSettingsTemp.alertDaysBack} onChange={handleChange('alertDaysBack', 'number')} />
									&nbsp;
									Affects server CPU. Lower number of days = less CPU
								</td>
							</tr>
							<tr>
								<th>Alert History max # items:</th>
								<td>
									<input type="number" min="1" max="10000" value={clientSettingsTemp.alertMaxItems} onChange={handleChange('alertMaxItems', 'number')} />
									&nbsp;
									This will trim the results (in the browser) to limit how many can be shown. Does not affect the server.
								</td>
							</tr>
						</tbody>
					</table>

					{/* fun */}
					<table className="SettingsTable">
						<thead>
							<tr>
								<td colSpan={2} className="SettingsTableHeader">Audio and Visual</td>
							</tr>
						</thead>
						<tbody>
							<tr>
								<th>
									Dashboard Font Size
								</th>
								<td>
									<input
										type="range"
										min="0.5"
										max="4"
										step="0.1"
										value={parseFloat(clientSettingsTemp.fontSizeEm)}
										onChange={(e) => {
											const val = `${e.target.value}em`;
											setClientSettingsTemp(curr => ({
												...curr,
												fontSizeEm: val
											}));
											setIsDirty(true);
										}}
										style={{ width: '200px', marginRight: '10px' }}
									/>
									<div style={{ fontSize: clientSettingsTemp.fontSizeEm }}>Example text at {clientSettingsTemp.fontSizeEm}</div>
								</td>
							</tr>

							<tr>
								<th>Sound Effects:</th>
								<td>
									<select value={clientSettingsTemp.playSoundEffects.toString()} onChange={handleChange('playSoundEffects', 'boolean')}>
										<option value={'true'}>On</option>
										<option value={'false'}>Off</option>
									</select>
								</td>
							</tr>
							{clientSettingsTemp.playSoundEffects && <tr>
								<th>CRITICAL sound:</th>
								<td>
									<input type="text" value={clientSettingsTemp.soundEffectCritical} onChange={handleChange('soundEffectCritical', 'string')} />
									<button className="SettingsTestButton" onClick={playCritical}>Test</button>
								</td>
							</tr>}
							{clientSettingsTemp.playSoundEffects && <tr>
								<th>WARNING sound:</th>
								<td>
									<input type="text" value={clientSettingsTemp.soundEffectWarning} onChange={handleChange('soundEffectWarning', 'string')} />
									<button className="SettingsTestButton" onClick={playWarning}>Test</button>
								</td>
							</tr>}
							{clientSettingsTemp.playSoundEffects && <tr>
								<th>OK sound:</th>
								<td>
									<input type="text" value={clientSettingsTemp.soundEffectOk} onChange={handleChange('soundEffectOk', 'string')} />
									<button className="SettingsTestButton" onClick={playOk}>Test</button>
								</td>
							</tr>}
							{clientSettingsTemp.playSoundEffects && <tr>
								<th></th>
								<td>
									<div style={{ margin: '5px 0', fontSize: '0.8em' }}>* You can have multiple sound files for each state, and it will randomly choose one from the list. Add a semicolon between sounds like "http://example.com/sound-1.mp3;http://example.com/sound-2.mp3"</div>
								</td>
							</tr>}
							<tr>
								<th>Speak Items:</th>
								<td>
									<select value={clientSettingsTemp.speakItems.toString()} onChange={handleChange('speakItems', 'boolean')}>
										<option value={'true'}>On</option>
										<option value={'false'}>Off</option>
									</select>
								</td>
							</tr>
							{clientSettingsTemp.speakItems && <tr>
								<th>Choose Voice:</th>
								<td>
									<select value={clientSettingsTemp.speakItemsVoice} onChange={handleChange('speakItemsVoice', 'string')}>
										{voiceOptions}
									</select>
									<button className="SettingsTestButton" onClick={playVoice}>Test</button>
								</td>
							</tr>}
							<tr>
								<th>Animated progress bar for "Next Check In":</th>
								<td>
									<select value={clientSettingsTemp.showNextCheckInProgressBar.toString()} onChange={handleChange('showNextCheckInProgressBar', 'boolean')}>
										<option value={'true'}>On</option>
										<option value={'false'}>Off</option>
									</select>
									&nbsp;
									Uses more CPU in the browser (with recent GPU acceleration)
								</td>
							</tr>
							{/* <tr>
                <th>Emojis:</th>
                <td>
                  <select value={clientSettingsTemp.showEmoji} onChange={handleChange('showEmoji', 'boolean')}>
                    <option value={true}>On</option>
                    <option value={false}>Off</option>
                  </select>
                </td>
              </tr> */}
							<tr>
								<th>Automatic Scroll:</th>
								<td>
									<select value={clientSettingsTemp.automaticScroll.toString()} onChange={handleChange('automaticScroll', 'boolean')}>
										<option value={'true'}>On</option>
										<option value={'false'}>Off</option>
									</select>
									&nbsp;
									When there are many down hosts or services this will scroll the screen through all the items
								</td>
							</tr>
							{clientSettingsTemp.automaticScroll && (
								<tr>
									<th>Automatic Scroll Time Multiplier:</th>
									<td>
										<input type="number" min="0.1" max="10" value={clientSettingsTemp.automaticScrollTimeMultiplier} onChange={handleChange('automaticScrollTimeMultiplier', 'number')} />
										&nbsp;
										Slow down the scroll routine by multiplying the animation time 2 = 2x, 2.5 = 2.5x, 3 = 3x. Higher number is slower.
									</td>
								</tr>
							)}
							{clientSettingsTemp.automaticScroll && (
								<tr>
									<th>Automatic Scroll Wait Time:</th>
									<td>
										<input type="number" min="0" max="20" value={clientSettingsTemp.automaticScrollWaitSeconds} onChange={handleChange('automaticScrollWaitSeconds', 'number')} />
										&nbsp;
										Control how long the page waits after it reaches it's new location
									</td>
								</tr>
							)}
						</tbody>
					</table>

					{/* top and bottom menu */}
					<table className="SettingsTable">
						<thead>
							<tr>
								<td colSpan={2} className="SettingsTableHeader">Top and Bottom Menu</td>
							</tr>
						</thead>
						<tbody>
							<tr>
								<th style={{ padding: '0px', height: '3px' }}></th>
								<td style={{ padding: '0px', height: '3px' }}></td>
							</tr>
							<tr>
								<th>Title:</th>
								<td><input type="text" value={clientSettingsTemp.titleString} onChange={handleChange('titleString', 'string')} /></td>
							</tr>
							<tr>
								<th>Custom Logo:</th>
								<td>
									<select value={clientSettingsTemp.customLogoEnabled.toString()} onChange={handleChange('customLogoEnabled', 'boolean')}>
										<option value={'true'}>On</option>
										<option value={'false'}>Off</option>
									</select>
								</td>
							</tr>
							{clientSettingsTemp.customLogoEnabled && <tr>
								<th>Custom Logo URL:</th>
								<td>
									<input type="text" value={clientSettingsTemp.customLogoUrl} onChange={handleChange('customLogoUrl', 'string')} />
								</td>
							</tr>}
							<tr>
								<th>Doomguy:</th>
								<td>
									<select value={clientSettingsTemp.doomguyEnabled.toString()} onChange={handleChange('doomguyEnabled', 'boolean')}>
										<option value={'true'}>On</option>
										<option value={'false'}>Off</option>
									</select>
									<span style={{ position: 'relative' }}> &nbsp; The character from the 1993 video game Doom

										<span style={{ position: 'absolute', top: 0, right: -56, height: 32, width: 24 }}>
											<Doomguy scaleCss='0.5' style={{ position: 'absolute', top: -13 }} />
										</span>
									</span>
								</td>
							</tr>

							{/** special colspan=2 section for doom guy settings */}
							<tr>
								<td colSpan={2}>
									<div style={{ paddingLeft: '40px' }}>
										<table style={{ width: '100%', border: '1px solid #5f5f5f' }}>
											<tbody>
												{clientSettingsTemp.doomguyEnabled && <tr>
													<th>Doomguy concerned at</th>
													<td><input type="number" min="0" max="100" value={clientSettingsTemp.doomguyConcernedAt} onChange={handleChange('doomguyConcernedAt', 'number')} /> hosts DOWN, services WARNING or CRITICAL</td>
												</tr>}
												{clientSettingsTemp.doomguyEnabled && <tr>
													<th>Doomguy angry at</th>
													<td><input type="number" min="0" max="100" value={clientSettingsTemp.doomguyAngryAt} onChange={handleChange('doomguyAngryAt', 'number')} /> hosts DOWN, services WARNING or CRITICAL</td>
												</tr>}
												{clientSettingsTemp.doomguyEnabled && <tr>
													<th>Doomguy bloody at</th>
													<td><input type="number" min="0" max="100" value={clientSettingsTemp.doomguyBloodyAt} onChange={handleChange('doomguyBloodyAt', 'number')} /> hosts DOWN, services WARNING or CRITICAL</td>
												</tr>}
											</tbody>
										</table>
									</div>
								</td>
							</tr>
							{/** end special colspan=2 section for doom guy settings */}

							<tr>
								<th>Hamburger (Top) Menu:</th>
								<td>
									<select value={clientSettingsTemp.hideHamburgerMenu.toString()} onChange={handleChange('hideHamburgerMenu', 'boolean')}>
										<option value={'true'}>Hide</option>
										<option value={'false'}>Show</option>
									</select>
								</td>
							</tr>
							<tr>
								<th>Bottom Menu:</th>
								<td>
									<select value={clientSettingsTemp.hideBottomMenu.toString()} onChange={handleChange('hideBottomMenu', 'boolean')}>
										<option value={'true'}>Hide</option>
										<option value={'false'}>Show</option>
									</select>
								</td>
							</tr>

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
