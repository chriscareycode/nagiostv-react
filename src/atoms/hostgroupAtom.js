import { atom } from 'jotai';

const initialState = {
	error: false,
	errorCount: 0,
	errorMessage: '',
	lastUpdate: 0,
	response: {}
};

export const hostgroupAtom = atom(initialState);

export const servicegroupAtom = atom(initialState);