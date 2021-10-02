import { atom } from 'recoil';

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

export const commentlistAtom = atom({
  key: 'commentlistAtom',
  default: initialState,
});

