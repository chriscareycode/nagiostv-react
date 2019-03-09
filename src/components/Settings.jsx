/*eslint react/no-direct-mutation-state: "off"*/

import React, { Component } from 'react';
import './Settings.css';
import Cookie from 'js-cookie';
import SettingsIcon from './Settings.png';
import axios from 'axios';
import { playSoundEffectDebounced, speakAudio } from '../helpers/audio';
import { languages } from '../helpers/language';

class Settings extends Component {

  state = {
    open: false,
    saveMessage: ''
  };

  constructor(props) {
    super(props);

    // bind functions
    this.toggle = this.toggle.bind(this);
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

  loadLocalStateFromProps() {
    //console.log('loadLocalStateFromProps()', this.props.settings);

    const settingsObject = {};
    this.props.settingsFields.forEach(field => settingsObject[field] = this.props.settings[field]);
    this.setState({
      ...settingsObject
    });
  }

  toggle() {
    // load local state from props when we open settings
    if (!this.state.open) {
        this.loadLocalStateFromProps();
    }
    this.setState({ open: !this.state.open });
  }

  saveCookie() {
    const cookieObject = {};
    this.props.settingsFields.forEach(field => cookieObject[field] = this.state[field]);
    Cookie.set('settings', cookieObject);
    
    //console.log('Saved cookie', cookieObject);
    this.props.updateStateFromSettings(cookieObject);

    this.setState({ saveMessage: 'Settings saved' });
    setTimeout(() => {
        this.setState({ saveMessage: '' });
    }, 3000);
  }

  deleteCookie() {
    Cookie.remove('settings');

    // show a message then clear the message
    this.setState({ saveMessage: 'Cookie deleted. Refresh your browser.' });
    setTimeout(() => {
        this.setState({ saveMessage: '' });
    }, 3000);

    console.log('Cookie deleted.');
  }

  // we write this as an anonymous function so we wont have to bind in render

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
      [propName]: val
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
    const voices = window.speechSynthesis.getVoices();
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

    return (
      <div className={`SettingsBox` + (this.state.open ? ' open' : '')}>
      	<div className="SettingsSmall" onClick={this.toggle}>
            <img src={SettingsIcon} alt="settings icon" />  
        </div>
        <div className="SettingsBig">
            <h2>Settings</h2>
            <div className="SettingsScroll">

              <div className="SettingsSection">
                <span>Title: </span>
                <input type="text" value={this.state.titleString} onChange={this.handleChange('titleString', 'string')} />
              </div>

              <div className="SettingsSection">
                <span>Nagios cgi-bin path: </span>
                <input type="text" value={this.state.baseUrl} onChange={this.handleChange('baseUrl', 'string')} />
                <div className="Note" style={{ marginTop: '10px' }}>
                  This path needs to point to where the cgi files are being served by the Nagios web user interface.
                  If you are hosting NagiosTV on the same web server as the Nagios web user interface, then the default path <span style={{ color: 'yellow' }}>/nagios/cgi-bin/</span> should work without additional authentication.<br />
                  <br />
                  <div>More advanced: You can also enter a proxy URL here which performs authentication for you and serves the Nagios cgi files</div>
                </div>
              </div>

              <div className="SettingsSection">
                <div>Alert History Days Back <input type="number" min="1" max="100" value={this.state.alertDaysBack} onChange={this.handleChange('alertDaysBack', 'number')} /></div>
                <div>Alert History max # of items <input type="number" min="1" max="10000" value={this.state.alertMaxItems} onChange={this.handleChange('alertMaxItems', 'number')} /></div>
              </div>

              <div className="SettingsSection">
                Language:{' '}
                <select value={this.state.language} onChange={this.handleChange('language', 'string')}>
                    {languageOptions}
                </select>
              </div>
              
              <div className="SettingsSection">
                New Version Check:{' '}
                <select value={this.state.versionCheckDays} onChange={this.handleChange('versionCheckDays', 'number')}>
                    <option value={0}>Off</option>
                    <option value={1}>1 day</option>
                    <option value={7}>1 week</option>
                    <option value={30}>1 month</option>
                </select>
              </div>

              <h5>Fun Stuff</h5>

              <div className="SettingsSection">
                <div>
                    Flynn:{' '}
                    <select value={this.state.flynnEnabled} onChange={this.handleChange('flynnEnabled', 'boolean')}>
                        <option value={true}>On</option>
                        <option value={false}>Off</option>
                    </select>
                </div>
                {this.state.flynnEnabled && <div>
                  <div>Flynn angry at <input type="number" min="0" max="100" value={this.state.flynnAngryAt} onChange={this.handleChange('flynnAngryAt', 'number')} /> services down</div>
                  <div>Flynn bloody at <input type="number" min="0" max="100" value={this.state.flynnBloodyAt} onChange={this.handleChange('flynnBloodyAt', 'number')} /> services down</div>
                  <div>
                    Flynn CSS scale <input type="number" min="0" max="100" value={this.state.flynnCssScale} onChange={this.handleChange('flynnCssScale', 'string')} />
                    <span style={{ marginLeft: '8px' }}>{this.state.flynnCssScale}x scale</span> (change the size of Flynn. Decimal values OK here like 0.5)
                  </div>
                </div>}
              </div>

              <div className="SettingsSection">
                Emojis:{' '}
                <select value={this.state.showEmoji} onChange={this.handleChange('showEmoji', 'boolean')}>
                    <option value={true}>On</option>
                    <option value={false}>Off</option>
                </select>
              </div>

              <div className="SettingsSection">
                Sound Effects:{' '}
                <select value={this.state.playSoundEffects} onChange={this.handleChange('playSoundEffects', 'boolean')}>
                    <option value={true}>On</option>
                    <option value={false}>Off</option>
                </select>
                {this.state.playSoundEffects && <div>
                  <div>DOWN/CRITICAL sound file: <input type="text" value={this.state.soundEffectCritical} onChange={this.handleChange('soundEffectCritical', 'string')} /><button onClick={this.playCritical}>Test</button></div>
                  <div>WARNING sound file: <input type="text" value={this.state.soundEffectWarning} onChange={this.handleChange('soundEffectWarning', 'string')} /><button onClick={this.playWarning}>Test</button></div>
                  <div>UP/OK sound file: <input type="text" value={this.state.soundEffectOk} onChange={this.handleChange('soundEffectOk', 'string')} /><button onClick={this.playOk}>Test</button></div>
                  <div style={{ margin: '5px 0' }}>* You can have multiple sound files for each state, if you want. Add a semicolon between sounds like "http://example.com/sound-1.mp3;http://example.com/sound-2.mp3"</div>
                </div>}
              </div>

              <div className="SettingsSection">
                Speak Items:{' '}
                <select value={this.state.speakItems} onChange={this.handleChange('speakItems', 'boolean')}>
                    <option value={true}>On</option>
                    <option value={false}>Off</option>
                </select>
                {this.state.speakItems && <div>
                  <div>Choose Voice:
                    <select value={this.state.speakItemsVoice} onChange={this.handleChange('speakItemsVoice', 'string')}>
                      {voiceOptions}
                  </select>
                  <button onClick={this.playVoice}>Test</button>
                  </div>
                  
                </div>}
              </div>

              <h5>Save and Close</h5>

              <div style={{marginTop: '20px'}}>
                <button className="SettingsSaveButton" onClick={this.saveCookie}>Save Cookie</button>
 
                <button className="SettingsCloseButton" onClick={this.toggle}>Close Settings</button>

                

                

                {this.state.saveMessage && <div className="SettingSaveMessage color-green">{this.state.saveMessage}</div>}
              </div>
              


              <div className="SaveToServerText">
                <h5>Saving these settings on the server</h5>
                By default, settings are saved into a cookie in your browser. There is also the option to save these settings on the server
                so they can be shared with all users of NagiosTV. Hopefully I'll get this process streamlined better in the future,
                but for now, to support this feature you will need to create a file <span style={{ color: 'yellow' }}>client-settings.json</span> in
                the nagiostv folder and chown 777 client-settings.json so the Apache process has rights to write to it.

                <pre>
                sudo touch client-settings.json<br />
                sudo chmod 777 client-settings.json
                </pre>

                After those steps, you can try the "Save to Server" button.
                <button className="SettingsSaveToServerButton" onClick={this.saveSettingsToServer}>Save to Server</button><br />
                <br />
                Local cookie settings are applied AFTER loading settings from the server, so you can think of server settings as a way to set defaults
                for all clients, but they can still be customized individually. Delete the cookie and refresh the page to fetch server setting defaults again. <button className="SettingsDeleteCookieButton" onClick={this.deleteCookie}>Delete Cookie</button><br />
                <br />
                One other option is you can manually create the file <span style={{ color: 'yellow' }}>client-settings.json</span> in the nagiostv folder with this data:
              </div>
              <div className="raw-json-settings">{JSON.stringify(settingsObject)}</div>

            </div>

            
        </div>
      </div>
    );
  }
}

export default Settings;
