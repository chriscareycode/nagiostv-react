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