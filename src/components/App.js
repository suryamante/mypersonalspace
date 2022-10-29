import React, {useState, useEffect} from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter, Switch, Route, Redirect, withRouter, useParams } from 'react-router-dom';
import Home from './Home';
import ReactLoading from 'react-loading';
import {db, collection, doc, getDoc} from './Config';
import Recent from './Recent';
import Trash from './Trash';
import Settings from './Settings';
import {checkForURLPreview, showAlert, fetchUserData, addWindowKeyDownListener,
getFilePath, getRoot, loading} from './Utilities';
import Header from './Header';
import './style.css';
import './file icons.css';

const App = () => {
	const [state, setState] = useState({
		userData: null
	});
	const HomeWithId = ({match}) => {
		let cover = document.getElementById('cover');
		if(cover){
			getRoot().removeChild(cover);
			return null;
		}
		let path = getFilePath(match.params.fileid);
		try {
			window.updatePath(path);
		} catch (e) {} finally {}
		return(
			<Home filepath = {path}/>
		);
	}
	useEffect(() => {
		if(state.userData == null){
			document.getElementById('root').appendChild(loading());
			fetchUserData(window.user.uid,() => {
				setState({
	        ...state,
	        userData: window.userData
	      });
			});
		}else{
			try{document.getElementById('root').removeChild(document.getElementById('load-more-bar'));}catch(e){}
		}
	},[state.userData]);
	useEffect(() => {
		addWindowKeyDownListener();
	},[]);
	useEffect(() => {
		checkForURLPreview();
	},[]);
	return (
		<React.Fragment>
			{
				state.userData?
				<BrowserRouter>
					<Header/>
					<Switch>
						<Route exact path='/' component={() => <Home filepath={[window.userData.spaceid]}/>}/>
						<Route path='/recent' component={Recent}/>
						<Route path='/trash' component={Trash}/>
						<Route path='/settings' component={Settings}/>
						<Route path='/:fileid' component={HomeWithId}/>
						<Redirect to='/'/>
					</Switch>
				</BrowserRouter>
				:null
			}
		</React.Fragment>
	);
}

export default App;
