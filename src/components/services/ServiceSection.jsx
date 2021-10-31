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
import { cleanDemoDataServicelist } from '../../helpers/nagiostv';
import { convertServiceObjectToArray } from '../../helpers/nagiostv';

import ServiceItems from './ServiceItems.jsx';
import ServiceFilters from './ServiceFilters.jsx';
import Demo from '../Demo.jsx';

// 3rd party addons
import moment from 'moment';
import $ from 'jquery';

// icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSync, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

class ServiceSection extends Component {

  state = {
    isFetching: false,
    servicelistError: false,
    servicelistErrorCount: 0,
    servicelistErrorMessage: '',
    servicelistLastUpdate: 0,
    servicelist: {},
    serviceProblemsArray: []
  };
  
  isComponentMounted = false;
  timeoutHandle = null;
  intervalHandle = null;
    
  componentDidMount() {
  
    this.isComponentMounted = true;

    this.timeoutHandle = setTimeout(() => {
      this.fetchServiceData();
    }, 1000);

    if (this.props.isDemoMode === false) {
      // fetch host problems and service problems on an interval
      this.intervalHandle = setInterval(() => {
        this.fetchServiceData();
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

  shouldComponentUpdate(nextProps, nextState) {
    if (this.props.serviceSortOrder !== nextProps.serviceSortOrder) {
      this.reSortTheData();
    }
    return true;
  }

  reSortTheData = () => {
    // flip the data upside down
    this.setState({ serviceProblemsArray: this.state.serviceProblemsArray.reverse() });
  };

  fetchServiceData() {

    // if we are offline, let's just skip
    // This is broken on Midori browser on Raspberry Pi and I assume others then. Disabling for now.
    // if (!navigator.onLine) {
    //   console.log('fetchServiceData() browser is offline');
    //   return;
    // }

    let url;
    if (this.props.useFakeSampleData) {
      url = './sample-data/servicelist.json';
    } else if (this.props.settingsObject.dataSource === 'livestatus') {
      url = this.props.settingsObject.livestatusPath + '?query=servicelist&details=true';
      if (this.props.hostgroupFilter) { url += `&hostgroup=${this.props.hostgroupFilter}`; }
    } else {
      url = this.props.baseUrl + 'statusjson.cgi?query=servicelist&details=true';
      if (this.props.hostgroupFilter) { url += `&hostgroup=${this.props.hostgroupFilter}`; }
    }
    //console.log('Requesting Service Data: ' + url);

    this.setState({ isFetching: true });

    $.ajax({
      method: "GET",
      url,
      dataType: "json",
      timeout: (this.props.fetchFrequency - 2) * 1000
    }).done((myJson, textStatus, jqXHR) => {

      // test that return data is json
      if (jqXHR.getResponseHeader('content-type').indexOf('application/json') === -1) {
        console.log('fetchServiceData() ERROR: got response but result data is not JSON. Base URL setting is probably wrong.');
        this.setState({
          isFetching: false,
          servicelistError: true,
          servicelistErrorCount: this.state.servicelistErrorCount + 1,
          servicelistErrorMessage: 'ERROR: Result data is not JSON. Base URL setting is probably wrong.'
        });
        return;
      }

      // Make an array from the object
      let servicelist = _.get(myJson.data, 'servicelist', {});

      // If we are in demo mode then clean the fake data
      if (this.props.isDemoMode) {
        servicelist = cleanDemoDataServicelist(servicelist);
      }

      // convert the service object into an array (and sort it)
      const serviceProblemsArray = convertServiceObjectToArray(servicelist, this.props.serviceSortOrder);

      // check for old stale data (detect if nagios is down)
      const duration = moment.duration(new Date().getTime() - myJson.result.last_data_update);
      const hours = duration.asHours().toFixed(1);

      // we disable the stale check if in demo mode since the demo data is always stale
      if (!this.props.isDemoMode && hours >= 1) {
        if (this.isComponentMounted) {
          this.setState({
            isFetching: false,
            servicelistError: true,
            servicelistErrorCount: this.state.servicelistErrorCount + 1,
            servicelistErrorMessage: `Data is stale ${hours} hours. Is Nagios running?`,
            servicelistLastUpdate: new Date().getTime(),
            servicelist,
            serviceProblemsArray: serviceProblemsArray
          });
        }
      } else {
        if (this.isComponentMounted) {
          this.setState({
            isFetching: false,
            servicelistError: false,
            servicelistErrorCount: 0,
            servicelistErrorMessage: '',
            servicelistLastUpdate: new Date().getTime(),
            servicelist,
            serviceProblemsArray: serviceProblemsArray
          });
        }
      }

    }).fail((jqXHR, textStatus, errorThrown) => {
      
      this.setState({
        isFetching: false,
        servicelistError: true,
        servicelistErrorCount: this.state.servicelistErrorCount + 1,
        servicelistErrorMessage: 'ERROR: CONNECTION REFUSED to ' + url
      });

    });
  }

  // allows demo mode to access the state in this component
  updateParentState = state => this.setState(state);

  render() {

    const { language, settingsObject } = this.props;

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
    let howManyServiceNotificationsDisabled = 0;

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
          // only count soft items if they are not OK state
          if (this.state.servicelist[host][service].status !== 2 && this.state.servicelist[host][service].state_type === 0) {
            howManyServiceSoft++;
          }
          // count notifications_enabled === false
          // only count notifications_enabled items if they are not OK state
          if (this.state.servicelist[host][service].status !== 2 && this.state.servicelist[host][service].notifications_enabled === false) {
            howManyServiceNotificationsDisabled++;
          }
        });
      });
    }

    return (
      <div className="ServiceSection">

        {/* Demo mode logic is inside this component */}
        {this.props.isDemoMode && <Demo
          type={'service'}
          //hostlist={this.state.hostlist}
          //hostSortOrder={this.state.hostSortOrder}
          servicelist={this.state.servicelist}
          serviceSortOrder={this.state.serviceSortOrder}
          updateParentState={this.updateParentState}
          settingsObject={settingsObject}
        />}
        
        <div className="service-summary">
              
          <span className="service-summary-title">
            <strong>{howManyServices}</strong> {howManyServices === 1 ? translate('service', language) : translate('services', language)}{' '}
            {this.props.hostgroupFilter && <span>({this.props.hostgroupFilter})</span>}
          </span>

          {/* service filters */}
          <ServiceFilters
            hideFilters={this.props.hideFilters}
            serviceSortOrder={this.props.serviceSortOrder}
            handleSelectChange={this.props.handleSelectChange}
            handleCheckboxChange={this.props.handleCheckboxChange}

            howManyServices={howManyServices}
            howManyServiceWarning={howManyServiceWarning}
            howManyServicePending={howManyServicePending}
            howManyServiceUnknown={howManyServiceUnknown}
            howManyServiceCritical={howManyServiceCritical}
            howManyServiceAcked={howManyServiceAcked}
            howManyServiceScheduled={howManyServiceScheduled}
            howManyServiceFlapping={howManyServiceFlapping}
            howManyServiceSoft={howManyServiceSoft}
            howManyServiceNotificationsDisabled={howManyServiceNotificationsDisabled}

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

          {/* loading spinner */}
          <span className={this.state.isFetching ? 'loading-spinner' : 'loading-spinner loading-spinner-fadeout'}>
            {(!this.props.isDemoMode && this.state.servicelistError) && <span style={{ color: 'yellow'}}>{this.state.servicelistErrorCount} x <FontAwesomeIcon icon={faExclamationTriangle} /> &nbsp; </span>}
            <FontAwesomeIcon icon={faSync} /> {this.props.fetchFrequency}s
          </span>

        </div>
        
        {/** Show Error Message - If we are not in demo mode and there is a servicelist error (ajax fetching) then show the error message here */}
        {(!this.props.isDemoMode && this.state.servicelistError && this.state.servicelistErrorCount > 2) && <div className="margin-top-10 border-red ServiceItemError"><span role="img" aria-label="error">⚠️</span> {this.state.servicelistErrorMessage}</div>}

        <ServiceItems
          serviceProblemsArray={this.state.serviceProblemsArray}
          commentlist={this.props.commentlist}
          settings={this.props.settingsObject}

          howManyServices={howManyServices}
          howManyServiceWarning={howManyServiceWarning}
          howManyServicePending={howManyServicePending}
          howManyServiceUnknown={howManyServiceUnknown}
          howManyServiceCritical={howManyServiceCritical}
          howManyServiceAcked={howManyServiceAcked}
          howManyServiceScheduled={howManyServiceScheduled}
          howManyServiceFlapping={howManyServiceFlapping}
          howManyServiceSoft={howManyServiceSoft}
          howManyServiceNotificationsDisabled={howManyServiceNotificationsDisabled}

          servicelistError={this.state.servicelistError}
        />

      </div>
    );
  }
}

export default ServiceSection;
