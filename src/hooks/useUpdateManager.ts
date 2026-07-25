import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useAtom, useAtomValue } from 'jotai';
import { bigStateAtom, clientSettingsAtom } from '../atoms/settingsState';
import { skipVersionAtom } from '../atoms/skipVersionAtom';
import { removeSkipVersion, saveSkipVersion } from '../helpers/persistence';

interface GithubResult {
	tag_name: string;
	name: string;
}

interface RequestState<Result> {
	loading: boolean;
	error: boolean;
	errorMessage: string;
	result: Result;
}

interface TestPhpResult {
	whoami: string | null;
	script: string | null;
}

interface LatestVersionResult {
	version?: number;
	version_string?: string;
}

interface UseUpdateManagerOptions {
	currentVersionString: string;
}

export function useUpdateManager({ currentVersionString }: UseUpdateManagerOptions) {
	const [bigState, setBigState] = useAtom(bigStateAtom);
	const clientSettings = useAtomValue(clientSettingsAtom);
	const [skipVersion, setSkipVersion] = useAtom(skipVersionAtom);
	const [clickedCheckForUpdates, setClickedCheckForUpdates] = useState(false);
	const [selected, setSelected] = useState('');
	const controllers = useRef(new Set<AbortController>());

	const [testPhpState, setTestPhpState] = useState<RequestState<TestPhpResult>>({
		loading: false,
		error: false,
		errorMessage: '',
		result: { whoami: null, script: null },
	});
	const [latestVersionState, setLatestVersionState] = useState<RequestState<LatestVersionResult>>({
		loading: false,
		error: false,
		errorMessage: '',
		result: {},
	});
	const [githubState, setGithubState] = useState<RequestState<GithubResult[] | null>>({
		loading: false,
		error: false,
		errorMessage: '',
		result: [],
	});
	const [updateState, setUpdateState] = useState<RequestState<string>>({
		loading: false,
		error: false,
		errorMessage: '',
		result: '',
	});
	const [downgradeState, setDowngradeState] = useState<RequestState<string>>({
		loading: false,
		error: false,
		errorMessage: '',
		result: '',
	});

	const createController = useCallback(() => {
		const controller = new AbortController();
		controllers.current.add(controller);
		return controller;
	}, []);

	const releaseController = useCallback((controller: AbortController) => {
		controllers.current.delete(controller);
	}, []);

	const testPhp = useCallback(async () => {
		setTestPhpState(curr => ({ ...curr, loading: true }));
		const controller = createController();

		try {
			const response = await axios.get<TestPhpResult>('auto-version-switch.php?testphp=true', {
				timeout: 10 * 1000,
				signal: controller.signal,
			});
			setTestPhpState({
				loading: false,
				error: false,
				errorMessage: '',
				result: response.data,
			});
		} catch (error) {
			if (!axios.isCancel(error)) {
				setTestPhpState({
					loading: false,
					error: true,
					errorMessage: 'Error testing PHP',
					result: { whoami: null, script: null },
				});
			}
		} finally {
			releaseController(controller);
		}
	}, [createController, releaseController]);

	const fetchLatestVersion = useCallback(async () => {
		setLatestVersionState(curr => ({ ...curr, loading: true }));
		const controller = createController();

		try {
			const response = await axios.get<LatestVersionResult>(
				`https://nagiostv.com/version/nagiostv-react/?version=${currentVersionString}`,
				{ timeout: 10 * 1000, signal: controller.signal },
			);
			const result = response.data;
			setLatestVersionState({
				loading: false,
				error: false,
				errorMessage: '',
				result,
			});
			setBigState(curr => ({
				...curr,
				latestVersion: result.version ?? 0,
				latestVersionString: result.version_string ?? '',
				lastVersionCheckTime: Date.now(),
			}));
		} catch (error) {
			if (!axios.isCancel(error)) {
				setLatestVersionState({
					loading: false,
					error: true,
					errorMessage: 'Error getting latest version from server',
					result: {},
				});
			}
		} finally {
			releaseController(controller);
		}
	}, [createController, currentVersionString, releaseController, setBigState]);

	const fetchReleasesFromGithub = useCallback(async () => {
		setGithubState(curr => ({ ...curr, loading: true }));
		const controller = createController();

		try {
			const response = await axios.get<GithubResult[]>(
				'https://api.github.com/repos/chriscareycode/nagiostv-react/releases',
				{ timeout: 10 * 1000, signal: controller.signal },
			);
			setGithubState({
				loading: false,
				error: false,
				errorMessage: '',
				result: response.data,
			});
		} catch (error) {
			if (!axios.isCancel(error)) {
				setGithubState({
					loading: false,
					error: true,
					errorMessage: 'Error fetching from github',
					result: null,
				});
			}
		} finally {
			releaseController(controller);
		}
	}, [createController, releaseController]);

	const checkForUpdates = useCallback(() => {
		void testPhp();
		void fetchLatestVersion();
		void fetchReleasesFromGithub();
		setClickedCheckForUpdates(true);
	}, [fetchLatestVersion, fetchReleasesFromGithub, testPhp]);

	const beginUpdate = useCallback(async () => {
		setUpdateState(curr => ({ ...curr, loading: true }));
		const controller = createController();

		try {
			const response = await axios.get<string>(
				`auto-version-switch.php?version=v${bigState.latestVersionString}`,
				{ timeout: 30 * 1000, signal: controller.signal },
			);
			setUpdateState({
				loading: false,
				error: false,
				errorMessage: '',
				result: response.data,
			});
		} catch (error) {
			if (!axios.isCancel(error)) {
				setUpdateState({
					loading: false,
					error: true,
					errorMessage: 'Error calling auto-version-switch.php',
					result: '',
				});
			}
		} finally {
			releaseController(controller);
		}
	}, [bigState.latestVersionString, createController, releaseController]);

	const beginDowngrade = useCallback(async () => {
		setDowngradeState(curr => ({ ...curr, loading: true }));
		const controller = createController();

		try {
			const response = await axios.get<string>(
				`auto-version-switch.php?version=${selected}`,
				{ timeout: 30 * 1000, signal: controller.signal },
			);
			setDowngradeState({
				loading: false,
				error: false,
				errorMessage: '',
				result: response.data,
			});
		} catch (error) {
			if (!axios.isCancel(error)) {
				setDowngradeState({
					loading: false,
					error: true,
					errorMessage: 'Error calling auto-version-switch.php',
					result: '',
				});
			}
		} finally {
			releaseController(controller);
		}
	}, [createController, releaseController, selected]);

	const selectChanged = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
		setSelected(event.target.value);
	}, []);

	const clickedSkipVersion = useCallback(() => {
		const skipVersionValue = {
			version: bigState.latestVersion,
			version_string: bigState.latestVersionString,
		};
		saveSkipVersion(skipVersionValue);
		setSkipVersion(skipVersionValue);
	}, [bigState.latestVersion, bigState.latestVersionString, setSkipVersion]);

	const clearSkipVersion = useCallback(() => {
		removeSkipVersion();
		setSkipVersion({ version: 0, version_string: '' });
	}, [setSkipVersion]);

	useEffect(() => {
		if (clientSettings.versionCheckDays !== 0) {
			checkForUpdates();
		}
	}, [checkForUpdates, clientSettings.versionCheckDays]);

	useEffect(() => {
		const activeControllers = controllers.current;
		return () => {
			activeControllers.forEach(controller => controller.abort());
			activeControllers.clear();
		};
	}, []);

	return {
		beginDowngrade,
		beginUpdate,
		bigState,
		checkForUpdates,
		clearSkipVersion,
		clickedCheckForUpdates,
		clickedSkipVersion,
		downgradeState,
		githubState,
		latestVersionState,
		selected,
		selectChanged,
		skipVersion,
		testPhpState,
		updateState,
	};
}
