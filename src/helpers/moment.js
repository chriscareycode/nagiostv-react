import moment from 'moment';
import React from 'react';

// Load more moment locales

import 'moment/locale/af';
import 'moment/locale/ar-dz';
import 'moment/locale/ar-kw';
import 'moment/locale/ar-ly';
import 'moment/locale/ar-ma';
import 'moment/locale/ar-sa';
import 'moment/locale/ar-tn';
import 'moment/locale/ar';
import 'moment/locale/az';
import 'moment/locale/be';
import 'moment/locale/bg';
import 'moment/locale/bm';
import 'moment/locale/bn';
import 'moment/locale/bo';
import 'moment/locale/br';
import 'moment/locale/bs';
import 'moment/locale/ca';
import 'moment/locale/cs';
import 'moment/locale/cv';
import 'moment/locale/cy';
import 'moment/locale/da';
import 'moment/locale/de-at';
import 'moment/locale/de-ch';
import 'moment/locale/de';
import 'moment/locale/dv';
import 'moment/locale/el';
import 'moment/locale/en-au';
import 'moment/locale/en-ca';
import 'moment/locale/en-gb';
import 'moment/locale/en-ie';
import 'moment/locale/en-il';
import 'moment/locale/en-nz';
import 'moment/locale/eo';
import 'moment/locale/es-do';
import 'moment/locale/es-us';
import 'moment/locale/es';
import 'moment/locale/et';
import 'moment/locale/eu';
import 'moment/locale/fa';
import 'moment/locale/fi';
import 'moment/locale/fo';
import 'moment/locale/fr-ca';
import 'moment/locale/fr-ch';
import 'moment/locale/fr';
import 'moment/locale/fy';
import 'moment/locale/gd';
import 'moment/locale/gl';
import 'moment/locale/gom-latn';
import 'moment/locale/gu';
import 'moment/locale/he';
import 'moment/locale/hi';
import 'moment/locale/hr';
import 'moment/locale/hu';
import 'moment/locale/hy-am';
import 'moment/locale/id';
import 'moment/locale/is';
import 'moment/locale/it';
import 'moment/locale/ja';
import 'moment/locale/jv';
import 'moment/locale/ka';
import 'moment/locale/kk';
import 'moment/locale/km';
import 'moment/locale/kn';
import 'moment/locale/ko';
import 'moment/locale/ky';
import 'moment/locale/lb';
import 'moment/locale/lo';
import 'moment/locale/lt';
import 'moment/locale/lv';
import 'moment/locale/me';
import 'moment/locale/mi';
import 'moment/locale/mk';
import 'moment/locale/ml';
import 'moment/locale/mn';
import 'moment/locale/mr';
import 'moment/locale/ms-my';
import 'moment/locale/ms';
import 'moment/locale/mt';
import 'moment/locale/my';
import 'moment/locale/nb';
import 'moment/locale/ne';
import 'moment/locale/nl-be';
import 'moment/locale/nl';
import 'moment/locale/nn';
import 'moment/locale/pa-in';
import 'moment/locale/pl';
import 'moment/locale/pt-br';
import 'moment/locale/pt';
import 'moment/locale/ro';
import 'moment/locale/ru';
import 'moment/locale/sd';
import 'moment/locale/se';
import 'moment/locale/si';
import 'moment/locale/sk';
import 'moment/locale/sl';
import 'moment/locale/sq';
import 'moment/locale/sr-cyrl';
import 'moment/locale/sr';
import 'moment/locale/ss';
import 'moment/locale/sv';
import 'moment/locale/sw';
import 'moment/locale/ta';
import 'moment/locale/te';
import 'moment/locale/tet';
import 'moment/locale/tg';
import 'moment/locale/th';
import 'moment/locale/tl-ph';
import 'moment/locale/tlh';
import 'moment/locale/tr';
import 'moment/locale/tzl';
import 'moment/locale/tzm-latn';
import 'moment/locale/tzm';
import 'moment/locale/ug-cn';
import 'moment/locale/uk';
import 'moment/locale/ur';
import 'moment/locale/uz-latn';
import 'moment/locale/uz';
import 'moment/locale/vi';
import 'moment/locale/x-pseudo';
import 'moment/locale/yo';
import 'moment/locale/zh-cn';
import 'moment/locale/zh-hk';
import 'moment/locale/zh-tw';

export function listLocales() {
  // I do the sort because Moment is returning 'en' first on the list
  // and I want it to be alphabetical
  return moment.locales().sort((a, b) => {
    if (a < b) { return -1; }
    if (a > b) { return 1; }
    return 0;
  });
}

export function momentFormatDateTime(date, locale, format) {
  if (date === 0) { return 'Never'; }
  if (date === 'now') { date = new Date().getTime() }
  if (!locale) { locale = 'en'; }
  if (format) {
    var m = moment(date).locale(locale).format(format);
    return m;
  } else {
    return '';
  }
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