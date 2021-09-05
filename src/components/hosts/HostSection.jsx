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

import React, { useCallback, useEffect, useState } from 'react';
// Recoil
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { bigStateAtom, clientSettingsAtom } from '../../atoms/settingsState';
import { hostIsFetchingAtom, hostAtom, hostHowManyAtom, hostIsFakeDataSetAtom } from '../../atoms/hostAtom';

import PollingSpinner from '../widgets/PollingSpinner';
import { translate } from '../../helpers/language';
import { cleanDemoDataHostlist } from '../../helpers/nagiostv';
import { convertHostObjectToArray } from '../../helpers/nagiostv';

import HostItems from './HostItems';
import HostFilters from './HostFilters';

// 3rd party addons
import moment from 'moment';
import $ from 'jquery';

//import './HostSection.css';

let isComponentMounted = false;

const HostSection = () => {

  //console.log('HostSection run', new Date());

  // Recoil state (this section)
  const [hostIsFetching, setHostIsFetching] = useRecoilState(hostIsFetchingAtom);
  const setHostIsFakeDataSet = useSetRecoilState(hostIsFakeDataSetAtom);
  const [hostState, setHostState] = useRecoilState(hostAtom);
  const setHostHowManyState = useSetRecoilState(hostHowManyAtom);
  // Recoil state (main)
  const [bigState, setBigState] = useRecoilState(bigStateAtom);
  const clientSettings = useRecoilValue(clientSettingsAtom);

  // Chop the bigState into vars
  const {
    isDemoMode,
    //isDebugMode,
    useFakeSampleData,
    //isDoneLoading,
    //hostgroup,
    //settingsLoaded,
    //fetchHostFrequency,
    //hideFilters,
  } = bigState;

  // Chop the clientSettings into vars
  const {
    fetchHostFrequency,
    hostSortOrder,
    hostgroupFilter,
    //hideHistory,
    //hideHostDown,
    //hideHostSection,
    language,
  } = clientSettings;
  
  useEffect(() => {

    isComponentMounted = true;

    const timeoutHandle = setTimeout(() => {
      fetchHostData();
    }, 1000);
    let intervalHandle = null;

    if (isDemoMode === false && useFakeSampleData === false) {
      // we fetch alerts on a slower frequency interval
      intervalHandle = setInterval(() => {
        fetchHostData();
      }, fetchHostFrequency * 1000);
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
  }, []);
  
  const howManyCounter = useCallback((hostlist) => {
    //console.log('HostSection howManyCounter() useCallback() hostState.response changed');

    // count how many items in each of the host states
    const howManyHosts = Object.keys(hostlist).length;
    let howManyHostPending = 0;
    let howManyHostUp = 0;
    let howManyHostDown = 0;
    let howManyHostUnreachable = 0;
    let howManyHostAcked = 0;
    let howManyHostScheduled = 0;
    let howManyHostFlapping = 0;
    let howManyHostSoft = 0;
    let howManyHostNotificationsDisabled = 0;

    if (hostlist) {
      Object.keys(hostlist).forEach((host) => {

        if (hostlist[host].status === 1) {
          howManyHostPending++;
        }
        if (hostlist[host].status === 4) {
          howManyHostDown++;
        }
        if (hostlist[host].status === 8) {
          howManyHostUnreachable++;
        }
        if (hostlist[host].problem_has_been_acknowledged) {
          howManyHostAcked++;
        }
        if (hostlist[host].scheduled_downtime_depth > 0) {
          howManyHostScheduled++;
        }
        if (hostlist[host].is_flapping) {
          howManyHostFlapping++;
        }
        // only count soft items if they are not up
        if (hostlist[host].status !== 2 && hostlist[host].state_type === 0) {
          howManyHostSoft++;
        }
        // count notifications_enabled === false
        // only count these if they are not up
        if (hostlist[host].status !== 2 && hostlist[host].notifications_enabled === false) {
          howManyHostNotificationsDisabled++;
        }
      });

      howManyHostUp = howManyHosts - howManyHostDown - howManyHostUnreachable;
    }

    setHostHowManyState({
      howManyHosts,
      howManyHostPending,
      howManyHostUp,
      howManyHostDown,
      howManyHostUnreachable,
      howManyHostAcked,
      howManyHostScheduled,
      howManyHostFlapping,
      howManyHostSoft,
      howManyHostNotificationsDisabled,
    });


  }, [hostState]);

  const fetchHostData = () => {

    // if we are offline, let's just skip
    // if (!navigator.onLine) {
    //   console.log('fetchHostData() browser is offline');
    //   return;
    // }

    let url;
    if (useFakeSampleData) {
      url = './sample-data/hostlist.json';
    } else if (clientSettings.dataSource === 'livestatus') {
      url = clientSettings.livestatusPath + '?query=hostlist&details=true';
      if (hostgroupFilter) { url += `&hostgroup=${hostgroupFilter}`; }
    } else {
      url = clientSettings.baseUrl + 'statusjson.cgi?query=hostlist&details=true';
      if (hostgroupFilter) { url += `&hostgroup=${hostgroupFilter}`; }
    }

    setHostIsFetching(true);

    $.ajax({
      method: "GET",
      url,
      dataType: "json",
      timeout: (fetchHostFrequency - 2) * 1000
    }).done((myJson, textStatus, jqXHR) => {

      // test that return data is json
      if (jqXHR.getResponseHeader('content-type').indexOf('application/json') === -1) {
        console.log('fetchHostData() ERROR: got response but result data is not JSON. Base URL setting is probably wrong.');
        setHostIsFetching(false);
        setHostState(curr => ({
          ...curr,
          error: true,
          errorCount: curr.errorCount + 1,
          errorMessage: 'ERROR: Result data is not JSON. Base URL setting is probably wrong.'
        }));
        return;
      }

      // Success

      // Make an array from the object
      let my_list = _.get(myJson.data, 'hostlist', {});

      // If we are in demo mode then clean the fake data
      // The fake data has a bunch of dates of hosts and services being down.
      // This routine will set all the fake data to UP/OK
      if (isDemoMode) {
        my_list = cleanDemoDataHostlist(my_list);
      }


      // convert the host object into an array
      const myArray = convertHostObjectToArray(my_list);

      // check for old data (nagios down?)
      const duration = moment.duration(new Date().getTime() - myJson.result.last_data_update);
      const hours = duration.asHours().toFixed(1);

      if (isDemoMode === false && useFakeSampleData === false && hours >= 1) {
        // Data is stale
        if (isComponentMounted) {
          setHostIsFetching(false);

          setHostState(curr => ({
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
        // Data is not stale, good
        if (isComponentMounted) {
          setHostIsFetching(false);

          setHostState(curr => ({
            ...curr,
            error: false,
            errorCount: 0,
            errorMessage: '',
            lastUpdate: new Date().getTime(),
            response: my_list,
            problemsArray: myArray
          }));

          setHostIsFakeDataSet(useFakeSampleData);


          howManyCounter(my_list);
        }
      }
    }).fail((jqXHR, textStatus, errorThrown) => {
      if (isComponentMounted) {
        setHostIsFetching(false);

        setHostState(curr => ({
          ...curr,
          error: true,
          errorCount: curr.errorCount + 1,
          errorMessage: `ERROR: CONNECTION REFUSED to ${url}`
        }));
      }
    });
  };

  const hostlist = hostState.response;

  // Mutating state on hostState.problemsArray is not allowed (the sort below)
  // so we need to copy this to something
  let hostProblemsArray = [];
  if (Array.isArray(hostState.problemsArray)) {
    hostProblemsArray = [...hostState.problemsArray];
  }

  const howManyHosts = Object.keys(hostlist).length;

  // Sort the data based on the hostSortOrder value
  let sort = 1;
  if (hostSortOrder === 'oldest') { sort = -1; }
  //console.log('hostProblemsArray', hostProblemsArray);
  hostProblemsArray.sort((a, b) => {
    if (a.last_time_up < b.last_time_up) { return 1 * sort; }
    if (a.last_time_up > b.last_time_up) { return -1 * sort; }
    return 0;
  });

  return (
    <div className="HostSection">

      <div className="service-summary">
        
        <span className="service-summary-title">
          <strong>{howManyHosts}</strong> {howManyHosts === 1 ? translate('host', language) : translate('hosts', language)}{' '}
          {hostgroupFilter && <span>({hostgroupFilter})</span>}
        </span>

        {/* host filters */}
        <HostFilters />

        {/* loading spinner */}
        <PollingSpinner
          isFetching={hostIsFetching}
          isDemoMode={isDemoMode}
          error={hostState.error}
          errorCount={hostState.errorCount}
          //fetchFrequency={fetchHostFrequency}
          fetchVariableName={'fetchHostFrequency'}
        />

      </div>

      {/** Show Error Message - If we are not in demo mode and there is a hostlist error (ajax fetching) then show the error message here */}
      {(!isDemoMode && hostState.error && hostState.errorCount > 2) && <div className="margin-top-10 border-red ServiceItemError"><span role="img" aria-label="error">⚠️</span> {hostState.errorMessage}</div>}

      {/* hostitems list */}
      <HostItems
        hostProblemsArray={hostState.problemsArray}
        settings={clientSettings}
        hostlistError={hostState.error}
      />

    </div>
  );
  
};

export default HostSection;
