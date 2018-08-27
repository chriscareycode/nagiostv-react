import moment from 'moment';

export function formatDateTime(date) {
	var m = moment(date);
  const diff = m.diff(moment());
  const tempTime = moment.duration(diff);

  let ret = '';
  if (tempTime.hours()) { ret += tempTime.hours() + 'h '}
  if (tempTime.minutes()) { ret += tempTime.minutes() + 'm '}

  return ret + tempTime.seconds() + 's';
}

export function formatDateTimeAgo(date) {
	var m = moment(date);
  const diff = m.diff(moment()) * -1;
  const tempTime = moment.duration(diff);

  let ret = '';
  if (tempTime.hours()) { ret += tempTime.hours() + 'h '}
  if (tempTime.minutes()) { ret += tempTime.minutes() + 'm '}

  return ret + tempTime.seconds() + 's';
}