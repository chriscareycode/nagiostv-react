import React, { Component } from 'react';
import './animation.css';
import './HostItems.css';
import { formatDateTime, formatDateTimeAgo } from './helpers/moment.js';
import { wrapperClass, stateClass } from './helpers/colors.js';
import { nagiosStateType, nagiosServiceStatus } from './helpers/nagios.js';

import ReactCSSTransitionGroup from 'react-addons-css-transition-group';

const defaultStyles = {
  overflow: 'hidden',
  //width: '100%',
  backgroundColor: '#111',
  //padding: '10px',
  //border: '2px solid yellow',
  color: 'white',
  //display: 'flex',
  justifyContent: 'center'
  //fontSize: '1.2em',
  //margin: '5px 5px 0 5px',
  //borderRadius: '10px'
}

class HostItems extends Component {

  render() {

    console.log('this.props.hostProblemsArray is', this.props.hostProblemsArray);
    console.log(Object.keys(this.props.hostProblemsArray));

    return (
      <div className="ServiceItems">

        <ReactCSSTransitionGroup
          transitionName="example"
          transitionEnterTimeout={500}
          transitionLeaveTimeout={300}>
          {this.props.hostProblemsArray.map((e, i) => {
            console.log('HostItem item');
            console.log(e, i);
            //console.log(this.props.item[e]);
            //const item = this.props.item[e];

            return (
              <div key={i} style={{ ...defaultStyles }} className={`ServiceItem ${wrapperClass(e.status)}`}>
                <div style={{ float: 'right' }}>
                  {nagiosStateType(e.state_type)}{' '}
                  {nagiosServiceStatus(e.status)}{' '}
                  {e.problem_has_been_acknowledged && <span>ACKED</span>}
                  {e.is_flapping && <span>FLAPPING</span>}
                </div>
                <div style={{ textAlign: 'left' }}>
                  {e.name}{' '}
                  <span className={stateClass(e.status)}>
                    <span className="color-orange">{e.description}</span>{' - '}
                    {e.plugin_output}
                  </span>
                </div>
                <div style={{ textAlign: 'left' }}>
                  Last Check: {formatDateTimeAgo(e.last_check)} ago{' - '}
                  Next Check in {formatDateTime(e.next_check)}{' - '}
                  {e.next_check}
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
