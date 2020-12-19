import React, { Component } from 'react';
import './AutoUpdate.css';
import $ from 'jquery';
// icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

class AutoUpdate extends Component {

  state = {
    testphpLoading: false,
    testphpError: false,
    testphpErrorMessage: '',
    testphpResult: {},

    latestVersionLoading: false,
    latestVersionError: false,
    latestVersionErrorMessage: '',
    latestVersion: '',

    githubLoading: false,
    githubError: false,
    githubErrorMessage: '',
    githubFetchReleases: [],
    
    updateLoading: false,
    updateError: false,
    updateErrorMessage: '',
    updateResult: '',

    downgradeLoading: false,
    downgradeError: false,
    downgradeErrorMessage: '',
    downgradeResult: '',

    selected: ''
  };

  componentDidMount() {

    this.testPhp();
    this.latestVersion();
    this.fetchReleasesFromGithub();
  }

  shouldComponentUpdate(nextProps, nextState) {
    //console.log('shouldComponentUpdate', nextProps, nextState);
    // if (nextProps.settings.customLogoEnabled !== this.props.settings.customLogoEnabled || nextProps.settings.customLogoUrl !== this.props.settings.customLogoUrl) {
    //   return true;
    // } else {
    //   return false;
    // }
    return true;
  }

  testPhp = () => {
    //console.log('testPhp');

    this.setState({ githubLoading: true });

    //const url = 'auto-version-switch.php?testphp=true';
    const url = 'http://bigwood.local/nagios/nagiostv/auto-version-switch.php?testphp=true';

    $.ajax({
      method: "GET",
      url,
      dataType: "json",
      timeout: 10 * 1000
    }).done((myJson, textStatus, jqXHR) => {
      // Got data
      //console.log('testPhp result', myJson);
      this.setState({
        testphpLoading: false,
        testphpError: false,
        testphpErrorMessage: '',
        testphpResult: myJson
      });
    }).catch((err) => {
      // Error
      this.setState({
        testphpLoading: false,
        testphpError: true,
        testphpErrorMessage: 'Error calling the auto update script'
      });
    });
  };

  latestVersion = () => {
    //console.log('latestVersion');

    this.setState({ githubLoading: true });

    const url = 'https://nagiostv.com/version/nagiostv-react/?version=' + this.props.currentVersionString;

    $.ajax({
      method: "GET",
      url,
      dataType: "json",
      timeout: 10 * 1000
    }).done((myJson, textStatus, jqXHR) => {
      // Got data
      //console.log('latestVersion result', myJson);
      this.setState({
        latestVersionLoading: false,
        latestVersionError: false,
        latestVersionErrorMessage: '',
        latestVersion: myJson
      });
    }).catch((err) => {
      // Error
      this.setState({
        latestVersionLoading: false,
        latestVersionError: true,
        latestVersionErrorMessage: 'Error calling the auto update script'
      });
    });
  };

  fetchReleasesFromGithub = () => {
    //console.log('fetchReleasesFromGithub');

    this.setState({ githubLoading: true });

    const url = 'https://api.github.com/repos/chriscareycode/nagiostv-react/releases';
    $.ajax({
      method: "GET",
      url,
      dataType: "json",
      timeout: 10 * 1000
    }).done((myJson, textStatus, jqXHR) => {
      // Got data from Github
      this.setState({
        githubLoading: false,
        githubError: false,
        githubErrorMessage: '',
        githubFetchReleases: myJson
      });
    }).catch((err) => {
      // Error
      this.setState({
        githubLoading: false,
        githubError: true,
        githubErrorMessage: 'Error calling the auto update script'
      });
    });
  };

  selectChanged = (e) => {
    //console.log(e.target.value);
    this.setState({ selected: e.target.value });
  };

  beginUpdate = () => {
    //console.log('beginUpdate');

    this.setState({ updateLoading: true });

    const url = `auto-version-switch.php?version=v${this.state.latestVersion.version_string}`;
    $.ajax({
      method: "GET",
      url,
      dataType: "html",
      timeout: 30 * 1000
    }).done((result, textStatus, jqXHR) => {
      // Got data from Github
      this.setState({
        updateLoading: false,
        updateError: false,
        updateErrorMessage: '',
        updateResult: result
      });
    }).catch((err) => {
      // Error
      this.setState({
        updateLoading: false,
        updateError: true,
        updateErrorMessage: ''
      });
    });
    
  };

  beginDowngrade = () => {
    //console.log('beginDowngrade');

    this.setState({ downgradeLoading: true });

    const url = `auto-version-switch.php?version=${this.state.selected}`;
    $.ajax({
      method: "GET",
      url,
      dataType: "html",
      timeout: 30 * 1000
    }).done((result, textStatus, jqXHR) => {
      // Got data from Github
      this.setState({
        downgradeLoading: false,
        downgradeError: false,
        downgradeErrorMessage: '',
        downgradeResult: result
      });
    }).catch((err) => {
      // Error
      this.setState({
        downgradeLoading: false,
        downgradeError: true,
        downgradeErrorMessage: ''
      });
    });
    
  };

  gotoDashboard = () => {
    this.updateRootState({ currentPage: 'dashboard' });
  };

  render() {

    const options = this.state.githubFetchReleases.map((r, i) => {
      return <option key={i} value={r.tag_name}>{r.tag_name} {r.name}</option>
    });

    return (
      <div className="AutoUpdate">
        <h2>NagiosTV Updates</h2>

        {/* Manual Update */}
        <h2 style={{ color: 'yellow' }}>Manual Update</h2>

        <div>Go to <a target="_blank" rel="noopener noreferer" href="https://github.com/chriscareycode/nagiostv-react/">GitHub</a> for manual install instructions</div>

        {/* Automatic Update */}
        <h2 style={{ color: 'lime' }}>or one-click update to latest</h2>

        {/* latest version */}
        <div style={{ marginTop: '20px' }}>
          Latest version is:
          {this.state.latestVersionLoading && <span style={{ color: 'lime' }}> Loading...</span>}
          {this.state.latestVersionError && <span style={{ color: 'lime' }}> Error: {this.state.latestVersion.version_string}</span>}
          {this.state.latestVersion.version_string && <span style={{ color: 'lime' }}> v{this.state.latestVersion.version_string}</span>}
        </div>

        {/* php test */}
        {this.state.testphpLoading && <div style={{ marginTop: '20px' }}>Testing your server compatibility...</div>}
        {this.state.testphpError && <div className="auto-update-error" style={{ marginTop: '20px' }}>
          <FontAwesomeIcon icon={faExclamationTriangle} /> Error testing PHP. Auto update disabled.
        </div>}

        {/* TODO: test if we have write access to the folder and all the files that we need */}

        {/* update button */}
        {!this.state.testphpError && <div style={{ marginTop: '20px' }}>
          <button disabled={this.state.updateLoading} onClick={this.beginUpdate} className="SettingsSaveToServerButton">Begin update to latest version v{this.state.latestVersion.version_string}</button>
        </div>}

        {/* update error */}
        {this.state.updateError && <div>
          <div>Update Error:</div>
          {this.state.updateErrorMessage}
        </div>}

        {/* update is working/loading */}
        {this.state.updateLoading && <div style={{ marginTop: '20px' }}>
          <div>Update is working - Please Wait...</div>
        </div>}

        {/* update result */}
        {this.state.updateResult && <div style={{ marginTop: '20px' }}>
          <div>Update Result:</div>
          <textarea readOnly value={this.state.updateResult}></textarea>
        </div>}

        <h2 style={{ color: 'orange' }}>or select a specific version</h2>
        
        <div>
          You can downgrade to a older version if you would like to.
        </div>

        {this.state.testphpError && <div className="auto-update-error" style={{ marginTop: '20px' }}>
          <FontAwesomeIcon icon={faExclamationTriangle} /> Error testing PHP. Specific version disabled.
        </div>}

        {!this.state.testphpError && <div style={{ marginTop: '20px' }}>
          
          {this.state.githubError && <div>
            <div>Github Error:</div>
            {this.state.githubErrorMessage}
          </div>}

          <div style={{ marginTop: '20px' }}>
            Select a version from Github:&nbsp;
            <select onChange={this.selectChanged}>
              <option></option>
              {options}
            </select>
            {this.state.githubLoading && <span> Loading...</span>}
          </div>

          {this.state.selected && <div style={{ marginTop: '20px' }}>
            {/*<div>Selected version: {this.state.selected}</div>*/}
            <button disabled={this.state.downgradeLoading} onClick={this.beginDowngrade} className="SettingsSaveToServerButton">Begin version change to {this.state.selected}</button>
          </div>}

          {this.state.downgradeError && <div>
            <div>Downgrade Error:</div>
            {this.state.downgradeErrorMessage}
          </div>}

          {/* update is working/loading */}
          {this.state.downgradeLoading && <div style={{ marginTop: '20px' }}>
            <div>Downgrade is working - Please Wait...</div>
          </div>}

          {this.state.downgradeResult && <div style={{ marginTop: '20px' }}>
            <div>Downgrade Result:</div>
            <textarea readOnly value={this.state.downgradeResult}></textarea>
          </div>}

        </div>}

        {/* upgrade prep instructions */}
        {this.state.testphpResult.whoami && <div>
          <br />
          <br />
          * Automatic Update or version switch requires that the nagiostv folder and all the files within it are owned by the Apache user.<br />
          Run the following command on the server to change ownership to the Apache user:<br />
          <div className="auto-update-chown-command">sudo chown -R {this.state.testphpResult.whoami}:{this.state.testphpResult.whoami} {this.state.testphpResult.script}</div>
        </div>}

        {/* downgrading warnings */}
        {/*<div>
          <br />
          <br />
          * If you downgrade to a version before v0.6.0, this auto update page will not exist on that old version.<br />
          So, how do you get back up to a newer version? You can load this URL manually to switch again (take note of the URL or you can find it on the README at Github).
          <div className="auto-update-chown-command">{document.location.href}auto-version-switch.php?version=v{this.state.latestVersion.version_string}</div>
        </div>*/}

        {/*<div style={{ marginTop: '100px' }}><button onClick={this.gotoDashboard}>Go back to Dashboard</button></div>*/}

      </div>
    );
  }
}

export default AutoUpdate;
