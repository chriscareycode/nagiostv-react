import React, { Component } from 'react';
import './HostItem.css';
import { formatDateTime, formatDateTimeAgo, formatDateTimeAgoColor } from '../../helpers/moment.js';
import { hostBorderClass, hostTextClass } from '../../helpers/colors.js';
import { nagiosStateType, nagiosHostStatus } from '../../helpers/nagios.js';
import { translate } from '../../helpers/language';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faYinYang } from '@fortawesome/free-solid-svg-icons';
import { playSoundEffectDebounced, speakAudio } from '../../helpers/audio';
import Progress from '../widgets/Progress';

const defaultStyles = {
  overflow: 'hidden',
  color: 'white'
}

class HostItem extends Component {

  componentDidMount() {
    if (this.props.settings.playSoundEffects) { this.doSoundEffect(); }
    if (this.props.settings.speakItems) { this.doSpeakIntro(); }
  }

  componentWillUnmount() {
    if (this.props.settings.playSoundEffects) {
      playSoundEffectDebounced('host', 'up', this.props.settings);
    }
    if (this.props.settings.speakItems) { this.doSpeakOutro(); }
  }

  doSoundEffect() {
    const status = nagiosHostStatus(this.props.hostItem.status);
    switch(status) {
      case 'down':
        playSoundEffectDebounced('host', 'down', this.props.settings);
        break;
      case 'unreachable':
        playSoundEffectDebounced('host', 'unreachable', this.props.settings);
        break;
      default:
        break;
    }
  }

  doSpeakIntro() {
    const { language } = this.props.settings;
    const voice = this.props.settings.speakItemsVoice;

    let words = translate('host', language) + ' ' + this.props.hostItem.name + ' '
      + translate('is', language) + ' ' + translate(nagiosHostStatus(this.props.hostItem.status), language);

    if (this.props.hostItem.is_flapping) { words += ' ' + translate('and', language) + ' ' + translate('flapping', language); }
    if (this.props.hostItem.problem_has_been_acknowledged) { words += ' ' + translate('and', language) + ' ' + translate('acked', language); }
    if (this.props.hostItem.scheduled_downtime_depth > 0) { words += ' ' + translate('and', language) + ' ' + translate('scheduled', language); }

    //console.log({words});
    speakAudio(words, voice);
  }

  doSpeakOutro() {
    const { language } = this.props.settings;
    const voice = this.props.settings.speakItemsVoice;
    const speakWords = translate('host', language) + ' ' + this.props.hostItem.name + ' ' + translate('ok', language);
    
    //console.log({speakWords});
    speakAudio(speakWords, voice);
  }

  render() {

    const e = this.props.hostItem; // clean this up
    const isSoft = e.state_type === 0;
    const { language } = this.props.settings;
    const secondsToNextCheck = Math.floor((e.next_check - new Date().getTime()) / 1000);
    const nowTime = new Date().getTime();

    return (
      <div style={{ ...defaultStyles }} className={`HostItem`}>
        <div className={`HostItemBorder ${hostBorderClass(e.status)}`}>
          <div style={{ float: 'right', textAlign: 'right' }}>
            {isSoft && <span className="softIcon color-red"><FontAwesomeIcon icon={faYinYang} spin /></span>}
            {1 === 2 && <span>({e.state_type})</span>}
            <span className="uppercase">{translate(nagiosStateType(e.state_type), language)}</span>{' '}
            {1 === 2 && <span>({e.status})</span>}
            <span className={`uppercase ${hostTextClass(e.status)}`}>{translate(nagiosHostStatus(e.status), language)}</span>{' '}
            {e.problem_has_been_acknowledged && <span className="color-green uppercase"> {translate('acked', language)}</span>}
            {e.scheduled_downtime_depth > 0 && <span className="color-green uppercase"> {translate('scheduled', language)}</span>}
            {e.is_flapping && <span className="color-orange uppercase"> {translate('flapping', language)}</span>}
            <div className="lastOk"><span>{translate('Last UP', language)}</span> {formatDateTimeAgoColor(e.last_time_up)} {translate('ago', language)}</div>
          </div>
          <div style={{ textAlign: 'left' }}>
            <strong>{e.name}</strong>{' '}
            <span className={hostTextClass(e.status)}>
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
            Comment: <span className="comment-color">({this.props.comment_author}): {formatDateTimeAgo(this.props.comment_entry_time)} {translate('ago', language)} - {this.props.comment}</span>
          </div>}

          <Progress seconds={secondsToNextCheck} color={hostTextClass(e.status)}></Progress>
        </div>
      </div>
    );
  }
}

export default HostItem;
