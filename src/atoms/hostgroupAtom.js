import { atom } from 'recoil';

const initialState = {
  error: false,
  errorCount: 0,
  errorMessage: '',
  lastUpdate: 0,
  response: {}
};

export const hostgroupAtom = atom({
  key: 'hostgroupAtom',
  default: initialState,
});