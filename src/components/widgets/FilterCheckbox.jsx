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
import './FilterCheckbox.css';

class FilterCheckbox extends Component {

  // shouldComponentUpdate(nextProps, nextState) {
  //   //console.log('shouldComponentUpdate', nextProps, nextState);
  //   if (nextProps.nowtime !== this.props.nowtime || nextProps.prevtime !== this.props.prevtime) {
  //     return true;
  //   } else {
  //     return false;
  //   }
  // }

  clicky = e => {
    this.props.handleCheckboxChange(e, this.props.stateName, 'checkbox');
  };

  render() {
    
    let classN = 'Checkbox uppercase ' + this.props.filterName;
    //if (this.props.howMany) { classN += ' dim'; }
    if (this.props.hideFilters) { classN += ' checkbox-hidden'; }

    return (
      <label className={classN} onClick={this.clicky}>
        <span>
          <input type="checkbox" defaultChecked={this.props.defaultChecked}  />
          <span className={'checkbox-value'}>{this.props.howMany}</span> <span className={this.props.textClassName}>{this.props.howManyText}</span>
        </span>
      </label>
    );
  }
}

export default FilterCheckbox;
