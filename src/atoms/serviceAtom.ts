import { atom } from 'recoil';
import { ServiceWrap } from 'types/hostAndServiceTypes';

export const serviceIsFetchingAtom = atom({
	key: 'serviceIsFetchingAtom',
	default: false,
});

export const serviceIsFakeDataSetAtom = atom({
	key: 'serviceIsFakeDataSetAtom',
	default: false,
});

const initialState: ServiceWrap = {
	error: false,
	errorCount: 0,
	errorMessage: '',
	lastUpdate: 0,
	response: {},
	problemsArray: []
};

export const serviceAtom = atom({
	key: 'serviceAtom',
	default: initialState,
});

export const serviceHowManyAtom = atom({
	key: 'serviceHowManyAtom',
	default: {
		howManyServices: 0,
		howManyServiceOk: 0,
		howManyServiceWarning: 0,
		howManyServiceUnknown: 0,
		howManyServiceCritical: 0,
		howManyServicePending: 0,
		howManyServiceAcked: 0,
		howManyServiceScheduled: 0,
		howManyServiceFlapping: 0,
		howManyServiceSoft: 0,
		howManyServiceNotificationsDisabled: 0,
	},
});