import React, { Component } from 'react';
import './animation.css';
import './ServiceItems.css';
import { formatDateTime, formatDateTimeAgo } from '../helpers/moment.js';
import { serviceBorderClass, serviceTextClass } from '../helpers/colors.js';
import { nagiosStateType, nagiosServiceStatus } from '../helpers/nagios.js';

import ReactCSSTransitionGroup from 'react-addons-css-transition-group';

const defaultStyles = {
  overflow: 'hidden',
  backgroundColor: '#111',
  color: 'white',
  justifyContent: 'center'
}

class ServiceItem extends Component {

  render() {

    //console.log('this.props.serviceProblemsArray is', this.props.serviceProblemsArray);
    //console.log(Object.keys(this.props.serviceProblemsArray));


    return (
      <div className="ServiceItems">

        <ReactCSSTransitionGroup
          transitionName="example"
          transitionEnterTimeout={1000}
          transitionLeaveTimeout={1000}>
          {this.props.serviceProblemsArray.map((e, i) => {
            //console.log('ServiceItem item');
            //console.log(e, i);
            let comment = '';
            const commentlist = this.props.commentlist;
            Object.keys(commentlist).forEach((id) => {
              if (e.host_name === commentlist[id].host_name && e.description === commentlist[id].service_description) {
                comment = commentlist[id].comment_data;
              }
            });

            return (
              <div key={e.host_name + '-' + e.description} style={{ ...defaultStyles }} className={`ServiceItem ${serviceBorderClass(e.status)}`}>
                <div style={{ float: 'right', textAlign: 'right' }}>
                  {nagiosStateType(e.state_type)}{' '}
                  <span className={serviceTextClass(e.status)}>{nagiosServiceStatus(e.status)}</span>{' '}
                  {e.problem_has_been_acknowledged && <span className="color-green">ACKED</span>}
                  {e.is_flapping && <span className="color-orange">FLAPPING</span>}
                  <div>Down for <span className="color-orange">{formatDateTimeAgo(e.last_time_ok)}</span></div>
                </div>

                <div style={{ textAlign: 'left' }}>
                  <strong>{e.host_name}</strong>{' - '}
                  <span className={serviceTextClass(e.status)}>
                    <span className="color-orange">{e.description}</span>{' - '}
                    {e.plugin_output}
                  </span>
                </div>

                <div style={{ textAlign: 'left', fontSize: '0.9em' }}>
                  Last check was {formatDateTimeAgo(e.last_check)} ago{' - '}
                  Next check in: {formatDateTime(e.next_check)}
                </div>

                {comment && <div style={{ textAlign: 'left', fontSize: '1em' }}>
                  Comment: <span className="color-comment">{comment}</span>
                </div>}

              </div>
            );
            
          })}
        </ReactCSSTransitionGroup>
      </div>
    );
  }
}

export default ServiceItem;
