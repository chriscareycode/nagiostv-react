import { atom } from 'jotai';

export const programStatusIsFetchingAtom = atom(false);

interface ProgramStatus {
	program_start: number;
	version: string;
}

export interface ProgramStatusWrap {
	error: boolean;
	errorCount: number;
	errorMessage: string;
	lastUpdate: number;
	response: ProgramStatus | null;
}

const initialState: ProgramStatusWrap = {
	error: false,
	errorCount: 0,
	errorMessage: '',
	lastUpdate: 0,
	response: null
};

export const programStatusAtom = atom(initialState);
