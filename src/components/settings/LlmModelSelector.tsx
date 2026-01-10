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

import { ChangeEvent, useState } from 'react';
import axios from 'axios';

interface LlmModelSelectorProps {
	llmModel: string;
	llmServerBaseUrl: string;
	llmApiKey: string;
	onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

const LlmModelSelector = ({ llmModel, llmServerBaseUrl, llmApiKey, onChange }: LlmModelSelectorProps) => {
	const [llmModels, setLlmModels] = useState<string[]>([]);
	const [llmModelsLoading, setLlmModelsLoading] = useState(false);
	const [llmModelsError, setLlmModelsError] = useState('');

	// Fetch available LLM models from the server
	const fetchLlmModels = async () => {
		if (!llmServerBaseUrl) {
			setLlmModelsError('Please enter a LLM Server Base URL first');
			return;
		}

		setLlmModelsLoading(true);
		setLlmModelsError('');
		setLlmModels([]);

		try {
			const response = await axios.get(`${llmServerBaseUrl}/v1/models`, {
				headers: llmApiKey ? {
					'Authorization': `Bearer ${llmApiKey}`
				} : undefined,
				timeout: 10000
			});

			// OpenAI-compatible API returns { data: [{ id: "model-name", ... }, ...] }
			if (response.data?.data && Array.isArray(response.data.data)) {
				const modelIds = response.data.data.map((model: { id: string }) => model.id).sort();
				setLlmModels(modelIds);
				if (modelIds.length === 0) {
					setLlmModelsError('No models found on the server');
				}
			} else {
				setLlmModelsError('Unexpected response format from server');
			}
		} catch (error) {
			if (axios.isAxiosError(error)) {
				if (error.code === 'ECONNABORTED') {
					setLlmModelsError('Request timed out. Is the LLM server running?');
				} else if (error.response?.status === 401) {
					setLlmModelsError('Authentication failed. Check your API key.');
				} else if (error.response?.status === 404) {
					setLlmModelsError('Models endpoint not found. Server may not support /v1/models');
				} else {
					setLlmModelsError(`Failed to fetch models: ${error.message}`);
				}
			} else {
				setLlmModelsError('Failed to connect to LLM server');
			}
		} finally {
			setLlmModelsLoading(false);
		}
	};

	return (
		<>
			<div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
				<input 
					type="text" 
					value={llmModel} 
					onChange={onChange}
					placeholder="llama2 or gpt-3.5-turbo" 
				/>
				<button 
					onClick={fetchLlmModels}
					disabled={llmModelsLoading || !llmServerBaseUrl}
					className="bg-[#333] text-[#6fbbf3] border-2 border-[#6fbbf3] rounded-[5px] py-[5px] px-[10px] cursor-pointer mr-[5px] whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{llmModelsLoading ? 'Fetching...' : 'Fetch Models'}
				</button>
			</div>
			{llmModels.length > 0 && (
				<div style={{ marginBottom: '5px' }}>
					<select 
						value={llmModel}
						onChange={onChange}
						style={{ minWidth: '200px' }}
					>
						<option value="">-- Select a model --</option>
						{llmModels.map((model) => (
							<option key={model} value={model}>{model}</option>
						))}
					</select>
					<span style={{ marginLeft: '10px', fontSize: '0.9em', color: '#888' }}>
						{llmModels.length} model{llmModels.length !== 1 ? 's' : ''} available
					</span>
				</div>
			)}
			{llmModelsError && (
				<div style={{ color: '#ff6b6b', fontSize: '0.9em', marginBottom: '5px' }}>
					{llmModelsError}
				</div>
			)}
			<span style={{ fontSize: '0.9em', color: '#888' }}>
				Model name to use (e.g., llama2, mistral, gpt-3.5-turbo). Click "Fetch Models" to see available models from your server.
			</span>
		</>
	);
};

export default LlmModelSelector;
