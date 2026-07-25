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
import './ServiceItem.css';
import { formatDateTime, formatDateTimeAgo, formatDateTimeAgoColor } from '../../helpers/dates';
import { serviceBorderClass, serviceTextClass } from '../../helpers/colors';
import { nagiosStateType, nagiosServiceStatus } from '../../helpers/nagios';
import { playSoundEffectDebounced, speakAudio } from '../../helpers/audio';
import { translate } from '../../helpers/language';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudRain, faUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
import Progress from '../widgets/Progress';
// Types
import { ClientSettings } from 'types/settings';
import { Service } from 'types/hostAndServiceTypes';
import { CommentListResponseObject } from 'types/commentTypes';
import NextCheckIn from 'components/widgets/NextCheckIn';

interface ServiceItemProps {
	settings: ClientSettings;
	serviceItem: Service;
	isDemoMode: boolean;
	howManyDown: number;
	comments: CommentListResponseObject[];
}

const doSoundEffect = ({ serviceItem, settings }: ServiceItemProps) => {
		const status = nagiosServiceStatus(serviceItem.status);
		switch (status) {
			case 'critical':
				playSoundEffectDebounced('service', 'critical', settings);
				break;
			case 'warning':
				playSoundEffectDebounced('service', 'warning', settings);
				break;
			default:
				break;
		}
};

const doSpeakIntro = ({ serviceItem, settings }: ServiceItemProps) => {
		const { language } = settings;
		const voice = settings.speakItemsVoice;

		let words = translate('service', language) + ' ' + serviceItem.description +
			' ' + translate('on', language) + ' ' + serviceItem.host_name + ' ' + translate('is', language) + ' '
			+ translate(nagiosServiceStatus(serviceItem.status), language);

		if (serviceItem.is_flapping) { words += ' ' + translate('and', language) + ' ' + translate('flapping', language); }
		if (serviceItem.problem_has_been_acknowledged) { words += ' ' + translate('and', language) + ' ' + translate('acked', language); }
		if (serviceItem.scheduled_downtime_depth > 0) { words += ' ' + translate('and', language) + ' ' + translate('scheduled', language); }

		speakAudio(words, voice);
};

const doSpeakOutro = ({ serviceItem, settings }: ServiceItemProps) => {
		const { language } = settings;
		const voice = settings.speakItemsVoice;
		const speakWords = translate('service', language) + ' ' + serviceItem.description + ' ' + translate('on', language) + ' ' + serviceItem.host_name + ' ' + translate('ok', language);

		speakAudio(speakWords, voice);
};

const ServiceItem = (props: ServiceItemProps) => {
	const { settings, serviceItem: e, isDemoMode, howManyDown, comments } = props;
	const initialProps = useRef(props);
	const latestProps = useRef(props);
	latestProps.current = props;

	useEffect(() => {
		const mountedProps = initialProps.current;
		if (mountedProps.settings.playSoundEffects) { doSoundEffect(mountedProps); }
		if (mountedProps.settings.speakItems) { doSpeakIntro(mountedProps); }

		return () => {
			const currentProps = latestProps.current;
			const isServiceOk = currentProps.serviceItem.status === 2;

			if (currentProps.settings.playSoundEffects && isServiceOk) {
				playSoundEffectDebounced('service', 'ok', currentProps.settings);
			}
			if (currentProps.settings.speakItems && isServiceOk) {
				doSpeakOutro(currentProps);
			}
		};
	}, []);

	const openNagiosHostPage = () => {
		if (isDemoMode) {
			return;
		}

		const hostName = e.host_name;
		
		const externalLinkBaseUrl = settings.externalLinkBaseUrl;
		const url = encodeURI(`${externalLinkBaseUrl}extinfo.cgi?type=1&host=${hostName}`);
		const win = window.open(url, '_blank');
		win?.focus();
	};

	const openNagiosServicePage = () => {
		if (isDemoMode) {
			return;
		}
		const externalLinkBaseUrl = settings.externalLinkBaseUrl;
		const url = encodeURI(`${externalLinkBaseUrl}extinfo.cgi?type=2&host=${e.host_name}&service=${e.description}`);
		const win = window.open(url, '_blank');
		win?.focus();
	};

		const isSoft = e.state_type === 0;
		const { language } = settings;
		const secondsToNextCheck = Math.floor((e.next_check - new Date().getTime()) / 1000);
		const nowTime = new Date().getTime();

		// When passive freshold check is done, this is reported as an active check (check_type=0)
		// So we need another reliable way to determine if this is a stale passive alert.
		// Some options we can use:
		// check_type === 1
		// checks_enabled === false
		const isPassive = e.check_type === 1;
		const isDown = e.status !== 2;

		const maxNumberToHideProgress = 40;

		/*
		 This gets renamed to ServiceItem2 since we applied ServiceItem className
		 to the wrapping div in ServiceItems.tsx. Clean this up later.
		*/
		return (

			<div className={`ServiceItem2`}>
				<div className={`ServiceItemBorder ${serviceBorderClass(e.status)} ${isSoft ? 'service-item-soft' : 'service-item-hard'}`}>
					<div style={{ float: 'right', textAlign: 'right' }}>
						{/* soft */}
						{isSoft && <span className={`softIcon ${serviceTextClass(e.status)}`}><FontAwesomeIcon icon={faCloudRain} /></span>}
						{/* notifications disabled */}
						{e.notifications_enabled === false && <span className="item-notifications-disabled">Notifications Disabled - </span>}
						{/* SOFT / HARD for debug turn this on to know what state_type this item is */}
						{/* {1 === 2 && <span>({e.state_type})</span>} */}
						{/* the words hard or soft */}
						<span className={`uppercase service-item-state-type-${e.state_type}`}>
							{translate(nagiosStateType(e.state_type), language)}
							{/* current_attempt max_attempts */}
							{isSoft && <span> {e.current_attempt}/{e.max_attempts}</span>}
						</span>{' '}
						{/* for debug turn this on to know what status this item is */}
						{/* {1 === 2 && <span>({e.status})</span>} */}
						{/* the words CRITICAL WARNING OK */}
						<span className={`uppercase ${serviceTextClass(e.status)}`}>SERVICE {translate(nagiosServiceStatus(e.status), language)}</span>{' '}
						{/** other stuff */}
						{e.problem_has_been_acknowledged && <span className="color-green uppercase"> {translate('acked', language)}</span>}
						{e.scheduled_downtime_depth > 0 && <span className="color-green uppercase"> {translate('scheduled', language)}</span>}
						{e.is_flapping && <span className="color-orange uppercase"> {translate('flapping', language)}</span>}
						{/** only show last-ok if the item is actually down. We show things like scheduled which can be OK */}
						{isDown && <div className="last-ok">
							<span>{translate('Last OK', language)}</span>&nbsp;
							{(e.last_time_ok === 0) && <span className="color-orange">Never</span>}
							{(e.last_time_ok !== 0) && <span>{formatDateTimeAgoColor(e.last_time_ok)} {translate('ago', language)}</span>}
						</div>}
					</div>

					<div className="service-item-left-first-line">

						{settings.showEmoji && e.status === 16 && <span className="mr-1" role="img" aria-label="critical">🔥</span>}
						{settings.showEmoji && e.status === 4 && <span className="mr-1" role="img" aria-label="warning">⚠️</span>}

						<div className="service-item-host-name">{e.host_name}</div>
						<span className="ml-1.5 cursor-pointer" onClick={openNagiosHostPage}><FontAwesomeIcon icon={faUpRightFromSquare} size="xs" /></span>

						<span className="service-item-description">{e.description}</span>
						<span className="-ml-1 cursor-pointer" onClick={openNagiosServicePage}><FontAwesomeIcon icon={faUpRightFromSquare} size="xs" /></span>

						<span className={serviceTextClass(e.status)}>
							<span className="ml-2 plugin-output">{e.plugin_output}</span>
						</span>
					</div>

					<div className="next-check-in">
						{/*{translate('Last check was', language)}: <span className="color-peach">{formatDateTimeAgo(e.last_check)}</span> {translate('ago', language)}{' - '}*/}

						{/* active checks get "Next check in 5m 22s" */}
						{(e.checks_enabled && e.check_type === 0) && <span>
							<NextCheckIn nextCheckTime={e.next_check} language={language} />
						</span>}

						{/* passive checks get "Last check 5m ago" */}
						{isPassive && <span>Passive - Last check <span className="color-peach">{formatDateTimeAgo(e.last_check)}</span> ago</span>}

					</div>

					{(comments && comments.length > 0) && <div>
						{comments.slice().reverse().map((comment, i) => (
							<div className="comment" key={i}>
								{/* Comment: */}
								<span className="comment-color">({comment.author}): {formatDateTimeAgo(comment.entry_time)} ago - {comment.comment_data}</span>
							</div>
						))}
					</div>}

					{(!isPassive && settings.showNextCheckInProgressBar && howManyDown < maxNumberToHideProgress) && <Progress next_check={e.next_check} color={serviceTextClass(e.status)}></Progress>}

				</div>

			</div>
		);
};

export default ServiceItem;
