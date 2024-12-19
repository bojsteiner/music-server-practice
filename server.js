const http = require('http');
const fs = require('fs');

/* ============================ SERVER DATA ============================ */
let artists = JSON.parse(fs.readFileSync('./seeds/artists.json'));
let albums = JSON.parse(fs.readFileSync('./seeds/albums.json'));
let songs = JSON.parse(fs.readFileSync('./seeds/songs.json'));

let nextArtistId = 2;
let nextAlbumId = 2;
let nextSongId = 2;

// returns an artistId for a new artist
function getNewArtistId() {
  const newArtistId = nextArtistId;
  nextArtistId++;
  return newArtistId;
}

// returns an albumId for a new album
function getNewAlbumId() {
  const newAlbumId = nextAlbumId;
  nextAlbumId++;
  return newAlbumId;
}

// returns an songId for a new song
function getNewSongId() {
  const newSongId = nextSongId;
  nextSongId++;
  return newSongId;
}

/* ======================= PROCESS SERVER REQUESTS ======================= */
const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  // assemble the request body
  let reqBody = "";
  req.on("data", (data) => {
    reqBody += data;
  });

  req.on("end", () => { // finished assembling the entire request body
    // Parsing the body of the request depending on the "Content-Type" header
    if (reqBody) {
      switch (req.headers['content-type']) {
        case "application/json":
          req.body = JSON.parse(reqBody);
          break;
        case "application/x-www-form-urlencoded":
          req.body = reqBody
            .split("&")
            .map((keyValuePair) => keyValuePair.split("="))
            .map(([key, value]) => [key, value.replace(/\+/g, " ")])
            .map(([key, value]) => [key, decodeURIComponent(value)])
            .reduce((acc, [key, value]) => {
              acc[key] = value;
              return acc;
            }, {});
          break;
        default:
          break;
      }
      console.log(req.body);
    }

    /* ========================== ROUTE HANDLERS ========================== */

    const substrings = req.url.split('/');
    const substringCount = req.url.split('/').length;

    function error(message) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({"message": message}));
    }

    if(req.method === 'GET' && req.url.startsWith('/artists')) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      //'/artists'
      if(substringCount == 2) {
        return res.end(JSON.stringify(artists))
      } else if (substringCount >= 3) {
        const artistId = substrings[2];
        if(artists[artistId]){
          let artistAlbums = [];
          for(const album in albums) {
            if(albums[album].artistId == artistId) {
              artistAlbums.push(albums[album])
            }
          }
        //'/artists/:artistId
          if(substringCount == 3) {
            res.body = {
              "artistId": artists[artistId].artistId,
              "name": artists[artistId].name,
              "albums": artistAlbums
            }
            return res.end(JSON.stringify(res.body))
        //'/artists/:artistId/albums
          } else if (substringCount == 4 && substrings[3] == 'albums'){
            return res.end(JSON.stringify(artistAlbums));
        //'/artists/:artistId/songs
          } else if (substringCount == 4 && substrings[3] == 'songs') {
            let artistSongs = [];
            for (const album of artistAlbums) {
              for (const song in songs) {
                if(songs[song].albumId == album.albumId) {
                  artistSongs.push(songs[song]);
                }
              }
            }

            return res.end(JSON.stringify(artistSongs));

          }
        //'/artists/:artistId(that doesn't exist)
        } else {
          return error('No artist with that ID');
        }
      } 
    }

    if(req.method === 'GET' && req.url.startsWith('/albums')) {
      //'/albums/:albumId
      if (substringCount => 3) {
        const albumId = substrings[2];
        const album = albums[albumId];
        
        if(album) {
          res.statusCode = 200;
          res.setHeader('Content-Type','application/json');
          const artist = artists[album.artistId];
          let artistSongs = [];
          for(const song in songs) {
            if(songs[song].albumId == albumId) {
              artistSongs.push(songs[song]);
            }
          }
          //'/albums/:albumId'
          if(substringCount == 3) {

            res.body = {
              "name": album.name,
              "albumId": album.albumId,
              "artistId": album.artistId,
              "artist": artist,
              "songs": artistSongs
            }
            return res.end(JSON.stringify(res.body))

          } else if (substringCount == 4 && substrings[3] === 'songs') {
            return res.end(JSON.stringify(artistSongs));
          }
          
        } else {
          return error('No album with that ID')
        }
        
      }
    }

    if (req.method === 'GET' && req.url.startsWith('/trackNumbers')) {
      if (substringCount => 3 && substrings[3 === 'songs']) {
        const trackNumber = substrings[2];
        let returnedSongs = [];
        for (const song in songs) {
          if(songs[song].trackNumber == trackNumber) {
            returnedSongs.push(songs[song]);
          }
        }
        res.statusCode = 200;
        res.setHeader('Content-Type','application/json');
        return res.end(JSON.stringify(returnedSongs));
      }
    }

    if(req.method == 'GET' && req.url.startsWith('/songs')) {
      if(substringCount === 3) {
        const songId = substrings[2];
        if(songs[songId]) {
          const song = songs[songId];
          const album = albums[song.albumId];
          const artist = artists[album.artistId];
          res.body = {
            "name": song.name,
            "lyrics": song.lyrics,
            "trackNumber": song.trackNumber,
            "songId": song.songId,
            "albumId": song.albumId,
            album,
            artist
          }

          res.statusCode = 200;
          res.setHeader('Content-Type','application/json');
          return res.end(JSON.stringify(res.body));
          
        } else {
          return error('No song with that ID')
        }
      }
    }

    if(req.method === 'POST' && req.url.startsWith('/artists')) {
      res.statusCode = 201;
      res.setHeader('Content-Type', 'application/json');
      if(substringCount == 2) {
        const artistId = getNewArtistId();

        let newArtist = {
          "artistId": artistId,
          "name": req.body.name
        };

        artists[artistId] = newArtist;
        return res.end(JSON.stringify(newArtist))

      } else if (substringCount == 4 && substrings[3] === 'albums') {
        const artistId = substrings[2];
        console.log(artists[artistId]);
        if(artists[artistId]) {
          const newAlbumId = getNewAlbumId()
          let newAlbum = {
            "albumdId": newAlbumId,
            "name": req.body.name,
            "artistsId": artistId
          };
  
          albums[newAlbumId] = newAlbum;
          return res.end(JSON.stringify(newAlbum));
          
        }
        
      }
      
    }

    if(req.method === 'POST' && req.url.startsWith('/albums')){
      if(substringCount == 4 && substrings[3] === 'songs') {
        const albumId = substrings[2];
        if(albums[albumId]) {
          const songId = getNewSongId();
          let newSong = {
            "name": req.body.name,
            "lyrics": req.body.lyrics,
            "trackNumber": req.body.trackNumber,
            "songId": songId,
            "albumId": albumId
          };
          songs[songId] = newSong;
          res.statusCode = 201;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify(newSong));
        }
        
      }
    }

    if(req.method === 'PATCH' && req.url.startsWith('/artists')) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      if (substringCount == 3) {
        const artistId = substrings[2];
        if(artists[artistId]){

          artists[artistId].name = req.body.name;
          artists[artistId].updatedAt = new Date(Date.now()).toString();
         
          return res.end(JSON.stringify(artists[artistId]));
        } else {
          return error('No artist with that ID');
        }
      }
    }

    if(req.method === 'PATCH' && req.url.startsWith('/albums')) {
      if(substringCount == 3) {
        const albumId = substrings[2];
        if(albums[albumId]){

          albums[albumId].name = req.body.name ? req.body.name : albums[albumId].name;
          albums[albumId].artistId = req.body.artistId ? req.body.artistId : albums[albumId].artistId;
          albums[albumId].updatedAt = new Date(Date.now()).toString();

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');

          return res.end(JSON.stringify(albums[albumId]));

        } else {

          return error('No album with that ID')

        }
      }
    }

    if(req.method === 'PATCH' && req.url.startsWith('/songs')) {
      if(substringCount == 3) {
        const songId = substrings[2];
        if(songs[songId]){

          songs[songId].name = req.body.name ? req.body.name : songs[songId].name;
          songs[songId].albumId = req.body.albumId ? req.body.albumId : songs[songId].albumId;
          songs[songId].lyrics = req.body.lyrics ? req.body.lyrics : songs[songId].lyrics;
          songs[songId].trackNumber = req.body.trackNumber ? req.body.trackNumber: songs[songId].trackNumber;
          songs[songId].updatedAt = new Date(Date.now()).toString();

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');

          return res.end(JSON.stringify(songs[songId]));

        } else {

          return error('No song with that ID')

        }
      }
    }

    if(req.method === 'DELETE' && req.url.startsWith('/artists')) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      if (substringCount == 3) {
        const artistId = substrings[2];
        if(artists[artistId]){
          delete artists[artistId];
          return res.end(JSON.stringify({"message": "Successfully deleted"}));
        } else {
          return error('No artist with that ID');
        }
      }
    }

    if(req.method === 'DELETE' && req.url.startsWith('/albums')) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      if (substringCount == 3) {
        const albumId = substrings[2];
        if(albums[albumId]){
          delete albums[albumId];
          return res.end(JSON.stringify({"message": "Successfully deleted"}));
        } else {
          return error('No album with that ID');
        }
      }
    }

    if(req.method === 'DELETE' && req.url.startsWith('/songs')) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      if (substringCount == 3) {
        const songId = substrings[2];
        if(songs[songId]){
          delete songs[songId];
          return res.end(JSON.stringify({"message": "Successfully deleted"}));
        } else {
          return error('No song with that ID');
        }
      }
    }

    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.write("Endpoint not found");
    return res.end();
  });
});

const port = process.env.PORT || 3000;

server.listen(port, () => console.log('Server is listening on port', port));