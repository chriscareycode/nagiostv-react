import React, { Component } from 'react';
import './Settings.css';
import Cookie from 'js-cookie';

class Settings extends Component {

  state = {
      open: false,

      baseUrl: '',
      flynnEnabled: true,
      flynnConcernedAt: 1,
      flynnAngryAt: 4,
      flynnBloodyAt: 8
  };

  componentDidMount() {
      
  }

  loadLocalStateFromProps() {
      console.log('loadLocalStateFromProps()', this.props.settings.baseUrl);
    this.setState({
        baseUrl: this.props.settings.baseUrl,
        flynnEnabled: this.props.settings.flynnEnabled,
        flynnConcernedAt: this.props.settings.flynnConcernedAt,
        flynnAngryAt: this.props.settings.flynnAngryAt,
        flynnBloodyAt: this.props.settings.flynnBloodyAt
    })
  }
  toggle() {
      if (!this.state.open) {
          this.loadLocalStateFromProps();
      }
    this.setState({ open: !this.state.open }, () => {
        // if open, 
    });
  }

  loadCookie() {
    const cookie = Cookie.get('settings');
    console.log('loadCookie');
    console.log(cookie);
  }

  saveCookie() {
    const cookieObject = {
        baseUrl: this.state.baseUrl
    };
    Cookie.set('settings', cookieObject);
    console.log('Saved cookie', cookieObject);
    this.props.updateStateFromSettings(cookieObject);
  }

  handleChange(propName, event) {
      console.log('handleChange');
      console.log(event);
      console.log(propName);
      this.setState({
          [propName]: event.target.value
      });
  }

  render() {
    return (
      <div className={`SettingsBox` + (this.state.open ? ' open' : '')}>
      	<div className="SettingsSmall" onClick={this.toggle.bind(this)}>SS</div>
        <div className="SettingsBig">
            SettingsBig
            <div className="SettingsScroll">
                <span>Nagios cgi-bin path: </span>
                <input type="text" defaultValue={this.state.baseUrl} onChange={this.handleChange.bind(this, 'baseUrl')} />
                <div></div>
                <div>Flynn {(this.state.flynnEnabled ? <span>on</span> : <span>off</span>)}</div>
                <div>Flynn concerned at <input type="text" defaultValue={this.state.flynnConcernedAt} onChange={this.handleChange.bind(this, 'flynnConcernedAt')} /></div>
                <div>Flynn angry at <input type="text" defaultValue={this.state.flynnAngryAt} onChange={this.handleChange.bind(this)} /></div>
                <div>Flynn bloody at <input type="text" defaultValue={this.state.flynnBloodyAt} onChange={this.handleChange.bind(this)} /></div>
                <div></div>
                <div>Version Check: Off/24h</div>
                <div>Update hosts/services every 15s</div>
                <div>Update alerts every 60s</div>
                <div>fdsafds</div>
                <div><button onClick={this.saveCookie.bind(this)}>Save Settings</button></div>
                
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
