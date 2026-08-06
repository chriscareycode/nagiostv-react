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

// Validates an administrator-configured LLM server base URL before any request
// is built. Only absolute http(s) URLs with a host and no embedded credentials
// are allowed, so a hostile or malformed endpoint cannot be contacted.

export interface LlmEndpointValidation {
	ok: boolean;
	url?: URL;
	reason?: string;
}

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

export const validateLlmEndpoint = (baseUrl: string): LlmEndpointValidation => {
	const trimmed = (baseUrl ?? '').trim();
	if (!trimmed) {
		return { ok: false, reason: 'the URL is empty' };
	}

	let url: URL;
	try {
		url = new URL(trimmed);
	} catch {
		return { ok: false, reason: 'the URL must be an absolute http(s) URL' };
	}

	if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
		return { ok: false, reason: `the "${url.protocol}" scheme is not allowed` };
	}
	if (!url.hostname) {
		return { ok: false, reason: 'the URL is missing a host' };
	}
	if (url.username !== '' || url.password !== '') {
		return { ok: false, reason: 'the URL must not contain embedded credentials' };
	}

	return { ok: true, url };
};

export const assertLlmEndpoint = (baseUrl: string): URL => {
	const result = validateLlmEndpoint(baseUrl);
	if (!result.ok || !result.url) {
		throw new Error(`Invalid LLM server URL: ${result.reason ?? 'unknown reason'}`);
	}
	return result.url;
};
