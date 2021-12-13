// Recoil
import { useRecoilState, useRecoilValue } from 'recoil';
import { bigStateAtom, clientSettingsAtom } from '../../atoms/settingsState';

import './SelectedItem.css';

export default function SelectedItem() {

  const [bigState, setBigState] = useRecoilState(bigStateAtom);
  const clientSettings = useRecoilValue(clientSettingsAtom);

  const testSet = () => {
    setBigState(curr => ({
      ...curr,
      selectedItem: {
        name: 'test'
      },
    }));
  };
  const testClear = () => {
    setBigState(curr => ({
      ...curr,
      selectedItem: {},
    }));
  };

  const isSelectedItem = bigState.selectedItem && bigState.selectedItem.name;

  return (
    <div className="SelectedItem">
      SelectedItem


      <button onClick={testSet}>Set</button>
      <button onClick={testClear}>Clear</button>

      {isSelectedItem && <div>bigState.selectedItem.name</div>}
    </div>
  );
}