import React, {useEffect, useState} from 'react';
import {updateNavigationActiveLink, updateSettings, showAlert} from './Utilities';

const Settings = (props) => {
  useEffect(() => {
    updateNavigationActiveLink('settings');
  });
  const toggleMode = async(event) => {
    let root = document.getElementById('root');
    root.classList.toggle('light-mode');
    root.classList.toggle('dark-mode');
    if(window.userData.settings.theme){
      window.userData.settings.theme = false;
      await updateSettings({
        theme: false
      });
      event.target.innerHTML = 'Light';
    }else{
      window.userData.settings.theme = true;
      await updateSettings({
        theme: true
      });
      event.target.innerHTML = 'Dark';
    }
    showAlert('Updated successfully');
  }
  const showThumbnails = async(event) => {
    if(window.userData.settings.showThumbnails){
      window.userData.settings.showThumbnails = false;
      await updateSettings({
        showThumbnails: false
      });
      event.target.innerHTML = 'Show';
    }else{
      window.userData.settings.showThumbnails = true;
      await updateSettings({
        showThumbnails: true
      });
      event.target.innerHTML = 'Do not show';
    }
    showAlert('Updated successfully');
  }
  const toggleAdminMode = (event) => {
    if(window.userData.settings.adminMode){
      window.userData.settings.adminMode = false;
      event.target.innerHTML = 'Turn on';
    }else{
      window.userData.settings.adminMode = true;
      event.target.innerHTML = 'Turn off';
    }
    showAlert('Updated successfully');
  }
  const updateFilesFetchCount = async() => {
    let fetchCount = document.getElementById('files-fetch-count');
    let count = fetchCount.value.trim();
    count = Number(count);
    if(Number.isInteger(count) && count > 0 && count <= 500){
      window.userData.settings.filesFetchCount = count;
      await updateSettings({
        filesFetchCount: count
      });
      fetchCount.placeholder = count;
      fetchCount.value = '';
      showAlert('Updated successfully');
    }else{
      showAlert('Invalid number');
    }
  }
  return(
    <div className='home-body' id='settings'>
      <div>
        <span style={{marginRight:'50px'}}>Theme</span>
        <button className='btn btn-sm' onClick={toggleMode}>
          {window.userData.settings.theme ? 'dark' : 'light'}
        </button>
      </div>
      <hr style={{border:'1px solid rgba(30,144,255,.1)'}}/>
      <div>
        <span style={{marginRight:'50px'}}>Thumbnails</span>
        <button className='btn btn-sm' onClick={showThumbnails}>
          {window.userData.settings.showThumbnails ? 'Do not show' : 'Show'}
        </button>
      </div>
      <hr style={{border:'1px solid rgba(30,144,255,.1)'}}/>
      <div>
        <span style={{marginRight:'50px'}}>Admin mode</span>
        <button className='btn btn-sm' onClick={toggleAdminMode}>
          {window.userData.settings.adminMode ? 'Turn off' : 'Turn on'}
        </button>
      </div>
      <hr style={{border:'1px solid rgba(30,144,255,.1)'}}/>
      <div>
        <span style={{marginRight:'50px'}}>Fetch count</span>
        <input className='phone-layout phone' id='files-fetch-count'
          placeholder={window.userData.settings.filesFetchCount}
          onKeyUp={(event) => event.key == 'Enter' ? updateFilesFetchCount() : null}/>
        <button className='btn btn-sm' onClick={updateFilesFetchCount}>
          Set
        </button>
      </div>
    </div>
  );
}

export default Settings;
