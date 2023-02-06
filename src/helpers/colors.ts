/**
 * NagiosTV https://nagiostv.com
 * Copyright (C) 2008-2023 Chris Carey https://chriscarey.com
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

export function hostBorderClass(status) {
	//const status = this.get('servicedetail.status');
	let classString = '';

	switch (status) {
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

	switch (status) {
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

	switch (status) {
		case 1:
			classString = 'border-gray'; // PENDING
			break;
		case 2:
			classString = 'border-green'; // OK
			break;
		case 4:
			classString = 'border-yellow'; // WARNING
			break;
		case 8:
			classString = 'border-orange'; // UNKNOWN
			break;
		case 16:
			classString = 'border-red'; // CRITICAL
			break;
		default:
			classString = '';
			break;
	}
	return classString;
}

export function serviceTextClass(status) {
	let classString = '';

	switch (status) {
		case 1:
			classString = 'color-gray'; // pending
			break;
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

	switch (state) {
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

	switch (state) {
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