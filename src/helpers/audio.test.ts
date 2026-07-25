import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getVoices } from './audio';

describe('getVoices', () => {
	let originalSpeechSynthesis: PropertyDescriptor | undefined;
	let eventTarget: EventTarget;
	let getVoicesMock: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		vi.useFakeTimers();
		originalSpeechSynthesis = Object.getOwnPropertyDescriptor(window, 'speechSynthesis');
		eventTarget = new EventTarget();
		getVoicesMock = vi.fn(() => []);

		Object.defineProperty(window, 'speechSynthesis', {
			configurable: true,
			value: {
				addEventListener: eventTarget.addEventListener.bind(eventTarget),
				getVoices: getVoicesMock,
				removeEventListener: eventTarget.removeEventListener.bind(eventTarget),
			},
		});
	});

	afterEach(() => {
		vi.useRealTimers();
		if (originalSpeechSynthesis) {
			Object.defineProperty(window, 'speechSynthesis', originalSpeechSynthesis);
		} else {
			delete (window as { speechSynthesis?: SpeechSynthesis }).speechSynthesis;
		}
	});

	it('clears the fallback timer when voices load through the event', async () => {
		const voice = { name: 'Test Voice' } as SpeechSynthesisVoice;
		const resultPromise = getVoices();
		getVoicesMock.mockReturnValue([voice]);

		eventTarget.dispatchEvent(new Event('voiceschanged'));

		await expect(resultPromise).resolves.toEqual([voice]);
		expect(vi.getTimerCount()).toBe(0);
	});

	it('removes the pending timer when the caller aborts', async () => {
		const controller = new AbortController();
		const resultPromise = getVoices(controller.signal);

		controller.abort();

		await expect(resultPromise).resolves.toEqual([]);
		expect(vi.getTimerCount()).toBe(0);
	});
});
