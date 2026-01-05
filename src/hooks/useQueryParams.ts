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

import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import qs from 'qs';

/**
 * Custom hook to manage URL query parameters using the qs library
 * This provides a reusable way to sync component state with URL query params
 * 
 * @returns Object with methods to get, set, and remove query parameters
 */
export const useQueryParams = () => {
	const [searchParams, setSearchParams] = useSearchParams();

	/**
	 * Get all query parameters as an object
	 */
	const getAll = useCallback(() => {
		return qs.parse(searchParams.toString());
	}, [searchParams]);

	/**
	 * Get a specific query parameter value
	 * @param key - The parameter key to retrieve
	 */
	const get = useCallback((key: string): string | undefined => {
		const params = getAll();
		const value = params[key];
		return typeof value === 'string' ? value : undefined;
	}, [getAll]);

	/**
	 * Set one or more query parameters
	 * @param params - Object with key-value pairs to set
	 * @param replace - If true, replaces the current URL instead of pushing a new entry
	 */
	const set = useCallback((params: Record<string, string | number | boolean | undefined | null>, replace = true) => {
		const currentParams = getAll();
		
		// Filter out null and undefined values
		const cleanParams = Object.entries(params).reduce((acc, [key, value]) => {
			if (value !== null && value !== undefined) {
				acc[key] = String(value);
			}
			return acc;
		}, {} as Record<string, string>);
		
		const newParams = {
			...currentParams,
			...cleanParams
		};
		
		const queryString = qs.stringify(newParams);
		setSearchParams(queryString, { replace });
	}, [getAll, setSearchParams]);

	/**
	 * Remove one or more query parameters
	 * @param keys - Single key or array of keys to remove
	 * @param replace - If true, replaces the current URL instead of pushing a new entry
	 */
	const remove = useCallback((keys: string | string[], replace = true) => {
		const currentParams = getAll();
		const keysArray = Array.isArray(keys) ? keys : [keys];
		
		keysArray.forEach(key => {
			delete currentParams[key];
		});
		
		const queryString = qs.stringify(currentParams);
		setSearchParams(queryString, { replace });
	}, [getAll, setSearchParams]);

	/**
	 * Clear all query parameters
	 * @param replace - If true, replaces the current URL instead of pushing a new entry
	 */
	const clear = useCallback((replace = true) => {
		setSearchParams('', { replace });
	}, [setSearchParams]);

	/**
	 * Get the current query parameters as a string
	 */
	const toString = useCallback(() => {
		return searchParams.toString();
	}, [searchParams]);

	return useMemo(() => ({
		get,
		getAll,
		set,
		remove,
		clear,
		toString
	}), [get, getAll, set, remove, clear, toString]);
};
