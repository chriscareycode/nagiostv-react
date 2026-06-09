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

import { LlmBackendType, LlmThinkingLevel } from 'types/settings';

export interface LLMMessage {
	role: 'system' | 'user' | 'assistant';
	content: string;
}

export interface BackendRequest {
	url: string;
	payload: Record<string, unknown>;
	headers: Record<string, string>;
	timeoutMs: number;
}

export interface ModelListRequest {
	url: string;
	headers: Record<string, string>;
	timeoutMs: number;
}

export interface NormalizedLlmResponse {
	content: string;
	thinkingContent?: string;
	model?: string;
}

export interface BuildChatRequestParams {
	baseUrl: string;
	apiKey: string;
	model: string;
	messages: LLMMessage[];
	temperature: number;
	maxTokens: number;
	thinkingLevel: LlmThinkingLevel;
	includeThinkingControl: boolean;
}

export interface LlmBackendPlugin {
	id: LlmBackendType;
	label: string;
	buildChatRequest: (params: BuildChatRequestParams) => BackendRequest;
	parseChatResponse: (responseData: unknown) => NormalizedLlmResponse | null;
	buildModelListRequest: (baseUrl: string, apiKey: string) => ModelListRequest;
	parseModelListResponse: (responseData: unknown) => string[];
}

const DEFAULT_TIMEOUT_MS = 90_000;

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, '');

const joinUrl = (baseUrl: string, path: string): string => {
	const normalizedBaseUrl = trimTrailingSlash(baseUrl.trim());
	return `${normalizedBaseUrl}${path}`;
};

const buildBearerHeaders = (apiKey: string): Record<string, string> => ({
	'Content-Type': 'application/json',
	...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {}),
});

const OPENAI_COMPAT_PLUGIN: LlmBackendPlugin = {
	id: 'openai-compatible',
	label: 'OpenAI-Compatible',
	buildChatRequest: ({ baseUrl, apiKey, model, messages, temperature, maxTokens, thinkingLevel, includeThinkingControl }) => {
		const payload: Record<string, unknown> = {
			model,
			messages,
			temperature,
			max_tokens: maxTokens,
		};

		if (includeThinkingControl) {
			payload.reasoning_effort = thinkingLevel;
		}

		return {
			url: joinUrl(baseUrl, '/v1/chat/completions'),
			payload,
			headers: buildBearerHeaders(apiKey),
			timeoutMs: DEFAULT_TIMEOUT_MS,
		};
	},
	parseChatResponse: (responseData) => {
		const data = responseData as {
			model?: string;
			choices?: Array<{ message?: { content?: string; reasoning?: string } }>;
		};

		const firstChoice = data?.choices?.[0];
		const content = firstChoice?.message?.content || '';
		if (!content) {
			return null;
		}

		return {
			content,
			thinkingContent: firstChoice?.message?.reasoning,
			model: data?.model,
		};
	},
	buildModelListRequest: (baseUrl, apiKey) => ({
		url: joinUrl(baseUrl, '/v1/models'),
		headers: buildBearerHeaders(apiKey),
		timeoutMs: 10000,
	}),
	parseModelListResponse: (responseData) => {
		const data = responseData as { data?: Array<{ id?: string }> };
		if (!Array.isArray(data?.data)) {
			return [];
		}

		return data.data
			.map(item => item?.id)
			.filter((id): id is string => typeof id === 'string' && id.length > 0)
			.sort();
	},
};

const LM_STUDIO_PLUGIN: LlmBackendPlugin = {
	id: 'lmstudio',
	label: 'LM Studio',
	buildChatRequest: ({ baseUrl, apiKey, model, messages, temperature, maxTokens, thinkingLevel, includeThinkingControl }) => {
		const systemMessage = messages.find(message => message.role === 'system')?.content || '';
		const userMessage = messages.filter(message => message.role !== 'system').map(message => message.content).join('\n\n');

		const payload: Record<string, unknown> = {
			model,
			system_prompt: systemMessage,
			input: userMessage,
			temperature,
			max_output_tokens: maxTokens,
		};

		if (includeThinkingControl) {
			payload.reasoning = thinkingLevel === 'off' ? 'off' : thinkingLevel;
		}

		return {
			url: joinUrl(baseUrl, '/api/v1/chat'),
			payload,
			headers: buildBearerHeaders(apiKey),
			timeoutMs: DEFAULT_TIMEOUT_MS,
		};
	},
	parseChatResponse: (responseData) => {
		const data = responseData as {
			model_instance_id?: string;
			output?: Array<{ type?: string; content?: string }>;
		};

		if (!Array.isArray(data?.output)) {
			return null;
		}

		const content = data.output
			.filter(item => item?.type === 'message' && typeof item?.content === 'string')
			.map(item => item.content || '')
			.join('\n\n')
			.trim();

		if (!content) {
			return null;
		}

		const thinkingContent = data.output
			.filter(item => item?.type === 'reasoning' && typeof item?.content === 'string')
			.map(item => item.content || '')
			.join('\n\n')
			.trim();

		return {
			content,
			thinkingContent: thinkingContent || undefined,
			model: data.model_instance_id,
		};
	},
	buildModelListRequest: (baseUrl, apiKey) => ({
		url: joinUrl(baseUrl, '/v1/models'),
		headers: buildBearerHeaders(apiKey),
		timeoutMs: 10000,
	}),
	parseModelListResponse: (responseData) => OPENAI_COMPAT_PLUGIN.parseModelListResponse(responseData),
};

const ANTHROPIC_PLUGIN: LlmBackendPlugin = {
	id: 'anthropic',
	label: 'Anthropic',
	buildChatRequest: ({ baseUrl, apiKey, model, messages, temperature, maxTokens, thinkingLevel, includeThinkingControl }) => {
		const systemPrompt = messages.find(message => message.role === 'system')?.content || '';
		const conversationMessages = messages
			.filter(message => message.role !== 'system')
			.map(message => ({
				role: message.role === 'assistant' ? 'assistant' : 'user',
				content: message.content,
			}));

		const payload: Record<string, unknown> = {
			model,
			system: systemPrompt,
			messages: conversationMessages,
			temperature,
			max_tokens: Math.min(maxTokens, 8192),
		};

		if (includeThinkingControl) {
			if (thinkingLevel === 'off') {
				payload.thinking = { type: 'disabled' };
			} else {
				const budgetMap: Record<'low' | 'medium' | 'high', number> = {
					low: 1024,
					medium: 4096,
					high: 8192,
				};
				payload.thinking = {
					type: 'enabled',
					budget_tokens: budgetMap[thinkingLevel],
				};
			}
		}

		return {
			url: joinUrl(baseUrl, '/v1/messages'),
			payload,
			headers: {
				'Content-Type': 'application/json',
				'anthropic-version': '2023-06-01',
				...(apiKey ? { 'x-api-key': apiKey } : {}),
			},
			timeoutMs: DEFAULT_TIMEOUT_MS,
		};
	},
	parseChatResponse: (responseData) => {
		const data = responseData as {
			model?: string;
			content?: Array<{ type?: string; text?: string; thinking?: string }>;
		};

		if (!Array.isArray(data?.content)) {
			return null;
		}

		const content = data.content
			.filter(item => item?.type === 'text')
			.map(item => item?.text || '')
			.join('\n\n')
			.trim();

		if (!content) {
			return null;
		}

		const thinkingContent = data.content
			.filter(item => item?.type === 'thinking')
			.map(item => item?.thinking || item?.text || '')
			.join('\n\n')
			.trim();

		return {
			content,
			thinkingContent: thinkingContent || undefined,
			model: data.model,
		};
	},
	buildModelListRequest: (baseUrl, apiKey) => ({
		url: joinUrl(baseUrl, '/v1/models'),
		headers: {
			'Content-Type': 'application/json',
			'anthropic-version': '2023-06-01',
			...(apiKey ? { 'x-api-key': apiKey } : {}),
		},
		timeoutMs: 10000,
	}),
	parseModelListResponse: (responseData) => OPENAI_COMPAT_PLUGIN.parseModelListResponse(responseData),
};

export const LLM_BACKEND_PLUGINS: Record<LlmBackendType, LlmBackendPlugin> = {
	'openai-compatible': OPENAI_COMPAT_PLUGIN,
	anthropic: ANTHROPIC_PLUGIN,
	lmstudio: LM_STUDIO_PLUGIN,
};

export const getLlmBackendPlugin = (backendType: LlmBackendType): LlmBackendPlugin => {
	return LLM_BACKEND_PLUGINS[backendType] || OPENAI_COMPAT_PLUGIN;
};
