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

import { useState } from 'react';
import { translate } from '../../helpers/language';

import AlertItem from './AlertItem';
import QuietFor from './QuietFor';

import { Alert } from 'types/hostAndServiceTypes';
import { ClientSettings } from 'types/settings';
import { useAtomValue } from 'jotai';
import { alertSearchTextAtom } from '../../atoms/alertAtom';
// CSS
import '../animation.css';
import '../services/ServiceItems.css';
import './AlertItems.css';

interface AlertItemsProps {
	items: Alert[];
	settings: ClientSettings;
	isDemoMode: boolean;
}

const AlertItems = ({ items, settings, isDemoMode }: AlertItemsProps) => {

	const alertSearchText = useAtomValue(alertSearchTextAtom);

	const [howManyToRender, setHowManyToRender] = useState(100);
	const pageSize = 100;

	const showMore = () => {
		setHowManyToRender(prev => prev + pageSize);
	};

	const showLess = () => {
		setHowManyToRender(prev => prev - pageSize);
	};

	const filteredHistoryArray = items.filter(item => {
		if (settings.hideAlertSoft) {
			if (item.state_type === 2) { return false; }
		}
		// search filter
		if (alertSearchText) {
			const searchLower = alertSearchText.toLowerCase();
			const matchesSearch =
				(item.name && item.name.toLowerCase().includes(searchLower)) ||
				(item.host_name && item.host_name.toLowerCase().includes(searchLower)) ||
				(item.description && item.description.toLowerCase().includes(searchLower)) ||
				(item.plugin_output && item.plugin_output.toLowerCase().includes(searchLower));
			if (!matchesSearch) {
				return false;
			}
		}
		return true;
	});

	let trimmedItems = [...filteredHistoryArray];
	trimmedItems.length = howManyToRender;
	const { language, locale, dateFormat } = settings;

	return (
			<div className="AlertItems">
				{/* always show one quiet for (if we have at least 1 item) */}
				{items.length > 1 &&
					<QuietFor
						nowtime={new Date().getTime()}
						prevtime={items[0].timestamp}
						//showEmoji={settings.showEmoji}
						language={language}
					/>
				}

				{/* loop through the trimmed items */}
				{trimmedItems.map((e, i) => {
					const host = (e.object_type === 1 ? e.name : e.host_name);
					const prevtime = (i > 0 ? items[i - 1].timestamp : 0);
					return (
						<AlertItem
							key={'alert-' + host + '-' + e.object_type + '-' + e.timestamp + '-' + i}
							e={e}
							i={i}
							prevtime={prevtime}
							//showEmoji={showEmoji}
							language={language}
							locale={locale}
							dateFormat={dateFormat}
							settings={settings}
							isDemoMode={isDemoMode}
						/>
					);
				})}

				<div className="ShowMoreArea">
					{howManyToRender > pageSize &&
						<span>
							<button className="uppercase-first" onClick={showLess}>{translate('show less', language)}</button>
						</span>
					}
					{items.length > howManyToRender &&
						<span>
							<button className="uppercase-first" onClick={showMore}>{translate('show more', language)}</button>
						</span>
					}
				</div>
			</div>
	);
};

export default AlertItems;
