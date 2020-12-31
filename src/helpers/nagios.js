/*eslint no-unreachable: "off"*/

/**
 * NagiosTV https://nagiostv.com
 * Copyright (C) 2008-2020 Chris Carey https://chriscarey.com
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

export function nagiosHostStatus(status) {
  switch(status) {
    case 1:
      return 'pending';
    case 2:
      return 'up';
    case 4:
      return 'down';
    case 8:
      return 'unreachable';
    default:
      return 'Unknown host status ' + status;
  }
  return 'Unknown host status ' + status;
}

export function nagiosStateType(state_type) {
  switch(state_type) {
    case 0:
      return 'soft';
    case 1:
      return 'hard';
    default:
     	return 'Unknown state_type ' + state_type;
  }
  return 'Unknown state_type ' + state_type;
}

export function nagiosServiceStatus(status) {
  switch(status) {
    case 1:
      return 'pending';
    case 2:
      return 'ok';
    case 4:
      return 'warning';
    case 8:
      return 'unknown';
    case 16:
      return 'critical';
    default:
     	return 'Unknown service status ' + status;
  }
  return 'Unknown service status ' + status;
}

export function nagiosAlertState(state) {
  switch(state) {
    case 1:
      return 'host up';
    case 2:
      return 'host down';
    case 4:
      return 'host unreachable';
    case 8:
      return 'service ok';
    case 16:
      return 'service warning';
    case 32:
      return 'service critical';
    case 64:
      return 'service unknown';
    default:
      return 'Unknown state ' + state;
  }
  return 'Unknown alert state ' + state;
}

export function nagiosAlertStateType(state_type) {
  switch(state_type) {
    case 1:
      return 'hard';
    case 2:
      return 'soft';
    default:
      return 'Unknown state_type ' + state_type;
  }
  return 'Unknown alert state_type ' + state_type;
}