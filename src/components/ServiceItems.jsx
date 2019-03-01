import React, { Component } from 'react';
import './animation.css';
import './ServiceItems.css';
import { formatDateTime, formatDateTimeAgo, formatDateTimeAgoColor } from '../helpers/moment.js';
import { serviceBorderClass, serviceTextClass } from '../helpers/colors.js';
import { nagiosStateType, nagiosServiceStatus } from '../helpers/nagios.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faYinYang } from '@fortawesome/free-solid-svg-icons';

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
      if (this.props.settings.hideServiceScheduled) {
        if (item.scheduled_downtime_depth > 0) { return false; }
      }
      if (this.props.settings.hideServiceFlapping) {
        if (item.is_flapping) { return false; }
      }
      return true;
    });

    const howManyHidden = this.props.serviceProblemsArray.length - filteredServiceProblemsArray.length;

    const showSomeDownItems = this.props.serviceProblemsArray.length > 0 && filteredServiceProblemsArray.length === 0;

    return (
      <div className="ServiceItems">

        <div className={`all-ok-item ${this.props.serviceProblemsArray.length === 0 ? 'visible' : 'hidden'}`}>
          <span style={{ margin: '5px 10px' }} className="margin-left-10 display-inline-block color-green">All {this.props.howManyServices} services are OK</span>{' '}
        </div>

        <div className={`some-down-items ${showSomeDownItems ? 'visible' : 'hidden'}`}>
          <div>
            <span className="display-inline-block color-green" style={{ marginRight: '10px' }}>{this.props.howManyServices - this.props.serviceProblemsArray.length} services are OK</span>{' '}
            <span className="some-down-hidden-text">({howManyHidden} hidden service problem{howManyHidden === 1 ? '' : 's'})</span>
          </div>
        </div>

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

            const isSoft = e.state_type === 0;

            return (
              <div key={e.host_name + '-' + e.description} style={{ ...defaultStyles }} className={`ServiceItem`}>
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
