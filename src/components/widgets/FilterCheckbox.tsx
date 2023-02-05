/**
 * NagiosTV https://nagiostv.com
 * Copyright (C) 2008-2023 Chris Carey https://chriscarey.com
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

import './FilterCheckbox.css';

const FilterCheckbox = ({
  stateName,
  filterName,
  hideFilters,
  defaultChecked,
  howMany,
  howManyText,
  handleCheckboxChange,
}) => {

  const clicky = e => {
    handleCheckboxChange(e, stateName, 'checkbox');
  };
  
  let classN = 'Checkbox uppercase ' + filterName;
  //if (howMany) { classN += ' dim'; }
  if (hideFilters) { classN += ' checkbox-hidden'; }
  if (!defaultChecked) { classN += ' checkbox-unchecked'; }

  return (
    <label className={classN} onClick={clicky}>
      <span>
        <input type="checkbox" defaultChecked={defaultChecked}  />
        <span className={'checkbox-value'}>{howMany}</span> <span>{howManyText}</span>
      </span>
    </label>
  );
  
};

export default FilterCheckbox;
