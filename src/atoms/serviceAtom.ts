import { atom } from 'jotai';
import { ServiceWrap } from 'types/hostAndServiceTypes';

export const serviceIsFetchingAtom = atom(false);

export const serviceIsFakeDataSetAtom = atom(false);

const initialState: ServiceWrap = {
	error: false,
	errorCount: 0,
	errorMessage: '',
	lastUpdate: 0,
	response: {},
	stateArray: []
};

export const serviceAtom = atom(initialState);

export const serviceHowManyAtom = atom({
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
});
