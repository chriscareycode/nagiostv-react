export function hostBorderClass(status) {
  //const status = this.get('servicedetail.status');
  let classString = '';

  switch(status) {
    case 1:
      classString = 'border-gray'; // PENDING
      break;
    case 2:
      classString = 'border-green'; // UP
      break;
    case 4:
      classString = 'border-red'; // DOWN
      break;
    case 8:
      classString = 'border-orange'; // UNREACHABLE
      break;
    default:
      classString = '';
      break;
  }
  return classString;
}

export function hostTextClass(status) {
  let classString = '';

  switch(status) {
    case 1:
      classString = 'color-gray'; // PENDING
      break;
    case 2:
      classString = 'color-green'; // UP
      break;
    case 4:
      classString = 'color-red'; // DOWN
      break;
    case 8:
      classString = 'color-orange'; // UNREACHABLE
      break;
    default:
      classString = '';
      break;
  }
  return classString;
}

export function serviceBorderClass(status) {
  //const status = this.get('servicedetail.status');
  let classString = '';

  switch(status) {
    case 2:
      classString = 'border-green'; // ok
      break;
    case 4:
      classString = 'border-yellow'; // warning
      break;
    case 8:
      classString = 'border-orange'; // unknown
      break;
    case 16:
      classString = 'border-red'; // critical
      break;
    default:
      classString = '';
      break;
  }
  return classString;
}

export function serviceTextClass(status) {
  let classString = '';

  switch(status) {
    case 2:
      classString = 'color-green'; // ok
      break;
    case 4:
      classString = 'color-yellow'; // warning
      break;
    case 8:
      classString = 'color-orange'; // unknown
      break;
    case 16:
      classString = 'color-red'; // critical
      break;
    default:
      classString = '';
      break;
  }
  return classString;
}


export function alertBorderClass(object_type, state) {
  let classString = '';

  switch(state) {
    case 1:
      classString = 'border-green'; // HOST OK
      break;
    case 2:
      classString = 'border-red'; // HOST DOWN
      break;
    case 4:
      classString = 'border-orange'; // HOST UNREACHABLE
      break;
    case 8:
      classString = 'border-green'; // SERVICE OK
      break;
    case 16:
      classString = 'border-yellow'; // SERVICE WARNING
      break;
    case 32:
      classString = 'border-red'; // SERVICE CRITICAL
      break;
    case 64:
      classString = 'border-orange'; // SERVICE UNKNOWN
      break;
    default:
      classString = '';
      break;
  }
  return classString;
}

export function alertTextClass(object_type, state) {
  let classString = '';

  switch(state) {
    case 1:
      classString = 'color-green'; // HOST UP
      break;
    case 2:
      classString = 'color-red'; // HOST DOWN
      break;
    case 4:
      classString = 'color-orange'; // HOST UNREACHABKE
      break;
    case 8:
      classString = 'color-green'; // SERVICE OK
      break;
    case 16:
      classString = 'color-yellow'; // SERVICE WARNING
      break;
    case 32:
      classString = 'color-red'; // SERVICE CRITICAL
      break;
    case 64:
      classString = 'color-orange'; // SERVICE UNKNOWN
      break;
    default:
      classString = '';
      break;
  }
  return classString;
}