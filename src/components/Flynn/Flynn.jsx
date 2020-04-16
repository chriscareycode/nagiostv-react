import React, { Component } from 'react';
import './Flynn.css';
import flynnImage from './flynn.png';
/*
 Flynn will be happy at 0 services down
 Flynn will be angry at < 4 services down
 Flynn will be bloody at >= 4 services down
*/


class Flynn extends Component {

	smileClasses = ['flynn20', 'flynn21', 'flynn22', 'flynn23'];
  happyClasses = ['flynn1', 'flynn6', 'flynn11'];
  angryClasses = ['flynn2', 'flynn3', 'flynn7', 'flynn8', 'flynn12', 'flynn13', 'flynn16', 'flynn17', 'flynn18', 'flynn19'];
  bloodyClasses = ['flynn4', 'flynn5', 'flynn9', 'flynn10', 'flynn14', 'flynn15', 'flynn24', 'flynn25'];

  timerInterval = null;

  state = {
  	howManyDown: 0
  };

  componentDidMount() {
  	this.timerInterval = setInterval(() => {
  		this.forceUpdate();
  	}, 5000);
  }

  componentWillUnmount() {
  	clearInterval(this.timerInterval);
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
  	//console.log('componentDidUpdate');
  	//console.log(prevProps);
  	if (this.state.howManyDown !== this.props.howManyDown) {
  		//console.log('setting state');
  		this.setState({ howManyDown: this.props.howManyDown });
  	}
  }

  shouldComponentUpdate() {
  	if (this.state.howManyDown !== this.props.howManyDown) {
  		return true;
  	} else {
  		return false;
  	}
  }

  render() {

  	const howManyDown = this.props.howManyDown;
  	let flynnClass = 'flynn';
		let classes = [];
		if (howManyDown === -1) {
      classes = this.smileClasses;
    } else if (howManyDown === 0) {
      classes = this.happyClasses;
    } else if (howManyDown >= this.props.flynnAngryAt && howManyDown < this.props.flynnBloodyAt) {
      classes = this.angryClasses;
    } else if (howManyDown >= this.props.flynnBloodyAt) {
      classes = this.bloodyClasses;
    } else {
      classes = this.happyClasses;
    }
    const item = classes[Math.floor(Math.random()*classes.length)];
    flynnClass = 'flynn ' + item;
  	
  	//console.log('flynnClass is ' + flynnClass + ' ' + new Date());

    const scale = 'scale(' + this.props.flynnCssScale + ')';
    
    return (
      <div className="flynn-wrap">
        <div style={{ backgroundImage: 'url(' + flynnImage + ')', transform: scale }} className={flynnClass}>
        </div>
      </div>
    );
  }
}

export default Flynn;
