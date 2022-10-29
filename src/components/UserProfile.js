import React from 'react';

const UserProfile = (props) => {
  return(
    <React.Fragment>
      <img src='./profile.png' style={{width: '40px', height: '40px'}} className='circular-profile-pic'/>
    </React.Fragment>
  );
}

export default UserProfile;
