import { atom } from 'recoil';

export const skipVersionAtom = atom({
	key: 'skipVersionAtom',
	default: {
		version: 0,
		version_string: '',
	}
});

