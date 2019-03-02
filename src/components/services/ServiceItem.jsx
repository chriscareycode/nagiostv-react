import React, { Component } from 'react';
import './ServiceItem.css';
import { formatDateTime, formatDateTimeAgo, formatDateTimeAgoColor } from '../../helpers/moment.js';
import { serviceBorderClass, serviceTextClass } from '../../helpers/colors.js';
import { nagiosStateType, nagiosServiceStatus } from '../../helpers/nagios.js';
import { playSoundEffect, speakAudio } from '../../helpers/audio';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faYinYang } from '@fortawesome/free-solid-svg-icons';

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
    if (this.props.settings.playSoundEffects) { this.doSoundEffect(); }
    if (this.props.settings.speakItems) { this.doSpeakOutro(); }
  }

  doSoundEffect() {
    const status = nagiosServiceStatus(this.props.serviceItem.status);
    console.log('status is', status);
    switch(status) {
      case 'CRITICAL':
        playSoundEffect('service', 'critical');
        break;
      case 'WARNING':
        playSoundEffect('service', 'warning');
        break;
      case 'OK':
        playSoundEffect('service', 'ok');
        break;
      default:
        break;
    }
  }

  doSpeakIntro() {
    let words = 'service ' + this.props.serviceItem.description +
      'on ' + this.props.serviceItem.host_name + ' is '
      + nagiosServiceStatus(this.props.serviceItem.status) + ' ';

    if (this.props.serviceItem.is_flapping) { words += ' and flapping'; }
    if (this.props.serviceItem.problem_has_been_acknowledged) { words += ' and acked'; }
    if (this.props.serviceItem.scheduled_downtime_depth > 0) { words += ' and scheduled'; }

    speakAudio(words);
  }

  doSpeakOutro() {
    speakAudio('service ' + this.props.serviceItem.host_name + ' ' + this.props.serviceItem.description + ' ok');
  }

  render() {

    const e = this.props.serviceItem; // clean this up
    const isSoft = e.state_type === 0;

    return (
      
    <div style={{ ...defaultStyles }} className={`ServiceItem`}>
      <div className={`ServiceItemBorder ${serviceBorderClass(e.status)}`}>
        <div style={{ float: 'right', textAlign: 'right' }}>
        {isSoft && <span className="softIcon color-yellow"><FontAwesomeIcon icon={faYinYang} spin /></span>}
        {1 === 2 && <span>({e.state_type})</span>}
        {nagiosStateType(e.state_type)}{' '}
        {1 === 2 && <span>({e.status})</span>}
        <span className={serviceTextClass(e.status)}>{nagiosServiceStatus(e.status)}</span>{' '}
        {e.problem_has_been_acknowledged && <span className="color-green"> ACKED</span>}
        {e.scheduled_downtime_depth > 0 && <span className="color-green"> SCHEDULED</span>}
        {e.is_flapping && <span className="color-orange">FLAPPING</span>}
        <div className="lastOk"><span>Last OK</span> {formatDateTimeAgoColor(e.last_time_ok)} ago</div>
      </div>

      <div style={{ textAlign: 'left' }}>
        <strong>{e.host_name}</strong>{' - '}
        <span className={serviceTextClass(e.status)}>
          <span className="color-orange">{e.description}</span>{' - '}
          {e.plugin_output}
        </span>
      </div>

      <div className="lastCheck">
        Last check was: <span className="color-peach">{formatDateTimeAgo(e.last_check)}</span> ago{' - '}
        Next check in: <span className="color-peach">{formatDateTime(e.next_check)}</span>
      </div>

      {this.props.comment && <span style={{ textAlign: 'left', fontSize: '1em' }}>
        Comment: <span className="color-comment">({this.props.comment_author}): {formatDateTimeAgo(this.props.comment_entry_time)} ago - {this.props.comment}</span>
      </span>}

      </div>
    </div>
    );
  }
}

export default ServiceItem;
