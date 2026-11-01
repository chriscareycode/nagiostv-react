import { getLlmBackendPlugin, LLMMessage, NormalizedLlmResponse } from '../../helpers/llmBackends';
import { LlmBackendType, LlmThinkingLevel } from '../../types/settings';
import { getLlmServerErrorDetail } from '../../helpers/llmErrors';

interface StreamLlmChatOptions {
	baseUrl: string;
	backendType: LlmBackendType;
	apiKey: string;
	model: string;
	messages: LLMMessage[];
	thinkingLevel: LlmThinkingLevel;
	signal?: AbortSignal;
	onDelta: (delta: { content?: string; thinkingContent?: string }) => void;
}

const parseEvent = (data: string, backendType: LlmBackendType): { content?: string; thinkingContent?: string } => {
	if (data === '[DONE]') return {};
	const event = JSON.parse(data) as Record<string, unknown>;
	if (event.error) throw new Error(getLlmServerErrorDetail(event.error) || 'LLM stream failed.');
	if (backendType === 'anthropic') {
		const delta = event.delta as { type?: string; text?: string; thinking?: string } | undefined;
		return {
			content: delta?.type === 'text_delta' ? delta.text : undefined,
			thinkingContent: delta?.type === 'thinking_delta' ? delta.thinking : undefined,
		};
	}
	const choice = (event.choices as Array<{ delta?: { content?: string; reasoning?: string; reasoning_content?: string } }> | undefined)?.[0];
	const delta = choice?.delta;
	if (delta) return { content: delta.content, thinkingContent: delta.reasoning_content || delta.reasoning };
	// LM Studio's native chat endpoint streams typed output events.
	const type = event.type as string | undefined;
	const value = event.content || event.text || event.delta;
	if (typeof value !== 'string') return {};
	return {
		content: type?.includes('message') ? value : undefined,
		thinkingContent: type?.includes('reasoning') ? value : undefined,
	};
};

export async function streamLlmChat(options: StreamLlmChatOptions): Promise<NormalizedLlmResponse | null> {
	const backend = getLlmBackendPlugin(options.backendType);
	const request = backend.buildChatRequest({
		baseUrl: options.baseUrl,
		apiKey: options.apiKey,
		model: options.model,
		messages: options.messages,
		thinkingLevel: options.thinkingLevel,
		temperature: 0.7,
		maxTokens: 50_000,
		includeThinkingControl: true,
	});
	const send = (payload: Record<string, unknown>) => fetch(request.url, {
		method: 'POST',
		headers: { ...request.headers, Accept: 'text/event-stream' },
		body: JSON.stringify({ ...payload, stream: true }),
		signal: options.signal,
	});
	let response = await send(request.payload);
	if ((response.status === 400 || response.status === 422) && /reasoning_effort|reasoning|unknown field|additional properties|not allowed/i.test(await response.clone().text())) {
		const retryRequest = backend.buildChatRequest({
			baseUrl: options.baseUrl,
			apiKey: options.apiKey,
			model: options.model,
			messages: options.messages,
			thinkingLevel: options.thinkingLevel,
			temperature: 0.7,
			maxTokens: 50_000,
			includeThinkingControl: false,
		});
		response = await send(retryRequest.payload);
	}
	if (!response.ok) {
		const detail = getLlmServerErrorDetail(await response.text());
		throw new Error(detail || `LLM server returned ${response.status}.`);
	}
	if (!response.headers.get('content-type')?.includes('text/event-stream')) {
		const result = backend.parseChatResponse(await response.json());
		if (result) options.onDelta(result);
		return result;
	}
	if (!response.body) throw new Error('LLM server did not provide a response stream.');

	let content = '';
	let thinkingContent = '';
	let buffer = '';
	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	const consumeEvent = (rawEvent: string) => {
		const data = rawEvent.split('\n').filter(line => line.startsWith('data:')).map(line => line.slice(5).trimStart()).join('\n');
		if (!data || data === '[DONE]') return;
		const delta = parseEvent(data, options.backendType);
		if (delta.content) content += delta.content;
		if (delta.thinkingContent) thinkingContent += delta.thinkingContent;
		if (delta.content || delta.thinkingContent) options.onDelta(delta);
	};
	try {
		while (true) {
			const { value, done } = await reader.read();
			buffer += decoder.decode(value, { stream: !done }).replace(/\r\n/g, '\n');
			let boundary = buffer.indexOf('\n\n');
			while (boundary !== -1) {
				consumeEvent(buffer.slice(0, boundary));
				buffer = buffer.slice(boundary + 2);
				boundary = buffer.indexOf('\n\n');
			}
			if (done) break;
		}
		if (buffer.trim()) consumeEvent(buffer);
	} finally {
		reader.releaseLock();
	}
	return content || thinkingContent ? { content, thinkingContent } : null;
}
