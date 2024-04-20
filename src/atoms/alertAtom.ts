import { atom } from 'jotai';
import { AlertWrap } from 'types/hostAndServiceTypes';

export const alertIsFetchingAtom = atom(false);

const initialState: AlertWrap = {
	error: false,
	errorCount: 0,
	errorMessage: '',
	lastUpdate: 0,
	response: {},
	responseArray: []
};

export const alertAtom = atom(initialState);

export const alertHowManyAtom = atom({
	howManyAlerts: 0,
	howManyAlertSoft: 0,
});