import { useEffect, useState } from 'react';
import debounce from 'lodash/debounce';
import './ScrollToTop.css';

const scrollAreaSelector = '.vertical-scroll-dash';

const ScrollToTop = () => {
	const [isAtBottom, setIsAtBottom] = useState(false);

	useEffect(() => {
		const scrollDiv = document.querySelector(scrollAreaSelector);
		if (!scrollDiv) {
			return;
		}

		const handleScroll = () => {
			const dashboardDiv = document.querySelector('.Dashboard') as HTMLElement;

			if (!dashboardDiv) {
				return;
			}

			const windowHeight = "innerHeight" in window ? window.innerHeight : document.documentElement.offsetHeight;
			const divHeight = Math.max(dashboardDiv.clientHeight, dashboardDiv.offsetHeight);
			const windowBottom = windowHeight + scrollDiv.scrollTop;
			const atBottom = windowBottom >= divHeight + 80;

			setIsAtBottom(atBottom);
		};

		const debouncedScroll = debounce(handleScroll, 500);
		scrollDiv.addEventListener("scroll", debouncedScroll);

		return () => {
			scrollDiv.removeEventListener("scroll", debouncedScroll);
			debouncedScroll.cancel();
		};
	}, []);

	const scrollUp = () => {
		const scrollDiv = document.querySelector(scrollAreaSelector);
		if (scrollDiv) {
			scrollDiv.scrollTo({ top: 0, behavior: 'smooth' });
		}
	};

	return (
		<div className="ScrollToTop">
			{isAtBottom && <button onClick={scrollUp}>Scroll To Top</button>}
		</div>
	);
};

export default ScrollToTop;
