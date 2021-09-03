import React, { useEffect, useState } from 'react';

// Recoil
import { useRecoilState, useRecoilValue } from 'recoil';
import { bigStateAtom, clientSettingsAtom } from '../atoms/settingsState';

import $ from 'jquery';
import Cookie from 'js-cookie';

const SettingsLoad = () => {
  
  //console.log('SettingsLoad run');

  const [bigState, setBigState] = useRecoilState(bigStateAtom);
  const [clientSettings, setClientSettings] = useRecoilState(clientSettingsAtom);
  

  const {
    isDemoMode,
    isDoneLoading,
    isLeftPanelOpen,
    settingsLoaded,
  } = bigState;

  const {
    fontSizeEm,
    hideFilters,
    hideHistoryChart,
  } = clientSettings;

  /* ************************************************************************************ */
   /* settings related functions such as fetching settings from server, and loading cookie
   /* ************************************************************************************ */
 
   /* ************************************************************************************
   the approach I'm going to take with settings is to first load the settings from the server.
   either the settings load, or they fail. in either case I then check for cookie and apply 
   those over top. so cookie settings will override server settings. There will be a delete
   cookie button to help clear any local settings once server side settings become established. */
   /* ************************************************************************************ */
 
   const loadSettingsFromUrl = () => {

    const urlParams = new URLSearchParams(window.location.search);
    const urlObject = {};

    for (var item of urlParams) {
      //console.log('key: ' + item[0] + ', ' + 'value: ' + item[1]);

      // special handling for when the value is true or false
      // handle other special cases like this for other data types
      if (item[1] === 'true') {
        urlObject[item[0]] = true;
      } else if (item[1] === 'false') {
        urlObject[item[0]] = false;
      } else {
        urlObject[item[0]] = item[1];
      }
    }

    //console.log('urlObject', urlObject);

    setClientSettings(curr => ({
      ...curr,
      ...urlObject
    }));

    setBigState(curr => ({
      ...curr,
      isDoneLoading: true
    }));
  };

   const getCookie = () => {
    // do not load the cookie in demo mode
    if (isDemoMode) {
      setBigState(curr => ({
        ...curr,
        isDoneLoading: true
      }));
      //this.setState({ isDoneLoading: true });
      return;
    }

    const cookie = Cookie.get('settings');
    //console.log('settings Cookie is', cookie);
    if (!cookie) {
      setBigState(curr => ({
        ...curr,
        isDoneLoading: true
      }));
      //this.setState({ isDoneLoading: true });
      return;
    }

    let cookieObject = {};
    try {
      cookieObject = JSON.parse(cookie);
      //console.log('Got coookie', cookieObject);
    } catch (e) {
      //console.log('No cookie');
    }
    if (cookieObject) {
      console.log('Found cookie. Loading settings:', cookieObject);
      
      setClientSettings(curr => ({
        ...curr,
        ...cookieObject
      }));

      setBigState(curr => ({
        ...curr,
        isCookieLoaded: true
      }));

      loadSettingsFromUrl();

    }
  };

   const getRemoteSettings = () => {
    const url = 'client-settings.json?v=' + new Date().getTime();

    $.ajax({
      method: "GET",
      url,
      dataType: "json",
      timeout: 10 * 1000
    }).done((myJson, textStatus, jqXHR) => {

      // test that return data is json
      if (jqXHR.getResponseHeader('content-type').indexOf('application/json') === -1) {
        console.log('getRemoteSettings() parse ERROR: got response but result data is not JSON. Skipping server settings.');
        
        getCookie();
        return;
      }

      // Got good server settings
      console.log('Found server default settings client-settings.json - Loading default settings:', myJson);

      // save settings to client settings state
      setClientSettings(curr => ({
        ...curr,
        ...myJson
      }));

      // update a boolean so we know settings were loaded
      setBigState(curr => ({
        ...curr,
        isRemoteSettingsLoaded: true
      }));

      // Now that we have loaded remote settings, load the cookie and overwrite settings with cookie
      // getCookie() is then going to call loadSettingsFromUrl()
      getCookie();      

    }).catch((err) => {
      console.log('getRemoteSettings() ajax ERROR:', err);
      console.log('Skipping server settings.');
      getCookie();
    });
  }; 

  useEffect(() => {
    //console.log('SettingsLoad useEffect()');

    getRemoteSettings();

    return () => {
      //console.log('SettingsLoad useEffect() teardown');
    };
  }, []);

  return (<></>);
};

function memoFn(prev, next) {
  //console.log('SettingsLoad memoFn', prev, next);
  return true; // do not update
}

export default React.memo(SettingsLoad, memoFn);