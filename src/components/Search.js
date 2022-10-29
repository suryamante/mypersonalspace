import React from 'react';
import {searchQuery} from './Utilities'

const Search = (props) => {
  const query = (event) => {
    let str = event.target.value.trim();
    if(str.length >= 3){
      setTimeout(async() => {
        let results = await searchQuery(str);
        console.log(results);
      },1000);
    }
  }
  return(
    <div className='header-search-layout' id='header-search-layout'>
      <input type='text' className='phone' placeholder='Search'
        style={{color: 'var(--root-color)', width: '100%', margin:'0px'}}
        onChange={query}/>
    </div>
  );
}

export default Search;
