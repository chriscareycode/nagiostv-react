/**
 * NagiosTV https://nagiostv.com
 * Copyright (C) 2008-2021 Chris Carey https://chriscarey.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import React, { Component } from 'react';
import { translate } from '../../helpers/language';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import HostItem from './HostItem';

// icons
//import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
//import { faSun } from '@fortawesome/free-solid-svg-icons';

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
      if (this.props.settings.hideHostSoft) {
        if (item.state_type === 0) { return false; }
      }
      if (this.props.settings.hideHostNotificationsDisabled) {
        if (item.notifications_enabled === false) { return false; }
      }
      return true;
    });

    const howManyHidden = this.props.hostProblemsArray.length - filteredHostProblemsArray.length;
    const showSomeDownItems = this.props.hostProblemsArray.length > 0 && filteredHostProblemsArray.length === 0;
    const { language } = this.props.settings;

    return (
      <div className="HostItems ServiceItems">

        <div className={`all-ok-item ${this.props.hostProblemsArray.length === 0 ? 'visible' : 'hidden'}`}>
          <span style={{ margin: '5px 10px' }} className="margin-left-10 display-inline-block color-green">{translate('All', language)} {this.props.howManyHosts} {translate('hosts are UP', language)}</span>{' '}
        </div>

        <div className={`some-down-items ${showSomeDownItems ? 'visible' : 'hidden'}`}>
          <div>
            <span className="display-inline-block color-green" style={{ marginRight: '10px' }}>{this.props.howManyHosts - this.props.hostProblemsArray.length} of {this.props.howManyHosts} {translate('hosts are UP', language)}</span>{' '}
            <span className="some-down-hidden-text">({howManyHidden} hidden)</span>
          </div>
        </div>

        <TransitionGroup>
          {filteredHostProblemsArray.map((e, i) => {
            //console.log('HostItem item');
            //console.log(e, i);

            // find comment for this hostitem
            const commentlist = this.props.commentlist;
            const comments = [];
            Object.keys(commentlist).forEach((id) => {
              if (commentlist[id].comment_type === 1 && e.name === commentlist[id].host_name) {
                comments.push(commentlist[id]);
              }
            });

            return (
              <CSSTransition
                key={`host-${e.name}`}
                classNames="example"
                timeout={{ enter: 500, exit: 500 }}
                unmountOnExit
              >
                <HostItem
                  settings={this.props.settings}
                  hostItem={e}
                  comments={comments}
                />
              </CSSTransition>
            );
            
          })}
        </TransitionGroup>
      </div>
    );
  }
}

export default HostItems;
