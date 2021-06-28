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
import './Update.css';
import $ from 'jquery';
// icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

class Update extends Component {

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

    const url = 'auto-version-switch.php?testphp=true';
    
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

  render() {

    const options = this.state.githubFetchReleases.map((r, i) => {
      return <option key={i} value={r.tag_name}>{r.tag_name} {r.name}</option>
    });

    return (
      <div className="Update">
        <h2>NagiosTV Updates</h2>

        <div className="update-help-message">
          There are a number of ways to update NagiosTV. You only need to pick one of these:
          <ol>
            <li>Manual Update - You can go through the process manually by downloading the archive
          from GitHub and extacting it over top the old version.</li>
            <li>One-click update to latest - You can use the one-click update routines inside the UI here.</li>
            <li>One-click pick any version - You can use the one-click update routines inside the UI here.</li>
            <li>Command-line (CLI) - You can run the autoupdate.sh file in the NagiosTV directory.</li>
          </ol>
        </div>

        {/* Manual Update */}
        <h3 style={{ color: 'peachpuff' }}>Manual Update</h3>

        <div>Go to <a target="_blank" rel="noopener noreferrer" href="https://github.com/chriscareycode/nagiostv-react/">GitHub</a> for manual install instructions</div>

        {/* Automatic Update */}
        <h3 style={{ color: 'peachpuff' }}>One-click update to latest</h3>

        {/* latest version */}
        <div style={{ marginTop: '20px' }}>
          Latest version is:
          {this.state.latestVersionLoading && <span style={{ color: 'lime' }}> Loading...</span>}
          {this.state.latestVersionError && <span style={{ color: 'lime' }}> Error: {this.state.latestVersion.version_string}</span>}
          {this.state.latestVersion.version_string && <span style={{ color: 'lime' }}> v{this.state.latestVersion.version_string}</span>}
        </div>

        {/* you are running version 0.0.0 */}
        <div>
          You are running: <span style={{ color: 'lime' }}>v{this.props.currentVersionString}</span>
        </div>

        {/* you are running latest version */}
        {this.props.currentVersion === this.state.latestVersion.version && <div style={{ color: 'lime' }}>You are running the latest version.</div>}

        {/* you are running a newer version */}
        {this.props.currentVersion > this.state.latestVersion.version && <div style={{ color: 'lime' }}>You are running a version newer than the latest announced release.</div>}


        {/* php test */}
        {this.state.testphpLoading && <div style={{ marginTop: '20px' }}>Testing your server compatibility...</div>}
        {this.state.testphpError && <div className="auto-update-error" style={{ marginTop: '20px' }}>
          <FontAwesomeIcon icon={faExclamationTriangle} /> Error testing PHP. One-click update disabled.  Use the manual update, or the cli <span className="auto-update-chown-command">sh autoupdate.sh {this.state.latestVersion.version_string}</span>
        </div>}

        {/* TODO: test if we have write access to the folder and all the files that we need */}

        {/* update button */}
        {(!this.state.testphpError && this.props.currentVersion < this.state.latestVersion.version) && <div style={{ marginTop: '20px' }}>
          <button disabled={this.state.updateLoading} onClick={this.beginUpdate} className="auto-update-button">Begin update to latest version v{this.state.latestVersion.version_string}</button>
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

        <h3 style={{ color: 'peachpuff' }}>or select a specific version to change to</h3>
        
        <div>
          You can pick any version off GitHub if you would like to.
        </div>

        {this.state.testphpError && <div className="auto-update-error" style={{ marginTop: '20px' }}>
          <FontAwesomeIcon icon={faExclamationTriangle} /> Error testing PHP. Specific version update disabled. Use the manual update, or the cli <span className="auto-update-chown-command">sh autoupdate.sh {this.state.latestVersion.version_string}</span>
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
            <button disabled={this.state.downgradeLoading} onClick={this.beginDowngrade} className="auto-update-button">Begin version change to {this.state.selected}</button>
          </div>}

          {this.state.downgradeError && <div>
            <div>Switch version Error:</div>
            {this.state.downgradeErrorMessage}
          </div>}

          {/* update is working/loading */}
          {this.state.downgradeLoading && <div style={{ marginTop: '20px' }}>
            <div>Switch version is working - Please Wait...</div>
          </div>}

          {this.state.downgradeResult && <div style={{ marginTop: '20px' }}>
            <div>Switch version result:</div>
            <textarea readOnly value={this.state.downgradeResult}></textarea>
          </div>}

        </div>}

        {/* upgrade prep instructions */}
        {this.state.testphpResult.whoami && <div className="update-server-setup-instructions">
          One-click update or version switch requires that the nagiostv folder and all the files within it are owned by the Apache user.<br />
          Run the following command on the server to change ownership to the Apache user so the update routines can work:<br />
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

        

      </div>
    );
  }
}

export default Update;
