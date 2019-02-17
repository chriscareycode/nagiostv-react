import React, { Component } from 'react';
import './HowManyEmoji.css';

class HowMany extends Component {

  shouldComponentUpdate(nextProps, nextState) {
    //console.log('HowManyEmoji shouldComponentUpdate', nextProps, nextState);
    if (nextProps.howMany !== this.props.howMany || nextProps.howManyDown !== this.props.howManyDown || nextState.sadEmoji !== this.state.sadEmoji || nextState.happyEmoji !== this.state.happyEmoji) {
      return true;
    } else {
      return false;
    }
  }

  redEmojis = ['😡', '🌺', '💋', '🐙', '🌹', '🍉', '🍓', '🍟', '🎟', '🚒', '🥵', '🤬', '👹'];
  greenEmojis = ['🍀', '💚', '🥦', '🍏', '🥑', '♻️', '🧤', '🐸', '🐬', '🐠', '🌲', '🌴', '🥒', '🏄‍♂️'];
  intervalHandle = null;

  state = {
    sadEmoji: '',
    happyEmoji: ''
  };

  componentDidMount() {
    
    setTimeout(() => {
      this.selectEmojis();
    }, 100);

    // Randomize the emojis on some interval
    //const interv = 60 * 60 * 1000; // hour
    const interv = 60 * 1000; // 60 seconds
    this.intervalHandle = setInterval(() => {
      this.selectEmojis();
    }, interv);
  }

  componentWillUnmount() {
    clearInterval(this.intervalHandle);
  }

  selectEmojis() {
    const sadEmoji = this.redEmojis[Math.floor(Math.random() * this.redEmojis.length)];
    const happyEmoji = this.greenEmojis[Math.floor(Math.random() * this.greenEmojis.length)];

    this.setState({
      sadEmoji,
      happyEmoji
    })
  }

  render() {
    
    const howMany = this.props.howMany;
    const howManyDown = this.props.howManyDown;
    //const sadEmoji = '😡';
    //const happyEmoji = '🍀';
    //const otherEmoji = '🐟';

    const res = [...Array(howMany)].map((_, i) => {
      if (i < howManyDown) {
        return <span key={i} role="img" aria-label="item down" className="HowManyEmojiItem HowManyEmojiItemProblem">{this.state.sadEmoji}</span>;
      } else {
        return <span key={i} role="img" aria-label="item up" className="HowManyEmojiItem">{this.state.happyEmoji}</span>;
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
