import React, { Component } from 'react';
import './CustomLogo.css';

class CustomLogo extends Component {

  shouldComponentUpdate(nextProps, nextState) {
    //console.log('shouldComponentUpdate', nextProps, nextState);
    if (nextProps.settings.customLogoEnabled !== this.props.settings.customLogoEnabled || nextProps.settings.customLogoUrl !== this.props.settings.customLogoUrl) {
      return true;
    } else {
      return false;
    }
  }

  render() {
    return (
      <div className="CustomLogo">
        <img alt="custom logo" src={this.props.settings.customLogoUrl} />
      </div>
    );
  }
}

export default CustomLogo;
