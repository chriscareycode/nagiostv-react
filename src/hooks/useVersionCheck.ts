import { useCallback, useEffect, useRef } from 'react';
import axios, { AxiosResponse } from 'axios';
import { useAtom, useAtomValue } from 'jotai';
import { bigStateAtom, clientSettingsAtom } from '../atoms/settingsState';
import {
	isLocalStorageAvailable,
	readLastVersionCheckTime,
	saveLastVersionCheckTime,
} from '../helpers/persistence';
import { VersionCheck } from '../types/settings';

export const VERSION_CHECK_MINIMUM_GAP_MS = 23 * 60 * 60 * 1000;
export const VERSION_CHECK_STORAGE_DELAY_MS = 30 * 1000;
export const VERSION_CHECK_NO_STORAGE_DELAY_MS = 30 * 60 * 1000;

export const isVersionCheckDue = (
	now: number,
	persistedCheckTime: number,
	sessionCheckTime: number,
): boolean => {
	const persistedCheckIsRecent = persistedCheckTime !== 0
		&& now - persistedCheckTime < VERSION_CHECK_MINIMUM_GAP_MS;
	const sessionCheckIsRecent = sessionCheckTime !== 0
		&& now - sessionCheckTime < VERSION_CHECK_MINIMUM_GAP_MS;

	return !persistedCheckIsRecent && !sessionCheckIsRecent;
};

export function useVersionCheck() {
	const [bigState, setBigState] = useAtom(bigStateAtom);
	const versionCheckDays = useAtomValue(clientSettingsAtom).versionCheckDays;
	const lastVersionCheckTimeRef = useRef(0);
	const requestControllerRef = useRef<AbortController | null>(null);

	const versionCheck = useCallback(async () => {
		const nowTime = Date.now();
		const persistedCheckTime = readLastVersionCheckTime();

		if (!isVersionCheckDue(nowTime, persistedCheckTime, lastVersionCheckTimeRef.current)) {
			console.log('Not performing version check because it was completed within the last 23 hours.');
			return;
		}

		console.log('Running version check...');
		lastVersionCheckTimeRef.current = nowTime;
		saveLastVersionCheckTime(nowTime);

		const controller = new AbortController();
		requestControllerRef.current?.abort();
		requestControllerRef.current = controller;

		try {
			const response: AxiosResponse<VersionCheck> = await axios.get(
				`https://nagiostv.com/version/nagiostv-react/?version=${bigState.currentVersionString}`,
				{ timeout: 5 * 1000, signal: controller.signal },
			);
			const result = response.data;
			console.log(`Latest NagiosTV release is ${result.version_string} (r${result.version}). You are running ${bigState.currentVersionString} (r${bigState.currentVersion})`);
			setBigState(curr => ({
				...curr,
				latestVersion: result.version,
				latestVersionString: result.version_string,
				lastVersionCheckTime: nowTime,
			}));
		} catch (error) {
			if (!axios.isCancel(error)) {
				console.log('There was some error with the version check', error);
			}
		} finally {
			if (requestControllerRef.current === controller) {
				requestControllerRef.current = null;
			}
		}
	}, [bigState.currentVersion, bigState.currentVersionString, setBigState]);

	useEffect(() => {
		if (!versionCheckDays || versionCheckDays <= 0) {
			return;
		}

		const initialDelay = isLocalStorageAvailable()
			? VERSION_CHECK_STORAGE_DELAY_MS
			: VERSION_CHECK_NO_STORAGE_DELAY_MS;
		if (initialDelay === VERSION_CHECK_NO_STORAGE_DELAY_MS) {
			console.log('localStorage not enabled so delaying first version check by 30m');
		}

		let intervalHandle: ReturnType<typeof setInterval> | undefined;
		const timeoutHandle = setTimeout(() => {
			void versionCheck();

			const intervalTime = versionCheckDays * 24 * 60 * 60 * 1000;
			if (intervalTime > 60 * 60 * 1000) {
				intervalHandle = setInterval(() => {
					void versionCheck();
				}, intervalTime);
			} else {
				console.log('intervalTime not yet an hour, not re-running check.', intervalTime);
			}
		}, initialDelay);

		return () => {
			clearTimeout(timeoutHandle);
			if (intervalHandle) {
				clearInterval(intervalHandle);
			}
		};
	}, [versionCheck, versionCheckDays]);

	useEffect(() => {
		return () => requestControllerRef.current?.abort();
	}, []);
}
