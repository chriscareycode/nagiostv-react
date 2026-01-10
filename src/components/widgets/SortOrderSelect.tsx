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

import { ChangeEvent } from 'react';
import { translate } from '../../helpers/language';
import { useQueryParams } from '../../hooks/useQueryParams';

export type SortOrder = 'newest' | 'oldest' | 'az' | 'za';

interface SortOrderSelectProps {
	value: string;
	varName: string;
	language: string;
	onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
	syncToUrl?: boolean; // Optional flag to enable URL sync
}

const SortOrderSelect = ({ value, varName, language, onChange, syncToUrl = false }: SortOrderSelectProps) => {
	const queryParams = useQueryParams();

	const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
		// Call the original onChange handler
		onChange(e);
		
		// Optionally sync to URL query params
		if (syncToUrl) {
			queryParams.set({ [varName]: e.target.value });
		}
	};

	return (
		<select value={value} data-varname={varName} onChange={handleChange}>
			<option value="newest">{translate('newest first', language)}</option>
			<option value="oldest">{translate('oldest first', language)}</option>
			<option value="az">{translate('A-Z', language)}</option>
			<option value="za">{translate('Z-A', language)}</option>
		</select>
	);
};

export default SortOrderSelect;
