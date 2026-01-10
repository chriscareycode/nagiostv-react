/**
 * NagiosTV https://nagiostv.com
 * Copyright (C) 2008-2025 Chris Carey https://chriscarey.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { DateTime, Duration, Info } from 'luxon';

const locales = ['en', 'en-US', 'fr', 'de', 'es', 'ja', 'zh-CN', 'ru', 'ar', 'hi'];

export function listLocales(): string[] {
	const supportedLocales = locales.filter(locale =>
		Intl.DateTimeFormat.supportedLocalesOf(locale).length > 0
	);
	// Return an alphabetically sorted list of available locales
	return supportedLocales.sort((a: string, b: string) => {
		if (a < b) { return -1; }
		if (a > b) { return 1; }
		return 0;
	});
}

export function formatDateTimeLocale(date: number | string, locale?: string, format?: string): string {
	if (date === 0) { return 'Never'; }
	if (date === 'now') { date = new Date().getTime() }
	if (!locale) { locale = 'en'; }
	if (format) {
		// Convert format string from moment to luxon if needed
		const dt = DateTime.fromMillis(typeof date === 'number' ? date : 0).setLocale(locale);
		return dt.toFormat(format);
	} else {
		return 'Unknown format';
	}
}

// TODO: rename this to formatDateTimeDHMS
export function formatDateTime(date: number): string {
	const dt = DateTime.fromMillis(date);
	const diff = dt.diff(DateTime.now(), ['years', 'months', 'days', 'hours', 'minutes', 'seconds']);
	
	let ret = '';
	if (diff.years) { ret += diff.years + 'y '; }
	if (diff.months) { ret += diff.months + 'm '; }
	if (diff.days) { ret += diff.days + 'd '; }
	if (diff.hours) { ret += diff.hours + 'h '; }
	if (diff.minutes) { ret += diff.minutes + 'm '; }

	return ret + Math.floor(diff.seconds) + 's';
}

export function formatDateTimeAgo(date: number): string {
	const dt = DateTime.fromMillis(date);
	const diff = DateTime.now().diff(dt, ['years', 'months', 'days', 'hours', 'minutes', 'seconds']);
	
	let ret = '';
	if (diff.years) { ret += diff.years + 'y '; }
	if (diff.months) { ret += diff.months + 'm '; }
	if (diff.days) { ret += diff.days + 'd '; }
	if (diff.hours) { ret += diff.hours + 'h '; }
	// only show minute or second if we are at less than 1 hour
	if (ret.length === 0 && diff.minutes) { ret += diff.minutes + 'm '; }
	if (ret.length === 0 && diff.seconds) { ret += Math.floor(diff.seconds) + 's '; }
	if (ret.length === 0) { ret = '0s'; }

	return ret.trim();
}

export function formatDateTimeAgoLong(date: number): string {
	const dt = DateTime.fromMillis(date);
	const diff = DateTime.now().diff(dt, ['years', 'months', 'days', 'hours', 'minutes', 'seconds']);
	
	let ret = '';
	if (diff.years) { ret += diff.years + 'y '; }
	if (diff.months) { ret += diff.months + 'm '; }
	if (diff.days) { ret += diff.days + 'd '; }
	if (diff.hours) { ret += diff.hours + 'h '; }
	if (diff.minutes) { ret += diff.minutes + 'm '; }
	// only show second if we are at less than 1 hour
	if (ret.length === 0 && diff.seconds) { ret += Math.floor(diff.seconds) + 's '; }
	if (ret.length === 0) { ret = '0s'; }

	return ret.trim();
}

// This one starts red and moves to green over time (used for quiet for)
// The idea is a recent issue it will show red, green means quiet for a while, nothin happening.
export function formatDateTimeAgoColorQuietFor(date: number): JSX.Element {
	const dt = DateTime.fromMillis(date);
	const diff = DateTime.now().diff(dt, ['years', 'months', 'days', 'hours', 'minutes', 'seconds']);
	
	let ret = '';
	if (diff.years) { ret += diff.years + 'y '; }
	if (diff.months) { ret += diff.months + 'm '; }
	if (diff.days) { ret += diff.days + 'd '; }
	if (diff.hours) { ret += diff.hours + 'h '; }
	// only show minute or second if we are at less than 1 hour
	if (diff.minutes) { ret += diff.minutes + 'm '; }
	if (ret.length === 0 && diff.seconds) { ret += Math.floor(diff.seconds) + 's '; }
	if (ret.length === 0) { ret = '0s'; }

	const now = Date.now();
	const elapsed = now - date;
	let wrapperClass = 'color-green';
	// red is under 1 minute, orange is 1-5 minutes, yellow is 5-10 minutes, green is 10+ minutes
	if (elapsed < 10 * 60 * 1000) { wrapperClass = 'color-yellow'; }
	if (elapsed < 5 * 60 * 1000) { wrapperClass = 'color-orange'; }
	if (elapsed < 1 * 60 * 1000) { wrapperClass = 'color-red'; }

	return <span className={wrapperClass}>{ret.trim()}</span>;
}

export function formatDateTimeAgoColor(date: number): JSX.Element {
	const dt = DateTime.fromMillis(date);
	const diff = DateTime.now().diff(dt, ['years', 'months', 'days', 'hours', 'minutes', 'seconds']);

	let ret = '';
	if (diff.years) { ret += diff.years + 'y '; }
	if (diff.months) { ret += diff.months + 'm '; }
	if (diff.days) { ret += diff.days + 'd '; }
	if (diff.hours) { ret += diff.hours + 'h '; }
	// only show minute or second if we are at less than 1 hour
	if (ret.length === 0 && diff.minutes) { ret += diff.minutes + 'm '; }
	if (ret.length === 0 && diff.seconds) { ret += Math.floor(diff.seconds) + 's '; }
	if (ret.length === 0) { ret = '0s'; }

	let wrapperClass = 'color-green';
	if (diff.days === 0 && diff.hours >= 1) { wrapperClass = 'color-orange'; }
	if (diff.days >= 1) { wrapperClass = 'color-red'; }

	return <span className={wrapperClass}>{ret.trim()}</span>;
}