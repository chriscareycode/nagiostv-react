// so this new Audio() function dumps a stacktrace when it cant find the audio file to play
// we should add some extra test that the file exists, if possible
export function playAudio(type, state) {
	
	const audioCritical = '/sample-audio/service-bell_daniel_simion.mp3';
	const audioWarning = '/sample-audio/sms-alert-4-daniel_simon.mp3';
	const audioOk = '/sample-audio/sms-alert-5-daniel_simon.mp3';

	console.log('playAudio', type, state);

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
	
	console.log('speakAudio', words);

	const msg = new SpeechSynthesisUtterance(words);
	window.speechSynthesis.speak(msg);
	
}
