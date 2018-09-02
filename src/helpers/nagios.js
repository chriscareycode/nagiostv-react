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

export function nagiosAlertState(state) {
  switch(state) {
    case 1:
      return 'HOST OK';
    case 2:
      return 'HOST WARNING';
    case 4:
      return 'HOST CRITICAL';
    case 8:
      return 'SERVICE OK';
    case 16:
      return 'SERVICE WARNING';
    case 32:
      return 'SERVICE CRITICAL';
    default:
      return 'Unknown state ' + state;
  }
  return 'Unknown alert state ' + state;
}

export function nagiosAlertStateType(state_type) {
  switch(state_type) {
    case 1:
      return 'HARD';
    case 2:
      return 'SOFT';
    default:
      return 'Unknown state_type ' + state_type;
  }
  return 'Unknown alert state_type ' + state_type;
}