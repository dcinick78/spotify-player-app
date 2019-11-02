import React, { Component } from 'react';
import axios from 'axios';
import './App.css';
import ReactPlayer from 'react-player'
import restService from './services.js'

let defaultStyle = {
  color: '#000'
}
class PlaylistList extends Component {
  render(){
    let playlists = this.props.playlists
    return(
        <ul>
        {playlists.map((playlist,index)=>
          <li key={index} onClick={()=>this.props.handleNavigation('playlist',playlist)}> - {playlist.name}</li>  
        )}
        </ul>
    )
  }
}
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
      <img alt="" onClick={()=>{this.props.handleNavigation('playlist',{name:playlist.name,uri:playlist.uri,songs:playlist.songs,imageUrl:playlist.imageUrl})}} src={playlist.imageUrl} width="300" height="300" />
      </div>
    );
  }
}
class SinglePlaylist extends Component {
  render() {
    let playlist = this.props.playlist
    return (
      <div style={{...defaultStyle, display: 'inline-block', width: "25%"}}>
      <h3>{playlist.name}</h3>
      <img src={playlist.imageUrl} width="300" height="300"/>
        <ul>
          {playlist.songs.map((song,index) => 
            <li key={index} ><span onClick={()=>{this.props.handleNavigation('song',song)}}>{song.artists[0].name}{song.artists[1] ? ' feat. '+song.artists[1].name:null} - {song.name} </span> {song.preview_url && <span onClick={(event) => this.props.playThis(event, song)}  > > PLAY </span>} {Math.floor(song.duration/1000)} s <span>add to playlist</span></li>
          )}
        </ul>
      </div>
    );
  }
}
class SongView extends Component {
  render() {
    const track = this.props.song.originObj || this.props.song
    // trying to et image data for song - > if not found use album image,artist image,else placeholder
    if (track.images || track.image) { track.songImageUrl = track.images }
    else if ( track.album ) {  track.songImageUrl = track.album.images[0].url }
    return (
      <div>
        <img src={track.songImageUrl} width="300" height="300" alt="" />
        <div>{track.artists[0].name}{track.artists[1] ? ' feat. '+track.artists[1].name:null} - {track.name} {track.preview_url && <span onClick={(event) => this.props.playThis(event, this.props.song)}  > > PLAY </span>}</div>
      </div>
      )
  }
}
class ArtistInfo extends Component {
  render(){
    const artist = this.props.artist
    return(
      <div>{artist.name}</div>
    )
  }
}
class ArtistAlbumList extends Component {
  componentDidMount(){
    // get all album data and feed into list
  }
  render(){
    const artist = this.props.artist
    return(
      <div>
      {artist.albums.map((item,index)=>
        <div>{item.name} <img src={item.images[0]} width="300" height="300" alt=""  /></div>
      )}
      </div>
    )
  }
}
class ArtistView extends Component {
  render(){
    let this_artist = this.props.artist
    // lots of todo
    return(
      <div>
        <img alt="artistImage" />
        <ArtistInfo artist={this_artist}/>
       <ArtistAlbumList artist={this_artist}/>
      {/*<ArtistTopSongList artist={this_artist}/>*/}
      </div>
    )
  }
}
class SearchField extends Component {
  render(){
    return(
      <div>
        <input onChange={e=>this.props.onSearchChange(e.target.value)} type="text"/>
      </div>
    )
  }
}
    // trend songs 50 View ->
    // search for album,artist,top songs -> res -> switch view

class TracksList extends Component {
  render(){
    let tracks = this.props.tracks
    return(
      <div>
        {tracks.map(track=>
          <div onClick={()=>{this.props.handleNavigation('song',track);}}
         className="track-preview-square">{track.artists[0].name} - {track.name} <img alt="" src={track.album.images && track.album.images[0].url} width="300" height="300" /></div>
        )}
      </div>
    )
  }
}

let serviceTimer
class App extends Component {
  constructor() {
    super();
    this.state = {
      user:{},
      navigation: {
        back:0,
        prevNodes:[],
        view:'playlists'
      },
      song:{},
      playlist:{},
      playlists:[],
      searchString:'',
      searchRes:{},
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
    this.setState({token:_token})
    let uri_config = {
      user:'https://api.spotify.com/v1/me',
      playlists:'https://api.spotify.com/v1/me/playlists'}
    let headers = {headers: {'Authorization': 'Bearer '+_token}}

   if (_token) {
      // get user name data
      axios.get(uri_config.user,headers)
      .then((response) => {
        this.setState({
          user: {name: response.data.display_name}
        })
      }, (error) => {      console.log("error by fetch user",error);    })
      
      // get playlist and tracks data
      let profilePlaylists = restService.f(uri_config.playlists, _token)
      restService.r(profilePlaylists,'playlists',_token)
      .then((playlists) => {  
        this.setState({
          playlists: playlists.items.map(item => ({
            name: item.name,
            uri:item.uri,
            href:item.href,
            imageUrl:(item.images[0].url && item.images[0].url),
            songs: item.tracksDatas.map(item=>({
              name:item.name,duration:item.duration_ms,id:item.id,preview_url:item.preview_url,artists: item.artists,originObj:item
            }))
          }))
        })
      })

   }
    
  }
  lookUpSearch=(text)=>{
    let token = this.state.token
    let types = 'type=track,album,artist'
    let query = text
    let searchUri = 'https://api.spotify.com/v1/search?q='+query+'&'+types+'&include_external=audio'
    
    clearTimeout(serviceTimer);
    serviceTimer = setTimeout(()=>{
      restService.f(searchUri, token).then(res=>res.json())
      .then(data=>{
        let nR = data
        this.setState({searchString:text,searchRes:{albums:nR.albums.items,artists:nR.artists.items,tracks:nR.tracks.items}})
      })
    }, 1000);
      
      
  }
  playThis = (event,song) => {
    let track = song
    if (track.preview_url) {
      this.setState({previewPlay: track.preview_url, /*playing:true,*/ currentPlay: {artist :track.artists[0].name, song: track.name,imageUrl:track.originObj.album.images[0].url}})
    } else {
      console.log("no preview found")
      // later add modal window for client information that track has no preview data. maybe sdk lookup
      this.setState({currentPlay: {artist :track.artists[0].name+(song.artists[1] ? ' feat. '+song.artists[1].name:null), song: track.name, imageUrl:track.originObj.album.images[0].url}})
    }
  }
  ref = player => {
    this.player = player
  }
  handlePlayPause = () => {
    this.setState(prevState => ({playing:!prevState.playing}))
  }
  handleNavigation = (newNav,data) => {
    let y = this.state.navigation.view
    ,   x = this.state.navigation.prevNodes // access error ?
    
    if (data && newNav === 'playlist') {
      this.setState({playlist:{name:data.name,uri:data.uri,href:data.href,songs:data.songs,imageUrl:data.imageUrl}})
    }
    if (data && newNav === 'song') {
      this.setState({song:data})
    }
    x.push(y)
    this.setState({
        navigation:{prevNodes:x, view:newNav}
    })
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
      <div className="navigation">
      <ul><li onClick={()=>this.handleNavigation('playlists')}>my playlists</li>
          <li onClick={()=>this.handleNavigation('search')}>search</li>
          <li onClick={()=>this.props.history.push('/')}>logout</li>
      </ul>
      </div>

        {this.state.user.name && <div>
          { this.state.previewPlay && this.state.token ?
            <ReactPlayer ref={this.ref} className='react-player' width='0px' height='0px' 
              url={this.state.previewPlay} controls={false} playing={this.state.playing}
              onReady={() => console.log('onReady')}
              onStart={() => console.log('onStart')}
            />
          : null }

          <h1> {this.state.user && this.state.user.name} </h1>
          {this.state.user.name && <div>
          <PlaylistList playlists={this.state.playlists} handleNavigation={this.handleNavigation}/>
          </div>
          }
          {this.state.currentPlay && this.state.currentPlay.imageUrl && <div><img alt="" src={this.state.currentPlay.imageUrl} className="playing-now-image" width="300" height="300" />  
          <h2> {this.state.currentPlay.artist} {this.state.previewPlay && ("-")} {this.state.currentPlay.song} 
          {this.state.playing ? ' Playing' : ' Paused'} 
          </h2>  </div>
          }
          <button onClick={this.handlePlayPause}>{this.state.playing ? 'Pause' : 'Play'}</button>
          
          { this.state.navigation.view === 'search' && <div>
            <SearchField onSearchChange={text=>{this.lookUpSearch(text)}} token={this.state.token}
            />
              {this.state.searchRes.tracks &&
                  <TracksList tracks={this.state.searchRes.tracks} handleNavigation={this.handleNavigation}/>
              }
            </div>
          }

          { this.state.navigation.view === 'playlists' && 
            <div>
            <PlaylistCounter  playlists={playlistToRender}/>
            <HoursCounter playlists={playlistToRender}/>
            <Filter onStringChange={text=>this.setState({filterString:text})} /></div>}

          { this.state.navigation.view === 'playlists' &&
            playlistToRender.map((playlist,index)=>
              <Playlist key={index} playThis={this.playThis} playlist={playlist} handleNavigation={this.handleNavigation}/>
            )
          }
          { this.state.navigation.view === 'playlist' &&
            <div>
              <SinglePlaylist playThis={this.playThis} playlist={this.state.playlist} handleNavigation={this.handleNavigation}/>
            </div>
          }


          { this.state.navigation.view === 'song' &&
          <div>
            <SongView song={this.state.song} token={this.state.token} playThis={this.playThis}/>
          </div>
          }
        { this.state.navigation.view === 'artist' &&
        <div>
        <ArtistView artist={this.state.artist} />
        </div>
       }
       </div>
      }
    </div>
    )
  }
}

export default App;
