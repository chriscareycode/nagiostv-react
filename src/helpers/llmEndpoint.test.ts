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

import { describe, it, expect } from 'vitest';
import { validateLlmEndpoint, assertLlmEndpoint } from './llmEndpoint';

describe('validateLlmEndpoint', () => {
	it('accepts the default localhost http endpoint', () => {
		const result = validateLlmEndpoint('http://localhost:1234');
		expect(result.ok).toBe(true);
		expect(result.url?.hostname).toBe('localhost');
	});

	it('accepts an absolute https endpoint', () => {
		expect(validateLlmEndpoint('https://api.example.com/v1').ok).toBe(true);
	});

	it('trims surrounding whitespace', () => {
		expect(validateLlmEndpoint('  http://localhost:1234  ').ok).toBe(true);
	});

	it('rejects an empty value', () => {
		const result = validateLlmEndpoint('   ');
		expect(result.ok).toBe(false);
		expect(result.reason).toMatch(/empty/);
	});

	it('rejects a relative URL', () => {
		const result = validateLlmEndpoint('/v1/chat');
		expect(result.ok).toBe(false);
		expect(result.reason).toMatch(/absolute http/);
	});

	it('rejects a non-http(s) scheme', () => {
		const result = validateLlmEndpoint('javascript:alert(1)');
		expect(result.ok).toBe(false);
		expect(result.reason).toMatch(/scheme is not allowed/);
	});

	it('rejects the file scheme', () => {
		expect(validateLlmEndpoint('file:///etc/passwd').ok).toBe(false);
	});

	it('rejects embedded credentials', () => {
		const result = validateLlmEndpoint('http://user:pass@example.com');
		expect(result.ok).toBe(false);
		expect(result.reason).toMatch(/credentials/);
	});
});

describe('assertLlmEndpoint', () => {
	it('returns a URL for a valid endpoint', () => {
		expect(assertLlmEndpoint('http://localhost:1234').href).toBe('http://localhost:1234/');
	});

	it('throws for an invalid endpoint', () => {
		expect(() => assertLlmEndpoint('ftp://example.com')).toThrow(/Invalid LLM server URL/);
	});
});
