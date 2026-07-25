import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	isUnsupportedThinkingControlError,
	requestLlmChat,
} from './llmTransport';

const axiosMocks = vi.hoisted(() => ({
	post: vi.fn(),
	isAxiosError: vi.fn((error: { isAxiosError?: boolean }) => error?.isAxiosError === true),
}));

vi.mock('axios', () => ({
	default: axiosMocks,
}));

const requestOptions = {
	baseUrl: 'http://localhost:1234/',
	backendType: 'openai-compatible' as const,
	apiKey: 'secret',
	model: 'test-model',
	messages: [
		{ role: 'system' as const, content: 'system' },
		{ role: 'user' as const, content: 'analyze' },
	],
	thinkingLevel: 'medium' as const,
};

beforeEach(() => {
	axiosMocks.post.mockReset();
	axiosMocks.isAxiosError.mockClear();
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe('requestLlmChat', () => {
	it('builds a backend request and normalizes its response', async () => {
		axiosMocks.post.mockResolvedValue({
			data: {
				model: 'returned-model',
				choices: [{ message: { content: 'Analysis', reasoning: 'Reasoning' } }],
			},
		});

		const result = await requestLlmChat(requestOptions);

		expect(axiosMocks.post).toHaveBeenCalledWith(
			'http://localhost:1234/v1/chat/completions',
			expect.objectContaining({
				model: 'test-model',
				reasoning_effort: 'medium',
			}),
			expect.objectContaining({
				headers: {
					'Content-Type': 'application/json',
					'Authorization': 'Bearer secret',
				},
				timeout: 90_000,
			}),
		);
		expect(result).toEqual({
			content: 'Analysis',
			thinkingContent: 'Reasoning',
			model: 'returned-model',
		});
	});

	it('retries without thinking control when a backend rejects that field', async () => {
		const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		const unsupportedError = {
			isAxiosError: true,
			response: {
				status: 400,
				data: { error: 'Unknown field reasoning_effort' },
			},
		};
		axiosMocks.post
			.mockRejectedValueOnce(unsupportedError)
			.mockResolvedValueOnce({
				data: { choices: [{ message: { content: 'Analysis' } }] },
			});

		const result = await requestLlmChat(requestOptions);

		expect(axiosMocks.post).toHaveBeenCalledTimes(2);
		expect(axiosMocks.post.mock.calls[0][1]).toHaveProperty('reasoning_effort', 'medium');
		expect(axiosMocks.post.mock.calls[1][1]).not.toHaveProperty('reasoning_effort');
		expect(warning).toHaveBeenCalledOnce();
		expect(result?.content).toBe('Analysis');
	});

	it('does not retry unrelated server failures', async () => {
		const serverError = {
			isAxiosError: true,
			response: { status: 500, data: 'Server failed' },
		};
		axiosMocks.post.mockRejectedValue(serverError);

		await expect(requestLlmChat(requestOptions)).rejects.toBe(serverError);
		expect(axiosMocks.post).toHaveBeenCalledOnce();
		expect(isUnsupportedThinkingControlError(serverError)).toBe(false);
	});

	it('uses the selected backend for request and response formats', async () => {
		axiosMocks.post.mockResolvedValue({
			data: {
				model_instance_id: 'lm-model',
				output: [
					{ type: 'reasoning', content: 'Thoughts' },
					{ type: 'message', content: 'Result' },
				],
			},
		});

		const result = await requestLlmChat({
			...requestOptions,
			backendType: 'lmstudio',
		});

		expect(axiosMocks.post).toHaveBeenCalledWith(
			'http://localhost:1234/api/v1/chat',
			expect.objectContaining({
				input: 'analyze',
				reasoning: 'medium',
				system_prompt: 'system',
			}),
			expect.any(Object),
		);
		expect(result).toEqual({
			content: 'Result',
			thinkingContent: 'Thoughts',
			model: 'lm-model',
		});
	});
});
