import React from 'react';
import './ScrollToTop.css';

class ScrollToTop extends React.Component {

  state = {
      isAtBottom: false
  };

  componentDidMount() {
    window.addEventListener("scroll", this.handleScroll);
  }

  componentWillUnmount() {
    window.removeEventListener("scroll", this.handleScroll);
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (nextState.isAtBottom !== this.state.isAtBottom) {
      return true;
    }
    return false;
  }

  handleScroll = () => {
    const windowHeight = "innerHeight" in window ? window.innerHeight : document.documentElement.offsetHeight;
    const body = document.body;
    const html = document.documentElement;
    const docHeight = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight,  html.scrollHeight, html.offsetHeight);
    const windowBottom = windowHeight + window.pageYOffset;
    const atBottom = windowBottom >= docHeight;

    // Prevent state updates if the value is the same
    if (atBottom !== this.state.isAtBottom) {
      if (atBottom) {
        this.setState({
          isAtBottom: true
        });
      } else {
        this.setState({
          isAtBottom: false
        });
      }
    }
  };

  scrollUp = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  render() {
    return (
      <div className="ScrollToTop">
        {this.state.isAtBottom && <button onClick={this.scrollUp}>Scroll To Top</button>}
      </div>
    );
  }
}

export default ScrollToTop;