import React, { Component } from 'react';
import './Base.css';
import ServiceItems from './ServiceItems.jsx';
import AlertItems from './AlertItems.jsx';
import HostItems from './HostItems.jsx';
import { prettyDateTime } from '../helpers/moment.js';
import Cookie from 'js-cookie';
import $ from 'jquery';
import Flynn from './Flynn/Flynn.jsx';
import Settings from './Settings.jsx';

class Base extends Component {

  state = {
    baseUrl: '/nagios/cgi-bin/',

    fetchFrequency: 15, // seconds
    fetchAlertFrequency: 60, // seconds

    showSettings: false,

    currentVersion: 14,
    currentVersionString: '0.2.3beta',
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
    alertlist: [],

    alertDaysBack: 7,
    alertMaxItems: 1000,

    commentlistError: false,
    commentlistErrorMessage: '',
    commentlistLastUpdate: 0,
    commentlist: {},

    // settings (defaults are set here also)
    flynnEnabled: false,
    flynnConcernedAt: 1,
    flynnAngryAt: 4,
    flynnBloodyAt: 8,
    flynnCssScale: '1',

    versionCheckDays: 1
  };

  componentDidMount() {
    this.getCookie();

    
    setTimeout(() => {
      this.fetchServiceData();
      this.fetchHostData();
      this.fetchAlertData();
      this.fetchCommentData();
    }, 1000);

    // fetch host problems and service problems on an interval
    setInterval(() => {
      this.fetchServiceData();
      this.fetchHostData();
      this.fetchCommentData();
    }, this.state.fetchFrequency * 1000);

    // we fetch alerts on a slower frequency interval
    setInterval(() => {
      this.fetchAlertData();
    }, this.state.fetchAlertFrequency * 1000);

    // this is not super clean but I'm going to delay this by 2s to give the setState() in the getCookie()
    // time to complete. It's async so we could have a race condition getting the version check setting
    // to arrive in this.state.versionCheckDays
    // I want to default to having version check on, but if someone turns it off, it should never check
    setTimeout(() => {
      // version check - run once on app boot
      if (this.state.versionCheckDays > 0) {
        this.versionCheck();
      }
      // version check - run every n days
      if (this.state.versionCheckDays > 0) {
        setInterval(() => {
          this.versionCheck();
        }, this.state.versionCheckDays * 24 * 60 * 60 * 1000);
      }
    }, 2000);
  }

  settingsFields = [
    'baseUrl',
    'flynnEnabled',
    'flynnConcernedAt',
    'flynnAngryAt',
    'flynnBloodyAt',
    'flynnCssScale',
    'versionCheckDays',
    'alertDaysBack',
    'alertMaxItems'
  ];

  getCookie() {
    const cookie = Cookie.get('settings');
    let cookieObject = {};
    try {
      cookieObject = JSON.parse(cookie);
      console.log('Got coookie', cookieObject);
    } catch (e) {
      console.log('No cookie');
    }
    const updateIfExist = (prop) => {
      if (cookieObject.hasOwnProperty(prop)) {
        console.log('setting state on ' + prop +' to ', cookieObject[prop]);
        this.setState({ [prop]: cookieObject[prop] });
      }
    };
    if (cookieObject) {
      this.settingsFields.forEach(setting => updateIfExist(setting));
    }
  }

  // setCookie() {
  //   Cookie.set('baseUrl', this.state.baseUrl);
  // }

  updateStateFromSettings(settingsObject) {
    this.setState({
      ...settingsObject
    });
  }

  fetchServiceData() {
    const url = this.state.baseUrl + 'statusjson.cgi?query=servicelist&details=true';

    //console.log('Requesting Service Data: ' + url);

    $.ajax({url}).done((myJson, textStatus, jqXHR) => {
      //console.log('fetchServiceData() ajax success');
      //console.log(myJson);
      //console.log(textStatus);
      //console.log(jqXHR);

      // test that return data is json
      if (jqXHR.getResponseHeader('content-type').indexOf('application/json') === -1) {
        console.log('fetchServiceData() ERROR: got response but result data is not JSON. Base URL setting is probably wrong.');
        this.setState({
          servicelistError: true,
          servicelistErrorMessage: 'ERROR: Result data is not JSON. Base URL setting is probably wrong.'
        });
        return;
      }

      // Make an array from the object
      const servicelist = myJson && myJson.data && myJson.data.servicelist;
      const serviceProblemsArray = [];

      if (servicelist) {
        Object.keys(servicelist).map((k) => {
          Object.keys(servicelist[k]).map((l) => {
            if (servicelist[k][l].status !== 2 || servicelist[k][l].is_flapping) {
              serviceProblemsArray.push(servicelist[k][l]);
            }
          });
        });
      }

      this.setState({
        servicelistError: false,
        servicelistErrorMessage: '',
        servicelistLastUpdate: new Date().getTime(),
        servicelist,
        serviceProblemsArray: serviceProblemsArray
      });

    }).fail((jqXHR, textStatus, errorThrown) => {
      console.log('fetchServiceData() ajax fail');
      console.log(jqXHR, textStatus, errorThrown);
      this.setState({
        servicelistError: true,
        servicelistErrorMessage: 'ERROR: ' + jqXHR.status +  ' ' + errorThrown + ' - ' + url
      });
    });
  }

  fetchHostData() {
    const url = this.state.baseUrl + 'statusjson.cgi?query=hostlist&details=true';

    $.ajax({url}).done((myJson, textStatus, jqXHR) => {
      //console.log('ajax success');
      //console.log(data);

      // test that return data is json
      if (jqXHR.getResponseHeader('content-type').indexOf('application/json') === -1) {
        console.log('fetchHostData() ERROR: got response but result data is not JSON. Base URL setting is probably wrong.');
        this.setState({
          hostlistError: true,
          hostlistErrorMessage: 'ERROR: Result data is not JSON. Base URL setting is probably wrong.'
        });
        return;
      }

      // Make an array from the object
      let hostlist = {};
      if (myJson && myJson.data && myJson.data.hostlist) {
        hostlist = myJson.data.hostlist;
      }
      const hostProblemsArray = [];

      if (hostlist) {
        Object.keys(hostlist).map((k) => {
          if (hostlist[k].status !== 2 || hostlist[k].is_flapping) {
            hostProblemsArray.push(hostlist[k]);
          }
        });
      }

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
        hostlistErrorMessage: 'ERROR: ' + jqXHR.status +  ' ' + errorThrown + ' - ' + url
      });
    });
  }

  fetchAlertData() {
    const starttime = this.state.alertDaysBack * 60 * 60 * 24;
    const url = `${this.state.baseUrl}archivejson.cgi?query=alertlist&starttime=-${starttime}&endtime=%2B0`;
    //console.log('url', url);
    $.ajax({url}).done((myJson, textStatus, jqXHR) => {
      //console.log('fetchAlertData() ajax success');
      //console.log(myJson);
      //console.log(textStatus);
      //console.log(jqXHR);
      //console.log(jqXHR.getResponseHeader('content-type'));

      // test that return data is json
      if (jqXHR.getResponseHeader('content-type').indexOf('application/json') === -1) {
        console.log('fetchAlertData() ERROR: got response but result data is not JSON. Base URL setting is probably wrong.');
        this.setState({
          alertlistError: true,
          alertlistErrorMessage: 'ERROR: Result data is not JSON. Base URL setting is probably wrong.'
        });
        return;
      }

      // Make an array from the object
      const alertlist = myJson.data.alertlist.reverse();

      // trim
      if (alertlist.length > this.state.alertMaxItems) {
        alertlist.length = this.state.alertMaxItems;
      }

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
        alertlistErrorMessage: 'ERROR: ' + jqXHR.status +  ' ' + errorThrown + ' - ' + url
      });
    });
  }

  fetchCommentData() {
    const url = this.state.baseUrl + 'statusjson.cgi?query=commentlist&details=true';

    $.ajax({url}).done((myJson, textStatus, jqXHR) => {
      //console.log('ajax success');
      //console.log(data);

      // test that return data is json
      if (jqXHR.getResponseHeader('content-type').indexOf('application/json') === -1) {
        console.log('fetchCommentData() ERROR: got response but result data is not JSON. Base URL setting is probably wrong.');
        this.setState({
          commentlistError: true,
          commentlistErrorMessage: 'ERROR: Result data is not JSON. Base URL setting is probably wrong.'
        });
        return;
      }


      // Make an array from the object
      const commentlist = myJson.data.commentlist;
      this.setState({
        commentlistError: false,
        commentlistErrorMessage: '',
        commentlistLastUpdate: new Date().getTime(),
        commentlist // object
      });

    }).fail((jqXHR, textStatus, errorThrown) => {
      //console.log('ajax fail');
      //console.log(textStatus, errorThrown);
      this.setState({
        commentlistError: true,
        commentlistErrorMessage: 'ERROR: ' + jqXHR.status +  ' ' + errorThrown + ' - ' + url
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
    const settingsObject = {};
    this.settingsFields.forEach(field => settingsObject[field] = this.state[field]);

    let howManyServices = 0;
    if (this.state.servicelist) {
      Object.keys(this.state.servicelist).forEach((host) => {
        howManyServices += Object.keys(this.state.servicelist[host]).length;
      });
    }
    return (
      <div className="Base">

        <Settings
          baseUrl={this.state.baseUrl}
          baseUrlChanged={this.baseUrlChanged.bind(this)}
          settings={settingsObject}
          settingsFields={this.settingsFields}
          updateStateFromSettings={this.updateStateFromSettings.bind(this)}
        />

        {this.state.flynnEnabled && <div className="FlynnWrapper">
          <Flynn
            howManyDown={this.state.serviceProblemsArray.length}
            flynnConcernedAt={this.state.flynnConcernedAt}
            flynnAngryAt={this.state.flynnAngryAt}
            flynnBloodyAt={this.state.flynnBloodyAt}
            flynnCssScale={this.state.flynnCssScale}
          />
        </div>}

        <div className="HeaderArea">
          <div>
            <span className="ApplicationName">NagiosTV</span>
          </div>
        </div>

        <div className="FooterArea">
            
          <div>
            <span>Update every <span className="color-orange">{this.state.fetchFrequency}s</span> - </span>
            <span>Last Update: <span className="color-orange">{prettyDateTime(this.state.servicelistLastUpdate)}</span> - </span>
            <span>Version: <span className="color-orange">{this.state.currentVersionString}</span></span>
            {this.state.latestVersion > this.state.currentVersion && <span> - <span className="color-green">Update {this.state.latestVersionString} available</span></span>}
          </div>

        </div>

        <div style={{ marginTop: '55px' }} className="color-orange">Host Problems: {this.state.hostProblemsArray.length}</div>
        
        {this.state.hostlistError && <div className="margin-top-10 border-red color-red ServiceItem">{this.state.hostlistErrorMessage}</div>}

        {!this.state.hostlistError && this.state.hostProblemsArray.length === 0 && <div style={{ marginTop: '10px' }} className="color-green AllOkItem">
          All {Object.keys(this.state.hostlist).length} hosts are UP
        </div>}

        <HostItems
          hostProblemsArray={this.state.hostProblemsArray}
          commentlist={this.state.commentlist}
        />

        <div style={{ marginTop: '20px' }} className="color-orange">Service Problems: {this.state.serviceProblemsArray.length}</div>
        
        {this.state.servicelistError && <div className="margin-top-10 border-red color-red ServiceItem">{this.state.servicelistErrorMessage}</div>}

        {!this.state.servicelistError && this.state.serviceProblemsArray.length === 0 && <div className="margin-top-10 color-green AllOkItem">
          All {howManyServices} services are OK
        </div>}

        <ServiceItems
          serviceProblemsArray={this.state.serviceProblemsArray}
          commentlist={this.state.commentlist}
        />
        
        <div style={{ marginTop: '20px' }} className="color-orange margin-top-10">
        Alert History: {this.state.alertlist.length}
        </div>

        {this.state.alertlistError && <div className="margin-top-10 border-red color-red ServiceItem">{this.state.alertlistErrorMessage}</div>}

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
