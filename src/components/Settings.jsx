import React, { Component } from 'react';
import './Settings.css';
import Cookie from 'js-cookie';
import SettingsIcon from './Settings.png';

class Settings extends Component {

  state = {
    open: false,
    saveMessage: ''
  };

  constructor(props) {
    super(props);

    this.toggle = this.toggle.bind(this);
    this.saveCookie = this.saveCookie.bind(this);

    // load the settingsFields into state
    this.props.settingsFields.forEach(field => this.state[field] = this.props.settings[field]);
  }

  loadLocalStateFromProps() {
    console.log('loadLocalStateFromProps()', this.props.settings);

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
    console.log('Saved cookie', cookieObject);
    this.props.updateStateFromSettings(cookieObject);

    this.setState({ saveMessage: 'Settings saved.' });
    setTimeout(() => {
        this.setState({ saveMessage: '' });
    }, 3000);
  }

  // we write this as an anonymous function so we wont have to bind in render

  handleChange = (propName, dataType) => (event) => {
    //console.log('handleChange new');
    //console.log(propName, dataType);
    //console.log(event.target.value);

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

  render() {
    return (
      <div className={`SettingsBox` + (this.state.open ? ' open' : '')}>
      	<div className="SettingsSmall" onClick={this.toggle}>
            <img src={SettingsIcon} />  
        </div>
        <div className="SettingsBig">
            <h2>Settings</h2>
            <div className="SettingsScroll">
              <span>Nagios cgi-bin path: </span>
              <input type="text" value={this.state.baseUrl} onChange={this.handleChange('baseUrl', 'string')} />
              <div className="Note" style={{ marginTop: '10px' }}>
                This path needs to point to where the cgi files are being served by the Nagios web-ui.
                If you are hosting NagiosTV on the same web server as the Nagios web-ui, then the default path will work without additional authentication.<br />
                <br />
                <div>More advanced: If you want to host NagiosTV on off-box then you would need to enter a proxy URL here which performs authentication for you and serves the cgi files.</div>
              </div>

              <div style={{marginTop: '20px'}}>
                  Flynn:{' '}
                  <select value={this.state.flynnEnabled} onChange={this.handleChange('flynnEnabled', 'boolean')}>
                      <option value={true}>On</option>
                      <option value={false}>Off</option>
                  </select>
              </div>
              <div>Flynn angry at <input type="number" min="0" max="100" value={this.state.flynnAngryAt} onChange={this.handleChange('flynnAngryAt', 'number')} /></div>
              <div>Flynn bloody at <input type="number" min="0" max="100" value={this.state.flynnBloodyAt} onChange={this.handleChange('flynnBloodyAt', 'number')} /></div>
              <div>
                Flynn CSS scale <input type="number" min="0" max="100" value={this.state.flynnCssScale} onChange={this.handleChange('flynnCssScale', 'string')} />
                <span style={{ marginLeft: '8px' }}>{this.state.flynnCssScale}x scale</span>
              </div>
              
              <div style={{ marginTop: '20px' }}>
                New Version Check:{' '}
                <select value={this.state.versionCheckDays} onChange={this.handleChange('versionCheckDays', 'number')}>
                    <option value={0}>Off</option>
                    <option value={1}>1 day</option>
                    <option value={7}>1 week</option>
                    <option value={30}>1 month</option>
                </select>
              </div>

              <div style={{marginTop: '20px'}}>Settings coming soon:</div>
              <div>Update hosts/services every 15s</div>
              <div>Update alerts every 60s</div>
              <div>
                <div>Alert History Days Back <input type="number" min="1" max="100" value={this.state.alertDaysBack} onChange={this.handleChange('alertDaysBack', 'number')} /></div>
                <div>Alert History max # of items <input type="number" min="1" max="10000" value={this.state.alertMaxItems} onChange={this.handleChange('alertMaxItems', 'number')} /></div>
              </div>
              <div>Variable quiet time delay time</div>

              <div style={{marginTop: '20px'}}>
                <button className="SettingsSaveButton" onClick={this.saveCookie}>Save Settings</button>
                {this.state.saveMessage && <span className="color-green">{this.state.saveMessage}</span>}
              </div>
              <div className="SettingSave">
                <button onClick={this.toggle}>Close Settings</button>
              </div>

            </div>
            
        </div>
      </div>
    );
  }
}

export default Settings;
