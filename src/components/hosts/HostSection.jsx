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

import { translate } from '../../helpers/language';
import { cleanDemoDataHostlist } from '../../helpers/nagiostv';
import { convertHostObjectToArray } from '../../helpers/nagiostv';

import HostItems from './HostItems.jsx';
import HostFilters from './HostFilters.jsx';
import Demo from '../Demo.jsx';

// 3rd party addons
import moment from 'moment';
import $ from 'jquery';

// icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSync, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

//import './HostSection.css';

class HostSection extends Component {

  state = {
    isFetching: false,
    hostlistError: false,
    hostlistErrorCount: 0,
    hostlistErrorMessage: '',
    hostlistLastUpdate: 0,
    hostlist: {},
    hostProblemsArray: []
  };
  
  isComponentMounted = false;
  timeoutHandle = null;
  intervalHandle = null;

  componentDidMount() {

    this.isComponentMounted = true;

    this.timeoutHandle = setTimeout(() => {
      this.fetchHostData();
    }, 1000);

    if (this.props.isDemoMode === false) {
      // we fetch alerts on a slower frequency interval
      this.intervalHandle = setInterval(() => {
        this.fetchHostData();
      }, this.props.fetchFrequency * 1000);
      
    }
  }

  componentWillUnmount() {
    if (this.timeoutHandle) {
      clearTimeout(this.timeoutHandle);
    }
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
    }

    this.isComponentMounted = false;
  }

  fetchHostData() {

    // if we are offline, let's just skip
    if (!navigator.onLine) {
      console.log('fetchHostData() browser is offline');
      return;
    }

    let url;
    if (this.props.useFakeSampleData) {
      url = './sample-data/hostlist.json';
    } else if (this.props.settingsObject.dataSource === 'livestatus') {
      url = this.props.settingsObject.livestatusPath + '?query=hostlist&details=true';
      if (this.props.hostgroupFilter) { url += `&hostgroup=${this.props.hostgroupFilter}`; }
    } else {
      url = this.props.baseUrl + 'statusjson.cgi?query=hostlist&details=true';
      if (this.props.hostgroupFilter) { url += `&hostgroup=${this.props.hostgroupFilter}`; }
    }

    this.setState({ isFetching: true });

    $.ajax({
      method: "GET",
      url,
      dataType: "json",
      timeout: (this.props.fetchFrequency - 2) * 1000
    }).done((myJson, textStatus, jqXHR) => {

      // test that return data is json
      if (jqXHR.getResponseHeader('content-type').indexOf('application/json') === -1) {
        console.log('fetchHostData() ERROR: got response but result data is not JSON. Base URL setting is probably wrong.');
        this.setState({
          isFetching: false,
          hostlistError: true,
          hostlistErrorCount: this.state.hostlistErrorCount + 1,
          hostlistErrorMessage: 'ERROR: Result data is not JSON. Base URL setting is probably wrong.'
        });
        return;
      }

      // Make an array from the object
      let hostlist = _.get(myJson.data, 'hostlist', {});

      // If we are in demo mode then clean the fake data
      if (this.props.isDemoMode) {
        hostlist = cleanDemoDataHostlist(hostlist);
      }

      // convert the host object into an array (and sort it)
      const hostProblemsArray = convertHostObjectToArray(hostlist, this.props.hostSortOrder);

      // check for old data (nagios down?)
      const duration = moment.duration(new Date().getTime() - myJson.result.last_data_update);
      const hours = duration.asHours().toFixed(1);

      if (!this.props.isDemoMode && hours >= 1) {
        if (this.isComponentMounted) {
          this.setState({
            isFetching: false,
            hostlistError: true,
            hostlistErrorMessage: `Data is stale ${hours} hours. Is Nagios running?`,
            hostlistLastUpdate: new Date().getTime(),
            hostlist,
            hostProblemsArray: hostProblemsArray
          });
        }
      } else {
        if (this.isComponentMounted) {
          this.setState({
            isFetching: false,
            hostlistError: false,
            hostlistErrorCount: 0,
            hostlistErrorMessage: '',
            hostlistLastUpdate: new Date().getTime(),
            hostlist,
            hostProblemsArray: hostProblemsArray
          });
        }
      }

    }).fail((jqXHR, textStatus, errorThrown) => {

      this.setState({
        isFetching: false,
        hostlistError: true,
        hostlistErrorCount: this.state.hostlistErrorCount + 1,
        hostlistErrorMessage: 'ERROR: CONNECTION REFUSED to ' + url
      });

    });
  }

  // allows demo mode to access the state in this component
  updateParentState = state => this.setState(state);

  render() {

    const { language, settingsObject } = this.props;

    // count how many items in each of the host states
    const howManyHosts = Object.keys(this.state.hostlist).length;
    let howManyHostPending = 0;
    let howManyHostUp = 0; // TODO: is this being used? think not
    let howManyHostDown = 0;
    let howManyHostUnreachable = 0;
    let howManyHostAcked = 0;
    let howManyHostScheduled = 0;
    let howManyHostFlapping = 0;
    let howManyHostSoft = 0;
    let howManyHostNotificationsDisabled = 0;

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
        // count notifications_enabled === false
        // only count these if they are not up
        if (this.state.hostlist[host].status !== 2 && this.state.hostlist[host].notifications_enabled === false) {
          howManyHostNotificationsDisabled++;
        }
      });
    }

    return (
      <div className="HostSection">

        {/* Demo mode logic is inside this component */}
        {this.props.isDemoMode && <Demo
          type={'host'}
          hostlist={this.state.hostlist}
          hostSortOrder={this.state.hostSortOrder}
          //servicelist={this.state.servicelist}
          //serviceSortOrder={this.state.serviceSortOrder}
          updateParentState={this.updateParentState}
          settingsObject={settingsObject}
        />}

        <div className="service-summary">
          
          <span className="service-summary-title">
            <strong>{howManyHosts}</strong> {howManyHosts.length === 1 ? translate('host', language) : translate('hosts', language)}{' '}
            {this.props.hostgroupFilter && <span>({this.props.hostgroupFilter})</span>}

            
          </span>

          {/* host filters */}
          <HostFilters
            hideFilters={this.props.hideFilters}
            hostSortOrder={this.props.hostSortOrder}
            handleSelectChange={this.props.handleSelectChange}
            handleCheckboxChange={this.props.handleCheckboxChange}

            howManyHosts={howManyHosts}
            howManyHostDown={howManyHostDown}
            howManyHostUnreachable={howManyHostUnreachable}
            howManyHostPending={howManyHostPending}
            howManyHostAcked={howManyHostAcked}
            howManyHostScheduled={howManyHostScheduled}
            howManyHostFlapping={howManyHostFlapping}
            howManyHostSoft={howManyHostSoft}
            howManyHostNotificationsDisabled={howManyHostNotificationsDisabled}

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

          {/* loading spinner */}
          <span className={this.state.isFetching ? 'loading-spinner' : 'loading-spinner loading-spinner-fadeout'}>
            {(!this.props.isDemoMode && this.state.hostlistError) && <span style={{ color: 'yellow'}}>{this.state.hostlistErrorCount} x <FontAwesomeIcon icon={faExclamationTriangle} /> &nbsp; </span>}
            <FontAwesomeIcon icon={faSync} /> {this.props.fetchFrequency}s
          </span>
        </div>

        {/** Show Error Message - If we are not in demo mode and there is a hostlist error (ajax fetching) then show the error message here */}
        {(!this.props.isDemoMode && this.state.hostlistError && this.state.hostlistErrorCount > 2) && <div className="margin-top-10 border-red ServiceItemError"><span role="img" aria-label="error">⚠️</span> {this.state.hostlistErrorMessage}</div>}

        {/* hostitems list */}
        <HostItems
          hostProblemsArray={this.state.hostProblemsArray}
          commentlist={this.props.commentlist}
          settings={settingsObject}

          howManyHosts={howManyHosts}
          howManyHostUp={howManyHostUp}
          howManyHostDown={howManyHostDown}
          howManyHostUnreachable={howManyHostUnreachable}
          howManyHostPending={howManyHostPending}
          howManyHostAcked={howManyHostAcked}
          howManyHostScheduled={howManyHostScheduled}
          howManyHostFlapping={howManyHostFlapping}
          howManyHostSoft={howManyHostSoft}
          howManyHostNotificationsDisabled={howManyHostNotificationsDisabled}

          isDemoMode={this.props.isDemoMode}
          hostlistError={this.state.hostlistError}
        />

      </div>
    );
  }
}

export default HostSection;
