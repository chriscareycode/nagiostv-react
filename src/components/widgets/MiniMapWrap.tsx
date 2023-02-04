import { useMemo } from 'react';
import { Allotment } from "allotment";
import { debounce } from 'lodash';
import { useLocation } from "react-router-dom";
import MiniMapCanvas from '../widgets/MiniMapCanvas';
import { useRecoilState, useRecoilValue } from 'recoil';
import { bigStateAtom, clientSettingsAtom } from 'atoms/settingsState';
import "allotment/dist/style.css";
import { saveCookie } from 'helpers/nagiostv';

interface MiniMapWrapProps {
	children?: JSX.Element;
}

const MiniMapWrap = ({ children }: MiniMapWrapProps) => {

	const bigState = useRecoilValue(bigStateAtom);
	const [clientSettings, setClientSettings] = useRecoilState(clientSettingsAtom);

	const onResizeMiniMap = (e: number[]) => {
		//console.log('onResizeMiniMap', e);
		if (!bigState.isDoneLoading) {
			return undefined;
		}
		// Gets passed an array of [panel1width, panel2width]
		if (e && e.length === 2 && e[1] >= 0) {
			const newMiniMapWidth = Math.trunc(e[1]);
			if (newMiniMapWidth !== clientSettings.miniMapWidth) {

				setClientSettings(curr => {
					//console.log('setting miniMapWidth to', w);
					const o = {
						...curr,
						miniMapWidth: newMiniMapWidth,
					};
					//debouncedSaveCookie(o);
					saveCookie('MiniMap', o);
					return o;
				});
			}
		}
		return undefined;
	};

	const debouncedResizeMiniMap = debounce((e: number[]) => onResizeMiniMap(e), 500);

	// React router location
	const location = useLocation();

	let whichElementToSnapshot = '.Dashboard';
	if (location.pathname === '/settings') {
		whichElementToSnapshot = '.Settings';
	}
	if (location.pathname === '/update') {
		whichElementToSnapshot = '.Update';
	}
	if (location.pathname === '/help') {
		whichElementToSnapshot = '.Help';
	}

	return (
		<>
			{bigState.isDoneLoading && (
				<Allotment
					onChange={debouncedResizeMiniMap}
				>

					<Allotment.Pane >
						{children}
					</Allotment.Pane>

					<Allotment.Pane
						minSize={0}
						preferredSize={clientSettings.miniMapWidth}
					>
						<MiniMapCanvas
							elementToSnapshot={whichElementToSnapshot}
							miniMapWidth={clientSettings.miniMapWidth}
						/>
					</Allotment.Pane>

				</Allotment>
			)}
		</>
	);
};

export default MiniMapWrap;