import Body from './HomeBody';
import React, {useEffect} from 'react';
import {updateNavigationActiveLink} from './Utilities';
const Home = (props) => {
  window.userData.space.loading = true;
  useEffect(() => {
    updateNavigationActiveLink('home');
  });
  return(
    <div className='home' id='home'>
      <Body filepath={props.filepath}/>
    </div>
  );
}
export default Home;
