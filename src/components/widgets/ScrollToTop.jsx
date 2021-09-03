import React from 'react';
import './ScrollToTop.css';

const scrollAreaSelector = '.vertical-scroll-dash';

class ScrollToTop extends React.Component {

  state = {
      isAtBottom: false
  };

  componentDidMount() {
    const scrollDiv = document.querySelector(scrollAreaSelector);
    scrollDiv.addEventListener("scroll", this.handleScroll);
  }

  componentWillUnmount() {
    const scrollDiv = document.querySelector(scrollAreaSelector);
    scrollDiv.removeEventListener("scroll", this.handleScroll);
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (nextState.isAtBottom !== this.state.isAtBottom) {
      return true;
    }
    return false;
  }

  handleScroll = () => {
    const scrollDiv = document.querySelector(scrollAreaSelector);
    const dashboardDiv = document.querySelector('.Dashboard');
    const windowHeight = "innerHeight" in window ? window.innerHeight : document.documentElement.offsetHeight;
    //const body = document.body;
    //const html = document.documentElement;
    //const docHeight = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight,  html.scrollHeight, html.offsetHeight);
    const divHeight = Math.max(dashboardDiv.clientHeight, dashboardDiv.offsetHeight);
    const windowBottom = windowHeight + scrollDiv.scrollTop;
    // console.log('dashboardDiv.scrollTop', dashboardDiv.scrollTop);
    // console.log('dashboardDiv height', dashboardDiv.clientHeight, dashboardDiv.offsetHeight);
    // console.log('windowBottom', windowBottom);
    // console.log('divHeight', divHeight);
    const atBottom = windowBottom >= divHeight + 80;

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
    const scrollDiv = document.querySelector(scrollAreaSelector);
    scrollDiv.scrollTo({ top: 0, behavior: 'smooth' });
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