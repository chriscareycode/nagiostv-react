import React, { Component } from 'react';
import './animation.css';
import './ServiceItems.css';
import { formatDateTime, formatDateTimeAgo, formatDateTimeAgoColor } from '../helpers/moment.js';
import { serviceBorderClass, serviceTextClass } from '../helpers/colors.js';
import { nagiosStateType, nagiosServiceStatus } from '../helpers/nagios.js';

import ReactCSSTransitionGroup from 'react-addons-css-transition-group';

const defaultStyles = {
  overflow: 'hidden',
  color: 'white'
}

class ServiceItem extends Component {

  render() {

    //console.log('this.props.serviceProblemsArray is', this.props.serviceProblemsArray);
    //console.log(Object.keys(this.props.serviceProblemsArray));
    const filteredServiceProblemsArray = this.props.serviceProblemsArray.filter(item => {
      if (this.props.settings.hideServiceWarning) {
        if (item.status === 4) { return false; }
      }
      if (this.props.settings.hideServiceCritical) {
        if (item.status === 16) { return false; }
      }
      if (this.props.settings.hideServiceAcked) {
        if (item.problem_has_been_acknowledged) { return false; }
      }
      return true;
    });

    return (
      <div className="ServiceItems">

        {/*filteredServiceProblemsArray.length === 0 && <div key={'ok'} className="margin-top-10 color-green AllOkItem">
          All - services are OK
        </div>*/}

        <ReactCSSTransitionGroup
          transitionName="example"
          transitionEnterTimeout={500}
          transitionLeaveTimeout={500}>

          {filteredServiceProblemsArray.map((e, i) => {
            //console.log('ServiceItem item');
            //console.log(e, i);

            // find comment for this serviceitem
            let comment = '';
            let comment_author = '';
            let comment_entry_time = 0;
            const commentlist = this.props.commentlist;
            Object.keys(commentlist).forEach((id) => {
              if (commentlist[id].comment_type === 2 && e.host_name === commentlist[id].host_name && e.description === commentlist[id].service_description) {
                comment = commentlist[id].comment_data;
                comment_author = commentlist[id].author;
                comment_entry_time = commentlist[id].entry_time;
              }
            });

            return (
              <div key={e.host_name + '-' + e.description} style={{ ...defaultStyles }} className={`ServiceItem ${serviceBorderClass(e.status)}`}>
                {e.status}
                <div style={{ float: 'right', textAlign: 'right' }}>
                  {nagiosStateType(e.state_type)}{' '}
                  <span className={serviceTextClass(e.status)}>{nagiosServiceStatus(e.status)}</span>{' '}
                  {e.problem_has_been_acknowledged && <span className="color-green">ACKED</span>}
                  {e.is_flapping && <span className="color-orange">FLAPPING</span>}
                  <div><span className="lastOk">Last OK</span> {formatDateTimeAgoColor(e.last_time_ok)} ago</div>
                </div>

                <div style={{ textAlign: 'left' }}>
                  <strong>{e.host_name}</strong>{' - '}
                  <span className={serviceTextClass(e.status)}>
                    <span className="color-orange">{e.description}</span>{' - '}
                    {e.plugin_output}
                  </span>
                </div>

                <div style={{ textAlign: 'left', fontSize: '0.9em' }}>
                  Last check was <span className="color-peach">{formatDateTimeAgo(e.last_check)}</span> ago{' - '}
                  Next check in: <span className="color-peach">{formatDateTime(e.next_check)}</span>
                </div>

                {comment && <div style={{ textAlign: 'left', fontSize: '1em' }}>
                  Comment: <span className="color-comment">({comment_author}): {formatDateTimeAgo(comment_entry_time)} ago - {comment}</span>
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
