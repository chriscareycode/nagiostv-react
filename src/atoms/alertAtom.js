import { atom } from 'recoil';

export const alertIsFetchingAtom = atom({
  key: 'alertIsFetchingAtom',
  default: false,
});

const initialState = {
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