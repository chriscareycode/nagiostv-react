import React, { useEffect } from "react";
// Recoil
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { bigStateAtom, clientSettingsAtom } from '../atoms/settingsState';
import { hostgroupAtom } from '../atoms/hostgroupAtom';
import { commentlistAtom } from '../atoms/commentlistAtom';
// Libraries
import $ from 'jquery';

const DashboardFetch = () => {

  const bigState = useRecoilValue(bigStateAtom);
  const clientSettings = useRecoilValue(clientSettingsAtom);
  const setHostgroup = useSetRecoilState(hostgroupAtom);
  const setCommentlist = useSetRecoilState(commentlistAtom);

  // Chop the bigState into vars
  const {
    isDemoMode,
    useFakeSampleData,
  } = bigState;

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
        errorMessage: 'ERROR: ' + jqXHR.status +  ' ' + errorThrown + ' - ' + url
      }));
    }
  };

  const fetchCommentData = () => {
 
    let url;
    if (useFakeSampleData) {
      return;
    } else if (clientSettings.dataSource === 'livestatus') {
      url = clientSettings.livestatusPath + '?query=commentlist&details=true';
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
      const commentlist = myJson.data.commentlist;
      
      setCommentlist({
        error: false,
        errorCount: 0,
        errorMessage: '',
        lastUpdate: new Date().getTime(),
        response: commentlist
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
      url = clientSettings.livestatusPath + '?query=hostgrouplist&details=true';
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
      fetchHostGroupData();
      fetchCommentData();
    }, 1000);

    let intervalHandleComment = setInterval(() => {
      fetchCommentData();
    }, clientSettings.fetchCommentFrequency * 1000);

    let intervalHandleHostGroup = setInterval(() => {
       fetchHostGroupData();
     }, clientSettings.fetchHostGroupFrequency * 1000);

    //let intervalHandleVersionCheck = null;

    return () => {
      //console.log('DashboardFetch useEffect() teardown');
      if (intervalHandleComment) { clearInterval(intervalHandleComment); }
      if (intervalHandleHostGroup) { clearInterval(intervalHandleHostGroup); }
      //if (intervalHandleVersionCheck) { clearInterval(intervalHandleVersionCheck); }
    };

  }, []);

  //console.log('DashboardFetch render()');

  return <div />;
};

export default DashboardFetch;