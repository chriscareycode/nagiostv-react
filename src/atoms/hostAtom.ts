import { atom } from 'recoil';
import { HostWrap } from '../types/hostAndServiceTypes';

export const hostIsFetchingAtom = atom({
	key: 'hostIsFetchingAtom',
	default: false,
});

export const hostIsFakeDataSetAtom = atom({
	key: 'hostIsFakeDataSetAtom',
	default: false,
});

const initialState: HostWrap = {
	error: false,
	errorCount: 0,
	errorMessage: '',
	lastUpdate: 0,
	response: {},
	problemsArray: []
};

export const hostAtom = atom({
	key: 'hostAtom',
	default: initialState,
});

export const hostHowManyAtom = atom({
	key: 'hostHowManyAtom',
	default: {
		howManyHosts: 0,
		howManyHostUp: 0,
		howManyHostDown: 0,
		howManyHostUnreachable: 0,
		howManyHostPending: 0,
		howManyHostAcked: 0,
		howManyHostScheduled: 0,
		howManyHostFlapping: 0,
		howManyHostSoft: 0,
		howManyHostNotificationsDisabled: 0,
	},
});