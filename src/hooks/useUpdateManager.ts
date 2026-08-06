import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useAtom, useAtomValue } from 'jotai';
import { bigStateAtom, clientSettingsAtom } from '../atoms/settingsState';
import { skipVersionAtom } from '../atoms/skipVersionAtom';
import { AdminCapabilities, fetchAdminCapabilities, postAdminJson } from '../helpers/adminApi';
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

interface LatestVersionResult {
	version?: number;
	version_string?: string;
}

interface UpdateResult {
	updated: boolean;
	version: string;
	message: string;
}

const emptyRequest = <Result,>(result: Result): RequestState<Result> => ({
	loading: false,
	error: false,
	errorMessage: '',
	result,
});

export function useUpdateManager({ currentVersionString }: { currentVersionString: string }) {
	const [bigState, setBigState] = useAtom(bigStateAtom);
	const clientSettings = useAtomValue(clientSettingsAtom);
	const [skipVersion, setSkipVersion] = useAtom(skipVersionAtom);
	const [adminToken, setAdminToken] = useState('');
	const [capabilities, setCapabilities] = useState<AdminCapabilities | null>(null);
	const [clickedCheckForUpdates, setClickedCheckForUpdates] = useState(false);
	const [selected, setSelected] = useState('');
	const controllers = useRef(new Set<AbortController>());
	const [latestVersionState, setLatestVersionState] = useState(emptyRequest<LatestVersionResult>({}));
	const [githubState, setGithubState] = useState(emptyRequest<GithubResult[] | null>([]));
	const [updateState, setUpdateState] = useState(emptyRequest<UpdateResult | null>(null));

	const createController = useCallback(() => {
		const controller = new AbortController();
		controllers.current.add(controller);
		return controller;
	}, []);

	const loadCapabilities = useCallback(async () => {
		const controller = createController();
		try {
			setCapabilities(await fetchAdminCapabilities('auto-version-switch.php', controller.signal));
		} catch {
			setCapabilities(null);
		} finally {
			controllers.current.delete(controller);
		}
	}, [createController]);

	const fetchLatestVersion = useCallback(async () => {
		setLatestVersionState(curr => ({ ...curr, loading: true }));
		const controller = createController();
		try {
			const response = await axios.get<LatestVersionResult>(
				`https://nagiostv.com/version/nagiostv-react/?version=${currentVersionString}`,
				{ timeout: 10_000, signal: controller.signal },
			);
			const result = response.data;
			setLatestVersionState(emptyRequest(result));
			setBigState(curr => ({
				...curr,
				latestVersion: result.version ?? 0,
				latestVersionString: result.version_string ?? '',
				lastVersionCheckTime: Date.now(),
			}));
		} catch (error) {
			if (!axios.isCancel(error)) {
				setLatestVersionState({ ...emptyRequest({}), error: true, errorMessage: 'Error getting latest version' });
			}
		} finally {
			controllers.current.delete(controller);
		}
	}, [createController, currentVersionString, setBigState]);

	const fetchReleases = useCallback(async () => {
		setGithubState(curr => ({ ...curr, loading: true }));
		const controller = createController();
		try {
			const response = await axios.get<GithubResult[]>(
				'https://api.github.com/repos/chriscareycode/nagiostv-react/releases',
				{ timeout: 10_000, signal: controller.signal },
			);
			setGithubState(emptyRequest(response.data));
		} catch (error) {
			if (!axios.isCancel(error)) {
				setGithubState({ ...emptyRequest<GithubResult[] | null>(null), error: true, errorMessage: 'Error fetching releases' });
			}
		} finally {
			controllers.current.delete(controller);
		}
	}, [createController]);

	const checkForUpdates = useCallback(() => {
		void loadCapabilities();
		void fetchLatestVersion();
		void fetchReleases();
		setClickedCheckForUpdates(true);
	}, [fetchLatestVersion, fetchReleases, loadCapabilities]);

	const installVersion = useCallback(async (version: string) => {
		if (!capabilities?.csrfToken || !adminToken) {
			return;
		}
		setUpdateState(curr => ({ ...curr, loading: true, error: false }));
		const controller = createController();
		try {
			const result = await postAdminJson<UpdateResult>(
				'auto-version-switch.php',
				{ version },
				adminToken,
				capabilities.csrfToken,
				controller.signal,
			);
			setUpdateState(emptyRequest(result));
		} catch (error) {
			if (!axios.isCancel(error)) {
				setUpdateState({ ...emptyRequest<UpdateResult | null>(null), error: true, errorMessage: 'Secure update failed. Check the administrator token and server logs.' });
			}
		} finally {
			controllers.current.delete(controller);
		}
	}, [adminToken, capabilities, createController]);

	const clickedSkipVersion = useCallback(() => {
		const value = { version: bigState.latestVersion, version_string: bigState.latestVersionString };
		saveSkipVersion(value);
		setSkipVersion(value);
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
		adminToken,
		bigState,
		capabilities,
		checkForUpdates,
		clearSkipVersion,
		clickedCheckForUpdates,
		clickedSkipVersion,
		githubState,
		installVersion,
		latestVersionState,
		selected,
		selectChanged: (event: ChangeEvent<HTMLSelectElement>) => setSelected(event.target.value),
		setAdminToken,
		skipVersion,
		updateState,
	};
}
