import React, { Component } from 'react';
import './HostItem.css';
import { formatDateTime, formatDateTimeAgo, formatDateTimeAgoColor } from '../../helpers/moment.js';
import { hostBorderClass, hostTextClass } from '../../helpers/colors.js';
import { nagiosStateType, nagiosHostStatus } from '../../helpers/nagios.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faYinYang } from '@fortawesome/free-solid-svg-icons';
import { playSoundEffectDebounced, speakAudio } from '../../helpers/audio';

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
    console.log('host status is', status);
    switch(status) {
      case 'DOWN':
        playSoundEffectDebounced('host', 'down', this.props.settings);
        break;
      case 'UNREACHABLE':
        playSoundEffectDebounced('host', 'unreachable', this.props.settings);
        break;
      default:
        break;
    }
  }

  doSpeakIntro() {
    let words = 'host ' + this.props.hostItem.name + ' '
      + ' is ' + nagiosHostStatus(this.props.hostItem.status) + ' ';

    if (this.props.hostItem.is_flapping) { words += ' and flapping'; }
    if (this.props.hostItem.problem_has_been_acknowledged) { words += ' and acked'; }
    if (this.props.hostItem.scheduled_downtime_depth > 0) { words += ' and scheduled'; }

    const voice = this.props.settings.speakItemsVoice;
    speakAudio(words, voice);
  }

  doSpeakOutro() {
    const voice = this.props.settings.speakItemsVoice;
    speakAudio('host ' + this.props.hostItem.name + ' ok', voice);
  }

  render() {

    const e = this.props.hostItem; // clean this up
    const isSoft = e.state_type === 0;

    return (
      <div style={{ ...defaultStyles }} className={`HostItem`}>
        <div className={`HostItemBorder ${hostBorderClass(e.status)}`}>
          <div style={{ float: 'right', textAlign: 'right' }}>
            {isSoft && <span className="softIcon color-red"><FontAwesomeIcon icon={faYinYang} spin /></span>}
            {1 === 2 && <span>({e.state_type})</span>}
            {nagiosStateType(e.state_type)}{' '}
            {1 === 2 && <span>({e.status})</span>}
            <span className={hostTextClass(e.status)}>{nagiosHostStatus(e.status)}</span>{' '}
            {e.problem_has_been_acknowledged && <span className="color-green"> ACKED</span>}
            {e.scheduled_downtime_depth > 0 && <span className="color-green"> SCHEDULED</span>}
            {e.is_flapping && <span className="color-orange"> FLAPPING</span>}
            <div className="lastOk"><span>Last UP</span> {formatDateTimeAgoColor(e.last_time_up)} ago</div>
          </div>
          <div style={{ textAlign: 'left' }}>
            <strong>{e.name}</strong>{' '}
            <span className={hostTextClass(e.status)}>
              <span className="color-orange">{e.description}</span>{' - '}
              {e.plugin_output}
            </span>
          </div>
          <div className="lastCheck">
            Last Check: <span className="color-peach">{formatDateTimeAgo(e.last_check)}</span> ago{' - '}
            Next Check in <span className="color-peach">{formatDateTime(e.next_check)}</span>
          </div>

          {this.props.comment && <span style={{ textAlign: 'left', fontSize: '1em' }}>
            Comment: <span className="color-comment">({this.props.comment_author}): {this.props.comment}</span>
          </span>}
        </div>
      </div>
    );
  }
}

export default HostItem;
