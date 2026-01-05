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

/**
 * useQueryParams Hook - Usage Examples
 * 
 * This hook provides a convenient way to sync component state with URL query parameters
 * using the qs library for parsing and stringifying.
 * 
 * Basic Usage:
 * ------------
 * 
 * import { useQueryParams } from '../hooks/useQueryParams';
 * 
 * const MyComponent = () => {
 *   const queryParams = useQueryParams();
 * 
 *   // Get a single parameter
 *   const sortOrder = queryParams.get('sortOrder'); // returns string | undefined
 * 
 *   // Get all parameters as an object
 *   const allParams = queryParams.getAll(); // returns { [key: string]: any }
 * 
 *   // Set one or more parameters
 *   queryParams.set({ sortOrder: 'newest', filter: 'active' });
 * 
 *   // Remove a parameter
 *   queryParams.remove('sortOrder');
 * 
 *   // Remove multiple parameters
 *   queryParams.remove(['sortOrder', 'filter']);
 * 
 *   // Clear all parameters
 *   queryParams.clear();
 * 
 *   // Get query string
 *   const queryString = queryParams.toString();
 * };
 * 
 * 
 * Example: Syncing a Select Dropdown with URL
 * -------------------------------------------
 * 
 * const FilterComponent = () => {
 *   const queryParams = useQueryParams();
 *   const [filter, setFilter] = useState('all');
 * 
 *   const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
 *     const newValue = e.target.value;
 *     setFilter(newValue);
 *     queryParams.set({ filter: newValue });
 *   };
 * 
 *   return (
 *     <select value={filter} onChange={handleChange}>
 *       <option value="all">All</option>
 *       <option value="active">Active</option>
 *       <option value="inactive">Inactive</option>
 *     </select>
 *   );
 * };
 * 
 * 
 * Example: Syncing a Checkbox Filter with URL
 * -------------------------------------------
 * 
 * const CheckboxFilter = () => {
 *   const queryParams = useQueryParams();
 *   const [showHidden, setShowHidden] = useState(false);
 * 
 *   const handleCheckboxChange = (e: ChangeEvent<HTMLInputElement>) => {
 *     const isChecked = e.target.checked;
 *     setShowHidden(isChecked);
 *     
 *     if (isChecked) {
 *       queryParams.set({ showHidden: 'true' });
 *     } else {
 *       queryParams.remove('showHidden');
 *     }
 *   };
 * 
 *   return (
 *     <label>
 *       <input 
 *         type="checkbox" 
 *         checked={showHidden} 
 *         onChange={handleCheckboxChange} 
 *       />
 *       Show Hidden Items
 *     </label>
 *   );
 * };
 * 
 * 
 * Example: Multiple Filters with URL Sync
 * ----------------------------------------
 * 
 * const MultiFilterComponent = () => {
 *   const queryParams = useQueryParams();
 *   const [settings, setSettings] = useAtom(settingsAtom);
 * 
 *   const handleFilterChange = (filterName: string, value: string | boolean) => {
 *     // Update local state
 *     setSettings(prev => ({
 *       ...prev,
 *       [filterName]: value
 *     }));
 * 
 *     // Update URL
 *     queryParams.set({ [filterName]: value });
 *   };
 * 
 *   return (
 *     <div>
 *       <select onChange={(e) => handleFilterChange('sortOrder', e.target.value)}>
 *         <option value="newest">Newest First</option>
 *         <option value="oldest">Oldest First</option>
 *       </select>
 * 
 *       <input 
 *         type="checkbox" 
 *         onChange={(e) => handleFilterChange('hideResolved', e.target.checked)}
 *       />
 *     </div>
 *   );
 * };
 * 
 * 
 * Example: Reading URL Parameters on Component Mount
 * ---------------------------------------------------
 * 
 * const ComponentWithURLState = () => {
 *   const queryParams = useQueryParams();
 *   const [settings, setSettings] = useAtom(settingsAtom);
 * 
 *   useEffect(() => {
 *     // Read URL parameters on mount and sync with state
 *     const sortOrder = queryParams.get('sortOrder');
 *     const hideResolved = queryParams.get('hideResolved');
 * 
 *     if (sortOrder) {
 *       setSettings(prev => ({ ...prev, sortOrder }));
 *     }
 * 
 *     if (hideResolved !== undefined) {
 *       setSettings(prev => ({ ...prev, hideResolved: hideResolved === 'true' }));
 *     }
 *   }, []);
 * 
 *   // ... rest of component
 * };
 * 
 * 
 * Notes:
 * ------
 * - The hook uses react-router-dom's useSearchParams under the hood
 * - By default, set() and remove() use replace mode (replace: true) to avoid polluting browser history
 * - Set replace: false if you want each change to create a new history entry
 * - Null and undefined values are automatically filtered out when setting params
 * - The qs library handles encoding/decoding of special characters automatically
 */

export {};
