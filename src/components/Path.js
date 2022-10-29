import React from 'react';
const Path = ({path,updatePath,refreshHomeBody,_filterList}) => {
  let newPaths = [];
  let parent = window.userData.space[path[0]];
  newPaths.push('Mypersonalspace');
  let files = parent['Files'];
  let i = 1;
  while(path.length - i > 0){
    parent = files[path[i]];
    newPaths.push(parent.name);
    files = parent['Files'];
    i++;
  }
  const changePath = (i) => {
    if(i+1 > 0){
      updatePath(path.slice(0,i+1));
    }
  }
  return(
    <div className='path'>
      {
        true?
        <svg viewBox="0 0 24 24" class='icon'
          style={{
            marginRight:'4px',
            cursor:'pointer',
            minHeight:'22px',
            minWidth:'22px',
            maxHeight:'22px',
            maxWidth:'22px',
            marginBottom:'-2px'
          }}
        onClick={() => changePath(path.length - 2)}>
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"
            fill='currentColor'>
          </path>
        </svg>
        :null
      }
      {
        newPaths.map((path,i) =>(
          <div className='path-item' onClick={()=>changePath(i)}>
            <div style={i == newPaths.length - 1 ? {marginRight:'10px'} : null}>
              {`${path}`}
            </div>
            {
              i < newPaths.length - 1 ?
              <div className='next'>
              </div>
              :null
            }
          </div>
        ))
      }
      <span className='refresh-home-body-button filter' onClick={_filterList}></span>
      <span className='refresh-home-body-button' onClick={refreshHomeBody}></span>
    </div>
  );
}

export default Path;
