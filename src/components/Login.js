import React, {useState, useEffect, useContext} from 'react';
import {app} from './Config';
import ReactLoading from 'react-loading';
import './style.css';
import {showAlert, progressbar, loading} from './Utilities';
import { auth, RecaptchaVerifier, signInWithPhoneNumber, db, collection, addDoc, doc,
  setDoc } from './Config';

const Login = () => {

  const [state, setState] = useState({
    phone: '',
    otpsent: false,
    otp: '',
    disableSendOtp: true,
    disableLogin: true,
    loading: false
  });

  const updateLoadingStatus = (bool) => {
    setState({
      ...state,
      loading: bool
    });
  }

  const phoneInputHandler = (event) =>{
    const dummy = (bool, phone) => {
      setState({
        ...state,
        disableSendOtp: bool,
        phone: phone
      });
    }
    try{
      let phone = event.target.value;
      if(phone.length == 0){
        dummy(true, phone);
      }else{
        let num = phone.charAt(phone.length-1);
        if(!isNaN(num) && num !== " "){
          if(phone.length == 10){
            dummy(false, phone);
          }else{
            dummy(true, phone);
          }
        }
      }
    }catch(error){

    }
  }

  const otpInputHandler = (event) =>{
    const dummy = (bool, otp) => {
      setState({
        ...state,
        disableLogin: bool,
        otp: otp
      });
    }
    try{
      let otp = event.target.value;
      if(otp.length == 0){
        dummy(true, otp);
      }else{
        let num = otp.charAt(otp.length-1);
        if(!isNaN(num) && num !== " "){
          if(otp.length == 6){
            dummy(false, otp);
          }else{
            dummy(true, otp);
          }
        }
      }
    }catch(error){

    }
  }

const phoneOnKeyDown = (event) => {
  try {
    if(event.key == 'Enter' && !state.disableSendOtp){
      sendOtp();
    }
  } catch (e) {}
}
  const otpOnKeyDown = (event) => {
    try {
      if(event.key == 'Enter' && !state.disableLogin){
        login();
      }
    } catch (e) {}
  }

  const renderCaptcha = () => {
    try{
      window.recaptchaVerifier = new RecaptchaVerifier('recaptcha-container', {
        'size': 'normal',
        'callback': (response) => {
          window.captchaVerified = true;
        }
      }, auth);
      window.recaptchaVerifier.render().then((widgetId) => {
        window.recaptchaWidgetId = widgetId;
      });
    }catch(error){}
  }

  useEffect(() => {
    try{
      if(!state.otpsent){
        renderCaptcha();
      }
    }catch(error){}
  },[state.otpsent]);

  const sendOtp = () => {
    try{
      if(!window.captchaVerified){
        showAlert('Verify CAPTCHA first and then continue');
        return;
      }
      let ph = "+91" + state.phone;
      signInWithPhoneNumber(auth, ph, window.recaptchaVerifier)
        .then((confirmationResult) => {
          window.confirmationResult = confirmationResult;
          setState({
            ...state,
            otpsent: true,
            disableSendOtp: true,
            loading: false
          });
        }).catch((error) => {
          alert(error);
          updateLoadingStatus(false);
          window.recaptchaVerifier.reset(window.recaptchaWidgetId);
        });
    }catch(error){}
  }

  const login = () => {
    try{
      updateLoadingStatus(true);
      window.confirmationResult.confirm(state.otp).then((result) => {
        addNewUser(result.user.uid);
      }).catch((error) => {
        showAlert('Please enter valid OTP');
        updateLoadingStatus(false);
      });
    }catch(error){}
  }

  const addNewUser = async(uid) => {
    try{
      await setDoc(doc(db, 'users', uid), {
        profile:{
          phone: state.phone
        }
      },{merge:true});
    }catch(error){

    }
    updateLoadingStatus(false);
  }

  return(
    <div className='centered-container' id='login-container'>
      {
        state.loading?
        <ReactLoading type={'bubbles'} color={'dodgerblue'}/>
        :<React.Fragment>
        <h4 className='app-title'>Log in to your space</h4>
          <div className='login-container'>
            {
              !state.otpsent?
              <React.Fragment>
                <div className='phone-layout'>
                  <label>+91</label>
                  <input type='phone' className='phone' maxLength='10'
                    autoFocus={true} placeholder='Phone' value={state.phone}
                    onChange={phoneInputHandler} onKeyDown={phoneOnKeyDown}
                    name='phone' id='phone'>
                  </input>
                </div>
                <div>
                  <button className='btn btn-blue btn-sm' id='sendOtp'
                    onClick={sendOtp} disabled={state.disableSendOtp}>
                    Send Otp
                  </button>
                </div>
              </React.Fragment>
              :null
            }
            <br/>
            {
              state.otpsent?
              <React.Fragment>
                <div className='phone-layout otp-layout'>
                  <input type='otp' className='phone' maxLength='6'
                    placeholder='Otp' autoFocus={true} value={state.otp} onChange={otpInputHandler}
                    onKeyDown={otpOnKeyDown} name='otp' id='otp'>
                  </input>
                </div>
                <div>
                  <button className='btn btn-blue btn-sm' onClick={login}
                    id='continue' disabled={state.disableLogin}>
                    Continue
                  </button>
                </div>
                <br/>
              </React.Fragment>
              :null
              }
            {!state.otpsent?<div id='recaptcha-container'></div>:null}
          </div>
        </React.Fragment>
      }
    </div>
  );
}

export default Login;
