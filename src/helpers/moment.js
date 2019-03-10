import moment from 'moment';
import React from 'react';

export function prettyDateTime(date) {
  if (date === 0) { return 'Never'; }
	var m = moment(date).format('MMM Do YYYY, h:mm:ss a');
  return m;
}

export function formatDateTime(date) {
	var m = moment(date);
  const diff = m.diff(moment());
  const tempTime = moment.duration(diff);

  let ret = '';
  if (tempTime.days()) { ret += tempTime.days() + 'd '}
  if (tempTime.hours()) { ret += tempTime.hours() + 'h '}
  if (tempTime.minutes()) { ret += tempTime.minutes() + 'm '}

  return ret + tempTime.seconds() + 's';
}

export function formatDateTimeAgo(date) {
	var m = moment(date);
  const diff = m.diff(moment()) * -1;
  const tempTime = moment.duration(diff);

  let ret = '';
  if (tempTime.days()) { ret += tempTime.days() + 'd '}
  if (tempTime.hours()) { ret += tempTime.hours() + 'h '}
  if (tempTime.minutes()) { ret += tempTime.minutes() + 'm '}

  return ret + tempTime.seconds() + 's';
}

export function formatDateTimeAgoColor(date) {
	var m = moment(date);
  const diff = m.diff(moment()) * -1;
  const tempTime = moment.duration(diff);

  let ret = '';
  if (tempTime.days()) { ret += tempTime.days() + 'd '}
  if (tempTime.hours()) { ret += tempTime.hours() + 'h '}
  if (tempTime.minutes()) { ret += tempTime.minutes() + 'm '}

  let wrapperClass = 'color-green';
  if (tempTime.days() === 0 && tempTime.hours() >= 1) { wrapperClass = 'color-orange'; }
  if (tempTime.days() >= 1) { wrapperClass = 'color-red'; }

  return <span className={wrapperClass}>{ret + tempTime.seconds() + 's'}</span>;
}