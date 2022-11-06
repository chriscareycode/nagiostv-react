import React, { useEffect, useState } from 'react';
import $ from 'jquery';

const debug = false;
const waitTime = 10 * 1000; // would be nice to be user adjustable
const topBuffer = 0; // height of the menu bar
const sectionBufferSubtract = 15;
const scrollAreaSelector = '.vertical-scroll-dash';

const ScrollToSection = ({ settingsObject, automaticScrollTimeMultiplier }) => {

	const scrollAreaElement = document.querySelector<HTMLElement>(scrollAreaSelector);

	const scrollToNextSection = (currentSection, animateSpeed) => {

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
			if (debug) console.log('ScrollToSection() scrollToNextSection() AboveAlertScrollEl', yPos, window.innerHeight);
			if (debug) console.log('ScrollToSection() scrollToNextSection() AboveAlertScrollEl2', AboveAlertScrollEl.offsetTop, AboveAlertScrollEl.scrollTop, AboveAlertScrollEl.clientTop);
			if (yPos < window.innerHeight) {
				if (debug) console.log('ScrollToSection() scrollToNextSection() isAboveAlertScroll is visible. aborting scroll.', yPos, window.innerHeight, scrollAreaElement?.scrollTop);
				// Though we cant just abort if the alerts is on screen. I think this could cause a bug where if items resolve
				// when we are down on the page, then we will be stuck scrolled down.
				// I think in this case we should scroll to the top of the page.

				// If we are already not at the top, then move to the top

				if (scrollAreaElement && scrollAreaElement.scrollTop > 0) {
					if (debug) console.log('ScrollToSection() scrollToNextSection() isAboveAlertScroll is visible. scrolling to top', scrollAreaElement.scrollTop);
					$(scrollAreaSelector).animate({ scrollTop: 0 }, animateSpeed);
				}
				return;
			}
		}

		if (currentSection === 'top') {
			$(scrollAreaSelector)?.animate({ scrollTop: 0 }, animateSpeed);
		}

		if (currentSection === 'host') {
			const sectionEl = document.querySelector<HTMLElement>('.HostSection');
			//if (debug) console.log('sectionEl', sectionEl);
			if (sectionEl) {
				$(scrollAreaSelector).animate({ scrollTop: sectionEl.offsetTop }, animateSpeed);
			}
		}

		if (currentSection === 'service') {
			const sectionEl = document.querySelector<HTMLElement>('.ServiceSection');
			if (sectionEl) {
				$(scrollAreaSelector).animate({ scrollTop: sectionEl.offsetTop }, animateSpeed);
			}
		}

		if (currentSection === 'above-alert') {
			const sectionEl = document.querySelector<HTMLElement>('.AboveAlertScroll');
			if (sectionEl) {
				$(scrollAreaSelector).animate({ scrollTop: sectionEl.offsetTop - window.innerHeight + topBuffer }, animateSpeed);
			}
		}

		if (currentSection === 'alert') {
			const sectionEl = document.querySelector<HTMLElement>('.AlertSection');
			if (sectionEl) {
				$(scrollAreaSelector).animate({ scrollTop: sectionEl.offsetTop - sectionBufferSubtract }, animateSpeed);
			}
		}

		if (currentSection === 'bottom') {
			const sectionEl = document.querySelector<HTMLElement>('.BottomScroll');
			if (sectionEl) {
				// When we are scrolling to the bottom, we need to subtract the height of the page from the calculation
				// Since it's scrollTop not scrollBottom
				$(scrollAreaSelector).animate({ scrollTop: sectionEl.offsetTop - window.innerHeight + topBuffer }, animateSpeed);
			}
		}
	};

	const stopAllAnimation = () => {
		if (debug) console.log('ScrollToSection() stopAllAnimation');
		if (scrollAreaElement) {
			$(scrollAreaSelector).stop(true);
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
		if (debug) console.log('ScrollToSection() useEffect() trigger. Multiplier', automaticScrollTimeMultiplier);

		// Detect which sections we have
		const sections: string[] = [];
		sections.push('top');
		//if (settingsObject.hideHostSection === false) { sections.push('host'); }
		//if (settingsObject.hideServiceSection === false) { sections.push('service'); }
		//if (settingsObject.hideServiceSection === false) { sections.push('above-alert'); }
		if (settingsObject.hideHistory === false) { sections.push('alert'); }
		if (sections.length === 0) {
			// Abort if no sections are found
			if (debug) console.log('ScrollToSection() useEffect() No sections visible, exiting');
			return;
		}
		if (settingsObject.hideHistory) {
			sections.push('bottom');
		}
		//console.log('ScrollToSection useEffect() Got sections', sections);

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
			animateSpeed = defaultAnimateSpeed * automaticScrollTimeMultiplier; // fallback and safety net to 1s if we have a value too small
		} else {
			// add a multiplier to change the overall speed
			animateSpeed = animateSpeed * automaticScrollTimeMultiplier;
		}

		if (animateSpeed <= 0) {
			animateSpeed = defaultAnimateSpeed * automaticScrollTimeMultiplier; // fallback and safety net to 1s if we have a value too small
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
	}, [currentIndex, setCurrentIndex]);

	return (
		<div className="ScrollToSection">
		</div>
	);
  
};

function memoFn(prev, next) {
  if (debug) console.log('ScrollToSection() memoFn()', prev, next);
	const same = prev.settingsObject.hideServiceSection === next.settingsObject.hideServiceSection &&
		prev.settingsObject.hideHostSection === next.settingsObject.hideHostSection &&
		prev.settingsObject.hideHistory === next.settingsObject.hideHistory;

	if (same === false) {
		if (debug) console.log('ScrollToSection() memoFn() re-rendering');
	}
  //return false; // update
	return same;
}

export default React.memo(ScrollToSection, memoFn);