/**
 * NagiosTV https://nagiostv.com
 * Copyright (C) 2008-2025 Chris Carey https://chriscarey.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

/*
 * Languages!
 * To add a new language, add a new file in the languages folder
 * following the same pattern of an existing file there.
 * Then add the language to import and languages array and translate
 * function in this file. That's it!
 */

import { phrases as spanish } from './languages/spanish';
import { phrases as french } from './languages/french';

export interface Language {
	name: string;
	code: string;
}

export const languages: Language[] = [
	{ name: "English", code: "en" },
	{ name: "Spanish", code: "es" },
	{ name: "French", code: "fr" }
];

// Type for the phrases object from language files
type Phrases = Record<string, string>;

const phraseMaps: Record<string, Phrases> = {
	Spanish: spanish as Phrases,
	French: french as Phrases
};

export function translate(phrase: string, language: string): string {
	if (language === 'Spanish') {
		return (spanish as Phrases)[phrase] ?? phrase;
	} else if (language === 'French') {
		return (french as Phrases)[phrase] ?? phrase;
	}
	return phrase;
}
