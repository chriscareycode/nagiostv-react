import { afterEach, expect, it, vi } from 'vitest';
import { streamLlmChat } from './llmStream';

afterEach(() => vi.unstubAllGlobals());

it('emits answer and thinking deltas before the stream ends', async () => {
	const encoder = new TextEncoder();
	let finishStream: (() => void) | undefined;
	const body = new ReadableStream<Uint8Array>({
		start(controller) {
			controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"reasoning_content":"Checking "}}]}\n\n'));
			controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"## Result\\n"}}]}\n\n'));
			finishStream = () => {
				controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"All clear."}}]}\n\n'));
				controller.close();
			};
		},
	});
	vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(body, { headers: { 'content-type': 'text/event-stream' } })));
	const onDelta = vi.fn();
	const resultPromise = streamLlmChat({
		baseUrl: 'http://localhost:1234',
		backendType: 'openai-compatible',
		apiKey: '',
		model: 'test',
		messages: [{ role: 'user', content: 'Question' }],
		thinkingLevel: 'medium',
		onDelta,
	});
	await vi.waitFor(() => expect(onDelta).toHaveBeenCalledTimes(2));
	expect(onDelta).toHaveBeenNthCalledWith(1, { content: undefined, thinkingContent: 'Checking ' });
	expect(onDelta).toHaveBeenNthCalledWith(2, { content: '## Result\n', thinkingContent: undefined });
	finishStream?.();
	expect(await resultPromise).toEqual({ content: '## Result\nAll clear.', thinkingContent: 'Checking ' });
	expect(fetch).toHaveBeenCalledWith('http://localhost:1234/v1/chat/completions', expect.objectContaining({
		body: expect.stringContaining('"stream":true'),
	}));
});
