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

import { useEffect, useRef } from 'react';
import { formatDateTimeAgo, formatDateTimeAgoColor } from '../../helpers/dates';
import { hostBorderClass, hostTextClass } from '../../helpers/colors';
import { nagiosStateType, nagiosHostStatus } from '../../helpers/nagios';
import { translate } from '../../helpers/language';
import { openNagiosExtInfoPage } from '../../helpers/externalLinks';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudRain, faUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
import { playSoundEffectDebounced, speakAudio } from '../../helpers/audio';
import Progress from '../widgets/Progress';
import './HostItem.css';
import { ClientSettings } from 'types/settings.js';
import { Comment, Host } from 'types/hostAndServiceTypes.js';
import NextCheckIn from 'components/widgets/NextCheckIn';

interface HostItemProps {
	settings: ClientSettings;
	hostItem: Host;
	isDemoMode: boolean;
	howManyDown: number;
	comments: Comment[];
}

const doSoundEffect = ({ hostItem, settings }: HostItemProps) => {
		const status = nagiosHostStatus(hostItem.status);
		switch (status) {
			case 'down':
				playSoundEffectDebounced('host', 'down', settings);
				break;
			case 'unreachable':
				playSoundEffectDebounced('host', 'unreachable', settings);
				break;
			default:
				break;
		}
};

const doSpeakIntro = ({ hostItem, settings }: HostItemProps) => {
		const { language } = settings;
		const voice = settings.speakItemsVoice;

		let words = translate('host', language) + ' ' + hostItem.name + ' '
			+ translate('is', language) + ' ' + translate(nagiosHostStatus(hostItem.status), language);

		if (hostItem.is_flapping) { words += ' ' + translate('and', language) + ' ' + translate('flapping', language); }
		if (hostItem.problem_has_been_acknowledged) { words += ' ' + translate('and', language) + ' ' + translate('acked', language); }
		if (hostItem.scheduled_downtime_depth > 0) { words += ' ' + translate('and', language) + ' ' + translate('scheduled', language); }

		speakAudio(words, voice);
};

const doSpeakOutro = ({ hostItem, settings }: HostItemProps) => {
		const { language } = settings;
		const voice = settings.speakItemsVoice;
		const speakWords = translate('host', language) + ' ' + hostItem.name + ' ' + translate('ok', language);

		speakAudio(speakWords, voice);
};

const HostItem = (props: HostItemProps) => {
	const { settings, hostItem: e, isDemoMode, howManyDown, comments } = props;
	const initialProps = useRef(props);
	const latestProps = useRef(props);
	latestProps.current = props;

	useEffect(() => {
		const mountedProps = initialProps.current;
		if (mountedProps.settings.playSoundEffects) { doSoundEffect(mountedProps); }
		if (mountedProps.settings.speakItems) { doSpeakIntro(mountedProps); }

		return () => {
			const currentProps = latestProps.current;
			if (currentProps.settings.playSoundEffects) {
				playSoundEffectDebounced('host', 'up', currentProps.settings);
			}
			if (currentProps.settings.speakItems) { doSpeakOutro(currentProps); }
		};
	}, []);

	const openNagiosHostPage = () => {
		if (isDemoMode) {
			return;
		}
		openNagiosExtInfoPage(settings.externalLinkBaseUrl, { type: 1, host: e.name });
	};

		const isSoft = e.state_type === 0;
		const { language } = settings;
		const nowTime = new Date().getTime();
		// When passive freshold check is done, this is reported as an active check (check_type=0)
		// So we need another reliable way to determine if this is a stale passive alert.
		//
		// check_type === 0 is active check
		// check_type === 1 is passive check
		//
		// Some options we can use:
		// check_type === 1
		// checks_enabled === false
		const isPassive = e.check_type === 1;
		const nextCheckInTheFuture = e.next_check > nowTime;
		const isDown = e.status !== 2;

		const maxNumberToHideProgress = 40;

		return (
			<div className={`HostItem2`}>
				<div className={`HostItemBorder ${hostBorderClass(e.status)} ${isSoft ? 'host-item-soft' : 'host-item-hard'}`}>
					<div style={{ float: 'right', textAlign: 'right' }}>
						{/* soft spinner */}
						{isSoft && <span className={`softIcon ${hostTextClass(e.status)}`}><FontAwesomeIcon icon={faCloudRain} /></span>}
						{/* notifications disabled */}
						{e.notifications_enabled === false && <span className="item-notifications-disabled">Notifications Disabled - </span>}
						{/* for debug turn this on to know what state_type this item is */}
						{/* {1 === 2 && <span>({e.state_type})</span>} */}
						{/* soft */}
						<span className={`uppercase host-item-state-type-${e.state_type}`}>
							{translate(nagiosStateType(e.state_type), language)}
							{/* current_attempt max_attempts */}
							{isSoft && <span> {e.current_attempt}/{e.max_attempts}</span>}
						</span>{' '}
						{/* for debug turn this on to know what status this item is */}
						{/* {1 === 2 && <span>({e.status})</span>} */}
						<span className={`uppercase ${hostTextClass(e.status)}`}>HOST {translate(nagiosHostStatus(e.status), language)}</span>{' '}
						{e.problem_has_been_acknowledged && <span className="color-green uppercase"> {translate('acked', language)}</span>}
						{e.scheduled_downtime_depth > 0 && <span className="color-green uppercase"> {translate('scheduled', language)}</span>}
						{e.is_flapping && <span className="color-orange uppercase"> {translate('flapping', language)}</span>}
						{/** only show last-ok if the item is actually down. We show things like scheduled which can be UP */}
						{isDown && <div className="last-ok">
							<span>{translate('Last UP', language)}</span>&nbsp;
							{(e.last_time_up === 0) && <span className="color-orange">Never</span>}
							{(e.last_time_up !== 0) && <span>{formatDateTimeAgoColor(e.last_time_up)} {translate('ago', language)}</span>}
						</div>}
					</div>

					<div>

						<div className="host-item-host-name">{e.name}</div>

						<span className="ml-1.5 cursor-pointer" onClick={openNagiosHostPage}><FontAwesomeIcon icon={faUpRightFromSquare} size="xs" /></span>

						{/*<span className="alert-item-description">{e.description}</span>*/}

						<span className={hostTextClass(e.status)} style={{ marginLeft: '8px' }}>
							<span className="plugin-output">{e.plugin_output}</span>
						</span>
					</div>

					<div className="next-check-in">
						{/*{translate('Last check was', language)}: <span className="color-peach">{formatDateTimeAgo(e.last_check)}</span> {translate('ago', language)}{' - '}*/}

						{/* passive checks get "Last check 5m ago" */}
						{isPassive && <span className="mr-1">Passive - Last check [nc:{e.next_check}] <span className="color-peach">{formatDateTimeAgo(e.last_check)}</span> ago</span>}

						{/* active checks get "Next check in 5m 22s" */}
						{(e.checks_enabled) && <span className="mr-1">
							<NextCheckIn nextCheckTime={e.next_check} language={language} />
						</span>}
					</div>

					{/* comments */}
					{(comments && comments.length > 0) && <div>
						{comments.slice().reverse().map((comment, i) => (
							<div className="comment" key={i}>
								{/* Comment: */}
								<span className="comment-color">({comment.author}): {formatDateTimeAgo(comment.entry_time)} {translate('ago', language)} - {comment.comment_data}</span>
							</div>
						))}
					</div>}

					{(nextCheckInTheFuture && settings.showNextCheckInProgressBar && howManyDown < maxNumberToHideProgress) && <Progress next_check={e.next_check} color={hostTextClass(e.status)}></Progress>}

				</div>
			</div>
		);
};

export default HostItem;
