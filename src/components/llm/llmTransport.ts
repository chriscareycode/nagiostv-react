import axios from 'axios';
import {
	getLlmBackendPlugin,
	LLMMessage,
	NormalizedLlmResponse,
} from '../../helpers/llmBackends';
import { LlmBackendType, LlmThinkingLevel } from '../../types/settings';

interface RequestLlmChatOptions {
	baseUrl: string;
	backendType: LlmBackendType;
	apiKey: string;
	model: string;
	messages: LLMMessage[];
	thinkingLevel: LlmThinkingLevel;
	signal?: AbortSignal;
}

const buildRequestOptions = (
	options: RequestLlmChatOptions,
	includeThinkingControl: boolean,
) => {
	const backendPlugin = getLlmBackendPlugin(options.backendType);
	return {
		backendPlugin,
		request: backendPlugin.buildChatRequest({
			baseUrl: options.baseUrl,
			apiKey: options.apiKey,
			model: options.model,
			messages: options.messages,
			temperature: 0.7,
			maxTokens: 50_000,
			thinkingLevel: options.thinkingLevel,
			includeThinkingControl,
		}),
	};
};

export const isUnsupportedThinkingControlError = (error: unknown): boolean => {
	if (
		!axios.isAxiosError(error)
		|| !error.response
		|| (error.response.status !== 400 && error.response.status !== 422)
	) {
		return false;
	}

	const errorBody = typeof error.response.data === 'string'
		? error.response.data
		: JSON.stringify(error.response.data || '');
	return /reasoning_effort|reasoning|unknown field|additional properties|not allowed/i.test(errorBody);
};

export const requestLlmChat = async (
	options: RequestLlmChatOptions,
): Promise<NormalizedLlmResponse | null> => {
	let { backendPlugin, request } = buildRequestOptions(options, true);
	let response: { data: unknown };

	try {
		response = await axios.post(request.url, request.payload, {
			headers: request.headers,
			timeout: request.timeoutMs,
			signal: options.signal,
		});
	} catch (error) {
		if (!isUnsupportedThinkingControlError(error)) {
			throw error;
		}

		console.warn('LocalLLM: Server rejected thinking control; retrying without backend thinking parameter.');
		({ backendPlugin, request } = buildRequestOptions(options, false));
		response = await axios.post(request.url, request.payload, {
			headers: request.headers,
			timeout: request.timeoutMs,
			signal: options.signal,
		});
	}

	return backendPlugin.parseChatResponse(response.data);
};
