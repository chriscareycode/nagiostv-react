import { phrases as spanish } from './languages/spanish';

export const languages = [
	{ name: "English", code: "en" },
	{ name: "Spanish", code: "es" }
];

export function translate(phrase, language) {
	let word;
	switch(language) {
		case 'Spanish':
			word = spanish[phrase];
			break;
		default:
			word = phrase;
			break;
	}
	return word;
}