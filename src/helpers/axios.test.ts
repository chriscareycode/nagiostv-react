import axios, { AxiosHeaders, AxiosResponse } from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	getFetchErrorMessage,
	getJson,
	InvalidJsonResponseError,
	INVALID_JSON_RESPONSE_MESSAGE,
	responseHasJsonContentType,
} from './axios';

afterEach(() => {
	vi.restoreAllMocks();
});

describe('responseHasJsonContentType', () => {
	it('accepts JSON content types with charset metadata', () => {
		const headers = new AxiosHeaders({
			'content-type': 'application/json; charset=utf-8',
		});

		expect(responseHasJsonContentType(headers)).toBe(true);
	});

	it('rejects non-JSON content types', () => {
		const headers = new AxiosHeaders({
			'content-type': 'text/html',
		});

		expect(responseHasJsonContentType(headers)).toBe(false);
	});

	it('preserves existing behavior when the header is absent', () => {
		expect(responseHasJsonContentType(new AxiosHeaders())).toBe(true);
	});
});

describe('getJson', () => {
	it('returns JSON responses', async () => {
		const response = {
			data: { data: { count: 1 } },
			headers: new AxiosHeaders({ 'content-type': 'application/json' }),
		} as AxiosResponse;
		vi.spyOn(axios, 'get').mockResolvedValue(response);

		await expect(getJson('/status.json')).resolves.toBe(response);
	});

	it('rejects non-JSON responses with a classified error', async () => {
		const response = {
			data: '<html>Not JSON</html>',
			headers: new AxiosHeaders({ 'content-type': 'text/html' }),
		} as AxiosResponse;
		vi.spyOn(axios, 'get').mockResolvedValue(response);

		await expect(getJson('/status.json')).rejects.toEqual(
			expect.objectContaining({
				name: 'InvalidJsonResponseError',
				url: '/status.json',
			}),
		);
	});
});

describe('getFetchErrorMessage', () => {
	it('uses the shared message for invalid JSON responses', () => {
		expect(getFetchErrorMessage(
			new InvalidJsonResponseError('/status.json'),
			'/status.json',
		)).toBe(INVALID_JSON_RESPONSE_MESSAGE);
	});

	it('formats Axios network errors with the request URL', () => {
		const error = new axios.AxiosError('Network Error', 'ERR_NETWORK');

		expect(getFetchErrorMessage(error, '/status.json')).toBe(
			'ERROR: ERR_NETWORK CONNECTION REFUSED Network Error /status.json',
		);
	});
});
