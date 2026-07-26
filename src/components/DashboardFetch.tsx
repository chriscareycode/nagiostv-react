import { useRef } from "react";
// State Management
import { useAtomValue, useSetAtom } from 'jotai';
import { bigStateAtom, clientSettingsAtom, clientSettingsInitial } from '../atoms/settingsState';
import { hostgroupAtom, servicegroupAtom } from '../atoms/hostgroupAtom';
import { commentlistAtom } from '../atoms/commentlistAtom';
// Libraries
import get from 'lodash/get';
import { ProgramStatus, programStatusAtom } from "atoms/programAtom";
import { getJson, handleFetchFail } from "helpers/axios";
// Types
import { CommentListObject, CommentListResponseObject } from "types/commentTypes";
import { buildNagiosUrl } from '../helpers/nagiosUrls';
import { useCancellablePolling } from '../hooks/useCancellablePolling';

const DashboardFetch = () => {

	const bigState = useAtomValue(bigStateAtom);
	const clientSettings = useAtomValue(clientSettingsAtom);
	const setHostgroup = useSetAtom(hostgroupAtom);
	const setServicegroup = useSetAtom(servicegroupAtom);
	const setCommentlist = useSetAtom(commentlistAtom);
	const setProgramStatus = useSetAtom(programStatusAtom)
	const fetchCommentDataRef = useRef<(signal?: AbortSignal) => void>(() => undefined);
	const fetchHostGroupDataRef = useRef<(signal?: AbortSignal) => void>(() => undefined);
	const fetchServiceGroupDataRef = useRef<(signal?: AbortSignal) => void>(() => undefined);
	const fetchProgramStatusRef = useRef<(signal?: AbortSignal) => void>(() => undefined);

	// Chop the bigState into vars
	const {
		isDemoMode,
		useFakeSampleData,
	} = bigState;

	const {
		fetchCommentFrequency,
		fetchHostGroupFrequency,
	} = clientSettings;

	// Functions

	const fetchCommentData = (signal?: AbortSignal) => {

		const url = useFakeSampleData
			? './sample-data/commentlist.json'
			: buildNagiosUrl(clientSettings, 'commentlist');

		getJson(
			url,
			{ timeout: 10 * 1000, signal }
		).then((response) => {
			if (signal?.aborted) {
				return;
			}

			// Pluck out the commentlist result
			const commentlist = get(
				response.data.data,
				'commentlist',
				{},
			) as Record<string, CommentListResponseObject>;

			// Massage the commentlist so we have one key per hostname
			const commentlistObject: CommentListObject = {
				hosts: {},
				services: {},
			};

			if (commentlist) {

				Object.keys(commentlist).forEach((id) => {
					// host
					const host_key = commentlist[id].host_name;
					//console.log('commentlist[id]', commentlist[id]);
					// If this comment has a service_description then its not for hosts so skip it
					if (!commentlist[id].service_description) {
						if (commentlistObject.hosts.hasOwnProperty(host_key)) {
							commentlistObject.hosts[host_key].comments.push(commentlist[id]);
						} else {
							commentlistObject.hosts[host_key] = {
								comments: []
							};
							commentlistObject.hosts[host_key].comments.push(commentlist[id]);
						}
					}
					//service
					if (commentlist[id].comment_type === 2) {
						const service_key = `${commentlist[id].host_name}_${commentlist[id].service_description}`;
						if (commentlistObject.services.hasOwnProperty(service_key)) {
							commentlistObject.services[service_key].comments.push(commentlist[id]);
						} else {
							commentlistObject.services[service_key] = {
								comments: []
							};
							commentlistObject.services[service_key].comments.push(commentlist[id]);
						}
					}
				});

				// DEBUG the massaged commentlistObject
				// console.log('commentlist', commentlist);
				// console.log({commentlistObject});
			}

			// TODO: Optimization: only set this if it's different (which is rare)
			setCommentlist({
				error: false,
				errorCount: 0,
				errorMessage: '',
				lastUpdate: new Date().getTime(),
				response: commentlist, // this will always be a new ref each poll
				commentlistObject,
			});


		}).catch((error) => {
			if (signal?.aborted) {
				return;
			}
			handleFetchFail(setCommentlist, error, url, true);
		});
	};

	const fetchHostGroupData = (signal?: AbortSignal) => {

		if (useFakeSampleData) {
			return;
		}
		const url = buildNagiosUrl(clientSettings, 'hostgrouplist');

		getJson(
			url,
			{ timeout: 10 * 1000, signal }
		).then(response => {
			if (signal?.aborted) {
				return;
			}

			// Pluck out the hostgrouplist result
			const hostgroup = get(
				response.data.data,
				'hostgrouplist',
				{},
			) as Record<string, unknown>;

			setHostgroup({
				error: false,
				errorCount: 0,
				errorMessage: '',
				lastUpdate: new Date().getTime(),
				response: hostgroup
			});

		}).catch(error => {
			if (signal?.aborted) {
				return;
			}
			handleFetchFail(setHostgroup, error, url, true);
		});
	};

	const fetchServiceGroupData = (signal?: AbortSignal) => {

		if (useFakeSampleData) {
			return;
		}
		const url = buildNagiosUrl(clientSettings, 'servicegrouplist');

		getJson(
			url,
			{ timeout: 10 * 1000, signal }
		).then((response) => {
			if (signal?.aborted) {
				return;
			}

			// Pluck out the servicegrouplist result
			const servicegroup = get(
				response.data.data,
				'servicegrouplist',
				{},
			) as Record<string, unknown>;

			setServicegroup({
				error: false,
				errorCount: 0,
				errorMessage: '',
				lastUpdate: new Date().getTime(),
				response: servicegroup
			});

		}).catch(error => {
			if (signal?.aborted) {
				return;
			}
			handleFetchFail(setServicegroup, error, url, true);
		});
	};

	const fetchProgramStatus = (signal?: AbortSignal) => {

		const url = useFakeSampleData
			? './sample-data/programstatus.json'
			: buildNagiosUrl(clientSettings, 'programstatus');

		getJson(
			url,
			{ timeout: 10 * 1000, signal }
		).then(response => {
			if (signal?.aborted) {
				return;
			}

			// Pluck out the programstatus result
			const programstatus = get(
				response.data.data,
				'programstatus',
				null,
			) as ProgramStatus | null;

			setProgramStatus({
				error: false,
				errorCount: 0,
				errorMessage: '',
				lastUpdate: new Date().getTime(),
				response: programstatus,
			});

		}).catch(error => {
			if (signal?.aborted) {
				return;
			}
			handleFetchFail(setProgramStatus, error, url, true);
		});
	};

	fetchCommentDataRef.current = fetchCommentData;
	fetchHostGroupDataRef.current = fetchHostGroupData;
	fetchServiceGroupDataRef.current = fetchServiceGroupData;
	fetchProgramStatusRef.current = fetchProgramStatus;

	const requestKey = JSON.stringify([
		clientSettings.baseUrl,
		clientSettings.dataSource,
		clientSettings.livestatusPath,
		isDemoMode,
		useFakeSampleData,
	]);

	useCancellablePolling(fetchProgramStatusRef, {
		fallbackIntervalSeconds: clientSettingsInitial.fetchHostGroupFrequency,
		intervalSeconds: null,
		requestKey,
	});
	useCancellablePolling(fetchCommentDataRef, {
		enabled: !isDemoMode,
		fallbackIntervalSeconds: clientSettingsInitial.fetchCommentFrequency,
		intervalSeconds: fetchCommentFrequency,
		requestKey,
	});
	useCancellablePolling(fetchHostGroupDataRef, {
		enabled: !isDemoMode,
		fallbackIntervalSeconds: clientSettingsInitial.fetchHostGroupFrequency,
		intervalSeconds: fetchHostGroupFrequency,
		requestKey,
	});
	useCancellablePolling(fetchServiceGroupDataRef, {
		enabled: !isDemoMode,
		fallbackIntervalSeconds: clientSettingsInitial.fetchHostGroupFrequency,
		intervalSeconds: fetchHostGroupFrequency,
		requestKey,
	});

	//console.log('DashboardFetch render()');

	return (<div />);
};

export default DashboardFetch;
