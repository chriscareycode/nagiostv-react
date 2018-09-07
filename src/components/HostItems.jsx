import React, { Component } from 'react';
import './animation.css';
import './HostItems.css';
import { formatDateTime, formatDateTimeAgo } from '../helpers/moment.js';
import { hostBorderClass, hostTextClass } from '../helpers/colors.js';
import { nagiosStateType, nagiosHostStatus } from '../helpers/nagios.js';

import ReactCSSTransitionGroup from 'react-addons-css-transition-group';

const defaultStyles = {
  overflow: 'hidden',
  color: 'white'
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

            // find comment for this hostitem
            let comment = '';
            let comment_author = '';
            const commentlist = this.props.commentlist;
            Object.keys(commentlist).forEach((id) => {
              if (commentlist[id].comment_type === 1 && e.name === commentlist[id].host_name) {
                comment = commentlist[id].comment_data;
                comment_author = commentlist[id].author;
              }
            });

            return (
              <div key={i} style={{ ...defaultStyles }} className={`HostItem ${hostBorderClass(e.status)}`}>
                <div style={{ float: 'right', textAlign: 'right' }}>
                  {1 === 2 && <span>({e.state_type})</span>}
                  {nagiosStateType(e.state_type)}{' '}
                  {1 === 2 && <span>({e.status})</span>}
                  <span className={hostTextClass(e.status)}>{nagiosHostStatus(e.status)}</span>{' '}
                  {e.problem_has_been_acknowledged && <span className="color-green">ACKED</span>}
                  {e.is_flapping && <span className="color-orange">FLAPPING</span>}
                  <div><span className="lastOk">Last UP</span> <span className="color-peach">{formatDateTimeAgo(e.last_time_up)}</span> ago</div>
                </div>
                <div style={{ textAlign: 'left' }}>
                  {e.name}{' '}
                  <span className={hostTextClass(e.status)}>
                    <span className="color-orange">{e.description}</span>{' - '}
                    {e.plugin_output}
                  </span>
                </div>
                <div style={{ textAlign: 'left', fontSize: '0.9em' }}>
                  Last Check: <span className="color-peach">{formatDateTimeAgo(e.last_check)}</span> ago{' - '}
                  Next Check in <span className="color-peach">{formatDateTime(e.next_check)}</span>
                </div>

                {comment && <div style={{ textAlign: 'left', fontSize: '1em' }}>
                  Comment: <span className="color-comment">({comment_author}): {comment}</span>
                </div>}

              </div>
            );
            
          })}
        </ReactCSSTransitionGroup>
      </div>
    );
  }
}

export default HostItems;
