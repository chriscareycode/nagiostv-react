import { ChangeEventHandler } from 'react';
import { ClientSettings } from '../../types/settings';

export type SettingInputType = 'boolean' | 'number' | 'string';

export type BooleanSettingKey = {
	[Key in keyof ClientSettings]: ClientSettings[Key] extends boolean ? Key : never;
}[keyof ClientSettings];

export type SettingsChangeHandler = (
	propName: keyof ClientSettings,
	dataType: SettingInputType,
) => ChangeEventHandler<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>;

export type SettingsValueSetter = <Key extends keyof ClientSettings>(
	propName: Key,
	value: ClientSettings[Key],
) => void;
