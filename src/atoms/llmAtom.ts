import { atom } from 'jotai';

export interface HostHowManyState {
	howManyHosts: number;
	howManyHostUp: number;
	howManyHostDown: number;
	howManyHostUnreachable: number;
	howManyHostPending: number;
	howManyHostAcked: number;
	howManyHostScheduled: number;
	howManyHostFlapping: number;
	howManyHostSoft: number;
	howManyHostNotificationsDisabled: number;
}

export interface ServiceHowManyState {
	howManyServices: number;
	howManyServiceOk: number;
	howManyServiceWarning: number;
	howManyServiceUnknown: number;
	howManyServiceCritical: number;
	howManyServicePending: number;
	howManyServiceAcked: number;
	howManyServiceScheduled: number;
	howManyServiceFlapping: number;
	howManyServiceSoft: number;
	howManyServiceNotificationsDisabled: number;
}

export interface LLMHistoryItem {
	content: string;
	timestamp: number; // Unix timestamp
	emoji: string;
	model: string; // The LLM model used for this response
	hostHowMany: HostHowManyState;
	serviceHowMany: ServiceHowManyState;
}

// History state
export const llmHistoryAtom = atom<LLMHistoryItem[]>([]);
export const llmCurrentHistoryIndexAtom = atom<number>(-1);

// UI state (persisted through unmounts)
export const llmIsLoadingAtom = atom<boolean>(false);
export const llmResponseAtom = atom<string>('');
export const llmErrorAtom = atom<string>('');
export const llmLastResponseTimeAtom = atom<Date | null>(null);
export const llmResponseEmojiAtom = atom<string>('✅');
