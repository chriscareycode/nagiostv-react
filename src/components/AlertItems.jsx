import React, { Component } from 'react';
import './animation.css';
import './ServiceItems.css';
import './AlertItems.css';
import { prettyDateTime } from '../helpers/moment.js';
import { alertTextClass, alertBorderClass } from '../helpers/colors.js';
import { nagiosAlertState, nagiosAlertStateType } from '../helpers/nagios.js';
import QuietFor from './QuietFor.jsx';

const defaultStyles = {
  overflow: 'hidden',
  backgroundColor: '#111',
  color: 'white',
  justifyContent: 'center'
}

const ifQuietFor = (nowtime, prevtime, minutes) => {
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
        {this.props.items.length > 1 && <QuietFor first nowtime={new Date().getTime()} prevtime={this.props.items[0].timestamp} showEmoji={this.props.showEmoji} />}
        {/* loop through the items */}
        {this.props.items.map((e, i) => {
          const host = (e.object_type === 1 ? e.name : e.host_name);
          return (
            <div key={'alert-' + host + '-' + e.object_type + '-' + e.timestamp + '-' + i}>
              {/* show quiet for */}
              {(i > 1) && ifQuietFor(e.timestamp, this.props.items[i-1].timestamp, 60) && <QuietFor nowtime={e.timestamp} prevtime={this.props.items[i-1].timestamp} showEmoji={this.props.showEmoji} />}
              {/* show alert item */}
              <div style={{ ...defaultStyles }} className={`AlertItem ${alertBorderClass(e.object_type, e.state)}`}>
                <div style={{ float: 'right' }}>
                  {1 === 2 && <span>({e.state_type})</span>}
                  {nagiosAlertStateType(e.state_type)}{' '}
                  {1 === 2 && <span>({e.state})</span>}
                  {1 === 2 && <span>({e.object_type})</span>}
                  <span className={alertTextClass(e.object_type, e.state)}>{nagiosAlertState(e.state)}{' '}</span>
                  {' - '}{prettyDateTime(e.timestamp)}
                </div>
                <span style={{ textAlign: 'left' }}>
                  {e.object_type === 1 && <span>{e.name}</span>}
                  {e.object_type === 2 && <span>{e.host_name}</span>}
                  {' - '}
                  <span className={alertTextClass(e.object_type, e.state)}>
                    {e.object_type === 2 && <span className="color-orange">{e.description} - </span>}
                    {e.plugin_output}
                  </span>
                </span>
                
              </div>
            </div>
          );
        })}
      </div>
    );
  }
}

export default AlertItems;
