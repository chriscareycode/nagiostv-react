import { useEffect, useRef, useState } from "react";
import { formatDateTime } from "helpers/dates";
import { translate } from "helpers/language";

export default function NextCheckIn({ nextCheckTime, language }: { nextCheckTime: number, language: string }) {
	const divRef = useRef<HTMLDivElement>(null);
	const [isCheckingNow, setIsCheckingNow] = useState(nextCheckTime <= Date.now());

	useEffect(() => {
		const updateDisplay = () => {
			if (divRef.current) {
				if (nextCheckTime < Date.now() + 2000) {
					divRef.current.innerHTML = 'Checking now...';
					setIsCheckingNow(true);
					return;
				} else {
					divRef.current.innerHTML = formatDateTime(nextCheckTime);
					setIsCheckingNow(false);
				}
			}
		};

		// Initial display
		updateDisplay();

		// Set up interval to update every second
		const intervalId = setInterval(updateDisplay, 1000);

		// Cleanup interval on unmount
		return () => clearInterval(intervalId);
	}, [nextCheckTime]);

	return (
		<span className="NextCheckIn">
      <span>
        {!isCheckingNow && <span>{translate('Next check in', language)}:</span>} <span ref={divRef} className="color-peach">{formatDateTime(nextCheckTime)}</span>
      </span>
		</span>
	);
}


