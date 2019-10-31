
import axios from 'axios';
let fetchMeService = () => {}
fetchMeService.f = (fetch_uri, fetch_token) => {
    let headers = {headers: {'Authorization': 'Bearer '+fetch_token}}
    let res = fetch(fetch_uri,headers)
    return res
}
fetchMeService.r = (data,direction,fetch_token) => {
    let headers = {headers: {'Authorization': 'Bearer '+fetch_token}}
    let res = data.then(r=>r.json())
    if (direction === 'playlists') {
        let newRes = res.then(playlistData => {
            let fetchesOfTracks = playlistData.items.map(playlist=> {
                let responsePromise = fetch(playlist.tracks.href,headers)
                let dataPromise = responsePromise.then(res=>res.json())
                return dataPromise
            })
            let allTrackDataResolved = Promise.all(fetchesOfTracks)
            let playlistPromise = allTrackDataResolved.then(tracksDatas => { // promise.all returns a promise that resolves when the parameter-promises are all resolved. if one does not it rejects the main promise
            tracksDatas.forEach((trackData, i)=>{
                playlistData.items[i].tracksDatas = trackData.items.map(item=>item.track)
            })            
            return playlistData
            })
            return playlistPromise

        })
        return newRes
    } else if (direction === 'artist') {
        let x = data.then(r=>r.json())
        console.log("nothing for artist fetch aded yet")
        return x
    }
}
export default fetchMeService