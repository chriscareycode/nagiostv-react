import React, { Component } from 'react';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import HostItem from './HostItem';
// css
import './HostItems.css';

class HostItems extends Component {

  render() {

    //console.log('this.props.hostProblemsArray is', this.props.hostProblemsArray);
    //console.log(Object.keys(this.props.hostProblemsArray));

    const filteredHostProblemsArray = this.props.hostProblemsArray.filter(item => {
      if (this.props.settings.hideHostPending) {
        if (item.status === 1) { return false; }
      }
      if (this.props.settings.hideHostDown) {
        if (item.status === 4) { return false; }
      }
      if (this.props.settings.hideHostUnreachable) {
        if (item.status === 8) { return false; }
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
          <span style={{ margin: '5px 10px' }} className="margin-left-10 display-inline-block color-green">All {this.props.howManyHosts} hosts are UP</span>{' '}
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
            let comment_entry_time = '';
            const commentlist = this.props.commentlist;
            Object.keys(commentlist).forEach((id) => {
              if (commentlist[id].comment_type === 1 && e.name === commentlist[id].host_name) {
                comment = commentlist[id].comment_data;
                comment_author = commentlist[id].author;
                comment_entry_time = commentlist[id].entry_time;
              }
            });

            return (
              <HostItem
                key={e.name}
                settings={this.props.settings}
                hostItem={e}
                comment={comment}
                comment_author={comment_author}
                comment_entry_time={comment_entry_time}
              />
            );
            
          })}
        </ReactCSSTransitionGroup>
      </div>
    );
  }
}

export default HostItems;
