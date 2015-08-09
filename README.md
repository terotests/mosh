# Mosh - the Model Object Stream Handler

Basicly, you can just create a _data -object like this:

```javascript
var d = _data({ color : "blue" });
d.color("red"); // sets the value
```
But the primary use of this module is to create buch of models to interconnect using data streaming.

To connect to data stream you have to authenticate with the server and provide a socket.io socket to use for the virtual connections

```javascript
var d = _data("http://localhost:1234/my/new/channel", {
    auth : {
        username : "username",
        password : "password"
    },
    ioLib : realSocket
});
d.then( function() {
    // start using the data
});
```

Stream of data is then persisted to server and will be syncronized between multiple clients.

1. Wraps socket.io to deliver data automatically when modified, like `obj.color("red")`
2. Suports `Objects`, `Object value properties`, `Object Array properties`, `Arrays of Objects` - Arrays of values like [1,2,3] because they do not have reference ID
3. Data recovery after sync or connection failure
4. Authentication system with `sha3` password hashing
5. Server data can be stored in-memory or filesystem
6. It is easy to create headless clients to act as daemons to the system

All the data is stored to filesystem so it is easy to verify actions and what is going on the the system

The filesystem for the database might look like this `test/new/fork2` 
````
-rw-r--r--   1 ttolonen  staff     181 Aug  9 01:02 ch.settings
-rw-r--r--   1 ttolonen  staff    4104 Aug  8 22:45 file.2
-rw-r--r--   1 ttolonen  staff    4993 Aug  8 23:03 file.3
-rw-r--r--   1 ttolonen  staff    4849 Aug  8 23:04 file.4
-rw-r--r--   1 ttolonen  staff    5260 Aug  8 23:05 file.5
-rw-r--r--   1 ttolonen  staff    5164 Aug  8 23:05 file.6
-rw-r--r--   1 ttolonen  staff   21219 Aug  9 01:02 file.7
-rw-r--r--   1 ttolonen  staff     485 Aug  9 00:27 forks
-rw-r--r--   1 ttolonen  staff  658544 Aug  8 21:57 journal.1
-rw-r--r--   1 ttolonen  staff  495675 Aug  8 23:02 journal.2
-rw-r--r--   1 ttolonen  staff     728 Aug  8 23:04 journal.3
-rw-r--r--   1 ttolonen  staff    1255 Aug  8 23:04 journal.4
-rw-r--r--   1 ttolonen  staff     344 Aug  8 23:05 journal.5
-rw-r--r--   1 ttolonen  staff   77051 Aug  9 01:02 journal.6
-rw-r--r--   1 ttolonen  staff     286 Aug  9 01:02 journal.7
```

The `ch.settings` holds information about the channel

```javascript
{ "version":7,
  "name":"Kokeilu",
  "utc":1438942214152,
  "channelId":"test/new/fork2",
  "journalLine":4,
  "fromJournalLine":76,
  "fromVersion":1,
  "from":"my/channel/myFork",
  "to":"test/new/fork2"}
```

In plain words that tells that this channel is at version 7, line 4 and is a fork from other channels first `my/channel/myFork` version 1 line 76.
It also tells that the name of the fork was "Kokeilu".

Each version - with the exception of version 1 - have a base file `file.N` representing the JSON object without modifications. Journal is a list of commands applied to that object.

```javascript
-rw-r--r--   1 ttolonen  staff    5260 Aug  8 23:05 file.5
-rw-r--r--   1 ttolonen  staff     344 Aug  8 23:05 journal.5
```

The main file has the Objects and ACL like this:

```javascript
{
  "data" : {
      "x" : 100,
      "y" : 100,
      "color" : "red"
  },
  __id : "m6cq0z12pckp4zb5psbvfvlp4l",
  __acl":"A:g:users@:rwx\nA:g:admins@:rwxadtTnNcCy"
}
```

The ACL defines the groups that have access to the channel, use must have at least "r" flag set to read and "w" to write to the channel.

The journal looks something like this:

```javascript
[8,5,"bzag2ftsohkf074zydqy3ofbyy",0,"4ug00jgyrf61d6b9i3la5di2ui",1439064340525,"id1"]
[8,5,"c5pxdt1gql37sgiyrw7hi5jii1",0,"4ug00jgyrf61d6b9i3la5di2ui",1439064340752,"id1"]
[8,5,"qolere9fjp4iyxxq079vvt06hi",0,"4ug00jgyrf61d6b9i3la5di2ui",1439064340983,"id1"]
[8,5,"lurgv0l9nhkqe8qzrn64f26wjc",0,"4ug00jgyrf61d6b9i3la5di2ui",1439064341242,"id1"]
```


# Setting up a client
```javascript
var dataModule = require("./mosh-0.50.js");

var ioLib = require('socket.io-client')
var realSocket = ioLib.connect("http://localhost:7777");

var _data = dataModule._data;

// Define the virtual server to connect to
var d = _data("http://localhost:1234/my/new/channel", {
    auth : {
        username : "Tero",
        password : "teropw"
    },
    ioLib : realSocket
});

d.then( function() {
   // show raw contents
   console.log(JSON.stringify( d.toPlainData()) );
   
   // listen to changes to color from other clients 
   d.on("color", function() {
       // The color has changed!!!
   });
});

```
# Setting up a test server (incomplete)

Missing from the setup:

1. Creating basic auth file
2. Creating basic sandbox


```javascript
var dataModule = require("./mosh-0.50.js");
var app = require('express')();
var http = require('http').Server(app);
var ioLib = require('socket.io')(http);

// virtual server listening port 1234 - there can be several virtual
// servers behind a one physical socket connection
var serverSocket = dataModule._serverSocket("http://localhost", 1234, ioLib);

var pwFs     = dataModule.fsServerNode("/path/to/test/directory/auth/");
var filesystem = dataModule.fsServerNode("/path/to/test/directory/sandbox/");
var _data = dataModule._data;

var fs = require("fs");
app.get('/', function(req, res){ 
    // server HTML requests here
});

// note: 7777 is here the actual port to connect real socket.
http.listen(7777, function(){ console.log('listening on *:7777'); });

pwFs.then( 
    function() {
        return filesystem;
    }). then( function() {

        // password filesystem, sandbox and authentication manager
        var pwRoot = pwFs.getRootFolder();
        var fsRoot = filesystem.getRootFolder();
        var auth = dataModule.authFuzz(pwRoot);

        // the channel manager requires virtual socket to listen to
        var manager  = dataModule._serverChannelMgr( serverSocket, fsRoot, auth );


});
```


