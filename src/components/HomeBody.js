import React, {useState, useEffect} from 'react';
import ReactLoading from 'react-loading';
import {db, collection, doc, getDoc, getDocs, query, limit, startAfter, ref,storage,getDownloadURL,
orderBy} from './Config';
import Path from './Path';
import {fetchThumbnail, showAlert, b64toBlob, loading, assembleOptionMenu, dismissOptionMenu,
uploadFolder, uploadFiles, openSecuredfolder, deleteSelectedFiles, downloadSelectedFiles,
assembleSelectionMenu, getReferenceFromPath, queryToFirebase, fetchDirectoryData, checkFilesSelection,
updateFileSelection, addToCover, displayPicture, deleteFiles, downloadFiles, getBackground, updateTitle,
delayByXMs, updateAnimCords, progressWindow, copySelectedFiles, filterList}
from './Utilities';
import AddFiles from './AddFiles';

const Body = (props) => {
  const [state, setState] = useState({
    path: props.filepath,
    fileCounter: window.userData.settings.filesFetchCount ?
    window.userData.settings.filesFetchCount : 10,
    parent: null,
    isSelecting: false,
    moveOrCopy: true,
    isCopying: false,
    isMoving: false
  });
  useEffect(() => {
    setState({
      ...state,
      path: props.filepath
    });
  },[props.filepath]);
  const refreshHomeBody = () => {
    setState({
      ...state
    });
  }
  {window.userData.refreshHomeBody = refreshHomeBody;}
  const updatePath = (newPath) => {
    let loc = newPath[newPath.length - 1];
    window.PATHS[loc] = newPath;
    setState({
      ...state,
      path: newPath,
      parent: null
    });
    if(window.location.pathname.substr(1) != loc){
      window.history.pushState({},'',loc);
    }
  }
  const isCopying = (bool) => {
    setState({
      ...state,
      isCopying: bool
    });
  }
  const isMoving = (bool) => {
    setState({
      ...state,
      isMoving: bool
    });
  }
  {window.updatePath = updatePath;}
  const fileSelecting = (status=false) => {
    if(!status){
      let files = state.parent['Files'];
      for(let file in files){
        files[file].selected = false;
      }
      window.userData.filesSelected = 0;
    }
    setState({
      ...state,
      isSelecting: status
    });
  }
  const openFolder = (fileId) => {
    let newPath = [];
    Object.assign(newPath, state.path);
    delete state.path;
    newPath.push(fileId);
    updatePath(newPath);
  }
  const pushDisplayPictureStateToHistory = (fileId) => {
    window.PATHS[fileId] = state.path;
    if(window.location.pathname.substr(1) != fileId){
      window.history.pushState({},'',fileId);
    }
  }
  const addFileToList = async(fileId, file, name) => {
    if(document.getElementById(fileId))return;
    let homeData = document.getElementById('home-data');
    const fileClicked = (event) => {
      if(event.target !== newFile)return;
      updateAnimCords(event);
      const open = () => {
        if(file.file_type == 'folder'){
          openFolder(fileId);
        }else if(file.file_type.includes('image')){
          pushDisplayPictureStateToHistory(fileId);
          updateAnimCords(event);
          displayPicture(file, fileId);
        }else if(file.file_type.includes('video')){
          pushDisplayPictureStateToHistory(fileId);
          updateAnimCords(event);
          displayPicture(file, fileId);
        }else{
          showAlert('No preview available');
        }
      }
      if(state.isCopying || state.isMoving){
        if(file.password){
          openSecuredfolder({
            openFolder:open,
            password:file.password,
            file:file,
            event:event
          });
        }else{
          open();
        }
      }else if(state.isSelecting){
        if(file.file_type == 'folder'){
          showAlert('You can not select or delete any folder');
        }else{
          if(file.selected){
            file.selected = false;
            let countofSelectedFiles = checkFilesSelection(state.parent['Files']);
            if(countofSelectedFiles == 0){
              fileSelecting(false);
            }else{
              updateFileSelection(newFile, false);
            }
          }else{
            file.selected = true;
            updateFileSelection(newFile, true);
          }
        }
      }else{
        if(file.password){
          openSecuredfolder({
            openFolder:open,
            password:file.password,
            file:file,
            event:event
          });
        }else{
          open();
        }
      }
    }
    let newFile = document.createElement('div');
    newFile.id = fileId;
    newFile.title = file.name;
    if(file.selected){
      newFile.classList.add('s-cover');
    }else{
      newFile.classList.remove('s-cover');
    }
    newFile.classList.add('file');
    newFile.classList.add(getBackground(file.file_type));
    newFile.onmouseenter = (event) => {
      if(!state.isSelecting)options.classList.remove('hide');
    }
    newFile.onmouseleave = () => {
      if(window.innerWidth > 700)options.classList.add('hide');
    }

    let options = document.createElement('span');
    options.classList.add('option-button');
    options.classList.add('file-options');
    if(window.innerWidth > 700){
      options.classList.add('hide');
    }
    const optionsClick = (x,y) => {
      const params = {
        fileName: fileName,
        path: state.path,
        fileId: fileId,
        parent: state.parent,
        fileType: file.file_type,
        fileSize: file.file_size,
        lastAccessedDate: file.last_accessed_date,
        deleteFile: deleteF,
        downloadFile: download,
        x:x,
        y:y,
        file: file,
        fileClicked: () => {
          newFile.click();
        },
        fileSelecting: fileSelecting,
        newFile: newFile,
        isSelecting: state.isSelecting,
        isCopying: isCopying,
        isMoving: isMoving
      }
      if(!state.isSelecting && !state.isCopying && !state.isMoving){
        assembleOptionMenu(params);
      }
    }
    options.onclick = (event) => {
      updateAnimCords(event);
      optionsClick(event.clientX, event.clientY);
    }
    newFile.appendChild(options);
    newFile.oncontextmenu = (event) => {
      event.preventDefault();
      updateAnimCords(event);
      optionsClick(event.clientX, event.clientY);
    };

    let deleteF = document.createElement('span');
    deleteF.onclick = async(event) => {
      let files = {};
      files[newFile.id] = file;
      showAlert('Deleting...');
      window.onGoingProgress = {
        stop: false,
        progress: 0
      }
      progressWindow({
        title: 'Deleting...'
      });
      await deleteFiles(files, state.path, state.parent);
      showAlert('Deleted');
      homeData.removeChild(newFile);
    }

    let download = document.createElement('span');
    download.onclick = async(event) => {
      window.onGoingProgress = {
        stop: false,
        progress: 0
      }
      progressWindow({
        title: 'Downloading...'
      });
      showAlert('Downloading...');
      let files = {};
      files[fileId] = file;
      await downloadFiles(files);
      showAlert('Downloaded successfully');
    }

    let fileName = document.createElement('span');
    fileName.innerHTML = file.name;
    fileName.classList.add('file-name');
    newFile.appendChild(fileName);
    homeData.appendChild(newFile);
    newFile.onclick = fileClicked;
    fileName.onclick = fileClicked;

    if(file.file_type != 'folder'){
      if((file.file_type.includes('image') || file.file_type.includes('video')) &&
          window.userData.settings.showThumbnails){
        await fetchThumbnail(fileId, state.path, newFile, fileName);
      }
    }
  }
  const addFilesToList = async(files, name) => {
    for (let fileId in files) {
      await addFileToList(fileId, files[fileId], name);
    }
  }
  const updateParent = (parent) => {
    setState({
      ...state,
      parent: parent
    });
  }
  const loadMore = async() => {
    if(state.parent.nomoredocs)return;
    let homeData = document.getElementById('home-data');
    let loadingbar = loading({color:'dodgerblue',size:40});
    homeData.appendChild(loadingbar);
    let q = null;
    if(state.parent.lastFileSnapshot){
      q = query(state.parent.ref,
        orderBy('last_accessed_date', 'desc'),
        startAfter(state.parent.lastFileSnapshot),
        limit(state.fileCounter));
    }else{
      q = query(state.parent.ref,
        orderBy('last_accessed_date', 'desc'),
        limit(state.fileCounter));
    }
    let snapshot = await getDocs(q);
    let files = {};
    snapshot.forEach((doc) => {
      state.parent['Files'][doc.id] = doc.data();
      files[doc.id] = doc.data();
    });
    if(snapshot.docs.length > 0){
      state.parent.lastFileSnapshot = snapshot.docs.length > 0 ?
      snapshot.docs[snapshot.docs.length-1] : null;
      try{
        homeData.removeChild(loadingbar);
      }catch(error){};
      await addFilesToList(files, state.parent.name);
    }else{
      state.parent.nomoredocs = true;
    }
    try{
      homeData.removeChild(loadingbar);
    }catch(error){};
  }
  const dropHandler = async(event) => {
    event.preventDefault();
    if(event.dataTransfer.files){
      uploadFiles(event.dataTransfer.files, state.path, state.parent, refreshHomeBody);
    }
  }
  const selectAllFiles = async() => {
    let files = state.parent['Files'];
    let countofSelectedFiles = 0;
    for(let file in files){
      let f = files[file];
      if(f.file_type != 'folder'){
        countofSelectedFiles++;
        f.selected = true;
      }
    }
    window.userData.filesSelected = countofSelectedFiles;
    window.escapeStack.unshift({
      action: () => {
        fileSelecting(false);
      }
    });
    fileSelecting(true);
  }
  const _assembleSelectionMenu = (event) => {
      updateAnimCords(event);
      const funCaller = (fun) => {
        fun(state.parent, refreshHomeBody, state.path, fileSelecting);
      }
      assembleSelectionMenu({
        selectAllFiles: () => {
          selectAllFiles();
        },
        copySelectedFiles: () => {
          window.userData.filesCopying = {};
          window.userData.copyFromPath = state.path;
          window.userData.copyFromParent = state.parent;
          isCopying(true);
        },
        moveSelectedFiles: () => {
          window.userData.filesCopying = {};
          window.userData.copyFromPath = state.path;
          window.userData.copyFromParent = state.parent;
          window.userData.isMoving = true;
          isMoving(true);
        },
        downloadSelectedFiles: () => {
          funCaller(downloadSelectedFiles);
        },
        deleteSelectedFiles: () => {
          funCaller(deleteSelectedFiles);
        },
        x: event.clientX,
        y: event.clientY,
        isCopying: isCopying,
        path: state.path,
        parent: state.parent
      });
  }
  const _filterList = (event) => {
    filterList(event,{
      path: state.path,
      parent: state.parent,
      refreshHomeBody: refreshHomeBody
    });
  }
  useEffect(() => {
    document.getElementById('home-data').innerHTML = '';
    fetchDirectoryData(state.path, state.fileCounter, state.parent, updateParent, addFilesToList);
  });
  useEffect(() => {
    if(state.parent){
      let elem = document.getElementById('home-body');
      elem.onscroll = (event) => {
        if(Math.abs(event.target.scrollHeight-event.target.scrollTop-event.target.clientHeight) <= 1){
          let loadingbar = document.getElementById('load-more-bar');
          if(!loadingbar){
            loadMore();
          }
        }
      }
    }
  },[state.parent]);
  useEffect(() => {
    try {
      updateTitle(state.parent.name);
    } catch (e) {}
  });
  useEffect(() => {
    const onKeyDown = async(event) => {
      let countofSelectedFiles = checkFilesSelection(state.parent['Files']);
      if((event.ctrlKey && (event.key == 'A' || event.key == 'a')) || (event.key == 'Delete')){
        if(event.ctrlKey && (event.key == 'A' || event.key == 'a') && countofSelectedFiles > 0){
          selectAllFiles();
          if(window.userData.filesSelected > 0)fileSelecting(true);
        }else if(event.key == 'Delete' && countofSelectedFiles > 0){
          deleteSelectedFiles(state.parent, refreshHomeBody, state.path, fileSelecting);
        }
      }
    }
    const onPaste = (event) => {
      // console.log(event.clipboardData.files);
      // uploadFiles(event.dataTransfer.files, state.path, state.parent, refreshHomeBody);
    }
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('paste', onPaste);
    if(state.parent == null) return
    window.addEventListener('paste', onPaste);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('paste', onPaste);
    }
  },[state.parent]);

  return(
    <div className='home-body' id='home-body' onDrop={dropHandler}
      onDragOver={(e) => e.preventDefault()}>
      {
        state.isSelecting?
        <div className='path top-bar'>
          <span className='option-button' onClick={_assembleSelectionMenu}></span>
          <span className='option-button download'
            onClick={(event) => {
              updateAnimCords(event);
              downloadSelectedFiles(state.parent, refreshHomeBody, state.path, fileSelecting);
            }}></span>
          <span className='option-button delete'
            onClick={(event) => {
              updateAnimCords(event);
              deleteSelectedFiles(state.parent, refreshHomeBody, state.path,
                 fileSelecting);
            }}></span>
          <span id='window-userdata-files-selected' style={{
              marginRight:'20px',
              fontSize: '1.2em'
            }}>{window.userData.filesSelected}</span>
          <span className='option-button close' title='Close'
            onClick={() => fileSelecting(false)}></span>
        </div>
        :
        state.path ?
        <Path path={state.path} updatePath={updatePath}
          refreshHomeBody={refreshHomeBody} _filterList={_filterList}/>
        :null
      }
      <div className='home-data' id='home-data'></div>
      <div className='load-more' onClick={loadMore}>Load more</div>
      {
        state.isCopying ?
        <div className='move-here toast-layout'>
          Copy here
          <button className='btn' id='cancel-copy-ops' style={{marginLeft:'20px'}}
            onClick={() => isCopying(false)}>CANCEL</button>
          <button className='btn' style={{marginLeft:'10px',marginRight:'-20px'}}
            onClick={() => {
              isCopying(false);
              copySelectedFiles(state.parent, refreshHomeBody, state.path, fileSelecting);
            }}>COPY</button>
        </div>
        :state.isMoving ?
        <div className='move-here toast-layout'>
          Move here
          <button className='btn' id='cancel-copy-ops' style={{marginLeft:'20px'}}
            onClick={() => isMoving(false)}>CANCEL</button>
          <button className='btn' style={{marginLeft:'10px',marginRight:'-20px'}}
            onClick={() => {
              isMoving(false);
              copySelectedFiles(state.parent, refreshHomeBody, state.path, fileSelecting, true);
            }}>MOVE</button>
        </div>
        :null
      }
      {state.parent != null?<AddFiles path={state.path} parent={state.parent}
      refreshHomeBody={refreshHomeBody}/>:null}
    </div>
  );
};

export default Body;
