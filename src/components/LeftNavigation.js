import React from 'react';
import {auth, signOut} from './Config';
import AppTitle from './AppTitle';
import { Link } from 'react-router-dom';
import {logOut} from './Utilities';

const LeftNavigation = (props) => {
  return(
    <React.Fragment>
      <button className='left-navigation-show-button'
        id='left-navigation-close-button' onClick={() => props.toggleNavigation(false)}>
        <svg viewBox="0 0 24 24" class='icon back-icon'><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill='currentColor'></path></svg>
      </button>
      <AppTitle/>
      <ul className='left-navigation-menu'>
        <Link to='/' className='link'>
          <li className='active' id='home-link'>
            <svg viewBox="0 0 24 24" class='icon' style={{marginRight:'5px'}}><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" fill='currentColor'></path></svg>
            Home
          </li>
        </Link>
        <Link to='/recent' className='link'>
          <li id='recent-link'>
            <svg viewBox="0 0 24 24" class='icon' style={{marginRight:'5px'}}><path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z" fill='currentColor'></path></svg>
            Recent
          </li>
        </Link>
        <Link to='/trash' className='link'>
          <li id='trash-link'>
            <svg viewBox="0 0 24 24" class='icon' style={{marginRight:'5px'}}><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zm2.46-7.12 1.41-1.41L12 12.59l2.12-2.12 1.41 1.41L13.41 14l2.12 2.12-1.41 1.41L12 15.41l-2.12 2.12-1.41-1.41L10.59 14l-2.13-2.12zM15.5 4l-1-1h-5l-1 1H5v2h14V4z" fill='currentColor'></path></svg>
            Trash
          </li>
        </Link>
        <Link to='/settings' className='link'>
          <li id='settings-link'>
            <svg viewBox="0 0 24 24" class='icon' style={{marginRight:'5px'}}><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" fill='currentColor'></path></svg>
            Settings
          </li>
        </Link>
        <li onClick={logOut}>
          <svg viewBox="0 0 24 24" class='icon' style={{marginRight:'5px'}}><path d="m17 7-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" fill='currentColor'></path></svg>
          Logout
        </li>
      </ul>

      <ul className='left-navigation-menu' style={{fontSize:'20px',marginLeft:'5px', fontWeight:'500'}}>Spaces
        <li onClick={() => window.open('https://mypersonalspace1-68112.web.app', '_blank')}>
          <img src='logo.svg' style={{width:'24px', marginRight:'5px'}}></img>
          mypersonalspace1
        </li>
	     <li onClick={() => window.open('https://mypersonalspace2-9a0ab.web.app', '_blank')}>
          <img src='logo.svg' style={{width:'24px', marginRight:'5px'}}></img>
          mypersonalspace2
        </li>
        <li onClick={() => window.open('https://mypersonalspace3-e11e7.web.app', '_blank')}>
          <img src='logo.svg' style={{width:'24px', marginRight:'5px'}}></img>
          mypersonalspace3
        </li>
	<li onClick={() => window.open('https://mypersonalspace4-89b98.web.app', '_blank')}>
          <img src='logo.svg' style={{width:'24px', marginRight:'5px'}}></img>
          mypersonalspace4
        </li>
	<li onClick={() => window.open('https://mypersonalspace5.web.app', '_blank')}>
          <img src='logo.svg' style={{width:'24px', marginRight:'5px'}}></img>
          mypersonalspace5
        </li>
      </ul>
    </React.Fragment>
  );
}
export default LeftNavigation;
