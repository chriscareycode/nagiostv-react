import { useCallback, useEffect, useMemo } from 'react';
import { Allotment, LayoutPriority } from "allotment";
import { debounce } from 'lodash';
import { useLocation } from "react-router-dom";
import MiniMapCanvas from '../widgets/MiniMapCanvas';
import MiniMapMozilla from '../widgets/MiniMapMozilla';
import { useAtom, useAtomValue } from 'jotai';
import { bigStateAtom, clientSettingsAtom } from 'atoms/settingsState';
import "allotment/dist/style.css";
import { saveClientSettings } from 'helpers/persistence';

/**
 * Detect if the browser is Firefox and supports -moz-element()
 * This CSS function allows for a more performant minimap implementation
 */
const isFirefox = (): boolean => {
	if (typeof window === 'undefined' || typeof CSS === 'undefined') {
		return false;
	}
	// Check if browser supports -moz-element() CSS function
	return CSS.supports('background', '-moz-element(#test)');
};

interface MiniMapWrapProps {
	children?: JSX.Element;
}

const MiniMapWrap = ({ children }: MiniMapWrapProps) => {

	const bigState = useAtomValue(bigStateAtom);
	const [clientSettings, setClientSettings] = useAtom(clientSettingsAtom);

	const onResizeMiniMap = useCallback((e: number[]) => {
		//console.log('onResizeMiniMap', e);
		if (!bigState.isDoneLoading) {
			return undefined;
		}
		// Gets passed an array of [panel1width, panel2width]
		if (e && e.length === 2 && e[1] >= 0) {
			const newMiniMapWidth = Math.trunc(e[1]);
			setClientSettings(curr => {
				if (newMiniMapWidth === curr.miniMapWidth) {
					return curr;
				}
				const updatedSettings = {
					...curr,
					miniMapWidth: newMiniMapWidth,
				};
				saveClientSettings(updatedSettings);
				return updatedSettings;
			});
		}
		return undefined;
	}, [bigState.isDoneLoading, setClientSettings]);

	const debouncedResizeMiniMap = useMemo(
		() => debounce(onResizeMiniMap, 1000),
		[onResizeMiniMap],
	);

	useEffect(() => {
		return () => debouncedResizeMiniMap.cancel();
	}, [debouncedResizeMiniMap]);

	// React router location
	const location = useLocation();

	// Check once if we're on Firefox with -moz-element() support
	const useFirefoxMinimap = useMemo(() => isFirefox(), []);

	// Select the appropriate content element based on current route
	let elementToSnapshot = '.Dashboard';
	if (location.pathname === '/settings') {
		elementToSnapshot = '.Settings';
	}
	if (location.pathname === '/update') {
		elementToSnapshot = '.Update';
	}
	if (location.pathname === '/help') {
		elementToSnapshot = '.Help';
	}

	// Choose the appropriate minimap component based on browser support
	const MiniMapComponent = useFirefoxMinimap ? MiniMapMozilla : MiniMapCanvas;

	return (
		<>
			{bigState.isDoneLoading && (
				<Allotment
					proportionalLayout={false}
					onChange={debouncedResizeMiniMap}
				>

					<Allotment.Pane priority={LayoutPriority.High}>
						{children}
					</Allotment.Pane>

					<Allotment.Pane
						minSize={0}
						priority={LayoutPriority.Low}
						preferredSize={clientSettings.miniMapWidth}
					>
						<MiniMapComponent
							elementToSnapshot={elementToSnapshot}
							miniMapWidth={clientSettings.miniMapWidth}
						/>
					</Allotment.Pane>

				</Allotment>
			)}
		</>
	);
};

export default MiniMapWrap;
