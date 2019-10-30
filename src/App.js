import React, { Component } from 'react';
import axios from 'axios';
import SpotifyPlayer from 'react-spotify-web-playback';
import './App.css';
import Iframe from 'react-iframe'
import ReactPlayer from 'react-player'

let defaultStyle = {
  color: '#000'
}
// let audioTag = new Audio()
class PlaylistCounter extends Component {
  render() {
    return (
      <div className="aggregate">
        <h2 style={{color: '#4646746'}}>{this.props.playlists && this.props.playlists.length} Playlists loaded</h2>
      </div>
    );
  }
}
class HoursCounter extends Component {
  render() {
    let allSongs = this.props.playlists.reduce((songlist, eachPlaylist)=>{
      return songlist.concat(eachPlaylist.songs)
    } , [])
    let totalDuration = allSongs.reduce((sum, eachSong)=>{
      return sum + eachSong.duration
    },0)
    let _ReS
    ,   _S  = Math.floor(totalDuration/1000)
    ,   _H  = (_S/3600)
    ,   _MR = (_S%60)
    if (_H < 1) { _ReS=Math.floor(_S/60) +" minutes" } 
    else { _H=Math.floor(_H)+" Hours"; _ReS = _H
      if (_MR ) { _ReS=_H+" and "+_MR+" minutes"}    }
    let sumTotalDuration = _ReS
    return (
      <div >
        <h2 style={{color: '#4646746'}}>{this.props.playlists && sumTotalDuration} Playtime</h2>
      </div>
    );
  }
}
class Filter extends Component {
  render() {
    return (
      <div className="filter">
        <img/>
        Filter
        <input onChange={e=>this.props.onStringChange(e.target.value)} type="text"/>
      </div>
    );
  }
}
class Playlist extends Component {
  render() {
    let playlist = this.props.playlist
    return (
      <div style={{...defaultStyle, display: 'inline-block', width: "25%"}}>
      <h3>{playlist.name}</h3>
      <img src={playlist.imageUrl} />
        <ul>
          {playlist.songs.map(song => 
            <li onClick={(event) => this.props.playThis(event, song)} > {song.name}</li>
          )}
        </ul>
      </div>
    );
  }
}

class App extends Component {
  constructor() {
    super();
    this.state = {
      user:{},
      playlists:[],
      filterString:'',
      currentPlay:{},
      previewPlay:null,
      playing:false,
      token:null,
      refreshToken:null
    };
  }
  componentDidMount() {    
    let _token = new URLSearchParams(window.location.search).get('access_token')
    let uri_config = {user:'https://api.spotify.com/v1/me',playlists:'https://api.spotify.com/v1/me/playlists'}
    let headers = {headers: {'Authorization': 'Bearer '+_token}}
    this.setState({token:_token})

    if (_token) {
      // get user name data
      axios.get(uri_config.user,headers)
      .then((response) => {
        this.setState({
          user: {name: response.data.display_name}
        })
      }, (error) => {      console.log("error by fetch user",error);    })
      
      // get playlist and tracks data
    fetch(uri_config.playlists, headers)
      .then(response=>response.json())
      .then(playlistData => { // fetchesOfTracks = array of promises of tracks for each playlist
        ;let fetchesOfTracks = playlistData.items.map(playlist=> {
          let responsePromise = fetch(playlist.tracks.href,headers)
          let dataPromise = responsePromise.then(res=>res.json())
          return dataPromise // dataPromise.items = track array // dataPromise.href = playlist uri key
        })
       
        let allTrackDataResolved = Promise.all(fetchesOfTracks)
        let playlistPromise = allTrackDataResolved.then(tracksDatas => { // promise.all returns a promise that resolves when the parameter-promises are all resolved. if one does not it rejects the main promise
          tracksDatas.forEach((trackData, i)=>{
            playlistData.items[i].tracksDatas = trackData.items.map(item=>item.track)
          })
          return playlistData
        })
        console.log("playlistData in pormise chain ",playlistData)
        return playlistPromise
      }).then((playlists) => {  //console.log(playlists)
        this.setState({
          playlists: playlists.items.map(item => ({
            name: item.name,
            imageUrl:(item.images[0].url && item.images[0].url),
            songs: item.tracksDatas.slice(0,9).map(item=>({
              name:item.name,duration:item.duration_ms,id:item.id,preview_url:item.preview_url,artists: item.artists
            }))
          }))
        })
      })

    }
    
  }
  playdis = function(event,song) {
    let track = song
    console.log(song)
    if (song.preview_url) {
      this.setState({previewPlay: song.preview_url, playing:true, currentPlay: {artist :song.artists[0].name, song: song.name}})
    } else {
      console.log("no preview found")
      // later add modal window for client information that track has no preview data. maybe sdk lookup
      // add loading of audio data here ~ sdk playback put to connect to spotify app
      // and use the state as string for the uri || api endpoint
      this.setState({currentPlay: {artist :song.artists[0].name, song: song.name}})
    }
    console.log(this.state.currentPlay.artist)
  }
  playThis = this.playdis.bind(this)
  hpy(){console.log("no callback inserted")}
  handlePlay = this.hpy.bind(this)
  hps(){this.setState({playing:false})}
  handlePause = this.hps.bind(this)
  hpe(){this.setState({playing:false})}
  handleEnded = this.hpe.bind(this)    
  ref = player => {
    this.player = player
  } 
  render() {
    let playlistToRender = 
    this.state.user &&
    this.state.playlists 
    ? this.state.playlists
    .filter(playlist =>
        playlist.name.toLowerCase().includes(
          this.state.filterString.toLowerCase())
    ) : [];
    return (
      <div className="App">
        {this.state.user.name ?
        <div>
          { this.state.previewPlay && this.state.token ?
            <ReactPlayer ref={this.ref} className='react-player' width='300px' height='50px' 
              url={this.state.previewPlay} controls={true} playing={true}
              onReady={() => console.log('onReady')}
              onStart={() => console.log('onStart')}
              onPlay={this.handlePlay} onPause={this.handlePause}
              onEnded={this.handleEnded}
            />
          : null }
      
          
          <h1> {this.state.user && this.state.user.name}'Playlist
          </h1>
          {this.state.currentPlay ? <h2>
            {this.state.currentPlay.artist} {this.state.previewPlay && ("-")} {this.state.currentPlay.song} playing now</h2>
          : null }
          <PlaylistCounter  playlists={playlistToRender}/>
          <HoursCounter playlists={playlistToRender}/>
          <Filter onStringChange={text=>this.setState({filterString:text})} />
          <div>test2</div>
          
          {playlistToRender.map((playlist,index)=>
              <Playlist key={index} playThis={this.playThis} playlist={playlist}/>
          )}
        </div> : <h1 onClick={()=>window.location='http://localhost:8000/login'}>'Sign In with Spotify'</h1>
        }
      </div>
    )
  };
}

export default App;
