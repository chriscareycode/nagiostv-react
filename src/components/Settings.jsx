/*eslint react/no-direct-mutation-state: "off"*/

import React, { Component } from 'react';
import './Settings.css';
import Cookie from 'js-cookie';
import axios from 'axios';
import { playSoundEffectDebounced, speakAudio } from '../helpers/audio';
import { listLocales } from '../helpers/moment';
import { languages } from '../helpers/language';

// icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTools } from '@fortawesome/free-solid-svg-icons';

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

  componentWillReceiveProps(nextProps, nextState) {
    if (!this.props.isCookieLoaded && nextProps.isCookieLoaded) {
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

  closeSettings = () => {
    this.props.updateStateFromSettings({
      currentPage: 'dashboard'
    });
  };

  saveCookie() {
    const cookieObject = {};
    this.props.settingsFields.forEach(field => cookieObject[field] = this.state[field]);
    Cookie.set('settings', cookieObject);
    
    //console.log('Saved cookie', cookieObject);
    this.props.updateStateFromSettings(cookieObject);

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
    this.props.updateStateFromSettings({
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

    axios.post('server.php', settingsObject).then(response => {
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
            {this.state.isDirty && <span>This page has unsaved changes</span>}
          </div>

          <div className="settings-header-buttons">
            {this.props.isCookieLoaded && <span role="img" aria-label="cookie"> 🍪 </span>}
            <button className="SettingsSaveButton" onClick={this.saveCookie}>Save Settings</button>
            <button className="SettingsCloseButton" onClick={this.closeSettings}>Close Settings</button>
          </div>

        </div>

        <div className="settings-top-space-for-header"></div>

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
                  This path needs to point to where the cgi files are being served by the Nagios web user interface.
                  If you are hosting NagiosTV on the same web server as the Nagios web user interface, then the default path
                  <span style={{ color: 'lime' }}> /nagios/cgi-bin/</span> should work without additional authentication.
                  
                  <span> Advanced: You can also enter a proxy URL here which performs authentication for you and serves the Nagios cgi files</span>
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
            <tr>
              <th>Alert History Title:</th>
              <td>
                <select value={this.state.hideHistoryTitle} onChange={this.handleChange('hideHistoryTitle', 'boolean')}>
                    <option value={true}>Hide</option>
                    <option value={false}>Show</option>
                </select>
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
              <th>Date Format:</th>
              <td>
              <input type="text" value={this.state.dateFormat} onChange={this.handleChange('dateFormat', 'string')} />
                <div>Format options are on this page: <a style={{ color: 'white' }} target="_blank" rel="noopener noreferrer" href="https://momentjs.com/docs/#/displaying/format/">https://momentjs.com/docs/#/displaying/format/</a></div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* fun */}
        <table className="SettingsTable">
          <thead>
            <tr>
              <td colSpan="2" className="SettingsTableHeader">Fun Stuff</td>
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
              <th>Flynn:</th>
              <td>
                <select value={this.state.flynnEnabled} onChange={this.handleChange('flynnEnabled', 'boolean')}>
                    <option value={true}>On</option>
                    <option value={false}>Off</option>
                </select>
              </td>
            </tr>
            {this.state.flynnEnabled && <tr>
              <th>Flynn angry at</th>
              <td><input type="number" min="0" max="100" value={this.state.flynnAngryAt} onChange={this.handleChange('flynnAngryAt', 'number')} /> services down</td>
            </tr>}
            {this.state.flynnEnabled && <tr>
              <th>Flynn bloody at</th>
              <td><input type="number" min="0" max="100" value={this.state.flynnBloodyAt} onChange={this.handleChange('flynnBloodyAt', 'number')} /> services down</td>
            </tr>}
            {this.state.flynnEnabled && <tr>
              <th>Flynn CSS scale</th>
              <td>
                <input type="number" min="0" max="4" value={this.state.flynnCssScale} onChange={this.handleChange('flynnCssScale', 'string')} />
                <span style={{ marginLeft: '8px' }}>{this.state.flynnCssScale}x scale</span> (change the size of Flynn. Decimal values OK here like 0.5)
              </td>
            </tr>}
            <tr>
              <th>Emojis:</th>
              <td>
                <select value={this.state.showEmoji} onChange={this.handleChange('showEmoji', 'boolean')}>
                  <option value={true}>On</option>
                  <option value={false}>Off</option>
                </select>
              </td>
            </tr>
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
          </tbody>
        </table>

        <table className="SettingsTable">
          <thead>
            <tr>
              <td className="SettingsTableHeader">Deleting Cookie</td>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <div className="font-size-0-8">
                  <div>
                  Local cookie settings are applied AFTER loading settings from the server, so you can think of server settings as a way to set defaults
                  for all clients, but they can still be customized individually. Delete the cookie and refresh the page to fetch server setting defaults again.
                  </div>
                  <br />
                  {this.props.isCookieLoaded && <button className="SettingsDeleteCookieButton" onClick={this.deleteCookie}>Delete Cookie</button>}
                  {this.props.isCookieLoaded && <span> <span role="img" aria-label="cookie">🍪</span> <span className="color-orange">Cookie detected</span></span>}
                </div>
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
                  By default, settings are saved into a cookie in your browser. There is also the option to save these settings on the server
                  so they can be shared with all users of NagiosTV. You will need to create a file <span style={{ color: 'lime' }}>client-settings.json</span> in
                  the nagiostv folder and chown 777 client-settings.json so the Apache process has rights to write to it.

                  <pre>
                  sudo touch client-settings.json<br />
                  sudo chmod 777 client-settings.json
                  </pre>

                  After those steps, you can try the "Save to Server" button.
                  <button className="SettingsSaveToServerButton" onClick={this.saveSettingsToServer}>Save to Server</button><br />
                  <br />
                  One other option is you can manually create the file <span style={{ color: 'lime' }}>client-settings.json</span> in the nagiostv folder with this data:
                  
                  <div className="raw-json-settings">{JSON.stringify(settingsObject)}</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        

      </div>
    );
  }
}

export default Settings;
