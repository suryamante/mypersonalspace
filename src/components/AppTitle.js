import React from 'react';
import { Link } from 'react-router-dom';

const AppTitle = (props) => {
  return(
    <Link to={'/home'} className='link'>
      <div className='app-title'>
        <img src='logo.svg' className='icon'
          style={{width:'36px',height:'36px',marginRight:'4px'}}></img>
        <span>Mypersonalspace</span>
      </div>
    </Link>
  );
}

export default AppTitle;
