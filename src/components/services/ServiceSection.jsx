import React, { Component } from 'react';

import { translate } from '../../helpers/language';
import { cleanDemoDataServicelist } from '../../helpers/nagiostv';
import { convertServiceObjectToArray } from '../../helpers/nagiostv';

import ServiceItems from './ServiceItems.jsx';
import ServiceFilters from './ServiceFilters.jsx';

// 3rd party addons
import moment from 'moment';
import $ from 'jquery';

// icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSync } from '@fortawesome/free-solid-svg-icons';

//import './ServiceSection.css';

class ServiceSection extends Component {

  state = {
    isFetching: false,
    servicelistError: false,
    servicelistErrorMessage: '',
    servicelistLastUpdate: 0,
    servicelist: {},
    serviceProblemsArray: []
  };
  
  isComponentMounted = false;
  timerHandle = null;
    
  componentDidMount() {
  
    this.isComponentMounted = true;

    setTimeout(() => {
      this.fetchServiceData();
    }, 1000);

    if (this.props.isDemoMode === false) {
      // fetch host problems and service problems on an interval
      this.timerHandle = setInterval(() => {
        this.fetchServiceData();
      }, this.props.fetchFrequency * 1000);
    }
  }

  componentWillUnmount() {
    if (this.timerHandle) {
      clearInterval(this.timerHandle);
    }

    this.isComponentMounted = false;
  }

  fetchServiceData() {

    let url;
    if (this.props.useFakeSampleData) {
      url = './sample-data/servicelist.json';
    } else {
      url = this.props.baseUrl + 'statusjson.cgi?query=servicelist&details=true';
      const hostgroupFilter = this.state.hostgroupFilter;
      if (hostgroupFilter) { url += `&hostgroup=${hostgroupFilter}`; }
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
      const serviceProblemsArray = convertServiceObjectToArray(servicelist, this.state.serviceSortOrder);

      // check for old stale data (detect if nagios is down)
      const duration = moment.duration(new Date().getTime() - myJson.result.last_data_update);
      const hours = duration.asHours().toFixed(1);

      // we disable the stale check if in demo mode since the demo data is always stale
      if (!this.props.isDemoMode && hours >= 1) {
        if (this.isComponentMounted) {
          this.setState({
            isFetching: false,
            servicelistError: true,
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
            servicelistErrorMessage: '',
            servicelistLastUpdate: new Date().getTime(),
            servicelist,
            serviceProblemsArray: serviceProblemsArray
          });
        }
      }

    }).fail((jqXHR, textStatus, errorThrown) => {
      
      this.props.handleFetchFail(this, jqXHR, textStatus, errorThrown, url, 'servicelistError', 'servicelistErrorMessage');
    
      this.setState({ isFetching: false });

    });
  }

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

    return (
      <div className="ServiceSection">
        
        <div className="service-summary">
              
          <span className="service-summary-title">
            Monitoring <strong>{howManyServices}</strong> {howManyServices === 1 ? translate('service', language) : translate('services', language)}{' '}
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
          <span className={this.state.isFetching ? 'loading-spinner' : 'loading-spinner loading-spinner-fadeout'}><FontAwesomeIcon icon={faSync} /> {this.props.fetchFrequency}s</span>

        </div>
        
        {/** Show Error Message - If we are not in demo mode and there is a servicelist error (ajax fetching) then show the error message here */}
        {(!this.props.isDemoMode && this.state.servicelistError) && <div className="margin-top-10 border-red ServiceItemError"><span role="img" aria-label="error">⚠️</span> {this.state.servicelistErrorMessage}</div>}

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
          servicelistError={this.state.servicelistError}
        />

      </div>
    );
  }
}

export default ServiceSection;
