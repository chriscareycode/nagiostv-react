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
