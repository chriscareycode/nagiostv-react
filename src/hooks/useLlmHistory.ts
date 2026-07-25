import { useCallback } from 'react';
import { useAtom } from 'jotai';
import {
	LLMHistoryItem,
	llmCurrentHistoryIndexAtom,
	llmHistoryAtom,
	llmLastResponseTimeAtom,
	llmResponseAtom,
	llmResponseEmojiAtom,
} from '../atoms/llmAtom';

const MAX_HISTORY_ITEMS = 10;

export function useLlmHistory() {
	const [history, setHistory] = useAtom(llmHistoryAtom);
	const [currentHistoryIndex, setCurrentHistoryIndex] = useAtom(llmCurrentHistoryIndexAtom);
	const [llmResponse, setLlmResponse] = useAtom(llmResponseAtom);
	const [lastResponseTime, setLastResponseTime] = useAtom(llmLastResponseTimeAtom);
	const [responseEmoji, setResponseEmoji] = useAtom(llmResponseEmojiAtom);

	const showHistoryItem = useCallback((index: number, item: LLMHistoryItem) => {
		setCurrentHistoryIndex(index);
		setLlmResponse(item.content);
		setLastResponseTime(new Date(item.timestamp));
		setResponseEmoji(item.emoji);
	}, [
		setCurrentHistoryIndex,
		setLastResponseTime,
		setLlmResponse,
		setResponseEmoji,
	]);

	const addHistoryItem = useCallback((item: LLMHistoryItem) => {
		setHistory(previous => [...previous, item].slice(-MAX_HISTORY_ITEMS));
		showHistoryItem(Math.min(history.length, MAX_HISTORY_ITEMS - 1), item);
	}, [history.length, setHistory, showHistoryItem]);

	const navigateToPrevious = useCallback(() => {
		if (currentHistoryIndex <= 0) {
			return;
		}

		const newIndex = currentHistoryIndex - 1;
		showHistoryItem(newIndex, history[newIndex]);
	}, [currentHistoryIndex, history, showHistoryItem]);

	const navigateToNext = useCallback(() => {
		if (currentHistoryIndex >= history.length - 1) {
			return;
		}

		const newIndex = currentHistoryIndex + 1;
		showHistoryItem(newIndex, history[newIndex]);
	}, [currentHistoryIndex, history, showHistoryItem]);

	return {
		addHistoryItem,
		currentHistoryIndex,
		currentHistoryItem: history[currentHistoryIndex],
		history,
		lastResponseTime,
		llmResponse,
		navigateToNext,
		navigateToPrevious,
		responseEmoji,
	};
}
