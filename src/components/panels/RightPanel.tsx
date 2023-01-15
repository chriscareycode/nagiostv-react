import MiniMapCanvas from '../widgets/MiniMapCanvas';
import { useLocation } from "react-router-dom";
import './RightPanel.css';

interface RightPanelProps {
	isRightPanelOpen: boolean;
	showMiniMap: boolean;
	miniMapWidth: number;
}

const RightPanel = ({
	isRightPanelOpen,
	showMiniMap,
	miniMapWidth,
}: RightPanelProps) => {

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
		<div
			className={isRightPanelOpen ? 'RightPanel right-panel-open' : 'RightPanel'}
			style={{ width: miniMapWidth }}
		>
			{showMiniMap && (
				<MiniMapCanvas
					elementToSnapshot={whichElementToSnapshot}
					miniMapWidth={miniMapWidth}
				/>
			)}
		</div>
	);
};

export default RightPanel;