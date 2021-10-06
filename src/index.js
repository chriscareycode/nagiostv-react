/**
 * NagiosTV https://nagiostv.com
 * Copyright (C) 2008-2021 Chris Carey https://chriscarey.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

// Fix for IE11 - This must be the first line in src/index.js
import 'react-app-polyfill/ie11';
import 'react-app-polyfill/stable';

import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
//import registerServiceWorker from './registerServiceWorker';

// Delete caches caused by the registerServiceWorker.
// TODO: remove this from the project after a few versions.
// Just to help clear out any client side cache that's hard as heck to clear.
// Clear cache in the browser does not do it.

// This is actually causing a crash on Windows (Cant remember Chrome or FF)
// With a security error message (TODO: repro and write it down here)
// The line that crashes is the caches.keys(), even though it's in a try catch!?

// try {
//   caches.keys().then(function(names) {
//     for (let name of names)
//       caches.delete(name);
//   });
// } catch (e) {
//   console.log('Had a problem clearing the serviceWorker cache.');
// }


ReactDOM.render(<App />, document.getElementById('root'));
//registerServiceWorker();
