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

// so this new Audio() function dumps a stacktrace when it cant find the audio file to play
// we should add some extra test that the file exists, if possible
/*
 * Chrome autoplay policy
 * https://developers.google.com/web/updates/2017/09/autoplay-policy-changes
 */
import { debounce } from 'lodash';
import { ClientSettings } from 'types/settings';

// debounce the playSoundEffect function so multiple sounds at the same time wont freak out the audio engine
export const playSoundEffectDebounced = debounce(function (type, state, settings) {
	playSoundEffect(type, state, settings);
}, 200);

// if sound is delimited by a semicolon; then choose one at random
function pickSound(soundConfig: string) {
	if (soundConfig.indexOf(';') !== -1) {
		const soundArray = soundConfig.split(';').filter(sound => sound.length > 0);
		return soundArray[Math.floor(Math.random() * soundArray.length)];
	}
	return soundConfig;
}

// playSoundEffect
export function playSoundEffect(type: string, state: string, settings: ClientSettings) {

	const audioCritical = pickSound(settings.soundEffectCritical);
	const audioWarning = pickSound(settings.soundEffectWarning);
	const audioOk = pickSound(settings.soundEffectOk);

	//console.log('playSoundEffect', type, state, audioCritical, audioWarning, audioOk);

	let audio;

	switch (type + state) {
		case 'hostdown':
		case 'hostunreachable':
			audio = new Audio(audioCritical);
			break;
		case 'hostup':
			audio = new Audio(audioOk);
			break;
		case 'servicecritical':
			audio = new Audio(audioCritical);
			break;
		case 'servicewarning':
			audio = new Audio(audioWarning);
			break;
		case 'serviceok':
			audio = new Audio(audioOk);
			break;
		default:
			break;
	}

	if (audio) {
		const promise = audio.play();
		promise.catch((err) => {
			if (err instanceof DOMException) {
				console.log(err.message);
				//console.log(err.code);
				//console.log(err.name);

				// TODO: pop up a message to the UI. Not just console.log here
				console.log('Blocked by autoplay prevention. Touch the UI to enable sound');
			} else {
				console.log('error');
				console.log(err);
				console.log(typeof err);
			}
		});
	}
}

function massageSpeakingWords(words: string) {
	// Convert NEMS uppercase to lowercase which speaks it better
	const newWords = words.replace('NEMS', 'nems');
	return newWords;
}

/**
 * Cancel any currently speaking audio and clear the speech queue
 * Call this when the speak toggle is disabled to immediately stop speaking
 */
export function cancelSpeaking() {
	if (window.speechSynthesis) {
		window.speechSynthesis.cancel();
	}
}

/**
 * Get available speech synthesis voices with proper async handling
 * Some browsers (Chrome) don't populate voices until after the first call or voiceschanged event
 */
export function getVoices(): Promise<SpeechSynthesisVoice[]> {
	return new Promise((resolve) => {
		if (!window.speechSynthesis) {
			resolve([]);
			return;
		}

		let voices = window.speechSynthesis.getVoices();
		
		// If voices are already loaded, return them
		if (voices.length > 0) {
			resolve(voices);
			return;
		}

		// Otherwise, wait for the voiceschanged event
		const voicesChangedHandler = () => {
			voices = window.speechSynthesis.getVoices();
			window.speechSynthesis.removeEventListener('voiceschanged', voicesChangedHandler);
			resolve(voices);
		};

		window.speechSynthesis.addEventListener('voiceschanged', voicesChangedHandler);
		
		// Fallback: resolve with empty array after timeout if voices never load
		setTimeout(() => {
			window.speechSynthesis.removeEventListener('voiceschanged', voicesChangedHandler);
			resolve(window.speechSynthesis.getVoices());
		}, 1000);
	});
}

export async function speakAudio(words: string, voice: string) {

	//console.log('speakAudio', words, voice);
	const massagedWords = massageSpeakingWords(words);

	let sayWhat;
	try {
		sayWhat = new SpeechSynthesisUtterance(massagedWords);
	} catch (e) {
		console.log('SpeechSynthesisUtterance not supported on this browser');
		return;
	}

	// test for window.speechSynthesis
	if (!window.speechSynthesis) {
		console.log('speechSynthesis not supported on this browser');
		return;
	}

	// Cancel any currently speaking audio and clear the queue
	// This prevents audio from piling up when tab is backgrounded or laptop sleeps
	if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
		window.speechSynthesis.cancel();
	}

	if (voice) {
		// Wait for voices to be loaded before trying to match
		const voices = await getVoices();
		const mySpeechSynthesisVoice = voices.filter(v => v.name === voice);
		if (mySpeechSynthesisVoice.length > 0) {
			sayWhat.voice = mySpeechSynthesisVoice[0];
		}
	}
	window.speechSynthesis.speak(sayWhat);

}
