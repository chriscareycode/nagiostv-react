import React, { Component } from 'react';
import { translate } from '../../helpers/language';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import ServiceItem from './ServiceItem';

// icons
//import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
//import { faSun } from '@fortawesome/free-solid-svg-icons';

// css
import './ServiceItems.css';

class ServiceItems extends Component {

  render() {

    //console.log('this.props.serviceProblemsArray is', this.props.serviceProblemsArray);
    //console.log(Object.keys(this.props.serviceProblemsArray));
    
    const filteredServiceProblemsArray = this.props.serviceProblemsArray.filter(item => {
      if (this.props.settings.hideServicePending) {
        if (item.status === 1) { return false; }
      }
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
      if (this.props.settings.hideServiceSoft) {
        if (item.state_type === 0) { return false; }
      }
      return true;
    });

    const howManyHidden = this.props.serviceProblemsArray.length - filteredServiceProblemsArray.length;
    const showSomeDownItems = this.props.serviceProblemsArray.length > 0 && filteredServiceProblemsArray.length === 0;
    const { language } = this.props.settings;

    return (
      <div className="ServiceItems">

        {!this.props.servicelistError && <div className={`all-ok-item ${this.props.serviceProblemsArray.length === 0 ? 'visible' : 'hidden'}`}>
          <span style={{ margin: '5px 10px' }} className="margin-left-10 display-inline-block color-green">{translate('All', language)} {this.props.howManyServices} {translate('services are OK', language)}</span>{' '}
        </div>}

        <div className={`some-down-items ${showSomeDownItems ? 'visible' : 'hidden'}`}>
          <div>
            <span className="display-inline-block color-green" style={{ marginRight: '10px' }}>{this.props.howManyServices - this.props.serviceProblemsArray.length} of {this.props.howManyServices} {translate('services are OK', language)}</span>{' '}
            <span className="some-down-hidden-text">({howManyHidden} hidden)</span>
          </div>
        </div>

        <TransitionGroup>

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

              <CSSTransition
                key={e.host_name + '-' + e.description}
                classNames="example"
                timeout={{ enter: 500, exit: 500 }}
              >
                <ServiceItem
                  settings={this.props.settings}
                  serviceItem={e}
                  comment={comment}
                  comment_author={comment_author}
                  comment_entry_time={comment_entry_time}
                />
              </CSSTransition>
              
            );
            
          })}
        </TransitionGroup>
      </div>
    );
  }
}

export default ServiceItems;
