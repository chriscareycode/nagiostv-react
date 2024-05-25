import { atom } from 'jotai';

export const programStatusIsFetchingAtom = atom(false);

export interface ProgramStatusWrap {
	error: boolean;
	errorCount: number;
	errorMessage: string;
	lastUpdate: number;
	response: Record<string, any>;
}

const initialState: ProgramStatusWrap = {
	error: false,
	errorCount: 0,
	errorMessage: '',
	lastUpdate: 0,
	response: {}
};

export const programStatusAtom = atom(initialState);
