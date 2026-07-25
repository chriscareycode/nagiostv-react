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

import { memo } from 'react';
import { ClientSettings } from 'types/settings';
import './CustomLogo.css';

interface CustomLogoProps {
	settings: ClientSettings;
}

const CustomLogo = memo(({ settings }: CustomLogoProps) => (
	<div className="CustomLogo">
		<img alt="custom logo" src={settings.customLogoUrl} />
	</div>
), (previousProps, nextProps) => (
	previousProps.settings.customLogoEnabled === nextProps.settings.customLogoEnabled
	&& previousProps.settings.customLogoUrl === nextProps.settings.customLogoUrl
));

CustomLogo.displayName = 'CustomLogo';

export default CustomLogo;
