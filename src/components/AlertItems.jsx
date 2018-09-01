import React, { Component } from 'react';
import './animation.css';
import './ServiceItems.css';
import './AlertItems.css';
import { prettyDateTime } from '../helpers/moment.js';
import { alertTextClass } from '../helpers/colors.js';
import { nagiosStateType, nagiosServiceStatus } from '../helpers/nagios.js';
import QuietFor from './QuietFor.jsx';

const defaultStyles = {
  overflow: 'hidden',
  backgroundColor: '#111',
  color: 'white',
  justifyContent: 'center'
}

const ifQuietFor = (nowtime, prevtime, minutes) => {
  //let previousTimestamp = notificationlist[index-1].timestamp;
  let diff = prevtime - nowtime;
  if (diff > minutes * 60 * 1000) {
    return true;
  } else {
    return false;
  }
}

class AlertItems extends Component {
  render() {
    return (
      <div className="AlertItems">
        {/* always show one quiet for (if we have at least 1 item) */}
        {this.props.items.length > 1 && <QuietFor nowtime={new Date().getTime()} prevtime={this.props.items[0].timestamp} />}
        {/* loop through the items */}
        {this.props.items.map((e, i) => {
          return (
            <div key={'alert-' + e.host_name + '-' + e.description + e.timestamp}>
              {(i > 1) && ifQuietFor(e.timestamp, this.props.items[i-1].timestamp, 60) && <QuietFor nowtime={e.timestamp} prevtime={this.props.items[i-1].timestamp} />}
              <div  style={{ ...defaultStyles }} className="AlertItem">
                <div style={{ float: 'right' }}>
                  State Type: ({e.state_type}){' '}
                  {nagiosStateType(e.state_type)}{' '}
                  State: ({e.state}){' '}
                  {nagiosServiceStatus(e.state)}{' '}
                  ({e.object_type})
                </div>
                <div style={{ textAlign: 'left' }}>
                  {e.host_name}{' - '}
                  <span className={alertTextClass(e.state)}>
                    <span className="color-orange">{e.description}</span>{' - '}
                    {e.plugin_output}
                  </span>
                </div>
                <div style={{ textAlign: 'left' }}>
                  {prettyDateTime(e.timestamp)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }
}

export default AlertItems;
