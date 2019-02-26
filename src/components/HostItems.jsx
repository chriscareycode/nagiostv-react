import React, { Component } from 'react';
import './animation.css';
import './HostItems.css';
import { formatDateTime, formatDateTimeAgo, formatDateTimeAgoColor } from '../helpers/moment.js';
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

    const filteredHostProblemsArray = this.props.hostProblemsArray.filter(item => {
      if (this.props.settings.hideHostDown) {
        if (item.status === 4) { return false; }
      }
      if (this.props.settings.hideHostUnreachable) {
        if (item.status === 8) { return false; }
      }
      if (this.props.settings.hideHostPending) {
        if (item.status === 16) { return false; }
      }
      if (this.props.settings.hideHostAcked) {
        if (item.problem_has_been_acknowledged) { return false; }
      }
      if (this.props.settings.hideHostScheduled) {
        if (item.scheduled_downtime_depth > 0) { return false; }
      }
      if (this.props.settings.hideHostFlapping) {
        if (item.is_flapping) { return false; }
      }
      return true;
    });

    const howManyHidden = this.props.hostProblemsArray.length - filteredHostProblemsArray.length;

    const showSomeDownItems = this.props.hostProblemsArray.length > 0 && filteredHostProblemsArray.length === 0;

    return (
      <div className="ServiceItems">

        <div className={`all-ok-item ${this.props.hostProblemsArray.length === 0 ? 'visible' : 'hidden'}`}>
          <span style={{ margin: '5px 10px' }} className="margin-left-10 display-inline-block color-green">All {this.props.howManyHosts} hosts are OK</span>{' '}
        </div>

        <div className={`some-down-items ${showSomeDownItems ? 'visible' : 'hidden'}`}>
          <div style={{ padding: '5px' }}>
            {howManyHidden} hidden host problem{howManyHidden === 1 ? '' : 's'}{' '}
            {this.props.howManyHostDown > 0 && <span className="hidden-label down">{this.props.howManyHostDown} DOWN</span>}
            {this.props.howManyHostUnreachable > 0 && <span className="hidden-label unreachable">{this.props.howManyHostUnreachable} UNREACHABLE</span>}
            {this.props.howManyHostPending > 0 && <span className="hidden-label pending">{this.props.howManyHostPending} PENDING</span>}
            {this.props.howManyHostAcked > 0 && <span className="hidden-label acked">{this.props.howManyHostAcked} ACKED</span>}
            {this.props.howManyHostScheduled > 0 && <span className="hidden-label scheduled">{this.props.howManyHostScheduled} SCHEDULED</span>}
            {this.props.howManyHostFlapping > 0 && <span className="hidden-label flapping">{this.props.howManyHostFlapping} FLAPPING</span>}
            <span className="margin-left-10 display-inline-block color-green">{this.props.howManyHosts - this.props.hostProblemsArray.length} hosts OK</span>{' '}
          </div>
        </div>

        <ReactCSSTransitionGroup
          transitionName="example"
          transitionEnterTimeout={500}
          transitionLeaveTimeout={500}>
          {filteredHostProblemsArray.map((e, i) => {
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
              <div key={i} style={{ ...defaultStyles }} className={`HostItem`}>
                <div className={`HostItemBorder ${hostBorderClass(e.status)}`}>
                  <div style={{ float: 'right', textAlign: 'right' }}>
                    {1 === 2 && <span>({e.state_type})</span>}
                    {nagiosStateType(e.state_type)}{' '}
                    {1 === 2 && <span>({e.status})</span>}
                    <span className={hostTextClass(e.status)}>{nagiosHostStatus(e.status)}</span>{' '}
                    {e.problem_has_been_acknowledged && <span className="color-green"> ACKED</span>}
                    {e.scheduled_downtime_depth > 0 && <span className="color-green"> SCHEDULED</span>}
                    {e.is_flapping && <span className="color-orange"> FLAPPING</span>}
                    <div className="lastOk"><span>Last UP</span> {formatDateTimeAgoColor(e.last_time_up)} ago</div>
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <strong>{e.name}</strong>{' '}
                    <span className={hostTextClass(e.status)}>
                      <span className="color-orange">{e.description}</span>{' - '}
                      {e.plugin_output}
                    </span>
                  </div>
                  <div className="lastCheck">
                    Last Check: <span className="color-peach">{formatDateTimeAgo(e.last_check)}</span> ago{' - '}
                    Next Check in <span className="color-peach">{formatDateTime(e.next_check)}</span>
                  </div>

                  {comment && <span style={{ textAlign: 'left', fontSize: '1em' }}>
                    Comment: <span className="color-comment">({comment_author}): {comment}</span>
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

export default HostItems;
