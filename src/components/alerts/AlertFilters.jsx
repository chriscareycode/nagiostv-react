/**
 * NagiosTV https://nagiostv.com
 * Copyright (C) 2008-2020 Chris Carey https://chriscarey.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
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
import './AlertFilters.css';
import { translate } from '../../helpers/language';
import Checkbox from '../widgets/FilterCheckbox.jsx';

class AlertFilters extends Component {

  shouldComponentUpdate(nextProps, nextState) {
    const propsToCauseRender = [
      'hideFilters',
      'hideAlertSoft',
      'howManyAlertSoft'
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

    return (
      <>

        <span className="filter-ok-label filter-ok-label-gray"><strong>{this.props.howManyAlerts}</strong> Alerts</span>

        {(!this.props.hideFilters || this.props.howManyAlertSoft !== 0) && <span>
          &nbsp;
          <Checkbox
            filterName="soft"
            hideFilters={this.props.hideFilters}
            handleCheckboxChange={this.props.handleCheckboxChange}
            stateName={'hideAlertSoft'}
            defaultChecked={!this.props.hideAlertSoft}
            howMany={this.props.howManyAlertSoft}
            howManyText={translate('soft', language)}
          />
        </span>}
      </>
    );
  }
}

export default AlertFilters;
