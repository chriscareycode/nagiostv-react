import { atom } from 'jotai';

export const skipVersionAtom = atom({
	version: 0,
	version_string: '',
});
