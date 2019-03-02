import React, { Component } from 'react';
import './ServiceItem.css';
import { formatDateTime, formatDateTimeAgo, formatDateTimeAgoColor } from '../../helpers/moment.js';
import { serviceBorderClass, serviceTextClass } from '../../helpers/colors.js';
import { nagiosStateType, nagiosServiceStatus } from '../../helpers/nagios.js';
import { playAudio, speakAudio } from '../../helpers/audio';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faYinYang } from '@fortawesome/free-solid-svg-icons';

const defaultStyles = {
  overflow: 'hidden',
  color: 'white'
}

class ServiceItem extends Component {

  componentDidMount() {
    this.doAudio();
    this.doSpeakIntro();
  }

  componentWillUnmount() {
    
  }

  doSpeakIntro() {
    speakAudio(
      nagiosServiceStatus(this.props.serviceItem.status) + ' '
      + this.props.serviceItem.host_name + ' ' + this.props.serviceItem.description + ' '
      //+ nagiosStateType(this.props.serviceItem.state_type) + ' '
      //+ nagiosServiceStatus(this.props.serviceItem.status) + ' '
      //+ this.props.serviceItem.plugin_output
    );
  }

  doSpeakOutro() {
    speakAudio(this.props.serviceItem.host_name + ' ' + ' ' + this.props.serviceItem.description + ' service ok');
  }

  doAudio() {
    const status = nagiosServiceStatus(this.props.serviceItem.status);
    console.log('status is', status);
    switch(status) {
      case 'CRITICAL':
        playAudio('service', 'critical');
        break;
      case 'WARNING':
        playAudio('service', 'warning');
        break;
      case 'OK':
        playAudio('service', 'ok');
        break;
      default:
        break;
    }
  }
  
  render() {

    const e = this.props.serviceItem; // clean this up
    const isSoft = e.state_type === 0;

    return (
      
    <div key={e.host_name + '-' + e.description} style={{ ...defaultStyles }} className={`ServiceItem`}>
      <div className={`ServiceItemBorder ${serviceBorderClass(e.status)}`}>
        <div style={{ float: 'right', textAlign: 'right' }}>
        {isSoft && <span className="softIcon color-yellow"><FontAwesomeIcon icon={faYinYang} spin /></span>}
        {1 === 1 && <span>({e.state_type})</span>}
        {nagiosStateType(e.state_type)}{' '}
        {1 === 1 && <span>({e.status})</span>}
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
