export function nagiosStateType(state) {
  switch(state) {
    case 0:
      return 'SOFT';
    case 1:
      return 'HARD';
    default:
     	return 'Unknown state ' + state;
  }
  return 'Unknown state ' + state;
}

export function nagiosServiceStatus(status) {
  switch(status) {
    case 1:
      return 'NOT CHECKED';
    case 2:
      return 'OK';
    case 4:
      return 'WARNING';
    case 8:
      return 'UNKNOWN';
    case 16:
      return 'CRITICAL';
    default:
     	return 'Unknown status ' + status;
  }
  return 'Unknown status ' + status;
}