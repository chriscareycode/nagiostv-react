export function playAudio(type, state) {
	
	const audioCritical = '/audio/service-bell_daniel_simion.mp3';
	const audioWarning = '/audio/sms-alert-4-daniel_simon.mp3';
	const audioOk = '/audio/sms-alert-5-daniel_simon.mp3';

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

export function speakAudio(type, state) {
	
	const audioCritical = '/audio/service-bell_daniel_simion.mp3';
	const audioWarning = '/audio/sms-alert-4-daniel_simon.mp3';
	const audioOk = '/audio/sms-alert-5-daniel_simon.mp3';

	console.log('speakAudio', type, state);

	var msg = new SpeechSynthesisUtterance(type + ' ' + state);
	window.speechSynthesis.speak(msg);
	
}
