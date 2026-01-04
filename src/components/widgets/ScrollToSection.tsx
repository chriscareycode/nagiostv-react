import React, { useEffect, useState, useRef } from 'react';
import { ClientSettings } from 'types/settings';

const debug = false;
const topBuffer = 0; // height of the menu bar
const sectionBufferSubtract = 15;
const scrollAreaSelector = '.vertical-scroll-dash';

interface ScrollToSectionProps {
	clientSettings: ClientSettings;
}

const ScrollToSection = ({ clientSettings }: ScrollToSectionProps) => {
	const animationFrameIdRef = useRef<number | null>(null);

	const getScrollAreaElement = () => document.querySelector<HTMLElement>(scrollAreaSelector);

	const smoothScrollTo = (element: HTMLElement, to: number, duration: number) => {
		if (animationFrameIdRef.current) {
			cancelAnimationFrame(animationFrameIdRef.current);
		}

		if (duration <= 0) {
			element.scrollTop = to;
			animationFrameIdRef.current = null;
			return;
		}

		const start = element.scrollTop;
		const change = to - start;
		const startTime = performance.now();

		const animateScroll = (timestamp: number) => {
			const currentTime = timestamp;
			let elapsedTime = currentTime - startTime;
			elapsedTime = Math.min(elapsedTime, duration); // Cap elapsedTime at duration

			// Linear easing
			const newScrollTop = start + change * (elapsedTime / duration);
			element.scrollTop = newScrollTop;

			if (elapsedTime < duration) {
				animationFrameIdRef.current = requestAnimationFrame(animateScroll);
			} else {
				animationFrameIdRef.current = null; // Animation finished
			}
		};

		animationFrameIdRef.current = requestAnimationFrame(animateScroll);
	};

	const scrollToNextSection = (currentSection: string, animateSpeed: number) => {
		const scrollAreaElement = getScrollAreaElement();
		if (!scrollAreaElement) return;

		if (debug) console.log('ScrollToSection() scrollToNextSection() moving to', currentSection, animateSpeed);
		/**
		 * If AboveAlertScroll is visible in the viewport then there is no reason to scroll
		 * (everything is currently visible on screen). So abort here.
		 * It might be nice to actually disable the interval timer in this case but we will go this route for now.
		 */
		const AboveAlertScrollEl = document.querySelector('.AboveAlertScroll') as HTMLElement;
		if (AboveAlertScrollEl) {
			//const yPos = AboveAlertScrollEl.offsetTop - AboveAlertScrollEl.scrollTop + AboveAlertScrollEl.clientTop;
			const yPos = AboveAlertScrollEl.offsetTop + AboveAlertScrollEl.clientTop + topBuffer;
			//if (debug) console.log('ScrollToSection() scrollToNextSection() AboveAlertScrollEl', yPos, window.innerHeight);
			//if (debug) console.log('ScrollToSection() scrollToNextSection() AboveAlertScrollEl2', AboveAlertScrollEl.offsetTop, AboveAlertScrollEl.scrollTop, AboveAlertScrollEl.clientTop);
			if (yPos < window.innerHeight) {
				if (debug) console.log('ScrollToSection() scrollToNextSection() isAboveAlertScroll is visible. aborting scroll.', yPos, window.innerHeight, scrollAreaElement?.scrollTop);
				// Though we cant just abort if the alerts is on screen. I think this could cause a bug where if items resolve
				// when we are down on the page, then we will be stuck scrolled down.
				// I think in this case we should scroll to the top of the page.

				// If we are already not at the top, then move to the top

				if (scrollAreaElement.scrollTop > 0) {
					if (debug) console.log('ScrollToSection() scrollToNextSection() isAboveAlertScroll is visible. scrolling to top', scrollAreaElement.scrollTop);
					smoothScrollTo(scrollAreaElement, 0, animateSpeed);
				}
				return;
			}
		}

		if (currentSection === 'top') {
			smoothScrollTo(scrollAreaElement, 0, animateSpeed);
		}

		if (currentSection === 'host') {
			const sectionEl = document.querySelector<HTMLElement>('.HostSection');
			//if (debug) console.log('sectionEl', sectionEl);
			if (sectionEl) {
				smoothScrollTo(scrollAreaElement, sectionEl.offsetTop, animateSpeed);
			}
		}

		if (currentSection === 'service') {
			const sectionEl = document.querySelector<HTMLElement>('.ServiceSection');
			if (sectionEl) {
				smoothScrollTo(scrollAreaElement, sectionEl.offsetTop, animateSpeed);
			}
		}

		if (currentSection === 'above-alert') {
			const sectionEl = document.querySelector<HTMLElement>('.AboveAlertScroll');
			if (sectionEl) {
				smoothScrollTo(scrollAreaElement, sectionEl.offsetTop - window.innerHeight - 60, animateSpeed);
			}
		}

		if (currentSection === 'alert') {
			const sectionEl = document.querySelector<HTMLElement>('.AlertSection');
			if (sectionEl) {
				smoothScrollTo(scrollAreaElement, sectionEl.offsetTop - sectionBufferSubtract, animateSpeed);
			}
		}

		if (currentSection === 'bottom') {
			const sectionEl = document.querySelector<HTMLElement>('.BottomScroll');
			if (sectionEl) {
				// When we are scrolling to the bottom, we need to subtract the height of the page from the calculation
				// Since it's scrollTop not scrollBottom
				smoothScrollTo(scrollAreaElement, sectionEl.offsetTop - window.innerHeight + topBuffer, animateSpeed);
			}
		}
	};

	const stopAllAnimation = () => {
		if (debug) console.log('ScrollToSection() stopAllAnimation');
		if (animationFrameIdRef.current) {
			cancelAnimationFrame(animationFrameIdRef.current);
			animationFrameIdRef.current = null;
		}
	};

	const [currentIndex, setCurrentIndex] = useState(1);

	useEffect(() => {
		if (debug) console.log('ScrollToSection() useEffect() mount/unmount');
		return () => {
			stopAllAnimation();
		};
	}, []);

	useEffect(() => {
		if (debug) console.log('ScrollToSection() useEffect() trigger. Multiplier', clientSettings.automaticScrollTimeMultiplier);

		const waitTime = clientSettings.automaticScrollWaitSeconds * 1000;

		// Detect which sections we have
		const sections: string[] = [];

		// stop at top
		sections.push('top');

		// stop at host (disabled)
		//if (clientSettings.hideHostSection === false) { sections.push('host'); }
		
		// stop above service (disabled)
		//if (clientSettings.hideServiceSection === false) { sections.push('service'); }

		// stop below host and service.
		// this is above the charts as well, as they are part of the alerts section
		if (clientSettings.hideServiceSection === false) { sections.push('above-alert'); }

		// stop at the top of alert
		if (clientSettings.hideHistory === false) { sections.push('alert'); }
		
		if (sections.length === 0) {
			// Abort if no sections are found
			if (debug) console.log('ScrollToSection() useEffect() No sections visible, exiting');
			return;
		}
		// if (clientSettings.hideHistory) {
		// 	sections.push('bottom');
		// }

		if (debug) { console.log('ScrollToSection useEffect() Got sections', sections); }

		let myCurrentSection = sections[currentIndex]; // start with the first section we have
		if (debug) console.log('ScrollToSection() myCurrentSection', myCurrentSection);

		// Determine how many items are down. We want to use Recoil for this in the future but for now will use DOM as a hack
		const hostItemsWrapEl = document.querySelector('.host-items-wrap');
		const serviceItemsWrapEl = document.querySelector('.service-items-wrap');
		let howManyHostDown = 0;
		let howManyServiceDown = 0;
		if (hostItemsWrapEl) {
			howManyHostDown = hostItemsWrapEl.childNodes.length;
		}
		if (serviceItemsWrapEl) {
			howManyServiceDown = serviceItemsWrapEl.childNodes.length;
		}

		// If there are 0 hosts and 0 services down, then we should just scroll to the top.
		// This happens naturally with how the code is written at this time.
		// If this condition is true, we don't want to simply exit the routine here,
		// since we may encounter this condition when the page is currently scrolled down.

		if (debug) console.log('ScrollToSection() how many', howManyHostDown, howManyServiceDown);

		const defaultAnimateSpeed = 4 * 1000; // default to 4s (before multiplier)
		let animateSpeed = defaultAnimateSpeed;
		let delayBeforeNextAnimation = animateSpeed + waitTime; // default to 5s
		
		if (myCurrentSection === 'top') {
			animateSpeed = (howManyHostDown + howManyServiceDown) * 1000;
		}
		// for each host and service, start with 1s per item
		if (myCurrentSection === 'host') {
			animateSpeed = (howManyHostDown + howManyServiceDown) * 1000;
		}
		if (myCurrentSection === 'service') {
			animateSpeed = howManyHostDown * 1000;
		}
		if (myCurrentSection === 'above-alert') {
			animateSpeed = howManyServiceDown * 1000;
			delayBeforeNextAnimation = animateSpeed + (2 * 1000); // a shorter delay after this one, 2s instead of 5s
		}
		if (myCurrentSection === 'alert') {
			animateSpeed = (howManyHostDown + howManyServiceDown) * 1000;
		}
		if (animateSpeed <= defaultAnimateSpeed) {
			// fallback and safety net to 1s if we have a value too small
			animateSpeed = defaultAnimateSpeed * clientSettings.automaticScrollTimeMultiplier;
		} else {
			// add a multiplier to change the overall speed
			animateSpeed = animateSpeed * clientSettings.automaticScrollTimeMultiplier;
		}

		// fallback and safety net to 1s if we have a value too small
		// this will happen a lot since if there are 0 hosts down and 0 series down, then the animateSpeed will be 0
		if (animateSpeed <= 0) {
			animateSpeed = defaultAnimateSpeed * clientSettings.automaticScrollTimeMultiplier;
		}

		// scroll to the next section		
		scrollToNextSection(myCurrentSection, animateSpeed);

		// Trigger the next one to run by setting the next index after a wait delay that is longer than the animation delay
		if (debug) console.log('ScrollToSection() starting setTimeout', animateSpeed + waitTime);
		let handle = setTimeout(() => {
			if (debug) console.log('ScrollToSection() running trigger - index', currentIndex);
			
			setCurrentIndex(curr => {
				if (debug) console.log('ScrollToSection() curr sections.length', curr, sections.length);
				if (curr >= sections.length - 1) {
					return 0;
				} else {
					return curr + 1;
				}
			});
			
		}, animateSpeed + waitTime);

		// Cleanup
		return () => {
			clearTimeout(handle);
		};
	}, [clientSettings, currentIndex, setCurrentIndex]);

	return (
		<div className="ScrollToSection">
		</div>
	);
  
};

function arePropsEqual(prev: ScrollToSectionProps, next: ScrollToSectionProps) {
  if (debug) console.log('ScrollToSection() arePropsEqual()', prev, next);
	const same = prev.clientSettings.hideServiceSection === next.clientSettings.hideServiceSection &&
		prev.clientSettings.hideHostSection === next.clientSettings.hideHostSection &&
		prev.clientSettings.hideHistory === next.clientSettings.hideHistory;

	if (same === false) {
		if (debug) console.log('ScrollToSection() arePropsEqual() re-rendering');
	}
  //return false; // update
	return same;
}

export default React.memo(ScrollToSection, arePropsEqual);