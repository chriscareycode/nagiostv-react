import React, { Component } from 'react';
import './ServiceItem.css';
import { formatDateTime, formatDateTimeAgo, formatDateTimeAgoColor } from '../../helpers/moment.js';
import { serviceBorderClass, serviceTextClass } from '../../helpers/colors.js';
import { nagiosStateType, nagiosServiceStatus } from '../../helpers/nagios.js';
import { playSoundEffectDebounced, speakAudio } from '../../helpers/audio';
import { translate } from '../../helpers/language';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faYinYang } from '@fortawesome/free-solid-svg-icons';
import Progress from '../widgets/Progress';

const defaultStyles = {
  overflow: 'hidden',
  color: 'white'
}

class ServiceItem extends Component {

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
    const speakWords = translate('service', language) + ' ' + this.props.serviceItem.host_name + ' ' + this.props.serviceItem.description + ' ' + translate('ok', language);
    
    //console.log({speakWords});
    speakAudio(speakWords, voice);
  }

  render() {

    const e = this.props.serviceItem; // clean this up
    const isSoft = e.state_type === 0;
    const { language } = this.props.settings;
    const secondsToNextCheck = Math.floor((e.next_check - new Date().getTime()) / 1000);
    const nowTime = new Date().getTime();

    return (
      
      <div style={{ ...defaultStyles }} className={`ServiceItem`}>
        <div className={`ServiceItemBorder ${serviceBorderClass(e.status)}`}>
          <div style={{ float: 'right', textAlign: 'right' }}>
            {isSoft && <span className="softIcon color-yellow"><FontAwesomeIcon icon={faYinYang} spin /></span>}
            {1 === 2 && <span>({e.state_type})</span>}
            <span className="uppercase">{translate(nagiosStateType(e.state_type), language)}</span>{' '}
            {1 === 2 && <span>({e.status})</span>}
            <span className={`uppercase ${serviceTextClass(e.status)}`}>{translate(nagiosServiceStatus(e.status), language)}</span>{' '}
            {e.problem_has_been_acknowledged && <span className="color-green uppercase"> {translate('acked', language)}</span>}
            {e.scheduled_downtime_depth > 0 && <span className="color-green uppercase"> {translate('scheduled', language)}</span>}
            {e.is_flapping && <span className="color-orange uppercase"> {translate('flapping', language)}</span>}
            <div className="lastOk"><span>{translate('Last OK', language)}</span> {formatDateTimeAgoColor(e.last_time_ok)} {translate('ago', language)}</div>
          
          </div>

          <div style={{ textAlign: 'left' }}>
            <strong>{e.host_name}</strong>{' - '}
            <span className={serviceTextClass(e.status)}>
              <span className="color-orange">{e.description}</span>{' - '}
              {e.plugin_output}
            </span>
          </div>

          <div className="lastCheck">
            {/*{translate('Last check was', language)}: <span className="color-peach">{formatDateTimeAgo(e.last_check)}</span> {translate('ago', language)}{' - '}*/}
            {translate('Next check in', language)}:
            {(e.next_check > nowTime) && <span className="color-peach"> {formatDateTime(e.next_check)}</span>}
            {(e.next_check <= nowTime) && <span className="checking-now"> Checking now...</span>}
          </div>

          {this.props.comment && <div className="comment">
            Comment: <span className="comment-color">({this.props.comment_author}): {formatDateTimeAgo(this.props.comment_entry_time)} ago - {this.props.comment}</span>
          </div>}

          <Progress seconds={secondsToNextCheck} color={serviceTextClass(e.status)}></Progress>
        
        </div>

      </div>
    );
  }
}

export default ServiceItem;
