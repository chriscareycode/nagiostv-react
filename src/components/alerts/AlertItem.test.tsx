/**
 * NagiosTV https://nagiostv.com
 * Copyright (C) 2008-2025 Chris Carey https://chriscarey.com
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

import { Provider, createStore } from 'jotai';
import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { hostAliasAtom } from 'atoms/hostAliasAtom';
import { clientSettingsInitial } from 'atoms/settingsState';
import { Alert } from 'types/hostAndServiceTypes';
import AlertItem from './AlertItem';

it('shows a service host alias while keeping the hostname visible', () => {
	const store = createStore();
	store.set(hostAliasAtom, { host_one: 'Server Room One' });
	const alert: Alert = {
		name: '', host_name: 'host_one', timestamp: Date.now(), state: 4,
		state_type: 1, description: 'Disk', plugin_output: 'Warning', object_type: 2,
	};
	render(
		<Provider store={store}>
			<AlertItem
				e={alert} i={0} prevtime={0} isDemoMode={false}
				settings={{ ...clientSettingsInitial, showHostAlias: true }}
				language="English" locale="en" dateFormat="fff"
			/>
		</Provider>,
	);
	expect(screen.getByText('host_one Server Room One')).toBeInTheDocument();
	expect(screen.getByText('Disk')).toBeInTheDocument();
});
