import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Route, BrowserRouter as Router, Switch } from 'react-router-dom'
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';

const Notfound = () => {
    return(
        <div>
            <h1 >Not Found</h1>
        </div>
    )
}
const Login = () => {
    return(
        <div>
            <h1 onClick={()=>window.location='http://localhost:8000/login'}>'Sign In with Spotify'</h1>
        </div>
    )
}
const routing = (
    <Router>
        <div>
            <Switch>
                <Route exact path="/" component={Login} />
                <Route path="/profile/" component={App} />
                <Route component={Notfound} />
            </Switch>
        </div>
    </Router>
)

ReactDOM.render(routing, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
