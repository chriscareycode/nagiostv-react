// so this new Audio() function dumps a stacktrace when it cant find the audio file to play
// we should add some extra test that the file exists, if possible
export function playSoundEffect(type, state) {
	
	const audioCritical = '/sample-audio/Computer Error Alert-SoundBible.com-783113881.mp3';
	const audioWarning = '/sample-audio/Computer Error-SoundBible.com-399240903.mp3';
	const audioOk = '/sample-audio/Tiny Button Push-SoundBible.com-513260752.mp3';

	//console.log('playSoundEffect', type, state);

	switch(type+state) {
		case 'hostdown':
			new Audio(audioCritical).play();
			break;
		case 'hostup':
			new Audio(audioOk).play();
			break;
		case 'servicecritical':
			new Audio(audioCritical).play();
			break;
		case 'servicewarning':
			new Audio(audioWarning).play();
			break;
		case 'serviceok':
			new Audio(audioOk).play();
			break;
		default:
			break;
	}
	//new Audio();
}

export function speakAudio(words) {
	
	//console.log('speakAudio', words);

	const msg = new SpeechSynthesisUtterance(words);
	window.speechSynthesis.speak(msg);
	
}
