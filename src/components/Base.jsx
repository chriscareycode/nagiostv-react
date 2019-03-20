/*eslint array-callback-return: "off"*/
import React, { Component } from 'react';
import HostItems from './hosts/HostItems.jsx';
import ServiceItems from './services/ServiceItems.jsx';
import AlertItems from './alerts/AlertItems.jsx';
import { prettyDateTime } from '../helpers/moment.js';
import { translate } from '../helpers/language';
import { convertHostObjectToArray, convertServiceObjectToArray } from '../helpers/nagiostv';
import Flynn from './Flynn/Flynn.jsx';
import Settings from './Settings.jsx';
import Checkbox from './widgets/Checkbox.jsx';
import HowManyEmoji from './widgets/HowManyEmoji.jsx';
import HistoryChart from './widgets/HistoryChart.jsx';
import Demo from './Demo.jsx';
// css
import './Base.css';
import './animation.css';
// 3rd party addons
import moment from 'moment';
import Cookie from 'js-cookie';
import $ from 'jquery';

class Base extends Component {

  // use fake sample data if we are doing local development
  useFakeSampleData = false;

  state = {
    showSettings: false,

    currentVersion: 28,
    currentVersionString: '0.3.7',
    latestVersion: 0,
    latestVersionString: '',
    lastVersionCheckTime: 0,

    isRemoteSettingsLoaded: false,
    isCookieLoaded: false, // I have this to render things only after cookie is loaded
    isDoneLoading: false,

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
    alertlistCount: 0,

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

    hideServicePending: false,
    hideServiceWarning: false,
    hideServiceUnknown: false,
    hideServiceCritical: false,
    hideServiceAcked: false,
    hideServiceScheduled: false,
    hideServiceFlapping: false,

    serviceSortOrder: 'newest',

    hideHostPending: false,
    hideHostDown: false,
    hideHostUnreachable: false,
    hideHostAcked: false,
    hideHostScheduled: false,
    hideHostFlapping: false,

    hostSortOrder: 'newest',

    language: 'English',
    
    isDemoMode: false,

    // fun stuff
    flynnEnabled: false,
    flynnConcernedAt: 1,
    flynnAngryAt: 4,
    flynnBloodyAt: 8,
    flynnCssScale: '0.8',
    showEmoji: false,
    speakItems: false,
    speakItemsVoice: '',
    playSoundEffects: false,
    soundEffectCritical: './sample-audio/critical.mp3',
    soundEffectWarning: './sample-audio/warning.mp3',
    soundEffectOk: './sample-audio/ok.mp3'
  };

  // The settings which we persist are a subset of the state that we have above.
  // Here we list all the settings we want to persist to cookie / client-settings
  settingsFields = [
    'titleString',
    'baseUrl',
    'alertDaysBack',
    'alertMaxItems',

    'hideServicePending',
    'hideServiceWarning',
    'hideServiceUnknown',
    'hideServiceCritical',
    'hideServiceAcked',
    'hideServiceScheduled',
    'hideServiceFlapping',

    'serviceSortOrder',

    'hideHostPending',
    'hideHostDown',
    'hideHostUnreachable',
    'hideHostAcked',
    'hideHostScheduled',
    'hideHostFlapping',

    'hostSortOrder',
    
    'versionCheckDays',
    'language',

    // fun stuff
    'flynnEnabled',
    'flynnConcernedAt',
    'flynnAngryAt',
    'flynnBloodyAt',
    'flynnCssScale',
    'showEmoji',
    'speakItems',
    'speakItemsVoice',
    'playSoundEffects',
    'soundEffectCritical',
    'soundEffectWarning',
    'soundEffectOk'
  ];

  constructor(props) {
    super(props);

    // Bind functions
    this.updateStateFromSettings = this.updateStateFromSettings.bind(this);
    this.handleSelectChange = this.handleSelectChange.bind(this);
    this.toggleSettings = this.toggleSettings.bind(this);

    // turn on demo mode if ?demo=true
    const urlParams = new URLSearchParams(window.location.search);
    const isDemoMode = urlParams.get('demo') === 'true';
    this.state.isDemoMode = isDemoMode;
    if (isDemoMode) {
      this.useFakeSampleData = true;
    }
  }

  componentDidMount() {

    // Load Remote Settings - then it calls the loadCookie routine
    this.getRemoteSettings();
    
    //this.toggleSettings(); //open settings box by default (for local development)

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

    // this is not super clean but I'm going to delay this by 3s to give the setState() in the getCookie()
    // time to complete. It's async so we could have a race condition getting the version check setting
    // to arrive in this.state.versionCheckDays
    // if someone turns off the version check, it should never check
    setTimeout(() => {
      const versionCheckDays = this.state.versionCheckDays;
      if (versionCheckDays && versionCheckDays > 0) {
        // version check - run once on app boot
        this.versionCheck();
        // version check - run every n days
        const intervalTime = versionCheckDays * 24 * 60 * 60 * 1000;
        // safety check that interval > 1hr
        if (intervalTime !== 0 && intervalTime > (60 * 60 * 1000)) {
          setInterval(() => {
            this.versionCheck();
          }, intervalTime);
        } else {
          console.log('Invalid versionCheckDays. Not starting check interval.');
        }
      }
    }, 3000);
  }

  /* ************************************************************************************ */
  /* settings related functions such as fetching settings from server, and loading cookie
  the approach I'm going to take with settings is to first load the settings from the server.
  either the settings load, or they fail. in either case I then check for cookie and apply 
  those over top. so cookie settings will override server settings. There will be a delete
  cookie button to help clear any local settings once server side settings become established. */
  /* ************************************************************************************ */

  getRemoteSettings() {
    const url = 'client-settings.json';

    $.ajax({url}).done((myJson, textStatus, jqXHR) => {

      // test that return data is json
      if (jqXHR.getResponseHeader('content-type').indexOf('application/json') === -1) {
        console.log('getRemoteSettings() parse ERROR: got response but result data is not JSON. Skipping server settings.');
        
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

  getCookie() {
    const cookie = Cookie.get('settings');
    //console.log('settings Cookie is', cookie);
    if (!cookie) {
      this.setState({ isDoneLoading: true });
      return;
    }

    let cookieObject = {};
    try {
      cookieObject = JSON.parse(cookie);
      //console.log('Got coookie', cookieObject);
    } catch (e) {
      //console.log('No cookie');
    }
    if (cookieObject) {
      console.log('Found cookie. Loading settings:', cookieObject);
      this.settingsFields.forEach(setting => this.updateIfExist(cookieObject, setting));
      this.setState({ isCookieLoaded: true });
    }

    this.setState({ isDoneLoading: true });
  }

  versionCheck() {
    // if the last version check was recent then do not check again
    // this prevents version checks if you refresh the UI over and over
    // as is common on TV rotation
    const lastVersionCheckTime = Cookie.get('lastVersionCheckTime');
    const nowTime = new Date().getTime();

    const twentyThreeHoursInSeconds = (86400 - 3600) * 1000;
    if (lastVersionCheckTime !== 0) {
      const diff = nowTime - lastVersionCheckTime;
      if (diff < twentyThreeHoursInSeconds) {
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
          lastVersionCheckTime: nowTime
        }, () => {
          // after state is set, set the cookie
          Cookie.set('lastVersionCheckTime', nowTime);
        });
      })
      .catch(err => {
        console.log('There was some error with the version check', err);
      });
  }

  /****************************************************************************
   *
   * Functions to Fetch Data
   *
   ***************************************************************************/

  fetchServiceData() {

    let url;
    if (this.useFakeSampleData) {
      url = '/sample-data/servicelist.json';
    } else {
      url = this.state.baseUrl + 'statusjson.cgi?query=servicelist&details=true';
    }
    //console.log('Requesting Service Data: ' + url);

    $.ajax({url}).done((myJson, textStatus, jqXHR) => {

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
      
      const serviceProblemsArray = convertServiceObjectToArray(servicelist, this.state.serviceSortOrder);

      // check for old stale data (detect if nagios is down)
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
    let url;
    if (this.useFakeSampleData) {
      url = '/sample-data/hostlist.json';
    } else {
      url = this.state.baseUrl + 'statusjson.cgi?query=hostlist&details=true';
    }

    $.ajax({url}).done((myJson, textStatus, jqXHR) => {

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

      const hostProblemsArray = convertHostObjectToArray(hostlist, this.state.hostSortOrder);

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
      this.setState({
        hostlistError: true,
        hostlistErrorMessage: 'ERROR: ' + jqXHR.status +  ' ' + errorThrown + ' - ' + url
      });
    });
  }

  fetchAlertData() {
    const starttime = this.state.alertDaysBack * 60 * 60 * 24;
    const url = `${this.state.baseUrl}archivejson.cgi?query=alertlist&starttime=-${starttime}&endtime=%2B0`;

    $.ajax({url}).done((myJson, textStatus, jqXHR) => {

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

      // store the actual count of alert list items before we trim
      const alertlistCount = myJson.data.alertlist.length;

      // trim
      if (alertlist.length > this.state.alertMaxItems) {
        alertlist.length = this.state.alertMaxItems;
      }

      this.setState({
        alertlistError: false,
        alertlistErrorMessage: '',
        alertlistLastUpdate: new Date().getTime(),
        alertlist, // it's already an array
        alertlistCount
      });

    }).fail((jqXHR, textStatus, errorThrown) => {
      this.setState({
        alertlistError: true,
        alertlistErrorMessage: 'ERROR: ' + jqXHR.status +  ' ' + errorThrown + ' - ' + url
      });
    });
  }

  fetchCommentData() {
    const url = this.state.baseUrl + 'statusjson.cgi?query=commentlist&details=true';

    $.ajax({url}).done((myJson, textStatus, jqXHR) => {

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
      this.setState({
        commentlistError: true,
        commentlistErrorMessage: 'ERROR: ' + jqXHR.status +  ' ' + errorThrown + ' - ' + url
      });
    });
  }

  /****************************************************************************
   *
   * Functions to various things?
   *
   ***************************************************************************/

  baseUrlChanged(event) {
    this.setState({ baseUrl: event.target.value });
  }

  showSettings() {
    this.setState({ showSettings: true });
  }

  hideSettings() {
    this.setState({ showSettings: false });
  }

  

  /****************************************************************************
   *
   * Functions to Update State
   *
   ***************************************************************************/

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

  // this is used by the cookie function to update state just for items we find
  updateIfExist(cookieObject, prop) {
    if (cookieObject.hasOwnProperty(prop)) {
      //console.log('setting state on ' + prop +' to ', cookieObject[prop]);
      this.setState({ [prop]: cookieObject[prop] });
    }
  }

  // this is a function we pass down to the settings component to allow it to modify state here at Base.jsx
  updateStateFromSettings(settingsObject) {
    this.setState({
      ...settingsObject
    });
  }

  toggleSettings() {
    this.refs.settings.toggle();
  }

  saveCookie() {
    const cookieObject = {};
    this.settingsFields.forEach(field => cookieObject[field] = this.state[field]);
    Cookie.set('settings', cookieObject);
    console.log('Saved cookie', cookieObject);
  }

  /****************************************************************************
   *
   * OK we finally made it to the render() function
   *
   ***************************************************************************/

  render() {

    // populate settingsObject with all the settingsFields values (essentially, a subset of all the items in react state)
    const settingsObject = {};
    this.settingsFields.forEach(field => settingsObject[field] = this.state[field]);

    // count how many items in each of the service states
    let howManyServices = 0;
    let howManyServicePending = 0;
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
          if (this.state.servicelist[host][service].status === 1) {
            howManyServicePending++;
          }
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
    let howManyHostPending = 0;
    let howManyHostUp = 0;
    let howManyHostDown = 0;
    let howManyHostUnreachable = 0;
    let howManyHostAcked = 0;
    let howManyHostScheduled = 0;
    let howManyHostFlapping = 0;

    if (this.state.hostlist) {
      Object.keys(this.state.hostlist).forEach((host) => {

        if (this.state.hostlist[host].status === 1) {
          howManyHostPending++;
        }
        if (this.state.hostlist[host].status === 4) {
          howManyHostDown++;
        }
        if (this.state.hostlist[host].status === 8) {
          howManyHostUnreachable++;
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

    const settingsLoaded = this.state.isDoneLoading;
    //const showHistoryChart = window.innerWidth > 500; // don't show the history chart on small screens like iphone
    const showHistoryChart = true;
    const { language } = this.state;

    

    /**************************************************************************
    * Template Starts Here
    **************************************************************************/

    return (
      <div className="Base">

        {/* settings */}

        <Settings
          ref="settings"
          baseUrl={this.state.baseUrl}
          baseUrlChanged={this.baseUrlChanged.bind(this)}
          settings={settingsObject}
          settingsFields={this.settingsFields}
          updateStateFromSettings={this.updateStateFromSettings}
          isCookieLoaded={this.state.isCookieLoaded}
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
        </div>

        {/* footer */}

        <div className="FooterArea">

          {/* left */}
          <div className="FooterAreaLeft">
            <Checkbox
              className="Checkbox warning"
              textClassName="uppercase-first display-inline-block"
              handleChange={this.handleChange}
              stateName={'hideFilters'}
              defaultChecked={!this.state.hideFilters}
              howManyText={translate('show filters', language)}
            />
          </div>

          {/* right */}
          <div className="FooterAreaRight uppercase-first">
            <span style={{ cursor: 'pointer' }} onClick={this.toggleSettings}>{translate('settings', language)}</span>
          </div>

          {/* middle */}
          <div className="FooterAreaMiddle">
            <span className="FooterAreaMiddleUpdate uppercase-first display-inline-block">{translate('last update', language)}: <span className="color-orange">{prettyDateTime(this.state.servicelistLastUpdate)}</span></span>
            &nbsp;&nbsp;
            <span>NagiosTV <span className="color-orange">v{this.state.currentVersionString}</span></span>
            {this.state.latestVersion > this.state.currentVersion && <span> <span className="update-available"><a target="_blank" rel="noopener noreferrer" href="https://github.com/chriscareycode/nagiostv-react/releases">NagiosTV v{this.state.latestVersionString} available</a></span></span>}
          </div>
        </div>

        {/* spacer to counteract the floating header */}

        <div style={{ marginTop: '60px' }}>
        </div>

        {!settingsLoaded && <div>Settings are not loaded yet</div>}

        {/* Demo */}

        {this.state.isDemoMode && <Demo
          hostlist={this.state.hostlist}
          hostSortOrder={this.state.hostSortOrder}
          servicelist={this.state.servicelist}
          serviceSortOrder={this.state.serviceSortOrder}
          updateStateFromSettings={this.updateStateFromSettings}
        />}

        {/* hosts */}

        {settingsLoaded && <div className="service-summary color-orange">
          
          <span className="service-summary-title">
            <strong>{howManyHosts}</strong> {howManyHosts.length === 1 ? translate('host', language) : translate('hosts', language)}{' '}
               
            {howManyHostDown > 0 && <span className="summary-label summary-label-red uppercase">{howManyHostDown} {translate('down', language)}</span>}
            {howManyHostUnreachable > 0 && <span className="summary-label summary-label-red uppercase">{howManyHostUnreachable} {translate('unreachable', language)}</span>}
            {howManyHostPending > 0 && <span className="summary-label summary-label-gray uppercase">{howManyHostPending} {translate('pending', language)}</span>}
            {howManyHostAcked > 0 && <span className="summary-label summary-label-green uppercase">{howManyHostAcked} {translate('acked', language)}</span>}
            {howManyHostScheduled > 0 && <span className="summary-label summary-label-green uppercase">{howManyHostScheduled} {translate('scheduled', language)}</span>}
            {howManyHostFlapping > 0 && <span className="summary-label summary-label-orange uppercase">{howManyHostFlapping} {translate('flapping', language)}</span>}
            
            {this.state.showEmoji && <HowManyEmoji
              howMany={howManyHosts}
              howManyWarning={0}
              howManyCritical={howManyHostDown}
              howManyDown={this.state.hostProblemsArray.length}
            />}
          </span>

          {!this.state.hideFilters && <div className="service-hide-problems">

            <select value={this.state.hostSortOrder} varname={'hostSortOrder'} onChange={this.handleSelectChange}>
              <option value="newest">{translate('newest first', language)}</option>
              <option value="oldest">{translate('oldest first', language)}</option>
            </select>

            <Checkbox className="Checkbox down uppercase"
              handleChange={this.handleChange}
              stateName={'hideHostDown'}
              defaultChecked={!this.state.hideHostDown}
              howMany={howManyHostDown}
              howManyText={translate('down', language)}
            />

            <Checkbox className="Checkbox unreachable uppercase"
              handleChange={this.handleChange}
              stateName={'hideHostUnreachable'}
              defaultChecked={!this.state.hideHostUnreachable}
              howMany={howManyHostUnreachable}
              howManyText={translate('unreachable', language)}
            />

            <Checkbox className="Checkbox pending uppercase"
              handleChange={this.handleChange}
              stateName={'hideHostPending'}
              defaultChecked={!this.state.hideHostPending}
              howMany={howManyHostPending}
              howManyText={translate('pending', language)}
            />

            <Checkbox className="Checkbox acked uppercase"
              handleChange={this.handleChange}
              stateName={'hideHostAcked'}
              defaultChecked={!this.state.hideHostAcked}
              howMany={howManyHostAcked}
              howManyText={translate('acked', language)}
            />

            <Checkbox className="Checkbox scheduled uppercase"
              handleChange={this.handleChange}
              stateName={'hideHostScheduled'}
              defaultChecked={!this.state.hideHostScheduled}
              howMany={howManyHostScheduled}
              howManyText={translate('scheduled', language)}
            />

            <Checkbox className="Checkbox flapping uppercase"
              handleChange={this.handleChange}
              stateName={'hideHostFlapping'}
              defaultChecked={!this.state.hideHostFlapping}
              howMany={howManyHostFlapping}
              howManyText={translate('flapping', language)}
            />

          </div>}

        </div>}
        
        {(!this.state.isDemoMode && this.state.hostlistError) && <div className="margin-top-10 border-red ServiceItemError"><span role="img" aria-label="error">⚠️</span> {this.state.hostlistErrorMessage}</div>}

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
            <strong>{howManyServices}</strong> {howManyServices === 1 ? translate('service', language) : translate('services', language)}{' '}

            {howManyServiceCritical > 0 && <span className="summary-label summary-label-red uppercase">{howManyServiceCritical} {translate('critical', language)}</span>}
            {howManyServiceWarning > 0 && <span className="summary-label summary-label-yellow uppercase">{howManyServiceWarning} {translate('warning', language)}</span>}
            {howManyServicePending > 0 && <span className="summary-label summary-label-gray uppercase">{howManyServicePending} {translate('pending', language)}</span>}
            {howManyServiceUnknown > 0 && <span className="summary-label summary-label-gray uppercase">{howManyServiceUnknown} {translate('unknown', language)}</span>}
            {howManyServiceAcked > 0 && <span className="summary-label summary-label-green uppercase">{howManyServiceAcked} {translate('acked', language)}</span>}
            {howManyServiceScheduled > 0 && <span className="summary-label summary-label-green uppercase">{howManyServiceScheduled} {translate('scheduled', language)}</span>}
            {howManyServiceFlapping > 0 && <span className="summary-label summary-label-orange uppercase">{howManyServiceFlapping} {translate('flapping', language)}</span>}

            {this.state.showEmoji && <HowManyEmoji
              howMany={howManyServices}
              howManyWarning={howManyServiceWarning}
              howManyCritical={howManyServiceCritical}
              howManyDown={this.state.serviceProblemsArray.length}
            />}
          </span>

          {!this.state.hideFilters && <div className="service-hide-problems">

            <select value={this.state.serviceSortOrder} varname={'serviceSortOrder'} onChange={this.handleSelectChange}>
              <option value="newest">{translate('newest first', language)}</option>
              <option value="oldest">{translate('oldest first', language)}</option>
            </select>

            <Checkbox className="Checkbox critical uppercase"
              handleChange={this.handleChange}
              stateName={'hideServiceCritical'}
              defaultChecked={!this.state.hideServiceCritical}
              howMany={howManyServiceCritical}
              howManyText={translate('critical', language)}
            />

            <Checkbox className="Checkbox warning uppercase"
              handleChange={this.handleChange}
              stateName={'hideServiceWarning'}
              defaultChecked={!this.state.hideServiceWarning}
              howMany={howManyServiceWarning}
              howManyText={translate('warning', language)}
            />

            <Checkbox className="Checkbox pending uppercase"
              handleChange={this.handleChange}
              stateName={'hideServicePending'}
              defaultChecked={!this.state.hideServicePending}
              howMany={howManyServicePending}
              howManyText={translate('pending', language)}
            />

            <Checkbox className="Checkbox unknown uppercase"
              handleChange={this.handleChange}
              stateName={'hideServiceUnknown'}
              defaultChecked={!this.state.hideServiceUnknown}
              howMany={howManyServiceUnknown}
              howManyText={translate('unknown', language)}
            />

            <Checkbox className="Checkbox acked uppercase"
              handleChange={this.handleChange}
              stateName={'hideServiceAcked'}
              defaultChecked={!this.state.hideServiceAcked}
              howMany={howManyServiceAcked}
              howManyText={translate('acked', language)}
            />

            <Checkbox className="Checkbox scheduled uppercase"
              handleChange={this.handleChange}
              stateName={'hideServiceScheduled'}
              defaultChecked={!this.state.hideServiceScheduled}
              howMany={howManyServiceScheduled}
              howManyText={translate('scheduled', language)}
            />

            <Checkbox className="Checkbox flapping uppercase"
              handleChange={this.handleChange}
              stateName={'hideServiceFlapping'}
              defaultChecked={!this.state.hideServiceFlapping}
              howMany={howManyServiceFlapping}
              howManyText={translate('flapping', language)}
            />

          </div>}

        </div>}
        
        {(!this.state.isDemoMode && this.state.servicelistError) && <div className="margin-top-10 border-red ServiceItemError"><span role="img" aria-label="error">⚠️</span> {this.state.servicelistErrorMessage}</div>}

        <ServiceItems
          serviceProblemsArray={this.state.serviceProblemsArray}
          commentlist={this.state.commentlist}
          settings={settingsObject}

          howManyServices={howManyServices}
          howManyServiceWarning={howManyServiceWarning}
          howManyServicePending={howManyServicePending}
          howManyServiceUnknown={howManyServiceUnknown}
          howManyServiceCritical={howManyServiceCritical}
          howManyServiceAcked={howManyServiceAcked}
          howManyServiceScheduled={howManyServiceScheduled}
          howManyServiceFlapping={howManyServiceFlapping}
        />
        
        {/* history (alertlist) */}

        <div className="history-summary color-orange margin-top-10">
          <span className="service-summary-title">
          <span className="uppercase-first display-inline-block">{translate('history', language)}</span>: <strong>{this.state.alertlistCount}</strong> {translate('alerts in the past', language)} <strong>{this.state.alertDaysBack}</strong> {translate('days', language)}
            {this.state.alertlistCount > this.state.alertlist.length && <span className="font-size-0-6"> ({translate('trimming at', language)} {this.state.alertMaxItems})</span>}
          </span>
        </div>

        {showHistoryChart && <HistoryChart
          alertlist={this.state.alertlist}
          alertDaysBack={this.state.alertDaysBack} 
          alertlistLastUpdate={this.state.alertlistLastUpdate}
        />}

        {this.state.alertlistError && <div className="margin-top-10 border-red color-yellow ServiceItemError"><span role="img" aria-label="error">⚠️</span> {this.state.alertlistErrorMessage}</div>}

        {!this.state.alertlistError && this.state.alertlist.length === 0 && <div className="margin-top-10 color-green AllOkItem">
          No alerts
        </div>}

        <AlertItems
          items={this.state.alertlist}
          showEmoji={this.state.showEmoji}
          settings={settingsObject}
        />

        <br />
        <br />
        <br />
        
      </div>
    );
  }
}

export default Base;
