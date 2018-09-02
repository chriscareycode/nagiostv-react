import React, { Component } from 'react';
import './animation.css';
import './HostItems.css';
import { formatDateTime, formatDateTimeAgo } from '../helpers/moment.js';
import { hostBorderClass, hostTextClass } from '../helpers/colors.js';
import { nagiosStateType, nagiosHostStatus } from '../helpers/nagios.js';

import ReactCSSTransitionGroup from 'react-addons-css-transition-group';

const defaultStyles = {
  overflow: 'hidden',
  backgroundColor: '#111',
  color: 'white',
  justifyContent: 'center'
}

class HostItems extends Component {

  render() {

    //console.log('this.props.hostProblemsArray is', this.props.hostProblemsArray);
    //console.log(Object.keys(this.props.hostProblemsArray));

    return (
      <div className="ServiceItems">

        <ReactCSSTransitionGroup
          transitionName="example"
          transitionEnterTimeout={1000}
          transitionLeaveTimeout={1000}>
          {this.props.hostProblemsArray.map((e, i) => {
            //console.log('HostItem item');
            //console.log(e, i);

            return (
              <div key={i} style={{ ...defaultStyles }} className={`HostItem ${hostBorderClass(e.status)}`}>
                <div style={{ float: 'right' }}>
                ({e.state_type})
                  {nagiosStateType(e.state_type)}{' '}
                  ({e.status})
                  {nagiosHostStatus(e.status)}{' '}
                  {e.problem_has_been_acknowledged && <span>ACKED</span>}
                  {e.is_flapping && <span>FLAPPING</span>}
                </div>
                <div style={{ textAlign: 'left' }}>
                  {e.name}{' '}
                  <span className={hostTextClass(e.status)}>
                    <span className="color-orange">{e.description}</span>{' - '}
                    {e.plugin_output}
                  </span>
                </div>
                <div style={{ textAlign: 'left' }}>
                  Last Check: {formatDateTimeAgo(e.last_check)} ago{' - '}
                  Next Check in {formatDateTime(e.next_check)}
                </div>
              </div>
            );
            
          })}
        </ReactCSSTransitionGroup>
      </div>
    );
  }
}

export default HostItems;
