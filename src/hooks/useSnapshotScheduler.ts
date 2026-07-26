import { useCallback, useEffect, useRef } from 'react';

type CaptureSnapshot = () => Promise<string | null>;
type ApplySnapshot = (snapshot: string) => void;

export const useSnapshotScheduler = (
	captureSnapshot: CaptureSnapshot,
	applySnapshot: ApplySnapshot,
	defaultDelayMs = 500,
) => {
	const captureSnapshotRef = useRef(captureSnapshot);
	const applySnapshotRef = useRef(applySnapshot);
	const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
	const generationRef = useRef(0);
	const isCapturingRef = useRef(false);
	const isQueuedRef = useRef(false);
	const isMountedRef = useRef(true);
	const runRef = useRef<() => void>(() => undefined);

	captureSnapshotRef.current = captureSnapshot;
	applySnapshotRef.current = applySnapshot;

	runRef.current = () => {
		timerRef.current = undefined;

		if (isCapturingRef.current) {
			isQueuedRef.current = true;
			return;
		}

		isCapturingRef.current = true;
		const captureGeneration = generationRef.current;

		void captureSnapshotRef.current()
			.then(snapshot => {
				if (
					snapshot !== null
					&& isMountedRef.current
					&& captureGeneration === generationRef.current
				) {
					applySnapshotRef.current(snapshot);
				}
			})
			.finally(() => {
				isCapturingRef.current = false;

				if (isMountedRef.current && isQueuedRef.current) {
					isQueuedRef.current = false;
					if (timerRef.current === undefined) {
						timerRef.current = setTimeout(() => runRef.current(), 0);
					}
				}
			});
	};

	const requestSnapshot = useCallback((delayMs = defaultDelayMs) => {
		generationRef.current++;
		if (timerRef.current !== undefined) {
			clearTimeout(timerRef.current);
		}
		timerRef.current = setTimeout(() => runRef.current(), delayMs);
	}, [defaultDelayMs]);

	useEffect(() => {
		isMountedRef.current = true;

		return () => {
			isMountedRef.current = false;
			isQueuedRef.current = false;
			if (timerRef.current !== undefined) {
				clearTimeout(timerRef.current);
			}
		};
	}, []);

	return requestSnapshot;
};
