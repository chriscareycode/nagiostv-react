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

import { fireEvent, render, screen } from '@testing-library/react';
import axios from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';
import LlmModelSelector from './LlmModelSelector';

const fetchModels = (baseUrl: string) => {
	render(<LlmModelSelector
		llmBackendType="openai-compatible"
		llmModel=""
		llmServerBaseUrl={baseUrl}
		llmApiKey=""
		onChange={vi.fn()}
	/>);
	fireEvent.click(screen.getByRole('button', { name: 'Fetch Models' }));
};

afterEach(() => vi.restoreAllMocks());

describe('LLM model fetch errors', () => {
	it('offers CORS guidance and the dashboard origin for cross-origin network failures', async () => {
		vi.spyOn(axios, 'get').mockRejectedValue(new axios.AxiosError('Network Error', 'ERR_NETWORK'));
		fetchModels('http://10.200.0.82:1234');

		const error = await screen.findByText(/Possible CORS error/);
		expect(error).toHaveTextContent(`allow this dashboard origin: ${window.location.origin}`);
		expect(error).toHaveTextContent('Check the browser console for CORS details.');
		expect(error).toHaveTextContent('Check that the LLM server is running');
	});

	it('does not suggest CORS for a same-origin network failure', async () => {
		vi.spyOn(axios, 'get').mockRejectedValue(new axios.AxiosError('Network Error', 'ERR_NETWORK'));
		fetchModels(window.location.origin);

		expect(await screen.findByText(/Failed to fetch models: Network error/)).not.toHaveTextContent('CORS');
	});

	it.each([
		['ECONNABORTED', undefined, 'Request timed out. Is the LLM server running?'],
		['ERR_BAD_REQUEST', 401, 'Authentication failed. Check your API key.'],
		['ERR_BAD_REQUEST', 404, 'Models endpoint not found for this backend/server combination.'],
	] as const)('preserves specific errors for %s / %s', async (code, status, message) => {
		const error = new axios.AxiosError('Request failed', code);
		if (status) {
			error.response = { status, data: {}, statusText: '', headers: {}, config: { headers: new axios.AxiosHeaders() } };
		}
		vi.spyOn(axios, 'get').mockRejectedValue(error);
		fetchModels('http://10.200.0.82:1234');

		expect(await screen.findByText(message)).not.toHaveTextContent('CORS');
	});
});
