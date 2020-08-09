/*eslint array-callback-return: "off"*/
import React, { Component } from 'react';
import HostItems from './hosts/HostItems.jsx';
import HostFilters from './hosts/HostFilters.jsx';
import ServiceItems from './services/ServiceItems.jsx';
import ServiceFilters from './services/ServiceFilters.jsx';
import AlertSection from './alerts/AlertSection.jsx';
import { translate } from '../helpers/language';
import { cleanDemoDataHostlist, cleanDemoDataServicelist } from '../helpers/nagiostv';
import { convertHostObjectToArray, convertServiceObjectToArray } from '../helpers/nagiostv';
import Flynn from './Flynn/Flynn.jsx';
import CustomLogo from './widgets/CustomLogo.jsx';
import Settings from './Settings.jsx';
//import HowManyEmoji from './widgets/HowManyEmoji.jsx';
import Demo from './Demo.jsx';
import Clock from './widgets/Clock.jsx';
import NavBottomBar from './widgets/NavBottomBar.jsx';
import HostGroupFilter from './hosts/HostGroupFilter.jsx';
// css
import './Base.css';
import './animation.css';
// 3rd party addons
import moment from 'moment';
import Cookie from 'js-cookie';
import $ from 'jquery';
import _ from 'lodash';
// icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faVolumeUp } from '@fortawesome/free-solid-svg-icons';
// Polyfill
import 'url-search-params-polyfill';

class Base extends Component {

  // use fake sample data if we are doing local development
  useFakeSampleData = false;

  state = {
    currentPage: 'dashboard',

    currentVersion: 49,
    currentVersionString: '0.5.6',
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

    hostgroupError: false,
    hostgroupErrorMessage: '',
    hostgroupLastUpdate: 0,
    hostgroup: {},
    hostgroupFilter: '',

    // add to settings?
    fetchFrequency: 15, // seconds
    fetchAlertFrequency: 60, // seconds

    hideFilters: true,
    
    // user settings (defaults are set here also)
    titleString: 'NagiosTV',
    baseUrl: '/nagios/cgi-bin/',
    versionCheckDays: 1,
    alertDaysBack: 30,
    alertHoursBack: 24,
    alertMaxItems: 1000,

    hideServicePending: false,
    hideServiceWarning: false,
    hideServiceUnknown: false,
    hideServiceCritical: false,
    hideServiceAcked: false,
    hideServiceScheduled: false,
    hideServiceFlapping: false,
    hideServiceSoft: false,

    serviceSortOrder: 'newest',

    hideHostPending: false,
    hideHostDown: false,
    hideHostUnreachable: false,
    hideHostAcked: false,
    hideHostScheduled: false,
    hideHostFlapping: false,
    hideHostSoft: false,

    hideHistory: false,
    hideHistoryTitle: false,
    hideHistoryChart: false,
    hideAlertSoft: false,

    hostSortOrder: 'newest',

    language: 'English',
    locale: 'en',
    dateFormat: 'llll',
    clockDateFormat: 'll',
    clockTimeFormat: 'LTS',
    
    isDemoMode: false,
    isDebugMode: false,

    // fun stuff
    customLogoEnabled: false,
    customLogoUrl: './sample-image/resedit.png',
    flynnEnabled: false,
    flynnConcernedAt: 1,
    flynnAngryAt: 2,
    flynnBloodyAt: 4,
    flynnCssScale: '1',
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
    'hideServiceSoft',

    'serviceSortOrder',

    'hideHostPending',
    'hideHostDown',
    'hideHostUnreachable',
    'hideHostAcked',
    'hideHostScheduled',
    'hideHostFlapping',
    'hideHostSoft',

    'hideHistory',
    'hideHistoryTitle',
    'hideHistoryChart',
    'hideAlertSoft',

    'hostSortOrder',
    'hostgroupFilter',
    
    'versionCheckDays',
    'language',
    'locale',
    'dateFormat',
    'clockDateFormat',
    'clockTimeFormat',

    // fun stuff
    'customLogoEnabled',
    'customLogoUrl',
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
    
    // turn on demo mode if ?demo=true or we are hosting on nagiostv.com
    // demo mode uses fake data and rotates through a couple of alerts as an example
    const urlParams = new URLSearchParams(window.location.search);
    const isDemoMode = urlParams.get('demo') === 'true' || window.location.hostname === 'nagiostv.com';
    this.state.isDemoMode = isDemoMode;
    if (isDemoMode) {
      this.useFakeSampleData = true;
    }

    // turn on debug mode if ?debug=true
    const isDebugMode = urlParams.get('debug') === 'true';
    this.state.isDebugMode = isDebugMode;
  }

  componentDidMount() {

    // Load Remote Settings - then it calls the loadCookie routine
    this.getRemoteSettings();
    
    // fetch the initial data after 1 second
    // Fetch Host data
    // Fetch Service data
    // If Alert History is visible, fetch Alert data
    // Fetch Comment data
    setTimeout(() => {
      this.fetchHostGroupData();
      this.fetchHostData();
      this.fetchServiceData();
      if (!this.state.hideHistory) { this.fetchAlertData(); }
      // TODO: turn on comments for demo mode at some point
      if (!this.state.isDemoMode) { this.fetchCommentData(); }
    }, 1000);

    if (this.state.isDemoMode === false) {
      // fetch host problems and service problems on an interval
      setInterval(() => {
        this.fetchServiceData();
        this.fetchHostData();
        this.fetchCommentData();
      }, this.state.fetchFrequency * 1000);

      // we fetch alerts on a slower frequency interval
      if (!this.state.hideHistory) { 
        setInterval(() => {
          this.fetchHostGroupData();
          this.fetchAlertData();
        }, this.state.fetchAlertFrequency * 1000);
      }

      // this is not super clean but I'm going to delay this by 30s to give the setState() in the getCookie()
      // time to complete. It's async so we could have a race condition getting the version check setting
      // to arrive in this.state.versionCheckDays
      setTimeout(() => {
        const versionCheckDays = this.state.versionCheckDays;
        // if someone turns off the version check, it should never check
        if (versionCheckDays && versionCheckDays > 0) {
          // version check - run once on app boot
          this.versionCheck();
          // version check - run every n days
          const intervalTime = versionCheckDays * 24 * 60 * 60 * 1000;
          // console.log('Checking on intervalTime', intervalTime);
          // safety check that interval > 1hr
          if (intervalTime !== 0 && intervalTime > (60 * 60 * 1000)) {
            setInterval(() => {
              // inside the interval we check again if the user disabled the check
              if (this.state.versionCheckDays > 0) {
                this.versionCheck();
              }
            }, intervalTime);
          } else {
            console.log('intervalTime not yet an hour, not re-running check.', intervalTime);
          }
        } else {
          console.log('Invalid versionCheckDays. Not starting version check interval.', versionCheckDays);
        }
      }, 30000);
    } // if isDemoMode === false

  }

  /* ************************************************************************************ */
  /* settings related functions such as fetching settings from server, and loading cookie
  /* ************************************************************************************ */

  /* ************************************************************************************
  the approach I'm going to take with settings is to first load the settings from the server.
  either the settings load, or they fail. in either case I then check for cookie and apply 
  those over top. so cookie settings will override server settings. There will be a delete
  cookie button to help clear any local settings once server side settings become established. */
  /* ************************************************************************************ */

  getRemoteSettings() {
    const url = 'client-settings.json?v=' + new Date().getTime();

    $.ajax({
      method: "GET",
      url,
      dataType: "json",
      timeout: 10 * 1000
    }).done((myJson, textStatus, jqXHR) => {

      // test that return data is json
      if (jqXHR.getResponseHeader('content-type').indexOf('application/json') === -1) {
        console.log('getRemoteSettings() parse ERROR: got response but result data is not JSON. Skipping server settings.');
        
        this.getCookie();
        return;
      }

      // Got good server settings
      console.log('Found server default settings client-settings.json - Loading default settings:', myJson);

      // save settings to state
      this.updateStateFromSettings({
        ...myJson,
        isRemoteSettingsLoaded: true
      });

      this.getCookie();

    }).catch((err) => {
      console.log('getRemoteSettings() ajax ERROR:', err);
      console.log('Skipping server settings.');
      this.getCookie();
    });
  }

  getCookie() {
    // do not load the cookie in demo mode
    if (this.state.isDemoMode) {
      this.setState({ isDoneLoading: true });
      return;
    }

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
      
      // save settings to state
      this.updateStateFromSettings({
        ...cookieObject,
        isCookieLoaded: true
      });
    }

    this.setState({ isDoneLoading: true });
  }

  lastVersionCheckTime = 0;

  versionCheck() {
    
    const nowTime = new Date().getTime();
    const twentyThreeHoursInSeconds = (86400 - 3600) * 1000;
    
    // PREVENT extra last version check time with cookie
    // if the last version check was recent then do not check again
    // this prevents version checks if you refresh the UI over and over
    // as is common on TV rotation
    const lastVersionCheckTimeCookie = Cookie.get('lastVersionCheckTime');

    if (lastVersionCheckTimeCookie !== 0) {
      const diff = nowTime - lastVersionCheckTimeCookie;
      if (diff < twentyThreeHoursInSeconds) {
        console.log('Not performing version check since it was done ' + (diff/1000).toFixed(0) + ' seconds ago (Cookie check)');
        return;
      }
    }

    // PREVENT extra last version check time with local variable
    // If for some reason the cookie check doesn't work
    if (this.lastVersionCheckTime !== 0) {
      const diff = nowTime - this.lastVersionCheckTime;
      if (diff < twentyThreeHoursInSeconds) {
        console.log('Not performing version check since it was done ' + (diff/1000).toFixed(0) + ' seconds ago (local var check)');
        return;
      }
    }

    console.log('Running version check...');

    // Set the last version check time in local variable
    // I'm setting this one here not in the callback to prevent the rapid fire
    this.lastVersionCheckTime = nowTime;
    // Set the last version check in the cookie (for page refresh)
    Cookie.set('lastVersionCheckTime', nowTime);

    const url = 'https://nagiostv.com/version/nagiostv-react/?version=' + this.state.currentVersionString;

    $.ajax({
      method: "GET",
      url,
      dataType: "json",
      timeout: 5 * 1000
    })
    .done(myJson => {
      console.log(`Latest NagiosTV release is ${myJson.version_string} (r${myJson.version}). You are running ${this.state.currentVersionString} (r${this.state.currentVersion})`);

      this.setState({
        latestVersion: myJson.version,
        latestVersionString: myJson.version_string,
        lastVersionCheckTime: nowTime
      });
    })
    .fail(err => {
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
      url = './sample-data/servicelist.json';
    } else {
      url = this.state.baseUrl + 'statusjson.cgi?query=servicelist&details=true';
      const hostgroupFilter = this.state.hostgroupFilter;
      if (hostgroupFilter) { url += `&hostgroup=${hostgroupFilter}`; }
    }
    //console.log('Requesting Service Data: ' + url);

    $.ajax({
      method: "GET",
      url,
      dataType: "json",
      timeout: (this.state.fetchFrequency - 2) * 1000
    }).done((myJson, textStatus, jqXHR) => {

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
      let servicelist = _.get(myJson.data, 'servicelist', {});

      // If we are in demo mode then clean the fake data
      if (this.state.isDemoMode) {
        servicelist = cleanDemoDataServicelist(servicelist);
      }

      // convert the service object into an array (and sort it)
      const serviceProblemsArray = convertServiceObjectToArray(servicelist, this.state.serviceSortOrder);

      // check for old stale data (detect if nagios is down)
      const duration = moment.duration(new Date().getTime() - myJson.result.last_data_update);
      const hours = duration.asHours().toFixed(1);

      // we disable the stale check if in demo mode since the demo data is always stale
      if (!this.state.isDemoMode && hours >= 1) {
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
      
      this.handleFetchFail(jqXHR, textStatus, errorThrown, url, 'servicelistError', 'servicelistErrorMessage');
    
    });
  }

  fetchHostData() {
    let url;
    if (this.useFakeSampleData) {
      url = './sample-data/hostlist.json';
    } else {
      url = this.state.baseUrl + 'statusjson.cgi?query=hostlist&details=true';
      const hostgroupFilter = this.state.hostgroupFilter;
      if (hostgroupFilter) { url += `&hostgroup=${hostgroupFilter}`; }
    }

    $.ajax({
      method: "GET",
      url,
      dataType: "json",
      timeout: (this.state.fetchFrequency - 2) * 1000
    }).done((myJson, textStatus, jqXHR) => {

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
      let hostlist = _.get(myJson.data, 'hostlist', {});

      // If we are in demo mode then clean the fake data
      if (this.state.isDemoMode) {
        hostlist = cleanDemoDataHostlist(hostlist);
      }

      // convert the host object into an array (and sort it)
      const hostProblemsArray = convertHostObjectToArray(hostlist, this.state.hostSortOrder);

      // check for old data (nagios down?)
      const duration = moment.duration(new Date().getTime() - myJson.result.last_data_update);
      const hours = duration.asHours().toFixed(1);

      if (!this.state.isDemoMode && hours >= 1) {
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

      this.handleFetchFail(jqXHR, textStatus, errorThrown, url, 'hostlistError', 'hostlistErrorMessage');

    });
  }

  fetchAlertData() {
    const starttime = this.state.alertDaysBack * 60 * 60 * 24;
    
    let url;
    if (this.useFakeSampleData) {
      url = './sample-data/alertlist.json';
    } else {
      url = `${this.state.baseUrl}archivejson.cgi?query=alertlist&starttime=-${starttime}&endtime=%2B0`;
      const hostgroupFilter = this.state.hostgroupFilter;
      if (hostgroupFilter) { url += `&hostgroup=${hostgroupFilter}`; }
    }

    $.ajax({
      method: "GET",
      url,
      dataType: "json",
      timeout: (this.state.fetchAlertFrequency - 2) * 1000
    }).done((myJson, textStatus, jqXHR) => {

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
      const alertlist = _.get(myJson.data, 'alertlist', []).reverse();

      // store the actual count of alert list items before we trim
      const alertlistCount = alertlist.length;

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
      
      this.handleFetchFail(jqXHR, textStatus, errorThrown, url, 'alertlistError', 'alertlistErrorMessage');

    });
  }

  fetchCommentData() {
    const url = this.state.baseUrl + 'statusjson.cgi?query=commentlist&details=true';

    $.ajax({
      method: "GET",
      url,
      dataType: "json",
      timeout: 10 * 1000
    }).done((myJson, textStatus, jqXHR) => {

      // test that return data is json
      if (jqXHR.getResponseHeader('content-type').indexOf('application/json') === -1) {
        console.log('fetchCommentData() ERROR: got response but result data is not JSON. Base URL setting is probably wrong.');
        this.setState({
          commentlistError: true,
          commentlistErrorMessage: 'ERROR: Result data is not JSON. Base URL setting is probably wrong.'
        });
        return;
      }

      //
      const commentlist = myJson.data.commentlist;
      this.setState({
        commentlistError: false,
        commentlistErrorMessage: '',
        commentlistLastUpdate: new Date().getTime(),
        commentlist // object
      });

    }).fail((jqXHR, textStatus, errorThrown) => {
      
      this.handleFetchFail(jqXHR, textStatus, errorThrown, url, 'commentlistError', 'commentlistErrorMessage');

    });
  }

  fetchHostGroupData() {
    const url = this.state.baseUrl + 'objectjson.cgi?query=hostgrouplist&details=true';

    $.ajax({
      method: "GET",
      url,
      dataType: "json",
      timeout: 10 * 1000
    }).done((myJson, textStatus, jqXHR) => {

      // test that return data is json
      if (jqXHR.getResponseHeader('content-type').indexOf('application/json') === -1) {
        console.log('fetchHostGroupData() ERROR: got response but result data is not JSON. Base URL setting is probably wrong.');
        this.setState({
          hostgroupError: true,
          hostgroupErrorMessage: 'ERROR: Result data is not JSON. Base URL setting is probably wrong.'
        });
        return;
      }

      // Pluck out the hostgrouplist result
      const hostgroup = _.get(myJson.data, 'hostgrouplist', {});

      this.setState({
        hostgroupError: false,
        hostgroupErrorMessage: '',
        hostgroupLastUpdate: new Date().getTime(),
        hostgroup // object
      });

    }).fail((jqXHR, textStatus, errorThrown) => {
      
      this.handleFetchFail(jqXHR, textStatus, errorThrown, url, 'hostgroupError', 'hostgroupErrorMessage');

    });
  }

  handleFetchFail(jqXHR, textStatus, errorThrown, url, errorBooleanVariableName, errorMessageVariableName) {
    if (jqXHR.status === 0) {
      // CONNECTION REFUSED
      this.setState({
        [errorBooleanVariableName]: true,
        [errorMessageVariableName]: 'ERROR: CONNECTION REFUSED to ' + url
      });
    } else {  
      // UNKNOWN (TODO: add more errors here)
      this.setState({
        [errorBooleanVariableName]: true,
        [errorMessageVariableName]: 'ERROR: ' + jqXHR.status +  ' ' + errorThrown + ' - ' + url
      });
    }
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
    this.setState({ currentPage: 'settings' });
  }

  /****************************************************************************
   *
   * Functions to Update State
   *
   ***************************************************************************/

  handleCheckboxChange = (event, propName, dataType) => {
    // console.log('handleCheckboxChange Base.jsx');
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

  handleSelectChange = (event) => {
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
  };

  // this is a function we pass down to the settings component to allow it to modify state here at Base.jsx
  updateStateFromSettings = (settingsObject) => {
    this.setState({
      ...settingsObject
    });
  };

  updateStateAndReloadNagiosData = (settingsObject) => {
    this.setState({
      ...settingsObject
    }, () => {
      // Save Cookie
      this.saveCookie();
      // Reload data from server now
      this.fetchHostData();
      this.fetchServiceData();
      this.fetchAlertData();
    });
  };

  saveCookie = () => {
    const cookieObject = {};
    this.settingsFields.forEach(field => cookieObject[field] = this.state[field]);
    Cookie.set('settings', cookieObject);
    console.log('Saved cookie', cookieObject);
  };

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
    let howManyServiceSoft = 0;

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
          // only count soft items if they are not up
          if (this.state.servicelist[host][service].status !== 2 && this.state.servicelist[host][service].state_type === 0) {
            howManyServiceSoft++;
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
    let howManyHostSoft = 0;

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
        // only count soft items if they are not up
        if (this.state.hostlist[host].status !== 2 && this.state.hostlist[host].state_type === 0) {
          howManyHostSoft++;
        }
      });
    }

    const settingsLoaded = this.state.isDoneLoading;
    
    const { language } = this.state;

    const howManyHostAndServicesDown = this.state.serviceProblemsArray.length + this.state.hostProblemsArray.length;

    /**************************************************************************
    * Template Starts Here
    **************************************************************************/

    return (
      <div className="Base">

        {/* header */}

        <div className="HeaderArea">

          <div className="header-right-float">

            {/* sound */}
            {(this.state.playSoundEffects || this.state.speakItems) && <div className="sound-icon"><FontAwesomeIcon icon={faVolumeUp} /></div>}

            {/* clock */}
            <Clock
              locale={this.state.locale}
              clockDateFormat={this.state.clockDateFormat}
              clockTimeFormat={this.state.clockTimeFormat}
            />

            {/* flynn */}
            {this.state.flynnEnabled &&
              <Flynn
                howManyDown={howManyHostAndServicesDown}
                flynnConcernedAt={this.state.flynnConcernedAt}
                flynnAngryAt={this.state.flynnAngryAt}
                flynnBloodyAt={this.state.flynnBloodyAt}
                flynnCssScale={this.state.flynnCssScale}
              />
            }

            {/* custom logo */}
            {this.state.customLogoEnabled &&
              <CustomLogo
                settings={settingsObject}
              />
            }
          </div>

          <div className="header-application-name">{this.state.titleString}</div>

          {/* show the polling time */}
          {/*<span style={{ marginLeft: '20px' }} className=""><FontAwesomeIcon icon={faYinYang} spin /> 15s</span>*/}
        </div>

        {/* footer */}
        
        <NavBottomBar
          hideFilters={this.state.hideFilters}
          hideHistoryChart={this.state.hideHistoryChart}
          updateStateFromSettings={this.updateStateFromSettings}
          currentPage={this.state.currentPage}
          hostlistError={this.state.hostlistError}

          currentVersion={this.state.currentVersion}
          currentVersionString={this.state.currentVersionString}
          latestVersion={this.state.latestVersion}
          latestVersionString={this.state.latestVersionString}

        />

        {/* spacer to counteract the floating header */}

        <div style={{ height: '55px' }}>
        </div>

        {/* Demo mode logic is inside this component */}

        {this.state.isDemoMode && <Demo
          hostlist={this.state.hostlist}
          hostSortOrder={this.state.hostSortOrder}
          servicelist={this.state.servicelist}
          serviceSortOrder={this.state.serviceSortOrder}
          updateStateFromSettings={this.updateStateFromSettings}
        />}

        {/* wrapper around the main content */}
        <div className="main-content">

          {!settingsLoaded && <div>Settings are not loaded yet</div>}

          {/* settings */}

          {this.state.currentPage === 'settings' && <Settings
            ref="settings"
            baseUrl={this.state.baseUrl}
            baseUrlChanged={this.baseUrlChanged.bind(this)}
            settings={settingsObject}
            settingsFields={this.settingsFields}
            updateStateFromSettings={this.updateStateFromSettings}
            isCookieLoaded={this.state.isCookieLoaded}
            currentPage={this.state.currentPage}
            hostlistError={this.state.hostlistError}
          />}

          {/* dashboard - the main page */}

          {this.state.currentPage === 'dashboard' && <div className="dashboard-area">

            {/* hostgroups */}

            {!this.state.hideFilters && <HostGroupFilter
              hostgroup={this.state.hostgroup}
              hostgroupFilter={this.state.hostgroupFilter}
              updateStateAndReloadNagiosData={this.updateStateAndReloadNagiosData}
            />}

            {/* hosts */}

            {settingsLoaded && <div className="service-summary">
            
              <span className="service-summary-title">
                Monitoring <strong>{howManyHosts}</strong> {howManyHosts.length === 1 ? translate('host', language) : translate('hosts', language)}{' '}
                {this.state.hostgroupFilter && <span>({this.state.hostgroupFilter})</span>}
              </span>

              {/* host filters */}
              <HostFilters
                hideFilters={this.state.hideFilters}
                hostSortOrder={this.state.hostSortOrder}
                handleSelectChange={this.handleSelectChange}
                handleCheckboxChange={this.handleCheckboxChange}
                howManyHostDown={howManyHostDown}
                howManyHostUnreachable={howManyHostUnreachable}
                howManyHostPending={howManyHostPending}
                howManyHostAcked={howManyHostAcked}
                howManyHostScheduled={howManyHostScheduled}
                howManyHostFlapping={howManyHostFlapping}
                howManyHostSoft={howManyHostSoft}
                language={language}
                settingsObject={settingsObject}
              />

              {/* how many down emoji */}
              {/*
              {this.state.showEmoji && <HowManyEmoji
                howMany={howManyHosts}
                howManyWarning={0}
                howManyCritical={howManyHostDown}
                howManyDown={this.state.hostProblemsArray.length}
              />}
              */}

            </div>}

            {/** Show Error Message - If we are not in demo mode and there is a hostlist error (ajax fetching) then show the error message here */}
            {(!this.state.isDemoMode && this.state.hostlistError) && <div className="margin-top-10 border-red ServiceItemError"><span role="img" aria-label="error">⚠️</span> {this.state.hostlistErrorMessage}</div>}

            {/* hostitems list */}
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
              isDemoMode={this.state.isDemoMode}
              hostlistError={this.state.hostlistError}
            />

            {/* services */}

            {settingsLoaded && <div className="service-summary">
              
              <span className="service-summary-title">
                Monitoring <strong>{howManyServices}</strong> {howManyServices === 1 ? translate('service', language) : translate('services', language)}{' '}
                {this.state.hostgroupFilter && <span>({this.state.hostgroupFilter})</span>}
              </span>

              {/* service filters */}
              <ServiceFilters
                hideFilters={this.state.hideFilters}
                serviceSortOrder={this.state.serviceSortOrder}
                handleSelectChange={this.handleSelectChange}
                handleCheckboxChange={this.handleCheckboxChange}
                howManyServices={howManyServices}
                howManyServiceWarning={howManyServiceWarning}
                howManyServicePending={howManyServicePending}
                howManyServiceUnknown={howManyServiceUnknown}
                howManyServiceCritical={howManyServiceCritical}
                howManyServiceAcked={howManyServiceAcked}
                howManyServiceScheduled={howManyServiceScheduled}
                howManyServiceFlapping={howManyServiceFlapping}
                howManyServiceSoft={howManyServiceSoft}
                language={language}
                settingsObject={settingsObject}
              />

              {/* how many down emoji */}
              {/*
              {this.state.showEmoji && <HowManyEmoji
                howMany={howManyServices}
                howManyWarning={howManyServiceWarning}
                howManyCritical={howManyServiceCritical}
                howManyDown={this.state.serviceProblemsArray.length}
              />}
              */}

            </div>}
            
            {/** Show Error Message - If we are not in demo mode and there is a servicelist error (ajax fetching) then show the error message here */}
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
              servicelistError={this.state.servicelistError}
            />
            
            {/* Alert History Section */}

            {(settingsLoaded && !this.state.hideHistory) && <AlertSection
              alertlist={this.state.alertlist}
              alertlistCount={this.state.alertlistCount}
              alertlistLastUpdate={this.state.alertlistLastUpdate}
              alertlistError={this.state.alertlistError}
              alertlistErrorMessage={this.state.alertlistErrorMessage}
              alertDaysBack={this.state.alertDaysBack}
              alertHoursBack={this.state.alertHoursBack}
              alertMaxItems={this.state.alertMaxItems}
              showEmoji={this.state.showEmoji}
              settingsObject={settingsObject}
              settingsFields={this.settingsFields}
              language={this.state.language}
              hideHistoryChart={this.state.hideHistoryChart}
              hideHistoryTitle={this.state.hideHistoryTitle}
              hideAlertSoft={this.state.hideAlertSoft}
              handleCheckboxChange={this.handleCheckboxChange}
              hideFilters={this.state.hideFilters}
            />}

          </div>} {/* end dashboard-area */}
        
        </div> {/* endwrapper around the main content */}

        <br />
        <br />
        
      </div>
    );
  }
}

export default Base;
