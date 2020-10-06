import React from 'react';
import './App.css';
import { RecoilRoot } from 'recoil';
import Base from './components/Base.jsx';

const App = () => {

  return (
    <div className="App">
      <RecoilRoot>
        <Base />
      </RecoilRoot>
    </div>
  );
  
};

export default App;
