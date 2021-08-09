import React, { useEffect, useState } from 'react';
import $ from 'jquery';

const debug = false;
const animateSpeed = 20 * 1000;
const waitTime = 10 * 1000;
const topBuffer = 68; // height of the menu bar

const ScrollToSection = ({ settingsObject }) => {

	const scrollToNextSection = (currentSection) => {

		if (debug) console.log('scrollToNextSection() moving to', currentSection);

		/**
		 * If AboveAlertScroll is visible in the viewport then there is no reason to scroll
		 * (everything is currently visible on screen). So abort here.
		 * It might be nice to actually disable the interval timer in this case but we will go this route for now.
		 */
		const AboveAlertScrollEl = document.querySelector('.AboveAlertScroll');
		if (AboveAlertScrollEl) {
			//const yPos = AboveAlertScrollEl.offsetTop - AboveAlertScrollEl.scrollTop + AboveAlertScrollEl.clientTop;
			const yPos = AboveAlertScrollEl.offsetTop + AboveAlertScrollEl.clientTop + topBuffer;
			if (debug) console.log('scrollToNextSection() AboveAlertScrollEl', yPos, window.innerHeight);
			if (debug) console.log('scrollToNextSection() AboveAlertScrollEl2', AboveAlertScrollEl.offsetTop, AboveAlertScrollEl.scrollTop, AboveAlertScrollEl.clientTop);
			if (yPos < window.innerHeight) {
				if (debug) console.log('scrollToNextSection() isAboveAlertScroll is visible. aborting.', yPos, window.innerHeight);
				// Though we cant just abort if the alerts is on screen. I think this could cause a bug where if items resolve
				// when we are down on the page, then we will be stuck scrolled down.
				// I think in this case we should scroll to the top of the page.
				$("html, body").animate({ scrollTop: 0 }, animateSpeed);
				return;
			}
		}
		// 

		if (currentSection === 'service') {
			const sectionEl = document.querySelector('.ServiceSection');
			if (sectionEl) {
				$("html, body").animate({ scrollTop: sectionEl.offsetTop }, animateSpeed);
			}
		}

		if (currentSection === 'host') {
			const sectionEl = document.querySelector('.HostSection');
			if (debug) console.log('sectionEl', sectionEl);
			if (sectionEl) {
				$("html, body").animate({ scrollTop: sectionEl.offsetTop }, animateSpeed);
			}
		}

		if (currentSection === 'alert') {
			const sectionEl = document.querySelector('.AlertSection');
			if (sectionEl) {
				$("html, body").animate({ scrollTop: sectionEl.offsetTop }, animateSpeed);
			}
		}

		if (currentSection === 'bottom') {
			const sectionEl = document.querySelector('.BottomScroll');
			if (sectionEl) {
				// When we are scrolling to the bottom, we need to subtract the height of the page from the calculation
				// Since it's scrollTop not scrollBottom
				$("html, body").animate({ scrollTop: sectionEl.offsetTop - window.innerHeight + topBuffer }, animateSpeed);
			}
		}
	};

	const stopAllAnimation = () => {
		if (debug) console.log('stopAllAnimation');
		$("html, body").stop(true);
	};

	useEffect(() => {
		if (debug) console.log('ScrollToSection useEffect() something changed, starting over');

		// Detect which sections we have
		const sections = [];
		if (settingsObject.hideHostSection === false) { sections.push('host'); }
		if (settingsObject.hideServiceSection === false) { sections.push('service'); }
		if (settingsObject.hideHistory === false) { sections.push('alert'); }
		if (sections.length === 0) {
			// Abort if no sections are found
			if (debug) console.log('ScrollToSection useEffect() No sections visible, exiting');
			return;
		}
		
		/**
		 * service / host / alert sections can be "hidden" in settings
		 * 
		 * If we do have host or service but we do not have alert, then add a fake "bottom" section to move to.
		 * This will get the page to scroll to the bottom of the page which we want for host/service but not for alert.
		 *
		 * I'm adding an opinion here that when scrolling is enabled, we want to see all the hosts and all the services,
		 * and the top of the alerts (whatever fits on the page), but not to scroll through all the alerts.
		 * 
		 * Unless the case where alerts are visible but host and services are not visible. In this case the user is clearly
		 * interesting in seeing alerts. So in this case we will scroll to the bottom of the alerts when scrolling is enabled.
		 * For this feature we use the BottomScroll div to help out with positioning
		 * 
		 * We have a few scenarios
		 * a) All sections are visible (scroll to service, scroll to alert, scroll to host (top))
		 * b) Host or Service is visible but alert is hidden (scrollto service, scroll to bottom of service, scroll host (top))
		 *    For this scenario we use the "AboveAlertsScroll" div to help out with positioning
		 */
		if (settingsObject.hideHistory) {
			sections.push('bottom');
		}
		//console.log('ScrollToSection useEffect() Got sections', sections);

		let myCurrentIndex = 1; // start at index 1 so it starts moving right away
		let myCurrentSection = sections[myCurrentIndex]; // start with the first section we have

		scrollToNextSection(myCurrentSection);

		const handle = setInterval(() => {
			if (debug) console.log('ScrollToSection useEffect() Firing interval', new Date());
			if (myCurrentIndex >= sections.length - 1) {
				myCurrentIndex = 0; // wrap around
			} else {
				myCurrentIndex++;
			}
			if (debug) console.log('ScrollToSection useEffect() Going to index', myCurrentIndex, sections[myCurrentIndex]);
			myCurrentSection = sections[myCurrentIndex];
			scrollToNextSection(myCurrentSection);
		}, animateSpeed + waitTime);

		return () => {
			clearInterval(handle);
			stopAllAnimation();
		};
	}, []);

	return (
		<div className="ScrollToSection">
		</div>
	);
  
};

function memoFn(prev, next) {
  if (debug) console.log('ScrollToSection memoFn()', prev, next);
	const same = prev.settingsObject.hideServiceSection === next.settingsObject.hideServiceSection &&
		prev.settingsObject.hideHostSection === next.settingsObject.hideHostSection &&
		prev.settingsObject.hideHistory === next.settingsObject.hideHistory;

	if (same === false) {
		if (debug) console.log('ScrollToSection memoFn() re-rendering');
	}
  //return false; // update
	return same;
}

export default React.memo(ScrollToSection, memoFn);