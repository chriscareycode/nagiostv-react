/*
 * Languages!
 * To add a new language, add a new file in the languages folder
 * following the same pattern of an existing file there.
 * Then add the language to import and languages array and translate
 * function in this file. That's it!
 */

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
	if (typeof word === 'undefined') {
		console.log(`Word [${phrase}] not found in [${language}] language pack.`);
	}
	return word;
}