import { atom } from 'recoil';

export const programStatusIsFetchingAtom = atom({
	key: 'programStatusIsFetchingAtom',
	default: false,
});

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

export const programStatusAtom = atom({
	key: 'programStatusAtom',
	default: initialState,
});
