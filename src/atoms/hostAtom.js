import { atom } from 'recoil';

export const hostIsFetchingAtom = atom({
  key: 'hostIsFetchingAtom',
  default: false,
});

const initialState = {
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