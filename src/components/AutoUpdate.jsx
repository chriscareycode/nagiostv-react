import React, { Component } from 'react';
import './AutoUpdate.css';
import $ from 'jquery';

class AutoUpdate extends Component {

  state = {
    githubLoading: false,
    githubFetchError: false,
    githubFetchErrorMessage: '',
    githubFetchReleases: [],
    
    updateLoading: false,
    updateError: false,
    updateErrorMessage: '',
    updateResult: '',

    selected: ''
  };

  componentDidMount() {
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
        githubFetchError: false,
        githubFetchErrorMessage: '',
        githubFetchReleases: myJson
      });
    }).catch((err) => {
      // Error
      this.setState({
        githubLoading: false,
        githubFetchError: true,
        githubFetchErrorMessage: 'Error calling the auto update script'
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
      return <option key={i}>{r.tag_name}</option>
    });

    return (
      <div className="AutoUpdate">
        <h2>NagiosTV Update</h2>

        <div>TODO: Instructions for manual upgrade here with Github link...</div>

        <h2>Automatic Update</h2>
        <div>If your server is running PHP you can try the automatic updater.</div>

        {this.state.githubFetchError && <div>
          <div>githubFetchError:</div>
          {this.state.githubFetchErrorMessage}
        </div>}

        Select a version:&nbsp;
        <select onChange={this.selectChanged}>
          <option></option>
          {options}
        </select>
        {this.state.githubLoading && <span> Loading...</span>}

        {this.state.selected && <div style={{ marginTop: '20px' }}>
          <div>Selected version: {this.state.selected}</div>
          <button disabled={this.state.updateLoading} onClick={this.beginUpdate}>Begin Update to {this.state.selected}</button>
        </div>}

        {this.state.updateLoading && <span> Updating NagiosTV...</span>}


        {this.state.updateError && <div>
          <div>updateError:</div>
          {this.state.updateErrorMessage}
        </div>}

        {this.state.updateResult && <div>
          <div>updateResult:</div>
          <textarea readOnly value={this.state.updateResult}></textarea>
        </div>}

        <div style={{ marginTop: '20px' }}><button onClick={this.gotoDashboard}>Go back to Dashboard</button></div>
      </div>
    );
  }
}

export default AutoUpdate;
