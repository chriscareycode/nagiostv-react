import { useCallback, useEffect, useRef, useState } from "react";
import './MiniMapMozilla.css';

interface MiniMapMozillaProps {
	elementToSnapshot: string;
	miniMapWidth: number;
}

/**
 * MiniMapMozilla - A Firefox-only minimap component using the -moz-element() CSS function.
 * This approach is more performant than using html2canvas as it creates a live CSS reference
 * to the source element without needing to capture and re-render it as an image.
 * Uses an input range slider for navigation as described in the CSS-Tricks article.
 * 
 * @see https://css-tricks.com/using-the-little-known-css-element-function-to-create-a-minimap-navigator/
 */
export default function MiniMapMozilla({
	elementToSnapshot,
}: MiniMapMozillaProps) {
	// Ref to the container element for measuring actual width
	const containerRef = useRef<HTMLDivElement>(null);
	// State to track the preview height
	const [previewHeight, setPreviewHeight] = useState<number>(200);
	// State to track the thumb height (viewport scaled to minimap)
	const [thumbHeight, setThumbHeight] = useState<number>(40);
	// State to track the range slider value (0-100)
	const [rangeValue, setRangeValue] = useState<number>(0);
	// Ref to track if we're currently dragging the slider
	const isDraggingRef = useRef<boolean>(false);

	/**
	 * Syncs the range slider with the current scroll position
	 */
	const syncSliderWithScroll = useCallback(() => {
		// Don't update slider if user is dragging it
		if (isDraggingRef.current) return;

		const sourceElement = document.querySelector(elementToSnapshot) as HTMLElement | null;
		const verticalScrollEl = document.querySelector('.vertical-scroll') as HTMLElement | null;
		
		if (!sourceElement || !verticalScrollEl) return;

		const scrollTop = verticalScrollEl.scrollTop;
		const scrollHeight = sourceElement.scrollHeight - window.innerHeight;
		
		if (scrollHeight > 0) {
			const percentage = (scrollTop / scrollHeight) * 100;
			setRangeValue(Math.min(100, Math.max(0, percentage)));
		} else {
			// If content fits in viewport, reset to 0
			setRangeValue(0);
		}
	}, [elementToSnapshot]);

	/**
	 * Calculates the height of the preview element based on the aspect ratio of the source element
	 * Also calculates the thumb height based on viewport size relative to content
	 */
	const calculatePreviewHeight = useCallback(() => {
		const sourceElement = document.querySelector(elementToSnapshot) as HTMLElement | null;
		if (!sourceElement || !containerRef.current) return;

		const sourceWidth = sourceElement.offsetWidth;
		const sourceHeight = sourceElement.scrollHeight;
		// Read the actual container width from the DOM (accounts for margins)
		const availableWidth = containerRef.current.offsetWidth - 10;
		
		if (sourceWidth > 0 && availableWidth > 0) {
			// Calculate the height based on the aspect ratio
			const scale = availableWidth / sourceWidth;
			const newHeight = sourceHeight * scale;
			setPreviewHeight(newHeight);

			// Calculate thumb height: viewport height scaled to minimap
			// Subtract header height (41px) from viewport to match actual visible content area
			const headerHeight = 41;
			const viewportHeight = window.innerHeight - headerHeight;
			const scaledThumbHeight = viewportHeight * scale;
			// Ensure minimum thumb height for usability
			setThumbHeight(Math.max(20, scaledThumbHeight));
		}
	}, [elementToSnapshot]);

	// Combined effect to set up source element and observe size changes
	useEffect(() => {
		let currentSourceElement: HTMLElement | null = null;
		let retryTimeout: ReturnType<typeof setTimeout> | null = null;
		let resizeObserver: ResizeObserver | null = null;
		let retryCount = 0;
		const maxRetries = 20; // Max 1 second of retries (20 * 50ms)

		const setupSourceAndObservers = () => {
			// First, remove the ID from any existing element that has it
			const existingElement = document.getElementById('minimap-source');
			if (existingElement) {
				existingElement.removeAttribute('id');
			}

			// Try to find the new source element
			const sourceElement = document.querySelector(elementToSnapshot) as HTMLElement | null;
			
			if (sourceElement && containerRef.current) {
				// Set the ID for -moz-element()
				sourceElement.id = 'minimap-source';
				currentSourceElement = sourceElement;

				// Set up ResizeObserver on both container and source element
				resizeObserver = new ResizeObserver(() => {
					calculatePreviewHeight();
				});
				resizeObserver.observe(containerRef.current);
				resizeObserver.observe(sourceElement);

				// Initial calculation
				calculatePreviewHeight();
				// Sync slider with current scroll position after element is found
				syncSliderWithScroll();
			} else if (retryCount < maxRetries) {
				// Element doesn't exist yet (route transition), retry after a short delay
				retryCount++;
				retryTimeout = setTimeout(setupSourceAndObservers, 50);
			}
		};

		setupSourceAndObservers();

		// Recalculate on window resize (for viewport height changes)
		const handleResize = () => calculatePreviewHeight();
		window.addEventListener('resize', handleResize);

		return () => {
			// Cleanup
			if (retryTimeout) {
				clearTimeout(retryTimeout);
			}
			if (resizeObserver) {
				resizeObserver.disconnect();
			}
			if (currentSourceElement) {
				currentSourceElement.removeAttribute('id');
			}
			window.removeEventListener('resize', handleResize);
		};
	}, [elementToSnapshot, calculatePreviewHeight, syncSliderWithScroll]);

	// Effect to sync the slider with the current scroll position on scroll events
	useEffect(() => {
		window.addEventListener('scroll', syncSliderWithScroll, { passive: true, capture: true });

		return () => {
			window.removeEventListener('scroll', syncSliderWithScroll, { capture: true });
		};
	}, [syncSliderWithScroll]);

	/**
	 * Handle range slider change - scroll to the corresponding position
	 */
	const handleRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = parseFloat(e.target.value);
		setRangeValue(value);

		const sourceElement = document.querySelector(elementToSnapshot) as HTMLElement | null;
		const verticalScrollEl = document.querySelector('.vertical-scroll') as HTMLElement | null;
		
		if (!sourceElement || !verticalScrollEl) return;

		const scrollHeight = sourceElement.scrollHeight - window.innerHeight;
		const scrollTo = (scrollHeight * value) / 100;
		
		verticalScrollEl.scrollTo({
			top: scrollTo,
			behavior: 'auto',
		});
	};

	const handleRangeMouseDown = () => {
		isDraggingRef.current = true;
	};

	const handleRangeMouseUp = () => {
		isDraggingRef.current = false;
	};

	return (
		<div
			ref={containerRef}
			id="MiniMapMozilla"
			className="MiniMapMozilla"
		>
			{/* The preview using -moz-element() - styles applied via CSS */}
			<div 
				className="minimap-preview"
				style={{ 
					height: previewHeight,
					'--thumb-height': `${thumbHeight}px`,
					// Use -moz-element() for Firefox live preview (set here to avoid CSS parser errors)
					background: '-moz-element(#minimap-source) no-repeat top center / contain',
				} as React.CSSProperties}
			>
				{/* Range slider overlay for navigation */}
				<input
					id="minimap-range"
					className="minimap-range"
					type="range"
					min="0"
					max="100"
					step="0.1"
					value={rangeValue}
					onChange={handleRangeChange}
					onMouseDown={handleRangeMouseDown}
					onMouseUp={handleRangeMouseUp}
					onTouchStart={handleRangeMouseDown}
					onTouchEnd={handleRangeMouseUp}
				/>
			</div>
		</div>
	);
}
