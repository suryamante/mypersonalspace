import React, {useState, useEffect} from 'react';
import ReactDOM from 'react-dom';
import './style.css';

const App = () => {
	const loading = (params) => {
	  let loadingbar = document.createElement('div');
	  loadingbar.id = 'load-more-bar';
	  loadingbar.style.height = '24px';
	  loadingbar.style.width = '24px';
	  loadingbar.innerHTML = `<svg class="svg" width="50" height="50" viewBox="0 0 44 44" role="status"><circle class="circle" cx="22" cy="22" r="20" fill="none" stroke="dodgerblue" stroke-width="3"></circle></svg>`;
	  if(params){
	    if(params.size){
	      loadingbar.style.height = `${params.size}px`;
	      loadingbar.style.width = `${params.size}px`;
	    }
	    if(params.color){
	      loadingbar.style.fill = params.color;
	    }
	  }
	  return loadingbar;
	}
	useEffect(() => {
		document.getElementById('resume').appendChild(loading({

		}));
	})
	return (
		<div className='resume' id='resume'></div>
	);
}

export default App;
