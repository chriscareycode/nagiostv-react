import React, { Component } from 'react';
import './Settings.css';
import Cookie from 'js-cookie';

class Settings extends Component {

  state = {
      open: false,
        saveMessage: '',

      baseUrl: '',
      flynnEnabled: true,
      flynnConcernedAt: 1,
      flynnAngryAt: 4,
      flynnBloodyAt: 8
  };

  componentDidMount() {
      
  }

  loadLocalStateFromProps() {
      console.log('loadLocalStateFromProps()', this.props.settings);
    this.setState({
        baseUrl: this.props.settings.baseUrl,
        flynnEnabled: this.props.settings.flynnEnabled,
        flynnConcernedAt: this.props.settings.flynnConcernedAt,
        flynnAngryAt: this.props.settings.flynnAngryAt,
        flynnBloodyAt: this.props.settings.flynnBloodyAt
    })
  }
  toggle() {
      // load local state from props when we open settings
      if (!this.state.open) {
          this.loadLocalStateFromProps();
      }
    this.setState({ open: !this.state.open });
  }

//   loadCookie() {
//     const cookie = Cookie.get('settings');
//     console.log('loadCookie');
//     console.log(cookie);
//   }

  saveCookie() {
    const cookieObject = {
        baseUrl: this.state.baseUrl,
        flynnEnabled: this.state.flynnEnabled,
        flynnConcernedAt: this.state.flynnConcernedAt,
        flynnAngryAt: this.state.flynnAngryAt,
        flynnBloodyAt: this.state.flynnBloodyAt
    };
    Cookie.set('settings', cookieObject);
    console.log('Saved cookie', cookieObject);
    this.props.updateStateFromSettings(cookieObject);

    this.setState({ saveMessage: 'Settings saved.' });
    setTimeout(() => {
        this.setState({ saveMessage: '' });
    }, 3000);
  }

  handleChange(propName, dataType, event) {
      //console.log('handleChange');
      //console.log(propName);
      //console.log(event.target.value, typeof event.target.value);
      let val = '';
      if (dataType === 'boolean') { val = (event.target.value == 'true'); }
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
      	<div className="SettingsSmall" onClick={this.toggle.bind(this)}>SS</div>
        <div className="SettingsBig">
            Settings
            <div className="SettingsScroll">

                <span>Nagios cgi-bin path: </span>
                <input type="text" value={this.state.baseUrl} onChange={this.handleChange.bind(this, 'baseUrl', 'string')} />

                <div style={{marginTop: '20px'}}>
                    Flynn
                    <select value={this.state.flynnEnabled} onChange={this.handleChange.bind(this, 'flynnEnabled', 'boolean')}>
                        <option value={true}>On</option>
                        <option value={false}>Off</option>
                    </select>
                </div>
                <div>Flynn angry at <input type="number" min="0" max="100" value={this.state.flynnAngryAt} onChange={this.handleChange.bind(this, 'flynnAngryAt', 'number')} /></div>
                <div>Flynn bloody at <input type="number" min="0" max="100" value={this.state.flynnBloodyAt} onChange={this.handleChange.bind(this, 'flynnBloodyAt', 'number')} /></div>
                
                <div style={{marginTop: '20px'}}>Settings coming soon</div>
                <div>Version Check: On/24h</div>
                <div>Update hosts/services every 15s</div>
                <div>Update alerts every 60s</div>
 
                <div style={{marginTop: '20px'}}>
                <button onClick={this.saveCookie.bind(this)}>Save Settings</button>
                {this.state.saveMessage && <span className="color-green">{this.state.saveMessage}</span>}
                </div>
                
            </div>
            <div className="SettingSave">
                <button onClick={this.toggle.bind(this)}>Close</button>
            </div>
        </div>
      </div>
    );
  }
}

export default Settings;
