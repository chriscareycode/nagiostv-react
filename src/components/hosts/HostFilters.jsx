/**
 * NagiosTV https://nagiostv.com
 * Copyright (C) 2008-2020 Chris Carey https://chriscarey.com
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
import './HostFilters.css';
import { translate } from '../../helpers/language';
import Checkbox from '../widgets/FilterCheckbox.jsx';

class HostFilters extends Component {

  shouldComponentUpdate(nextProps, nextState) {
    //console.log('shouldComponentUpdate', nextProps, nextState);
    const propsToCauseRender = [
      'hideFilters',
      'hostSortOrder',
      'howManyHosts',
      'howManyHostDown',
      'howManyHostUnreachable',
      'howManyHostPending',
      'howManyHostAcked',
      'howManyHostScheduled',
      'howManyHostFlapping',
      'howManyHostSoft',
      'howManyHostNotificationsDisabled'
    ];
    for(let i=0;i<propsToCauseRender.length;i++) {
      if (nextProps[propsToCauseRender[i]] !== this.props[propsToCauseRender[i]]) {
        return true;
      }
    }
    return false;
  }

  render() {
    
    const language = this.props.language;
    
    const howManyHostUp = this.props.howManyHosts - this.props.howManyHostDown - this.props.howManyHostUnreachable;

    return (
      <>

        {!this.props.hideFilters && <select value={this.props.hostSortOrder} varname={'hostSortOrder'} onChange={this.props.handleSelectChange}>
          <option value="newest">{translate('newest first', language)}</option>
          <option value="oldest">{translate('oldest first', language)}</option>
        </select>}

        {(this.props.howManyHostDown !== 9) && <span>
          &nbsp;
          <span className="filter-ok-label filter-ok-label-green"><strong>{howManyHostUp}</strong> UP</span>
        </span>}

        {(!this.props.hideFilters || this.props.howManyHostDown !== 0) && <span>
          &nbsp;
          <Checkbox
            filterName="down"
            hideFilters={this.props.hideFilters}
            handleCheckboxChange={this.props.handleCheckboxChange}
            stateName={'hideHostDown'}
            defaultChecked={!this.props.settingsObject.hideHostDown}
            howMany={this.props.howManyHostDown}
            howManyText={translate('down', language)}
          />
        </span>}

        {(!this.props.hideFilters || this.props.howManyHostUnreachable !== 0) && <span>
          &nbsp;
          <Checkbox
            filterName="unreachable"
            hideFilters={this.props.hideFilters}
            handleCheckboxChange={this.props.handleCheckboxChange}
            stateName={'hideHostUnreachable'}
            defaultChecked={!this.props.settingsObject.hideHostUnreachable}
            howMany={this.props.howManyHostUnreachable}
            howManyText={translate('unreachable', language)}
          />
        </span>}

        {(!this.props.hideFilters || this.props.howManyHostPending !== 0) && <span>
          &nbsp;
          <Checkbox
            filterName="pending"
            hideFilters={this.props.hideFilters}
            handleCheckboxChange={this.props.handleCheckboxChange}
            stateName={'hideHostPending'}
            defaultChecked={!this.props.settingsObject.hideHostPending}
            howMany={this.props.howManyHostPending}
            howManyText={translate('pending', language)}
          />
        </span>}

        {(!this.props.hideFilters || this.props.howManyHostAcked !== 0) && <span>
          &nbsp;
          <Checkbox
            filterName="acked"
            hideFilters={this.props.hideFilters}
            handleCheckboxChange={this.props.handleCheckboxChange}
            stateName={'hideHostAcked'}
            defaultChecked={!this.props.settingsObject.hideHostAcked}
            howMany={this.props.howManyHostAcked}
            howManyText={translate('acked', language)}
          />
        </span>}

        {(!this.props.hideFilters || this.props.howManyHostScheduled !== 0) && <span>
          &nbsp;
          <Checkbox
            filterName="scheduled"
            hideFilters={this.props.hideFilters}
            handleCheckboxChange={this.props.handleCheckboxChange}
            stateName={'hideHostScheduled'}
            defaultChecked={!this.props.settingsObject.hideHostScheduled}
            howMany={this.props.howManyHostScheduled}
            howManyText={translate('scheduled', language)}
          />
        </span>}

        {(!this.props.hideFilters || this.props.howManyHostFlapping !== 0) && <span>
          &nbsp;
          <Checkbox
            filterName="flapping"
            hideFilters={this.props.hideFilters}
            handleCheckboxChange={this.props.handleCheckboxChange}
            stateName={'hideHostFlapping'}
            defaultChecked={!this.props.settingsObject.hideHostFlapping}
            howMany={this.props.howManyHostFlapping}
            howManyText={translate('flapping', language)}
          />
        </span>}

        {(!this.props.hideFilters || this.props.howManyHostSoft !== 0) && <span>
          &nbsp;
          <Checkbox
            filterName="soft"
            hideFilters={this.props.hideFilters}
            handleCheckboxChange={this.props.handleCheckboxChange}
            stateName={'hideHostSoft'}
            defaultChecked={!this.props.settingsObject.hideHostSoft}
            howMany={this.props.howManyHostSoft}
            howManyText={translate('soft', language)}
          />
        </span>}

        {(!this.props.hideFilters || this.props.howManyHostNotificationsDisabled !== 0) && <span>
          &nbsp;
          <Checkbox
            filterName="notifications_disabled"
            hideFilters={this.props.hideFilters}
            handleCheckboxChange={this.props.handleCheckboxChange}
            stateName={'hideHostNotificationsDisabled'}
            defaultChecked={!this.props.settingsObject.hideHostNotificationsDisabled}
            howMany={this.props.howManyHostNotificationsDisabled}
            howManyText={translate('notifications disabled', language)}
          />
        </span>}

      </>
    );
  }
}

export default HostFilters;
