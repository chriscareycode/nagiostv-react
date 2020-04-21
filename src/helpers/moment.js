import moment from 'moment';
import React from 'react';

// Load more moment locales
import 'moment/locale/en-gb';
import 'moment/locale/fr';

export function listLocales() {
  return moment.locales();
}

export function momentFormatDateTime(date, locale, format) {
  if (date === 0) { return 'Never'; }
  if (date === 'now') { date = new Date().getTime() }
  if (!locale) { locale = 'en'; }
	var m = moment(date).locale(locale).format(format);
  return m;
}

export function formatDateTime(date) {
	var m = moment(date);
  const diff = m.diff(moment());
  const tempTime = moment.duration(diff);

  let ret = '';
  if (tempTime.days()) { ret += tempTime.days() + 'd '; }
  if (tempTime.hours()) { ret += tempTime.hours() + 'h '; }
  if (tempTime.minutes()) { ret += tempTime.minutes() + 'm '; }

  return ret + tempTime.seconds() + 's';
}

export function formatDateTimeAgo(date) {
	var m = moment(date);
  const diff = m.diff(moment()) * -1;
  const tempTime = moment.duration(diff);

  let ret = '';
  if (tempTime.days()) { ret += tempTime.days() + 'd '; }
  if (tempTime.hours()) { ret += tempTime.hours() + 'h '; }
  // only show minute or second if we are at less than 1 hour
  if (ret.length === 0 && tempTime.minutes()) { ret += tempTime.minutes() + 'm '; }
  if (ret.length === 0 && tempTime.seconds()) { ret += tempTime.seconds() + 's '; }

  return ret;
}

export function formatDateTimeAgoColor(date) {
  
	var m = moment(date);
  const diff = m.diff(moment()) * -1;
  const tempTime = moment.duration(diff);

  let ret = '';
  if (tempTime.days()) { ret += tempTime.days() + 'd '; }
  if (tempTime.hours()) { ret += tempTime.hours() + 'h '; }
  // only show minute or second if we are at less than 1 hour
  if (ret.length === 0 && tempTime.minutes()) { ret += tempTime.minutes() + 'm '; }
  if (ret.length === 0 && tempTime.seconds()) { ret += tempTime.seconds() + 's '; }

  let wrapperClass = 'color-green';
  if (tempTime.days() === 0 && tempTime.hours() >= 1) { wrapperClass = 'color-orange'; }
  if (tempTime.days() >= 1) { wrapperClass = 'color-red'; }

  return <span className={wrapperClass}>{ret}</span>;
}