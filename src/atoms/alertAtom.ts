import { atom } from 'recoil';
import { AlertWrap } from 'types/hostAndServiceTypes';

export const alertIsFetchingAtom = atom({
	key: 'alertIsFetchingAtom',
	default: false,
});

const initialState: AlertWrap = {
	error: false,
	errorCount: 0,
	errorMessage: '',
	lastUpdate: 0,
	response: {},
	responseArray: []
};

export const alertAtom = atom({
	key: 'alertAtom',
	default: initialState,
});

export const alertHowManyAtom = atom({
	key: 'alertHowManyAtom',
	default: {
		howManyAlerts: 0,
		howManyAlertSoft: 0,
	},
});