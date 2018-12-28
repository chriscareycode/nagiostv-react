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

class Base extends Component {

  state = {
    showSettings: false,

    currentVersion: 15,
    currentVersionString: '0.2.4',
    latestVersion: 0,
    latestVersionString: '',

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
    
    // settings (defaults are set here also)
    titleString: 'NagiosTV',
    baseUrl: '/nagios/cgi-bin/',
    versionCheckDays: 1,
    alertDaysBack: 7,
    alertMaxItems: 1000,
    // optionally hide some items
    hideAckedProblems: false,
    hideDowntimeProblems: false,

    hideServiceWarning: false,
    hideServiceUnknown: false,
    hideServiceCritical: false,
    hideServiceAcked: false,
    hideServiceScheduled: false,
    hideServiceFlapping: false,

    hideHostDown: false,
    hideHostUnreachable: false,
    hideHostDownPending: false,
    hideHostAcked: false,
    hideHostScheduled: false,
    hideHostFlapping: false,

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
    // optionally hide some items
    'hideAckedProblems',
    'hideDowntimeProblems',

    'hideServiceWarning',
    'hideServiceUnknown',
    'hideServiceCritical',
    'hideServiceAcked',
    'hideServiceScheduled',
    'hideServiceFlapping',

    'hideHostDown',
    'hideHostUnreachable',
    'hideHostDownPending',
    'hideHostAcked',
    'hideHostScheduled',
    'hideHostFlapping',
  
    // fun stuff
    'flynnEnabled',
    'flynnConcernedAt',
    'flynnAngryAt',
    'flynnBloodyAt',
    'flynnCssScale',
    'showEmoji'
  ];

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

  getCookie() {
    const cookie = Cookie.get('settings');
    let cookieObject = {};
    try {
      cookieObject = JSON.parse(cookie);
      //console.log('Got coookie', cookieObject);
    } catch (e) {
      //console.log('No cookie');
    }
    const updateIfExist = (prop) => {
      if (cookieObject.hasOwnProperty(prop)) {
        //console.log('setting state on ' + prop +' to ', cookieObject[prop]);
        this.setState({ [prop]: cookieObject[prop] });
      }
    };
    if (cookieObject) {
      this.settingsFields.forEach(setting => updateIfExist(setting));
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
      const serviceProblemsArray = [];

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
      const hostProblemsArray = [];

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
    const url = 'https://chriscarey.com/software/nagiostv-react/version/json/?version=' + this.state.currentVersionString;
    fetch(url)
      .then((response) => {
        //console.log(response);
        if (response.status === 200) {
          //this.setState({alertlistError: false, alertlistErrorMessage: ''});
          return response.json();
        }
      })
      .then((myJson) => {

        console.log(`Latest NagiosTV release is ${myJson.version_string} (r${myJson.version}). You are running ${this.state.currentVersionString} (r${this.state.currentVersion})`);
        //console.log(myJson);

        this.setState({
          latestVersion: myJson.version,
          latestVersionString: myJson.version_string
        });
      })
  }

  handleChange = (propName, dataType) => (event) => {
    // console.log('handleChange Base.jsx');
    // console.log(propName, dataType);
    // console.log('event.target', event.target);
    // console.log('event.target.checked', event.target.checked);
    //console.log(this.state[propName]);
    //console.log('value', event.target.value);
    //console.log('checked', event.target.checked);

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
    let howManyServiceDowntime = 0;
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
            howManyServiceDowntime++;
          }
          if (this.state.servicelist[host][service].is_flapping) {
            howManyHostFlapping++;
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
    let howManyHostDowntime = 0;
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
          howManyHostDowntime++;
        }
        if (this.state.hostlist[host].is_flapping) {
          howManyHostFlapping++;
        }
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
            <span className="ApplicationName">{this.state.titleString}</span>
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

        <div style={{ marginTop: '55px' }}>
        </div>

        {this.state.isCookieLoaded && <div className="service-summary color-orange">
          
          <strong>{howManyHosts}</strong> hosts{' '}
          (<strong>{this.state.hostProblemsArray.length}</strong> problems)
          
          <div className="service-hide-problems">

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
              howMany={howManyHostDowntime}
              howManyText={'SCHEDULED'}
            />

            <Checkbox className="Checkbox flapping"
              handleChange={this.handleChange}
              stateName={'hideHostFlapping'}
              defaultChecked={!this.state.hideHostFlapping}
              howMany={howManyHostFlapping}
              howManyText={'FLAPPING'}
            />

          </div>
        </div>}
        
        {this.state.hostlistError && <div className="margin-top-10 border-red color-red ServiceItem">{this.state.hostlistErrorMessage}</div>}

        {this.state.hostProblemsArray.length === 0 && <div style={{ marginTop: '10px' }} className="color-green AllOkItem">
          All {Object.keys(this.state.hostlist).length} hosts are UP
        </div>}

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
          howManyHostDowntime={howManyHostDowntime}
          howManyHostFlapping={howManyHostFlapping}
        />

        {this.state.isCookieLoaded && <div className="service-summary color-orange">
          
          <strong>{howManyServices}</strong> services{' '}
          (<strong>{this.state.serviceProblemsArray.length}</strong> problems)
          
          <div className="service-hide-problems">

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
              howMany={howManyServiceDowntime}
              howManyText={'SCHEDULED'}
            />

            <Checkbox className="Checkbox flapping"
              handleChange={this.handleChange}
              stateName={'hideServiceFlapping'}
              defaultChecked={!this.state.hideServiceFlapping}
              howMany={howManyServiceFlapping}
              howManyText={'FLAPPING'}
            />

          </div>
        </div>}
        
        {this.state.servicelistError && <div className="margin-top-10 border-red color-red ServiceItem">{this.state.servicelistErrorMessage}</div>}

        {this.state.serviceProblemsArray.length === 0 && <div className="margin-top-10 color-green AllOkItem">
          All {howManyServices} services are OK
        </div>}

        <ServiceItems
          serviceProblemsArray={this.state.serviceProblemsArray}
          commentlist={this.state.commentlist}
          settings={settingsObject}

          howManyServices={howManyServices}
          howManyServiceWarning={howManyServiceWarning}
          howManyServiceUnknown={howManyServiceUnknown}
          howManyServiceCritical={howManyServiceCritical}
          howManyServiceAcked={howManyServiceAcked}
          howManyServiceDowntime={howManyServiceDowntime}
          howManyServiceFlapping={howManyServiceFlapping}
        />
        
        <div style={{ marginTop: '20px' }} className="color-orange margin-top-10">
        Alert History: {this.state.alertlist.length}
        </div>

        {this.state.alertlistError && <div className="margin-top-10 border-red color-red ServiceItem">{this.state.alertlistErrorMessage}</div>}

        {!this.state.alertlistError && this.state.alertlist.length === 0 && <div className="margin-top-10 color-green AllOkItem">
          No alerts
        </div>}

        <AlertItems items={this.state.alertlist} showEmoji={this.state.showEmoji} />

        <br />
        <br />
      </div>
    );
  }
}

export default Base;
