import React, { useEffect } from "react";
// Recoil
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { bigStateAtom, clientSettingsAtom, clientSettingsInitial } from '../atoms/settingsState';
import { hostgroupAtom, servicegroupAtom } from '../atoms/hostgroupAtom';
import { commentlistAtom } from '../atoms/commentlistAtom';
// Libraries
import $ from 'jquery';
import _ from 'lodash';
import { programStatusAtom } from "atoms/programAtom";

const DashboardFetch = () => {

	const bigState = useRecoilValue(bigStateAtom);
	const clientSettings = useRecoilValue(clientSettingsAtom);
	const setHostgroup = useSetRecoilState(hostgroupAtom);
	const setServicegroup = useSetRecoilState(servicegroupAtom);
	const setCommentlist = useSetRecoilState(commentlistAtom);
	const setProgramStatus = useSetRecoilState(programStatusAtom)

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

	const handleFetchFail = (setFn, jqXHR, textStatus, errorThrown, url) => {
		if (jqXHR.status === 0) {
			// CONNECTION REFUSED
			setFn(curr => ({
				...curr,
				error: true,
				errorMessage: 'ERROR: CONNECTION REFUSED to ' + url
			}));
		} else {
			// UNKNOWN (add more errors here)
			setFn(curr => ({
				...curr,
				error: true,
				errorMessage: 'ERROR: ' + jqXHR.status + ' ' + errorThrown + ' - ' + url
			}));
		}
	};

	const fetchCommentData = () => {

		let url;
		if (useFakeSampleData) {
			return;
		} else if (clientSettings.dataSource === 'livestatus') {
			url = clientSettings.livestatusPath + '?query=commentlist';
		} else {
			url = clientSettings.baseUrl + 'statusjson.cgi?query=commentlist&details=true';
		}

		$.ajax({
			method: "GET",
			url,
			dataType: "json",
			timeout: 10 * 1000
		}).done((myJson, textStatus, jqXHR) => {

			// test that return data is json
			if (jqXHR.getResponseHeader('content-type').indexOf('application/json') === -1) {
				console.log('fetchCommentData() ERROR: got response but result data is not JSON. Base URL setting is probably wrong.');

				setCommentlist(curr => ({
					...curr,
					error: true,
					errorMessage: 'ERROR: Result data is not JSON. Base URL setting is probably wrong.'
				}));
				return;
			}

			// Pluck out the commentlist result
			const commentlist: Comment[] = myJson.data.commentlist;
			// Massage the commentlist so we have one key per hostname
			const commentlistObject = {
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


		}).fail((jqXHR, textStatus, errorThrown) => {
			handleFetchFail(setCommentlist, jqXHR, textStatus, errorThrown, url);
		});
	};

	const fetchHostGroupData = () => {

		let url;
		if (useFakeSampleData) {
			return;
		} else if (clientSettings.dataSource === 'livestatus') {
			url = clientSettings.livestatusPath + '?query=hostgrouplist';
		} else {
			url = clientSettings.baseUrl + 'objectjson.cgi?query=hostgrouplist&details=true';
		}

		$.ajax({
			method: "GET",
			url,
			dataType: "json",
			timeout: 10 * 1000
		}).done((myJson, textStatus, jqXHR) => {

			// test that return data is json
			if (jqXHR.getResponseHeader('content-type').indexOf('application/json') === -1) {
				console.log('fetchHostGroupData() ERROR: got response but result data is not JSON. Base URL setting is probably wrong.');

				setHostgroup(curr => ({
					...curr,
					error: true,
					errorMessage: 'ERROR: Result data is not JSON. Base URL setting is probably wrong.'
				}));
				return;
			}

			// Pluck out the hostgrouplist result
			const hostgroup = _.get(myJson.data, 'hostgrouplist', {});

			setHostgroup({
				error: false,
				errorCount: 0,
				errorMessage: '',
				lastUpdate: new Date().getTime(),
				response: hostgroup
			});

		}).fail((jqXHR, textStatus, errorThrown) => {
			handleFetchFail(setHostgroup, jqXHR, textStatus, errorThrown, url);
		});
	};

	const fetchServiceGroupData = () => {

		let url;
		if (useFakeSampleData) {
			return;
		} else if (clientSettings.dataSource === 'livestatus') {
			url = clientSettings.livestatusPath + '?query=servicegrouplist';
		} else {
			url = clientSettings.baseUrl + 'objectjson.cgi?query=servicegrouplist&details=true';
		}

		$.ajax({
			method: "GET",
			url,
			dataType: "json",
			timeout: 10 * 1000
		}).done((myJson, textStatus, jqXHR) => {

			// test that return data is json
			if (jqXHR.getResponseHeader('content-type').indexOf('application/json') === -1) {
				console.log('fetchServiceGroupData() ERROR: got response but result data is not JSON. Base URL setting is probably wrong.');

				setServicegroup(curr => ({
					...curr,
					error: true,
					errorMessage: 'ERROR: Result data is not JSON. Base URL setting is probably wrong.'
				}));
				return;
			}

			// Pluck out the hostgrouplist result
			const servicegroup = _.get(myJson.data, 'servicegrouplist', {});

			setServicegroup({
				error: false,
				errorCount: 0,
				errorMessage: '',
				lastUpdate: new Date().getTime(),
				response: servicegroup
			});

		}).fail((jqXHR, textStatus, errorThrown) => {
			handleFetchFail(setServicegroup, jqXHR, textStatus, errorThrown, url);
		});
	};

	const fetchProgramStatus = () => {

		let url;
		if (useFakeSampleData) {
			return;
		} else if (clientSettings.dataSource === 'livestatus') {
			url = clientSettings.livestatusPath + '?query=programstatus';
		} else {
			url = clientSettings.baseUrl + 'statusjson.cgi?query=programstatus';
		}

		$.ajax({
			method: "GET",
			url,
			dataType: "json",
			timeout: 10 * 1000
		}).done((myJson, textStatus, jqXHR) => {

			// test that return data is json
			if (jqXHR.getResponseHeader('content-type').indexOf('application/json') === -1) {
				console.log('fetchServiceGroupData() ERROR: got response but result data is not JSON. Base URL setting is probably wrong.');

				setServicegroup(curr => ({
					...curr,
					error: true,
					errorMessage: 'ERROR: Result data is not JSON. Base URL setting is probably wrong.'
				}));
				return;
			}

			setProgramStatus({
				error: false,
				errorCount: 0,
				errorMessage: '',
				lastUpdate: new Date().getTime(),
				response: myJson
			});

		}).fail((jqXHR, textStatus, errorThrown) => {
			handleFetchFail(setProgramStatus, jqXHR, textStatus, errorThrown, url);
		});
	};

	// useEffect
	useEffect(() => {
		//console.log('DashboardFetch useEffect()');

		// If we are in demo mode then exit here
		if (isDemoMode) {
			return;
		}

		// fetch the initial data after 1 second
		setTimeout(() => {
			// fetch data now
			fetchProgramStatus();
			fetchHostGroupData();
			fetchServiceGroupData();
			fetchCommentData();
		}, 1000);

		// safetly net in case the interval value is bad
		const fetchCommentFrequencySafe = (typeof fetchCommentFrequency === 'number' && fetchCommentFrequency >= 5) ? fetchCommentFrequency : clientSettingsInitial.fetchCommentFrequency;

		let intervalHandleComment = setInterval(() => {
			fetchCommentData();
		}, fetchCommentFrequencySafe * 1000);

		// safetly net in case the interval value is bad
		const fetchHostGroupFrequencySafe = (typeof fetchHostGroupFrequency === 'number' && fetchHostGroupFrequency >= 5) ? fetchHostGroupFrequency : clientSettingsInitial.fetchHostGroupFrequency;

		let intervalHandleHostGroup = setInterval(() => {
			fetchHostGroupData();
			fetchServiceGroupData();
		}, fetchHostGroupFrequencySafe * 1000);

		//let intervalHandleVersionCheck = null;

		return () => {
			//console.log('DashboardFetch useEffect() teardown');
			if (intervalHandleComment) { clearInterval(intervalHandleComment); }
			if (intervalHandleHostGroup) { clearInterval(intervalHandleHostGroup); }
			//if (intervalHandleVersionCheck) { clearInterval(intervalHandleVersionCheck); }
		};

	}, [clientSettings.fetchCommentFrequency, clientSettings.fetchHostGroupFrequency]);

	//console.log('DashboardFetch render()');

	return (<div />);
};

export default DashboardFetch;