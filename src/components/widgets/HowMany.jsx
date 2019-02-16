import React, { Component } from 'react';
import './HowMany.css';

class HowMany extends Component {

  shouldComponentUpdate(nextProps, nextState) {
    //console.log('shouldComponentUpdate', nextProps, nextState);
    if (nextProps.howMany !== this.props.howMany || nextProps.howManyDown !== this.props.howManyDown) {
      return true;
    } else {
      return false;
    }
  }

  render() {
    
    const howMany = this.props.howMany;
    const howManyDown = this.props.howManyDown;

    const res = [...Array(howMany)].map((_, i) => {
      if (i < howManyDown) {
        return <span key={i} className="HowManyItem HowManyItemProblem"></span>;
      } else {
        return <span key={i} className="HowManyItem"></span>;
      }
    });

    return (
      <React.Fragment>
        {res}
      </React.Fragment>
    );
  }
}

export default HowMany;
