/*eslint array-callback-return: "off"*/

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
import moment from 'moment';
import Checkbox from './widgets/Checkbox.jsx';
//import HowMany from './widgets/HowMany.jsx';
import HowManyEmoji from './widgets/HowManyEmoji.jsx';
import HistoryChart from './widgets/HistoryChart.jsx';

class Base extends Component {

  state = {
    showSettings: false,

    currentVersion: 22,
    currentVersionString: '0.3.1',
    latestVersion: 0,
    latestVersionString: '',
    lastVersionCheckTime: 0,

    isRemoteSettingsLoaded: false,
    isCookieLoaded: false, // I have this to render things only after cookie is loaded

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

    commentlistError: false,
    commentlistErrorMessage: '',
    commentlistLastUpdate: 0,
    commentlist: {},

    // add to settings?
    fetchFrequency: 15, // seconds
    fetchAlertFrequency: 60, // seconds

    hideFilters: true,
    
    // settings (defaults are set here also)
    titleString: 'NagiosTV',
    baseUrl: '/nagios/cgi-bin/',
    versionCheckDays: 1,
    alertDaysBack: 30,
    alertMaxItems: 1000,

    hideServiceWarning: false,
    hideServiceUnknown: false,
    hideServiceCritical: false,
    hideServiceAcked: false,
    hideServiceScheduled: false,
    hideServiceFlapping: false,

    serviceSortOrder: 'newest',

    hideHost: false,
    hideHostDown: false,
    hideHostUnreachable: false,
    hideHostDownPending: false,
    hideHostAcked: false,
    hideHostScheduled: false,
    hideHostFlapping: false,

    hostSortOrder: 'newest',

    // fun stuff
    flynnEnabled: false,
    flynnConcernedAt: 1,
    flynnAngryAt: 4,
    flynnBloodyAt: 8,
    flynnCssScale: '1',
    showEmoji: false
  };

  settingsFields = [
    'titleString',
    'baseUrl',
    'versionCheckDays',
    'alertDaysBack',
    'alertMaxItems',

    'hideServiceWarning',
    'hideServiceUnknown',
    'hideServiceCritical',
    'hideServiceAcked',
    'hideServiceScheduled',
    'hideServiceFlapping',

    'serviceSortOrder',

    'hideHost',
    'hideHostDown',
    'hideHostUnreachable',
    'hideHostDownPending',
    'hideHostAcked',
    'hideHostScheduled',
    'hideHostFlapping',

    'hostSortOrder',
  
    // fun stuff
    'flynnEnabled',
    'flynnConcernedAt',
    'flynnAngryAt',
    'flynnBloodyAt',
    'flynnCssScale',
    'showEmoji'
  ];

  constructor(props) {
    super(props);

    this.handleSelectChange = this.handleSelectChange.bind(this);
  }

  componentDidMount() {

    this.getRemoteSettings();
    //this.getCookie();
    
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
    // if someone turns off the version check, it should never check
    setTimeout(() => {
      // version check - run once on app boot
      if (this.state.versionCheckDays > 0) {
        this.versionCheck();
      }
      // version check - run every n days
      if (this.state.versionCheckDays > 0) {
        const intervalTime = this.state.versionCheckDays * 24 * 60 * 60 * 1000;
        // safety check that interval > 1hr
        if (intervalTime > (60 * 60 * 1000)) {
          setInterval(() => {
            this.versionCheck();
          }, intervalTime);
        } else {
          console.log('Invalid versionCheckDays. Not starting check interval.');
        }
      }
    }, 2000);
  }

  /* ************************************************************************************ */
  /* settings related functions such as fetching settings from server, and loading cookie */
  /* the approach I'm going to take with settings is to first load the settings from the server.
  either the settings load, or they fail. in either case I then check for cookie and apply 
  those over top. so cookie settings will override server settings. There will be a delete
  cookie button to help clear any local settings once server side settings become established. */
  /* ************************************************************************************ */

  getRemoteSettings() {
    const url = 'client-settings.json';

    //console.log('Requesting Service Data: ' + url);

    $.ajax({url}).done((myJson, textStatus, jqXHR) => {
      // console.log('getRemoteSettings() ajax success');
      // console.log(myJson);
      // console.log(textStatus);
      // console.log(jqXHR);

      // test that return data is json
      if (jqXHR.getResponseHeader('content-type').indexOf('application/json') === -1) {
        console.log('getRemoteSettings() parse ERROR: got response but result data is not JSON. Skipping server settings.');
        // this.setState({
        //   servicelistError: true,
        //   servicelistErrorMessage: 'ERROR: Result data is not JSON. Base URL setting is probably wrong.'
        // });
        this.getCookie();
        return;
      }

      // Got good server settings
      console.log('Found server default settings client-settings.json - Loading default settings:', myJson);
      // load them
      this.settingsFields.forEach(setting => this.updateIfExist(myJson, setting));
      this.setState({ isRemoteSettingsLoaded: true });

      this.getCookie();

    }).catch((err) => {
      console.log('getRemoteSettings() ajax ERROR:', err);
      console.log('Skipping server settings.');
      this.getCookie();
    });
  }

  updateIfExist(cookieObject, prop) {
    if (cookieObject.hasOwnProperty(prop)) {
      //console.log('setting state on ' + prop +' to ', cookieObject[prop]);
      this.setState({ [prop]: cookieObject[prop] });
    }
  }

  getCookie() {
    const cookie = Cookie.get('settings');
    //console.log('settings Cookie is', cookie);
    if (!cookie) { return; }

    let cookieObject = {};
    try {
      cookieObject = JSON.parse(cookie);
      //console.log('Got coookie', cookieObject);
    } catch (e) {
      //console.log('No cookie');
    }
    // const updateIfExist = (prop) => {
    //   if (cookieObject.hasOwnProperty(prop)) {
    //     //console.log('setting state on ' + prop +' to ', cookieObject[prop]);
    //     this.setState({ [prop]: cookieObject[prop] });
    //   }
    // };
    if (cookieObject) {
      console.log('Found cookie. Loading settings:', cookieObject);
      this.settingsFields.forEach(setting => this.updateIfExist(cookieObject, setting));
      this.setState({ isCookieLoaded: true });
    }
  }

  // this is a function we pass down to the settings component to allow it to modify state here at Base.jsx
  updateStateFromSettings(settingsObject) {
    this.setState({
      ...settingsObject
    });
  }

  fetchServiceData() {
    const url = this.state.baseUrl + 'statusjson.cgi?query=servicelist&details=true';

    //console.log('Requesting Service Data: ' + url);

    $.ajax({url}).done((myJson, textStatus, jqXHR) => {
      // console.log('fetchServiceData() ajax success');
      // console.log(myJson);
      // console.log(textStatus);
      // console.log(jqXHR);

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
      let serviceProblemsArray = [];

      if (servicelist) {
        Object.keys(servicelist).map((k) => {
          Object.keys(servicelist[k]).map((l) => {
            // if service status is NOT OK
            // or service is flapping,
            // we add it to the array
            if (servicelist[k][l].status !== 2 ||
              servicelist[k][l].is_flapping) {
              // add it to the array of service problems
              serviceProblemsArray.push(servicelist[k][l]);
            }
          });
        });
      }

      // sort the service problems list by last ok, newest first
      // TODO: this only updates on the fetch interval.. so when the user changes it
      // they do not see the sort order change for a few seconds.
      // It might be nice to decouple it
      let sort = 1;
      if (this.state.serviceSortOrder === 'oldest') { sort = -1; }
      serviceProblemsArray = serviceProblemsArray.sort((a, b) => {
        if (a.last_time_ok < b.last_time_ok) { return 1 * sort; }
        if (a.last_time_ok > b.last_time_ok) { return -1 * sort; }
        return 0;
      });

      // check for old data (nagios down?)
      const duration = moment.duration(new Date().getTime() - myJson.result.last_data_update);
      const hours = duration.asHours().toFixed(1);

      if (hours >= 1) {
        this.setState({
          servicelistError: true,
          servicelistErrorMessage: `Data is stale ${hours} hours. Is Nagios running?`,
          servicelistLastUpdate: new Date().getTime(),
          servicelist,
          serviceProblemsArray: serviceProblemsArray
        });
      } else {
        this.setState({
          servicelistError: false,
          servicelistErrorMessage: '',
          servicelistLastUpdate: new Date().getTime(),
          servicelist,
          serviceProblemsArray: serviceProblemsArray
        });
      }
        

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
      let hostProblemsArray = [];

      if (hostlist) {
        Object.keys(hostlist).map((k) => {
          // if host status is NOT UP
          // or host is flapping,
          // we add it to the array
          if (hostlist[k].status !== 2 || hostlist[k].is_flapping) {
            hostProblemsArray.push(hostlist[k]);
          }
        });
      }

      // sort the service problems list by last ok, newest first
      // TODO: this only updates on the fetch interval.. so when the user changes it
      // they do not see the sort order change for a few seconds.
      // It might be nice to decouple it
      let sort = 1;
      if (this.state.hostSortOrder === 'oldest') { sort = -1; }
      hostProblemsArray = hostProblemsArray.sort((a, b) => {
        if (a.last_time_up < b.last_time_up) { return 1 * sort; }
        if (a.last_time_up > b.last_time_up) { return -1 * sort; }
        return 0;
      });

      // check for old data (nagios down?)
      const duration = moment.duration(new Date().getTime() - myJson.result.last_data_update);
      const hours = duration.asHours().toFixed(1);

      if (hours >= 1) {
        this.setState({
          hostlistError: true,
          hostlistErrorMessage: `Data is stale ${hours} hours. Is Nagios running?`,
          hostlistLastUpdate: new Date().getTime(),
          hostlist,
          hostProblemsArray: hostProblemsArray
        });
      } else {
        this.setState({
          hostlistError: false,
          hostlistErrorMessage: '',
          hostlistLastUpdate: new Date().getTime(),
          hostlist,
          hostProblemsArray: hostProblemsArray
        });
      }

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
    // if the last version check was recent then do not check again
    // this prevents version checks if you refresh the UI over and over
    // as is common on TV rotation
    const lastVersionCheckTime = Cookie.get('lastVersionCheckTime');
    //console.log('lastVersionCheckTime is', lastVersionCheckTime);

    const oneDayInSeconds = (86400 - 3600) * 1000;
    if (lastVersionCheckTime !== 0) {
      const diff = new Date().getTime() - lastVersionCheckTime;
      if (diff < oneDayInSeconds) {
        console.log('Not performing version check since it was done ' + (diff/1000).toFixed(0) + ' seconds ago');
        return;
      }
    }

    const url = 'https://chriscarey.com/software/nagiostv-react/version/json/?version=' + this.state.currentVersionString;
    fetch(url)
      .then((response) => {
        if (response.status === 200) {
          return response.json();
        }
      })
      .then((myJson) => {
        console.log(`Latest NagiosTV release is ${myJson.version_string} (r${myJson.version}). You are running ${this.state.currentVersionString} (r${this.state.currentVersion})`);

        this.setState({
          latestVersion: myJson.version,
          latestVersionString: myJson.version_string,
          lastVersionCheckTime: new Date().getTime()
        }, () => {
          
          Cookie.set('lastVersionCheckTime', new Date().getTime());
        });
      })
  }

  handleChange = (propName, dataType) => (event) => {
    // console.log('handleChange Base.jsx');
    // console.log(propName, dataType);
    // console.log('event.target', event.target);
    // console.log('event.target.checked', event.target.checked);
    // console.log(this.state[propName]);
    // console.log('value', event.target.value);
    // console.log('checked', event.target.checked);

    //event.preventDefault();
    // we put this to solve the bubble issue where the click goes through the label then to the checkbox
    if (typeof event.target.checked === 'undefined') { return; }

    let val = '';
    if (dataType === 'checkbox') {
      val = (!event.target.checked);
    } else {
      val = event.target.value;
    }
    // Save to state
    //console.log('setting state ' + propName + ' to ', val);
    this.setState({
      [propName]: val
    }, () => {
      // Save to cookie AFTER state is set
      this.saveCookie();
    });
  }

  handleSelectChange(event) {
    // console.log('handleSelectChange Base.jsx');
    // console.log(event);
    // console.log(event.target.getAttribute('varname'));
    // console.log('event.target.value', event.target.value);
    const varname = event.target.getAttribute('varname');
    this.setState({
      [varname]: event.target.value
    }, () => {
      // Save to cookie AFTER state is set
      this.saveCookie();
    });
  }

  saveCookie() {
    const cookieObject = {};
    this.settingsFields.forEach(field => cookieObject[field] = this.state[field]);
    Cookie.set('settings', cookieObject);
    //console.log('saved cookie', cookieObject);
  }

  render() {

    // populate settingsObject with all the settingsFields values (essentially, a subset of all the items in react state)
    const settingsObject = {};
    this.settingsFields.forEach(field => settingsObject[field] = this.state[field]);

    // count how many items in each of the service states
    let howManyServices = 0;
    let howManyServiceWarning = 0;
    let howManyServiceUnknown = 0;
    let howManyServiceCritical = 0;
    let howManyServiceAcked = 0;
    let howManyServiceScheduled = 0;
    let howManyServiceFlapping = 0;

    if (this.state.servicelist) {
      Object.keys(this.state.servicelist).forEach((host) => {
        howManyServices += Object.keys(this.state.servicelist[host]).length;
        Object.keys(this.state.servicelist[host]).forEach((service) => {
          if (this.state.servicelist[host][service].status === 4) {
            howManyServiceWarning++;
          }
          if (this.state.servicelist[host][service].status === 8) {
            howManyServiceUnknown++;
          }
          if (this.state.servicelist[host][service].status === 16) {
            howManyServiceCritical++;
          }
          if (this.state.servicelist[host][service].problem_has_been_acknowledged) {
            howManyServiceAcked++;
          }
          if (this.state.servicelist[host][service].scheduled_downtime_depth > 0) {
            howManyServiceScheduled++;
          }
          if (this.state.servicelist[host][service].is_flapping) {
            howManyServiceFlapping++;
          }
        });
      });
    }

    // count how many items in each of the host states
    const howManyHosts = Object.keys(this.state.hostlist).length;
    let howManyHostUp = 0;
    let howManyHostDown = 0;
    let howManyHostUnreachable = 0;
    let howManyHostPending = 0;
    let howManyHostAcked = 0;
    let howManyHostScheduled = 0;
    let howManyHostFlapping = 0;

    if (this.state.hostlist) {
      Object.keys(this.state.hostlist).forEach((host) => {

        if (this.state.hostlist[host].status === 4) {
          howManyHostDown++;
        }
        if (this.state.hostlist[host].status === 8) {
          howManyHostUnreachable++;
        }
        if (this.state.hostlist[host].status === 16) {
          howManyHostPending++;
        }
        if (this.state.hostlist[host].problem_has_been_acknowledged) {
          howManyHostAcked++;
        }
        if (this.state.hostlist[host].scheduled_downtime_depth > 0) {
          howManyHostScheduled++;
        }
        if (this.state.hostlist[host].is_flapping) {
          howManyHostFlapping++;
        }
      });
    }

    const settingsLoaded = this.state.isRemoteSettingsLoaded || this.state.isCookieLoaded;

    // don't show the history chart on small screens like iphone
    const showHistoryChart = window.innerWidth > 500;

    return (
      <div className="Base">

        {/* settings */}

        <Settings
          baseUrl={this.state.baseUrl}
          baseUrlChanged={this.baseUrlChanged.bind(this)}
          settings={settingsObject}
          settingsFields={this.settingsFields}
          updateStateFromSettings={this.updateStateFromSettings.bind(this)}
        />

        {/* flynn */}

        {this.state.flynnEnabled && <div className="FlynnWrapper">
          <Flynn
            howManyDown={this.state.serviceProblemsArray.length}
            flynnConcernedAt={this.state.flynnConcernedAt}
            flynnAngryAt={this.state.flynnAngryAt}
            flynnBloodyAt={this.state.flynnBloodyAt}
            flynnCssScale={this.state.flynnCssScale}
          />
        </div>}

        {/* header */}

        <div className="HeaderArea">
          <div className="ApplicationName">{this.state.titleString}</div>
          
          {/*<div className="color-gray">
            <strong>{howManyHosts}</strong> hosts{' '}
            (<strong>{this.state.hostProblemsArray.length}</strong> problems)
            {', '}
            <strong>{howManyServices}</strong> services{' '}
            (<strong>{this.state.serviceProblemsArray.length}</strong> problems)
          </div>*/}
        </div>

        {/* footer */}

        <div className="FooterArea">
          <div className="FooterAreaLeft">
            <Checkbox className="Checkbox warning"
              handleChange={this.handleChange}
              stateName={'hideFilters'}
              defaultChecked={!this.state.hideFilters}
              howManyText={'Show Filters'}
            />
          </div>
          <div className="FooterAreaRight">Settings</div>
          <div>
            <span>Update every <span className="color-orange">{this.state.fetchFrequency}s</span> - </span>
            <span>Last Update: <span className="color-orange">{prettyDateTime(this.state.servicelistLastUpdate)}</span></span><br />
            <span>NagiosTV <span className="color-orange">v{this.state.currentVersionString}</span></span>
            {this.state.latestVersion > this.state.currentVersion && <span> <span className="update-available">NagiosTV v{this.state.latestVersionString} available</span></span>}
          </div>
        </div>

        {/* spacer to counteract the floating header */}

        <div style={{ marginTop: '60px' }}>
        </div>

        {/*<div style={{ marginTop: '15px' }}>
        Summary Area
        </div>*/}

        {/* hosts */}

        {settingsLoaded && <div className="service-summary color-orange">
          
          <span className="service-summary-title">
            <strong>{howManyHosts}</strong> host{howManyHosts.length === 1 ? '' : 's'}{' '}   
            {howManyHostDown > 0 && <span className="service-summary-label service-summary-critical">{howManyHostDown} DOWN</span>}
            {this.state.showEmoji && <HowManyEmoji
              howMany={howManyHosts}
              howManyWarning={0}
              howManyCritical={howManyHostDown}
              howManyDown={this.state.hostProblemsArray.length}
            />}
          </span>

          

          {!this.state.hideFilters && <div className="service-hide-problems">

            <select value={this.state.hostSortOrder} varname={'hostSortOrder'} onChange={this.handleSelectChange}>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>

            <Checkbox className="Checkbox all"
              handleChange={this.handleChange}
              stateName={'hideHost'}
              defaultChecked={!this.state.hideHost}
              howMany={howManyHosts}
              howManyText={'ALL'}
            />

            <Checkbox className="Checkbox down"
              handleChange={this.handleChange}
              stateName={'hideHostDown'}
              defaultChecked={!this.state.hideHostDown}
              howMany={howManyHostDown}
              howManyText={'DOWN'}
            />

            <Checkbox className="Checkbox unreachable"
              handleChange={this.handleChange}
              stateName={'hideHostUnreachable'}
              defaultChecked={!this.state.hideHostUnreachable}
              howMany={howManyHostUnreachable}
              howManyText={'UNREACHABLE'}
            />

            <Checkbox className="Checkbox pending"
              handleChange={this.handleChange}
              stateName={'hideHostPending'}
              defaultChecked={!this.state.hideHostPending}
              howMany={howManyHostPending}
              howManyText={'PENDING'}
            />

            <Checkbox className="Checkbox acked"
              handleChange={this.handleChange}
              stateName={'hideHostAcked'}
              defaultChecked={!this.state.hideHostAcked}
              howMany={howManyHostAcked}
              howManyText={'ACKED'}
            />

            <Checkbox className="Checkbox scheduled"
              handleChange={this.handleChange}
              stateName={'hideHostScheduled'}
              defaultChecked={!this.state.hideHostScheduled}
              howMany={howManyHostScheduled}
              howManyText={'SCHEDULED'}
            />

            <Checkbox className="Checkbox flapping"
              handleChange={this.handleChange}
              stateName={'hideHostFlapping'}
              defaultChecked={!this.state.hideHostFlapping}
              howMany={howManyHostFlapping}
              howManyText={'FLAPPING'}
            />

          </div>}

        </div>}
        
        {this.state.hostlistError && <div className="margin-top-10 border-red color-red ServiceItem">{this.state.hostlistErrorMessage}</div>}

        <HostItems
          hostProblemsArray={this.state.hostProblemsArray}
          commentlist={this.state.commentlist}
          settings={settingsObject}

          howManyHosts={howManyHosts}
          howManyHostUp={howManyHostUp}
          howManyHostDown={howManyHostDown}
          howManyHostUnreachable={howManyHostUnreachable}
          howManyHostPending={howManyHostPending}
          howManyHostAcked={howManyHostAcked}
          howManyHostScheduled={howManyHostScheduled}
          howManyHostFlapping={howManyHostFlapping}
        />

        {/* services */}

        {settingsLoaded && <div className="service-summary color-orange" style={{ marginTop: '12px'}}>
          
          <span className="service-summary-title">
            <strong>{howManyServices}</strong> service{howManyServices === 1 ? '' : 's'}{' '}
            {howManyServiceCritical > 0 && <span className="service-summary-label service-summary-critical">{howManyServiceCritical} CRITICAL</span>}
            {howManyServiceWarning > 0 && <span className="service-summary-label service-summary-warning">{howManyServiceWarning} WARNING</span>}
            {this.state.showEmoji && <HowManyEmoji
              howMany={howManyServices}
              howManyWarning={howManyServiceWarning}
              howManyCritical={howManyServiceCritical}
              howManyDown={this.state.serviceProblemsArray.length}
            />}
          </span>


          {!this.state.hideFilters && <div className="service-hide-problems">

            <select value={this.state.serviceSortOrder} varname={'serviceSortOrder'} onChange={this.handleSelectChange}>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>

            <Checkbox className="Checkbox warning"
              handleChange={this.handleChange}
              stateName={'hideServiceWarning'}
              defaultChecked={!this.state.hideServiceWarning}
              howMany={howManyServiceWarning}
              howManyText={'WARNING'}
            />

            <Checkbox className="Checkbox unknown"
              handleChange={this.handleChange}
              stateName={'hideServiceUnknown'}
              defaultChecked={!this.state.hideServiceUnknown}
              howMany={howManyServiceUnknown}
              howManyText={'UNKNOWN'}
            />

            <Checkbox className="Checkbox critical"
              handleChange={this.handleChange}
              stateName={'hideServiceCritical'}
              defaultChecked={!this.state.hideServiceCritical}
              howMany={howManyServiceCritical}
              howManyText={'CRITICAL'}
            />

            <Checkbox className="Checkbox acked"
              handleChange={this.handleChange}
              stateName={'hideServiceAcked'}
              defaultChecked={!this.state.hideServiceAcked}
              howMany={howManyServiceAcked}
              howManyText={'ACKED'}
            />

            <Checkbox className="Checkbox scheduled"
              handleChange={this.handleChange}
              stateName={'hideServiceScheduled'}
              defaultChecked={!this.state.hideServiceScheduled}
              howMany={howManyServiceScheduled}
              howManyText={'SCHEDULED'}
            />

            <Checkbox className="Checkbox flapping"
              handleChange={this.handleChange}
              stateName={'hideServiceFlapping'}
              defaultChecked={!this.state.hideServiceFlapping}
              howMany={howManyServiceFlapping}
              howManyText={'FLAPPING'}
            />

          </div>}

        </div>}
        
        {this.state.servicelistError && <div className="margin-top-10 border-red color-red ServiceItem">{this.state.servicelistErrorMessage}</div>}

        <ServiceItems
          serviceProblemsArray={this.state.serviceProblemsArray}
          commentlist={this.state.commentlist}
          settings={settingsObject}

          howManyServices={howManyServices}
          howManyServiceWarning={howManyServiceWarning}
          howManyServiceUnknown={howManyServiceUnknown}
          howManyServiceCritical={howManyServiceCritical}
          howManyServiceAcked={howManyServiceAcked}
          howManyServiceScheduled={howManyServiceScheduled}
          howManyServiceFlapping={howManyServiceFlapping}
        />
        
        {/* history (alertlist) */}

        {/* <div className="history-spacer"></div> */}

        <div className="history-summary color-orange margin-top-10">
          <span className="service-summary-title">
            <strong>History: {this.state.alertlist.length}</strong> alerts in the past <strong>{this.state.alertDaysBack}</strong> days
          </span>
        </div>

        {showHistoryChart && <HistoryChart
          alertlist={this.state.alertlist}
          alertDaysBack={this.state.alertDaysBack} 
          alertlistLastUpdate={this.state.alertlistLastUpdate}
        />}

        {this.state.alertlistError && <div className="margin-top-10 border-red color-red ServiceItem">{this.state.alertlistErrorMessage}</div>}

        {!this.state.alertlistError && this.state.alertlist.length === 0 && <div className="margin-top-10 color-green AllOkItem">
          No alerts
        </div>}

        <AlertItems items={this.state.alertlist} showEmoji={this.state.showEmoji} />

        <br />
        <br />
        <br />
        
      </div>
    );
  }
}

export default Base;
