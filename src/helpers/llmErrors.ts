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

// Read common backend error formats without displaying an entire response object.
export const getLlmServerErrorDetail = (data: unknown): string => {
	if (typeof data === 'string') {
		const text = data.trim();
		// Reverse proxies may return an HTML error page rather than an API message.
		return text.startsWith('<') ? '' : text.slice(0, 1000);
	}
	if (!data || typeof data !== 'object') {
		return '';
	}

	const body = data as Record<string, unknown>;
	for (const value of [body.error, body.message, body.detail]) {
		const detail = getLlmServerErrorDetail(value);
		if (detail) {
			return detail;
		}
	}
	return '';
};
