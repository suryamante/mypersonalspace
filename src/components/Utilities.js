import {db, collection, addDoc, storage, ref, uploadBytes, doc, deleteDoc, deleteObject,
getDownloadURL, getDoc, setDoc, getDocs, writeBatch, updateDoc, deleteField,
query, limit, orderBy, auth, signOut, startAfter, where, startAt} from './Config';
import imageCompression from 'browser-image-compression';
export const showAlert = (message, delay=5000) => {
  try {
    let root = getRoot();
    let child = document.createElement('div');
    child.id = 'toast-layout';
    child.classList.add('toast-layout');
    child.classList.add('toast-anim-1');
    let title = document.createElement('div');
    title.innerHTML = message;
    child.appendChild(title);
    root.appendChild(child);
    setTimeout(() => {
      child.classList.remove('toast-anim-1');
    },100);
    setTimeout(() => {
      child.classList.add('toast-anim-2');
      setTimeout(() => {
        try {
          root.removeChild(child);
        } catch (e) {}
      },50);
    },delay);
  } catch (e) {}
}
const readFileAsDataURL = async(compressedFile) => {
  return await new Promise((resolve, reject) => {
    var fileReader = new FileReader();
    fileReader.onload = resolve;
    fileReader.onerror = reject;
    fileReader.readAsDataURL(compressedFile);
  }).then((event) => {
    return event.target.result;
  }).catch((error) => {});
}
const compress = async(file, maxSizeMB = 0, maxWidthOrHeight = 0) => {
  return await imageCompression(file, {
      maxSizeMB: maxSizeMB,
      maxWidthOrHeight: maxWidthOrHeight,
      maxIteration: 2,
      useWebWorker: true
  });
}
const getVideoThumbnail = async(file) => {
  let video = document.createElement('video');
  let thumbnail = null;
  await new Promise((resolve, reject) => {
    video.src = URL.createObjectURL(file);
    video.onloadeddata = resolve;
  }).then((event) => {
    let canvas = document.createElement('canvas');
    canvas.setAttribute('height', video.videoHeight + 'px');
    canvas.setAttribute('width', video.videoWidth + 'px');
    canvas.getContext('2d').drawImage(video, 0, 0, video.videoWidth,
      video.videoHeight);
    let base64Data = canvas.toDataURL();
    thumbnail = b64toBlob(base64Data,'image/png',512);
  }).catch((error) => {});
  thumbnail = await compress(thumbnail, 0.1, 400);
  return await readFileAsDataURL(thumbnail);
}
const uploadToDatabase = async(documentData, parentReference) => {
  let data = {};
  Object.assign(data, documentData);
  delete data.file;
  delete data.thumbnail;
  let documentId = await addDoc(parentReference, data);
  return documentId.id;
}
const uploadFileToStorage = async(file) => {
  if(file.path){
    let documentData = {
      file_size: file.file.size,
      file_status: 'live',
      file_type: file.file.type,
      name: file.file.name,
      last_accessed_date: new Date().getTime().toString(),
      file: file.file
    }
    let parentReference = collection(db,`personalspaces${getReferenceFromPath(file.path)}`);
    if(documentData.file.type.includes('image')){
      if(documentData.file.docompress){
        if(documentData.file.size > 700000){
          documentData.file = await compress(documentData.file, 0.5, 1080);
          documentData.file_size = documentData.file.size;
        }
      }
      documentData.thumbnail = await compress(documentData.file, 0.1, 400);
      documentData.hasthumbnail = true;
      documentData.thumbnail = await readFileAsDataURL(documentData.thumbnail);
    }else if(documentData.file.type.includes('video')){
      documentData.hasthumbnail = true;
      documentData.thumbnail = await getVideoThumbnail(documentData.file);
    }
    if(!documentData.file.type.includes('video')){
      documentData.file = await readFileAsDataURL(documentData.file);
      documentData.file = encryptData(documentData.file, window.userData.encryptionKey);
      documentData.file = new Blob([documentData.file], {type: "text/plain;charset=utf-8"});
      documentData.file_size = documentData.file.size;
    }
    let documentId = await uploadToDatabase(documentData, parentReference);
    if(documentData.hasthumbnail){
      await setDoc(
        doc(db, `users/${'qSIGQDSIqNTw6X06CFXcdWfTA2N2'}/thumbnails`,documentId),
        {
          thumbnail: documentData.thumbnail
        }
      );
    }
    let storageReference = ref(storage, documentId);
    await uploadBytes(storageReference, documentData.file).then((snapshot) => {
      delete documentData.file;
      file.parent['Files'][documentId] = documentData;
      file.progress.classList.add('done');
    });
  }
}
const uploadFilesToStorage = async(refreshHomeBody) => {
  for(let file of window.userData.filesUploading){
    await uploadFileToStorage(file);
  }
  let len = window.userData.filesUploading.length;
  window.userData.filesUploading = [];
  document.getElementById('upload-files-container-status').innerHTML =
  len == 1 ? '1 file has been uploaded successfully' :
  `${len} files has been uploaded successfully` ;
  refreshHomeBody();
}
const appendFilesToList = async(files, dataList, path, parent) => {
  for(let file of files){
    let newFile = document.createElement('div');
    newFile.classList.add('new-file');
    let fileName = document.createElement('span');
    fileName.innerHTML = file.name;
    fileName.classList.add('file-name');
    newFile.appendChild(fileName);
    let progress = document.createElement('span');
    progress.classList.add('progress');
    progress.classList.add('close');
    progress.onclick = (event) => {
      if(!progress.classList.contains('done')){
        dataList.removeChild(newFile);
      }
    }
    newFile.appendChild(progress);
    dataList.appendChild(newFile);
    window.userData.filesUploading.push({
      file: file,
      path: path,
      parent: parent,
      domFile: newFile,
      progress: progress
    });
  }
}
const previewFiles = (files) => {
  return new Promise((accept,reject) => {
    let dialogue = document.createElement('div');
    dialogue.classList.add('create-folder-dialogue');
    dialogue.classList.add('preview-files-dialogue');
    let compress = document.createElement('input');
    compress.type = 'checkbox';
    compress.checked = true;
    dialogue.appendChild(compress);
    let label = document.createElement('label');
    label.innerHTML = 'Compress photos';
    label.style.fontSize = '.9em';
    label.style.marginRight = '20px';
    label.onclick = (event) => compress.checked = !compress.checked;
    dialogue.appendChild(label);
    let uploadButton = document.createElement('button');
    uploadButton.classList.add('btn');
    uploadButton.classList.add('btn-sm');
    uploadButton.innerHTML = 'Upload';
    uploadButton.onclick = (event) => {
      if(compress.checked){
        for(let file of files){
          file.docompress = true;
        }
      }
      removeCover();
      accept(files);
    }
    dialogue.appendChild(uploadButton);
    addCover(dialogue);
  }).then((files) => {
    return files;
  }).catch(() => {});
}
export const uploadFiles = async(files, path, parent, refreshHomeBody) => {
  files = await previewFiles(files);
  let root = getRoot();
  let uploadFilesContainer = document.getElementById('upload-files-container');
  if(uploadFilesContainer){
    let len = window.userData.filesUploading.length + files.length;
    document.getElementById('upload-files-container-status').innerHTML =
    len == 1 ? '1 file is being uploaded' : `${len} files are being uploaded` ;
    let oldLen = window.userData.filesUploading.length;
    appendFilesToList(files, document.getElementById('upload-files-container-data-list'),
     path, parent);
    if(oldLen === 0){
      Array.prototype.push.apply(window.userData.filesUploading,files);
      await uploadFilesToStorage(refreshHomeBody);
    }
  }else{
    uploadFilesContainer = document.createElement('div');
    uploadFilesContainer.classList.add('upload-files-container');
    uploadFilesContainer.id = 'upload-files-container';
    root.appendChild(uploadFilesContainer);

    let closeContainer = document.createElement('span');
    closeContainer.classList.add('close');
    closeContainer.onclick = (event) => {
      root.removeChild(uploadFilesContainer);
      window.userData.filesUploading = [];
    }
    uploadFilesContainer.appendChild(closeContainer);

    let temp = document.createElement('div');
    temp.classList.add('flex');
    temp.classList.add('row');
    uploadFilesContainer.appendChild(temp);

    let status = document.createElement('span');
    status.classList.add('short-status');
    status.id = 'upload-files-container-status';
    let len = files.length;
    status.innerHTML = len == 1 ? '1 file is being uploaded' :
    `${len} files are being uploaded` ;
    temp.appendChild(status);

    let maxMinContainer = document.createElement('span');
    maxMinContainer.classList.add('max-min-container');
    maxMinContainer.classList.add('max');
    maxMinContainer.onclick = (event) => {
      const animate = (bH, aH) => {
        dataList.animate(
          [
            {height:`${bH}px`},
            {height:`${aH}px`}
          ],
          {
            duration: 100
          }
        );
      }
      if(maxMinContainer.classList.contains('max')){
        dataList.style.display = 'flex';
        animate(0,dataList.offsetHeight);
      }else if(maxMinContainer.classList.contains('min')){
        animate(dataList.offsetHeight,0);
        setTimeout(() => {
          dataList.style.display = 'none';
        },90);
      }
      maxMinContainer.classList.toggle('max');
      maxMinContainer.classList.toggle('min');
    }
    temp.appendChild(maxMinContainer);

    let dataList = document.createElement('div');
    dataList.id = 'upload-files-container-data-list';
    dataList.classList.add('data-list');
    uploadFilesContainer.appendChild(dataList);

    window.userData.filesUploading = [];
    appendFilesToList(files, dataList, path, parent);
    await uploadFilesToStorage(refreshHomeBody);
  }
}
const uploadFolderToStorage = async(tempPath, folderName, directory, parent, refreshHomeBody) => {
  let documentReference = getReferenceFromPath(tempPath);
  documentReference = collection(db,`personalspaces${documentReference}`);
  try {
    let data = {
      file_status: 'live',
      file_type: 'folder',
      name: folderName,
      last_accessed_date: new Date().getTime().toString()
    };
    documentReference = await addDoc(documentReference,data);
    parent['Files'][documentReference.id] = data;
    parent['Files'][documentReference.id]['Files'] = {};
    refreshHomeBody();
    let files = [];
    let newPath = [];
    Object.assign(newPath, tempPath);
    newPath.push(documentReference.id);
    for(let folderName in directory){
      if(directory[folderName]['$is_folder']){
        await uploadFolderToStorage(newPath, folderName, directory[folderName],
          parent['Files'][documentReference.id], refreshHomeBody);
      }else if(!directory[folderName]['$is_folder'] && folderName != '$is_folder'){
        files.push(directory[folderName]);
      }
    }
    if(files.length > 0){
      await uploadFiles(files, newPath, parent['Files'][documentReference.id],
          refreshHomeBody);
    }
  } catch (e) {}
}
export const uploadFolder = async(files, path, parent, refreshHomeBody) => {
  let directory = {};
  for(let file of files){
    let parent = [];
    let fileName = null;
    let path = file.webkitRelativePath;
    let i = 0;
    while(i < path.length){
      let dir = '';
      while(i < path.length && path.charAt(i) != '/'){
        dir += path.charAt(i);
        i++;
      }
      if(i < path.length){
        parent.push(dir);
        i++;
      }else{
        fileName = dir;
      }
    }
    let tempDir = directory;
    for(let p of parent){
      if(!tempDir[p]){
        tempDir[p] = {$is_folder:true};
      }
      tempDir = tempDir[p];
    }
    tempDir[file.name] = file;
  }
  if(files.length == 0){
    showAlert('Cannot upload an empty folder');
  }
  let tempPath = [];
  Object.assign(tempPath, path);
  for(let folderName in directory){
    await uploadFolderToStorage(tempPath, folderName, directory[folderName],
      parent, refreshHomeBody);
  }
}
export const createFolderDialogue = (refresh, path, parent) => {
  const uploadCreatedFolder = async(folderName) => {
    let documentReference = collection(db,`personalspaces${getReferenceFromPath(path)}`);
    try {
      let data = {
        file_status: 'live',
        file_type: 'folder',
        name: folderName,
        last_accessed_date: new Date().getTime().toString()
      };
      documentReference = await addDoc(documentReference,data);
      {
        let reference = doc(db, `users/${window.user.uid}/filepaths`, documentReference.id);
        await setDoc(reference, {
          filepath: `${getReferenceFromPath(path).substr(1)}/${documentReference.id}`
        });
      }
      parent['Files'][documentReference.id] = data;
      showAlert('Folder created successfully');
      refresh();
      removeCover();
    } catch (e) {}
  }
  inputConfirmationBox({
    inputType: 'text',
    buttonText: 'Create',
    updatingText: 'Creating...',
    action: uploadCreatedFolder,
    inputPlaceholder: 'Folder name'
  });
}
export const b64toBlob = (b64Data, contentType='', sliceSize=512) => {
  let i = 0;
  while(i < b64Data.length && b64Data.charAt(i) != ','){
    i++;
  }
  b64Data =b64Data.substr(i+1);
  const byteCharacters = window.atob(b64Data);
  const byteArrays = [];
  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  const blob = new Blob(byteArrays, {type: contentType});
  return blob;
}
export const decryptData = (msg, key) => {
  let result = '';
  try {
    let m = 0;
    let k = 0;
    while(m < msg.length){
      if(msg.charCodeAt(m) <= 256){
        result += String.fromCharCode(msg.charCodeAt(m)-key.charCodeAt(k));
      }else{
        result += msg[m];
      }
      m++;
      k++;
      if(k >= key.length){
        k = 0;
      }
    }
  } catch (e) {}
  return result;
}

export const encryptData = (msg,key) => {
  let result = '';
  try {
    let m = 0;
    let k = 0;
    while(m < msg.length){
      if(msg.charCodeAt(m) <= 256){
        result += String.fromCharCode(msg.charCodeAt(m)+key.charCodeAt(k));
      }else{
        result += msg[m];
      }
      m++;
      k++;
      if(k >= key.length){
        k = 0;
      }
    }
  } catch (e) {}
  return result;
}
export const fetchThumbnail = async(fileId, path, newFile, fileName) => {
  let reference = getReferenceFromPath(path);
  let {files,parent} = getCurrentDirectory(window.userData.space[path[0]], path);
  let file = files[fileId];
  if(file.hasthumbnail){
    if(file.thumbnail == undefined){
      let documentReference = doc(db, `users/${'qSIGQDSIqNTw6X06CFXcdWfTA2N2'}/thumbnails`,fileId);
      let data = await getDoc(documentReference);
      if(data.exists()){
        data = data.data();
        if(data.thumbnail){
          file.thumbnail = data.thumbnail;
        }else{
          file.hasthumbnail = false;
          return;
        }
      }else{
        return;
      }
    }
    newFile.style.backgroundSize = 'cover';
    newFile.style.minHeight = '150px';
    newFile.style.maxHeight = '200px';
    newFile.style.backgroundImage = `url(${file.thumbnail})`;
  }
}
export const updateNavigationActiveLink = (target) => {
  console.log(target);
  try {
    if(target != 'home'){
      let child = document.getElementById('header-search-layout');
      child.classList.add('hide');
    }else{
      let child = document.getElementById('header-search-layout');
      child.classList.remove('hide');
    }
  } catch (e) {}
  let home = document.getElementById('home-link');
  let recent = document.getElementById('recent-link');
  let trash = document.getElementById('trash-link');
  let settings = document.getElementById('settings-link');
  const toggle = (bool, params) => {
    for(let p of params){
      if(bool) p.classList.add('active');
      else p.classList.remove('active');
    }
  }
  switch (target) {
    case 'home':
      toggle(true, [home]);
      toggle(false, [recent, trash, settings]);
      break;
    case 'recent':
      toggle(true, [recent]);
      toggle(false, [home, trash, settings]);
      break;
    case 'trash':
      toggle(true, [trash]);
      toggle(false, [home, recent, settings]);
      break;
    case 'settings':
      toggle(true, [settings]);
      toggle(false, [home, recent, trash]);
      break;
  }
}
const applyLoadingAnimation = async() => {
  try{
    while (true){
        let circle = document.getElementById('circle');
        if(circle == undefined) break;
        await delayByXMs(1500);
        circle.style.stroke = 'red';
        await delayByXMs(1500);
        circle.style.stroke = 'green';
        await delayByXMs(1500);
        circle.style.stroke = 'dodgerblue';
      }
  }catch(e){console.log(e)}
}
export const loading = (params) => {
  let loadingbar = document.createElement('div');
  loadingbar.id = 'load-more-bar';
  loadingbar.style.height = '24px';
  loadingbar.style.width = '24px';
  loadingbar.innerHTML = `<svg class="svg" width="50" height="50" viewBox="0 0 44 44" role="status"><circle class="circle" id='circle' cx="22" cy="22" r="20" fill="none" stroke="dodgerblue" stroke-width="4"></circle></svg>`;
  // loadingbar.innerHTML = `<svg viewBox="0 0 32 32"><circle cx="16" cy="3" r="0"><animate attributeName="r" values="0;3;0;0" dur="1s" repeatCount="indefinite" begin="0" keySplines="0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8" calcMode="spline"></animate></circle><circle transform="rotate(45 16 16)" cx="16" cy="3" r="0"><animate attributeName="r" values="0;3;0;0" dur="1s" repeatCount="indefinite" begin="0.125s" keySplines="0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8" calcMode="spline"></animate></circle><circle transform="rotate(90 16 16)" cx="16" cy="3" r="0"><animate attributeName="r" values="0;3;0;0" dur="1s" repeatCount="indefinite" begin="0.25s" keySplines="0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8" calcMode="spline"></animate></circle><circle transform="rotate(135 16 16)" cx="16" cy="3" r="0"><animate attributeName="r" values="0;3;0;0" dur="1s" repeatCount="indefinite" begin="0.375s" keySplines="0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8" calcMode="spline"></animate></circle><circle transform="rotate(180 16 16)" cx="16" cy="3" r="0"><animate attributeName="r" values="0;3;0;0" dur="1s" repeatCount="indefinite" begin="0.5s" keySplines="0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8" calcMode="spline"></animate></circle><circle transform="rotate(225 16 16)" cx="16" cy="3" r="0"><animate attributeName="r" values="0;3;0;0" dur="1s" repeatCount="indefinite" begin="0.625s" keySplines="0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8" calcMode="spline"></animate></circle><circle transform="rotate(270 16 16)" cx="16" cy="3" r="0"><animate attributeName="r" values="0;3;0;0" dur="1s" repeatCount="indefinite" begin="0.75s" keySplines="0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8" calcMode="spline"></animate></circle><circle transform="rotate(315 16 16)" cx="16" cy="3" r="0"><animate attributeName="r" values="0;3;0;0" dur="1s" repeatCount="indefinite" begin="0.875s" keySplines="0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8" calcMode="spline"></animate></circle><circle transform="rotate(180 16 16)" cx="16" cy="3" r="0"><animate attributeName="r" values="0;3;0;0" dur="1s" repeatCount="indefinite" begin="0.5s" keySplines="0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8" calcMode="spline"></animate></circle></svg>`;
  //
  if(params){
    if(params.size){
      loadingbar.style.height = `${params.size}px`;
      loadingbar.style.width = `${params.size}px`;
    }
    if(params.color){
      loadingbar.style.fill = params.color;
    }
  }
  // loadingbar.style.transform = 'translateX(50%) translateY(50%)';
  loadingbar.style.margin = 'auto';
  setTimeout(() => {
    applyLoadingAnimation();
  },100);
  return loadingbar;
}
const secureWithPassword = (params) => {
  const secure = async(password) => {
    password = password.trim();
    if(password.length > 0){
      let documentReference = doc(db,`personalspaces${getReferenceFromPath(params.path)}`,
      params.fileId);
      try {
        let data = {
          password: password
        };
        await setDoc(documentReference, data, {merge:true});
        params.parent['Files'][params.fileId].password = password;
        showAlert('Secured successfully');
        removeCover();
      } catch (e) {}
    }
  }
  inputConfirmationBox({
    inputType: 'text',
    buttonText: 'Secure',
    updatingText: 'Securing...',
    action: secure,
    inputPlaceholder: 'password'
  });
}
const unsecureWithPassword = async(params) => {
  let documentReference = doc(db,`personalspaces${getReferenceFromPath(params.path)}`,
  params.fileId);
  await updateDoc(documentReference,{
    password: deleteField()
  })
  delete params.parent['Files'][params.fileId].password;
  showAlert(`Password protection removed successfully`);
}
const verifyAdmin = async(id, ps, verifyButton, adminId, adminPassword, title, params) => {
  let documentReference = doc(db,`security`,'BM9gWNU64n7DaqDHKPdi');
  try {
    let data = await getDoc(documentReference);
    if(data.exists()){
      data = data.data();
      if(id == data.adminid && ps == data.adminpassword){
        window.userData.settings.adminverified = true;
        showAlert('Authorized successfully');
        if(params.file.password){
          removeCover();
          unsecureWithPassword(params);
        }else{
          secureWithPassword(params);
        }
      }else{
        showAlert('Incorrect credentials');
        verifyButton.innerHTML = 'Verify';
      }
    }
  } catch (e) {}
}
export const secureFileOrFolderDialogue = (params) => {
  if(window.userData.settings.adminverified){
    if(params.file.password){
      removeCover();
      unsecureWithPassword(params);
    }else{
      secureWithPassword(params);
    }
  }else{
    verifyAdminDialogue(params);
  }
}
const verifyAdminDialogue = (params) => {
  let dialogue = document.createElement('div');
  dialogue.classList.add('create-folder-dialogue');
  dialogue.classList.add('secure-folder-dialogue');
  let title = document.createElement('div');
  title.style.marginRight = 'auto';
  title.style.marginBottom = '10px';
  title.innerHTML = 'Authorize yourself';
  title.classList.add('title');
  dialogue.appendChild(title);
  let adminId = document.createElement('input');
  adminId.type = 'text';
  adminId.classList.add('phone-layout');
  adminId.classList.add('phone');
  adminId.style.padding = '8px 16px';
  adminId.style.marginBottom = '0px';
  adminId.placeholder = 'Admin id';
  dialogue.appendChild(adminId);
  let adminPassword = document.createElement('input');
  adminPassword.type = 'text';
  adminPassword.classList.add('phone-layout');
  adminPassword.classList.add('phone');
  adminPassword.style.padding = '8px 16px';
  adminPassword.placeholder = 'Admin password';
  dialogue.appendChild(adminPassword);
  adminPassword.onkeydown = (event) => {
    if(event.key == 'Enter'){
      verifyButton.click();
    }
  }
  let verifyButton = document.createElement('button');
  verifyButton.classList.add('btn');
  verifyButton.innerHTML = 'Verify';
  verifyButton.style.width = 'calc(100% - 10px)';
  verifyButton.onclick = async(event) => {
    let id = adminId.value;
    let ps = adminPassword.value;
    if(id.trim().length > 0 && ps.trim().length > 0){
      verifyButton.innerHTML = 'Verifying credentials...';
      verifyAdmin(id, ps, verifyButton, adminId, adminPassword, title, params);
    }
  }
  dialogue.appendChild(verifyButton);
  adminId.focus();
  adminId.onkeydown = (event) => {
    if(event.key == 'Enter'){
      verifyButton.click();
    }
  }
  addCover(dialogue);
}
export const renameFileOrFolderDialogue = (params) => {
  const updateName = async(name) => {
    if(name == params.fileName.innerHTML){
      removeCover();
      return;
    }
    let documentReference = doc(db,`personalspaces${getReferenceFromPath(params.path)}`,
    params.fileId);
    try {
      let data = {
        name: name
      };
      await setDoc(documentReference, data, {merge:true});
      params.parent['Files'][params.fileId].name = name;
      params.fileName.innerHTML = name;
      showAlert('Renamed successfully');
      removeCover();
    } catch (e) {}
  }
  inputConfirmationBox({
    inputType: 'text',
    buttonText: 'Rename',
    updatingText: 'Renaming...',
    action: updateName,
    inputValue: params.fileName.innerHTML
  });
}
export const inputConfirmationBox = (params) => {
  let inputConfirmationDialouge = document.createElement('div');
  inputConfirmationDialouge.classList.add('create-folder-dialogue');
  let input = document.createElement('input');
  input.type = params.inputType;
  if(params.inputValue) input.value = params.inputValue;
  input.classList.add('phone-layout');
  input.classList.add('phone');
  input.style.padding = '8px 16px';
  input.placeholder = params.inputPlaceholder;
  inputConfirmationDialouge.appendChild(input);
  let button = document.createElement('button');
  button.classList.add('btn');
  button.innerHTML = params.buttonText;
  button.onclick = (event) => {
    let val = input.value.trim();
    if(val.length > 0){
      if(params.updatingText)button.innerHTML = params.updatingText;
      params.action(val, button);
    }
  }
  inputConfirmationDialouge.appendChild(button);
  addCover(inputConfirmationDialouge);
}
export const openSecuredfolder = (params) => {
  updateAnimCords(params.event);
  const checkPassword = async(password) => {
    if(password==params.password){
      removeCover();
      params.openFolder();
      delete params.file.password;
    }else{
      showAlert('Wrong password');
    }
  }
  inputConfirmationBox({
    inputType: 'text',
    buttonText: 'Open',
    action: checkPassword,
    inputPlaceholder: 'Password'
  });
}
const renameFileOrFolder = (params) => {
  renameFileOrFolderDialogue(params);
}
const secureFileOrFolder = (params) => {
  secureFileOrFolderDialogue(params);
}
const shareFileorFolder  = (params) => {
  let filePath = getReferenceFromPath(params.path);
  let fileId = params.fileId;
  let url = `${window.location.protocol}//${window.location.host}?url=${filePath}/${fileId}`;
  navigator.clipboard.writeText(url);
  showAlert('URL copied to the clipboard');
}
const shareFilesorFolders  = (path, parent) => {
  let filePath = getReferenceFromPath(path);
  let url = '';
  parent = parent['Files'];
  for(let file in parent){
    if(parent[file].selected){
      url += `${window.location.protocol}//${window.location.host}?url=${filePath}/${file}\n\n`;
    }
  }
  navigator.clipboard.writeText(url);
  showAlert('URLs copied to the clipboard');
}
export const assembleSelectionMenu = (params) => {
  const menu = [
    {
      innerHTML:'Select all',
      onClick: async() => {
        await params.selectAllFiles();
      }
    },
    {
      innerHTML:'Copy',
      onClick: async() => {
        await params.copySelectedFiles();
      }
    },
    {
      innerHTML:'Move',
      onClick: async() => {
        await params.moveSelectedFiles();
      }
    },
    {
      innerHTML:'Share',
      onClick: async() => {
        await shareFilesorFolders(params.path, params.parent);
      }
    },
    {
      innerHTML:'Download',
      onClick: () => {
        params.downloadSelectedFiles();
      }
    },
    {
      innerHTML:'Delete',
      onClick: () => {
        params.deleteSelectedFiles();
      }
    },
  ];
  showOptionMenu(menu, params.x, params.y);
}
export const _copyFile = (params, moving=false) => {
  if(moving){
    params.isMoving(true);
  }else{
    params.isCopying(true);
  }
}
export const copySelectedFiles = async(parent, refreshHomeBody, path, fileSelecting, moving=false) => {
  window.userData.isMoving = moving;
  confirmationDialouge({
    title: `${moving? 'Move' : 'Copy'}`,
    subtitle: `Do you really want to ${moving? 'Move' : 'Copy'}`,
    positiveButtonText: `${moving? 'Move' : 'Copy'}`,
    beforeActionToast: `${moving? 'Moving' : 'Copying'}`,
    afterActionToast: `${moving? 'Moved' : 'Copied'}`,
    action: async() => {
      window.onGoingProgress = {
        stop: false,
        progress: 0
      }
      progressWindow({
        title: `${moving? 'Moving' : 'Copying'}`
      });
      console.log(window.userData.filesSelected);
      if(window.userData.filesSelected > 0){
        let files = window.userData.copyFromParent['Files'];
        for(let file in files){
          if(files[file].selected){
            window.userData.filesCopying[file] = files[file];
          }
        }
      }
      console.log(window.userData.filesCopying);
      await copyFiles(window.userData.filesCopying, path, parent);
      fileSelecting(false);
      setTimeout(() => {
        try {
          document.getElementById('cancel-copy-ops').click();
        } catch (e) {}
      },100);
    },
    fileSelecting: fileSelecting
  });
}
const folderIsEmpty = async(path, fileId) => {
  let newPath = [];
  Object.assign(newPath, path);
  newPath.push(fileId);
  let reference = getReferenceFromPath(newPath);
  reference = collection(db, `personalspaces${reference}`);
  let snapshot = await queryToFirebase(reference, 1, 'asc');
  return snapshot.docs.length == 0 ? true : false;
}
export const assembleOptionMenu = (params) => {
  const menu = [
    {
      innerHTML:'Open',
      onClick: () => {
        params.fileClicked();
      }
    },
    params.fileType != 'folder' ?
    {
      innerHTML: 'Select',
      onClick: () => {
        params.file.selected = true;
        window.userData.filesSelected = 1;
        window.escapeStack.unshift({
          action: () => {
            params.fileSelecting(false);
          }
        });
        params.fileSelecting(true);
      }
    }:{},
    {
      innerHTML:'Rename',
      onClick: () => {
        renameFileOrFolder(params);
      }
    },
    params.fileType != 'folder' ?
    {
      innerHTML:'Copy',
      onClick: () => {
        if(params.fileType == 'folder'){
        }else{
          window.userData.filesCopying = {};
          window.userData.filesCopying[params.fileId] = params.file;
          window.userData.copyFromPath = params.path;
          window.userData.copyFromParent = params.parent;
          _copyFile(params);
        }
      }
    }: {},
    params.fileType != 'folder' ?
    {
      innerHTML:'Move',
      onClick: () => {
        if(params.fileType == 'folder'){
        }else{
          window.userData.filesCopying = {};
          window.userData.filesCopying[params.fileId] = params.file;
          window.userData.copyFromPath = params.path;
          window.userData.copyFromParent = params.parent;
          window.userData.isMoving = true;
          _copyFile(params, true);
        }
      }
    }: {},
    params.fileType != 'folder' ?
    {
      innerHTML:'Download',
      onClick: () => {
        if(params.fileType == 'folder'){
        }else{
          params.downloadFile.click();
        }
      }
    }: {},
    params.fileType != 'folder' ?
    {
      innerHTML:'Share file',
      onClick: () => {
        shareFileorFolder(params);
      }
    } : {},
    {
      innerHTML: params.file.password ? 'Remove password' :
      params.fileType == 'folder' ? 'Secure folder' : 'Secure file',
      onClick: () => {
        secureFileOrFolder(params);
      }
    },
    {
      innerHTML:'Delete',
      onClick: async() => {
        if(params.fileType == 'folder'){
          if(await folderIsEmpty(params.path, params.fileId)){
            params.deleteFile.click();
          }else{
            showAlert('Failed to delete, can not delete non-empty folder.');
          }
        }else{
          params.deleteFile.click();
        }
      }
    },
    {
      innerHTML:'Details',
      onClick: () => {
        let details = document.createElement('div');
        details.classList.add('progress-window');
        let size = displaySizeofFile(Number(params.fileSize));
        let data = {
          title: 'Details',
          name: `File name: ${params.fileName.innerHTML}`,
          size: `File size: ${size}`,
          lastAccessedDate: `Last accessed date: ${getDateAndTimeFromMS(params.lastAccessedDate)}`
        }
        if(params.fileType == 'folder'){
          delete data.size;
        }
        for(let item in data){
          let div = document.createElement('div');
          div.innerHTML = data[item];
          details.appendChild(div);
          if(data[item] == 'Details'){
            div.classList.add('title');
            div.style.marginBottom = '10px';
          }else{
            div.style.marginBottom = '5px';
          }
        }
        addCover(details);
      }
    },
  ];
  showOptionMenu(menu, params.x, params.y);
}
const displaySizeofFile = (size) => {
  if(size > 1024*1024){
    return (size/(1024*1024)).toPrecision(4) + ' Mb';
  }else if(size > 1024){
    return (size/1024).toPrecision(4) + ' Kb';
  }else{
    return size + ' Bytes';
  }
  return '';
}
export const getRoot = () => {
  return document.getElementById('root');
}
const getDateAndTimeFromMS = (Ms) => {
  return new Date(Number(Ms));
}
window.onclick = (event) => {
  try {
    let root = getRoot();
    let optionsMenu = document.getElementById('options-menu');
    if(optionsMenu){
      root.removeChild(optionsMenu);
    }
  } catch (e) {}
}
export const dismissOptionMenu = () => {
  try {
    let root = getRoot();
    let optionsMenu = document.getElementById('options-menu');
    if(optionsMenu){
      root.removeChild(optionsMenu);
    }
  } catch (e) {}
}
export const showOptionMenu = (menu, x, y) => {
  setTimeout(() => {
    try {
      let root = getRoot();
      let optionsMenu = document.getElementById('options-menu');
      if(optionsMenu){
        root.removeChild(optionsMenu);
      }
      optionsMenu = document.createElement('div');
      optionsMenu.id = 'options-menu';
      optionsMenu.classList.add('options-menu');
      optionsMenu.classList.add('color-black');
      optionsMenu.classList.add('absolute');
      optionsMenu.classList.add('bg-white');
      for(let item of menu){
        if(item.innerHTML){
          const element = document.createElement('div');
          element.innerHTML = item.innerHTML;
          element.addEventListener('click', item.onClick);
          optionsMenu.appendChild(element);
        }
      }
      root.appendChild(optionsMenu);
      window.escapeStack.unshift({
        action: () => {
          root.removeChild(optionsMenu);
        }
      });
      let wWidth = window.innerWidth;
      let wHeight = window.innerHeight;
      let oWidth = optionsMenu.offsetWidth;
      let oHeight = optionsMenu.offsetHeight;
      let st = optionsMenu.style;
      if(wWidth-oWidth > x && wHeight-oHeight > y){
        st.left=x+'px';
        st.top=y+'px';
      }else if(wWidth-oWidth <= x && wHeight-oHeight > y){
        st.transformOrigin = 'top right';
        st.left=(x-oWidth)+'px';
        st.top=y+'px';
      }else if(wWidth-oWidth > x && wHeight-oHeight <= y){
        st.transformOrigin = 'bottom left';
        st.left=x+'px';
        st.top=(y-oHeight)+'px';
        st.top = (y-oHeight) > 0 ? (y-oHeight + 5)+'px' : '5px';
      }else{
        st.transformOrigin = 'bottom right';
        st.left=(x-oWidth)+'px';
        st.top = (y-oHeight) > 0 ? (y-oHeight + 5)+'px' : '5px';
      }
    } catch (e) {}
  },100);
}
export const updateSettings = async(obj) => {
  let documentReference = doc(db, `users/`,window.user.uid);
  await setDoc(documentReference, {
    settings: obj
  },{merge:true});
}
export const checkForURLPreview = async() => {
  let url = window.location.search.trim();
  if(url.length == 0) return;
  if(url.substr(0,5) != '?url=') return;
  url = url.substr(5);
  let i = 0;
  let paths = [];
  while(i < url.length){
    let path = '';
    while(i < url.length && url[i] != '/'){
      path += url[i];
      i++;
    }
    if(path.length > 0){
       paths.push(path);
    }
    i++;
  }
  if(paths.length % 2 == 1){
    try {
      let documentReference = `personalspaces`;
      paths.forEach((path, i) => {
        if(i == paths.length - 1){
          documentReference = doc(db, documentReference, path);
        }else{
          documentReference += `/${path}`;
        }
      });
      let data = await getDoc(documentReference);
      if(data.exists()){
          data = data.data();
          displayPicture(data, paths[paths.length - 1]);
      }
    } catch (e) {}
  }
}
export const deleteFile = async(file, documentReference, parent) => {
  let documentReference3 = doc(db, `users/${'qSIGQDSIqNTw6X06CFXcdWfTA2N2'}/thumbnails`,file);
  let storageReference = ref(storage,file);
  let documentReference2 = doc(db,`personalspaces${documentReference}`,file);
  try {await deleteDoc(documentReference2);} catch (e) {}
  if(parent['Files'][file].isCopy != true){
    try {await deleteDoc(documentReference3);} catch (e) {}
    try {await deleteObject(storageReference);} catch (e) {}
    try {await deleteDoc(doc(db, `users/${window.user.uid}/filepaths`, file));} catch (e) {}
  }
  try {delete parent['Files'][file];} catch (e) {}
}
export const copyFile = async(file, documentReference1, documentReference2, parent) => {
  try {
    console.log(documentReference1);
    console.log(documentReference2);
    let documentReference3 = doc(db,`personalspaces${documentReference1}`,file);
    let snapshot = await getDoc(documentReference3);
    let data = snapshot.data();
    if(window.userData.isMoving){
      data.isMoved = true;
    }else{
      data.isCopy = true;
    }
    if(window.userData.isMoving){
      await deleteDoc(documentReference3);
    }
    let documentReference4 = doc(db,`personalspaces${documentReference2}`,file);
    await setDoc(documentReference4, data);
    window.userData.copyFromParent['Files'][file].isCopy = true;
    parent['Files'][file] = window.userData.copyFromParent['Files'][file];
    if(window.userData.isMoving){
      delete window.userData.copyFromParent['Files'][file];
    }
  } catch (e){}
}
export const deleteFiles = async(files, path, parent) => {
  let documentReference = '';
  path.forEach((p) => {
    documentReference += `/${p}/Files`;
  });
  let i = 0;
  let j = Object.keys(files).length;
  for(let file in files){
    if(window.onGoingProgress.stop) break;
    await deleteFile(file, documentReference, parent);
    i++;
    window.onGoingProgress.progress = i*100/j;
  }
  progressWindowClose();
}
export const copyFiles = async(files, path, parent) => {
  console.log(path, window.userData.copyFromPath);
  let documentReference1 = '';
  window.userData.copyFromPath.forEach((p) => {
    documentReference1 += `/${p}/Files`;
  });
  let documentReference2 = '';
  path.forEach((p) => {
    documentReference2 += `/${p}/Files`;
  });
  let i = 0;
  let j = Object.keys(files).length;
  for(let file in files){
    if(window.onGoingProgress.stop) break;
    await copyFile(file, documentReference1, documentReference2, parent);
    i++;
    window.onGoingProgress.progress = i*100/j;
  }
  progressWindowClose();
}
export const saveFileToDisk = (data, fileType, fileName) => {
  let blob = b64toBlob(data,fileType,512);
  let blobURL = URL.createObjectURL(blob);
  let dummyLink = document.createElement('a');
  dummyLink.download = fileName;
  dummyLink.href = blobURL;
  dummyLink.click();
}
export const downloadFile = async(fileId, fileType, fileName) => {
  try {
    if(fileType.includes('video')){
      window.open(await getFileURLFromStorage(fileId), '_blank');
    }else{
      let data = await getFileDataFromStorage(fileId);
      saveFileToDisk(data, fileType, fileName);
    }
  } catch (e) {}
}
export const downloadFiles = async(files) => {
  let i = 0;
  let j = Object.keys(files).length;
  for(let file in files){
    if(window.onGoingProgress.stop) break;
    let f = files[file];
    await downloadFile(file, f.file_type, f.name);
    i++;
    window.onGoingProgress.progress = i*100/j;
  }
  progressWindowClose();
}
export const confirmationDialouge = (params) => {
  let confirmationBox = document.createElement('div');
  confirmationBox.classList.add('progress-window');

  let title = document.createElement('div');
  title.innerHTML = params.title;
  title.classList.add('title');
  confirmationBox.appendChild(title);

  let details = document.createElement('div');
  details.classList.add('progress-details');
  details.style.margin = '4px';
  confirmationBox.appendChild(details);

  let subtitle = document.createElement('div');
  subtitle.innerHTML = params.subtitle;
  subtitle.classList.add('sub-title');
  details.appendChild(subtitle);

  let positiveButton = document.createElement('button');
  positiveButton.classList.add('btn');
  positiveButton.classList.add('btn-lg');
  positiveButton.classList.add('btn-positive');
  positiveButton.innerHTML = params.positiveButtonText;
  positiveButton.style.marginLeft = '10px';
  positiveButton.onclick = async(event) => {
    showAlert(params.beforeActionToast);
    removeCover();

    await params.action();
    showAlert(params.afterActionToast);
    if(params.fileSelecting)params.fileSelecting(false);
  }

  let neutralButton = document.createElement('button');
  neutralButton.classList.add('btn');
  neutralButton.classList.add('btn-lg');
  neutralButton.classList.add('btn-cancel');
  neutralButton.innerHTML = 'Cancel';
  neutralButton.onclick = (event) => {
    removeCover();
  }

  let middleLayer =document.createElement('div');
  middleLayer.style.marginTop = '20px';
  middleLayer.style.marginLeft = 'auto';
  middleLayer.appendChild(neutralButton);
  middleLayer.appendChild(positiveButton);
  confirmationBox.appendChild(middleLayer);

  addCover(confirmationBox);
}
export const getSelectedFiles = (files) => {
  let selectedFiles = {};
  for(let file in files){
    let f = files[file];
    if(f.selected){
      selectedFiles[file] = f;
    }
  }
  return selectedFiles;
}
export const deleteSelectedFiles = (parent, refreshHomeBody, path, fileSelecting) => {
  confirmationDialouge({
    title: 'Delete',
    subtitle: 'Do you really want to delete?',
    positiveButtonText: 'Delete',
    beforeActionToast: 'Deleting...',
    afterActionToast: 'Deleted',
    action: async() => {
      window.onGoingProgress = {
        stop: false,
        progress: 0
      }
      progressWindow({
        title: 'Deleting...'
      });
      await deleteFiles(getSelectedFiles(parent['Files']), path, parent);
      refreshHomeBody();
      fileSelecting(false);
    },
    fileSelecting: fileSelecting
  });
}
export const downloadSelectedFiles = (parent, refreshHomeBody, path, fileSelecting) => {
  confirmationDialouge({
    title: 'Download',
    subtitle: 'Do you really want to download?',
    positiveButtonText: 'Download',
    beforeActionToast: 'Downloading...',
    afterActionToast: 'Downloaded',
    action: () => {
      window.onGoingProgress = {
        stop: false,
        progress: 0
      }
      progressWindow({
        title: 'Downloading...'
      });
      downloadFiles(getSelectedFiles(parent['Files']));
    },
    fileSelecting: fileSelecting
  });
}
export const tryCatch = (fun) => {
  try {
    fun();
  } catch (e) {}
}
const getDocFromFirebase = async(ref) => {
  return await getDoc(ref);
}
export const fetchUserData = async(uid, updateState) => {
  try {
    let ref = doc(db,'users',uid);
    let snapshot = await getDocFromFirebase(ref);
    if(snapshot.exists()){
      window.userData = snapshot.data();
      window.userData.space = {};
      window.userData.space[window.userData.spaceid] = {
        name: '/'
      };
      window.userData.encryptionKey = '';
      if(window.userData.settings == undefined){
        window.userData.settings = {
          theme: true,
          showThumbnails: true,
          adminMode: false,
          filesFetchCount: 10,
          filter: {
            property: 'last_accessed_date',
            order: 'desc'
          }
        };
      }else{
        window.userData.settings['filter'] = {
          property: 'last_accessed_date',
          order: 'desc'
        }
      }
      try{
        if(!window.userData.settings.theme){
          getRoot().classList.toggle('light-mode');
          getRoot().classList.toggle('dark-mode');
        }
      }catch(e){}
      window.PATHS = {};
      window.PATHS[window.userData.spaceid] = [window.userData.spaceid];
      updateState();
    }else{
      showAlert('Some thing went wrong');
    }
  } catch (e) {}
}
export const addWindowKeyDownListener = () => {
  window.escapeStack = [];
  window.onkeydown = (event) => {
    if(event.key == 'Escape'){
      for(let i = 0; i < window.escapeStack.length; i++){
        try{
          let task = window.escapeStack[i];
          if(task){
            task.action();
            window.escapeStack[i] = undefined;
            break;
          }
        }catch(e){}
      }
    }
  }
}
export const getReferenceFromPath = (path) => {
  let ref = '';
  path.forEach((p) => {
    ref += `/${p}/Files`;
  });
  return ref;
}
export const getCurrentDirectory = (parent, path) => {
  let files = parent['Files'];
  let i = 1;
  let level = path.length;
  while(level - i > 0){
    parent = files[path[i]];
    files = parent['Files'];
    i++;
  }
  return {
    files: files,
    parent: parent
  };
}
export const queryToFirebase = async(ref, counter, order) => {
  let q = query(ref, orderBy('last_accessed_date', 'desc'), limit(counter));
  return await getDocs(q);
}
export const fetchDirectoryData = async(path, counter, stateParent, updateParent, addFilesToList) => {
  try {
    let homeData = document.getElementById('home-data');
    let loadingbar = loading({color:'dodgerblue',size:40});
    loadingbar.style.margin = 'auto';
    homeData.appendChild(loadingbar);
    let ref= getReferenceFromPath(path);
    let {files,parent} = getCurrentDirectory(window.userData.space[path[0]], path);
    if(files == undefined){
        ref = collection(db,`personalspaces${ref}`);
        let snapshot = await queryToFirebase(ref, counter, 'desc');
        parent['Files'] = {};
        snapshot.forEach((doc) => {
          parent['Files'][doc.id] = doc.data();
        });
        files = parent['Files'];
        parent.ref = ref;
        parent.lastFileSnapshot = snapshot.docs.length > 0 ?
        snapshot.docs[snapshot.docs.length-1] : null;
    }
    homeData.removeChild(loadingbar);
    addFilesToList(files, parent.name);
    if(stateParent == null){
      updateParent(parent);
    }
  }catch (e) {}
}
export const checkFilesSelection = (files) => {
  let count = 0;
  for(let file in files){
    if(files[file].selected){
      count++;
    }
  }
  return count;
}
export const updateFileSelection = (newFile, bool) => {
  let factor = bool ? 1 : -1;
  window.userData.filesSelected += factor;
  document.getElementById('window-userdata-files-selected').innerHTML =
  window.userData.filesSelected;
  newFile.classList.toggle('s-cover');
}
export const removeCover = () => {
  try {
    let root = getRoot();
    let cover = document.getElementById('cover');
    root.removeChild(cover);
  } catch (e) {}
}
export const addCover = (child) => {
  let root = getRoot();
  let cover = document.getElementById('cover');
  if(cover){
    root.removeChild(cover);
  };
  cover = document.createElement('div');
  cover.id = 'cover';
  cover.classList.add('cover');
  cover.appendChild(child);
  child.classList.add('animation-fill-mode');
  root.appendChild(cover);
  {
    let tx = 0, ty = 0;
    tx = window.animX - child.offsetLeft - child.clientWidth/2;
    ty = window.animY - child.offsetTop - child.clientHeight/2;
    child.animate(
      [
        {transform: `translate(${tx}px,${ty}px) scale(.2)`},
        {}
      ],
      {
        duration:200
      }
    );
  }
  let close = document.createElement('span');
  close.classList.add('close-absolute');
  close.onclick = (event) => {
    removeCover();
  }
  cover.appendChild(close);

  cover.onclick = (event) => {
    if(event.target!=cover)return;
    try{root.removeChild(cover);}catch(e){}
  }
  window.escapeStack.unshift({
    action: () => {
      cover.click();
    }
  });
}
export const getFileURLFromStorage = async(fileId) => {
  return new Promise((accept, reject) => {
    let storageReference = ref(storage, fileId);
    getDownloadURL(storageReference)
    .then((url) => {
      accept(url);
    });
  }).then((url) => {
    return url;
  });
}
export const getFileDataFromStorage = async(fileId) => {
  let url = await getFileURLFromStorage(fileId);
  return new Promise((accept, reject) => {
    let xhr = new XMLHttpRequest();
    xhr.responseType = 'text';
    xhr.onload = (event) => {
      accept(xhr.response);
    };
    xhr.open('GET', url);
    xhr.send();
  }).then((data) => {
    return decryptData(data, window.userData.encryptionKey);
  }).catch(() => {
    return '';
  });
}
export const getPictureSRC = async(file, fileId) => {
  if(file.file == undefined){
    file.file = await getFileDataFromStorage(fileId);
    file.thumbnail = file.file;
  }
  return file.file;
}
export const displayPicture = async(file, fileId) => {
  let preview = document.createElement('div');
  preview.classList.add('photo-preview');
  let loadingbar = loading({
    color:'dodgerblue',
    size: 50
  });
  preview.appendChild(loadingbar);

  addCover(preview);
  showAlert('Loading picture...');

  if(file.file_type.includes('video')){
    let video = document.createElement('video');
    video.classList.add('photo-preview-img');
    video.style.backgroundColor = '#000000';
    video.src = await getFileURLFromStorage(fileId);
    video.play();
    video.controls = true;
    preview.appendChild(video);
  }else if(file.file_type.includes('image')){
    let img = document.createElement('img');
    img.classList.add('photo-preview-img');
    img.src = await getPictureSRC(file, fileId);
    preview.appendChild(img);
  }else{
    showAlert('Preview not available, downloading the file');
    removeCover();
    let data = await getFileDataFromStorage(fileId);
    saveFileToDisk(data, file.file_type, file.name);
  }
  preview.removeChild(loadingbar);
}

export const getFilePath = (id) => {
  let originalPath = window.PATHS[id];
  if(originalPath){
    let newPath = [];
    let i = 0;
    for(i; i < originalPath.length; i++){
      newPath.push(originalPath[i]);
      if(originalPath[i] == id) break;
    }
    return newPath;
  }else{
    window.history.replaceState({},'','/');
    return [window.userData.spaceid];
  }
}

export const getBackground = (fileType) => {
  if(fileType == 'folder') return 'folder';
  else if(fileType == 'application/x-zip-compressed') return 'zip';
  else if(fileType == 'video/mp4') return 'mp4';
  else if(fileType == 'image/jpeg') return 'jpg';
  else if(fileType == 'image/png') return 'png';
  else if(fileType == 'text/html') return 'html';
  else if(fileType == 'text/plain') return 'txt';
  else if(fileType == 'application/json') return 'txt';
  else if(fileType == 'application/pdf') return 'pdf';
  else if(fileType == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'docx';
  else if(fileType.includes('video')) return 'video';
  else if(fileType.includes('audio')) return 'audio';
}

export const updateTitle = (title) => {
  if(title == '/')document.title = `Mypersonalspace - home`;
  else document.title = `Mypersonalspace - ${title}`;
}

export const delayByXMs = async(X) => {
  return new Promise((a,b) => {
    setTimeout(() => {
      a();
    },X);
  }).then(() => {
    return;
  }).catch(() => {

  });
}

export const updateAnimCords = (event) => {
  window.animX = event.clientX;
  window.animY = event.clientY;
  if(window.animX == 0 && window.animY == 0){
    window.animX = window.innerWidth/2;
    window.animY = window.innerHeight/2;
  }
}

export const progressWindow = (params) => {
  let progressWindowCover = document.createElement('div');
  progressWindowCover.classList.add('cover');
  progressWindowCover.style.backgroundColor = 'transparent';
  progressWindowCover.id = 'progress-window-cover';
  getRoot().appendChild(progressWindowCover);

  let progressWindow = document.createElement('div');
  progressWindow.classList.add('progress-window');
  progressWindow.id = 'progress-window';
  progressWindowCover.appendChild(progressWindow);

  let title = document.createElement('div');
  title.innerHTML = params.title;
  title.classList.add('title');
  progressWindow.appendChild(title);

  let progressDetails = document.createElement('div');
  progressDetails.classList.add('progress-details');
  progressWindow.appendChild(progressDetails);

  let progress = document.createElement('div');
  progress.classList.add('progress');
  let tProgress = document.createElement('div');
  tProgress.classList.add('t-progress');
  progress.appendChild(tProgress);
  let cProgress = document.createElement('div');
  cProgress.classList.add('c-progress');
  cProgress.id = 'c-progress';
  progress.appendChild(cProgress);
  progressDetails.appendChild(progress);

  let progressMessage = document.createElement('div');
  progressMessage.innerHTML = '0%';
  progressMessage.classList.add('progress-message');
  progressMessage.id = 'progress-message';
  progressDetails.appendChild(progressMessage);

  let cancelButton = document.createElement('button');
  cancelButton.classList.add('btn');
  cancelButton.classList.add('btn-lg');
  cancelButton.classList.add('btn-positive');
  cancelButton.innerHTML = 'Cancel';
  cancelButton.onclick = (event) => {
    window.onGoingProgress.stop = true;
    progressWindowClose();
  }
  progressWindow.appendChild(cancelButton);

  let ID = setInterval(() => {
    if(progressMessage && cProgress){
      progressMessage.innerHTML = Math.floor(window.onGoingProgress.progress)+'%';
      cProgress.style.width = Math.floor(window.onGoingProgress.progress)+'%';
    }else{clearInterval(ID);}
  },1000);

  progressWindow.animate(
    [
      {transform: 'translateX(-50%) translateY(-50%) scale(.5)'},
      {transform: 'translateX(-50%) translateY(-50%) scale(1)'}
    ],
    {
      duration: 200,
      easing: 'ease-out'
    }
  );
}
export const progressWindowClose = () => {
  try {
    document.getElementById('progress-window').animate(
      [
        {transform: 'translateX(-50%) translateY(-50%) scale(1)'},
        {transform: 'translateX(-50%) translateY(-50%) scale(.5)'}
      ],
      {
        duration: 200,
        easing: 'ease-in'
      }
    );
    setTimeout(() => {
      try {
        getRoot().removeChild(document.getElementById('progress-window-cover'));
      } catch (e) {}
    }, 150);
  } catch (e) {}
}
{
  window.progressWindow = progressWindow;
  window.progressWindowClose = progressWindowClose;
}

export const logOut = (event) => {
  window.animX = event.clientX;
  window.animY = event.clientY;
  confirmationDialouge({
    title: 'Logout',
    subtitle: 'Do you really want to logout?',
    positiveButtonText: 'Logout',
    beforeActionToast: '...',
    afterActionToast: 'Logout successfully',
    action: () => {
      signOut(auth);
    }
  });
}
const fun = async(parent, snapshot, counter) => {
  snapshot.forEach(async(document) => {
    let data = document.data();
    let reference = doc(db, `users/${window.user.uid}/filepaths`, document.id);
    await setDoc(reference, {
      filepath: `${parent}/${document.id}`,
      name: data.name
    });
    if(data.file_type == 'folder'){
      await abcd(`${parent}/${document.id}/Files`, counter);
    }
  });
}
const abcd = async(parent, counter) => {
  console.log(parent,counter);
  let q = query(collection(db,`personalspaces/${parent}`),limit(10));
  let snapshot = await getDocs(q);
  if(snapshot.docs.length > 0){
    counter += snapshot.docs.length;
    let lastFileSnapshot = snapshot.docs[snapshot.docs.length-1];
    await fun(parent, snapshot, counter);
    console.log(parent,counter);
    while (lastFileSnapshot) {
      q = query(collection(db,`personalspaces/${parent}`),startAfter(lastFileSnapshot),limit(10));
      snapshot = await getDocs(q);
      await fun(parent, snapshot, counter);
      if(snapshot.docs.length > 0){
        counter += snapshot.docs.length;
        console.log(parent,counter);
        lastFileSnapshot = snapshot.docs[snapshot.docs.length-1];
      }else{
        lastFileSnapshot = null;
        break;
      }
    }
  }
  console.log(parent,counter);
}

export const searchQuery = async(str) => {
  console.log(str);
  let reference = collection(db, `users/${window.user.uid}/filepaths`);
  let q = query(reference, orderBy('name'), startAt(str), where('name', '>=', str), where('name', '<=', str), limit(10));
  let data = {};
  let snapshot =  await getDocs(q);
  snapshot.forEach((doc) => {
    data[doc.id] = doc.data();
  });
  return data;
}
const filterData = (params, property, order) => {
  const swap = (i, j) => {
    let temp = {};
    Object.assign(temp, i);
    Object.assign(i, j);
    Object.assign(j, temp);
  }
  let parent = params.parent['Files'];
  let files = [];
  for(let file in parent){
    files.push({
      id: file,
      data: parent[file]
    });
  }
  for(let i = 0; i < files.length; i++){
    for(let j = i+1; j < files.length; j++){
      if(order == 'asc'){
        if(property == 'file_size'){
          if(files[i]['data']['file_size'] > files[j]['data']['file_size']){
            swap(files[i], files[j]);
          }
        }else if(files[i]['data'][property].toString().localeCompare(files[j]['data'][property].toString()) == 1){
          swap(files[i], files[j]);
        }
      }else if(order == 'desc'){
        if(property == 'file_size'){
          if(files[i]['data']['file_size'] < files[j]['data']['file_size']){
            swap(files[i], files[j]);
          }
        }else if(files[i]['data'][property].toString().localeCompare(files[j]['data'][property].toString()) == -1){
          swap(files[i], files[j]);
        }
      }
    }
  }
  let newFiles = {};
  for(let i = 0; i < files.length; i++){
    newFiles[files[i]['id']] = files[i]['data'];
  }
  params.parent['Files'] = newFiles;
  params.refreshHomeBody();
}
const filterBy = (params, event, by) => {
  const menu = [
    {
      innerHTML:'Ascending',
      onClick: async() => {
        window.userData.settings.filter = {
          property: by,
          order: 'asc'
        }
        filterData(params, by, 'asc');
      }
    },
    {
      innerHTML:'Descending',
      onClick: async() => {
        window.userData.settings.filter = {
          property: by,
          order: 'desc'
        }
        filterData(params, by, 'desc');
      }
    }
  ];
  showOptionMenu(menu, event.clientX, event.clientY);
}

export const filterList = (event, params) => {
  const menu = [
    {
      innerHTML:'By name',
      onClick: async() => {
        filterBy(params, event, 'name');
      }
    },
    {
      innerHTML:'By date',
      onClick: async() => {
        filterBy(params, event, 'last_accessed_date');
      }
    },
    {
      innerHTML:'By size',
      onClick: async() => {
        filterBy(params, event, 'file_size');
      }
    }
  ];
  showOptionMenu(menu, event.clientX, event.clientY);
}
