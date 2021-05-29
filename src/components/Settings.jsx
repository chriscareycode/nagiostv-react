/*eslint react/no-direct-mutation-state: "off"*/

/**
 * NagiosTV https://nagiostv.com
 * Copyright (C) 2008-2021 Chris Carey https://chriscarey.com
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

import React, { Component } from 'react';
// React Router
import {
  Link
} from "react-router-dom";
// CSS
import './Settings.css';
import Cookie from 'js-cookie';
import axios from 'axios';
import { playSoundEffectDebounced, speakAudio } from '../helpers/audio';
import { listLocales } from '../helpers/moment';
import { languages } from '../helpers/language';
// clipboard
import * as clipboard from "clipboard-polyfill/text";
// icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faTools } from '@fortawesome/free-solid-svg-icons';

class Settings extends Component {

  state = {
    isDirty: false,
    saveMessage: ''
  };

  constructor(props) {
    super(props);

    // bind functions
    this.saveCookie = this.saveCookie.bind(this);
    this.deleteCookie = this.deleteCookie.bind(this);
    this.saveSettingsToServer = this.saveSettingsToServer.bind(this);

    this.playCritical = this.playCritical.bind(this);
    this.playWarning = this.playWarning.bind(this);
    this.playOk = this.playOk.bind(this);
    this.playVoice = this.playVoice.bind(this);

    // load the settingsFields into state
    this.props.settingsFields.forEach(field => this.state[field] = this.props.settings[field]);
  }

  componentDidMount() {
    //
    this.loadLocalStateFromProps();
  }

  componentDidUpdate(prevProps, prevState) {
    if (!this.props.isCookieLoaded && prevProps.isCookieLoaded) {
      this.loadLocalStateFromProps();
      console.log('settings - Loading Local State from Props');
      return true;
    }
    return false;
  }

  timerHandle = null;

  componentWillUnmount() {
    if (this.timerHandle) {
      clearTimeout(this.timerHandle);
    }
  }

  loadLocalStateFromProps() {
    //console.log('loadLocalStateFromProps()', this.props.settings);

    const settingsObject = {};
    this.props.settingsFields.forEach(field => settingsObject[field] = this.props.settings[field]);
    this.setState({
      ...settingsObject
    });
  }

  saveCookie() {
    const cookieObject = {};
    this.props.settingsFields.forEach(field => cookieObject[field] = this.state[field]);
    Cookie.set('settings', cookieObject);
    
    //console.log('Saved cookie', cookieObject);
    this.props.updateRootState(cookieObject);

    this.setState({
      isDirty: false,
      saveMessage: 'Settings saved'
    });

    this.timerHandle = setTimeout(() => {
      this.timerHandle = null;
      this.setState({ saveMessage: '' });
    }, 5000);
  }

  deleteCookie() {
    Cookie.remove('settings');

    // show a message then clear the message
    this.setState({ saveMessage: 'Cookie deleted. Refresh your browser.' });
    //setTimeout(() => {
      //this.setState({ saveMessage: '' });
    //}, 5000);

    // flip the isCookieDetected boolean
    // TODO: this doesn't work for some reason
    this.props.updateRootState({
      isCookieDetected: false
    });

    console.log('Cookie deleted.');
  }

  // handle state changes for all the widgets on this page
  handleChange = (propName, dataType) => (event) => {
    // console.log('handleChange new');
    // console.log(propName, dataType);
    // console.log(event.target.value);

    let val = '';
    if (dataType === 'boolean') { val = (event.target.value === 'true'); }
    else if (dataType === 'number') {
      val = parseInt(event.target.value, 10);
    } else {
      val = event.target.value;
    }
    
    this.setState({
      [propName]: val,
      isDirty: true
    });
  }

  saveSettingsToServer() {
    const settingsObject = {};
    this.props.settingsFields.forEach(field => settingsObject[field] = this.state[field]);

    // convert the settingsObject into a string, where we also pretty-print the json with carriage returns and spaces
    const settingsString = JSON.stringify(settingsObject, null, 2);

    axios.post('save-client-settings.php', settingsString).then(response => {
      //console.log('saved to server', response);
      
      if (typeof response.data === 'object') {
        this.setState({ saveMessage: 'Saved to Server' });
      } else {
        this.setState({ saveMessage: response.data });
      }
      
    }).catch(error => {
      //console.log('error saving to server', error);
      // show a message then clear the message
      this.setState({ saveMessage: 'Error saving to server' });
    });
    
    setTimeout(() => {
        this.setState({ saveMessage: '' });
    }, 3000);
  }

  copySettingsToClipboard = () => {
    const settingsObject = {};
    this.props.settingsFields.forEach(field => settingsObject[field] = this.state[field]);
    clipboard.writeText(JSON.stringify(settingsObject, null, 2));
  };

  playCritical() {
    const settingsObject = {};
    this.props.settingsFields.forEach(field => settingsObject[field] = this.state[field]);
    playSoundEffectDebounced('service', 'critical', settingsObject);
  }
  playWarning() {
    const settingsObject = {};
    this.props.settingsFields.forEach(field => settingsObject[field] = this.state[field]);
    playSoundEffectDebounced('service', 'warning', settingsObject);
  }
  playOk() {
    const settingsObject = {};
    this.props.settingsFields.forEach(field => settingsObject[field] = this.state[field]);
    playSoundEffectDebounced('service', 'ok', settingsObject);
  }
  playVoice() {
    const voice = this.state.speakItemsVoice;
    speakAudio('Naagios TV is cool', voice);
  }

  

  render() {

    const settingsObject = {};
    this.props.settingsFields.forEach(field => settingsObject[field] = this.state[field]);

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


    return (
      <div className={`Settings`}>

        <div className="settings-header">

          <div className="settings-header-heading">
            <FontAwesomeIcon icon={faTools} />&nbsp;
            Settings
          </div>

          <div className="SettingsCenterDiv">
            {this.state.saveMessage && <span className="SettingSaveMessage color-green">{this.state.saveMessage}</span>}
            {this.state.isDirty && <span className="settings-unsaved-changes-text"><FontAwesomeIcon icon={faExclamationTriangle} /> This page has unsaved changes</span>}
          </div>

          <div className="settings-header-buttons">
            <button className="SettingsSaveButton" onClick={this.saveCookie}>Save Settings</button>
            <Link to="/"><button className="SettingsCloseButton">Close Settings</button></Link>
          </div>

        </div>

        <div className="settings-wrap">

          {/*<div className="settings-top-space-for-header"></div>*/}

          {/* server settings */}
          {this.props.isRemoteSettingsLoaded && <table className="SettingsTable">
            <thead>
              <tr>
                <td className="SettingsTableHeader">
                <span className="color-orange">Server settings detected</span>
                &nbsp;
                - A client-settings.json file was successfully loaded from the server
                </td>
              </tr>
            </thead>
          </table>}

          {/* cookie settings */}
          {this.props.isCookieLoaded && <table className="SettingsTable">
            <thead>
              <tr>
                <td className="SettingsTableHeader">
                <span><span role="img" aria-label="cookie">🍪</span> <span className="color-orange">Cookie detected</span> - This browser has custom NagiosTV settings saved to a cookie</span>
                &nbsp;
                </td>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="">
                  {this.props.isRemoteSettingsLoaded && <div>A server settings file client-settings.json was detected, and this browser also has local settings saved to a cookie.<br />The local cookie settings are overriding the server settings.<br />If you choose to delete the cookie, you will go back to the default settings configured on the server.<br />After you click the button, make sure to refresh the page.</div>}
                  {this.props.isRemoteSettingsLoaded === false && <div>If you choose to delete the cookie, you will go back to NagiosTV defaults since a client-settings.json file was not found on the server.<br />After you click the button, make sure to refresh the page.</div>}
                  <div>
                    <button className="SettingsDeleteCookieButton" onClick={this.deleteCookie}>Delete Cookie</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>}

          {/* main settings */}
          <table className="SettingsTable">
            <thead>
              <tr>
                <td colSpan="2" className="SettingsTableHeader">Main Settings</td>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th style={{ padding: '0px', height: '3px' }}></th>
                <td style={{ padding: '0px', height: '3px' }}></td>
              </tr>
              <tr>
                <th>Title:</th>
                <td><input type="text" value={this.state.titleString} onChange={this.handleChange('titleString', 'string')} /></td>
              </tr>
              <tr>
                <th>
                  {this.props.hostlistError && <span role="img" aria-label="error">⚠️ </span>}
                  Fetch data from
                </th>
                <td>
                  <select value={this.state.dataSource} onChange={this.handleChange('dataSource', 'string')}>
                      <option value={'cgi'}>Nagios cgi-bin</option>
                      <option value={'livestatus'}>MK Livestatus</option>
                  </select>
                </td>
              </tr>
              {this.state.dataSource === 'livestatus' && <tr>
                <th>
                  {this.props.hostlistError && <span role="img" aria-label="error">⚠️ </span>}
                  livestatus.php path:
                </th>
                <td>
                  <input
                    type="text"
                    className={this.props.hostlistError ? 'input-error' : ''}
                    value={this.state.livestatusPath}
                    onChange={this.handleChange('livestatusPath', 'string')}
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
                  {this.props.hostlistError && <span role="img" aria-label="error">⚠️ </span>}
                  Nagios cgi-bin path:
                </th>
                <td>
                  <input
                    type="text"
                    className={this.props.hostlistError ? 'input-error' : ''}
                    value={this.state.baseUrl}
                    onChange={this.handleChange('baseUrl', 'string')}
                  />
                  <div className="Note" style={{ fontSize: '0.8em', marginTop: '10px' }}>
                    This path needs to point to where the cgi files are being served by the Nagios web user interface.<br />
                    <br />
                    A note on authentication: Nagios cgi files rely on you to be authenticated so they know which user you are accessing Nagios as.
                    Nagios uses this to determine which hosts/services and other rights you have.
                    If you are hosting NagiosTV in a subdirectory in the Nagios web user interface, as is the suggested installation method, then the default path
                    <span style={{ color: 'lime' }}> /nagios/cgi-bin/</span> will work without additional authentication since you will already be logged in.<br />
                    <br />
                    <span>There are a few ways to bypass authentication (I will do a writeup on these soon in more detail): 
                      <ul>
                        <li>You can enter a proxy URL here which performs authentication for you and serves the Nagios cgi files. A Node.js based proxy example is included with this project.</li>
                        <li>You can remove auth to cgi files statusjson.cgi and archivejson.cgi, and set default_user_name= in cgi.cfg</li>
                        <li>You can use the MK Livestatus connector which connects on a socket and does not require authentication</li>
                      </ul>
                    </span>
                  </div>
                </td>
              </tr>
              <tr>
                <th>New Version Check:</th>
                <td>
                  <select value={this.state.versionCheckDays} onChange={this.handleChange('versionCheckDays', 'number')}>
                      <option value={0}>Off</option>
                      <option value={1}>1 day</option>
                      <option value={7}>1 week</option>
                      <option value={30}>1 month</option>
                  </select>
                </td>
              </tr>
              <tr>
                <th>Language:</th>
                <td>
                  <select value={this.state.language} onChange={this.handleChange('language', 'string')}>
                      {languageOptions}
                  </select>
                </td>
              </tr>
              <tr>
                <th>Date Locale:</th>
                <td>
                  <select value={this.state.locale} onChange={this.handleChange('locale', 'string')}>
                      {localeOptions}
                  </select>
                </td>
              </tr>
              <tr>
                <th>Date Format:</th>
                <td>
                <input type="text" value={this.state.dateFormat} onChange={this.handleChange('dateFormat', 'string')} />
                  <div>Format options are on this page: <a style={{ color: 'white' }} target="_blank" rel="noopener noreferrer" href="https://momentjs.com/docs/#/displaying/format/">https://momentjs.com/docs/#/displaying/format/</a> under "Localized formats"</div>
                </td>
              </tr>
              <tr>
                <th>
                  Font Size
                </th>
                <td>
                  <select value={this.state.fontSizeEm} onChange={this.handleChange('fontSizeEm', 'string')}>
                      <option value={'0.8em'}>0.8em</option>
                      <option value={'0.9em'}>0.9em</option>
                      <option value={'1em'}>1em</option>
                      <option value={'1.1em'}>1.1em</option>
                      <option value={'1.2em'}>1.2em</option>
                      <option value={'1.5em'}>1.5em</option>
                      <option value={'2em'}>2em</option>
                      <option value={'3em'}>3em</option>
                      <option value={'4em'}>4em</option>
                  </select>
                </td>
              </tr>
            </tbody>
          </table>

          {/* hosts */}
          <table className="SettingsTable">
            <thead>
              <tr>
                <td colSpan="2" className="SettingsTableHeader">Hosts Settings</td>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th>Hosts:</th>
                <td>
                  <select value={this.state.hideHostSection} onChange={this.handleChange('hideHostSection', 'boolean')}>
                      <option value={true}>Hide</option>
                      <option value={false}>Show</option>
                  </select>
                  &nbsp;
                  You can also add ?hideHostSection=true/false to the URL bar to accomplish the same thing
                </td>
              </tr>
            </tbody>
          </table>

          {/* services */}
          <table className="SettingsTable">
            <thead>
              <tr>
                <td colSpan="2" className="SettingsTableHeader">Services Settings</td>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th>Services:</th>
                <td>
                  <select value={this.state.hideServiceSection} onChange={this.handleChange('hideServiceSection', 'boolean')}>
                      <option value={true}>Hide</option>
                      <option value={false}>Show</option>
                  </select>
                  &nbsp;
                  You can also add ?hideServiceSection=true/false to the URL bar to accomplish the same thing
                </td>
              </tr>
            </tbody>
          </table>

          {/* history */}
          <table className="SettingsTable">
            <thead>
              <tr>
                <td colSpan="2" className="SettingsTableHeader">Alert History Settings</td>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th>Alert History:</th>
                <td>
                  <select value={this.state.hideHistory} onChange={this.handleChange('hideHistory', 'boolean')}>
                      <option value={true}>Hide</option>
                      <option value={false}>Show</option>
                  </select>
                  &nbsp;
                  You can also add ?hideHistory=true/false to the URL bar to accomplish the same thing
                </td>
              </tr>
              <tr>
                <th>Alert History Chart:</th>
                <td>
                  <select value={this.state.hideHistoryChart} onChange={this.handleChange('hideHistoryChart', 'boolean')}>
                      <option value={true}>Hide</option>
                      <option value={false}>Show</option>
                  </select>
                </td>
              </tr>
              <tr>
                <th>Alert History Titles:</th>
                <td>
                  <select value={this.state.hideHistoryTitle} onChange={this.handleChange('hideHistoryTitle', 'boolean')}>
                      <option value={true}>Hide</option>
                      <option value={false}>Show</option>
                  </select>
                </td>
              </tr>
              <tr>
                <th>Alert History Days Back:</th>
                <td><input type="number" min="1" max="100" value={this.state.alertDaysBack} onChange={this.handleChange('alertDaysBack', 'number')} /></td>
              </tr>
              <tr>
                <th>Alert History max # items:</th>
                <td><input type="number" min="1" max="10000" value={this.state.alertMaxItems} onChange={this.handleChange('alertMaxItems', 'number')} /></td>
              </tr>
            </tbody>
          </table>

          {/* fun */}
          <table className="SettingsTable">
            <thead>
              <tr>
                <td colSpan="2" className="SettingsTableHeader">Audio and Visual</td>
              </tr>
            </thead>
            <tbody>
              

              
              <tr>
                <th>Sound Effects:</th>
                <td>
                  <select value={this.state.playSoundEffects} onChange={this.handleChange('playSoundEffects', 'boolean')}>
                    <option value={true}>On</option>
                    <option value={false}>Off</option>
                  </select>
                </td>
              </tr>
              {this.state.playSoundEffects && <tr>
                <th>CRITICAL sound:</th>
                <td>
                  <input type="text" value={this.state.soundEffectCritical} onChange={this.handleChange('soundEffectCritical', 'string')} />
                  <button className="SettingsTestButton" onClick={this.playCritical}>Test</button>
                </td>
              </tr>}
              {this.state.playSoundEffects && <tr>
                <th>WARNING sound:</th>
                <td>
                  <input type="text" value={this.state.soundEffectWarning} onChange={this.handleChange('soundEffectWarning', 'string')} />
                  <button className="SettingsTestButton" onClick={this.playWarning}>Test</button>
                </td>
              </tr>}
              {this.state.playSoundEffects && <tr>
                <th>OK sound:</th>
                <td>
                  <input type="text" value={this.state.soundEffectOk} onChange={this.handleChange('soundEffectOk', 'string')} />
                  <button className="SettingsTestButton" onClick={this.playOk}>Test</button>
                </td>
              </tr>}
              {this.state.playSoundEffects && <tr>
                <th></th>
                <td>
                  <div style={{ margin: '5px 0', fontSize: '0.8em' }}>* You can have multiple sound files for each state, and it will randomly choose one from the list. Add a semicolon between sounds like "http://example.com/sound-1.mp3;http://example.com/sound-2.mp3"</div>
                </td>
              </tr>}
              <tr>
                <th>Speak Items:</th>
                <td>
                  <select value={this.state.speakItems} onChange={this.handleChange('speakItems', 'boolean')}>
                    <option value={true}>On</option>
                    <option value={false}>Off</option>
                  </select>
                </td>
              </tr>
              {this.state.speakItems && <tr>
                <th>Choose Voice:</th>
                <td>
                  <select value={this.state.speakItemsVoice} onChange={this.handleChange('speakItemsVoice', 'string')}>
                    {voiceOptions}
                  </select>
                  <button className="SettingsTestButton" onClick={this.playVoice}>Test</button>
                </td>
              </tr>}
              <tr>
                <th>Progress bar for "Next Check In":</th>
                <td>
                  <select value={this.state.showNextCheckInProgressBar} onChange={this.handleChange('showNextCheckInProgressBar', 'boolean')}>
                    <option value={true}>On</option>
                    <option value={false}>Off</option>
                  </select>
                  &nbsp;
                  Uses more CPU in the browser
                </td>
              </tr>
              <tr>
                <th>Emojis:</th>
                <td>
                  <select value={this.state.showEmoji} onChange={this.handleChange('showEmoji', 'boolean')}>
                    <option value={true}>On</option>
                    <option value={false}>Off</option>
                  </select>
                </td>
              </tr>
            </tbody>
          </table>

          {/* fun */}
          <table className="SettingsTable">
            <thead>
              <tr>
                <td colSpan="2" className="SettingsTableHeader">Top and Bottom Menu</td>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th style={{ padding: '0px', height: '3px' }}></th>
                <td style={{ padding: '0px', height: '3px' }}></td>
              </tr>
              
              <tr>
                <th>Custom Logo:</th>
                <td>
                  <select value={this.state.customLogoEnabled} onChange={this.handleChange('customLogoEnabled', 'boolean')}>
                      <option value={true}>On</option>
                      <option value={false}>Off</option>
                  </select>
                </td>
              </tr>
              {this.state.customLogoEnabled && <tr>
                <th>Custom Logo URL:</th>
                <td>
                  <input type="text" value={this.state.customLogoUrl} onChange={this.handleChange('customLogoUrl', 'string')} />
                </td>
              </tr>}
              <tr>
                <th>Doom Guy (Flynn):</th>
                <td>
                  <select value={this.state.flynnEnabled} onChange={this.handleChange('flynnEnabled', 'boolean')}>
                      <option value={true}>On</option>
                      <option value={false}>Off</option>
                  </select>
                  <span style={{ color: 'orange' }}> This feature is temporarily broken while I refactor some code. He won't get angry or bloody.</span>
                </td>
              </tr>

              {/** special colspan=2 section for doom guy settings */}
              <tr>
                <td colSpan="2">
                  <div style={{ paddingLeft: '40px' }}>
                    <table style={{ width: '100%', border: '1px solid #5f5f5f' }}>
                      <tbody>
                        {this.state.flynnEnabled && <tr>
                          <th>Doom Guy angry at</th>
                          <td><input type="number" min="0" max="100" value={this.state.flynnAngryAt} onChange={this.handleChange('flynnAngryAt', 'number')} /> services down</td>
                        </tr>}
                        {this.state.flynnEnabled && <tr>
                          <th>Doom Guy bloody at</th>
                          <td><input type="number" min="0" max="100" value={this.state.flynnBloodyAt} onChange={this.handleChange('flynnBloodyAt', 'number')} /> services down</td>
                        </tr>}
                        {this.state.flynnEnabled && <tr>
                          <th>Doom Guy CSS scale</th>
                          <td>
                            <input type="number" min="0" max="4" value={this.state.flynnCssScale} onChange={this.handleChange('flynnCssScale', 'string')} />
                            <span style={{ marginLeft: '8px' }}>{this.state.flynnCssScale}x scale</span> (change the size of Flynn. Decimal values OK here like 0.5)
                          </td>
                        </tr>}
                      </tbody>
                    </table>
                  </div>
                </td>
              </tr>
              {/** end special colspan=2 section for doom guy settings */}

              <tr>
                <th>Hamburger Menu:</th>
                <td>
                  <select value={this.state.hideHamburgerMenu} onChange={this.handleChange('hideHamburgerMenu', 'boolean')}>
                    <option value={true}>Hide</option>
                    <option value={false}>Show</option>
                  </select>
                </td>
              </tr>
              <tr>
                <th>Bottom Menu:</th>
                <td>
                  <select value={this.state.hideBottomMenu} onChange={this.handleChange('hideBottomMenu', 'boolean')}>
                    <option value={true}>Hide</option>
                    <option value={false}>Show</option>
                  </select>
                </td>
              </tr>
              
            </tbody>
          </table>

          

          

          <table className="SettingsTable">
            <thead>
              <tr>
                <td className="SettingsTableHeader">Saving these settings on the server</td>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <div className="font-size-0-8" style={{ margin: '5px' }}>
                    <div>
                      By default, settings are saved into a cookie in your browser. There is also the option to save these settings on the server
                    so they can be shared with all users of NagiosTV as defaults when they load the page.
                    </div>
                    <br />
                    <div>
                      Local cookie settings are applied AFTER loading settings from the server, so you can think of server settings as a way to set defaults
                      for all clients, but they can still be customized individually with settings saved in the cookie. Delete the cookie and refresh the page to fetch server setting defaults again.
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
                      <button className="SettingsSaveToServerButton" onClick={this.saveSettingsToServer}>Save settings to server</button><br />
                      <br />

                    </div>


                    <h4>Option 2: Manually create the settings file and copy and paste the configuration in</h4>

                    <div style={{ marginLeft: '30px' }}>
                      Manually create the file <span style={{ color: 'lime' }}>client-settings.json</span> in the nagiostv folder and paste in this data:

                      <button className="SettingsSaveToServerButton" onClick={this.copySettingsToClipboard}>Copy settings to clipboard for manual paste</button>

                      <div className="raw-json-settings">{JSON.stringify(settingsObject, null, 2)}</div>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>


      </div>
    );
  }
}

export default Settings;
