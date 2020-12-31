/**
 * NagiosTV https://nagiostv.com
 * Copyright (C) 2008-2020 Chris Carey https://chriscarey.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
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
import _ from 'lodash';

// debounce the playSoundEffect function so multiple sounds at the same time wont freak out the audio engine
export const playSoundEffectDebounced = _.debounce(function(type, state, settings) {
  playSoundEffect(type, state, settings);
}, 200);

// if sound is delimited by a semicolon; then choose one at random
function pickSound(soundConfig) {
  if (soundConfig.indexOf(';') !== -1) {
    const soundArray = soundConfig.split(';').filter(sound => sound.length > 0);
    return soundArray[Math.floor(Math.random() * soundArray.length)];
  }
  return soundConfig;
}

// playSoundEffect
export function playSoundEffect(type, state, settings) {
  
  const audioCritical = pickSound(settings.soundEffectCritical);
  const audioWarning = pickSound(settings.soundEffectWarning);
  const audioOk = pickSound(settings.soundEffectOk);

  //console.log('playSoundEffect', type, state, audioCritical, audioWarning, audioOk);

  let audio;

  switch(type+state) {
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

export function speakAudio(words, voice) {
  
  //console.log('speakAudio', words, voice);

  let sayWhat;
  try {
    sayWhat = new SpeechSynthesisUtterance(words);
  } catch(e) {
    console.log('SpeechSynthesisUtterance not supported on this browser');
    return;
  }

  // test for window.speechSynthesis
  if (!window.speechSynthesis) {
    console.log('speechSynthesis not supported on this browser');
    return;
  }

  if (voice) {
    let mySpeechSynthesisVoice = window.speechSynthesis.getVoices().filter(v => v.name === voice);
    if (mySpeechSynthesisVoice.length > 0) {
      sayWhat.voice = mySpeechSynthesisVoice[0];
    }
  }
  window.speechSynthesis.speak(sayWhat);
  
}
