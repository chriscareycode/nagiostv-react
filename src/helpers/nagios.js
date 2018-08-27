export function nagiosStateType(state) {
  switch(state) {
    case 0:
      return 'SOFT';
    case 1:
      return 'HARD';

  }
  return 'Unknown state '+state;
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
  }
  return 'Unknown status '+status;
}