const clientId = '83c0e2ac9e284b679262d7e1e2d866bd';
const redirectUri = 'http://localhost:3000/';
const spotifyUrl = `https://accounts.spotify.com/authorize?response_type=token&scope=playlist-modify-public&client_id=${clientId}&redirect_uri=${redirectUri}`;
let userToken = '';
let expiry;

const Spotify = {
  getAccessToken() {
    if (userToken) {
      return userToken;
    }
    const urlUserToken = window.location.href.match(/access_token=([^&]*)/);
    const urlExpiry = window.location.href.match(/expires_in=([^&]*)/);
    if (urlUserToken && urlExpiry) {
      userToken = urlUserToken[1];
      expiry = urlExpiry[1];
      window.setTimeout(() => userToken = '', expiry * 1000);
      window.history.pushState('Access Token', null, '/');
    } else {
      window.location = spotifyUrl;
    }
  },

  search(term) {
    const accessToken = Spotify.getAccessToken();
    return fetch(`https://api.spotify.com/v1/search?type=track&q=${term}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    }).then(response => response.json())
      .then(jsonResponse => {
        if (!jsonResponse.tracks) {
          return [];
        }
        return jsonResponse.tracks.items.map(track => {
          return {
            id: track.id,
            name: track.name,
            artist: track.artists[0].name,
            album: track.album.name,
            uri: track.uri
          };
      });
    });
  },

  savePlaylist(name, tracks) {
    if (!name || !tracks.length) {
      return;
    }
    const accessToken = Spotify.getAccessToken();
    const headers = {
      Authorization: `Bearer ${accessToken}`
    };
    let userId;
    return fetch(`https://api.spotify.com/v1/me`, { headers: headers })
      .then(response => response.json())
      .then(jsonResponse => {
        userId = jsonResponse.id;
        return (fetch(`https://api.spotify.com/v1/users/${userId}/playlists`,{
          headers: headers,
          method: 'POST',
          body: JSON.stringify({ name: name })
        })
        .then(response => response.json())
        .then(jsonResponse => {
          const playlistId = jsonResponse.id;
          return fetch(`https://api.spotify.com/v1/users/${userId}/playlists/${playlistId}/tracks`, {
            headers: headers,
            method: 'POST',
            body: JSON.stringify({ uris: tracks })
          });
        }));
      });
  },
};

export default Spotify;
