/*eslint array-callback-return: "off"*/

/**
 * NagiosTV https://nagiostv.com
 * Copyright (C) 2008-2020 Chris Carey https://chriscarey.com
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

/**
 * TODO: 
 * Handle offline - don't send ajax requests when no connection
 * 
 * net::ERR_INTERNET_DISCONNECTED
 * net::ERR_ADDRESS_UNREACHABLE
 * net::ERR_NETWORK_CHANGED
 * 
 */
import React, { Component } from 'react';

// Import Hosts and Services
import HostGroupFilter from './hosts/HostGroupFilter.jsx';
import HostSection from './hosts/HostSection.jsx';
import ServiceSection from './services/ServiceSection.jsx';
import AlertSection from './alerts/AlertSection.jsx';

// Import Various
import AutoUpdate from './AutoUpdate.jsx';
import Help from './Help.js';
import Settings from './Settings.jsx';
//import HowManyEmoji from './widgets/HowManyEmoji.jsx';

// Import Panels
import TopMenu from './panels/TopMenu.js';
import LeftPanel from './panels/LeftPanel.jsx';
import BottomPanel from './panels/BottomPanel.jsx';

// Import css
import './Base.css';
import './animation.css';
// Import 3rd party addons
//import moment from 'moment';
import Cookie from 'js-cookie';
import $ from 'jquery';
import _ from 'lodash';

// React Router
import {
  HashRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";

// Import Polyfills
import 'url-search-params-polyfill';

class Base extends Component {

  /********************************************************************************** */
  // FOR DEVELOPERS: Set this to use fake sample data if we are doing local development
  //                 or add ?fakedata=true to the URL
  /********************************************************************************** */
  useFakeSampleData = false;

  // React State
  state = {

    //**************************************************************************** */
    // state which is used internally by NagiosTV
    //**************************************************************************** */

    currentVersion: 60,
    currentVersionString: '0.6.7',
    latestVersion: 0,
    latestVersionString: '',
    lastVersionCheckTime: 0,

    isRemoteSettingsLoaded: false,
    isCookieLoaded: false, // I have this to render things only after cookie is loaded
    isDoneLoading: false,

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
    fetchHostGroupFrequency: 3600, // seconds

    hideFilters: true,
    isLeftPanelOpen: false,
    
    //**************************************************************************** */
    // user settings (defaults are set here also)
    //**************************************************************************** */

    titleString: 'NagiosTV',
    dataSource: 'cgi',
    baseUrl: '/nagios/cgi-bin/', // Base path to Nagios cgi-bin folder
    livestatusPath: 'connectors/livestatus.php',

    versionCheckDays: 1,
    
    // host related settings
    hideHostSection: false,
    hideHostPending: false,
    hideHostDown: false,
    hideHostUnreachable: false,
    hideHostAcked: false,
    hideHostScheduled: false,
    hideHostFlapping: false,
    hideHostSoft: false,
    hideHostNotificationsDisabled: false,
    hostSortOrder: 'newest',

    // service related settings
    hideServiceSection: false,
    hideServicePending: false,
    hideServiceWarning: false,
    hideServiceUnknown: false,
    hideServiceCritical: false,
    hideServiceAcked: false,
    hideServiceScheduled: false,
    hideServiceFlapping: false,
    hideServiceSoft: false,
    hideServiceNotificationsDisabled: false,
    serviceSortOrder: 'newest',
        
    // alert history related settings
    alertDaysBack: 30,
    alertHoursBack: 24,
    alertMaxItems: 1000,
    hideHistory: false,
    hideHistoryTitle: false,
    hideHistoryChart: false,
    hideAlertSoft: false,

    // general settings
    language: 'English',
    locale: 'en',
    dateFormat: 'llll',
    clockDateFormat: 'll',
    clockTimeFormat: 'LTS',
    
    isDemoMode: false,
    isDebugMode: false,

    // audio and visual settings
    fontSizeEm: '1em',
    customLogoEnabled: false,
    customLogoUrl: './sample-image/resedit.png',
    flynnEnabled: false,
    flynnConcernedAt: 1,
    flynnAngryAt: 2,
    flynnBloodyAt: 4,
    flynnCssScale: '0.5',
    showEmoji: false,
    speakItems: false,
    speakItemsVoice: '',
    playSoundEffects: false,
    soundEffectCritical: './sample-audio/critical.mp3',
    soundEffectWarning: './sample-audio/warning.mp3',
    soundEffectOk: './sample-audio/ok.mp3',
    showNextCheckInProgressBar: true,
    hideHamburgerMenu: false,
    hideBottomMenu: false
  };

  // The settings which we persist are a subset of the state that we have above.
  // Here we list all the settings we want to persist to cookie / client-settings
  // DEVELOPER: if you are adding a user setting above, you need to add it here too
  settingsFields = [
    'titleString',
    'dataSource',
    'baseUrl',
    'livestatusPath',
    'alertDaysBack',
    'alertMaxItems',

    'hideServiceSection',
    'hideServicePending',
    'hideServiceWarning',
    'hideServiceUnknown',
    'hideServiceCritical',
    'hideServiceAcked',
    'hideServiceScheduled',
    'hideServiceFlapping',
    'hideServiceSoft',
    'hideHostNotificationsDisabled',

    'serviceSortOrder',

    'hideHostSection',
    'hideHostPending',
    'hideHostDown',
    'hideHostUnreachable',
    'hideHostAcked',
    'hideHostScheduled',
    'hideHostFlapping',
    'hideHostSoft',
    'hideServiceNotificationsDisabled',

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

    // audio and visual
    'fontSizeEm',
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
    'soundEffectOk',
    'showNextCheckInProgressBar',
    'hideHamburgerMenu',
    'hideBottomMenu'
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

    // use fake data (dev) if ?fakedata=true
    if (urlParams.get('fakedata') === 'true') {
      this.useFakeSampleData = true;
    }
    
  }

  intervalHandleComment = null;
  intervalHandleHostGroup = null;
  intervalHandleVersionCheck = null;

  componentWillUnmount() {
    if (this.intervalHandleComment) { clearInterval(this.intervalHandleComment); }
    if (this.intervalHandleHostGroup) { clearInterval(this.intervalHandleHostGroup); }
    if (this.intervalHandleVersionCheck) { clearInterval(this.intervalHandleVersionCheck); }
  }

  componentDidMount() {

    // Load Remote Settings - then it calls the loadCookie routine
    this.getRemoteSettings();
    
    // If we are in demo mode then exit here
    if (this.state.isDemoMode) {
      return;
    }

    // fetch the initial data after 1 second
    setTimeout(() => {
      // fetch data now
      this.fetchHostGroupData();
      this.fetchCommentData();
    }, 1000);
    
    // Start the intervals for fetching data
    
    // fetch comments on an interval
    this.intervalHandleComment = setInterval(() => {
      this.fetchCommentData();
    }, this.state.fetchFrequency * 1000);

    // fetch hostgroup on an interval
    this.intervalHandleHostGroup = setInterval(() => {
      this.fetchHostGroupData();
    }, this.state.fetchHostGroupFrequency * 1000);
    

    // If a Cookie is set then run version check after 30s.
    // If no Cookie is set then run version check after 30m.
    // Cookie helps us prevent version check too often if NagiosTV is on a rotation
    // where the page is loading over and over every few minutes.

    let versionCheckTimeout = 30 * 1000; // 30s
    if (!navigator.cookieEnabled) {
      console.log('Cookie not enabled so delaying first version check by 30m');
      versionCheckTimeout = 1800 * 1000; // 30m
    }

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
          this.intervalHandleVersionCheck = setInterval(() => {
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
    }, versionCheckTimeout);
    
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
      this.updateRootState({
        ...myJson,
        isRemoteSettingsLoaded: true
      });

      // Now that we have loaded remote settings, load the cookie and overwrite settings with cookie
      // getCookie() is then going to call loadSettingsFromUrl()
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
      this.updateRootState({
        ...cookieObject,
        isCookieLoaded: true
      }, () => {
        // Now that we have loaded cookie, load settings from URL bar and overwrite settings
        this.loadSettingsFromUrl();
      });
    }
    
  }

  loadSettingsFromUrl() {

    const urlParams = new URLSearchParams(window.location.search);
    const urlObject = {};

    for (var item of urlParams) {
      //console.log('key: ' + item[0] + ', ' + 'value: ' + item[1]);

      // special handling for when the value is true or false
      // TODO: handle other special cases like this for other data types
      if (item[1] === 'true') {
        urlObject[item[0]] = true;
      } else if (item[1] === 'false') {
        urlObject[item[0]] = false;
      } else {
        urlObject[item[0]] = item[1];
      }
    }

    //console.log('urlObject', urlObject);

    this.updateRootState({
      ...urlObject
    }, () => {
      
      // Now that we are done loading remote settings, then cookie, then from URL, let the UI know settings are done loading
      this.setState({ isDoneLoading: true });
    });


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

  fetchCommentData() {

    let url;
    if (this.props.useFakeSampleData) {
      return;
    } else if (this.state.dataSource === 'livestatus') {
      url = this.state.livestatusPath + '?query=commentlist&details=true';
    } else {
      url = this.state.baseUrl + 'statusjson.cgi?query=commentlist&details=true';
    }

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
      
      this.handleFetchFail(this, jqXHR, textStatus, errorThrown, url, 'commentlistError', 'commentlistErrorMessage');

    });
  }

  fetchHostGroupData() {

    let url;
    if (this.props.useFakeSampleData) {
      return;
    } else if (this.state.dataSource === 'livestatus') {
      url = this.state.livestatusPath + '?query=hostgrouplist&details=true';
    } else {
      url = this.state.baseUrl + 'objectjson.cgi?query=hostgrouplist&details=true';
    }

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
      
      this.handleFetchFail(this, jqXHR, textStatus, errorThrown, url, 'hostgroupError', 'hostgroupErrorMessage');

    });
  }

  handleFetchFail(self, jqXHR, textStatus, errorThrown, url, errorBooleanVariableName, errorMessageVariableName) {
    if (jqXHR.status === 0) {
      // CONNECTION REFUSED
      self.setState({
        [errorBooleanVariableName]: true,
        [errorMessageVariableName]: 'ERROR: CONNECTION REFUSED to ' + url
      });
    } else {  
      // UNKNOWN (TODO: add more errors here)
      self.setState({
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
  updateRootState = (settingsObject, callback) => {
    this.setState({
      ...settingsObject
    }, () => {
      // setState() has completed, call the callback if we have one
      if (callback) { callback(); }
    });
  };

  // TODO: refactor this for splitting of data fetch into each component
  updateStateAndReloadNagiosData = (settingsObject) => {
    this.setState({
      ...settingsObject
    }, () => {
      // Save Cookie
      this.saveCookie();
      // Reload data from server now (TODO: cant do this since host and service fetch moved into child components)
      //this.fetchHostData();
      //this.fetchServiceData();
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

    const settingsLoaded = this.state.isDoneLoading;
    
    const { language } = this.state;

    //const howManyHostAndServicesDown = this.state.serviceProblemsArray.length + this.state.hostProblemsArray.length;

    /**************************************************************************
    * Template Starts Here
    **************************************************************************/

    return (
      <div className="Base" style={{ fontSize: this.state.fontSizeEm}}>

        {/* Top Menu */}

        <TopMenu
          settingsObject={settingsObject}
          isLeftPanelOpen={this.state.isLeftPanelOpen}
          updateRootState={this.updateRootState}
          hideFilters={this.state.hideFilters}
        />

        {/* Left Panel */}

        <LeftPanel
          settingsObject={settingsObject}
          isLeftPanelOpen={this.state.isLeftPanelOpen}
          hideFilters={this.state.hideFilters}
          hideHistoryChart={this.state.hideHistoryChart}
          updateRootState={this.updateRootState}
        />

        {/* Bottom Panel */}
        
        <BottomPanel
          settingsObject={settingsObject}
          hideFilters={this.state.hideFilters}
          hideHistoryChart={this.state.hideHistoryChart}
          updateRootState={this.updateRootState}
          hostlistError={this.state.hostlistError}

          currentVersion={this.state.currentVersion}
          currentVersionString={this.state.currentVersionString}
          latestVersion={this.state.latestVersion}
          latestVersionString={this.state.latestVersionString}

        />

        {/* spacer to counteract the floating header */}

        <div style={{ height: '45px' }}>
        </div>

        {/* wrapper around the main content */}
        <div className={this.state.isLeftPanelOpen ? 'main-content left-panel-open' : 'main-content'}>

          {!settingsLoaded && <div>Settings are not loaded yet</div>}

          <Router>

          <Switch>
            <Route exact path="/">
              <div className="dashboard-area">

                {/* hostgroups */}

                {!this.state.hideFilters && <HostGroupFilter
                  hostgroup={this.state.hostgroup}
                  hostgroupFilter={this.state.hostgroupFilter}
                  updateStateAndReloadNagiosData={this.updateStateAndReloadNagiosData}
                />}

                {/* Hosts Section */}

                {(settingsLoaded && !this.state.hideHostSection) && <HostSection
                  isDemoMode={this.state.isDemoMode}
                  useFakeSampleData={this.useFakeSampleData}
                  baseUrl={this.state.baseUrl}
                  language={this.state.language}
                  hostgroupFilter={this.state.hostgroupFilter}
                  hideFilters={this.state.hideFilters}
                  hostSortOrder={this.state.hostSortOrder}
                  handleSelectChange={this.handleSelectChange}
                  handleCheckboxChange={this.handleCheckboxChange}
                  settingsObject={settingsObject}
                  commentlist={this.state.commentlist}
                  handleFetchFail={this.handleFetchFail}
                  fetchFrequency={this.state.fetchFrequency}
                />} 

                {/* Services Section */}

                {(settingsLoaded && !this.state.hideServiceSection) && <ServiceSection
                  isDemoMode={this.state.isDemoMode}
                  useFakeSampleData={this.useFakeSampleData}
                  baseUrl={this.state.baseUrl}
                  language={this.state.language}
                  hostgroupFilter={this.state.hostgroupFilter}
                  hideFilters={this.state.hideFilters}
                  serviceSortOrder={this.state.serviceSortOrder}
                  handleSelectChange={this.handleSelectChange}
                  handleCheckboxChange={this.handleCheckboxChange}
                  settingsObject={settingsObject}
                  commentlist={this.state.commentlist}
                  handleFetchFail={this.handleFetchFail}
                  fetchFrequency={this.state.fetchFrequency}
                />}
                            
                {/* Alert History Section */}

                {(settingsLoaded && !this.state.hideHistory) && <AlertSection
                  isDemoMode={this.state.isDemoMode}
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
                  useFakeSampleData={this.useFakeSampleData}
                  baseUrl={this.state.baseUrl}
                  hostgroupFilter={this.state.hostgroupFilter}
                  fetchAlertFrequency={this.state.fetchAlertFrequency}
                  handleFetchFail={this.handleFetchFail}
                />}

              </div>

            </Route>
            <Route path="/help">
              <Help
                updateRootState={this.updateRootState}
                isLeftPanelOpen={this.state.isLeftPanelOpen}
              />
            </Route>
            <Route path="/settings">
              <Settings
                ref="settings"
                baseUrl={this.state.baseUrl}
                baseUrlChanged={this.baseUrlChanged.bind(this)}
                settings={settingsObject}
                settingsFields={this.settingsFields}
                updateRootState={this.updateRootState}
                isCookieLoaded={this.state.isCookieLoaded}
                hostlistError={this.state.hostlistError}
              />
            </Route>
            <Route path="/update">
              <AutoUpdate
                updateRootState={this.updateRootState}
                currentVersion={this.state.currentVersion}
                currentVersionString={this.state.currentVersionString}
              />
            </Route>
          </Switch>
          </Router>

          



          

          
        
        </div> {/* endwrapper around the main content */}
        
      </div>
    );
  }
}

export default Base;
