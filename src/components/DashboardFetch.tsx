import { useEffect } from "react";
// State Management
import { useAtomValue, useSetAtom } from 'jotai';
import { bigStateAtom, clientSettingsAtom, clientSettingsInitial } from '../atoms/settingsState';
import { hostgroupAtom, servicegroupAtom } from '../atoms/hostgroupAtom';
import { commentlistAtom } from '../atoms/commentlistAtom';
// Libraries
import _ from 'lodash';
import axios from 'axios';
import { programStatusAtom } from "atoms/programAtom";
import { handleFetchFail, responseHasJsonContentType } from "helpers/axios";
// Types
import { CommentListObject } from "types/commentTypes";

const DashboardFetch = () => {

	const bigState = useAtomValue(bigStateAtom);
	const clientSettings = useAtomValue(clientSettingsAtom);
	const setHostgroup = useSetAtom(hostgroupAtom);
	const setServicegroup = useSetAtom(servicegroupAtom);
	const setCommentlist = useSetAtom(commentlistAtom);
	const setProgramStatus = useSetAtom(programStatusAtom)

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

		let url = '';
		if (useFakeSampleData) {
			url = './sample-data/commentlist.json';
		} else if (clientSettings.dataSource === 'livestatus') {
			url = clientSettings.livestatusPath + '?query=commentlist';
		} else {
			url = clientSettings.baseUrl + 'statusjson.cgi?query=commentlist&details=true';
		}

		axios.get(
			url,
			{ timeout: 10 * 1000, signal }
		).then((response) => {
			if (signal?.aborted) {
				return;
			}

			// test that return data is json
			if (!responseHasJsonContentType(response.headers)) {
				console.log('fetchCommentData() ERROR: got response but result data is not JSON. Base URL setting is probably wrong.');

				setCommentlist(curr => ({
					...curr,
					error: true,
					errorMessage: 'ERROR: Result data is not JSON. Base URL setting is probably wrong.'
				}));
				return;
			}

			// Pluck out the commentlist result
			const commentlist = _.get(response.data.data, 'commentlist', {});

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

		let url = '';
		if (useFakeSampleData) {
			return;
		} else if (clientSettings.dataSource === 'livestatus') {
			url = clientSettings.livestatusPath + '?query=hostgrouplist';
		} else {
			url = clientSettings.baseUrl + 'objectjson.cgi?query=hostgrouplist&details=true';
		}

		axios.get(
			url,
			{ timeout: 10 * 1000, signal }
		).then(response => {
			if (signal?.aborted) {
				return;
			}

			// test that return data is json
			if (!responseHasJsonContentType(response.headers)) {
				console.log('fetchHostGroupData() ERROR: got response but result data is not JSON. Base URL setting is probably wrong.');

				setHostgroup(curr => ({
					...curr,
					error: true,
					errorMessage: 'ERROR: Result data is not JSON. Base URL setting is probably wrong.'
				}));
				return;
			}

			// Pluck out the hostgrouplist result
			const hostgroup = _.get(response.data.data, 'hostgrouplist', {});

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

		let url = '';
		if (useFakeSampleData) {
			return;
		} else if (clientSettings.dataSource === 'livestatus') {
			url = clientSettings.livestatusPath + '?query=servicegrouplist';
		} else {
			url = clientSettings.baseUrl + 'objectjson.cgi?query=servicegrouplist&details=true';
		}

		axios.get(
			url,
			{ timeout: 10 * 1000, signal }
		).then((response) => {
			if (signal?.aborted) {
				return;
			}

			// test that return data is json
			if (!responseHasJsonContentType(response.headers)) {
				console.log('fetchServiceGroupData() ERROR: got response but result data is not JSON. Base URL setting is probably wrong.');

				setServicegroup(curr => ({
					...curr,
					error: true,
					errorMessage: 'ERROR: Result data is not JSON. Base URL setting is probably wrong.'
				}));
				return;
			}

			// Pluck out the servicegrouplist result
			const servicegroup = _.get(response.data.data, 'servicegrouplist', {});

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

		let url = '';
		if (useFakeSampleData) {
			url = './sample-data/programstatus.json';
		} else if (clientSettings.dataSource === 'livestatus') {
			url = clientSettings.livestatusPath + '?query=programstatus';
		} else {
			url = clientSettings.baseUrl + 'statusjson.cgi?query=programstatus';
		}

		axios.get(
			url,
			{ timeout: 10 * 1000, signal }
		).then(response => {
			if (signal?.aborted) {
				return;
			}

			// test that return data is json
			if (!responseHasJsonContentType(response.headers)) {
				console.log('fetchProgramStatus() ERROR: got response but result data is not JSON. Base URL setting is probably wrong.');

				setProgramStatus(curr => ({
					...curr,
					error: true,
					errorMessage: 'ERROR: Result data is not JSON. Base URL setting is probably wrong.'
				}));
				return;
			}

			// Pluck out the programstatus result
			const programstatus = _.get(response.data.data, 'programstatus', {});

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

	// useEffect
	useEffect(() => {
		//console.log('DashboardFetch useEffect()');
		let commentController: AbortController | null = null;
		let groupController: AbortController | null = null;
		let programController: AbortController | null = null;

		const runCommentFetch = () => {
			commentController?.abort();
			commentController = new AbortController();
			fetchCommentData(commentController.signal);
		};

		const runGroupFetches = () => {
			groupController?.abort();
			groupController = new AbortController();
			fetchHostGroupData(groupController.signal);
			fetchServiceGroupData(groupController.signal);
		};

		const runProgramFetch = () => {
			programController?.abort();
			programController = new AbortController();
			fetchProgramStatus(programController.signal);
		};

		// If we are in demo mode then exit here
		if (isDemoMode) {
			const demoTimeoutHandle = setTimeout(() => {
				runProgramFetch();
			}, 1000);
			return () => {
				clearTimeout(demoTimeoutHandle);
				programController?.abort();
			};
		}

		// fetch the initial data after 1 second
		const initialTimeoutHandle = setTimeout(() => {
			// fetch data now
			runProgramFetch();
			runGroupFetches();
			runCommentFetch();
		}, 1000);

		// safetly net in case the interval value is bad
		const fetchCommentFrequencySafe = (typeof fetchCommentFrequency === 'number' && fetchCommentFrequency >= 5) ? fetchCommentFrequency : clientSettingsInitial.fetchCommentFrequency;

		let intervalHandleComment = setInterval(() => {
			runCommentFetch();
		}, fetchCommentFrequencySafe * 1000);

		// safetly net in case the interval value is bad
		const fetchHostGroupFrequencySafe = (typeof fetchHostGroupFrequency === 'number' && fetchHostGroupFrequency >= 5) ? fetchHostGroupFrequency : clientSettingsInitial.fetchHostGroupFrequency;

		let intervalHandleHostGroup = setInterval(() => {
			runGroupFetches();
		}, fetchHostGroupFrequencySafe * 1000);

		//let intervalHandleVersionCheck = null;

		return () => {
			//console.log('DashboardFetch useEffect() teardown');
			clearTimeout(initialTimeoutHandle);
			if (intervalHandleComment) { clearInterval(intervalHandleComment); }
			if (intervalHandleHostGroup) { clearInterval(intervalHandleHostGroup); }
			commentController?.abort();
			groupController?.abort();
			programController?.abort();
			//if (intervalHandleVersionCheck) { clearInterval(intervalHandleVersionCheck); }
		};

	}, [
		clientSettings.baseUrl,
		clientSettings.dataSource,
		clientSettings.fetchCommentFrequency,
		clientSettings.fetchHostGroupFrequency,
		clientSettings.livestatusPath,
		isDemoMode,
		useFakeSampleData,
	]);

	//console.log('DashboardFetch render()');

	return (<div />);
};

export default DashboardFetch;
