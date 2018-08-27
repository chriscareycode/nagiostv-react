import React, { Component } from 'react';
import './ServiceItem.css';
import { Transition, animated } from 'react-spring';

const defaultStyles = {
  overflow: 'hidden',
  //width: '100%',
  backgroundColor: '#111',
  padding: '10px',
  border: '2px solid yellow',
  color: 'white',
  display: 'flex',
  justifyContent: 'center',
  fontSize: '1.3em',
  margin: '5px 5px 0 5px',
  borderRadius: '10px'
}

class ServiceItem extends Component {

  render() {

    console.log('this.props.serviceProblemsArray is', this.props.serviceProblemsArray);

    //const serviceProblemsArray = this.props.serviceProblemsArray;
    console.log(Object.keys(this.props.serviceProblemsArray));

    return (
      <div className="ServiceItems">
        ServiceItems

        <Transition
          native
          keys={Object.keys(this.props.serviceProblemsArray)}
          from={{ opacity: 0, maxHeight: 0 }}
          enter={{ opacity: 1, maxHeight: 100 }}
          leave={{ opacity: 0, maxHeight: 0 }}>
          {this.props.serviceProblemsArray.map((e, i) => styles => {
            console.log('ServiceItem item');
            console.log(e, i, styles);
            //console.log(this.props.item[e]);
            //const item = this.props.item[e];

            return (
              <animated.div style={{ ...defaultStyles, ...styles }} className="ServiceItem">
              {e.host_name}
              {e.description}
              {e.plugin_output}
              Last Check: {e.last_check}
              Next Check: {e.next_check}
              </animated.div>
            );
            
          })}
        </Transition>
      </div>
    );
  }
}

export default ServiceItem;
