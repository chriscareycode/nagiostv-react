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

class ServiceItems extends Component {

  render() {

    //console.log('this.props.serviceProblemsArray is', this.props.serviceProblemsArray);
    //console.log(Object.keys(this.props.serviceProblemsArray));
    const filteredServiceProblemsArray = this.props.serviceProblemsArray.filter(item => {
      if (this.props.settings.hideServiceWarning) {
        if (item.status === 4) { return false; }
      }
      if (this.props.settings.hideServiceUnknown) {
        if (item.status === 8) { return false; }
      }
      if (this.props.settings.hideServiceCritical) {
        if (item.status === 16) { return false; }
      }
      if (this.props.settings.hideServiceAcked) {
        if (item.problem_has_been_acknowledged) { return false; }
      }
      if (this.props.settings.hideServiceDowntime) {
        if (item.scheduled_downtime_depth > 0) { return false; }
      }
      if (this.props.settings.hideServiceFlapping) {
        if (item.is_flapping) { return false; }
      }
      return true;
    });

    const howManyHidden = this.props.serviceProblemsArray.length - filteredServiceProblemsArray.length;

    return (
      <div className="ServiceItems">

        {this.props.serviceProblemsArray.length > 0 && filteredServiceProblemsArray.length === 0 && <div key={'hiddenSummary'} className="margin-top-10 color-green some-down-items">
          {this.props.howManyServices} services{', '}
          {howManyHidden} hidden{' '}
          {this.props.howManyServiceWarning > 0 && <span className="hidden-label warning">{this.props.howManyServiceWarning} WARNING</span>}
          {this.props.howManyServiceUnknown > 0 && <span className="hidden-label unknown">{this.props.howManyServiceUnknown} UNKNOWN</span>}
          {this.props.howManyServiceCritical > 0 && <span className="hidden-label critical">{this.props.howManyServiceCritical} CRITICAL</span>}
          {this.props.howManyServiceAcked > 0 && <span className="hidden-label acked">{this.props.howManyServiceAcked} ACKED</span>}
          {this.props.howManyServiceDowntime > 0 && <span className="hidden-label downtime">{this.props.howManyServiceDowntime} DOWNTIME</span>}
          {this.props.howManyServiceFlapping > 0 && <span className="hidden-label flapping">{this.props.howManyServiceFlapping} FLAPPING</span>}
        </div>}

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
              <div key={e.host_name + '-' + e.description} style={{ ...defaultStyles }} className={`ServiceItem`}>
                <div className={`ServiceItemBorder ${serviceBorderClass(e.status)}`}>
                  <div style={{ float: 'right', textAlign: 'right' }}>
                    {1 === 2 && <span>({e.state_type})</span>}
                    {nagiosStateType(e.state_type)}{' '}
                    {1 === 2 && <span>({e.status})</span>}
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

                  <div style={{ textAlign: 'left', fontSize: '0.9em', marginBottom: '2px' }}>
                    Last check was <span className="color-peach">{formatDateTimeAgo(e.last_check)}</span> ago{' - '}
                    Next check in: <span className="color-peach">{formatDateTime(e.next_check)}</span>
                  </div>

                  {e.problem_has_been_acknowledged && <span className="color-green" style={{ marginRight: '5px' }}>ACKED</span>}

                  {comment && <span style={{ textAlign: 'left', fontSize: '1em' }}>
                    Comment: <span className="color-comment">({comment_author}): {formatDateTimeAgo(comment_entry_time)} ago - {comment}</span>
                  </span>}

                </div>
              </div>
            );
            
          })}
        </ReactCSSTransitionGroup>
      </div>
    );
  }
}

export default ServiceItems;
