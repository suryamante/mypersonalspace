import React from 'react';
import UserProfile from './UserProfile';
import LeftNavigation from './LeftNavigation';
import AppTitle from './AppTitle';
import Search from './Search';

const Header = (props) => {
  const onclick = (event) => {
    let leftNavigation = document.getElementById('left-navigation');
    if(event.target !== leftNavigation){
      toggleNavigation(false);
    }
  }
  const toggleNavigation = (bool = true) => {
    let leftNavigation = document.getElementById('left-navigation');
    let delay = 0;
    if(!bool) delay = 300;
    setTimeout(() => {
      leftNavigation.classList.toggle('show');
    },delay);
    if(bool){
      leftNavigation.classList.add('left-navigation-out');
      leftNavigation.classList.remove('left-navigation-in');
      setTimeout(() => {
        window.addEventListener('click', onclick);
      },100);
      window.escapeStack.unshift({
        action: () => {
          toggleNavigation(false);
        }
      });
    }else{
      window.escapeStack[0] = undefined;
      leftNavigation.classList.remove('left-navigation-out');
      leftNavigation.classList.add('left-navigation-in');
      window.removeEventListener('click', onclick);
    }
  }

  return(
    <React.Fragment>
      <div className='header' id='header'>
        <button className='left-navigation-show-button' onClick={toggleNavigation}>
          <svg class='icon menu-icon' viewBox="0 0 24 24">
            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" fill='currentColor'>
            </path>
          </svg>
        </button>
        <AppTitle/>
      </div>
      <div className='left-navigation' id='left-navigation'>
        <LeftNavigation toggleNavigation={toggleNavigation}/>
      </div>
    </React.Fragment>
  );

}

export default Header;
