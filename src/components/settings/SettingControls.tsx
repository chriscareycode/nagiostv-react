import { ReactNode } from 'react';
import { BooleanSettingKey, SettingsChangeHandler } from './settingsTypes';

interface BooleanSettingRowProps {
	description?: ReactNode;
	falseLabel: string;
	onChange: SettingsChangeHandler;
	property: BooleanSettingKey;
	title: string;
	trueLabel: string;
	value: boolean;
}

export const BooleanSettingRow = ({
	description,
	falseLabel,
	onChange,
	property,
	title,
	trueLabel,
	value,
}: BooleanSettingRowProps) => (
	<tr>
		<th>{title}:</th>
		<td>
			<select
				aria-label={title}
				value={value.toString()}
				onChange={onChange(property, 'boolean')}
			>
				<option value="true">{trueLabel}</option>
				<option value="false">{falseLabel}</option>
			</select>
			{description && <>&nbsp;{description}</>}
		</td>
	</tr>
);
