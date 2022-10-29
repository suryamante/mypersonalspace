import React, {useEffect} from 'react';
import {updateNavigationActiveLink} from './Utilities';

const Recent = (props) => {
  useEffect(async() => {
    updateNavigationActiveLink('recent');
  },[]);
  return(<h1>Recent</h1>);
}

export default Recent;
