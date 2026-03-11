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

import { atom } from 'jotai';

interface GroupState {
	error: boolean;
	errorCount: number;
	errorMessage: string;
	lastUpdate: number;
	response: Record<string, unknown>;
}

const initialState: GroupState = {
	error: false,
	errorCount: 0,
	errorMessage: '',
	lastUpdate: 0,
	response: {}
};

export const hostgroupAtom = atom(initialState);

export const servicegroupAtom = atom(initialState);
