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
  yellowEmojis = ['📒', '😳', '😲', '🤯'];
  greenEmojis = ['🍀', '💚', '🥦', '🍏', '🥑', '♻️', '🐢', '🐸', '🔋', '📗', '🌲', '🌴', '🥒', '🏄‍♂️'];
  intervalHandle = null;

  state = {
    redEmoji: '',
    yellowEmoji: '',
    redEmoji: ''
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
    const redEmoji = this.redEmojis[Math.floor(Math.random() * this.redEmojis.length)];
    const yellowEmoji = this.yellowEmojis[Math.floor(Math.random() * this.yellowEmojis.length)];
    const greenEmoji = this.greenEmojis[Math.floor(Math.random() * this.greenEmojis.length)];

    this.setState({
      redEmoji,
      yellowEmoji,
      greenEmoji
    })
  }

  render() {
    
    //const howMany = this.props.howMany;
    //const howManyDown = this.props.howManyDown;

    const res = [...Array(this.props.howMany)].map((_, i) => {
      if (i < this.props.howManyCritical) {
        return <span key={i} role="img" aria-label="item down" className="HowManyEmojiItem HowManyEmojiItemProblem">{this.state.redEmoji}</span>;
      } else if (i < this.props.howManyWarning) {
        return <span key={i} role="img" aria-label="item down" className="HowManyEmojiItem HowManyEmojiItemProblem">{this.state.yellowEmoji}</span>;
      } else {
        return <span key={i} role="img" aria-label="item up" className="HowManyEmojiItem">{this.state.greenEmoji}</span>;
      }
    });

    return (
      <span className="HowManyEmojiWrap">
        {res}
      </span>
    );
  }
}

export default HowMany;
