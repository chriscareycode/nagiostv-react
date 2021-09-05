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

import React, { useCallback, useEffect } from 'react';
// Recoil
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { bigStateAtom, clientSettingsAtom, clientSettingsInitial } from '../../atoms/settingsState';
import { serviceIsFetchingAtom, serviceAtom, serviceHowManyAtom, serviceIsFakeDataSetAtom } from '../../atoms/serviceAtom';

import { translate } from '../../helpers/language';
import { cleanDemoDataServicelist } from '../../helpers/nagiostv';
import { convertServiceObjectToArray } from '../../helpers/nagiostv';

import PollingSpinner from '../widgets/PollingSpinner';
import ServiceItems from './ServiceItems.jsx';
import ServiceFilters from './ServiceFilters.jsx';

// 3rd party addons
import moment from 'moment';
import $ from 'jquery';

let isComponentMounted = false;

const ServiceSection = () => {

  //console.log('ServiceSection run');

  // Recoil state (this section)
  const [serviceIsFetching, setServiceIsFetching] = useRecoilState(serviceIsFetchingAtom);
  const setServiceIsFakeDataSet = useSetRecoilState(serviceIsFakeDataSetAtom);
  const [serviceState, setServiceState] = useRecoilState(serviceAtom);
  const setServiceHowManyState = useSetRecoilState(serviceHowManyAtom);
  // Recoil state (main)
  const [bigState, setBigState] = useRecoilState(bigStateAtom);
  const clientSettings = useRecoilValue(clientSettingsAtom);
  
  // Chop the bigState into vars
  const {
    isDemoMode,
    useFakeSampleData,
  } = bigState;

  // Chop the clientSettings into vars
  const {
    fetchServiceFrequency,
    hostgroupFilter,
    serviceSortOrder,
    language,
  } = clientSettings;

  useEffect(() => {

    isComponentMounted = true;

    const timeoutHandle = setTimeout(() => {
      fetchServiceData();
    }, 1000);
    let intervalHandle = null;

    if (isDemoMode === false && useFakeSampleData == false) {
      // safetly net in case the interval value is bad
      const fetchServiceFrequencySafe = (typeof fetchServiceFrequency === 'number' && fetchServiceFrequency >= 5) ? fetchServiceFrequency : clientSettingsInitial.fetchServiceFrequency;
      // we fetch alerts on a slower frequency interval
      intervalHandle = setInterval(() => {
        fetchServiceData();
      }, fetchServiceFrequencySafe * 1000);
    }

    return () => {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
      if (intervalHandle) {
        clearInterval(intervalHandle);
      }
      isComponentMounted = false;
    };
  }, [clientSettings.fetchServiceFrequency]);
  
  const howManyCounter = useCallback((servicelist) => {
    //console.log('ServiceSection howManyCounter() useCallback() serviceState.response changed');

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

    if (servicelist) {
      Object.keys(servicelist).forEach((host) => {
        howManyServices += Object.keys(servicelist[host]).length;
        Object.keys(servicelist[host]).forEach((service) => {
          if (servicelist[host][service].status === 1) {
            howManyServicePending++;
          }
          if (servicelist[host][service].status === 4) {
            howManyServiceWarning++;
          }
          if (servicelist[host][service].status === 8) {
            howManyServiceUnknown++;
          }
          if (servicelist[host][service].status === 16) {
            howManyServiceCritical++;
          }
          if (servicelist[host][service].problem_has_been_acknowledged) {
            howManyServiceAcked++;
          }
          if (servicelist[host][service].scheduled_downtime_depth > 0) {
            howManyServiceScheduled++;
          }
          if (servicelist[host][service].is_flapping) {
            howManyServiceFlapping++;
          }
          // only count soft items if they are not OK state
          if (servicelist[host][service].status !== 2 && servicelist[host][service].state_type === 0) {
            howManyServiceSoft++;
          }
          // count notifications_enabled === false
          // only count notifications_enabled items if they are not OK state
          if (servicelist[host][service].status !== 2 && servicelist[host][service].notifications_enabled === false) {
            howManyServiceNotificationsDisabled++;
          }
        });
      });
    }

    const howManyServiceOk = howManyServices - howManyServiceWarning - howManyServiceCritical - howManyServiceUnknown;

    setServiceHowManyState({
      howManyServices,
      howManyServiceOk,
      howManyServiceWarning,
      howManyServiceUnknown,
      howManyServiceCritical,
      howManyServicePending,
      howManyServiceAcked,
      howManyServiceScheduled,
      howManyServiceFlapping,
      howManyServiceSoft,
      howManyServiceNotificationsDisabled,
    });

  }, [serviceState]);

  const fetchServiceData = () => {

    // if we are offline, let's just skip
    // if (!navigator.onLine) {
    //   console.log('fetchServiceData() browser is offline');
    //   return;
    // }

    let url;
    if (useFakeSampleData) {
      url = './sample-data/servicelist.json';
    } else if (clientSettings.dataSource === 'livestatus') {
      url = clientSettings.livestatusPath + '?query=servicelist&details=true';
      if (hostgroupFilter) { url += `&hostgroup=${hostgroupFilter}`; }
    } else {
      url = clientSettings.baseUrl + 'statusjson.cgi?query=servicelist&details=true';
      if (hostgroupFilter) { url += `&hostgroup=${hostgroupFilter}`; }
    }
    //console.log('Requesting Service Data: ' + url);

    setServiceIsFetching(true);

    $.ajax({
      method: "GET",
      url,
      dataType: "json",
      timeout: (fetchServiceFrequency - 2) * 1000
    }).done((myJson, textStatus, jqXHR) => {

      // test that return data is json
      if (jqXHR.getResponseHeader('content-type').indexOf('application/json') === -1) {
        console.log('fetchServiceData() ERROR: got response but result data is not JSON. Base URL setting is probably wrong.');
        setServiceIsFetching(false);
        setServiceState(curr => ({
          ...curr,
          error: true,
          errorCount: curr.errorCount + 1,
          errorMessage: 'ERROR: Result data is not JSON. Base URL setting is probably wrong.'
        }));
        
        return;
      }

      // Success

      // Make an array from the object
      let my_list = _.get(myJson.data, 'servicelist', {});

      // If we are in demo mode then clean the fake data
      if (isDemoMode) {
        my_list = cleanDemoDataServicelist(my_list);
      }

      // convert the service object into an array (and sort it)
      const myArray = convertServiceObjectToArray(my_list);

      // check for old stale data (detect if nagios is down)
      const duration = moment.duration(new Date().getTime() - myJson.result.last_data_update);
      const hours = duration.asHours().toFixed(1);

      // we disable the stale check if in demo mode since the demo data is always stale
      if (isDemoMode === false && useFakeSampleData == false && hours >= 1) {
        if (isComponentMounted) {
          setServiceIsFetching(false);
          setServiceState(curr => ({
            ...curr,
            error: true,
            errorCount: curr.errorCount + 1,
            errorMessage: `Data is stale ${hours} hours. Is Nagios running?`,
            lastUpdate: new Date().getTime(),
            response: my_list,
            problemsArray: myArray
          }));
        }
      } else {
        
        if (isComponentMounted) {
          setServiceIsFetching(false);
          setServiceState(curr => ({
            ...curr,
            error: false,
            errorCount: 0,
            errorMessage: '',
            lastUpdate: new Date().getTime(),
            response: my_list,
            problemsArray: myArray
          }));

          setServiceIsFakeDataSet(useFakeSampleData);

          howManyCounter(my_list);
        }
      }
    }).fail((jqXHR, textStatus, errorThrown) => { 
      if (isComponentMounted) {
        setServiceIsFetching(false);
        setServiceState(curr => ({
          ...curr,
          error: true,
          errorCount: curr.errorCount + 1,
          errorMessage: `ERROR: CONNECTION REFUSED to ${url}`
        }));
      }
    });
  }

  // allows demo mode to access the state in this component
  //updateParentState = state => this.setState(state);

  const servicelist = serviceState.response;

  // Mutating state on hostState.problemsArray is not allowed (the sort below)
  // so we need to copy this to something
  let serviceProblemsArray = [];
  if (Array.isArray(serviceState.problemsArray)) {
    serviceProblemsArray = [...serviceState.problemsArray];
  }

  const howManyServices = Object.keys(servicelist).length;

  let sort = 1;
  if (serviceSortOrder === 'oldest') { sort = -1; }
  serviceProblemsArray.sort((a, b) => {
    if (a.last_time_ok < b.last_time_ok) { return 1 * sort; }
    if (a.last_time_ok > b.last_time_ok) { return -1 * sort; }
    return 0;
  });

  return (
    <div className="ServiceSection">
      
      <div className="service-summary">
            
        <span className="service-summary-title">
          <strong>{howManyServices}</strong> {howManyServices === 1 ? translate('service', language) : translate('services', language)}{' '}
          {hostgroupFilter && <span>({hostgroupFilter})</span>}
        </span>

        {/* service filters */}
        <ServiceFilters />

        {/* how many down emoji */}
        {/*
        {showEmoji && <HowManyEmoji
          howMany={howManyServices}
          howManyWarning={howManyServiceWarning}
          howManyCritical={howManyServiceCritical}
          howManyDown={serviceProblemsArray.length}
        />}
        */}

        {/* loading spinner */}
        <PollingSpinner
          isFetching={serviceIsFetching}
          isDemoMode={isDemoMode}
          error={serviceState.error}
          errorCount={serviceState.errorCount}
          fetchVariableName={'fetchServiceFrequency'}
        />

      </div>
      
      {/** Show Error Message - If we are not in demo mode and there is a servicelist error (ajax fetching) then show the error message here */}
      {(!isDemoMode && serviceState.error && serviceState.errorCount > 2) && <div className="margin-top-10 border-red ServiceItemError"><span role="img" aria-label="error">⚠️</span> {serviceState.errorMessage}</div>}

      <ServiceItems
        serviceProblemsArray={serviceState.problemsArray}
        settings={clientSettings}
        servicelistError={serviceState.error}
      />

    </div>
  );
  
};

export default ServiceSection;
