import { AxiosHeaders } from 'axios';
import { describe, expect, it } from 'vitest';
import { responseHasJsonContentType } from './axios';

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
