/**
 * NagiosTV https://nagiostv.com
 * Copyright (C) 2008-2021 Chris Carey https://chriscarey.com
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

import { Component } from 'react';
import './ServiceItem.css';
import { formatDateTime, formatDateTimeAgo, formatDateTimeAgoColor } from '../../helpers/moment';
import { serviceBorderClass, serviceTextClass } from '../../helpers/colors';
import { nagiosStateType, nagiosServiceStatus } from '../../helpers/nagios';
import { playSoundEffectDebounced, speakAudio } from '../../helpers/audio';
import { translate } from '../../helpers/language';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudRain } from '@fortawesome/free-solid-svg-icons';
import Progress from '../widgets/Progress';
// Types
import { ClientSettings } from 'types/settings';
import { Comment, Service } from 'types/hostAndServiceTypes';

interface ServiceItemProps {
  settings: ClientSettings;
  serviceItem: Service;
  isDemoMode: boolean;
  howManyDown: number;
  comments: Comment[];
}

class ServiceItem extends Component<ServiceItemProps> {

  componentDidMount() {
    if (this.props.settings.playSoundEffects) { this.doSoundEffect(); }
    if (this.props.settings.speakItems) { this.doSpeakIntro(); }
  }

  componentWillUnmount() {
    if (this.props.settings.playSoundEffects) {
      playSoundEffectDebounced('service', 'ok', this.props.settings);
    }
    if (this.props.settings.speakItems) { this.doSpeakOutro(); }
  }

  doSoundEffect() {
    const status = nagiosServiceStatus(this.props.serviceItem.status);
    switch(status) {
      case 'critical':
        playSoundEffectDebounced('service', 'critical', this.props.settings);
        break;
      case 'warning':
        playSoundEffectDebounced('service', 'warning', this.props.settings);
        break;
      default:
        break;
    }
  }

  doSpeakIntro() {
    const { language } = this.props.settings;
    const voice = this.props.settings.speakItemsVoice;

    let words = translate('service', language) + ' ' + this.props.serviceItem.description +
      ' ' + translate('on', language) + ' ' + this.props.serviceItem.host_name + ' ' + translate('is', language) + ' '
      + translate(nagiosServiceStatus(this.props.serviceItem.status), language);

    if (this.props.serviceItem.is_flapping) { words += ' ' + translate('and', language) + ' ' + translate('flapping', language); }
    if (this.props.serviceItem.problem_has_been_acknowledged) { words += ' ' + translate('and', language) + ' ' + translate('acked', language); }
    if (this.props.serviceItem.scheduled_downtime_depth > 0) { words += ' ' + translate('and', language) + ' ' + translate('scheduled', language); }

    //console.log({words});
    speakAudio(words, voice);
  }

  doSpeakOutro() {
    const { language } = this.props.settings;
    const voice = this.props.settings.speakItemsVoice;
    const speakWords = translate('service', language) + ' ' + this.props.serviceItem.description + ' ' + translate('on', language) + ' ' + this.props.serviceItem.host_name + ' ' + translate('ok', language);
    
    //console.log({speakWords});
    speakAudio(speakWords, voice);
  }

  mouseClick = () => {
    const isDemoMode = this.props.isDemoMode;
    if (isDemoMode) {
      return;
    }
    const e = this.props.serviceItem
    const baseUrl = this.props.settings.baseUrl;
    const url = encodeURI(`${baseUrl}extinfo.cgi?type=2&host=${e.host_name}&service=${e.description}`);
    const win = window.open(url, '_blank');
    win?.focus();
  }

  render() {

    const e = this.props.serviceItem; // clean this up
    const isSoft = e.state_type === 0;
    const { language } = this.props.settings;
    const secondsToNextCheck = Math.floor((e.next_check - new Date().getTime()) / 1000);
    const nowTime = new Date().getTime();

    // When passive freshold check is done, this is reported as an active check (check_type=0)
    // So we need another reliable way to determine if this is a stale passive alert.
    // Some options we can use:
    // check_type === 1
    // checks_enabled === false
    const isPassive = e.check_type === 1;
    const isDown = e.status !== 2;
    
    const howManyDown = this.props.howManyDown;

    const maxNumberToHideProgress = 40;

    return (
      
      <div className={`ServiceItem`} onClick={this.mouseClick}>
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
            <span className={`uppercase ${serviceTextClass(e.status)}`}>{translate(nagiosServiceStatus(e.status), language)}</span>{' '}
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

          <div>
            <div className="service-item-host-name">{e.host_name}</div>

            <span className={serviceTextClass(e.status)}>
              <span className="service-item-description">{e.description}</span>
              {e.plugin_output}
            </span>
          </div>

          <div className="next-check-in">
            {/*{translate('Last check was', language)}: <span className="color-peach">{formatDateTimeAgo(e.last_check)}</span> {translate('ago', language)}{' - '}*/}
            
            {/* active checks get "Next check in 5m 22s" */}
            {(e.checks_enabled && e.check_type === 0 && e.next_check > nowTime) && <span>
              {translate('Next check in', language)} <span className="color-peach"> {formatDateTime(e.next_check)}</span>
            </span>}
            {(e.checks_enabled && e.check_type === 0 && e.next_check <= nowTime) && <span className="checking-now">
              {/*<FontAwesomeIcon icon={faCircleNotch} spin /> */}Checking now...
            </span>}

            {/* passive checks get "Last check 5m ago" */}
            {isPassive && <span>Passive - Last check <span className="color-peach">{formatDateTimeAgo(e.last_check)}</span> ago</span>}

          </div>

          {(this.props.comments && this.props.comments.length > 0) && <div>
            {this.props.comments.reverse().map((comment, i) => (
              <div className="comment" key={i}>
                {/* Comment: */}
                <span className="comment-color">({comment.author}): {formatDateTimeAgo(comment.entry_time)} ago - {comment.comment_data}</span>
              </div>
            ))}
          </div>}

          {(!isPassive && this.props.settings.showNextCheckInProgressBar && howManyDown < maxNumberToHideProgress) && <Progress seconds={secondsToNextCheck} color={serviceTextClass(e.status)}></Progress>}
        
        </div>

      </div>
    );
  }
}

export default ServiceItem;
