import React, { Component } from 'react';
import './Base.css';
import ServiceItems from './ServiceItems.jsx';
import AlertItems from './AlertItems.jsx';
import HostItems from './HostItems.jsx';
import { prettyDateTime } from '../helpers/moment.js';
import Cookie from 'js-cookie';
import $ from 'jquery';

class Base extends Component {

  state = {
    baseUrl: '/nagios/cgi-bin/',
    fetchFrequency: 15, // seconds
    fetchAlertFrequency: 60, // seconds

    showSettings: false,

    currentVersion: 5,
    currentVersionString: '0.1.4',
    latestVersion: 0,
    latestVersionString: '',

    servicelistError: false,
    servicelistErrorMessage: '',
    servicelistLastUpdate: 0,
    servicelist: {},
    serviceProblemsArray: [],

    hostlistError: false,
    hostlistErrorMessage: '',
    hostlistLastUpdate: 0,
    hostlist: {},
    hostProblemsArray: [],

    alertlistError: false,
    alertlistErrorMessage: '',
    alertlistLastUpdate: 0,
    alertlist: []
  };

  componentDidMount() {
    this.getCookie();

    this.versionCheck();

    setTimeout(() => {
      this.fetchServiceData();
      this.fetchHostData();
      this.fetchAlertData();
    }, 1000);

    // fetch host problems and service problems on an interval
    setInterval(() => {
      this.fetchServiceData();
      this.fetchHostData();
    }, this.state.fetchFrequency * 1000);

    // we fetch alerts on a slower frequency interval
    setInterval(() => {
      this.fetchAlertData();
    }, this.state.fetchAlertFrequency * 1000);

    // version check (this needs to move to settings)
    setInterval(() => {
      this.versionCheck();
    }, 24 * 60 * 60 * 1000);
  }

  getCookie() {
    const baseUrl = Cookie.get('baseUrl');
    if (baseUrl) {
      this.setState({ baseUrl });
    }
  }

  setCookie() {
    Cookie.set('baseUrl', this.state.baseUrl);
  }

  fetchServiceData() {
    const url = this.state.baseUrl + 'statusjson.cgi?query=servicelist&details=true';

    //console.log('Requesting Service Data: ' + url);

    $.ajax({url}).done((myJson, textStatus, jqXHR) => {
      //console.log('ajax success');
      //console.log(data);
      // Make an array from the object
      const servicelist = myJson && myJson.data && myJson.data.servicelist;

      const serviceProblemsArray = [];
      Object.keys(servicelist).map((k) => {
        Object.keys(servicelist[k]).map((l) => {
          if (servicelist[k][l].status !== 2 || servicelist[k][l].is_flapping) {
            serviceProblemsArray.push(servicelist[k][l]);
          }
        });
      });

      this.setState({
        servicelistError: false,
        servicelistErrorMessage: '',
        servicelistLastUpdate: new Date().getTime(),
        servicelist,
        serviceProblemsArray: serviceProblemsArray
      });

    }).fail((jqXHR, textStatus, errorThrown) => {
      //console.log('ajax fail');
      //console.log(textStatus, errorThrown);
      this.setState({
        servicelistError: true,
        servicelistErrorMessage: errorThrown
      });
    });
  }

  fetchHostData() {
    const url = this.state.baseUrl + 'statusjson.cgi?query=hostlist&details=true';

    $.ajax({url}).done((myJson, textStatus, jqXHR) => {
      //console.log('ajax success');
      //console.log(data);
      // Make an array from the object
      const hostlist = myJson.data.hostlist;

      const hostProblemsArray = [];
      Object.keys(hostlist).map((k) => {
        if (hostlist[k].status !== 2 || hostlist[k].is_flapping) {
          hostProblemsArray.push(hostlist[k]);
        }
      });

      this.setState({
        hostlistError: false,
        hostlistErrorMessage: '',
        hostlistLastUpdate: new Date().getTime(),
        hostlist,
        hostProblemsArray: hostProblemsArray
      });

    }).fail((jqXHR, textStatus, errorThrown) => {
      //console.log('ajax fail');
      //console.log(textStatus, errorThrown);
      this.setState({
        hostlistError: true,
        hostlistErrorMessage: errorThrown
      });
    });
  }

  fetchAlertData() {
    const url = this.state.baseUrl + 'archivejson.cgi?query=alertlist&starttime=-200000&endtime=%2B0';

    $.ajax({url}).done((myJson, textStatus, jqXHR) => {
      //console.log('ajax success');
      //console.log(data);
      // Make an array from the object
      const alertlist = myJson.data.alertlist.reverse();
      this.setState({
        alertlistError: false,
        alertlistErrorMessage: '',
        alertlistLastUpdate: new Date().getTime(),
        alertlist // it's already an array
      });

    }).fail((jqXHR, textStatus, errorThrown) => {
      //console.log('ajax fail');
      //console.log(textStatus, errorThrown);
      this.setState({
        alertlistError: true,
        alertlistErrorMessage: errorThrown
      });
    });
  }

  baseUrlChanged(event) {
    //console.log('baseUrlChanged ' + event.target.value);
    this.setState({ baseUrl: event.target.value });
  }

  showSettings() {
    this.setState({ showSettings: true });
  }

  hideSettings() {
    this.setState({ showSettings: false });
  }

  versionCheck() {
    const url = 'https://chriscarey.com/software/nagiostv-react/version/json/';
    fetch(url)
      .then((response) => {
        //console.log(response);
        if (response.status === 200) {
          //this.setState({alertlistError: false, alertlistErrorMessage: ''});
          return response.json();
        }
      })
      .then((myJson) => {
        console.log('latest version check ' + new Date());
        console.log(myJson);

        this.setState({
          latestVersion: myJson.version,
          latestVersionString: myJson.version_string
        });
      })
  }

  render() {

    let howManyServices = 0;
    Object.keys(this.state.servicelist).forEach((host) => {
      howManyServices += Object.keys(this.state.servicelist[host]).length;
    });
    return (
      <div className="Base">

        <div className="HeaderArea">
          <div>
            <span className="ApplicationName">NagiosTV</span>
            
            <div className="SettingsButtonDiv">
            {!this.state.showSettings && <button onClick={this.showSettings.bind(this)}>Show Settings</button>}
            {this.state.showSettings && <button onClick={this.hideSettings.bind(this)}>Hide Settings</button>}
            </div>

            {this.state.showSettings && <div className="margin-top-10 settings border-gray color-white SettingsArea">
              <div>Settings</div>
              <span>Nagios cgi-bin path: </span>
              <input type="text" value={this.state.baseUrl} onChange={this.baseUrlChanged.bind(this)} />
              <button onClick={this.setCookie.bind(this)}>Save</button>
            </div>}

          </div>
        </div>

        <div className="FooterArea">
          <div>
            <span>Last Update: <span className="color-orange">{prettyDateTime(this.state.servicelistLastUpdate)}</span> - </span>
            <span>Update every <span className="color-orange">{this.state.fetchFrequency}s</span> - </span>
            <span>Version: <span className="color-orange">{this.state.currentVersionString}</span></span>
            {this.state.latestVersion > this.state.currentVersion && <span> - <span className="color-green">Update {this.state.latestVersionString} available</span></span>}
          </div>
        </div>

        <div style={{ marginTop: '55px' }} className="color-orange">Host Problems: {this.state.hostProblemsArray.length}</div>
        
        {this.state.hostlistError && <div className="margin-top-10 border-red color-red ServiceItem">Error connecting</div>}

        {!this.state.hostlistError && this.state.hostProblemsArray.length === 0 && <div style={{ marginTop: '10px' }} className="color-green AllOkItem">
          All {Object.keys(this.state.hostlist).length} hosts are UP
        </div>}

        <HostItems hostProblemsArray={this.state.hostProblemsArray} />

        <div style={{ marginTop: '10px' }} className="color-orange">Service Problems: {this.state.serviceProblemsArray.length}</div>
        
        {this.state.servicelistError && <div className="margin-top-10 border-red color-red ServiceItem">Error connecting</div>}

        {!this.state.servicelistError && this.state.serviceProblemsArray.length === 0 && <div className="margin-top-10 color-green AllOkItem">
          All {howManyServices} services are OK
        </div>}

        <ServiceItems serviceProblemsArray={this.state.serviceProblemsArray} />
        
        <div style={{ marginTop: '10px' }} className="color-orange margin-top-10">Alert History: {this.state.alertlist.length}</div>

        {this.state.alertlistError && <div className="margin-top-10 border-red color-red ServiceItem">Error connecting</div>}

        {!this.state.alertlistError && this.state.alertlist.length === 0 && <div className="margin-top-10 color-green AllOkItem">
          No alerts
        </div>}

        <AlertItems items={this.state.alertlist} />

        <br />
        <br />
      </div>
    );
  }
}

export default Base;
