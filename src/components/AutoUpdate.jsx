import React, { Component } from 'react';
import './AutoUpdate.css';
import $ from 'jquery';

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
      console.log('testPhp result', myJson);
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
    //console.log('testPhp');

    this.setState({ githubLoading: true });

    const url = 'https://nagiostv.com/version/nagiostv-react/?version=' + this.props.currentVersionString;

    $.ajax({
      method: "GET",
      url,
      dataType: "json",
      timeout: 10 * 1000
    }).done((myJson, textStatus, jqXHR) => {
      // Got data
      console.log('latestVersion result', myJson);
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

    const url = `auto-version-switch.php?version=${this.state.selected}`;
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

  gotoDashboard = () => {
    this.updateStateFromSettings({ currentPage: 'dashboard' });
  };

  render() {

    const options = this.state.githubFetchReleases.map((r, i) => {
      return <option key={i}>{r.tag_name} {r.name}</option>
    });

    return (
      <div className="AutoUpdate">
        <h2>NagiosTV Updates</h2>

        

        <h2 style={{ color: 'yellow' }}>Manual Update</h2>

        <div>TODO: Instructions for manual upgrade here with Github link...</div>

        <h2 style={{ color: 'lime' }}>Automatic Update</h2>

        {this.state.testphpLoading && <div>Testing your server compatibility...</div>}
        {this.state.testphpError && <div>Error testing PHP</div>}

        <div style={{ marginTop: '20px' }}>
          Latest version is: {this.state.latestVersion.version_string}<br />
          TODO: Read about this version at Github
        </div>

        <div style={{ marginTop: '20px' }}>
          TODO if test ok: <button disabled={this.state.updateLoading} onClick={this.beginUpdate}>Begin Update to latest version {this.state.latestVersion.version_string}</button>
        </div>

        {this.state.updateError && <div>
          <div>updateError:</div>
          {this.state.updateErrorMessage}
        </div>}

        {this.state.updateResult && <div style={{ marginTop: '20px' }}>
          <div>Update Result:</div>
          <textarea readOnly value={this.state.updateResult}></textarea>
        </div>}

        <h2 style={{ color: 'orange' }}>Downgrade</h2>
        <div>If there is a problem with a build, you can downgrade until it is resolved. Your server, your control. My suggestion is to try to stay current for the latest features.</div>

        TODO: testresult

        {this.state.githubError && <div>
          <div>githubError:</div>
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

        <div style={{ marginTop: '20px' }}>TODO: Read about this version at Github</div>

        {this.state.selected && <div style={{ marginTop: '20px' }}>
          {/*<div>Selected version: {this.state.selected}</div>*/}
          <button disabled={this.state.updateLoading} onClick={this.beginUpdate}>Begin version change to {this.state.selected}</button>
        </div>}


        {this.state.updateLoading && <span> Updating NagiosTV...</span>}


        {this.state.updateError && <div>
          <div>updateError:</div>
          {this.state.updateErrorMessage}
        </div>}

        {this.state.updateResult && <div style={{ marginTop: '20px' }}>
          <div>Update Result:</div>
          <textarea readOnly value={this.state.updateResult}></textarea>
        </div>}

        {/*<div style={{ marginTop: '100px' }}><button onClick={this.gotoDashboard}>Go back to Dashboard</button></div>*/}

      </div>
    );
  }
}

export default AutoUpdate;
