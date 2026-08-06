/**
 * NagiosTV https://nagiostv.com
 * Copyright (C) 2008-2025 Chris Carey https://chriscarey.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 */

import axios from 'axios';

export interface AdminCapabilities {
	enabled: boolean;
	csrfToken: string;
	httpsRequired: boolean;
}

export const fetchAdminCapabilities = async (
	endpoint: string,
	signal?: AbortSignal,
): Promise<AdminCapabilities> => {
	const response = await axios.get<AdminCapabilities>(`${endpoint}?capabilities=true`, {
		signal,
		timeout: 10_000,
	});
	return response.data;
};

export const postAdminJson = async <Result>(
	endpoint: string,
	payload: unknown,
	adminToken: string,
	csrfToken: string,
	signal?: AbortSignal,
): Promise<Result> => {
	const response = await axios.post<Result>(endpoint, payload, {
		headers: {
			'Content-Type': 'application/json',
			'X-NagiosTV-Admin-Token': adminToken,
			'X-NagiosTV-CSRF-Token': csrfToken,
		},
		signal,
		timeout: 120_000,
	});
	return response.data;
};
