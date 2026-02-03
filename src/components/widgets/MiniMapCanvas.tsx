import { snapdom } from "@zumer/snapdom";
import { useCallback, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import './MiniMapCanvas.css';
import { hostAtom, hostHowManyAtom } from 'atoms/hostAtom';
import { serviceAtom, serviceHowManyAtom } from 'atoms/serviceAtom';
import { clientSettingsAtom } from 'atoms/settingsState';
import { useAtomValue } from 'jotai';

interface MiniMapCanvasProps {
	elementToSnapshot: string;
	miniMapWidth: number;
}

// Fallback interval - only used when nothing else triggers a snapshot
const fallbackRefreshSeconds = 1 * 60; // 1 minute(s)

export default function MiniMapCanvas({
	elementToSnapshot,
	miniMapWidth,
}: MiniMapCanvasProps) {

	const hostState = useAtomValue(hostAtom);
	const serviceState = useAtomValue(serviceAtom);
	const hostHowMany = useAtomValue(hostHowManyAtom);
	const serviceHowMany = useAtomValue(serviceHowManyAtom);
	const clientSettings = useAtomValue(clientSettingsAtom);
	
	// Use ref to store the last scroll position to avoid rapid fire with same value
	const scrollToYLastNumberRef = useRef<number>(0);
	// Track route changes to trigger minimap updates
	const location = useLocation();

	// The function that uses SnapDOM to take a snapshot of the area
	const snap = async () => {
		const myElement: HTMLElement | null = document.querySelector(elementToSnapshot);
		if (!myElement) {
			return;
		}
		
		try {
			const result = await snapdom(myElement, {
				scale: 0.25,
				backgroundColor: '#111111',
				fast: true,
				cache: 'soft',
			});
			const mmi = document.querySelector('#mmimg') as HTMLImageElement | null;
			if (mmi) {
				// Use the SVG data URL directly for best performance
				mmi.src = result.url;
			}
		} catch (err) {
			console.log('error doing snapdom', err);
		}
	};

	// Trigger an update right after host or service updates are fetched
	useEffect(() => {
		const th = setTimeout(() => {
			snap();
		}, 500);
		return () => {
			clearTimeout(th);
		};
	}, [hostState.lastUpdate, serviceState.lastUpdate]);

	// Trigger snapshot when host/service counts change (affects items displayed)
	const triggerAfterHowManyMs = 1000;
	useEffect(() => {
		const th = setTimeout(() => {
			snap();
		}, triggerAfterHowManyMs);
		return () => {
			clearTimeout(th);
		};
	}, [
		hostHowMany.howManyHosts,
		hostHowMany.howManyHostDown,
		hostHowMany.howManyHostUnreachable,
		hostHowMany.howManyHostPending,
		hostHowMany.howManyHostAcked,
		hostHowMany.howManyHostScheduled,
		hostHowMany.howManyHostFlapping,
		serviceHowMany.howManyServices,
		serviceHowMany.howManyServiceWarning,
		serviceHowMany.howManyServiceUnknown,
		serviceHowMany.howManyServiceCritical,
		serviceHowMany.howManyServicePending,
		serviceHowMany.howManyServiceAcked,
		serviceHowMany.howManyServiceScheduled,
		serviceHowMany.howManyServiceFlapping,
	]);

	// Trigger snapshot when filter settings change (affects items displayed)
	useEffect(() => {
		const th = setTimeout(() => {
			snap();
		}, 500);
		return () => {
			clearTimeout(th);
		};
	}, [
		clientSettings.hideHostPending,
		clientSettings.hideHostUp,
		clientSettings.hideHostDown,
		clientSettings.hideHostUnreachable,
		clientSettings.hideHostAcked,
		clientSettings.hideHostScheduled,
		clientSettings.hideHostFlapping,
		clientSettings.hideHostSoft,
		clientSettings.hideHostNotificationsDisabled,
		clientSettings.hideServicePending,
		clientSettings.hideServiceOk,
		clientSettings.hideServiceWarning,
		clientSettings.hideServiceUnknown,
		clientSettings.hideServiceCritical,
		clientSettings.hideServiceAcked,
		clientSettings.hideServiceScheduled,
		clientSettings.hideServiceFlapping,
		clientSettings.hideServiceSoft,
		clientSettings.hideServiceNotificationsDisabled,
		clientSettings.hostgroupFilter,
		clientSettings.servicegroupFilter,
	]);

	// This useEffect handles setting up fallback interval for taking snapshots
	// This runs infrequently since snapshots are triggered by data/filter changes above
	useEffect(() => {

		const th = setTimeout(() => {
			snap();
		}, 500);

		const th2 = setTimeout(() => {
			snap();
		}, 5000);

		const int = setInterval(() => {
			snap();
		}, fallbackRefreshSeconds * 1000);

		return () => {
			clearTimeout(th);
			clearTimeout(th2);
			clearInterval(int);
		};
	}, [elementToSnapshot, location.pathname]);

	/**
	 * Takes in a number (width) and converts it to the width of the minimap
	 */
	const scaleBigToSmallFn = useCallback((t: number) => {
		const mainWidth = window.innerWidth - miniMapWidth;
		const scale = miniMapWidth / mainWidth;
		return t * scale;
	}, [miniMapWidth]);

	const scaleSmallToBigFn = (t: number) => {
		const mainWidth = window.innerWidth - miniMapWidth;
		const scale = mainWidth / miniMapWidth;
		return t * scale;
	};

	// Capture scroll for the mmborder movement
	useEffect(() => {
		const handleScroll = () => {
			// Query for the scroll element inside the handler to ensure we get the correct one
			// This is important when multiple route elements exist during transitions
			const verticalScrollEl = document.getElementsByClassName('vertical-scroll');
			const vs = verticalScrollEl[0] as HTMLElement;
			
			if (!vs) {
				return;
			}
			
			const mmb = document.querySelector('#mmborder') as HTMLElement;
			const headerHeight = 41;
			const scrollHeight = window.innerHeight - headerHeight;
			if (mmb) {
				mmb.style.top = `${scaleBigToSmallFn(vs.scrollTop)}px`;
				mmb.style.height = `${scaleBigToSmallFn(scrollHeight)}px`;
			}
		};

		// Fire one to get it to process on page load
		handleScroll();

		// Watch scroll for scroll handler on the document or window level
		// We need to listen to all scroll events and handle them dynamically
		const scrollHandler = () => {
			handleScroll();
		};
		
		window.addEventListener('scroll', scrollHandler, { passive: true, capture: true });

		// Also trigger on an interval to help resize the minimap box when browser size changes
		const h = setInterval(() => {
			handleScroll();
		}, 15 * 1000);

		return () => {
			// Remove scroll handler on cleanup
			window.removeEventListener('scroll', scrollHandler, { capture: true });
			// Remove timer on cleanup
			if (h) {
				clearInterval(h);
			}
		};

	}, [elementToSnapshot, miniMapWidth, scaleBigToSmallFn, location.pathname]);

	const scrollToY = (y: number, dragging: boolean) => {
		if (scrollToYLastNumberRef.current === y) {
			return;
		}
		scrollToYLastNumberRef.current = y;
		//console.log('scrollToY', y);
		const headerHeight = 41; // TODO: get rid of this
		const scrollHeight = window.innerHeight - headerHeight;
		const scaledScrollHeight = scaleBigToSmallFn(scrollHeight);
		const verticalScrollEl = document.querySelector('.vertical-scroll');
		verticalScrollEl?.scrollTo({
			top: scaleSmallToBigFn(Math.max(y - headerHeight - scaledScrollHeight / 2, 0)),
			behavior: dragging ? 'auto' : 'smooth',
		});
	};

	const clickedMiniMap = (e: React.PointerEvent<HTMLDivElement>) => {
		//console.log('clickedMiniMap', e.clientY, e.pageY, e);
		scrollToY(e.clientY, false);
	};

	const onDragStart = (e: React.DragEvent<HTMLDivElement>) => {
		// blank out the drag image
		var img = document.createElement("img");   
		img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
		e.dataTransfer.setDragImage(img, 0, 0);
	};

	const onDrag = (e: React.DragEvent<HTMLDivElement>) => {
		//console.log('onDrag', e.clientY);
		if (e.clientY !== 0) {
			scrollToY(e.clientY, true);
		}
	};

	const onDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
		//console.log('onDragEnd', e);
	};

	return (
		<div
			id="MiniMapCanvas"
			className="MiniMapCanvas"
			onClick={clickedMiniMap}
			draggable="true"
			onDragStart={onDragStart}
			onDrag={onDrag}
			onDragEnd={onDragEnd}
		>
			{/* draggable border section */}
			<div
				id="mmborder"
				className="mmborder"
			/>
			{/* the snapshotted image */}
			<img id="mmimg" src="" alt="Minimap preview" />
		</div>
	);
}