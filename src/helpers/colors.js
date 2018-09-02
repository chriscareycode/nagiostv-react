// TODO: Should rename this to serviceBorderClass
export function wrapperClass(status) {
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
      classString = 'border-gray'; // unknown
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

// TODO: Should rename this to serviceTextClass
export function stateClass(status) {
  let classString = '';

  switch(status) {
    case 2:
      classString = 'color-green'; // ok
      break;
    case 4:
      classString = 'color-yellow'; // warning
      break;
    case 8:
      classString = 'color-gray'; // unknown
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


export function alertBorderClass(state) {
  let classString = '';

  switch(state) {
    case 1:
      classString = 'border-green'; // HOST OK
      break;
    case 2:
      classString = 'border-purple'; // ?
      break;
    case 4:
      classString = 'border-purple'; // ?
      break;
    case 8:
      classString = 'border-green'; // OK
      break;
    case 16:
      classString = 'border-yellow'; // WARNING
      break;
    case 32:
      classString = 'border-red'; // CRITICAL
      break;
    case 64:
      classString = 'border-gray'; // UNKNOWN
      break;
    default:
      classString = '';
      break;
  }
  return classString;
}

export function alertTextClass(state) {
  let classString = '';

  switch(state) {
    case 1:
      classString = 'color-green'; // HOST OK
      break;
    case 2:
      classString = 'color-yellow'; // HOST WARNING
      break;
    case 4:
      classString = 'color-purple'; // ?
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
      classString = 'color-gray'; // UNKNOWN
      break;
    default:
      classString = '';
      break;
  }
  return classString;
}