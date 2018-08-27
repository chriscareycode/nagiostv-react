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
  }
  return classString;
}

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
  }
  return classString;
}