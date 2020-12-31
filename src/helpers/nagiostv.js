/**
 * NagiosTV https://nagiostv.com
 * Copyright (C) 2008-2020 Chris Carey https://chriscarey.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
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

export function cleanDemoDataHostlist(hostlist) {
  console.log(hostlist);
  Object.keys(hostlist).forEach(key => {
    //if (hostlist[key].status === 2) {
    hostlist[key].status = 2;
    hostlist[key].last_time_up = new Date().getTime();
    hostlist[key].is_flapping = false;
    hostlist[key].problem_has_been_acknowledged = false;
    hostlist[key].scheduled_downtime_depth = 0;
    return false;
    //}
  });
  return hostlist;
}
export function cleanDemoDataServicelist(servicelist) {
  Object.keys(servicelist).forEach(hostkey => {
    Object.keys(servicelist[hostkey]).forEach(key => {
      //if (servicelist[hostkey][key].status === 2) {
        servicelist[hostkey][key].status = 2;
        servicelist[hostkey][key].last_time_up = new Date().getTime();
        servicelist[hostkey][key].is_flapping = false;
        servicelist[hostkey][key].problem_has_been_acknowledged = false;
        servicelist[hostkey][key].scheduled_downtime_depth = 0;
        return false;
      //}
    });
    return false;
  });
  return servicelist;
}

export function convertHostObjectToArray(hostlist, hostSortOrder) {
  let hostProblemsArray = [];

  if (hostlist) {
    Object.keys(hostlist).forEach((k) => {
      // if host status is NOT UP
      // or host is flapping,
      // we add it to the array
      if (hostlist[k].status !== 2 || hostlist[k].is_flapping) {
        hostProblemsArray.push(hostlist[k]);
      }
    });
  }

  // sort the host problems list by last ok, newest first
  // TODO: this only updates on the fetch interval.. so when the user changes it
  // they do not see the sort order change for a few seconds.
  // It might be nice to decouple it
  let sort = 1;
  if (hostSortOrder === 'oldest') { sort = -1; }
  hostProblemsArray = hostProblemsArray.sort((a, b) => {
    if (a.last_time_up < b.last_time_up) { return 1 * sort; }
    if (a.last_time_up > b.last_time_up) { return -1 * sort; }
    return 0;
  });

  return hostProblemsArray;
}

export function convertServiceObjectToArray(servicelist, serviceSortOrder) {
  let serviceProblemsArray = [];

  if (servicelist) {
    Object.keys(servicelist).forEach((k) => {
      Object.keys(servicelist[k]).forEach((l) => {
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
  if (serviceSortOrder === 'oldest') { sort = -1; }
  serviceProblemsArray = serviceProblemsArray.sort((a, b) => {
    if (a.last_time_ok < b.last_time_ok) { return 1 * sort; }
    if (a.last_time_ok > b.last_time_ok) { return -1 * sort; }
    return 0;
  });

  return serviceProblemsArray;
}