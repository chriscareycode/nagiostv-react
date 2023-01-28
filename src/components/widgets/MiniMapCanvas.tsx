import html2canvas from "html2canvas";
import { useCallback, useEffect } from "react";
import './MiniMapCanvas.css';
import { hostAtom } from 'atoms/hostAtom';
import { serviceAtom } from 'atoms/serviceAtom';
import { useRecoilValue } from "recoil";

interface MiniMapCanvasProps {
	elementToSnapshot: string;
	miniMapWidth: number;
}

const howOftenToRefreshSeconds = 7;

export default function MiniMapCanvas({
	elementToSnapshot,
	miniMapWidth,
}: MiniMapCanvasProps) {

	const hostState = useRecoilValue(hostAtom);
	const serviceState = useRecoilValue(serviceAtom);

	// The function that uses html2canvas to take a snapshot of the area
	const snap = () => {
		const myElement: HTMLElement | null = document.querySelector(elementToSnapshot);
		if (myElement) {
			html2canvas(myElement, {
				backgroundColor: '#111111',
				scale: 0.25,
			}).then(function (canvas) {
				const mmi = document.querySelector('#mmimg');
				const imgDataUrl = canvas.toDataURL();
				mmi?.setAttribute('src', imgDataUrl);
			}).catch(err => {
				console.log('error doing html2canvas');
				console.log(err);
			});
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

	// This useEffect handles setting up the intervals for taking snapshots
	useEffect(() => {

		const th = setTimeout(() => {
			snap();
		}, 500);

		const th2 = setTimeout(() => {
			snap();
		}, 5000);

		const int = setInterval(() => {
			snap();
		}, howOftenToRefreshSeconds * 1000);

		return () => {
			clearTimeout(th);
			clearTimeout(th2);
			clearInterval(int);
		};
	}, [elementToSnapshot]);

	/**
	 * Takes in a number (width) and converts it to the width of the minimap
	 */
	const scaleBigToSmallFn = useCallback((t: number) => {
		const mainWidth = window.innerWidth - miniMapWidth;
		const scale = miniMapWidth / mainWidth;
		return t * scale;
	}, [elementToSnapshot, miniMapWidth]);

	const scaleSmallToBigFn = (t: number) => {
		const mainWidth = window.innerWidth - miniMapWidth;
		const scale = mainWidth / miniMapWidth;
		return t * scale;
	};

	// Capture scroll for the mmborder movement
	useEffect(() => {
		const verticalScrollEl = document.getElementsByClassName('vertical-scroll');
		const vs = verticalScrollEl[0];
		const mmb = document.querySelector('#mmborder') as HTMLElement;

		const handleScroll = () => {
			const headerHeight = 41;
			const scrollHeight = window.innerHeight - headerHeight;
			if (mmb) {
				mmb.style.top = `${scaleBigToSmallFn(vs.scrollTop)}px`;
				mmb.style.height = `${scaleBigToSmallFn(scrollHeight)}px`;
			}
		};

		// Fire one to get it to process on page load
		handleScroll();

		// Watch scroll for scroll handler
		vs.addEventListener('scroll', handleScroll, { passive: true });

		return () => {
			// Remove scroll handler on cleanup
			vs.removeEventListener('scroll', handleScroll);
		};

	}, [elementToSnapshot, miniMapWidth]);

	let scrollToYLastNumber = 0; // temp store old number to decrease rapid fire with previous number
	const scrollToY = (y: number, dragging: boolean) => {
		if (scrollToYLastNumber === y) {
			return;
		}
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
			<img id="mmimg" src="" />
		</div>
	);
}