import { atom } from 'jotai';

const initialState = {
	error: false,
	errorCount: 0,
	errorMessage: '',
	lastUpdate: 0,
	response: {},
	commentlistObject: {
		hosts: {},
		services: {}
	},
};

export const commentlistAtom = atom(initialState);

