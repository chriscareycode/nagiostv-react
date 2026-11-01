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
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import { Alert } from '../../types/hostAndServiceTypes';
import { DateTime } from 'luxon';
import { nagiosAlertState, nagiosAlertStateType } from '../../helpers/nagios';

export const MAX_LLM_QUESTION_LENGTH = 500;
const MAX_ALARM_FIELD_LENGTH = 300;
const MAX_ALARM_OUTPUT_LENGTH = 500;

// Keep useful diagnostic punctuation, including shell characters, as plain data.
// Remove terminal control sequences and invisible formatting that can hide text.
export const cleanLlmInput = (value: unknown, maxLength: number): string => {
	if (typeof value !== 'string') return '';
	return value
		.replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, '')
		.replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufeff]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()
		.slice(0, maxLength);
};

export const prepareAlarmForLlm = (alert: Alert, timeZone: string) => {
	const date = DateTime.fromMillis(alert.timestamp, { zone: timeZone });
	return {
		time: date.isValid ? date.toISO({ suppressMilliseconds: true }) : 'unknown',
		type: alert.object_type === 1 ? 'host' : 'service',
		host: cleanLlmInput(alert.object_type === 1 ? alert.name : alert.host_name, MAX_ALARM_FIELD_LENGTH),
		...(alert.object_type === 1 ? {} : { service: cleanLlmInput(alert.description, MAX_ALARM_FIELD_LENGTH) }),
		state: alert.state,
		stateLabel: nagiosAlertState(alert.state),
		stateType: alert.state_type,
		stateTypeLabel: nagiosAlertStateType(alert.state_type),
		description: cleanLlmInput(alert.description, MAX_ALARM_FIELD_LENGTH),
		output: cleanLlmInput(alert.plugin_output, MAX_ALARM_OUTPUT_LENGTH),
	};
};
