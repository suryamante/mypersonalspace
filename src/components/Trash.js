import React, {useEffect} from 'react';
import {updateNavigationActiveLink} from './Utilities';

const Trash = (props) => {
  useEffect(() => {
    updateNavigationActiveLink('trash');
  });
  return(<h1>Trash</h1>);
}

export default Trash;
