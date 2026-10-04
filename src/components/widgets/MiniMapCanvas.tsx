import { snapdom } from "@zumer/snapdom";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useLocation } from "react-router";
import './MiniMapCanvas.css';
import { hostAtom, hostHowManyAtom } from 'atoms/hostAtom';
import { serviceAtom, serviceHowManyAtom } from 'atoms/serviceAtom';
import { clientSettingsAtom } from 'atoms/settingsState';
import { useAtomValue } from 'jotai';
import { useSnapshotScheduler } from '../../hooks/useSnapshotScheduler';
import { Host, Service } from '../../types/hostAndServiceTypes';

interface MiniMapCanvasProps {
	elementToSnapshot: string;
	miniMapWidth: number;
}

const buildHostMiniMapContentKey = (hosts: Host[]): string => JSON.stringify(
	hosts.map(host => [
		host.name,
		host.status,
		host.state_type,
		host.current_attempt,
		host.max_attempts,
		host.notifications_enabled,
		host.problem_has_been_acknowledged,
		host.scheduled_downtime_depth,
		host.is_flapping,
		host.plugin_output,
	]),
);

const buildServiceMiniMapContentKey = (services: Service[]): string => JSON.stringify(
	services.map(service => [
		service.host_name,
		service.description,
		service.status,
		service.state_type,
		service.current_attempt,
		service.max_attempts,
		service.notifications_enabled,
		service.problem_has_been_acknowledged,
		service.scheduled_downtime_depth,
		service.is_flapping,
		service.plugin_output,
	]),
);

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
	// Track whether we're currently dragging the minimap thumb
	const isDraggingRef = useRef<boolean>(false);
	// Track the active Blob URL so decoded image resources can be released.
	const snapshotUrlRef = useRef<string | null>(null);
	// Track route changes to trigger minimap updates
	const location = useLocation();
	const hostContentKey = useMemo(
		() => buildHostMiniMapContentKey(hostState.stateArray),
		[hostState.stateArray],
	);
	const serviceContentKey = useMemo(
		() => buildServiceMiniMapContentKey(serviceState.stateArray),
		[serviceState.stateArray],
	);

	const captureSnapshot = useCallback(async (): Promise<Blob | null> => {
		const myElement: HTMLElement | null = document.querySelector(elementToSnapshot);
		if (!myElement) {
			return null;
		}
		
		try {
			const result = await snapdom(myElement, {
				scale: 0.25,
				backgroundColor: '#111111',
				fast: true,
				cache: 'disabled',
			});
			return await result.toBlob({ type: 'png' });
		} catch (err) {
			console.log('error doing snapdom', err);
			return null;
		}
	}, [elementToSnapshot]);

	const applySnapshot = useCallback((snapshot: Blob) => {
		const minimapImage = document.querySelector('#mmimg') as HTMLImageElement | null;
		if (minimapImage) {
			const previousUrl = snapshotUrlRef.current;
			const nextUrl = URL.createObjectURL(snapshot);
			snapshotUrlRef.current = nextUrl;
			minimapImage.src = nextUrl;
			if (previousUrl) {
				URL.revokeObjectURL(previousUrl);
			}
		}
	}, []);

	useEffect(() => () => {
		if (snapshotUrlRef.current) {
			URL.revokeObjectURL(snapshotUrlRef.current);
			snapshotUrlRef.current = null;
		}
	}, []);

	const requestSnapshot = useSnapshotScheduler(captureSnapshot, applySnapshot);

	// Coalesce data, count, filter, and route changes into one delayed snapshot.
	useEffect(() => {
		requestSnapshot();
	}, [
		requestSnapshot,
		elementToSnapshot,
		location.pathname,
		hostContentKey,
		serviceContentKey,
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

	// Capture once more after initial layout settles. Further captures are driven
	// by content, filters, dimensions, or route changes above.
	useEffect(() => {
		const settledLayoutTimer = setTimeout(() => requestSnapshot(), 5000);

		return () => {
			clearTimeout(settledLayoutTimer);
		};
	}, [requestSnapshot]);

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

	const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
		isDraggingRef.current = true;
		// Capture pointer so we keep receiving events even if cursor leaves the element
		(e.target as HTMLElement).setPointerCapture(e.pointerId);
		scrollToY(e.clientY, false);
	};

	const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
		if (!isDraggingRef.current) return;
		scrollToY(e.clientY, true);
	};

	const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
		isDraggingRef.current = false;
		(e.target as HTMLElement).releasePointerCapture(e.pointerId);
	};

	return (
		<div
			id="MiniMapCanvas"
			className="MiniMapCanvas"
			onPointerDown={onPointerDown}
			onPointerMove={onPointerMove}
			onPointerUp={onPointerUp}
			onPointerCancel={onPointerUp}
			style={{ touchAction: 'none' }}
		>
			{/* draggable border section */}
			<div
				id="mmborder"
				className="mmborder"
			/>
			{/* the snapshotted image */}
			<img id="mmimg" alt="Minimap preview" draggable="false" />
		</div>
	);
}
