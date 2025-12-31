import { atom } from 'jotai';
import { HostWrap } from '../types/hostAndServiceTypes';

export const hostIsFetchingAtom = atom(false);

export const hostIsFakeDataSetAtom = atom(false);

const initialState: HostWrap = {
	error: false,
	errorCount: 0,
	errorMessage: '',
	lastUpdate: 0,
	response: {},
	stateArray: []
};

export const hostAtom = atom(initialState);

export const hostHowManyAtom = atom({
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
});