import { act, renderHook } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { LLMHistoryItem } from '../atoms/llmAtom';
import { useLlmHistory } from './useLlmHistory';

const createWrapper = (store: ReturnType<typeof createStore>) => {
	return function Wrapper({ children }: { children: ReactNode }) {
		return <Provider store={store}>{children}</Provider>;
	};
};

const createHistoryItem = (index: number): LLMHistoryItem => ({
	content: `Analysis ${index}`,
	timestamp: 1_000 + index,
	emoji: index % 2 === 0 ? '✅' : '⚠️',
	model: 'test-model',
	color: index % 2 === 0 ? 'green' : 'yellow',
	shortResponse: `Short ${index}`,
});

describe('useLlmHistory', () => {
	it('adds an item and synchronizes the displayed response state', () => {
		const store = createStore();
		const { result } = renderHook(() => useLlmHistory(), {
			wrapper: createWrapper(store),
		});

		act(() => result.current.addHistoryItem(createHistoryItem(0)));

		expect(result.current.history).toHaveLength(1);
		expect(result.current.currentHistoryIndex).toBe(0);
		expect(result.current.currentHistoryItem?.content).toBe('Analysis 0');
		expect(result.current.llmResponse).toBe('Analysis 0');
		expect(result.current.responseEmoji).toBe('✅');
		expect(result.current.lastResponseTime?.getTime()).toBe(1_000);
	});

	it('navigates backward and forward while keeping display atoms synchronized', () => {
		const store = createStore();
		const { result } = renderHook(() => useLlmHistory(), {
			wrapper: createWrapper(store),
		});
		for (let index = 0; index < 3; index += 1) {
			act(() => result.current.addHistoryItem(createHistoryItem(index)));
		}

		act(() => result.current.navigateToPrevious());
		expect(result.current.currentHistoryIndex).toBe(1);
		expect(result.current.llmResponse).toBe('Analysis 1');
		expect(result.current.responseEmoji).toBe('⚠️');

		act(() => result.current.navigateToNext());
		expect(result.current.currentHistoryIndex).toBe(2);
		expect(result.current.llmResponse).toBe('Analysis 2');
		expect(result.current.responseEmoji).toBe('✅');
	});

	it('does not navigate beyond the available history', () => {
		const store = createStore();
		const { result } = renderHook(() => useLlmHistory(), {
			wrapper: createWrapper(store),
		});
		act(() => result.current.addHistoryItem(createHistoryItem(0)));

		act(() => {
			result.current.navigateToPrevious();
			result.current.navigateToNext();
		});

		expect(result.current.currentHistoryIndex).toBe(0);
		expect(result.current.llmResponse).toBe('Analysis 0');
	});

	it('keeps only the ten most recent items', () => {
		const store = createStore();
		const { result } = renderHook(() => useLlmHistory(), {
			wrapper: createWrapper(store),
		});
		for (let index = 0; index < 12; index += 1) {
			act(() => result.current.addHistoryItem(createHistoryItem(index)));
		}

		expect(result.current.history).toHaveLength(10);
		expect(result.current.history[0].content).toBe('Analysis 2');
		expect(result.current.history[9].content).toBe('Analysis 11');
		expect(result.current.currentHistoryIndex).toBe(9);
		expect(result.current.llmResponse).toBe('Analysis 11');
	});
});
