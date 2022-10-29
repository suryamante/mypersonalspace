import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './components/App';
import Login from './components/Login';
import { app, auth, onAuthStateChanged, signOut} from './components/Config';

onAuthStateChanged(auth, (user) => {
  if(user){
    window.user = user;
    ReactDOM.render(
      <React.StrictMode>
        <App/>
      </React.StrictMode>,
      document.getElementById('root')
    );
  }else{
    ReactDOM.render(
      <React.StrictMode>
        <Login/>
      </React.StrictMode>,
      document.getElementById('root')
    );
  }
});
