# Mosh - the Model Object Stream Handler

In-browser demo

 * http://jsfiddle.net/vudje24t/

Basicly, you can just create a _data -object like this:

```javascript
var d = _data({ color : "blue" });
d.then(
  function() {
     d.color("red"); // sets the value
  });
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
2. Suports `Objects`, `Object value properties`, `Object Array properties`, `Arrays of Objects` - not supported are Arrays of values like [1,2,3] because they do not have reference ID
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



















   

 


   
#### Class moshModule





   
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    


   
      
            
#### Class lokkiLoki





   
    
    
    
    


   
      
            
#### Class later


- [add](README.md#later_add)
- [after](README.md#later_after)
- [asap](README.md#later_asap)
- [every](README.md#later_every)
- [once](README.md#later_once)
- [onFrame](README.md#later_onFrame)
- [polyfill](README.md#later_polyfill)
- [removeFrameFn](README.md#later_removeFrameFn)



   


   



      
    
      
            
#### Class lokki


- [_classFactory](README.md#lokki__classFactory)
- [_initLogRefresh](README.md#lokki__initLogRefresh)
- [addMetrics](README.md#lokki_addMetrics)
- [enable](README.md#lokki_enable)
- [log](README.md#lokki_log)
- [recordHeap](README.md#lokki_recordHeap)
- [settings](README.md#lokki_settings)
- [value](README.md#lokki_value)



   
    
##### trait _dataTrait

- [guid](README.md#_dataTrait_guid)
- [isArray](README.md#_dataTrait_isArray)
- [isFunction](README.md#_dataTrait_isFunction)
- [isObject](README.md#_dataTrait_isObject)


    
    


   
      
    



      
    



      
    
      
            
#### Class channelTesting


- [pwFilesystem](README.md#channelTesting_pwFilesystem)
- [serverSetup1](README.md#channelTesting_serverSetup1)
- [testFilesystem1](README.md#channelTesting_testFilesystem1)



   
    
    


   
      
            
#### Class testFs





   


   



      
    



      
    
      
            
#### Class _promise


- [all](README.md#_promise_all)
- [collect](README.md#_promise_collect)
- [fail](README.md#_promise_fail)
- [fulfill](README.md#_promise_fulfill)
- [genPlugin](README.md#_promise_genPlugin)
- [isFulfilled](README.md#_promise_isFulfilled)
- [isPending](README.md#_promise_isPending)
- [isRejected](README.md#_promise_isRejected)
- [nodeStyle](README.md#_promise_nodeStyle)
- [onStateChange](README.md#_promise_onStateChange)
- [plugin](README.md#_promise_plugin)
- [props](README.md#_promise_props)
- [reject](README.md#_promise_reject)
- [rejectReason](README.md#_promise_rejectReason)
- [resolve](README.md#_promise_resolve)
- [state](README.md#_promise_state)
- [then](README.md#_promise_then)
- [triggerStateChange](README.md#_promise_triggerStateChange)
- [value](README.md#_promise_value)



   
    
##### trait util_fns

- [isArray](README.md#util_fns_isArray)
- [isFunction](README.md#util_fns_isFunction)
- [isObject](README.md#util_fns_isObject)


    
    
    
    


   
      
    
      
            
#### Class later


- [add](README.md#later_add)
- [after](README.md#later_after)
- [asap](README.md#later_asap)
- [every](README.md#later_every)
- [once](README.md#later_once)
- [onFrame](README.md#later_onFrame)
- [polyfill](README.md#later_polyfill)
- [removeFrameFn](README.md#later_removeFrameFn)



   


   



      
    



      
    
      
            
#### Class simpleStream


- [addObserver](README.md#simpleStream_addObserver)
- [branch](README.md#simpleStream_branch)
- [branchIfOk](README.md#simpleStream_branchIfOk)
- [collectValuesFor](README.md#simpleStream_collectValuesFor)
- [combineLatest](README.md#simpleStream_combineLatest)
- [filter](README.md#simpleStream_filter)
- [forContext](README.md#simpleStream_forContext)
- [forEach](README.md#simpleStream_forEach)
- [getLastProcess](README.md#simpleStream_getLastProcess)
- [isActiveRunning](README.md#simpleStream_isActiveRunning)
- [killAll](README.md#simpleStream_killAll)
- [map](README.md#simpleStream_map)
- [pushValue](README.md#simpleStream_pushValue)
- [reduce](README.md#simpleStream_reduce)
- [startProcess](README.md#simpleStream_startProcess)
- [step](README.md#simpleStream_step)



   
    
    
    
##### trait _dataTrait

- [guid](README.md#_dataTrait_guid)
- [isArray](README.md#_dataTrait_isArray)
- [isFunction](README.md#_dataTrait_isFunction)
- [isObject](README.md#_dataTrait_isObject)


    
    
    
    
    
    
    
    


   
      
            
#### Class _promise


- [all](README.md#_promise_all)
- [collect](README.md#_promise_collect)
- [fail](README.md#_promise_fail)
- [fulfill](README.md#_promise_fulfill)
- [genPlugin](README.md#_promise_genPlugin)
- [isFulfilled](README.md#_promise_isFulfilled)
- [isPending](README.md#_promise_isPending)
- [isRejected](README.md#_promise_isRejected)
- [nodeStyle](README.md#_promise_nodeStyle)
- [onStateChange](README.md#_promise_onStateChange)
- [plugin](README.md#_promise_plugin)
- [props](README.md#_promise_props)
- [reject](README.md#_promise_reject)
- [rejectReason](README.md#_promise_rejectReason)
- [resolve](README.md#_promise_resolve)
- [state](README.md#_promise_state)
- [then](README.md#_promise_then)
- [triggerStateChange](README.md#_promise_triggerStateChange)
- [value](README.md#_promise_value)



   
    
##### trait util_fns

- [isArray](README.md#util_fns_isArray)
- [isFunction](README.md#util_fns_isFunction)
- [isObject](README.md#util_fns_isObject)


    
    
    
    


   
      
    
      
            
#### Class later


- [add](README.md#later_add)
- [after](README.md#later_after)
- [asap](README.md#later_asap)
- [every](README.md#later_every)
- [once](README.md#later_once)
- [onFrame](README.md#later_onFrame)
- [polyfill](README.md#later_polyfill)
- [removeFrameFn](README.md#later_removeFrameFn)



   


   



      
    



      
    
      
    
      
            
#### Class later


- [add](README.md#later_add)
- [after](README.md#later_after)
- [asap](README.md#later_asap)
- [every](README.md#later_every)
- [once](README.md#later_once)
- [onFrame](README.md#later_onFrame)
- [polyfill](README.md#later_polyfill)
- [removeFrameFn](README.md#later_removeFrameFn)



   


   



      
    
      
            
#### Class sequenceStepper


- [_classFactory](README.md#sequenceStepper__classFactory)
- [addCommands](README.md#sequenceStepper_addCommands)
- [step](README.md#sequenceStepper_step)



   
    
##### trait _dataTrait

- [guid](README.md#_dataTrait_guid)
- [isArray](README.md#_dataTrait_isArray)
- [isFunction](README.md#_dataTrait_isFunction)
- [isObject](README.md#_dataTrait_isObject)


    
    


   
      
    



      
    
      
            
#### Class streamProcessor


- [cont](README.md#streamProcessor_cont)
- [ctxVar](README.md#streamProcessor_ctxVar)
- [get](README.md#streamProcessor_get)
- [getRest](README.md#streamProcessor_getRest)
- [getState](README.md#streamProcessor_getState)
- [getValue](README.md#streamProcessor_getValue)
- [killAll](README.md#streamProcessor_killAll)
- [run](README.md#streamProcessor_run)
- [set](README.md#streamProcessor_set)
- [setContext](README.md#streamProcessor_setContext)
- [setParent](README.md#streamProcessor_setParent)
- [start](README.md#streamProcessor_start)
- [step](README.md#streamProcessor_step)
- [stopStream](README.md#streamProcessor_stopStream)



   
    
##### trait _dataTrait

- [guid](README.md#_dataTrait_guid)
- [isArray](README.md#_dataTrait_isArray)
- [isFunction](README.md#_dataTrait_isFunction)
- [isObject](README.md#_dataTrait_isObject)


    
    


   
      
    



      
    



      
    
      
            
#### Class _data


- [_addFactoryProperty](README.md#_data__addFactoryProperty)
- [_classFactory](README.md#_data__classFactory)
- [_initWorkers](README.md#_data__initWorkers)
- [_objEventWorker](README.md#_data__objEventWorker)
- [_parseURL](README.md#_data__parseURL)
- [addToCache](README.md#_data_addToCache)
- [channel](README.md#_data_channel)
- [createSubClass](README.md#_data_createSubClass)
- [diff](README.md#_data_diff)
- [disconnect](README.md#_data_disconnect)
- [fork](README.md#_data_fork)
- [getChannelClient](README.md#_data_getChannelClient)
- [getChannelData](README.md#_data_getChannelData)
- [patch](README.md#_data_patch)
- [reconnect](README.md#_data_reconnect)
- [registerComponent](README.md#_data_registerComponent)



   
    
##### trait _dataTrait

- [__dataTr](README.md#_dataTrait___dataTr)
- [_collectObject](README.md#_dataTrait__collectObject)
- [_forMembers](README.md#_dataTrait__forMembers)
- [_initializeData](README.md#_dataTrait__initializeData)
- [_objectCreateCmds](README.md#_dataTrait__objectCreateCmds)
- [_parseURL](README.md#_dataTrait__parseURL)
- [_reGuidRawData](README.md#_dataTrait__reGuidRawData)
- [_wrapToData](README.md#_dataTrait__wrapToData)
- [addController](README.md#_dataTrait_addController)
- [askChannelQuestion](README.md#_dataTrait_askChannelQuestion)
- [at](README.md#_dataTrait_at)
- [clear](README.md#_dataTrait_clear)
- [clone](README.md#_dataTrait_clone)
- [copyToData](README.md#_dataTrait_copyToData)
- [createArrayField](README.md#_dataTrait_createArrayField)
- [createField](README.md#_dataTrait_createField)
- [createObjectField](README.md#_dataTrait_createObjectField)
- [createPropertyUpdateFn](README.md#_dataTrait_createPropertyUpdateFn)
- [createWorker](README.md#_dataTrait_createWorker)
- [emitValue](README.md#_dataTrait_emitValue)
- [extendWith](README.md#_dataTrait_extendWith)
- [find](README.md#_dataTrait_find)
- [forEach](README.md#_dataTrait_forEach)
- [get](README.md#_dataTrait_get)
- [getData](README.md#_dataTrait_getData)
- [getID](README.md#_dataTrait_getID)
- [guid](README.md#_dataTrait_guid)
- [hasOwn](README.md#_dataTrait_hasOwn)
- [indexOf](README.md#_dataTrait_indexOf)
- [insertAt](README.md#_dataTrait_insertAt)
- [isArray](README.md#_dataTrait_isArray)
- [isDataTrait](README.md#_dataTrait_isDataTrait)
- [isFunction](README.md#_dataTrait_isFunction)
- [isObject](README.md#_dataTrait_isObject)
- [item](README.md#_dataTrait_item)
- [keys](README.md#_dataTrait_keys)
- [length](README.md#_dataTrait_length)
- [moveDown](README.md#_dataTrait_moveDown)
- [moveToIndex](README.md#_dataTrait_moveToIndex)
- [moveUp](README.md#_dataTrait_moveUp)
- [onValue](README.md#_dataTrait_onValue)
- [parent](README.md#_dataTrait_parent)
- [pick](README.md#_dataTrait_pick)
- [pop](README.md#_dataTrait_pop)
- [push](README.md#_dataTrait_push)
- [redo](README.md#_dataTrait_redo)
- [remove](README.md#_dataTrait_remove)
- [removeListener](README.md#_dataTrait_removeListener)
- [renderTemplate](README.md#_dataTrait_renderTemplate)
- [serialize](README.md#_dataTrait_serialize)
- [set](README.md#_dataTrait_set)
- [toData](README.md#_dataTrait_toData)
- [toPlainData](README.md#_dataTrait_toPlainData)
- [undo](README.md#_dataTrait_undo)
- [unset](README.md#_dataTrait_unset)


    
    
    
##### trait eventTrait

- [on](README.md#eventTrait_on)
- [removeListener](README.md#eventTrait_removeListener)
- [trigger](README.md#eventTrait_trigger)


    
    
    
##### trait workerShortcuts

- [propWorker](README.md#workerShortcuts_propWorker)


    
    


   
      
    
      
    
      
    



      
    
      
            
#### Class channelObjects





   
    
    
    
    
    
    


   
      
            
#### Class aceCmdConvert


- [fromAce](README.md#aceCmdConvert_fromAce)
- [reverse](README.md#aceCmdConvert_reverse)
- [runToAce](README.md#aceCmdConvert_runToAce)
- [runToLineObj](README.md#aceCmdConvert_runToLineObj)
- [runToString](README.md#aceCmdConvert_runToString)
- [simplify](README.md#aceCmdConvert_simplify)



   


   



      
    
      
            
#### Class diffEngine


- [_createModelCommands](README.md#diffEngine__createModelCommands)
- [addedObjects](README.md#diffEngine_addedObjects)
- [commonObjects](README.md#diffEngine_commonObjects)
- [compareFiles](README.md#diffEngine_compareFiles)
- [findObjects](README.md#diffEngine_findObjects)
- [missingObjects](README.md#diffEngine_missingObjects)
- [objectDiff](README.md#diffEngine_objectDiff)
- [restackOps](README.md#diffEngine_restackOps)



   
    
##### trait _dataTrait

- [guid](README.md#_dataTrait_guid)
- [isArray](README.md#_dataTrait_isArray)
- [isFunction](README.md#_dataTrait_isFunction)
- [isObject](README.md#_dataTrait_isObject)


    
    


   
      
    



      
    
      
            
#### Class _channelData


- [_addToCache](README.md#_channelData__addToCache)
- [_classFactory](README.md#_channelData__classFactory)
- [_cmd](README.md#_channelData__cmd)
- [_createModelCommands](README.md#_channelData__createModelCommands)
- [_createNewModel](README.md#_channelData__createNewModel)
- [_find](README.md#_channelData__find)
- [_findObjects](README.md#_channelData__findObjects)
- [_getObjectHash](README.md#_channelData__getObjectHash)
- [_prepareData](README.md#_channelData__prepareData)
- [_wCmd](README.md#_channelData__wCmd)
- [_wrapData](README.md#_channelData__wrapData)
- [createWorker](README.md#_channelData_createWorker)
- [getData](README.md#_channelData_getData)
- [indexOf](README.md#_channelData_indexOf)
- [setWorkerCommands](README.md#_channelData_setWorkerCommands)
- [toPlainData](README.md#_channelData_toPlainData)
- [writeCommand](README.md#_channelData_writeCommand)



   
    
##### trait _dataTrait

- [guid](README.md#_dataTrait_guid)
- [isArray](README.md#_dataTrait_isArray)
- [isFunction](README.md#_dataTrait_isFunction)
- [isObject](README.md#_dataTrait_isObject)


    
    
    
##### trait commad_trait

- [_cmd_aceCmd](README.md#commad_trait__cmd_aceCmd)
- [_cmd_createArray](README.md#commad_trait__cmd_createArray)
- [_cmd_createObject](README.md#commad_trait__cmd_createObject)
- [_cmd_moveToIndex](README.md#commad_trait__cmd_moveToIndex)
- [_cmd_pushToArray](README.md#commad_trait__cmd_pushToArray)
- [_cmd_removeObject](README.md#commad_trait__cmd_removeObject)
- [_cmd_setMeta](README.md#commad_trait__cmd_setMeta)
- [_cmd_setProperty](README.md#commad_trait__cmd_setProperty)
- [_cmd_setPropertyObject](README.md#commad_trait__cmd_setPropertyObject)
- [_cmd_unsetProperty](README.md#commad_trait__cmd_unsetProperty)
- [_fireListener](README.md#commad_trait__fireListener)
- [_moveCmdListToParent](README.md#commad_trait__moveCmdListToParent)
- [_reverse_aceCmd](README.md#commad_trait__reverse_aceCmd)
- [_reverse_createObject](README.md#commad_trait__reverse_createObject)
- [_reverse_moveToIndex](README.md#commad_trait__reverse_moveToIndex)
- [_reverse_pushToArray](README.md#commad_trait__reverse_pushToArray)
- [_reverse_removeObject](README.md#commad_trait__reverse_removeObject)
- [_reverse_setMeta](README.md#commad_trait__reverse_setMeta)
- [_reverse_setProperty](README.md#commad_trait__reverse_setProperty)
- [_reverse_setPropertyObject](README.md#commad_trait__reverse_setPropertyObject)
- [_reverse_unsetProperty](README.md#commad_trait__reverse_unsetProperty)
- [execCmd](README.md#commad_trait_execCmd)
- [getJournalCmd](README.md#commad_trait_getJournalCmd)
- [getJournalLine](README.md#commad_trait_getJournalLine)
- [getLocalJournal](README.md#commad_trait_getLocalJournal)
- [redo](README.md#commad_trait_redo)
- [reverseCmd](README.md#commad_trait_reverseCmd)
- [reverseNLines](README.md#commad_trait_reverseNLines)
- [reverseToLine](README.md#commad_trait_reverseToLine)
- [undo](README.md#commad_trait_undo)
- [writeLocalJournal](README.md#commad_trait_writeLocalJournal)


    
    


   
      
    
      
    



      
    



      
    
      
            
#### Class _channels





   
    
    
    
    
    
    
    
    
    
    
    
    


   
      
            
#### Class later


- [add](README.md#later_add)
- [asap](README.md#later_asap)
- [every](README.md#later_every)
- [once](README.md#later_once)
- [onFrame](README.md#later_onFrame)
- [polyfill](README.md#later_polyfill)
- [removeFrameFn](README.md#later_removeFrameFn)



   


   



      
    
      
            
#### Class _promise


- [all](README.md#_promise_all)
- [collect](README.md#_promise_collect)
- [fail](README.md#_promise_fail)
- [fulfill](README.md#_promise_fulfill)
- [isFulfilled](README.md#_promise_isFulfilled)
- [isPending](README.md#_promise_isPending)
- [isRejected](README.md#_promise_isRejected)
- [onStateChange](README.md#_promise_onStateChange)
- [reject](README.md#_promise_reject)
- [rejectReason](README.md#_promise_rejectReason)
- [resolve](README.md#_promise_resolve)
- [state](README.md#_promise_state)
- [then](README.md#_promise_then)
- [triggerStateChange](README.md#_promise_triggerStateChange)
- [value](README.md#_promise_value)



   
    
##### trait util_fns

- [isArray](README.md#util_fns_isArray)
- [isFunction](README.md#util_fns_isFunction)
- [isObject](README.md#util_fns_isObject)


    
    


   
      
    



      
    
      
            
#### Class sequenceStepper


- [_classFactory](README.md#sequenceStepper__classFactory)
- [addCommands](README.md#sequenceStepper_addCommands)
- [step](README.md#sequenceStepper_step)



   
    
##### trait _dataTrait

- [guid](README.md#_dataTrait_guid)
- [isArray](README.md#_dataTrait_isArray)
- [isFunction](README.md#_dataTrait_isFunction)
- [isObject](README.md#_dataTrait_isObject)


    
    


   
      
    



      
    
      
            
#### Class _serverChannelMgr


- [addSocketToCh](README.md#_serverChannelMgr_addSocketToCh)
- [getSocketsFromCh](README.md#_serverChannelMgr_getSocketsFromCh)
- [removeSocketFromCh](README.md#_serverChannelMgr_removeSocketFromCh)



   


   



      
    
      
            
#### Class _localChannelModel


- [_classFactory](README.md#_localChannelModel__classFactory)
- [_createChannelDir](README.md#_localChannelModel__createChannelDir)
- [_createChannelSettings](README.md#_localChannelModel__createChannelSettings)
- [_isFreeToFork](README.md#_localChannelModel__isFreeToFork)
- [_textLinesToArray](README.md#_localChannelModel__textLinesToArray)
- [_writeSettings](README.md#_localChannelModel__writeSettings)
- [childForkTree](README.md#_localChannelModel_childForkTree)
- [fork](README.md#_localChannelModel_fork)
- [get](README.md#_localChannelModel_get)
- [getCurrentVersion](README.md#_localChannelModel_getCurrentVersion)
- [getForks](README.md#_localChannelModel_getForks)
- [incrementVersion](README.md#_localChannelModel_incrementVersion)
- [readBuildTree](README.md#_localChannelModel_readBuildTree)
- [readJournal](README.md#_localChannelModel_readJournal)
- [readMain](README.md#_localChannelModel_readMain)
- [set](README.md#_localChannelModel_set)
- [snapshot](README.md#_localChannelModel_snapshot)
- [status](README.md#_localChannelModel_status)
- [treeOfLife](README.md#_localChannelModel_treeOfLife)
- [writeMain](README.md#_localChannelModel_writeMain)
- [writeToJournal](README.md#_localChannelModel_writeToJournal)



   
    
##### trait _dataTrait

- [guid](README.md#_dataTrait_guid)
- [isArray](README.md#_dataTrait_isArray)
- [isFunction](README.md#_dataTrait_isFunction)
- [isObject](README.md#_dataTrait_isObject)


    
    


   
      
    



      
    
      
            
#### Class _channelController


- [_askChUpgrade](README.md#_channelController__askChUpgrade)
- [_classFactory](README.md#_channelController__classFactory)
- [_doClientUpdate](README.md#_channelController__doClientUpdate)
- [_groupACL](README.md#_channelController__groupACL)
- [_initCmds](README.md#_channelController__initCmds)
- [_updateLoop](README.md#_channelController__updateLoop)
- [run](README.md#_channelController_run)



   


   



      
    



      
    
      
            
#### Class channelClientModule





   
    
    
    
    
    
    


   
      
            
#### Class later


- [add](README.md#later_add)
- [asap](README.md#later_asap)
- [every](README.md#later_every)
- [once](README.md#later_once)
- [onFrame](README.md#later_onFrame)
- [polyfill](README.md#later_polyfill)
- [removeFrameFn](README.md#later_removeFrameFn)



   


   



      
    
      
            
#### Class _promise


- [all](README.md#_promise_all)
- [collect](README.md#_promise_collect)
- [fail](README.md#_promise_fail)
- [fulfill](README.md#_promise_fulfill)
- [isFulfilled](README.md#_promise_isFulfilled)
- [isPending](README.md#_promise_isPending)
- [isRejected](README.md#_promise_isRejected)
- [onStateChange](README.md#_promise_onStateChange)
- [reject](README.md#_promise_reject)
- [rejectReason](README.md#_promise_rejectReason)
- [resolve](README.md#_promise_resolve)
- [state](README.md#_promise_state)
- [then](README.md#_promise_then)
- [triggerStateChange](README.md#_promise_triggerStateChange)
- [value](README.md#_promise_value)



   
    
##### trait util_fns

- [isArray](README.md#util_fns_isArray)
- [isFunction](README.md#util_fns_isFunction)
- [isObject](README.md#util_fns_isObject)


    
    


   
      
    



      
    
      
            
#### Class channelClient


- [_classFactory](README.md#channelClient__classFactory)
- [_createTransaction](README.md#channelClient__createTransaction)
- [_fetch](README.md#channelClient__fetch)
- [_incoming](README.md#channelClient__incoming)
- [_onFrameLoop](README.md#channelClient__onFrameLoop)
- [addCommand](README.md#channelClient_addCommand)
- [askUpgrade](README.md#channelClient_askUpgrade)
- [at](README.md#channelClient_at)
- [disconnect](README.md#channelClient_disconnect)
- [fork](README.md#channelClient_fork)
- [get](README.md#channelClient_get)
- [getChannelData](README.md#channelClient_getChannelData)
- [getData](README.md#channelClient_getData)
- [indexOf](README.md#channelClient_indexOf)
- [length](README.md#channelClient_length)
- [moveDown](README.md#channelClient_moveDown)
- [moveTo](README.md#channelClient_moveTo)
- [moveUp](README.md#channelClient_moveUp)
- [reconnect](README.md#channelClient_reconnect)
- [redo](README.md#channelClient_redo)
- [remove](README.md#channelClient_remove)
- [set](README.md#channelClient_set)
- [setObject](README.md#channelClient_setObject)
- [undo](README.md#channelClient_undo)
- [unset](README.md#channelClient_unset)
- [upgradeVersion](README.md#channelClient_upgradeVersion)



   
    
##### trait _dataTrait

- [guid](README.md#_dataTrait_guid)
- [isArray](README.md#_dataTrait_isArray)
- [isFunction](README.md#_dataTrait_isFunction)
- [isObject](README.md#_dataTrait_isObject)


    
    
    
##### trait commad_trait

- [_getNsFromUrl](README.md#commad_trait__getNsFromUrl)
- [_getNsShorthand](README.md#commad_trait__getNsShorthand)
- [_getReflections](README.md#commad_trait__getReflections)
- [_getReflectionsFor](README.md#commad_trait__getReflectionsFor)
- [_getReverseNs](README.md#commad_trait__getReverseNs)
- [_idFromNs](README.md#commad_trait__idFromNs)
- [_idToNs](README.md#commad_trait__idToNs)
- [_nsFromId](README.md#commad_trait__nsFromId)
- [_transformCmdFromNs](README.md#commad_trait__transformCmdFromNs)
- [_transformCmdToNs](README.md#commad_trait__transformCmdToNs)
- [_transformObjFromNs](README.md#commad_trait__transformObjFromNs)
- [_transformObjToNs](README.md#commad_trait__transformObjToNs)
- [_transformToNsBeforeInsert](README.md#commad_trait__transformToNsBeforeInsert)


    
    


   
      
    
      
    



      
    



      
    
      
            
#### Class socketEmulator





   
    
##### trait _dataTrait

- [guid](README.md#_dataTrait_guid)
- [isArray](README.md#_dataTrait_isArray)
- [isFunction](README.md#_dataTrait_isFunction)
- [isObject](README.md#_dataTrait_isObject)


    
    
    
    
    
    
    
    
    
    
    
    


   
      
    
      
            
#### Class _clientSocket


- [disconnect](README.md#_clientSocket_disconnect)
- [emit](README.md#_clientSocket_emit)
- [getEnum](README.md#_clientSocket_getEnum)
- [getId](README.md#_clientSocket_getId)
- [send](README.md#_clientSocket_send)



   
    
##### trait _dataTrait

- [guid](README.md#_dataTrait_guid)
- [isArray](README.md#_dataTrait_isArray)
- [isFunction](README.md#_dataTrait_isFunction)
- [isObject](README.md#_dataTrait_isObject)


    
    
    
##### trait events

- [on](README.md#_on)
- [removeListener](README.md#_removeListener)
- [trigger](README.md#_trigger)


    
    


   
      
    
      
    



      
    
      
            
#### Class _serverSocket


- [getPrefix](README.md#_serverSocket_getPrefix)



   
    
##### trait events

- [on](README.md#_on)
- [trigger](README.md#_trigger)


    
    


   
      
    



      
    
      
            
#### Class _tcpEmu


- [close](README.md#_tcpEmu_close)
- [memoryPump](README.md#_tcpEmu_memoryPump)
- [messageFrom](README.md#_tcpEmu_messageFrom)
- [messageTo](README.md#_tcpEmu_messageTo)
- [socketPump](README.md#_tcpEmu_socketPump)



   
    
##### trait events

- [on](README.md#_on)
- [trigger](README.md#_trigger)


    
    
    
##### trait _dataTrait

- [guid](README.md#_dataTrait_guid)
- [isArray](README.md#_dataTrait_isArray)
- [isFunction](README.md#_dataTrait_isFunction)
- [isObject](README.md#_dataTrait_isObject)


    
    


   
      
    
      
    



      
    
      
            
#### Class later


- [add](README.md#later_add)
- [asap](README.md#later_asap)
- [every](README.md#later_every)
- [once](README.md#later_once)
- [onFrame](README.md#later_onFrame)
- [polyfill](README.md#later_polyfill)
- [removeFrameFn](README.md#later_removeFrameFn)



   


   



      
    
      
            
#### Class _serverSocketWrap


- [delegateToRoom](README.md#_serverSocketWrap_delegateToRoom)
- [disconnect](README.md#_serverSocketWrap_disconnect)
- [emit](README.md#_serverSocketWrap_emit)
- [getId](README.md#_serverSocketWrap_getId)
- [getUserId](README.md#_serverSocketWrap_getUserId)
- [getUserRoles](README.md#_serverSocketWrap_getUserRoles)
- [isConnected](README.md#_serverSocketWrap_isConnected)
- [isInRoom](README.md#_serverSocketWrap_isInRoom)
- [join](README.md#_serverSocketWrap_join)
- [leave](README.md#_serverSocketWrap_leave)
- [leaveFromRooms](README.md#_serverSocketWrap_leaveFromRooms)
- [removeListener](README.md#_serverSocketWrap_removeListener)
- [setAuthInfo](README.md#_serverSocketWrap_setAuthInfo)
- [to](README.md#_serverSocketWrap_to)



   
    
##### trait events

- [on](README.md#_on)
- [trigger](README.md#_trigger)


    
    


   
      
    



      
    



      
    
      
            
#### Class nfs4_acl


- [addPermission](README.md#nfs4_acl_addPermission)
- [allowGroup](README.md#nfs4_acl_allowGroup)
- [allowUser](README.md#nfs4_acl_allowUser)
- [denyGroup](README.md#nfs4_acl_denyGroup)
- [denyUser](README.md#nfs4_acl_denyUser)
- [filter](README.md#nfs4_acl_filter)
- [find](README.md#nfs4_acl_find)
- [fromObject](README.md#nfs4_acl_fromObject)
- [getACL](README.md#nfs4_acl_getACL)
- [has](README.md#nfs4_acl_has)
- [map](README.md#nfs4_acl_map)
- [push](README.md#nfs4_acl_push)
- [reduce](README.md#nfs4_acl_reduce)
- [removeAll](README.md#nfs4_acl_removeAll)
- [removePermission](README.md#nfs4_acl_removePermission)
- [replaceLines](README.md#nfs4_acl_replaceLines)
- [toObject](README.md#nfs4_acl_toObject)



   


   



      
    
      
            
#### Class authModule





   
    
    
    
    
    
##### trait _dataTrait

- [guid](README.md#_dataTrait_guid)
- [isArray](README.md#_dataTrait_isArray)
- [isFunction](README.md#_dataTrait_isFunction)
- [isObject](README.md#_dataTrait_isObject)


    
    
    
    
    
    


   
      
            
#### Class later


- [add](README.md#later_add)
- [asap](README.md#later_asap)
- [every](README.md#later_every)
- [once](README.md#later_once)
- [onFrame](README.md#later_onFrame)
- [polyfill](README.md#later_polyfill)
- [removeFrameFn](README.md#later_removeFrameFn)



   


   



      
    
      
            
#### Class _promise


- [all](README.md#_promise_all)
- [collect](README.md#_promise_collect)
- [fail](README.md#_promise_fail)
- [fulfill](README.md#_promise_fulfill)
- [isFulfilled](README.md#_promise_isFulfilled)
- [isPending](README.md#_promise_isPending)
- [isRejected](README.md#_promise_isRejected)
- [onStateChange](README.md#_promise_onStateChange)
- [reject](README.md#_promise_reject)
- [rejectReason](README.md#_promise_rejectReason)
- [resolve](README.md#_promise_resolve)
- [state](README.md#_promise_state)
- [then](README.md#_promise_then)
- [triggerStateChange](README.md#_promise_triggerStateChange)
- [value](README.md#_promise_value)



   
    
##### trait util_fns

- [isArray](README.md#util_fns_isArray)
- [isFunction](README.md#util_fns_isFunction)
- [isObject](README.md#util_fns_isObject)


    
    


   
      
    



      
    
      
    
      
            
#### Class authFuzz


- [_getGroupNames](README.md#authFuzz__getGroupNames)
- [addUserToGroup](README.md#authFuzz_addUserToGroup)
- [changePassword](README.md#authFuzz_changePassword)
- [changeUsername](README.md#authFuzz_changeUsername)
- [createUser](README.md#authFuzz_createUser)
- [getUserData](README.md#authFuzz_getUserData)
- [getUserGroups](README.md#authFuzz_getUserGroups)
- [hash](README.md#authFuzz_hash)
- [login](README.md#authFuzz_login)
- [removeUserGroup](README.md#authFuzz_removeUserGroup)



   
    
##### trait _dataTrait

- [guid](README.md#_dataTrait_guid)
- [isArray](README.md#_dataTrait_isArray)
- [isFunction](README.md#_dataTrait_isFunction)
- [isObject](README.md#_dataTrait_isObject)


    
    


   
      
    



      
    
      
            
#### Class _sha3


- [_initSha](README.md#_sha3__initSha)
- [keccak](README.md#_sha3_keccak)
- [keccak_224](README.md#_sha3_keccak_224)
- [keccak_256](README.md#_sha3_keccak_256)
- [keccak_512](README.md#_sha3_keccak_512)
- [sha3_224](README.md#_sha3_sha3_224)
- [sha3_256](README.md#_sha3_sha3_256)
- [sha3_512](README.md#_sha3_sha3_512)



   


   



      
    



      
    
      
            
#### Class localFs





   
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    


   
      
            
#### Class _promise


- [all](README.md#_promise_all)
- [collect](README.md#_promise_collect)
- [fail](README.md#_promise_fail)
- [fulfill](README.md#_promise_fulfill)
- [isFulfilled](README.md#_promise_isFulfilled)
- [isPending](README.md#_promise_isPending)
- [isRejected](README.md#_promise_isRejected)
- [onStateChange](README.md#_promise_onStateChange)
- [reject](README.md#_promise_reject)
- [rejectReason](README.md#_promise_rejectReason)
- [resolve](README.md#_promise_resolve)
- [state](README.md#_promise_state)
- [then](README.md#_promise_then)
- [triggerStateChange](README.md#_promise_triggerStateChange)
- [value](README.md#_promise_value)



   
    
##### trait util_fns

- [isArray](README.md#util_fns_isArray)
- [isFunction](README.md#util_fns_isFunction)
- [isObject](README.md#util_fns_isObject)


    
    
    
    


   
      
    
      
            
#### Class later


- [add](README.md#later_add)
- [after](README.md#later_after)
- [asap](README.md#later_asap)
- [every](README.md#later_every)
- [once](README.md#later_once)
- [onFrame](README.md#later_onFrame)
- [polyfill](README.md#later_polyfill)
- [removeFrameFn](README.md#later_removeFrameFn)



   


   



      
    



      
    
      
            
#### Class _localDB


- [_initDB](README.md#_localDB__initDB)
- [clearDatabases](README.md#_localDB_clearDatabases)
- [getDB](README.md#_localDB_getDB)
- [table](README.md#_localDB_table)



   
    
    
    
##### trait _dataTrait

- [guid](README.md#_dataTrait_guid)
- [isArray](README.md#_dataTrait_isArray)
- [isFunction](README.md#_dataTrait_isFunction)
- [isObject](README.md#_dataTrait_isObject)


    
    


   
      
            
#### Class dbTable


- [_cursorAction](README.md#dbTable__cursorAction)
- [addRows](README.md#dbTable_addRows)
- [clear](README.md#dbTable_clear)
- [count](README.md#dbTable_count)
- [forEach](README.md#dbTable_forEach)
- [get](README.md#dbTable_get)
- [getAll](README.md#dbTable_getAll)
- [readAndDelete](README.md#dbTable_readAndDelete)
- [remove](README.md#dbTable_remove)
- [update](README.md#dbTable_update)



   
    
##### trait _dataTrait

- [guid](README.md#_dataTrait_guid)
- [isArray](README.md#_dataTrait_isArray)
- [isFunction](README.md#_dataTrait_isFunction)
- [isObject](README.md#_dataTrait_isObject)


    
    


   
      
    



      
    
      
    



      
    
      
            
#### Class memoryFsFolder


- [_isFile](README.md#memoryFsFolder__isFile)
- [_isFolder](README.md#memoryFsFolder__isFolder)
- [appendFile](README.md#memoryFsFolder_appendFile)
- [createDir](README.md#memoryFsFolder_createDir)
- [findPath](README.md#memoryFsFolder_findPath)
- [fromData](README.md#memoryFsFolder_fromData)
- [getFolder](README.md#memoryFsFolder_getFolder)
- [getSubFolderObj](README.md#memoryFsFolder_getSubFolderObj)
- [getTree](README.md#memoryFsFolder_getTree)
- [id](README.md#memoryFsFolder_id)
- [isFile](README.md#memoryFsFolder_isFile)
- [isFolder](README.md#memoryFsFolder_isFolder)
- [linesToJsonArray](README.md#memoryFsFolder_linesToJsonArray)
- [listFiles](README.md#memoryFsFolder_listFiles)
- [listFolders](README.md#memoryFsFolder_listFolders)
- [readFile](README.md#memoryFsFolder_readFile)
- [removeFile](README.md#memoryFsFolder_removeFile)
- [toData](README.md#memoryFsFolder_toData)
- [writeFile](README.md#memoryFsFolder_writeFile)



   
    
##### trait _dataTrait

- [guid](README.md#_dataTrait_guid)
- [isArray](README.md#_dataTrait_isArray)
- [isFunction](README.md#_dataTrait_isFunction)
- [isObject](README.md#_dataTrait_isObject)


    
    


   
      
    



      
    
      
            
#### Class fsServerMemory


- [_initServers](README.md#fsServerMemory__initServers)
- [getRootFolder](README.md#fsServerMemory_getRootFolder)



   


   



      
    
      
            
#### Class nodeFsFolder


- [_mkDir](README.md#nodeFsFolder__mkDir)
- [appendFile](README.md#nodeFsFolder_appendFile)
- [createDir](README.md#nodeFsFolder_createDir)
- [findPath](README.md#nodeFsFolder_findPath)
- [fromData](README.md#nodeFsFolder_fromData)
- [getFolder](README.md#nodeFsFolder_getFolder)
- [getSubFolderObj](README.md#nodeFsFolder_getSubFolderObj)
- [getTree](README.md#nodeFsFolder_getTree)
- [id](README.md#nodeFsFolder_id)
- [isFile](README.md#nodeFsFolder_isFile)
- [isFolder](README.md#nodeFsFolder_isFolder)
- [linesToJsonArray](README.md#nodeFsFolder_linesToJsonArray)
- [listFiles](README.md#nodeFsFolder_listFiles)
- [listFolders](README.md#nodeFsFolder_listFolders)
- [readFile](README.md#nodeFsFolder_readFile)
- [removeFile](README.md#nodeFsFolder_removeFile)
- [toData](README.md#nodeFsFolder_toData)
- [writeFile](README.md#nodeFsFolder_writeFile)



   
    
##### trait _dataTrait

- [guid](README.md#_dataTrait_guid)
- [isArray](README.md#_dataTrait_isArray)
- [isFunction](README.md#_dataTrait_isFunction)
- [isObject](README.md#_dataTrait_isObject)


    
    


   
      
    



      
    
      
            
#### Class indexedDBFsFolder


- [_classFactory](README.md#indexedDBFsFolder__classFactory)
- [_filePath](README.md#indexedDBFsFolder__filePath)
- [_initCreateDir](README.md#indexedDBFsFolder__initCreateDir)
- [_initFromData](README.md#indexedDBFsFolder__initFromData)
- [_isFile](README.md#indexedDBFsFolder__isFile)
- [_isFolder](README.md#indexedDBFsFolder__isFolder)
- [_lastPath](README.md#indexedDBFsFolder__lastPath)
- [_loadFiles](README.md#indexedDBFsFolder__loadFiles)
- [_loadFolders](README.md#indexedDBFsFolder__loadFolders)
- [_normalize](README.md#indexedDBFsFolder__normalize)
- [_onlyClearWrites](README.md#indexedDBFsFolder__onlyClearWrites)
- [_removeFileFromCache](README.md#indexedDBFsFolder__removeFileFromCache)
- [_removeFolderFromCache](README.md#indexedDBFsFolder__removeFolderFromCache)
- [_writeFile](README.md#indexedDBFsFolder__writeFile)
- [appendFile](README.md#indexedDBFsFolder_appendFile)
- [createDir](README.md#indexedDBFsFolder_createDir)
- [findPath](README.md#indexedDBFsFolder_findPath)
- [fromData](README.md#indexedDBFsFolder_fromData)
- [getFolder](README.md#indexedDBFsFolder_getFolder)
- [getSubFolderObj](README.md#indexedDBFsFolder_getSubFolderObj)
- [getTree](README.md#indexedDBFsFolder_getTree)
- [id](README.md#indexedDBFsFolder_id)
- [isFile](README.md#indexedDBFsFolder_isFile)
- [isFolder](README.md#indexedDBFsFolder_isFolder)
- [linesToJsonArray](README.md#indexedDBFsFolder_linesToJsonArray)
- [listFiles](README.md#indexedDBFsFolder_listFiles)
- [listFolders](README.md#indexedDBFsFolder_listFolders)
- [readFile](README.md#indexedDBFsFolder_readFile)
- [removeFile](README.md#indexedDBFsFolder_removeFile)
- [toData](README.md#indexedDBFsFolder_toData)
- [writeFile](README.md#indexedDBFsFolder_writeFile)



   
    
##### trait _dataTrait

- [guid](README.md#_dataTrait_guid)
- [isArray](README.md#_dataTrait_isArray)
- [isFunction](README.md#_dataTrait_isFunction)
- [isObject](README.md#_dataTrait_isObject)


    
    


   
      
    



      
    
      
            
#### Class fsServerIndexedDB


- [_classFactory](README.md#fsServerIndexedDB__classFactory)
- [createFrom](README.md#fsServerIndexedDB_createFrom)
- [getDb](README.md#fsServerIndexedDB_getDb)
- [getID](README.md#fsServerIndexedDB_getID)
- [getRootFolder](README.md#fsServerIndexedDB_getRootFolder)



   
    
##### trait _dataTrait

- [guid](README.md#_dataTrait_guid)
- [isArray](README.md#_dataTrait_isArray)
- [isFunction](README.md#_dataTrait_isFunction)
- [isObject](README.md#_dataTrait_isObject)


    
    


   
      
    



      
    
      
            
#### Class fsServerNode


- [_initServers](README.md#fsServerNode__initServers)
- [getRootFolder](README.md#fsServerNode_getRootFolder)



   


   



      
    



      
    
      
            
#### Class channelPolicyModule





   
    
    


   
      
            
#### Class _chPolicy


- [constructClientToServer](README.md#_chPolicy_constructClientToServer)
- [constructServerToClient](README.md#_chPolicy_constructServerToClient)
- [deltaClientToServer](README.md#_chPolicy_deltaClientToServer)
- [deltaServerToClient](README.md#_chPolicy_deltaServerToClient)



   
    
##### trait _dataTrait

- [guid](README.md#_dataTrait_guid)
- [isArray](README.md#_dataTrait_isArray)
- [isFunction](README.md#_dataTrait_isFunction)
- [isObject](README.md#_dataTrait_isObject)


    
    


   
      
    



      
    



      
    
      
            
#### Class subClassTemplate


- [helloWorld](README.md#subClassTemplate_helloWorld)



   


   



      
    





   
# Class moshModule


The class has following internal singleton variables:
        
        
### moshModule::constructor( main )

```javascript

```
        


   
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    


   
      
            
# Class lokkiLoki


The class has following internal singleton variables:
        
        
### lokkiLoki::constructor( options )

```javascript

```
        


   
    
    
    
    


   
      
            
# Class later


The class has following internal singleton variables:
        
* _initDone
        
* _callers
        
* _oneTimers
        
* _everies
        
* _framers
        
* _localCnt
        
        
### <a name="later_add"></a>later::add(fn, thisObj, args)


```javascript
if(thisObj || args) {
   var tArgs;
   if( Object.prototype.toString.call( args ) === '[object Array]' ) {
       tArgs = args;
   } else {
       tArgs = Array.prototype.slice.call(arguments, 2);
       if(!tArgs) tArgs = [];
   }
   _callers.push([thisObj, fn, tArgs]);   
} else {
    _callers.push(fn);
}
```

### <a name="later_after"></a>later::after(seconds, fn, name)


```javascript

if(!name) {
    name = "aft7491_"+(_localCnt++);
}

_everies[name] = {
    step : Math.floor(seconds * 1000),
    fn : fn,
    nextTime : 0,
    remove : true
};
```

### <a name="later_asap"></a>later::asap(fn)


```javascript
this.add(fn);

```

### <a name="later_every"></a>later::every(seconds, fn, name)


```javascript

if(!name) {
    name = "t7491_"+(_localCnt++);
}

_everies[name] = {
    step : Math.floor(seconds * 1000),
    fn : fn,
    nextTime : 0
};
```

### later::constructor( interval, fn )

```javascript
if(!_initDone) {

   _localCnt=1;
   this.polyfill();
 
   var frame, cancelFrame;
   if(typeof(window) != "undefined") {
       var frame = window['requestAnimationFrame'], 
           cancelFrame= window['cancelRequestAnimationFrame'];
       ['', 'ms', 'moz', 'webkit', 'o'].forEach( function(x) { 
           if(!frame) {
            frame = window[x+'RequestAnimationFrame'];
            cancelFrame = window[x+'CancelAnimationFrame'] 
                                       || window[x+'CancelRequestAnimationFrame'];
           }
        });
   }
 
    if (!frame)
        frame= function(cb) {
            return setTimeout(cb, 16);
        };
 
    if (!cancelFrame)
        cancelFrame = function(id) {
            clearTimeout(id);
        };    
        
    _callers = [];
    _oneTimers = {};
    _everies = {};
    _framers = [];
    var lastMs = 0;
    
    var _callQueQue = function() {
       var ms = (new Date()).getTime();
       var fn;
       while(fn=_callers.shift()) {
          if(Object.prototype.toString.call( fn ) === '[object Array]' ) {
              fn[1].apply(fn[0], fn[2]);
          } else {
              fn();
          }
           
       }
       
       for(var i=0; i<_framers.length;i++) {
           var fFn = _framers[i];
           fFn();
       }
       
       for(var n in _oneTimers) {
           if(_oneTimers.hasOwnProperty(n)) {
               var v = _oneTimers[n];
               v[0](v[1]);
               delete _oneTimers[n];
           }
       }
       
       for(var n in _everies) {
           if(_everies.hasOwnProperty(n)) {
               var v = _everies[n];
               if(v.nextTime < ms) {
                   if(v.remove) {
                       if(v.nextTime > 0) {
                          v.fn(); 
                          delete _everies[n];
                       } else {
                          v.nextTime = ms + v.step; 
                       }
                   } else {
                       v.fn();
                       v.nextTime = ms + v.step;
                   }
               }
               if(v.until) {
                   if(v.until < ms) {
                       delete _everies[n];
                   }
               }
           }
       }       
       
       frame(_callQueQue);
       lastMs = ms;
    };
    _callQueQue();
    _initDone = true;
}
```
        
### <a name="later_once"></a>later::once(key, fn, value)


```javascript
// _oneTimers

_oneTimers[key] = [fn,value];
```

### <a name="later_onFrame"></a>later::onFrame(fn)


```javascript

_framers.push(fn);
```

### <a name="later_polyfill"></a>later::polyfill(t)


```javascript
// --- let's not ---
```

### <a name="later_removeFrameFn"></a>later::removeFrameFn(fn)


```javascript

var i = _framers.indexOf(fn);
if(i>=0) {
    if(fn._onRemove) {
        fn._onRemove();
    }
    _framers.splice(i,1);
    return true;
} else {
    return false;
}
```



   


   



      
    
      
            
# Class lokki


The class has following internal singleton variables:
        
* _instanceCache
        
* _settings
        
* _fs
        
* _logFileInited
        
* _options
        
        
### <a name="lokki__classFactory"></a>lokki::_classFactory(id)


```javascript
if(!id) return;

if(!_instanceCache) _instanceCache = {};
if(_instanceCache[id]) return _instanceCache[id];
_instanceCache[id] = this;
```

### <a name="lokki__initLogRefresh"></a>lokki::_initLogRefresh(options)

Initializes the settings refresh for logging
```javascript

// simple node.js detection
if(typeof(global) == "undefined") return;
if(typeof(process) == "undefined") return;

if(_logFileInited) return;

if(!_fs) _fs = require("fs");

var secs = options.logFileRefresh || 60;

_logFileInited = true;
var me = this;

later().every(secs, function() {
     // console.log("checking log file "+options.logSettingsFile);
     _fs.readFile(options.logSettingsFile, "utf8", function (err, data) {
        if (err) return;
        try {
            var o = JSON.parse(data);
            if(o && o.enable) {
                for(var n in o.enable) {
                    if(o.enable.hasOwnProperty(n)) _settings[n] = o.enable[n];
                }
            }
            if(o) {
                for(var n in o) {
                    if(o.hasOwnProperty(n)) {
                        if(n=="enable") continue;
                        me._options[n] = o[n];
                    }
                }
            }            
            // console.log(JSON.stringify(o));
        } catch(e) {
            
        }
        
    });    
});


```

### <a name="lokki_addMetrics"></a>lokki::addMetrics(name, value)


```javascript

if(!_settings[this._tag]) return;

var mObj = this._metrics[name];

if(!mObj) {
    mObj = this._metrics[name] = {
        cnt : 0,
        latest : value,
        min : value,
        max : value,
        total : 0
    };
}

value = value * 1.0;

if(isNaN(value)) return;

mObj.cnt++;
mObj.total += value;
mObj.latest = value;

if(mObj.max < value) mObj.max = value;
if(mObj.min > value) mObj.min = value;

mObj.avg = mObj.total / mObj.cnt;


```

### <a name="lokki_enable"></a>lokki::enable(obj)


```javascript

if(obj) {

    if(obj) {
        for(var n in obj) {
            if(obj.hasOwnProperty(n)) _settings[n] = obj[n];
        }
    }    
    
}
```

### lokki::constructor( tag, options )

```javascript

options = options || {};

this._tag = tag;
this._log = [];

if(!_options) {
    _options = {}; // global fo this class
}

this._options = _options;

if(typeof(global) != "undefined" && typeof(process) != "undefined") {
    this._isNode = true;
}

for(var n in options) {
    if(n=="enable") continue;
    if(options.hasOwnProperty(n)) _options[n] = options[n];
}

options.logInterval = options.logInterval || 1;
options.metricsInterval = options.metricsInterval || 10;

// logging certain performance charateristics
this._metrics = {};

if(!_settings) {
    _settings = {};
}

if(options.enable) {
    for(var n in options.enable) {
        if(options.enable.hasOwnProperty(n)) _settings[n] = options.enable[n];
    }
}

if(options.logSettingsFile) {
    this._initLogRefresh(options);
}

var me = this;

var _log1 = function() {
    
    
    if(!_settings[me._tag]) return;
    if(me._log.length==0) return;

    if(me._options["logFile"] && me._isNode) {
        if(!_fs) _fs = require("fs");
        var str = "";
        var dT = (new Date()).toISOString();
        str+=dT;
        me._log.forEach( function(c, line) {
            if(line>0) str+="\n"+dT;
            c.forEach(function(s,i) {
                if(i>0) str+=",";
                if(me.isObject(s)) {
                    str+="[Object]";
                    return;
                } 
                if(me.isArray(s)) {
                    str+="[Array]";
                    return;
                }
                str+=JSON.stringify(s);
            });
        });       
        str+="\n";
        _fs.appendFile(me._options["logFile"], str, function (err) {
            
        });        
    }
    
    if(me._options["console"]) {
        if(!console.group) {
            console.log("--- "+me._tag+" ----- ");
            me._log.forEach( function(c) {
                if(c.length==1) console.log(c[0]); 
                if(c.length==2) console.log(c[0],c[1]); 
                if(c.length==3) console.log(c[0],c[1],c[2]); 
                if(c.length==4) console.log(c[0],c[1],c[2],c[3]); 
            });
            me._log.length=0;        
            return;
        }
        
        console.group(me._tag);
        me._log.forEach( function(c) {
            if(c.length==1) console.log(c[0]); 
            if(c.length==2) console.log(c[0],c[1]); 
            if(c.length==3) console.log(c[0],c[1],c[2]); 
            if(c.length==4) console.log(c[0],c[1],c[2],c[3]); 
        });
        console.groupEnd();
    } 
    me._log.length=0;
};

var _log2 = function() {
    
    if(!_settings[me._tag]) return;
    if(!me._options["console"]) return;
    
    if(me._logMemoryCnt && me._logMemoryCnt > 0) {
        me._logMemoryCnt--;
        if(process && process.memoryUsage) {
            var util = require('util');
            
            // var o = JSON.parse( util.inspect(process.memoryUsage()) );
            var o = process.memoryUsage();

            me.value("rss", o["rss"]);
            me.value("heapTotal", o.heapTotal);
            me.value("heapUsed", o.heapUsed);
            me.value("heapUsage", parseInt( 100* o.heapUsed / o.heapTotal) );
            me.value("fromTotalGb", parseFloat( 100* o.heapTotal / (1024*1024*1024) ).toFixed(2) );
            /*
{ rss: 4935680,
  heapTotal: 1826816,
  heapUsed: 650472 }            
            */
        }
        // process.memoryUsage()
    }
    
    if(console && console.group) {
        console.group("Metrics");
        console.table(me._metrics, ["cnt", "latest","min", "max", "avg"]);
        console.groupEnd();
    } else {
        var mCnt=0;
       for(var n in me._metrics) {
           mCnt++;
           if(mCnt==1) console.log("=== node.js METRICS ===");
           var o = me._metrics[n];
           console.log(n, o["cnt"], o["latest"], o["min"], o["max"], o["avg"]   );
       }
    }
    
};


later().every(options.logInterval, _log1);
later().every(options.metricsInterval, _log2);
```
        
### <a name="lokki_log"></a>lokki::log(t)


```javascript

if(!_settings[this._tag]) {
    return;
}

var data = [];
// iterate through the arguments array...
for(var i=0; i<arguments.length; i++) {
    data.push(arguments[i]);
}
this._log.push( data );
```

### <a name="lokki_recordHeap"></a>lokki::recordHeap(cnt)


```javascript
this._logMemoryCnt = cnt;
```

### <a name="lokki_settings"></a>lokki::settings(obj)


```javascript

if(obj) {

    if(obj) {
        for(var n in obj) {
            if(obj.hasOwnProperty(n)) _settings[n] = obj[n];
        }
    }    
    
}
```

### <a name="lokki_value"></a>lokki::value(name, value)


```javascript
this.addMetrics(name, value);
```



   
    
## trait _dataTrait

The class has following internal singleton variables:
        
        
### <a name="_dataTrait_guid"></a>_dataTrait::guid(t)


```javascript
return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);

```

### <a name="_dataTrait_isArray"></a>_dataTrait::isArray(t)


```javascript
return t instanceof Array;
```

### <a name="_dataTrait_isFunction"></a>_dataTrait::isFunction(fn)


```javascript
return Object.prototype.toString.call(fn) == '[object Function]';
```

### <a name="_dataTrait_isObject"></a>_dataTrait::isObject(t)


```javascript
return t === Object(t);
```


    
    


   
      
    



      
    



      
    
      
            
# Class channelTesting


The class has following internal singleton variables:
        
        
### channelTesting::constructor( t )

```javascript

```
        
### <a name="channelTesting_pwFilesystem"></a>channelTesting::pwFilesystem(t)

The test users are &quot;Tero&quot; with password &quot;teropw&quot; and &quot;Juha&quot; with password &quot;juhapw&quot;. Juha has groups &quot;users&quot; and Tero has groups &quot;users&quot; and &quot;admins&quot;
```javascript

// The password and user infra, in the simulation environment:

var pwData = {
                "groups":{},
                "domains":{},
                "users":{
                        "505d18cbea690d03eb240729299468071c9f133758b6c527e2dddd458de2ad36":"ee8f858602fabad8e7f30372a4d910ab875b869d52d9206c0257d59678ba6031:id1:",
                        "dce8981dec48df66ed7b139dfd1a680aa1d404a006264f24fda9e0e598c1ac8a":"add2bbda7947ab86c2e9f277ccee254611bedd1e3b8542113ea36931c1fdbf3e:id2:"},
                "udata":{"id1":"{\"userName\":\"Tero\",\"domain\":\"\",\"hash\":\"505d18cbea690d03eb240729299468071c9f133758b6c527e2dddd458de2ad36\",\"groups\":\[\"users\",\"admins\"\]}",
                         "id2":"{\"userName\":\"Juha\",\"domain\":\"\",\"hash\":\"dce8981dec48df66ed7b139dfd1a680aa1d404a006264f24fda9e0e598c1ac8a\",\"groups\":\[\"users\"\]}"}};

var pwFiles = fsServerMemory("pwServer1", pwData);

return pwFiles;
```

### <a name="channelTesting_serverSetup1"></a>channelTesting::serverSetup1(options)


```javascript

var readyPromise = _promise();

var baseData = {
                data : { 
                    path : "M22.441,28.181c-0.419,0-0.835-0.132-1.189-0.392l-5.751-4.247L9.75,27.789c-0.354,0.26-0.771,0.392-1.189,0.392c-0.412,0-0.824-0.128-1.175-0.384c-0.707-0.511-1-1.422-0.723-2.25l2.26-6.783l-5.815-4.158c-0.71-0.509-1.009-1.416-0.74-2.246c0.268-0.826,1.037-1.382,1.904-1.382c0.004,0,0.01,0,0.014,0l7.15,0.056l2.157-6.816c0.262-0.831,1.035-1.397,1.906-1.397s1.645,0.566,1.906,1.397l2.155,6.816l7.15-0.056c0.004,0,0.01,0,0.015,0c0.867,0,1.636,0.556,1.903,1.382c0.271,0.831-0.028,1.737-0.739,2.246l-5.815,4.158l2.263,6.783c0.276,0.826-0.017,1.737-0.721,2.25C23.268,28.053,22.854,28.181,22.441,28.181L22.441,28.181z", 
                    fill : "red",
                    stroke : "black",
                    sub : {
                        data : {
                            value1 : "abba"  
                        },
                        __id : "sub1"
                    }
                },
                __id : "id1",
                __acl : "A:g:users@:rwx\nA:g:admins@:rwxadtTnNcCy"
            };
            
if(options && options.data) {
    baseData.data = options.data;
}
    
// create a channel files
var fsData = {
    "my" : {
        "channel" : {
            "journal.1" : "",
            "file.2" :  JSON.stringify(baseData),
            "journal.2" : JSON.stringify([4, "fill", "yellow", "red", "id1"])+"\n",
            "ch.settings" : JSON.stringify({
                version : 2,                        // version of the channel
                channelId : "my/channel",           // ID of this channel
                journalLine : 1,
                utc : 14839287897                   // UTC timestamp of creation                
            }),
            "forks"  : JSON.stringify({                 // == forks on list of forks
                    fromJournalLine : 1,               
                    version : 1,                        
                    channelId : "my/channel/myFork",    
                    fromVersion : 2,                    
                    from : "my/channel",                
                    to :  "my/channel/myFork",         
                    name : "test of fork",
                    utc : 14839287897                  
                }),
            "myFork" : {
                "journal.1" : JSON.stringify([4, "fill", "blue", "yellow", "id1"])+"\n",
                "ch.settings" : JSON.stringify({
                    fromJournalLine : 1,                // from which line the fork starts
                    version : 1,                        // version of the channel
                    channelId : "my/channel/myFork",    // ID of this channel
                    fromVersion : 2,                    // version of the fork's source
                    from : "my/channel",                // the fork channels ID
                    to :  "my/channel/myFork",          // forks target channel
                    journalLine : 1,
                    name : "test of fork",
                    utc : 14839287897                   // UTC timestamp of creation
                })
            }
        }
    }    
};

if(options && options.fileSystemData) {
    fsData = options.fileSystemData;
}

var filesystem = fsServerMemory("memoryServer1", fsData );

// The password and user infra, in the simulation environment:
var pwData = {
                "groups":{},
                "domains":{},
                "users":{
                        "505d18cbea690d03eb240729299468071c9f133758b6c527e2dddd458de2ad36":"ee8f858602fabad8e7f30372a4d910ab875b869d52d9206c0257d59678ba6031:id1:",
                        "dce8981dec48df66ed7b139dfd1a680aa1d404a006264f24fda9e0e598c1ac8a":"add2bbda7947ab86c2e9f277ccee254611bedd1e3b8542113ea36931c1fdbf3e:id2:"},
                "udata":{"id1":"{\"userName\":\"Tero\",\"domain\":\"\",\"hash\":\"505d18cbea690d03eb240729299468071c9f133758b6c527e2dddd458de2ad36\",\"groups\":\[\"users\",\"admins\"\]}",
                         "id2":"{\"userName\":\"Juha\",\"domain\":\"\",\"hash\":\"dce8981dec48df66ed7b139dfd1a680aa1d404a006264f24fda9e0e598c1ac8a\",\"groups\":\[\"users\"\]}"}};

var pwFiles = fsServerMemory("passWordServer", pwData);
pwFiles.then( function() { 
        return filesystem; 
    })
    .then( function() {
        
        // Setting up the server        
        var root  = pwFiles.getRootFolder();
        var auth = authFuzz(root);
        var fsRoot  = filesystem.getRootFolder();

        var server  = _serverSocket("http://localhost", 1234);
        var manager  = _serverChannelMgr( server, filesystem.getRootFolder(), auth );
        
        readyPromise.resolve({
            server : server,
            manager : manager,
            fsRoot : fsRoot,
            auth : auth,
            pwRoot : root
        });
        
    });
    
return readyPromise;
```

### <a name="channelTesting_testFilesystem1"></a>channelTesting::testFilesystem1(t)

Test filesystem 1 represents a channel &quot;my/channel&quot; with one fork with channelID &quot;my/channel/myFork&quot;.
```javascript
var fsData = {
    "my" : {
        "channel" : {
            "journal.1" : "",
            "file.2" :  JSON.stringify({
                data : { 
                    path : "M22.441,28.181c-0.419,0-0.835-0.132-1.189-0.392l-5.751-4.247L9.75,27.789c-0.354,0.26-0.771,0.392-1.189,0.392c-0.412,0-0.824-0.128-1.175-0.384c-0.707-0.511-1-1.422-0.723-2.25l2.26-6.783l-5.815-4.158c-0.71-0.509-1.009-1.416-0.74-2.246c0.268-0.826,1.037-1.382,1.904-1.382c0.004,0,0.01,0,0.014,0l7.15,0.056l2.157-6.816c0.262-0.831,1.035-1.397,1.906-1.397s1.645,0.566,1.906,1.397l2.155,6.816l7.15-0.056c0.004,0,0.01,0,0.015,0c0.867,0,1.636,0.556,1.903,1.382c0.271,0.831-0.028,1.737-0.739,2.246l-5.815,4.158l2.263,6.783c0.276,0.826-0.017,1.737-0.721,2.25C23.268,28.053,22.854,28.181,22.441,28.181L22.441,28.181z", 
                    fill : "red"            
                },
                __id : "id1",
                __acl : "A:g:users@:rwx\nA:g:admins@:rwxadtTnNcCy"
            }),
            "journal.2" : JSON.stringify([4, "fill", "yellow", "red", "id1"])+"\n",
            "ch.settings" : JSON.stringify({
                version : 2,                        // version of the channel
                channelId : "my/channel",           // ID of this channel
                journalLine : 1,
                utc : 14839287897                   // UTC timestamp of creation                
            }),
            "forks"  : JSON.stringify({                 // == forks on list of forks
                    fromJournalLine : 1,               
                    version : 1,                        
                    channelId : "my/channel/myFork",    
                    fromVersion : 2,                    
                    from : "my/channel",                
                    to :  "my/channel/myFork",         
                    name : "test of fork",
                    utc : 14839287897                  
                }),
            "myFork" : {
                "journal.1" : JSON.stringify([4, "fill", "blue", "yellow", "id1"])+"\n",
                "ch.settings" : JSON.stringify({
                    fromJournalLine : 1,                // from which line the fork starts
                    version : 1,                        // version of the channel
                    channelId : "my/channel/myFork",    // ID of this channel
                    fromVersion : 2,                    // version of the fork's source
                    from : "my/channel",                // the fork channels ID
                    to :  "my/channel/myFork",          // forks target channel
                    name : "test of fork",
                    utc : 14839287897                   // UTC timestamp of creation
                })
            }
        }
    }    
};

return 
```



   
    
    


   
      
            
# Class testFs


The class has following internal singleton variables:
        
* _instanceCache
        
        
### testFs::constructor( t )

```javascript

```
        


   


   



      
    



      
    
      
            
# Class _promise


The class has following internal singleton variables:
        
        
### <a name="_promise_all"></a>_promise::all(firstArg)


```javascript

var args;
if(this.isArray(firstArg)) {
  args = firstArg;
} else {
  args = Array.prototype.slice.call(arguments, 0);
}
// console.log(args);
var targetLen = args.length,
    rCnt = 0,
    myPromises = [],
    myResults = new Array(targetLen);
    
return this.then(
    function() {
 
        var allPromise = _promise();
        if(args.length==0) {
            allPromise.resolve([]);
        }
        args.forEach( function(b, index) {
            if(b.then) {
                // console.log("All, looking for ", b, " state = ", b._state);
                myPromises.push(b);
                
                b.then(function(v) {
                    myResults[index] = v;
                    // console.log("Got a promise...",b, " cnt = ", rCnt);
                    rCnt++;
                    if(rCnt==targetLen) {
                        allPromise.resolve(myResults);
                    }
                }, function(v) {
                    allPromise.reject(v);
                });
                
            } else {
                allPromise.reject("Not list of promises");
            }
        })
        
        return allPromise;
        
    });



    

```

### <a name="_promise_collect"></a>_promise::collect(collectFn, promiseList, results)


```javascript

var args;
if(this.isArray(promiseList)) {
  args = promiseList;
} else {
  args = [promiseList];
}

// console.log(args);
var targetLen = args.length,
    isReady = false,
    noMore = false,
    rCnt = 0,
    myPromises = [],
    myResults = results || {};
    
return this.then(
    function() {
 
        var allPromise = _promise();
        args.forEach( function(b, index) {
            if(b.then) {
                // console.log("All, looking for ", b, " state = ", b._state);
                myPromises.push(b);
                
                b.then(function(v) {
                    rCnt++;
                    isReady = collectFn(v, myResults);
                    if( (isReady && !noMore) || (noMore==false && targetLen == rCnt) ) {
                        allPromise.resolve(myResults);
                        noMore = true;
                    }
                }, function(v) {
                    allPromise.reject(v);
                });
                
            } else {
                allPromise.reject("Not list of promises");
            }
        })
        
        return allPromise;
        
    });

```

### <a name="_promise_fail"></a>_promise::fail(fn)


```javascript
return this.then(null, fn);
```

### <a name="_promise_fulfill"></a>_promise::fulfill(withValue)


```javascript
// if(this._fulfilled || this._rejected) return;

if(this._rejected) return;
if(this._fulfilled && withValue != this._stateValue) {
    return;
}

var me = this;
this._fulfilled = true;
this._stateValue = withValue;

var chCnt = this._childPromises.length;

while(chCnt--) {
    var p = this._childPromises.shift();
    if(p._onFulfill) {
        try {
            var x = p._onFulfill(withValue);
            // console.log("Returned ",x);
            if(typeof(x)!="undefined") {
                p.resolve(x);
            } else {
                p.fulfill(withValue);
            }
        } catch(e) {
            // console.error(e);
            /*
                If either onFulfilled or onRejected throws an exception e, promise2 
                must be rejected with e as the reason.            
            */
            p.reject(e);
        }
    } else {
        /*
            If onFulfilled is not a function and promise1 is fulfilled, promise2 must be 
            fulfilled with the same value as promise1        
        */
        p.fulfill(withValue);
    }
};
// this._childPromises.length = 0;
this._state = 1;
this.triggerStateChange();

```

### <a name="_promise_genPlugin"></a>_promise::genPlugin(fname, fn)


```javascript
var me = this;
this.plugin(fname,
    function() {
        var args = Array.prototype.slice.call(arguments,0);
        console.log("Plugin args", args);
        var myPromise = _promise();
        this.then(function(v) {
            var args2 = Array.prototype.slice.call(arguments,0);
            var z = args.concat(args2);
            var res = fn.apply(this,z); 
            myPromise.resolve(res);
        }, function(r) {
            myPromise.reject(r);
        });
        return myPromise;

    }
);
```

### _promise::constructor( onFulfilled, onRejected )

```javascript
// 0 = pending
// 1 = fullfilled
// 2 = error

this._state = 0;
this._stateValue = null;
this._isAPromise = true;
this._childPromises = [];

if(this.isFunction(onFulfilled))
    this._onFulfill = onFulfilled;
if(this.isFunction(onRejected))
    this._onReject = onRejected;
    
if(!onRejected && this.isFunction(onFulfilled) ) {
    
    
    
    var me = this;
    later().asap(
        function() {
            console.log("--- calling the onFulfilled ");
            onFulfilled( function(v) {
                me.resolve(v)
            }, function(v) {
                me.resolve(v);
            });           
        });
 
}
```
        
### <a name="_promise_isFulfilled"></a>_promise::isFulfilled(t)


```javascript
return this._state == 1;
```

### <a name="_promise_isPending"></a>_promise::isPending(t)


```javascript
return this._state == 0;
```

### <a name="_promise_isRejected"></a>_promise::isRejected(v)


```javascript
return this._state == 2;
```

### <a name="_promise_nodeStyle"></a>_promise::nodeStyle(fname, fn)


```javascript
var me = this;
this.plugin(fname,
    function() {
        var args = Array.prototype.slice.call(arguments,0);
        var last, userCb, cbIndex=0;
        if(args.length>=0) {
            last = args[args.length-1];
            if(Object.prototype.toString.call(last) == '[object Function]') {
                userCb = last;
                cbIndex = args.length-1;
            }
        }

        var mainPromise = wishes().pending();
        this.then(function() {
            var nodePromise = wishes().pending();
            var args2 = Array.prototype.slice.call(arguments,0);
            console.log("Orig args", args);
            console.log("Then args", args2);
            var z;
            if(args.length==0) 
                z = args2;
            if(args2.length==0)
                z = args;
            if(!z) z = args2.concat(args);
            cbIndex = z.length; // 0,fn... 2
            if(userCb) cbIndex--;
            z[cbIndex] = function(err) {
                if(err) {
                    console.log("Got error ",err);
                    nodePromise.reject(err);
                    mainPromise.reject(err);
                    return;
                }
                if(userCb) {
                    var args = Array.prototype.slice.call(arguments);
                    var res = userCb.apply(this, args);
                    mainPromise.resolve(res);
                } else {
                    var args = Array.prototype.slice.call(arguments,1);
                    mainPromise.resolve.apply(mainPromise,args);
                }
            }
            nodePromise.then( function(v) {
                mainPromise.resolve(v);
            });
            
            console.log("nodeStyle after concat", z);
            var res = fn.apply(this,z); 
            // myPromise.resolve(res);
            // return nodePromise;
            return nodePromise;
        }, function(v) {
            mainPromise.reject(v);
        });
        return mainPromise;
        /*
           log("..... now waiting "+ms);
           var p = waitFor(ms);
           p.then( function(v) {
               myPromise.resolve(v);
           });
       */
    }
);
```

### <a name="_promise_onStateChange"></a>_promise::onStateChange(fn)


```javascript

if(!this._listeners)
    this._listeners = [];

this._listeners.push(fn);
```

### <a name="_promise_plugin"></a>_promise::plugin(n, fn)


```javascript

_myTrait_[n] = fn;

return this;
```

### <a name="_promise_props"></a>_promise::props(obj)


```javascript
var args = [];

for(var n in obj) {
    if(obj.hasOwnProperty(n)) {
        args.push({
           name : n,
           promise : obj[n]
        });
    }
}


// console.log(args);
var targetLen = args.length,
    rCnt = 0,
    myPromises = [],
    myResults = {};
    
return this.then(
    function() {
 
        var allPromise = wishes().pending();
        args.forEach( function(def) {
            var b = def.promise,
                name = def.name;
            if(b.then) {
                // console.log("All, looking for ", b, " state = ", b._state);
                myPromises.push(b);
                
                b.then(function(v) {
                    myResults[name] = v;
                    rCnt++;
                    if(rCnt==targetLen) {
                        allPromise.resolve(myResults);
                    }
                }, function(v) {
                    allPromise.reject(v);
                });
                
            } else {
                allPromise.reject("Not list of promises");
            }
        })
        
        return allPromise;
        
    });

```

### <a name="_promise_reject"></a>_promise::reject(withReason)


```javascript

// if(this._rejected || this._fulfilled) return;

// conso

if(this._fulfilled) return;
if(this._rejected && withReason != this._rejectReason) return;


this._state = 2;
this._rejected = true;
this._rejectReason = withReason;
var me = this;

var chCnt = this._childPromises.length;
while(chCnt--) {
    var p = this._childPromises.shift();

    if(p._onReject) {
        try {
            p._onReject(withReason);
            p.reject(withReason);
        } catch(e) {
            /*
                If either onFulfilled or onRejected throws an exception e, promise2 
                must be rejected with e as the reason.            
            */
            p.reject(e);
        }
    } else {
        /*
            If onFulfilled is not a function and promise1 is fulfilled, promise2 must be 
            fulfilled with the same value as promise1        
        */
        p.reject(withReason);
    }
};

// this._childPromises.length = 0;
this.triggerStateChange();

```

### <a name="_promise_rejectReason"></a>_promise::rejectReason(reason)


```javascript
if(reason) {
    this._rejectReason = reason;
    return;
}
return this._rejectReason;
```

### <a name="_promise_resolve"></a>_promise::resolve(x)


```javascript

// console.log("Resolving ", x);

// can not do this many times...
if(this._state>0) return;

if(x==this) {
    // error
    this._rejectReason = "TypeError";
    this.reject(this._rejectReason);
    return;
}

if(this.isObject(x) && x._isAPromise) {
    
    // 
    this._state = x._state;
    this._stateValue = x._stateValue;
    this._rejectReason = x._rejectReason;
    // ... 
    if(this._state===0) {
        var me = this;
        x.onStateChange( function() {
            if(x._state==1) {
                // console.log("State change");
                me.resolve(x.value());
            } 
            if(x._state==2) {
                me.reject(x.rejectReason());                
            }
        });
    }
    if(this._state==1) {
        // console.log("Resolved to be Promise was fulfilled ", x._stateValue);
        this.fulfill(this._stateValue);    
    }
    if(this._state==2) {
        // console.log("Relved to be Promise was rejected ", x._rejectReason);
        this.reject(this._rejectReason);
    }
    return;
}
if(this.isObject(x) && x.then && this.isFunction(x.then)) {
    // console.log("Thenable ", x);
    var didCall = false;
    try {
        // Call the x.then
        var  me = this;
        x.then.call(x, 
            function(y) {
                if(didCall) return;
                // we have now value for the promise...
                // console.log("Got value from Thenable ", y);
                me.resolve(y);
                didCall = true;
            },
            function(r) {
                if(didCall) return;
                // console.log("Got reject from Thenable ", r);
                me.reject(r);
                didCall = true;
            });
    } catch(e) {
        if(!didCall) this.reject(e);
    }
    return;    
}
this._state = 1;
this._stateValue = x;

// fulfill the promise...
this.fulfill(x);

```

### <a name="_promise_state"></a>_promise::state(newState)


```javascript
if(typeof(newState)!="undefined") {
    this._state = newState;
}
return this._state;
```

### <a name="_promise_then"></a>_promise::then(onFulfilled, onRejected)


```javascript

if(!onRejected) onRejected = function() {};

var p = new _promise(onFulfilled, onRejected);
var me = this;

if(this._state==1) {
    later().asap( function() {
        me.fulfill(me.value());
    });
}
if(this._state==2) {
    ater().asap( function() {
        me.reject(me.rejectReason());
    });
}
this._childPromises.push(p);
return p;



```

### <a name="_promise_triggerStateChange"></a>_promise::triggerStateChange(t)


```javascript
var me = this;
if(!this._listeners) return;
this._listeners.forEach( function(fn) {
    fn(me); 
});
// one-timer
this._listeners.length = 0;
```

### <a name="_promise_value"></a>_promise::value(v)


```javascript
if(typeof(v)!="undefined") {
    this._stateValue = v;
    return this;
}
return this._stateValue;
```



   
    
## trait util_fns

The class has following internal singleton variables:
        
        
### <a name="util_fns_isArray"></a>util_fns::isArray(someVar)


```javascript
return Object.prototype.toString.call( someVar ) === '[object Array]';
```

### <a name="util_fns_isFunction"></a>util_fns::isFunction(fn)


```javascript
return Object.prototype.toString.call(fn) == '[object Function]';
```

### <a name="util_fns_isObject"></a>util_fns::isObject(obj)


```javascript
return obj === Object(obj);
```


    
    
    
    


   
      
    
      
            
# Class later


The class has following internal singleton variables:
        
* _initDone
        
* _callers
        
* _oneTimers
        
* _everies
        
* _framers
        
* _localCnt
        
        
### <a name="later_add"></a>later::add(fn, thisObj, args)


```javascript
if(thisObj || args) {
   var tArgs;
   if( Object.prototype.toString.call( args ) === '[object Array]' ) {
       tArgs = args;
   } else {
       tArgs = Array.prototype.slice.call(arguments, 2);
       if(!tArgs) tArgs = [];
   }
   _callers.push([thisObj, fn, tArgs]);   
} else {
    _callers.push(fn);
}
```

### <a name="later_after"></a>later::after(seconds, fn, name)


```javascript

if(!name) {
    name = "aft7491_"+(_localCnt++);
}

_everies[name] = {
    step : Math.floor(seconds * 1000),
    fn : fn,
    nextTime : 0,
    remove : true
};
```

### <a name="later_asap"></a>later::asap(fn)


```javascript
this.add(fn);

```

### <a name="later_every"></a>later::every(seconds, fn, name)


```javascript

if(!name) {
    name = "t7491_"+(_localCnt++);
}

_everies[name] = {
    step : Math.floor(seconds * 1000),
    fn : fn,
    nextTime : 0
};
```

### later::constructor( interval, fn )

```javascript
if(!_initDone) {

   _localCnt=1;
   this.polyfill();
 
   var frame, cancelFrame;
   if(typeof(window) != "undefined") {
       var frame = window['requestAnimationFrame'], 
           cancelFrame= window['cancelRequestAnimationFrame'];
       ['', 'ms', 'moz', 'webkit', 'o'].forEach( function(x) { 
           if(!frame) {
            frame = window[x+'RequestAnimationFrame'];
            cancelFrame = window[x+'CancelAnimationFrame'] 
                                       || window[x+'CancelRequestAnimationFrame'];
           }
        });
   }
 
    if (!frame)
        frame= function(cb) {
            return setTimeout(cb, 16);
        };
 
    if (!cancelFrame)
        cancelFrame = function(id) {
            clearTimeout(id);
        };    
        
    _callers = [];
    _oneTimers = {};
    _everies = {};
    _framers = [];
    var lastMs = 0;
    
    var _callQueQue = function() {
       var ms = (new Date()).getTime();
       var fn;
       while(fn=_callers.shift()) {
          if(Object.prototype.toString.call( fn ) === '[object Array]' ) {
              fn[1].apply(fn[0], fn[2]);
          } else {
              fn();
          }
           
       }
       
       for(var i=0; i<_framers.length;i++) {
           var fFn = _framers[i];
           fFn();
       }
       
       for(var n in _oneTimers) {
           if(_oneTimers.hasOwnProperty(n)) {
               var v = _oneTimers[n];
               v[0](v[1]);
               delete _oneTimers[n];
           }
       }
       
       for(var n in _everies) {
           if(_everies.hasOwnProperty(n)) {
               var v = _everies[n];
               if(v.nextTime < ms) {
                   if(v.remove) {
                       if(v.nextTime > 0) {
                          v.fn(); 
                          delete _everies[n];
                       } else {
                          v.nextTime = ms + v.step; 
                       }
                   } else {
                       v.fn();
                       v.nextTime = ms + v.step;
                   }
               }
               if(v.until) {
                   if(v.until < ms) {
                       delete _everies[n];
                   }
               }
           }
       }       
       
       frame(_callQueQue);
       lastMs = ms;
    };
    _callQueQue();
    _initDone = true;
}
```
        
### <a name="later_once"></a>later::once(key, fn, value)


```javascript
// _oneTimers

_oneTimers[key] = [fn,value];
```

### <a name="later_onFrame"></a>later::onFrame(fn)


```javascript

_framers.push(fn);
```

### <a name="later_polyfill"></a>later::polyfill(t)


```javascript
// --- let's not ---
```

### <a name="later_removeFrameFn"></a>later::removeFrameFn(fn)


```javascript

var i = _framers.indexOf(fn);
if(i>=0) {
    if(fn._onRemove) {
        fn._onRemove();
    }
    _framers.splice(i,1);
    return true;
} else {
    return false;
}
```



   


   



      
    



      
    
      
            
# Class simpleStream


The class has following internal singleton variables:
        
* _streams
        
        
### <a name="simpleStream_addObserver"></a>simpleStream::addObserver(obs, closure)


```javascript

if(this.isArray(obs)) {
    var m = this;
    obs.forEach( function(o) {
        m.addObserver(o, closure);
    })
    return;
}

if(this.isObject(obs) && !this.isFunction(obs)) {
    this._observers.push(obs);
    return;
}

// marching through the stream...
// this._observers.push(obs);

this._observers.push({
    fn : obs,
    closure : closure
});

return this;
```

### <a name="simpleStream_branch"></a>simpleStream::branch(fn, ms)


```javascript

var me = this;
var lastMs = (new Date()).getTime();

me._lastBranch = lastMs;

this.addObserver(function(m) {
    var nowTime = (new Date()).getTime(),
        value = m.getValue();
    setTimeout( function() {

        var currTime = (new Date()).getTime();
        if(currTime - lastMs < ms) return;
        
        var cnt=0;
        if(cnt = me.isActiveRunning() ) {
            return;
        }
        
        m = me.getLastProcess();
        if(m.getState()==3) {
            me._lastBranch = currTime;
            lastMs = currTime;
            fn(value);
        }
    },ms);
    m.run();
});

return this;
```

### <a name="simpleStream_branchIfOk"></a>simpleStream::branchIfOk(fn, ms)


```javascript

var me = this;
var lastMs = (new Date()).getTime();

me._lastBranch = lastMs;

this.addObserver(function(m) {
    var nowTime = (new Date()).getTime(),
        value = m.getValue();
    setTimeout( function() {
        var currTime = (new Date()).getTime();
        if(currTime - lastMs < ms) return;
        var cnt=0;
        if(cnt = me.isActiveRunning() ) {
            return;
        }
        m = me.getLastProcess();
        if(m.getState()==7) {
            me._lastBranch = currTime;
            lastMs = currTime;
            fn(value);
        }
    },ms);
    m.run();
});
return this;

```

### <a name="simpleStream_collectValuesFor"></a>simpleStream::collectValuesFor(ms)


```javascript
var me = this;
var lastMs = (new Date()).getTime();

me._lastBranch = lastMs;

this.addObserver(function(m) {
    var nowTime = (new Date()).getTime(),
        value = m.getValue();
        
    setTimeout( function() {
        var currTime = (new Date()).getTime();

        if(currTime - lastMs < ms) return;
        
        var cnt = me.isActiveRunning();
        var lastProcess  = me.getLastProcess();
        // stop if there is something in there...
        if(cnt > 1 && m != lastProcess ) {
            m.stopStream(m.getValue()); // don't allow to go any further...
            return;
        }
        lastProcess.run(); // continue the process...
    },ms);
    // m.run();
});
return this;
```

### <a name="simpleStream_combineLatest"></a>simpleStream::combineLatest(streams, fn)


```javascript
var me = this;

var myRes = [],
    cnt = streams.length;
    
var allHasValue = function() {
    var b = true;
    for(var i=0; i<cnt; i++) {
        if(typeof(myRes[i])=="undefined") b = false;
    }
    return b;
}

streams.forEach( function(s,index) {
    s.addObserver(function(myProcess) { 
        myRes[index] = myProcess.getValue();
        if(allHasValue()) {
            me.pushValue(myRes);
        }
        myProcess.run();
    }); 
});

return this;

```

### <a name="simpleStream_filter"></a>simpleStream::filter(fn)


```javascript

var me = this;

this.addObserver(function(m) {
    var arr = m.getValue();
    var res = [];
    
    if(me.isArray(arr)) {
        arr.forEach(function(v) {
            if(fn(v)) res.push( v );
        });
    } else {
        if(fn(arr)) {
            m.run(arr);
            return;
        } else {
            m.stopStream();
        }
        return;
    }
    
    if(res.length) {
        m.run(res);
    } else {
        m.stopStream();
    }
});  

return this;
```

### <a name="simpleStream_forContext"></a>simpleStream::forContext(fn)


```javascript
var me = this;
me.addObserver(function(m) {
    var arr = m.getValue();
    var res = [];
    
    if(me.isArray(arr)) {
        arr.forEach(function(v, i) {
            res.push( fn(v, i, m) );
        });
    } else {
        res.push( fn(arr, 0, m) );
    }
     m.run(arr);
});
```

### <a name="simpleStream_forEach"></a>simpleStream::forEach(fn)


```javascript
var me = this;
me.addObserver(function(m) {
    var arr = m.getValue();
    var res = [];
    
    if(me.isArray(arr)) {
        arr.forEach(function(v) {
            res.push( fn(v) );
        });
    } else {
        res.push( fn(arr) );
    }
     m.run(arr);
});
return this;
```

### <a name="simpleStream_getLastProcess"></a>simpleStream::getLastProcess(t)


```javascript

var i = this._active.length;
if(i>0) return this._active[i-1];

return this._lastProcess;
```

### simpleStream::constructor( parentProcessor )

```javascript
this._childIndex = 0;
this._childStreams = [];
this._values = [];
this._active = [];

this._lastProcess;

// start these observers when a value arrives...
this._observers = [];

this._id = this.guid();
if(!_streams) {
    _streams = {};
}

_streams[this._id] = this;

if(parentProcessor) {
    this._parentProcessor = parentProcessor;
}

```
        
### <a name="simpleStream_isActiveRunning"></a>simpleStream::isActiveRunning(t)


```javascript
return this._active.length;
```

### <a name="simpleStream_killAll"></a>simpleStream::killAll(t)


```javascript

this._active.forEach( function(p) {
    p.killAll();
    p.stopStream(); 
});
```

### <a name="simpleStream_map"></a>simpleStream::map(fn)


```javascript
var me = this;
me.addObserver(function(m) {
    var arr = m.getValue();
    var res = [];
    
    if(me.isArray(arr)) {
        arr.forEach(function(v) {
            res.push( fn(v) );
        });
    } else {
        res.push( fn(arr) );
    }
     m.run(res);
});
return this;
```

### <a name="simpleStream_pushValue"></a>simpleStream::pushValue(val)


```javascript


var myProm = _promise();
this.startProcess({
    initWith : val 
},myProm);
return myProm;
```

### <a name="simpleStream_reduce"></a>simpleStream::reduce(fn, initWith)


```javascript
var me = this;
me.addObserver(function(m) {
    var arr = m.getValue();
    var res = [];
    
    if(me.isArray(arr)) {
        res = arr.reduce(fn,initWith);
    } else {
        res = [arr].reduce(fn,initWith);
    }
     m.run(res);
});
return this;
```

### <a name="simpleStream_startProcess"></a>simpleStream::startProcess(context, myProm)


```javascript


// create copy of the observers...
var list = this._observers.slice();

var process = streamProcessor(this._parentProcessor);
process.setContext(context);
process.start( list );

process._streamPromise = myProm;

this._active.push(process);

var me = this;
// The process exits, all done...
process.then( function(v) {
    // Should remove the process    
    var i = me._active.indexOf(process);
    me._active.splice(i,1);
    myProm.resolve( v );
    me._lastProcess = process;
});



```

### <a name="simpleStream_step"></a>simpleStream::step(t)


```javascript

```



   
    
    
    
## trait _dataTrait

The class has following internal singleton variables:
        
        
### <a name="_dataTrait_guid"></a>_dataTrait::guid(t)


```javascript

return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);

```

### <a name="_dataTrait_isArray"></a>_dataTrait::isArray(t)


```javascript

if(typeof(t)=="undefined") return this.__isA;

return Object.prototype.toString.call( t ) === '[object Array]';
```

### <a name="_dataTrait_isFunction"></a>_dataTrait::isFunction(fn)


```javascript
return Object.prototype.toString.call(fn) == '[object Function]';
```

### <a name="_dataTrait_isObject"></a>_dataTrait::isObject(t)


```javascript

if(typeof(t)=="undefined") return this.__isO;

return t === Object(t);
```


    
    
    
    
    
    
    
    


   
      
            
# Class _promise


The class has following internal singleton variables:
        
        
### <a name="_promise_all"></a>_promise::all(firstArg)


```javascript

var args;
if(this.isArray(firstArg)) {
  args = firstArg;
} else {
  args = Array.prototype.slice.call(arguments, 0);
}
// console.log(args);
var targetLen = args.length,
    rCnt = 0,
    myPromises = [],
    myResults = new Array(targetLen);
    
return this.then(
    function() {
 
        var allPromise = _promise();
        if(args.length==0) {
            allPromise.resolve([]);
        }
        args.forEach( function(b, index) {
            if(b.then) {
                // console.log("All, looking for ", b, " state = ", b._state);
                myPromises.push(b);
                
                b.then(function(v) {
                    myResults[index] = v;
                    // console.log("Got a promise...",b, " cnt = ", rCnt);
                    rCnt++;
                    if(rCnt==targetLen) {
                        allPromise.resolve(myResults);
                    }
                }, function(v) {
                    allPromise.reject(v);
                });
                
            } else {
                allPromise.reject("Not list of promises");
            }
        })
        
        return allPromise;
        
    });



    

```

### <a name="_promise_collect"></a>_promise::collect(collectFn, promiseList, results)


```javascript

var args;
if(this.isArray(promiseList)) {
  args = promiseList;
} else {
  args = [promiseList];
}

// console.log(args);
var targetLen = args.length,
    isReady = false,
    noMore = false,
    rCnt = 0,
    myPromises = [],
    myResults = results || {};
    
return this.then(
    function() {
 
        var allPromise = _promise();
        args.forEach( function(b, index) {
            if(b.then) {
                // console.log("All, looking for ", b, " state = ", b._state);
                myPromises.push(b);
                
                b.then(function(v) {
                    rCnt++;
                    isReady = collectFn(v, myResults);
                    if( (isReady && !noMore) || (noMore==false && targetLen == rCnt) ) {
                        allPromise.resolve(myResults);
                        noMore = true;
                    }
                }, function(v) {
                    allPromise.reject(v);
                });
                
            } else {
                allPromise.reject("Not list of promises");
            }
        })
        
        return allPromise;
        
    });

```

### <a name="_promise_fail"></a>_promise::fail(fn)


```javascript
return this.then(null, fn);
```

### <a name="_promise_fulfill"></a>_promise::fulfill(withValue)


```javascript
// if(this._fulfilled || this._rejected) return;

if(this._rejected) return;
if(this._fulfilled && withValue != this._stateValue) {
    return;
}

var me = this;
this._fulfilled = true;
this._stateValue = withValue;

var chCnt = this._childPromises.length;

while(chCnt--) {
    var p = this._childPromises.shift();
    if(p._onFulfill) {
        try {
            var x = p._onFulfill(withValue);
            // console.log("Returned ",x);
            if(typeof(x)!="undefined") {
                p.resolve(x);
            } else {
                p.fulfill(withValue);
            }
        } catch(e) {
            // console.error(e);
            /*
                If either onFulfilled or onRejected throws an exception e, promise2 
                must be rejected with e as the reason.            
            */
            p.reject(e);
        }
    } else {
        /*
            If onFulfilled is not a function and promise1 is fulfilled, promise2 must be 
            fulfilled with the same value as promise1        
        */
        p.fulfill(withValue);
    }
};
// this._childPromises.length = 0;
this._state = 1;
this.triggerStateChange();

```

### <a name="_promise_genPlugin"></a>_promise::genPlugin(fname, fn)


```javascript
var me = this;
this.plugin(fname,
    function() {
        var args = Array.prototype.slice.call(arguments,0);
        console.log("Plugin args", args);
        var myPromise = _promise();
        this.then(function(v) {
            var args2 = Array.prototype.slice.call(arguments,0);
            var z = args.concat(args2);
            var res = fn.apply(this,z); 
            myPromise.resolve(res);
        }, function(r) {
            myPromise.reject(r);
        });
        return myPromise;

    }
);
```

### _promise::constructor( onFulfilled, onRejected )

```javascript
// 0 = pending
// 1 = fullfilled
// 2 = error

this._state = 0;
this._stateValue = null;
this._isAPromise = true;
this._childPromises = [];

if(this.isFunction(onFulfilled))
    this._onFulfill = onFulfilled;
if(this.isFunction(onRejected))
    this._onReject = onRejected;
    
if(!onRejected && this.isFunction(onFulfilled) ) {
    
    
    
    var me = this;
    later().asap(
        function() {
            console.log("--- calling the onFulfilled ");
            onFulfilled( function(v) {
                me.resolve(v)
            }, function(v) {
                me.resolve(v);
            });           
        });
 
}
```
        
### <a name="_promise_isFulfilled"></a>_promise::isFulfilled(t)


```javascript
return this._state == 1;
```

### <a name="_promise_isPending"></a>_promise::isPending(t)


```javascript
return this._state == 0;
```

### <a name="_promise_isRejected"></a>_promise::isRejected(v)


```javascript
return this._state == 2;
```

### <a name="_promise_nodeStyle"></a>_promise::nodeStyle(fname, fn)


```javascript
var me = this;
this.plugin(fname,
    function() {
        var args = Array.prototype.slice.call(arguments,0);
        var last, userCb, cbIndex=0;
        if(args.length>=0) {
            last = args[args.length-1];
            if(Object.prototype.toString.call(last) == '[object Function]') {
                userCb = last;
                cbIndex = args.length-1;
            }
        }

        var mainPromise = wishes().pending();
        this.then(function() {
            var nodePromise = wishes().pending();
            var args2 = Array.prototype.slice.call(arguments,0);
            console.log("Orig args", args);
            console.log("Then args", args2);
            var z;
            if(args.length==0) 
                z = args2;
            if(args2.length==0)
                z = args;
            if(!z) z = args2.concat(args);
            cbIndex = z.length; // 0,fn... 2
            if(userCb) cbIndex--;
            z[cbIndex] = function(err) {
                if(err) {
                    console.log("Got error ",err);
                    nodePromise.reject(err);
                    mainPromise.reject(err);
                    return;
                }
                if(userCb) {
                    var args = Array.prototype.slice.call(arguments);
                    var res = userCb.apply(this, args);
                    mainPromise.resolve(res);
                } else {
                    var args = Array.prototype.slice.call(arguments,1);
                    mainPromise.resolve.apply(mainPromise,args);
                }
            }
            nodePromise.then( function(v) {
                mainPromise.resolve(v);
            });
            
            console.log("nodeStyle after concat", z);
            var res = fn.apply(this,z); 
            // myPromise.resolve(res);
            // return nodePromise;
            return nodePromise;
        }, function(v) {
            mainPromise.reject(v);
        });
        return mainPromise;
        /*
           log("..... now waiting "+ms);
           var p = waitFor(ms);
           p.then( function(v) {
               myPromise.resolve(v);
           });
       */
    }
);
```

### <a name="_promise_onStateChange"></a>_promise::onStateChange(fn)


```javascript

if(!this._listeners)
    this._listeners = [];

this._listeners.push(fn);
```

### <a name="_promise_plugin"></a>_promise::plugin(n, fn)


```javascript

_myTrait_[n] = fn;

return this;
```

### <a name="_promise_props"></a>_promise::props(obj)


```javascript
var args = [];

for(var n in obj) {
    if(obj.hasOwnProperty(n)) {
        args.push({
           name : n,
           promise : obj[n]
        });
    }
}


// console.log(args);
var targetLen = args.length,
    rCnt = 0,
    myPromises = [],
    myResults = {};
    
return this.then(
    function() {
 
        var allPromise = wishes().pending();
        args.forEach( function(def) {
            var b = def.promise,
                name = def.name;
            if(b.then) {
                // console.log("All, looking for ", b, " state = ", b._state);
                myPromises.push(b);
                
                b.then(function(v) {
                    myResults[name] = v;
                    rCnt++;
                    if(rCnt==targetLen) {
                        allPromise.resolve(myResults);
                    }
                }, function(v) {
                    allPromise.reject(v);
                });
                
            } else {
                allPromise.reject("Not list of promises");
            }
        })
        
        return allPromise;
        
    });

```

### <a name="_promise_reject"></a>_promise::reject(withReason)


```javascript

// if(this._rejected || this._fulfilled) return;

// conso

if(this._fulfilled) return;
if(this._rejected && withReason != this._rejectReason) return;


this._state = 2;
this._rejected = true;
this._rejectReason = withReason;
var me = this;

var chCnt = this._childPromises.length;
while(chCnt--) {
    var p = this._childPromises.shift();

    if(p._onReject) {
        try {
            p._onReject(withReason);
            p.reject(withReason);
        } catch(e) {
            /*
                If either onFulfilled or onRejected throws an exception e, promise2 
                must be rejected with e as the reason.            
            */
            p.reject(e);
        }
    } else {
        /*
            If onFulfilled is not a function and promise1 is fulfilled, promise2 must be 
            fulfilled with the same value as promise1        
        */
        p.reject(withReason);
    }
};

// this._childPromises.length = 0;
this.triggerStateChange();

```

### <a name="_promise_rejectReason"></a>_promise::rejectReason(reason)


```javascript
if(reason) {
    this._rejectReason = reason;
    return;
}
return this._rejectReason;
```

### <a name="_promise_resolve"></a>_promise::resolve(x)


```javascript

// console.log("Resolving ", x);

// can not do this many times...
if(this._state>0) return;

if(x==this) {
    // error
    this._rejectReason = "TypeError";
    this.reject(this._rejectReason);
    return;
}

if(this.isObject(x) && x._isAPromise) {
    
    // 
    this._state = x._state;
    this._stateValue = x._stateValue;
    this._rejectReason = x._rejectReason;
    // ... 
    if(this._state===0) {
        var me = this;
        x.onStateChange( function() {
            if(x._state==1) {
                // console.log("State change");
                me.resolve(x.value());
            } 
            if(x._state==2) {
                me.reject(x.rejectReason());                
            }
        });
    }
    if(this._state==1) {
        // console.log("Resolved to be Promise was fulfilled ", x._stateValue);
        this.fulfill(this._stateValue);    
    }
    if(this._state==2) {
        // console.log("Relved to be Promise was rejected ", x._rejectReason);
        this.reject(this._rejectReason);
    }
    return;
}
if(this.isObject(x) && x.then && this.isFunction(x.then)) {
    // console.log("Thenable ", x);
    var didCall = false;
    try {
        // Call the x.then
        var  me = this;
        x.then.call(x, 
            function(y) {
                if(didCall) return;
                // we have now value for the promise...
                // console.log("Got value from Thenable ", y);
                me.resolve(y);
                didCall = true;
            },
            function(r) {
                if(didCall) return;
                // console.log("Got reject from Thenable ", r);
                me.reject(r);
                didCall = true;
            });
    } catch(e) {
        if(!didCall) this.reject(e);
    }
    return;    
}
this._state = 1;
this._stateValue = x;

// fulfill the promise...
this.fulfill(x);

```

### <a name="_promise_state"></a>_promise::state(newState)


```javascript
if(typeof(newState)!="undefined") {
    this._state = newState;
}
return this._state;
```

### <a name="_promise_then"></a>_promise::then(onFulfilled, onRejected)


```javascript

if(!onRejected) onRejected = function() {};

var p = new _promise(onFulfilled, onRejected);
var me = this;

if(this._state==1) {
    later().asap( function() {
        me.fulfill(me.value());
    });
}
if(this._state==2) {
    ater().asap( function() {
        me.reject(me.rejectReason());
    });
}
this._childPromises.push(p);
return p;



```

### <a name="_promise_triggerStateChange"></a>_promise::triggerStateChange(t)


```javascript
var me = this;
if(!this._listeners) return;
this._listeners.forEach( function(fn) {
    fn(me); 
});
// one-timer
this._listeners.length = 0;
```

### <a name="_promise_value"></a>_promise::value(v)


```javascript
if(typeof(v)!="undefined") {
    this._stateValue = v;
    return this;
}
return this._stateValue;
```



   
    
## trait util_fns

The class has following internal singleton variables:
        
        
### <a name="util_fns_isArray"></a>util_fns::isArray(someVar)


```javascript
return Object.prototype.toString.call( someVar ) === '[object Array]';
```

### <a name="util_fns_isFunction"></a>util_fns::isFunction(fn)


```javascript
return Object.prototype.toString.call(fn) == '[object Function]';
```

### <a name="util_fns_isObject"></a>util_fns::isObject(obj)


```javascript
return obj === Object(obj);
```


    
    
    
    


   
      
    
      
            
# Class later


The class has following internal singleton variables:
        
* _initDone
        
* _callers
        
* _oneTimers
        
* _everies
        
* _framers
        
* _localCnt
        
        
### <a name="later_add"></a>later::add(fn, thisObj, args)


```javascript
if(thisObj || args) {
   var tArgs;
   if( Object.prototype.toString.call( args ) === '[object Array]' ) {
       tArgs = args;
   } else {
       tArgs = Array.prototype.slice.call(arguments, 2);
       if(!tArgs) tArgs = [];
   }
   _callers.push([thisObj, fn, tArgs]);   
} else {
    _callers.push(fn);
}
```

### <a name="later_after"></a>later::after(seconds, fn, name)


```javascript

if(!name) {
    name = "aft7491_"+(_localCnt++);
}

_everies[name] = {
    step : Math.floor(seconds * 1000),
    fn : fn,
    nextTime : 0,
    remove : true
};
```

### <a name="later_asap"></a>later::asap(fn)


```javascript
this.add(fn);

```

### <a name="later_every"></a>later::every(seconds, fn, name)


```javascript

if(!name) {
    name = "t7491_"+(_localCnt++);
}

_everies[name] = {
    step : Math.floor(seconds * 1000),
    fn : fn,
    nextTime : 0
};
```

### later::constructor( interval, fn )

```javascript
if(!_initDone) {

   _localCnt=1;
   this.polyfill();
 
   var frame, cancelFrame;
   if(typeof(window) != "undefined") {
       var frame = window['requestAnimationFrame'], 
           cancelFrame= window['cancelRequestAnimationFrame'];
       ['', 'ms', 'moz', 'webkit', 'o'].forEach( function(x) { 
           if(!frame) {
            frame = window[x+'RequestAnimationFrame'];
            cancelFrame = window[x+'CancelAnimationFrame'] 
                                       || window[x+'CancelRequestAnimationFrame'];
           }
        });
   }
 
    if (!frame)
        frame= function(cb) {
            return setTimeout(cb, 16);
        };
 
    if (!cancelFrame)
        cancelFrame = function(id) {
            clearTimeout(id);
        };    
        
    _callers = [];
    _oneTimers = {};
    _everies = {};
    _framers = [];
    var lastMs = 0;
    
    var _callQueQue = function() {
       var ms = (new Date()).getTime();
       var fn;
       while(fn=_callers.shift()) {
          if(Object.prototype.toString.call( fn ) === '[object Array]' ) {
              fn[1].apply(fn[0], fn[2]);
          } else {
              fn();
          }
           
       }
       
       for(var i=0; i<_framers.length;i++) {
           var fFn = _framers[i];
           fFn();
       }
       
       for(var n in _oneTimers) {
           if(_oneTimers.hasOwnProperty(n)) {
               var v = _oneTimers[n];
               v[0](v[1]);
               delete _oneTimers[n];
           }
       }
       
       for(var n in _everies) {
           if(_everies.hasOwnProperty(n)) {
               var v = _everies[n];
               if(v.nextTime < ms) {
                   if(v.remove) {
                       if(v.nextTime > 0) {
                          v.fn(); 
                          delete _everies[n];
                       } else {
                          v.nextTime = ms + v.step; 
                       }
                   } else {
                       v.fn();
                       v.nextTime = ms + v.step;
                   }
               }
               if(v.until) {
                   if(v.until < ms) {
                       delete _everies[n];
                   }
               }
           }
       }       
       
       frame(_callQueQue);
       lastMs = ms;
    };
    _callQueQue();
    _initDone = true;
}
```
        
### <a name="later_once"></a>later::once(key, fn, value)


```javascript
// _oneTimers

_oneTimers[key] = [fn,value];
```

### <a name="later_onFrame"></a>later::onFrame(fn)


```javascript

_framers.push(fn);
```

### <a name="later_polyfill"></a>later::polyfill(t)


```javascript
// --- let's not ---
```

### <a name="later_removeFrameFn"></a>later::removeFrameFn(fn)


```javascript

var i = _framers.indexOf(fn);
if(i>=0) {
    if(fn._onRemove) {
        fn._onRemove();
    }
    _framers.splice(i,1);
    return true;
} else {
    return false;
}
```



   


   



      
    



      
    
      
    
      
            
# Class later


The class has following internal singleton variables:
        
* _initDone
        
* _callers
        
* _oneTimers
        
* _everies
        
* _framers
        
* _localCnt
        
        
### <a name="later_add"></a>later::add(fn, thisObj, args)


```javascript
if(thisObj || args) {
   var tArgs;
   if( Object.prototype.toString.call( args ) === '[object Array]' ) {
       tArgs = args;
   } else {
       tArgs = Array.prototype.slice.call(arguments, 2);
       if(!tArgs) tArgs = [];
   }
   _callers.push([thisObj, fn, tArgs]);   
} else {
    _callers.push(fn);
}
```

### <a name="later_after"></a>later::after(seconds, fn, name)


```javascript

if(!name) {
    name = "aft7491_"+(_localCnt++);
}

_everies[name] = {
    step : Math.floor(seconds * 1000),
    fn : fn,
    nextTime : 0,
    remove : true
};
```

### <a name="later_asap"></a>later::asap(fn)


```javascript
this.add(fn);

```

### <a name="later_every"></a>later::every(seconds, fn, name)


```javascript

if(!name) {
    name = "t7491_"+(_localCnt++);
}

_everies[name] = {
    step : Math.floor(seconds * 1000),
    fn : fn,
    nextTime : 0
};
```

### later::constructor( interval, fn )

```javascript
if(!_initDone) {

   _localCnt=1;
   this.polyfill();
 
   var frame, cancelFrame;
   if(typeof(window) != "undefined") {
       var frame = window['requestAnimationFrame'], 
           cancelFrame= window['cancelRequestAnimationFrame'];
       ['', 'ms', 'moz', 'webkit', 'o'].forEach( function(x) { 
           if(!frame) {
            frame = window[x+'RequestAnimationFrame'];
            cancelFrame = window[x+'CancelAnimationFrame'] 
                                       || window[x+'CancelRequestAnimationFrame'];
           }
        });
   }
 
    if (!frame)
        frame= function(cb) {
            return setTimeout(cb, 16);
        };
 
    if (!cancelFrame)
        cancelFrame = function(id) {
            clearTimeout(id);
        };    
        
    _callers = [];
    _oneTimers = {};
    _everies = {};
    _framers = [];
    var lastMs = 0;
    
    var _callQueQue = function() {
       var ms = (new Date()).getTime();
       var fn;
       while(fn=_callers.shift()) {
          if(Object.prototype.toString.call( fn ) === '[object Array]' ) {
              fn[1].apply(fn[0], fn[2]);
          } else {
              fn();
          }
           
       }
       
       for(var i=0; i<_framers.length;i++) {
           var fFn = _framers[i];
           fFn();
       }
       
       for(var n in _oneTimers) {
           if(_oneTimers.hasOwnProperty(n)) {
               var v = _oneTimers[n];
               v[0](v[1]);
               delete _oneTimers[n];
           }
       }
       
       for(var n in _everies) {
           if(_everies.hasOwnProperty(n)) {
               var v = _everies[n];
               if(v.nextTime < ms) {
                   if(v.remove) {
                       if(v.nextTime > 0) {
                          v.fn(); 
                          delete _everies[n];
                       } else {
                          v.nextTime = ms + v.step; 
                       }
                   } else {
                       v.fn();
                       v.nextTime = ms + v.step;
                   }
               }
               if(v.until) {
                   if(v.until < ms) {
                       delete _everies[n];
                   }
               }
           }
       }       
       
       frame(_callQueQue);
       lastMs = ms;
    };
    _callQueQue();
    _initDone = true;
}
```
        
### <a name="later_once"></a>later::once(key, fn, value)


```javascript
// _oneTimers

_oneTimers[key] = [fn,value];
```

### <a name="later_onFrame"></a>later::onFrame(fn)


```javascript

_framers.push(fn);
```

### <a name="later_polyfill"></a>later::polyfill(t)


```javascript
// --- let's not ---
```

### <a name="later_removeFrameFn"></a>later::removeFrameFn(fn)


```javascript

var i = _framers.indexOf(fn);
if(i>=0) {
    if(fn._onRemove) {
        fn._onRemove();
    }
    _framers.splice(i,1);
    return true;
} else {
    return false;
}
```



   


   



      
    
      
            
# Class sequenceStepper


The class has following internal singleton variables:
        
* _instances
        
        
### <a name="sequenceStepper__classFactory"></a>sequenceStepper::_classFactory(id, manual)


```javascript

if(id===false && manual) return;

if(!_instances) {
    _instances = {};
}

if(_instances[id]) {
    return _instances[id];
} else {
    _instances[id] = this;
}
```

### <a name="sequenceStepper_addCommands"></a>sequenceStepper::addCommands(cmdFunction, failure)


```javascript

if(this.isArray(cmdFunction)) {
    var me = this;
    cmdFunction.forEach( function(c) {
        me.addCommands( c );
    });
    return this;
}

this._commands.push( { 
                        fnCmd : cmdFunction, 
                        fnFail: failure, 
                        async : true }  );
```

### sequenceStepper::constructor( myId, manual )

```javascript

if(!this._commands) {
    this._commands = [];
    this.waitingList = [];
    this._index = 0;
}

var me = this;
if(!manual) {
    later().every(1/30, function() {
        me.step();
    });
}

```
        
### <a name="sequenceStepper_step"></a>sequenceStepper::step(t)


```javascript
var i = this._index,
    len = this._commands.length;
    
if(i==len) return;

var first = _promise(),
    currentProm = first,
    myPromise = _promise(),
    me = this;

while(i<len) {
    var fn = this._commands[i];
    (function(fn) {
        currentProm = currentProm.then( function() {
            
            var p = _promise();
            
            // if(fn.async) {

            fn.fnCmd( function(res) {
                p.resolve(true); 
            }, function(failReason) {
                p.resolve(true);
                if(fn.fnFail) fn.fnFail( failReason );
            });                   

            return p; 
        }).fail( function(reason) {
            if(fn.fnFail) fn.fnFail( reason );
        });
    }(fn));
    this._index++;
    i++;
}

currentProm.then( function() {
   me.waitingList.shift(); // remvoe this promise from the queque
   myPromise.resolve(true);
   if(me.waitingList.length) {
       var newP = me.waitingList[0];
       newP.resolve(true);
   } 
}).fail( function(m) {
    
});


this.waitingList.push(first);
if(this.waitingList.length==1) {
    first.resolve(true);
} 
return myPromise;

```



   
    
## trait _dataTrait

The class has following internal singleton variables:
        
* _eventOn
        
* _commands
        
        
### <a name="_dataTrait_guid"></a>_dataTrait::guid(t)


```javascript

return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
        
//return Math.random();
// return Math.random().toString(36);
        
/*    
return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
*/
/*        
function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
               .toString(16)
               .substring(1);
  }

return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
       s4() + '-' + s4() + s4() + s4();*/
```

### <a name="_dataTrait_isArray"></a>_dataTrait::isArray(t)


```javascript

if(typeof(t)=="undefined") return this.__isA;

return Object.prototype.toString.call( t ) === '[object Array]';
```

### <a name="_dataTrait_isFunction"></a>_dataTrait::isFunction(fn)


```javascript
return Object.prototype.toString.call(fn) == '[object Function]';
```

### <a name="_dataTrait_isObject"></a>_dataTrait::isObject(t)


```javascript

if(typeof(t)=="undefined") return this.__isO;

return t === Object(t);
```


    
    


   
      
    



      
    
      
            
# Class streamProcessor


The class has following internal singleton variables:
        
        
### <a name="streamProcessor_cont"></a>streamProcessor::cont(withValue)


```javascript

if(this.isArray(withValue)) {
    
    var me = this;
    var newList = this._list.slice( this._index + 1);
    
    if(newList.length==0) {
        this.step();
        return;
    }
    
    var all = [];
    withValue.forEach(
        function(v) {
            var newList = me._list.slice( me._index + 1);
            var stream = simpleStream(me);
            me._subStreams.push(stream);
            stream.addObserver( newList );
            all.push( stream.pushValue( v ) );
        });
    
    var wait = _promise();
    wait.all(all).then( function() {
        var r = [];
        me._subStreams.length = 0;
        all.forEach( function(p) {
            r.push(p.value()); 
        });
        me.resolve(r);
    });
    wait.resolve(true);

    
} else {
    
    if(typeof(withValue) !="undefined") {
        this._context.value = withValue;
    }
    
    this.step();
    
}

```

### <a name="streamProcessor_ctxVar"></a>streamProcessor::ctxVar(name, value)


```javascript

if(typeof(value)=="undefined") {
    var v = this._contextVars[name];
    if(typeof(v)=="undefined") {
        if(this._parent) {
           return this._parent.ctxVar(name); 
        }
    }
    return v;
}

this._contextVars[name] = value;


```

### <a name="streamProcessor_get"></a>streamProcessor::get(name)


```javascript

if(this._closure) {    
    var v = this._contextVars[name];
    if(typeof(v)=="undefined") {
        return this._parent.get(name); 
    }
    return v;
}

var v = this._contextVars[name];
if(typeof(v)=="undefined") {
    if(this._parent) {
       return this._parent.get(name); 
    }
}
return v;
```

### <a name="streamProcessor_getRest"></a>streamProcessor::getRest(t)


```javascript

```

### <a name="streamProcessor_getState"></a>streamProcessor::getState(t)


```javascript


return this._stopState;
```

### <a name="streamProcessor_getValue"></a>streamProcessor::getValue(t)


```javascript

// simple value processor

if(!this._context && this._parent) {
    return this._parent.getValue();
}

if(this._context && !this._context.value && !this._context.initWith && this._parent) {
    return this._parent.getValue();
}

return this._context.value || this._context.initWith;
```

### streamProcessor::constructor( parentProcessor, isClosure )

```javascript

// The context of the processor
this._context = {};
this._contextVars = {};

// should we kill all the substreams too...?
this._subStreams = [];

this._stopState = 0;

if(parentProcessor) {
    this._parent = parentProcessor;
}

if(isClosure) this._closure = true;



```
        
### <a name="streamProcessor_killAll"></a>streamProcessor::killAll(t)


```javascript

if(this._subStreams) {
    this._subStreams.forEach( function(s) {
        s.killAll();
    });
}
```

### <a name="streamProcessor_run"></a>streamProcessor::run(withValue)


```javascript

if(this._closure) {
    if(this._parent) {
        this._parent.run(withValue);
        return;
    } else {
        console.error("No parent for closure");
        //console.trace();
    }
}
this._stopState = 1;
this.cont(withValue);
return;

```

### <a name="streamProcessor_set"></a>streamProcessor::set(name, value)


```javascript
if(typeof(value)!="undefined") {
    
    if(this._closure) {
        if(typeof(this._contextVars[name]) !="undefined") {
            this._contextVars[name] = value;
        } else {
            if(this._parent) {
                this._parent.set(name, value);
                return this;
            }
        }
    }
    
    if(typeof(this._contextVars[name]) =="undefined") {
        if(this._parent) {
            this._parent.set(name, value);
            return this;
        }        
    }
    
    this._contextVars[name] = value;
    return this;
}

```

### <a name="streamProcessor_setContext"></a>streamProcessor::setContext(ctx)


```javascript
this._context = ctx;
```

### <a name="streamProcessor_setParent"></a>streamProcessor::setParent(newParent)


```javascript
this._parent = newParent;
```

### <a name="streamProcessor_start"></a>streamProcessor::start(list)


```javascript

this._list = list;
this._index = -1;

this.step();

```

### <a name="streamProcessor_step"></a>streamProcessor::step(t)


```javascript

this._index++;
var i = this._index,
    me = this;
    
if(this._list[i]) {
    
    var obs = this._list[i];
    // Call the observer
    
    if(this.isObject(obs) && !this.isFunction(obs)) {

        if(obs.closure) {
            obs.closure.setParent( this );
            obs.fn.apply( obs.closure, [obs.closure] );
        } else {
            // var ctx = streamProcessor()
            obs.fn.apply( this, [this] );
        }
    } else {
        obs.apply( this, [this] );
    }
    
} else {
    if(typeof(this._context.value)=="undefined") {
        this._context.value = this._context.initWith;
    }
    if(this._stopState < 2) {
        this._stopState = 7;
    }
    this.resolve(this._context.value);
}


```

### <a name="streamProcessor_stopStream"></a>streamProcessor::stopStream(t)


```javascript
if(!this._context.value) {
    this._context.value = this._context.initWith;
}
this._stopState = 3;
this.resolve(this._context.value);
```



   
    
## trait _dataTrait

The class has following internal singleton variables:
        
        
### <a name="_dataTrait_guid"></a>_dataTrait::guid(t)


```javascript

return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);

```

### <a name="_dataTrait_isArray"></a>_dataTrait::isArray(t)


```javascript

if(typeof(t)=="undefined") return this.__isA;

return Object.prototype.toString.call( t ) === '[object Array]';
```

### <a name="_dataTrait_isFunction"></a>_dataTrait::isFunction(fn)


```javascript
return Object.prototype.toString.call(fn) == '[object Function]';
```

### <a name="_dataTrait_isObject"></a>_dataTrait::isObject(t)


```javascript

if(typeof(t)=="undefined") return this.__isO;

return t === Object(t);
```


    
    


   
      
    



      
    



      
    
      
            
# Class _data


The class has following internal singleton variables:
        
* _up
        
* _factoryProperties
        
* _registry
        
* _objectCache
        
* _workersDone
        
        
### <a name="_data__addFactoryProperty"></a>_data::_addFactoryProperty(name)


```javascript
if(!_factoryProperties) _factoryProperties = [];
_factoryProperties.push(name);
```

### <a name="_data__classFactory"></a>_data::_classFactory(data)


```javascript

if(!_objectCache) _objectCache = {};

if(this.isObject(data)) {
    if(data.data && data.__id) {
        var oo = _objectCache[data.__id];
        if(oo) {
            // console.log("did find object "+data.__id+" from cache");
            return oo;
        } else {
            // objectCache[data.__id] = this;
        }
    }
} else {
    if(typeof(data) == "string") {
        var oo = _objectCache[data];
        if(oo) {
            return oo;
        }
    }
}

if(_factoryProperties && _registry) {
    for( var i=0; i<_factoryProperties.length; i++) {
        var pn = _factoryProperties[i];
        var name;

        if(data && data.data) {

            name = data.data[pn];
        } else {
            if(data) name = data[pn];
        }

        if(name) {
            var cf = _registry[name];
            if(cf) {
                return cf;
            }
        }
    }
}



```

### <a name="_data__initWorkers"></a>_data::_initWorkers(t)


```javascript
var me = this;
if(!_workersDone) {
    var dataCh = me._client.getChannelData();
    dataCh.setWorkerCommands({
        "_d_set" : function(cmd, options) {        
            // for example, trigger .on("x", value);
            options.target.trigger(cmd[1], cmd[2]);
        },
        "_d_cf" : function(cmd, options) {        
            // create field for the object
            var o = options.obj;
            if(cmd[0]==4) {
                if(!o[cmd[1]]) {
                    o.createPropertyUpdateFn( cmd[1], cmd[2] );
                }
            }
            if(cmd[0]==5) {
                if(!o[cmd[1]]) {
                    var newProp = o._docData.data[cmd[1]];
                    if(newProp) {
                        // does this work???
                        o.createPropertyUpdateFn( cmd[1], newProp );
                    }
                }
            }            
        },        
        "_d_rem" : function(cmd, options) {        
            options.target.trigger("remove", cmd[1]);
        },
        "_d_ins" : function(cmd, options) {        
            options.target.trigger("insert", cmd[1]);
        },        
        "_d_mv" : function(cmd, options) {        
            options.target.trigger("move", {
                itemId : cmd[1],
                parentId : cmd[4],
                from : cmd[3],
                to : cmd[2]
            });
        }
    });  
    _workersDone = true;
}
/*
    d.subArr.createWorker("_d_remove", [8, "*", null, null, d.subArr.getID()], { target : ev1 },
                function(cmd, options) {
                    options.target.bHadRemove = true;
                });

            options.eventObj.trigger("move", {
                from : fromIndex,
                to : targetIndex
            });                
                
*/
```

### <a name="_data__objEventWorker"></a>_data::_objEventWorker(t)

The old Object Event worker code
```javascript
//console.log("******* if Then Worker ******");
//console.log(change);
//console.log(options);

if(!change) return;

// how to create something new...
if(change[0]==4) {
    
    // createPropertyUpdateFn
    // console.log("%c  set for objects, property updf ", "background:orange;color:white");
    
    var dom = targetObj;
    var up = _docUp();
    
    var dI = _data();
    dI.createPropertyUpdateFn( change[1], null );

    var dataItem = up._find(options.modelid);
    
    if(dataItem.__undone) return;

    if(options && options.eventObj) {
        if(change[3]!=change[2]) {
            options.eventObj.trigger(change[1], change[2]);
        }         
    }

}

if(options2) {
    var origOptions = options;
    options = options2;
}


if(change[0]==5) {
    var up = _docUp();
    var dataItem = up._find(change[2]),
        dataItem2 = up._find(change[4]);
    
    if(dataItem.__undone) return;
    if(dataItem2.__undone) return;
    
    var dc = _data();
    
    if(dc.findFromCache(change[4])) {
        
        var dI = _data(change[4]),
            setObj = _data(change[2]),
            prop = change[1];
        
        if(!dI) return;
        if(!setObj) return;
        
        dI[prop] = setObj;        
    }
    // could trigger some event here perhaps...   
}

// __removedAt
if(change[0]==8) {
    
    var dom = targetObj;
    var up = _docUp();
    var dataItem = up._find(change[2]);
    if(dataItem.__undone) return;

    if( options.bListenMVC && options.eventObj ) {
        options.eventObj.trigger("remove",dataItem.__removedAt) ;
    } 
}

// insert
if(change[0]==7) {
    
    var up = _docUp();
     
    var parentObj = up._find( change[4] ),
        insertedObj = up._find( change[2] );  
        
    if(parentObj.__undone) return; 
    if(insertedObj.__undone) return; 
    
    var index = parentObj.data.indexOf(  insertedObj );

    if( options.bListenMVC && options.eventObj ) {
        options.eventObj.trigger("insert", index );
    }
}

if(change[0]==12) {
    
    var up = _docUp();
     
    var parentObj = up._find( change[4] ),
        index = parseInt( change[2] ),
        len = parentObj.data.length;
        
    if(parentObj.__undone) return;     
        
    for(var i=0; i< len; i++) {
        var m = parentObj.data[i];
        if(m.__id == change[1]) {
            targetObj = m;
            break;
        }
    }        
    
    if(targetObj && targetObj.__undone) return; 
 
    // move item, this may not be working as expected...
    var fromIndex = targetObj.__fromIndex; //  up._getExecInfo().fromIndex;

    // console.log("about to trigger move with ", targetObj, change[2], index, len, parentObj );
    
    if(targetObj) {
        var targetIndex = parseInt(change[2]);
        if( options.bListenMVC && options.eventObj ) {
            // console.log("Triggering move ", fromIndex, targetIndex);
            options.eventObj.trigger("move", {
                from : fromIndex,
                to : targetIndex
            });
        }
    }
}

```

### <a name="_data__parseURL"></a>_data::_parseURL(url)


```javascript
var parts1 = url.split("://");
var protocol = parts1.shift(),
    rest = parts1.shift();
var serverParts = rest.split("/"),
    ipAndPort = serverParts.shift(),
    fullPath = serverParts.join("/"),
    iParts = ipAndPort.split(":"),
    ip = iParts[0],
    port = iParts[1],
    sandbox = serverParts.shift(),
    fileName = serverParts.pop(),
    path = serverParts.join("/");
    
var reqData = {
             protocol : protocol,
             ip : ip,
             port : port,
             sandbox : sandbox,
             fullPath : fullPath,
             path : path,
             file : fileName
    };
    
return reqData;
```

### <a name="_data_addToCache"></a>_data::addToCache(id, obj)


```javascript
if(!_objectCache) _objectCache = {};

if(id) {
    _objectCache[id] = obj;
}
```

### <a name="_data_channel"></a>_data::channel(t)


```javascript
return this._client;
```

### <a name="_data_createSubClass"></a>_data::createSubClass(propertyName, className, classConstructor)


```javascript


// resStr+=cName+"_prototype.prototype = "+compileInfo.inheritFrom+".prototype\n";

var myDataClass_prototype = classConstructor;

var myDataClass = function(a, b, c, d, e, f, g, h) {
    if (this instanceof myDataClass) {
      console.log("is instance of...");
      console.log(this.__traitInit);
      var args = [a, b, c, d, e, f, g, h];
      if (this.__factoryClass) {
        var m = this;
        var res;
        this.__factoryClass.forEach(function(initF) {
          res = initF.apply(m, args);
        });
        if (Object.prototype.toString.call(res) == '[object Function]') {
          if (res._classInfo.name != myDataClass._classInfo.name) return new res(a, b, c, d, e, f, g, h);
        } else {
          if (res) return res;
        }
      }
      if (this.__traitInit) {
        console.log("Calling the subclass trait init...");
        var m = this;
        this.__traitInit.forEach(function(initF) {
          initF.apply(m, args);
        })
      } else {
        if (typeof this.init == 'function')
          this.init.apply(this, args);
      }
    } else{
        console.log("NOT instance of...");
        return new myDataClass(a, b, c, d, e, f, g, h);
    }
}
myDataClass._classInfo = {
    name : this.guid()
};

myDataClass_prototype.prototype = _data.prototype;
myDataClass.prototype = new myDataClass_prototype();

this.registerComponent( className, myDataClass);
this._addFactoryProperty( propertyName );


return myDataClass;


```

### <a name="_data_diff"></a>_data::diff(dataObj)


```javascript
var diff = diffEngine();
    
var res = diff.compareFiles( this.getData(true), dataObj.getData(true));

return res.cmds;
```

### <a name="_data_disconnect"></a>_data::disconnect(t)

Disconnects the object from listening the server update
```javascript

if(this._client) {
    this._client.disconnect();
}
return this;
```

### <a name="_data_fork"></a>_data::fork(newChannelId, description)


```javascript
// fork

var me = this;

return _promise( function(result) {
    
    me._client.fork(newChannelId, description).then( function(res) {

        if(res.result === false) {
            result(res);
            return;
        }        
        /*
    var req = this._parseURL(data);
    this._request = req;
    this._socket = _clientSocket(req.protocol+"://"+req.ip, req.port);          
        */
        var req = me._request;
        var myD = _data( req.protocol+"://"+req.ip+":"+req.port+"/"+newChannelId, me._initOptions);
        myD.then( function() {
            result( {
                    result : true,
                    fork : myD
                } ); 
        });
//         result(res);
    });  
});

```

### <a name="_data_getChannelClient"></a>_data::getChannelClient(t)


```javascript
return this._client;
```

### <a name="_data_getChannelData"></a>_data::getChannelData(t)


```javascript
return this._client.getChannelData();
```

### _data::constructor( data, options, client )

```javascript

// initialization
// _data("http://localhost/channel/id");

/*
var chClient = channelClient( "myId", null, {
    localChannel : true,
    localData : myData
});
*/

options = options || {};
var me = this;

this._initOptions = options;

if(typeof( data ) == "string") {
    
    if(!data.match("://")) {
        return;
    }

    var req = this._parseURL(data);
    this._request = req;
    
    if(options.ioLib) {
        console.log("had ioLib");
    }
    
    this._socket = _clientSocket(req.protocol+"://"+req.ip, req.port, options.ioLib);  
    var opts = {};
    if(options.auth) {
        opts.auth = options.auth
    }
    this._client = channelClient( req.fullPath, this._socket, opts);
    this._client.then( function(resp) {
        
        console.log("channel client ready");

        if(resp.result === false) {
          me.trigger("login::failed");
          return;   
        }
        var rawData = me._client.getData();
        
        me._initializeData(rawData);
        me.addToCache( rawData.__id, me ); 
        
        me._initWorkers();

        /*
        if(data && data.__id) {
            if(_up._find(data.__id)) {
                    
                // console.log("**** data found, initializing **** ");
                //console.log(JSON.parse(JSON.stringify( data) ));        
                me._initializeData(data);
                me.addToCache( data.__id, me );    
                me.resolve(true);       
                return;
            }
        } */       
        
        me.resolve(true);
    });
} else {
    
    if(client) {
        if(client && !this._client) this._client = client;
        if(this.isObject(data) && data.__id) {
            this._initializeData(data);
            this.addToCache( data.__id, this ); 
        }        

        me._initWorkers();      
        
        this.resolve(true);
    } else {
        
        if(this.isObject(data) && !data.__id) {
            data = this._wrapToData( data );
        }

        var chClient = channelClient( this.guid(), null, {
            localChannel : true,
            localData : data
        });      

        this._client = chClient;
        var me = this;
        this._client.then( function(resp) {
            var rawData = me._client.getData();
            if(!rawData) {
                me.resolve(true);
                return;
            }
            me._initializeData(rawData);
            me.addToCache( rawData.__id, me ); 

            me._initWorkers();            
            
            me.resolve(true);
        });        
    }
    
    
    

}


```
        
### <a name="_data_patch"></a>_data::patch(cmds)


```javascript
var me = this;
cmds.forEach( function(c, index) {
    var tc = me._client._transformCmdToNs( c );
    me._client.addCommand( tc, true );
});
return this;
```

### <a name="_data_reconnect"></a>_data::reconnect(t)


```javascript
if(this._client) {
    this._client.reconnect();
}
return this;
```

### <a name="_data_registerComponent"></a>_data::registerComponent(name, classDef)


```javascript

if(!_registry) _registry = {};

if(!_registry[name]) {
    _registry[name] = classDef;
}
```



   
    
## trait _dataTrait

The class has following internal singleton variables:
        
* _eventOn
        
* _commands
        
* _authToken
        
* _authRandom
        
* _authUser
        
* _up
        
* _dataCache
        
* _createdFunctions
        
* _setWorkers
        
        
### <a name="_dataTrait___dataTr"></a>_dataTrait::__dataTr(t)


```javascript

```

### <a name="_dataTrait__collectObject"></a>_dataTrait::_collectObject(me, what, cb)


```javascript
if(!this.isArray(what)) what = what.split(",");

var myData = {};
what.forEach(
        function(n) {
            myData[n] = me[n]();
            me.on(n, function() {
                myData[n] = me[n]();
                cb(myData);
            });
        }   
    );
cb(myData);
```

### <a name="_dataTrait__forMembers"></a>_dataTrait::_forMembers(fn)


```javascript
var me = this;

if(this.isArray()) {
    for(var i=0; i<this._data.length; i++) {
        var o = this._data[i];
        if(this.isObject(o)) {
            if(o.__dataTr) {
                fn(o);
            }
        }
    }
} else {
    this._members.forEach( function(n) {
        if(me[n]) fn(me[n]);
    });
}
```

### <a name="_dataTrait__initializeData"></a>_dataTrait::_initializeData(docData, options)


```javascript

if(!docData) return;

// pointer to the docUp data
this._data = docData.data;
this._docData = docData;

// TODO: might add worker 14 here...
var dataCh = this._client.getChannelData();

var ns_id = this._client._idToNs( this._docData.__id, this._client._ns ); 

dataCh.createWorker("_d_set",                                  // worker ID
                      [4, "*", null, null, ns_id],  // filter
                      { target : this});

dataCh.createWorker("_d_rem",                                  // worker ID
                      [8, "*", null, null, ns_id],  // filter
                      { target : this});     

dataCh.createWorker("_d_ins",                                  // worker ID
                      [7, "*", null, null, ns_id],  // filter
                      { target : this});           
                      
dataCh.createWorker("_d_mv",                                  // worker ID
                      [12, "*", null, null, ns_id],  // filter
                      { target : this});      
                      
// "_d_cf"

dataCh.createWorker("_d_cf",                                  // worker ID
                      [5, "*", null, null, ns_id],  // filter
                      { obj : this});  
dataCh.createWorker("_d_cf",                                  // worker ID
                      [4, "*", null, null, ns_id],  // filter
                      { obj : this});                      

var data = docData.data;

// create the subdata instances for the objects...
if(data instanceof Array) {
    
    for(var n in data) {
        this[n] = _data(data[n], options, this._client);
    }   
    
} else {
    for(var n in data) {
        if(data.hasOwnProperty(n)) {
            var v = data[n];
            if(this.isFunction(v) ) {
                continue;
            }
            if( !this.isFunction(v) && ( v === Object(v) || (v instanceof Array) )) {
                this[n] = new _data(v ,options, this._client);
                continue;
            }
            // just plain member variable function setting 
            if(!this.isFunction(v) && !this.isObject(v) && !this.isArray(v)) {
                if(!this[n]) {
                    this.createPropertyUpdateFn(n,v);
                }
            }
        }
    }        
}

```

### <a name="_dataTrait__objectCreateCmds"></a>_dataTrait::_objectCreateCmds(data, list)

Creates the commands to create the object - the object should be in { data : , __id}  - format, use _wrapToData if not already in this format.
```javascript
if(!list) list = [];

if(this.isObject(data) && data.data ) {

    if(this.isArray(data.data)) {
        list.push( [2, data.__id, "", null, data.__id] );
        
        for(var i=0; i< data.data.length; i++) {
            var obj = data.data[i];
            if(this.isObject(obj)) {
               // they should be...
               this._objectCreateCmds( obj, list);
               var cmd = [7, i, obj.__id, null, data.__id];
               list.push(cmd);               
            } 
        }
        
    } else {
        list.push( [1, data.__id, "", null, data.__id] );
        // var cmd = [1, newObj.__id, {}, null, newObj.__id];

        for(var n in data.data) {
            if(data.data.hasOwnProperty(n)) {
                var value = data.data[n];
                if( this.isObject(value) ) {
                    this._objectCreateCmds( value, list );
                    var cmd = [5, n, value.__id, null, data.__id];
                    list.push(cmd);
                } else {
                    var cmd = [4, n, value, null, data.__id];
                    list.push(cmd);
                }
            }
        }
        
    }
}
return list;

```

### <a name="_dataTrait__parseURL"></a>_dataTrait::_parseURL(url)


```javascript
   
var parts1 = url.split("://");
var protocol = parts1.shift(),
    rest = parts1.shift();
var serverParts = rest.split("/"),
    ipAndPort = serverParts.shift(),
    iParts = ipAndPort.split(":"),
    ip = iParts[0],
    port = iParts[1],
    sandbox = serverParts.shift(),
    fileName = serverParts.pop(),
    path = serverParts.join("/");
    
return {
             url : url,
             ip : ip,
             port : port,
             sandbox : sandbox,
             path : path,
             file : fileName,
             protocol : protocol
        };
```

### <a name="_dataTrait__reGuidRawData"></a>_dataTrait::_reGuidRawData(data)


```javascript

if(this.isArray(data)) {
    var me = this;
    data.forEach( function(i) {
        me._reGuidRawData(i)
    });
} else {
    if(this.isObject(data)) {
        for( var n in data) {
            if(!data.hasOwnProperty(n)) continue;
            if(n=="__id") {
                data[n] = this.guid();
                continue;
            }
            if(this.isObject(data[n])) this._reGuidRawData( data[n] );
            if(this.isArray(data[n])) this._reGuidRawData( data[n] );
        }
    }
}
```

### <a name="_dataTrait__wrapToData"></a>_dataTrait::_wrapToData(data)


```javascript

var newObj;
// if the data is "well formed"
if(data.__id && data.data) {
    newObj = data;
} else {
    var newObj = {
        data : data,
        __id : this.guid()
    }    
}

if(newObj.data && this.isObject(newObj.data)) {
    for( var n in newObj.data  ) {
        if(newObj.data.hasOwnProperty(n)) {
            var o = newObj.data[n];  
            if(this.isObject(o)) {
                newObj.data[n] = this._wrapToData( o );
            }
        }
              
    }
}
return newObj;
```

### <a name="_dataTrait_addController"></a>_dataTrait::addController(c)


```javascript
console.error("** askChannelQuestion ** not implemented now ");

```

### <a name="_dataTrait_askChannelQuestion"></a>_dataTrait::askChannelQuestion(question, data, cb)


```javascript

console.error("** askChannelQuestion ** not implemented now ");

/*
var url = this._findURL();
console.log("Asking, the URL was "+url);
var doc = _docUp( url );
doc.then( function() {
    console.log("Resolved the doc, asking the channel the question "+question);
    doc._ask(question, data, cb ); 
});
*/


```

### <a name="_dataTrait_at"></a>_dataTrait::at(i)


```javascript
var ii = this._docData.data[i];
if(ii) return _data( ii, null, this._client );
```

### <a name="_dataTrait_clear"></a>_dataTrait::clear(t)


```javascript
var len = this.length();
while(len--) {
    this.pop();
}
```

### <a name="_dataTrait_clone"></a>_dataTrait::clone(t)


```javascript
return _data(this.serialize());
```

### <a name="_dataTrait_copyToData"></a>_dataTrait::copyToData(t)


```javascript

var raw = this.toData();
this._reGuidRawData( raw );

return raw;
```

### <a name="_dataTrait_createArrayField"></a>_dataTrait::createArrayField(n, v, validators)


```javascript

return this.set( this._docData.__id, n, v);
```

### <a name="_dataTrait_createField"></a>_dataTrait::createField(n, defaultValue)


```javascript
this.set(n, defaultValue || "");
return this;
```

### <a name="_dataTrait_createObjectField"></a>_dataTrait::createObjectField(n, v)


```javascript
return this.set( this._docData.__id, n, v);
```

### <a name="_dataTrait_createPropertyUpdateFn"></a>_dataTrait::createPropertyUpdateFn(name, value)


```javascript

if(this.isObject(value) || this.isObject(this._docData.data[name])) {
    this[name] = _data(value, null, this._client);    
    return;
}

var me = this;
if(!_myTrait_[name]) {
    _myTrait_[name] = function(value) {

        if(typeof(value)=="undefined") {
            return this._client.get(this._docData.__id, name);
        }
        this._client.set(this._docData.__id, name, value);
        return this;
    };
    _createdFunctions[name] = true;
} 
```

### <a name="_dataTrait_createWorker"></a>_dataTrait::createWorker(workerName, workerFilter, workerData, workerFn)


```javascript

workerFilter[4] = this._client._idToNs( workerFilter[4], this._client._ns ); 

var dataCh = this._client.getChannelData();
dataCh.createWorker(  workerName,       // worker ID
                      workerFilter,     // filter
                      workerData);
  
if(workerFn) {
    if(!_setWorkers) _setWorkers = {};
    if(!_setWorkers[workerName]) {
        
        
        
        var oo = {};
        oo[workerName] = workerFn;
        dataCh.setWorkerCommands(oo);  
        _setWorkers[workerName] = true;
    }
}          
return this;
/*
var me = this;
if(!_workersDone) {
    var dataCh = me._client.getChannelData();
    dataCh.setWorkerCommands({
        "_d_set" : function(cmd, options) {        
            // for example, trigger .on("x", value);
            options.target.trigger(cmd[1], cmd[2]);
        }
    });  
    _workersDone = true;
}
*/
```

### <a name="_dataTrait_emitValue"></a>_dataTrait::emitValue(scope, data)


```javascript
if(this._processingEmit) return this;

this._processingEmit = true;
// adding controllers to the data...
if(this._controllers) {
    var cnt = 0;
    for(var i=0; i<this._controllers.length; i++) {
        var c = this._controllers[i];
        if(c[scope]) {
           c[scope](data);
           cnt++;
        }
    }
    
    // this._processingEmit = false;
    // Do not stop emitting the value to the parents...
    // if(cnt>0) return this;
}

/*
if(this._controller) {
    if(this._controller[scope]) {
       this._controller[scope](data);
       return;
    }
}
*/

if(this._valueFn && this._valueFn[scope]) {
    this._valueFn[scope].forEach(function(fn) {
        fn(data);
    });
} 
if(1) {
    if(this._parent) {
        if(!this._parent.emitValue) {
            // console.log("Strange... no emit value in ", this._parent);
        } else {
            this._parent.emitValue(scope,data);
        }
    }
}
this._processingEmit = false;
```

### <a name="_dataTrait_extendWith"></a>_dataTrait::extendWith(obj)


```javascript


for(var n in obj) {
    var fn = obj[n];
    if(this.isFunction(fn)) {
        _myTrait_[n] = fn;
    }
}
```

### <a name="_dataTrait_find"></a>_dataTrait::find(path)


```javascript
// should find the item from the path...

console.error("*** FIND IS NOT IMPLEMENTED *** ");

// var dataObj = _up._getObjectInPath(path, this._docData);
// if(dataObj) return _data(dataObj.__id);

return null;
```

### <a name="_dataTrait_forEach"></a>_dataTrait::forEach(fn)


```javascript

this._docData.data.forEach( function(d) {
    fn(_data(d));
});


```

### <a name="_dataTrait_get"></a>_dataTrait::get(name)


```javascript
return this._client.get(this._docData.__id, name);

```

### <a name="_dataTrait_getData"></a>_dataTrait::getData(stripNamespace)


```javascript

var data = this._client.getData();
if(stripNamespace) {
    // got to create a new object out of this...
    var newData = JSON.parse( JSON.stringify(data ));
    data = this._client._transformObjFromNs(newData);
}
return data;
```

### <a name="_dataTrait_getID"></a>_dataTrait::getID(t)


```javascript

return this._docData.__id;
```

### <a name="_dataTrait_guid"></a>_dataTrait::guid(t)


```javascript

return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);

/*        
function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
               .toString(16)
               .substring(1);
  }

return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
       s4() + '-' + s4() + s4() + s4();*/
```

### <a name="_dataTrait_hasOwn"></a>_dataTrait::hasOwn(name)


```javascript

if(typeof( this._docData.data[name]) != "undefined" && ( this[name]) ) {
    return true;
}
return false;
```

### <a name="_dataTrait_indexOf"></a>_dataTrait::indexOf(t)


```javascript
return this._client.indexOf( this._docData.__id );
```

### _dataTrait::constructor( data, options, notUsed, notUsed2 )

```javascript

if(!_dataCache) {
    _dataCache = {};
    _createdFunctions = {};
}
```
        
### <a name="_dataTrait_insertAt"></a>_dataTrait::insertAt(index, v)


```javascript
return this.push(v, index);

```

### <a name="_dataTrait_isArray"></a>_dataTrait::isArray(t)


```javascript

if(typeof(t)=="undefined") {
    if(!this._docData) return false;
    if(!this._docData.data) return false;    
    return this.isArray( this._docData.data );
}
return Object.prototype.toString.call( t ) === '[object Array]';
```

### <a name="_dataTrait_isDataTrait"></a>_dataTrait::isDataTrait(obj)


```javascript

if(obj._docData) return true;
```

### <a name="_dataTrait_isFunction"></a>_dataTrait::isFunction(fn)


```javascript
return Object.prototype.toString.call(fn) == '[object Function]';
```

### <a name="_dataTrait_isObject"></a>_dataTrait::isObject(t)


```javascript

if(typeof(t)=="undefined") {
    if(!this._docData) return false;
    if(!this._docData.data) return false;
    return this.isObject( this._docData.data );
}

return t === Object(t);
```

### <a name="_dataTrait_item"></a>_dataTrait::item(i)


```javascript
return this.at(i);
```

### <a name="_dataTrait_keys"></a>_dataTrait::keys(fn)


```javascript
var i=0;
for(var n in this._docData.data) {
    
    if(this._docData.data.hasOwnProperty(n)) {
        fn( n, this._docData.data[n], this._docData.data );
    }
}

return this;
```

### <a name="_dataTrait_length"></a>_dataTrait::length(t)


```javascript
if(!this._docData) return 0;
if(!this._docData.data) return 0;
return this._docData.data.length;
```

### <a name="_dataTrait_moveDown"></a>_dataTrait::moveDown(t)


```javascript
this._client.moveDown(this._docData.__id);
return this;
```

### <a name="_dataTrait_moveToIndex"></a>_dataTrait::moveToIndex(index)


```javascript
this._client.moveTo(this._docData.__id, index);

return this;
```

### <a name="_dataTrait_moveUp"></a>_dataTrait::moveUp(t)


```javascript
this._client.moveUp(this._docData.__id);

return this;
```

### <a name="_dataTrait_onValue"></a>_dataTrait::onValue(scope, fn)


```javascript
if(!this._valueFn) {
    this._valueFn = {};
}
if(!this._valueFn[scope])
  this._valueFn[scope]= [];

if(this._valueFn[scope].indexOf(fn)<0)   
    this._valueFn[scope].push( fn );
```

### <a name="_dataTrait_parent"></a>_dataTrait::parent(p)


```javascript

if(typeof(p)!= "undefined") {
    return this;
}
if(!this._docData) {
    return;
}

var p = this._docData.__p;
if(p) return _data(p);


    
```

### <a name="_dataTrait_pick"></a>_dataTrait::pick(what)


```javascript

var stream = simpleStream();
var me = this;

this.then(
    function() {
        me._collectObject( me, what, function(data) {
                stream.pushValue(data);
            });
    });
    
return stream;
```

### <a name="_dataTrait_pop"></a>_dataTrait::pop(t)


```javascript

var len = this.length();
if(len) {
    var it = this.at(len-1);
    if(it) it.remove();
    return it;
}
```

### <a name="_dataTrait_push"></a>_dataTrait::push(newData, toIndex)


```javascript

if(!this.isArray()) return this;

var data;
if(newData._wrapToData) {
    newData = newData.getData();
}

// is raw data
if(newData.__id && newData.data ) {
    // ??? should you create a full copy of the original object here just in case...
    data = this._client._transformObjToNs( newData, this._client._ns );
} else {
    data = this._wrapToData( newData );
}
var cmds = this._objectCreateCmds( data );
for(var i=0; i<cmds.length; i++) {
    this._client.addCommand( cmds[i] );
}
var index;
if(typeof(toIndex) != "undefined") {
    index = toIndex;
    var dd = this._client._fetch( this._docData.__id );
    if(index<0 || index > dd.data.length) return;
} else {
    var dd = this._client._fetch( this._docData.__id );
    index = dd.data.length;
}

console.log("push ",newData.__id, " to index ", index );

this._client.addCommand( [7, index, data.__id, null, this._docData.__id ] );

return this;


```

### <a name="_dataTrait_redo"></a>_dataTrait::redo(cnt)


```javascript
this._client.redo(cnt);
return this;
```

### <a name="_dataTrait_remove"></a>_dataTrait::remove(t)


```javascript
this._client.remove( this._docData.__id  );
return this;

```

### <a name="_dataTrait_removeListener"></a>_dataTrait::removeListener(eventName, fn)


```javascript
if(this._events && this._events[eventName]) {
    var i = this._events[eventName].indexOf(fn);
    if(i>=0) this._events[eventName].splice(i,1);
    if(this._events[eventName].length==0) {
        delete this._events[eventName];
    }
}
```

### <a name="_dataTrait_renderTemplate"></a>_dataTrait::renderTemplate(tplData)


```javascript

console.error("RenderTemplate not implemented");

/*
var comp = templateCompiler();  
var jsonTplData = comp.compile( tplData );
var dom = comp.composeTemplate( this._docData,  jsonTplData );
return dom;
*/
```

### <a name="_dataTrait_serialize"></a>_dataTrait::serialize(nonRecursive)


```javascript
var o, me = this,
    data = this._docData.data;
if(this.isArray(this._data)) {
    o = [];
} else {
    o = {};
}

for(var n in data) {
    if(data.hasOwnProperty(n)) {
        var v = data[n];
        if(typeof(v)=="undefined") continue;
        if(nonRecursive) {
            if(this.isObject(v) || this.isArray(v)) continue;
        }
        if(this.isObject(v)) {
           o[n] = _data(v).serialize();
        } else {
           o[n] = v; 
        }
    }
}

return o;
```

### <a name="_dataTrait_set"></a>_dataTrait::set(name, value)


```javascript

if(this.isFunction(value)) {
    var me = this;
    this.then( function() {
        return me.set(name, value(me.get(name)) );
    });
    return this;
}

if(this.isObject(value)) {
 
    var data, newData = value;
    
    if(newData._wrapToData) {
        newData = newData.getData();
    }
    
    if(newData.__id && newData.data ) {
        data = this._client._transformObjToNs( newData, this._client._ns );
    } else {
        data = this._wrapToData( newData );
    }
    
    var cmds = this._objectCreateCmds( data );
    for(var i=0; i<cmds.length; i++) {
        this._client.addCommand( cmds[i] );
    }
    this._client.setObject( this._docData.__id, name, data  );
    var objData = this._client._fetch( data.__id );
    this.createPropertyUpdateFn( name,  objData );
    
    return this;    
} else {
    


    this._client.set(this._docData.__id, name, value);
    this.createPropertyUpdateFn( name, value );
    return this;
}

```

### <a name="_dataTrait_toData"></a>_dataTrait::toData(nonRecursive)


```javascript

var str = JSON.stringify( this._docData );
var data = JSON.parse( str );

if(data.__ctxCmdList) delete data.__ctxCmdList;
if(data.__cmdList) delete data.__cmdList;

return data;
```

### <a name="_dataTrait_toPlainData"></a>_dataTrait::toPlainData(nonRecursive)


```javascript

return this.getChannelData().toPlainData();
```

### <a name="_dataTrait_undo"></a>_dataTrait::undo(cnt)


```javascript
this._client.undo(cnt);
return this;
```

### <a name="_dataTrait_unset"></a>_dataTrait::unset(name)


```javascript


this._client.unset( this._docData.__id, name );

return this;

```


    
    
    
## trait eventTrait

The class has following internal singleton variables:
        
* _eventOn
        
        
### eventTrait::constructor( t )

```javascript

if(!_eventOn) _eventOn = [];

```
        
### <a name="eventTrait_on"></a>eventTrait::on(eventName, fn)


```javascript
if(!this._events) this._events = {};
if(!this._events[eventName]) this._events[eventName] = [];
this._events[eventName].push(fn);

// This might remove the old event...
var me = this;
fn._unbindEvent = function() {
    // console.log("unbindEvent called");
    me.removeListener(eventName, fn);
}
/*
var worker = _up._createWorker( this._docData.__id,  
                                eventName, 	
                                _workers().fetch(14),
                                null,
                                {
                                    modelid : this._docData.__id,
                                    eventName : eventName,
                                    eventObj : this
                                } );

*/


```

### <a name="eventTrait_removeListener"></a>eventTrait::removeListener(eventName, fn)


```javascript
if(this._events && this._events[eventName]) {
    var i = this._events[eventName].indexOf(fn);
    if(i>=0) this._events[eventName].splice(i,1);
    if(this._events[eventName].length==0) {
        delete this._events[eventName];
    }
}
```

### <a name="eventTrait_trigger"></a>eventTrait::trigger(eventName, data)


```javascript
if(_eventOn.indexOf(eventName+this._guid)>=0) {
    return;
}

if(this._events && this._events[eventName]) {
  var el = this._events[eventName],
    me = this;
    _eventOn.push(eventName+this._guid);
    var len = el.length;
    for(var i=0; i<len; i++) {
        el[i](me,data);
    }

    var mi = _eventOn.indexOf(eventName+this._guid);
    _eventOn.splice(mi,1);
    // console.log("The event array", _eventOn);
}
```


    
    
    
## trait workerShortcuts

The class has following internal singleton variables:
        
        
### <a name="workerShortcuts_propWorker"></a>workerShortcuts::propWorker(propName, workerName, options)


```javascript

this.createWorker(workerName,           
   [4, propName, null, null, this.getID()],    // Condition to run worker
   options);                                // Options for the worker

return this;
```


    
    


   
      
    
      
    
      
    



      
    
      
            
# Class channelObjects


The class has following internal singleton variables:
        
        
### channelObjects::constructor( options )

```javascript

```
        


   
    
    
    
    
    
    


   
      
            
# Class aceCmdConvert


The class has following internal singleton variables:
        
        
### <a name="aceCmdConvert_fromAce"></a>aceCmdConvert::fromAce(cmdList)


```javascript


var newList = [];

cmdList.forEach( function(cmd) {
    
    var range = cmd.range;
    if(cmd.action=="insertText") {
        newList.push([
                1, 
                range.start.row,
                range.start.column,
                range.end.row,
                range.end.column,
                cmd.text
            ])
    }
    if(cmd.action=="removeText") {
        newList.push([
                2, 
                range.start.row,
                range.start.column,
                range.end.row,
                range.end.column,
                cmd.text
            ])
    }
    if(cmd.action=="insertLines") {
        newList.push([
                3, 
                range.start.row,
                range.start.column,
                range.end.row,
                range.end.column,
                cmd.lines
            ])
    }
    if(cmd.action=="removeLines") {
        newList.push([
                4, 
                range.start.row,
                range.start.column,
                range.end.row,
                range.end.column,
                cmd.lines,
                cmd.nl
            ])
    }
    
    
});

return newList;

/*
{"action":"insertText","range":{"start":{"row":0,"column":0},
    "end":{"row":0,"column":1}},"text":"d"}
*/
```

### aceCmdConvert::constructor( onFulfilled, onRejected )

```javascript

```
        
### <a name="aceCmdConvert_reverse"></a>aceCmdConvert::reverse(cmdList)


```javascript

var newList = [];

cmdList.forEach( function(oldCmd) {
    
    var cmd = oldCmd.slice(); // create a copy of the old command
    
    var row = cmd[1],
        col = cmd[2],
        endRow = cmd[3],
        endCol = cmd[4];
        
    // add characters...
    if(cmd[0]==1) {
        cmd[0] = 2;
        newList.unshift( cmd );
        return; // this simple ???
    }
    if(cmd[0]==2) {
        cmd[0] = 1;
        newList.unshift( cmd );
        return; // this simple ???
    }    
    if(cmd[0]==3) {
        cmd[0] = 4;
        newList.unshift( cmd );
        return; // this simple ???      
        /*
        var cnt = endRow - row;
        for(var i=0; i<cnt; i++) {
            lines.splice(row+i, 0, cmd[5][i]);
        } 
        */
    }
    if(cmd[0]==4) {
        cmd[0] = 3;
        newList.unshift( cmd );
        return; // this simple ???   
        /*
        var cnt = endRow - row;
        for(var i=0; i<cnt; i++) {
            lines.splice(row, 1);
        } 
        */
    }    
    
});

return newList;
```

### <a name="aceCmdConvert_runToAce"></a>aceCmdConvert::runToAce(cmdList)


```javascript


var newList = [],
    _convert = ["",
        "insertText","removeText","insertLines", "removeLines"
    ];

cmdList.forEach( function(cmd) {
    
    var c ={
            action : _convert[cmd[0]],
            range : {
                start : { row : cmd[1], column : cmd[2]},
                end   : { row : cmd[3], column : cmd[4]}
            }
        };
    if(cmd[0]<3) {
        c.text = cmd[5];
    } else {
        c.lines = cmd[5];
    }
    if(cmd[0]==4) c.nl = cmd[6] || "\n";
    newList.push(c);
    
});

return newList;

/*
{"action":"insertText","range":{"start":{"row":0,"column":0},
    "end":{"row":0,"column":1}},"text":"d"}
*/
```

### <a name="aceCmdConvert_runToLineObj"></a>aceCmdConvert::runToLineObj(lines, cmdList)


```javascript

cmdList.forEach( function(cmd) {
    var row = cmd[1],
        col = cmd[2],
        endRow = cmd[3],
        endCol = cmd[4];
    if(cmd[0]==1) {
        if(cmd[5]=="\n") {
            // add the newline can be a bit tricky
            var line = lines.item(row);
            if(!line) {
                lines.insertAt(row, { text : "" });
                lines.insertAt(row+1, { text : "" });
            } else {
                var txt = line.text();
                line.text( txt.slice(0,col) );
                var newLine = {
                    text : txt.slice(col) || ""
                };
                lines.insertAt(row+1, newLine);
            }
            //lines[row] = line.slice(0,col);
            //var newLine = line.slice(col) || "";
            //lines.splice(row+1, 0, newLine);
        } else {
            var line = lines.item(row);
            if(!line) {
                lines.insertAt(row, { text : cmd[5] });
            } else {
                var txt = line.text();
                line.text( txt.slice(0, col) + cmd[5] + txt.slice(col) );
                // lines[row] = line.slice(0, col) + cmd[5] + line.slice(col);
            }
        }
    }
    if(cmd[0]==2) {
        if(cmd[5]=="\n") {
            // removing the newline can be a bit tricky
            // lines[row]
            var thisLine = lines.item(row),
                nextLine = lines.item( row+1 );
            
            // lines[row] = thisLine + nextLine;
            // lines.splice(row+1, 1); // remove the line...
            var txt1 = "", txt2 = "";
            if(thisLine) txt1 = thisLine.text();
            if(nextLine) txt2 = nextLine.text();
            if(!thisLine) {
                lines.insertAt(row, { text : "" });
            } else {
                thisLine.text( txt1 + txt2 );
            }
            if(nextLine) nextLine.remove();
        } else {
            var line = lines.item(row),
                txt = line.text();
            line.text( txt.slice(0, col) + txt.slice(endCol) );
            //  str.slice(0, 4) + str.slice(5, str.length))
            // lines[row] = line.slice(0, col) + line.slice(endCol);
        }
    }    
    if(cmd[0]==3) {
        var cnt = endRow - row;
        for(var i=0; i<cnt; i++) {
            // var line = lines.item(row+i);
            lines.insertAt(row+i, { text : cmd[5][i] });
            // lines.splice(row+i, 0, cmd[5][i]);
        }         
    }
    if(cmd[0]==4) {
        var cnt = endRow - row;
        for(var i=0; i<cnt; i++) {
            var line = lines.item(row);
            line.remove();
            // lines.splice(row, 1);
        }       
    }    
    
});
/*
tools.button().text("Insert to 1 ").on("click", function() {
    myT.lines.insertAt(1, { text : prompt("text")}); 
});
tools.button().text("Insert to 0 ").on("click", function() {
    myT.lines.insertAt(0, { text : prompt("text")}); 
});
tools.button().text("Split line 1").on("click", function() {
    var line1 = myT.lines.item(1);
    var txt = line1.text();
    var txt1 = txt.substring(0, 4),
        txt2 = txt.substring(4);
    line1.text(txt1);
    myT.lines.insertAt(2, { text : txt2 });
});
tools.button().text("Insert to N-1 ").on("click", function() {
    myT.lines.insertAt(myT.lines.length()-1, { text : prompt("text")}); 
});
tools.button().text("Insert to N ").on("click", function() {
    myT.lines.insertAt(myT.lines.length(), { text : prompt("text")}); 
});
*/

```

### <a name="aceCmdConvert_runToString"></a>aceCmdConvert::runToString(str, cmdList)


```javascript

if( !cmdList || ( typeof(str)=="undefined")) {
    return "";
}
str = str+"";

var lines = str.split("\n");

cmdList.forEach( function(cmd) {
    var row = cmd[1],
        col = cmd[2],
        endRow = cmd[3],
        endCol = cmd[4];
    if(cmd[0]==1) {
        if(cmd[5]=="\n") {
            // add the newline can be a bit tricky
            var line = lines[row] || "";
            lines[row] = line.slice(0,col);
            var newLine = line.slice(col) || "";
            lines.splice(row+1, 0, newLine);
        } else {
            var line = lines[row] || "";
            lines[row] = line.slice(0, col) + cmd[5] + line.slice(col);
        }
    }
    if(cmd[0]==2) {
        if(cmd[5]=="\n") {
            // removing the newline can be a bit tricky
            // lines[row]
            var thisLine = lines[row] || "",
                nextLine = lines[row+1] || "";
            lines[row] = thisLine + nextLine;
            lines.splice(row+1, 1); // remove the line...
        } else {
            var line = lines[row] || "";
            // str.slice(0, 4) + str.slice(5, str.length))
            lines[row] = line.slice(0, col) + line.slice(endCol);
        }
    }    
    if(cmd[0]==3) {
        var cnt = endRow - row;
        for(var i=0; i<cnt; i++) {
            lines.splice(row+i, 0, cmd[5][i]);
        }         
    }
    if(cmd[0]==4) {
        var cnt = endRow - row;
        for(var i=0; i<cnt; i++) {
            lines.splice(row, 1);
        }       
    }    
    
});

return lines.join("\n");
```

### <a name="aceCmdConvert_simplify"></a>aceCmdConvert::simplify(cmdList)


```javascript

// [[1,0,0,0,1,"a"],[1,0,1,0,2,"b"],[1,0,2,0,3,"c"],[1,0,3,0,4,"e"],[1,0,4,0,5,"d"],
// [1,0,5,0,6,"e"],[1,0,6,0,7,"f"],[1,0,7,0,8,"g"]]
var newList = [],
    lastCmd,
    lastCol,
    lastRow,
    collect = null;

cmdList.forEach( function(cmd) {
    
    if(lastCmd && (cmd[0]==1) && (lastCmd[0]==1) && (cmd[3]==cmd[1]) && (lastCmd[1]==cmd[1]) && (lastCmd[3]==cmd[3]) && (lastCmd[4]==cmd[2]) ) {
        if(!collect) {
            collect = [];
            collect[0] = 1;
            collect[1] = lastCmd[1];
            collect[2] = lastCmd[2];
            collect[3] = cmd[3];
            collect[4] = cmd[4];
            collect[5] = lastCmd[5] + cmd[5];
        } else {
            collect[3] = cmd[3];
            collect[4] = cmd[4];
            collect[5] = collect[5] + cmd[5];
        }
    } else {
        if(collect) {
            newList.push(collect);
            collect = null;
        } 
        if(cmd[0]==1) {
            collect = cmd.slice();
        } else {
            newList.push(cmd);
        }
    }
    lastCmd = cmd;
});
if(collect) newList.push(collect);
return newList;
```



   


   



      
    
      
            
# Class diffEngine


The class has following internal singleton variables:
        
* _all
        
* _data1
        
* _data2
        
* _up
        
* _reals
        
* _missing
        
* _added
        
* _parents
        
        
### <a name="diffEngine__createModelCommands"></a>diffEngine::_createModelCommands(obj, parentObj, intoList)


```javascript

/*
    _cmdIndex = {}; 
    _cmdIndex["createObject"] = 1;
    _cmdIndex["createArray"]  = 2;
    _cmdIndex["initProp"]  = 3;
    _cmdIndex["set"]  = 4;
    _cmdIndex["setMember"]  = 5;
    _cmdIndex["push"]  = 6;
    _cmdIndex["pushObj"]  = 7;
    _cmdIndex["removeItem"]  = 8;
    
    // reserved 9 for optimizations
    _cmdIndex["last"]  = 9;
    
    _cmdIndex["removeProperty"]  = 10;
    _cmdIndex["insertObjectAt"]  = 11;
    _cmdIndex["moveToIndex"]  = 12;
*/

if(!intoList) intoList = [];

var data;

if(obj.data && obj.__id ) {
    data = obj.data;
} else {
    data = obj;
}

if(this.isObject(data) || this.isArray(data)) {
    
    var newObj;
    
    if(obj.__id) {
        newObj = obj;
    } else {
        newObj = {
            data : data,
            __id : this.guid()
        }
    }
    
    if(this.isArray(data)) {
        var cmd = [2, newObj.__fork || newObj.__id, [], null, newObj.__fork || newObj.__id];
    } else {
        var cmd = [1, newObj.__fork || newObj.__id, {}, null, newObj.__fork || newObj.__id];
    }
    if(parentObj) {
        newObj.__p = parentObj.__id;
        // this._moveCmdListToParent( newObj );
    }
    intoList.push( cmd );

    // Then, check for the member variables...
    for(var n in data) {
        if(data.hasOwnProperty(n)) {
            var value = data[n];
            if(this.isObject(value) || this.isArray(value)) {
                // Then create a new...
                var oo = this._createModelCommands( value, newObj, intoList );
                var cmd = [5, n, oo.__fork || oo.__id, null, newObj.__fork || newObj.__id];
                intoList.push( cmd );
            } else {
                var cmd = [4, n, value, null, newObj.__fork || newObj.__id];
                intoList.push( cmd );
            }
        }
    }
    
    return newObj;
} else {
    
}



/*
var newObj = {
    data : data,
    __id : this.guid()
}
*/
```

### <a name="diffEngine_addedObjects"></a>diffEngine::addedObjects(t)


```javascript

var res = [];

for( var id in _data2) {
    if(_data2.hasOwnProperty(id)) {
        if(!_data1[id]) {
            res.push( id );
            _added[id] = _data2[id];
        }
    }
}

return res;
```

### <a name="diffEngine_commonObjects"></a>diffEngine::commonObjects(t)


```javascript
var res = [];

for( var id in _all) {
    if(_data1[id] && _data2[id]) {
        res.push( id );
    }
}

return res;
```

### <a name="diffEngine_compareFiles"></a>diffEngine::compareFiles(data1, data2)


```javascript

// these are static global for the diff engine, the results are one-time only
_data1 = {};
_data2 = {};
_all = {};
_reals = {};
_missing = {};
_added = {};
_parents = {};

this.findObjects(data1, _data1);
this.findObjects(data2, _data2);

var details = {
    missing : this.missingObjects(),
    added : this.addedObjects(),
    common : this.commonObjects(),
    cMod : [],
    cmds : []
};

var me = this;
details.common.forEach( function(id) {
    var diff = me.objectDiff( _data1[id], _data2[id] ); 
    details.cMod.push( diff );
});

var me = this;
details.added.forEach( function(cid) {
   var cmdList = [];
   var obj = _all[cid];
   me._createModelCommands( obj, null, cmdList ); 
   
   cmdList.forEach( function(cmd) {
       details.cmds.push(cmd);
   });
});
details.cMod.forEach( function(c) {
    c.cmds.forEach( function(cc) {
         details.cmds.push(cc);
    });
});


return details;

```

### <a name="diffEngine_findObjects"></a>diffEngine::findObjects(data, saveTo, parentObj)


```javascript

if(data && data.__id) {
    saveTo[data.__fork || data.__id] = data;
    _all[data.__fork || data.__id] = data;
    _reals[data.__id] = data;
}

if(data.data) {
    var sub = data.data;
    for(var n in sub) {
        if(sub.hasOwnProperty(n)) {
            var p = sub[n];
            if(this.isObject(p)) {
                _parents[p.__fork || p.__id] = data.__fork || data.__id;
                this.findObjects(p, saveTo);
            } 
        }
    }
}
```

### diffEngine::constructor( t )

```javascript

```
        
### <a name="diffEngine_missingObjects"></a>diffEngine::missingObjects(t)


```javascript

var res = [];

for( var id in _data1) {
    if(_data1.hasOwnProperty(id)) {
        if(!_data2[id]) {
            _missing[id] = _data1[id];
            res.push( id );
        }
    }
}

return res;
```

### <a name="diffEngine_objectDiff"></a>diffEngine::objectDiff(obj1, obj2)


```javascript
var res = {
    modified : [], 
    posMoved : [],
    sourcesAndTargets : [],
    cmds : []
};

if(obj1.data && obj2.data && this.isObject(obj1.data) && !this.isArray(obj1.data)) {
    var sub = obj1.data, hadProps = {};
    for(var n in obj2.data) {
        if(obj2.data.hasOwnProperty(n)) {
            var v = sub[n],
                objid = obj1.__fork || obj1.__id;
            if(!this.isObject(v) && (!this.isArray(v))) {
                hadProps[n] = true;
                var v2 = obj2.data[n];
                if(obj2.data[n] != v) {
                    if(this.isObject(v) || this.isObject(v2)) {
                        if(v2 && v2.__id) {
                            res.cmds.push([5, n, obj2.data[n].__id, null, objid]);
                        } else {
                            res.cmds.push([10, n, v.__id, null, objid]);
                        }
                    } else {
                        res.modified.push({ id : objid, prop : n, from : v, to : obj2.data[n]});
                        res.cmds.push([4, n, obj2.data[n], v, objid]);
                    }
                }
            } else {
             
            }
        }
    }
    for(var n in obj1.data) {
        if(obj1.data.hasOwnProperty(n)) {
            if(hadProps[n]) continue;
            var v = obj1.data[n],
                objid = obj1.__id;

            if(this.isObject(v) && (!this.isArray(v))) {
                var v2 = obj2.data[n];
                if(!v2 && v && v.__id) {
                    res.cmds.push([10, n, v.__id, null, objid]);
                }
            }                
        }
    }    
}
if(this.isArray(obj1.data)) {

    var arr1 = obj1.data,
        arr2 = obj2.data,
        sourceArray = [],
        targetArray = [],
        len1 = arr1.length,
        len2 = arr2.length;
    // insert
    // [7, 0, <insertedID>, 0, <parentId>]
        
    // remove
    // [8, 0, <insertedID>, 0, <parentId>]        
    for(var i=0; i<len1;i++) {
        var o = arr1[i];
        if(this.isObject(o)) {
            var activeId = o.__fork || o.__id;
            if(!_missing[activeId]) {
                sourceArray.push( activeId );
            } else {
                // res.cmds.push("remove "+activeId);
                res.cmds.push([8, 0, activeId, 0, _parents[activeId]]);
            }
        }
    }
    var indexArr = {},
        reverseIndex = {},
        sourceReverseIndex = {};
    for(var i=0; i<len2;i++) {
        var o = arr2[i];
        if(this.isObject(o)) {
            var activeId = o.__fork || o.__id;
            indexArr[activeId] = i;
            reverseIndex[i] = activeId;
            if(_added[activeId]) { 
                sourceArray.push( activeId );
                // res.cmds.push("insert "+activeId);
                res.cmds.push([7, i, activeId, 0, _parents[activeId]]);
            }
            targetArray.push( activeId );
        }
    }
    
    var list = [], i=0;
    sourceArray.forEach( function(id) {
        list.push( indexArr[id] );
        sourceReverseIndex[id] = i;
        i++;
    });
    
    res.restackIndex = indexArr;
    res.restackList = list;
    res.reverseIndex = reverseIndex;
    res.restack = this.restackOps( list );
    
    
    // insert
    // [7, 0, <insertedID>, 0, <parentId>]
        
    // remove
    // [8, 0, <insertedID>, 0, <parentId>]
    
    // move
    // [12, <insertedID>, <index>, 0, <parentId>]       
    
    var cmdList = [],
        sourceArrayWork = sourceArray.slice();
    
    res.restack.forEach( function(c) {
        if(c[0]=="a") {
            var moveItemId = reverseIndex[c[1]],
                aboveItemId = reverseIndex[c[2]],
                atIndex = indexArr[aboveItemId],
                fromIndex = sourceArrayWork.indexOf(moveItemId);
            
            sourceArrayWork.splice(fromIndex, 1);
            var toIndex = sourceArrayWork.indexOf(aboveItemId);
            sourceArrayWork.splice(toIndex,0,moveItemId);
            
            var obj = _all[moveItemId];
            
            res.cmds.push([12, moveItemId, toIndex, fromIndex, _parents[moveItemId]]);
//             cmdList.push(" move item "+moveItemId+" above "+aboveItemId+ " from "+fromIndex+ " to "+toIndex);
            
            
        } else {
            var moveItemId = reverseIndex[c[1]],
                aboveItemId = reverseIndex[c[2]],
                atIndex = indexArr[aboveItemId],
                fromIndex = sourceArrayWork.indexOf(moveItemId);
            sourceArrayWork.splice(fromIndex, 1);
            var toIndex = sourceArrayWork.indexOf(aboveItemId)+1;
            sourceArrayWork.splice(toIndex,0,moveItemId);
            // cmdList.push(" move item "+moveItemId+" above "+aboveItemId+ " from "+fromIndex+ " to "+toIndex);  
            res.cmds.push([12, moveItemId, toIndex, fromIndex, _parents[moveItemId]]);
        }
    });
    res.stackCmds = cmdList;
    res.sourceArrayWork = sourceArrayWork;
    
    
    res.sourcesAndTargets.push([sourceArray, targetArray]);
        
}    


return res;
```

### <a name="diffEngine_restackOps"></a>diffEngine::restackOps(input)


```javascript
var moveCnt=0,
    cmds = [];
    
function restack(input) {
    var data = input.slice(0);
    var dataIn = input.slice(0);
    var goalIn = input.slice(0).sort(function(a, b) { return a - b; });

    var mapper = {};
    var indexes = {};
    // Testing this kind of simple system...
    for(var i=0; i<dataIn.length;i++) {
        var mm = goalIn.indexOf(dataIn[i]);
        mapper[dataIn[i]] = mm;
        indexes[mm] = dataIn[i];
        data[i] = mm;
    }
    
    var goal = data.slice(0).sort(function(a, b) { return a - b; });

    var minValue = data[0],
        maxValue = data[0],
        partDiffs=[],
        partCum = 0,
        avgDiff = function() {
            var i=0, len=data.length, df=0;
            for(;i<len;i++) {
                var v = data[i];
                if(v>maxValue) maxValue=v;
                if(v<minValue) minValue=v;
                if(i>0) partDiffs.push(goal[i]-goal[i-1]);
                if(i>0) partCum += Math.abs(goal[i]-goal[i-1]);
                df+=Math.abs(v-goal[i]);
            }
            partCum = partCum / len;
            return df / len;
        }();
    
    partDiffs.sort(function(a, b) { return a - b; }); 
    var    minDelta = partDiffs[0];
    
    // collects one "acceptable" array 
    var    accept = function(fn) {
	            var collect = function(i,sx, last) {
                    var res = [];
                    var len=data.length;
                    if(!sx) sx=0;
                    for(;i<len;i++) {                    
                        var v = data[i];
                        if((v-last)==1) {
                            res.push(v);
                            last = v;
                            continue;
                        }
                        var gi=i+sx;
                        if(gi<0) gi=0;
                        if(gi>=len) gi=len-1;
                        if(fn(v, goal[gi], v, last,i,len)) {                            
                            if( (data[i+1] && data[i+1]<v && data[i+1]>last ) ){
                               // skip, if next should be taken instead 
                            } else {
	                            res.push(v);
                                last = v;
                            }                            
                        }
                    }
                    return res;
                }
                
                var m=[];
            	var ii=0,a=0;
        		// small tricks to improve the algo, just for comp's sake...
            	while(a<0.1) {
                    for(var sx=-5;sx<=5;sx++)
                    	m.push(collect(Math.floor(data.length*a),sx, minValue-1));
                    a+=0.05;
                }
	            m.sort(function(a,b) { return b.length - a.length; } );
                return m[0];
            };
    
    // different search agents...
    var test = [
                accept( function(dv,gv,v,last,i,len) {
                    // console.log(Math.abs(v-last)+" vs "+partCum);
                    if(v<last) return false;
                    if(i>0) if(Math.abs(v-last) > partDiffs[i-1]) return false;
                    if(Math.abs(v-last)>avgDiff) return false;
                    if(Math.abs(dv-gv)<=avgDiff*(i/len) && v>=last) return true;
                    if(Math.abs(last-v)<=avgDiff*(i/len) && v>=last) return true;
                    return false;
                }),   
		        accept( function(dv,gv,v,last,i,len) {
                    if(v<last) return false;
                    if(Math.abs(v-last)>avgDiff) return false;
                    if(Math.abs(dv-gv)<=avgDiff*(i/len) && v>=last) return true;
                    if(Math.abs(last-v)<=avgDiff*(i/len) && v>=last) return true;
                    return false;
                }),
        		accept( function(dv,gv,v,last,i,len) {
                    if(v<last) return false;
                    if(Math.abs(v-last)>avgDiff) return false;
                    if(Math.abs(dv-gv)<=avgDiff*(i/len) && v>=last) return true;
                    if(Math.abs(last-v)<=avgDiff*(i/len) && v>=last) return true;
                    return false;
                }),
                accept( function(dv,gv,v,last,i,len) {
                    if(v<last) return false;
                    if(Math.abs(dv-gv)<=avgDiff*(i/len) && v>=last) return true;
                    if(Math.abs(last-v)<=avgDiff*(i/len) && v>=last) return true;
                    return false;
                }),
                accept( function(dv,gv,v,last,i,len) {
                    if(v<last) return false;
                    if(Math.abs(dv-gv)<=avgDiff && v>=last) return true;
                    if(Math.abs(last-v)<=avgDiff*(i/len) && v>=last) return true;
                    return false;
                }), 
        		accept( function(dv,gv,v,last,i,len) {
                    if(v<last) return false;
                    if(Math.abs(v-last)<partCum) return true;
                    if(Math.abs(dv-gv)<=partCum && v>=last) return true;
                    return false;
                }),
        		accept( function(dv,gv,v,last,i,len) {
                    if(v>last) return true;
                    return false;
                }),
				accept( function(dv,gv,v,last,i,len) {
                    if(v<last) return false;
                    if(Math.abs(v-last)>avgDiff) return false;
                    if(Math.abs(dv-gv)<=avgDiff && v>=last) return true;
                    return false;
                }),
                accept( function(dv,gv,v,last,i,len) {
                    if(v<last) return false;
                    if(i>0) if(Math.abs(v-last)>avgDiff) return false;
                    if(Math.abs(dv-gv)<=avgDiff*(i/len) && v>=last) return true;
                    if(i>0) if(Math.abs(last-v)<=avgDiff*(i/len) && v>=last) return true;
                    return false;
                }),                 
                accept( function(dv,gv,v,last,i,len) {
                    if(v<last) return false;
                    if(last>=minValue) {
                        if(v>=last) return true;
                    } else {
                        if(v==minValue) return true;
                    }            
                    return false;
                })      
                ];

        
    // choose between algorithms
    var okVals = [], maxSet=0;
    for(var i=0; i<test.length;i++) {
        var set = test[i];
        if(set.length>maxSet) {
            okVals = set;
            maxSet = set.length;
        }
    }
    // if nothing, take something
    if(okVals.length==0) okVals=[ goal[ Math.floor(goal.length/2) ] ];
    
    // divide the list to big and small
    var big=[],small=[];
    var divide = function() {
        var min = minValue,
            max = okVals[0],
            okLen = okVals.length,
            oki = data.indexOf(max),
            index=0;
        
        var i=0, len=data.length;
        for(;i<len;i++) {
            var v = data[i];
            if(v>=min && v<=max && ( i<=oki) ) {
               	big.push(v);
               	min = v;
            } else {
               	small.push(v);
            }
            if(v==max) {
                min = v;
                if(index<okLen-1) {
                    index++;
                    max = okVals[index];
                    oki = data.indexOf(max);
                } else {
                    max = maxValue;
                    oki = len+1;
                }
            }
        }
             
    }();
    
    // sort the small list before joining them
    small.sort(function(a, b) { return a - b; });
    
    //console.log(big);
    //console.log(small);
    
    var joinThem = function() {
        var si=0,
            bi=0,
            lastb = big[0],
            slen = small.length;
        while(si<slen) {
            var b=big[bi],s=small[si];
            if(typeof(b)=="undefined") {
                while(si<slen) {
                    cmds.push(["b", indexes[s], indexes[lastb]]);
                    // restackXBelowY(dataIn, indexes[s], indexes[lastb]);
                    lastb = s;
                    si++;
                    s=small[si]
                }
                return;
            }
            if(b<s) {
                // console.log("B was smaller");
                lastb = b;
                bi++;
            } else{
                cmds.push(["a", indexes[s], indexes[b]]);
                // restackXAboveY(dataIn, indexes[s], indexes[b]);
                si++;
            }
        }
    }();
    
    // console.log(dataIn);
    return data; // actually the return value is not used for anything    
   
}
restack(input);

return cmds;

```



   
    
## trait _dataTrait

The class has following internal singleton variables:
        
* _eventOn
        
* _commands
        
        
### <a name="_dataTrait_guid"></a>_dataTrait::guid(t)


```javascript

return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
        
//return Math.random();
// return Math.random().toString(36);
        
/*    
return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
*/
/*        
function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
               .toString(16)
               .substring(1);
  }

return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
       s4() + '-' + s4() + s4() + s4();*/
```

### <a name="_dataTrait_isArray"></a>_dataTrait::isArray(t)


```javascript

if(typeof(t)=="undefined") return this.__isA;

return Object.prototype.toString.call( t ) === '[object Array]';
```

### <a name="_dataTrait_isFunction"></a>_dataTrait::isFunction(fn)


```javascript
return Object.prototype.toString.call(fn) == '[object Function]';
```

### <a name="_dataTrait_isObject"></a>_dataTrait::isObject(t)


```javascript

if(typeof(t)=="undefined") return this.__isO;

return t === Object(t);
```


    
    


   
      
    



      
    
      
            
# Class _channelData


The class has following internal singleton variables:
        
* _instanceCache
        
* _workerCmds
        
        
### <a name="_channelData__addToCache"></a>_channelData::_addToCache(data)


```javascript

if(data && data.__id) {
    this._objectHash[data.__id] = data;
}
```

### <a name="_channelData__classFactory"></a>_channelData::_classFactory(id)


```javascript

if(!_instanceCache) _instanceCache = {};

if(_instanceCache[id]) return _instanceCache[id];

_instanceCache[id] = this;
```

### <a name="_channelData__cmd"></a>_channelData::_cmd(cmd, UUID1, UUID2)

In the future can be used to initiate events, if required.
```javascript

var cmdIndex = cmd[0],
    UUID = cmd[4];
    
this._wCmd( cmdIndex, UUID, cmd );

if(UUID2 && UUID2 != UUID) this._wCmd( cmdIndex, UUID2, cmd );

```

### <a name="_channelData__createModelCommands"></a>_channelData::_createModelCommands(obj, parentObj, intoList)


```javascript

/*
    _cmdIndex = {}; 
    _cmdIndex["createObject"] = 1;
    _cmdIndex["createArray"]  = 2;
    _cmdIndex["initProp"]  = 3;
    _cmdIndex["set"]  = 4;
    _cmdIndex["setMember"]  = 5;
    _cmdIndex["push"]  = 6;
    _cmdIndex["pushObj"]  = 7;
    _cmdIndex["removeItem"]  = 8;
    
    // reserved 9 for optimizations
    _cmdIndex["last"]  = 9;
    
    _cmdIndex["removeProperty"]  = 10;
    _cmdIndex["insertObjectAt"]  = 11;
    _cmdIndex["moveToIndex"]  = 12;
*/

if(!intoList) intoList = [];

var data;

if(obj.data && obj.__id ) {
    data = obj.data;
} else {
    data = obj;
}

if(this.isObject(data) || this.isArray(data)) {
    
    var newObj;
    
    if(obj.__id) {
        newObj = obj;
    } else {
        newObj = {
            data : data,
            __id : this.guid()
        }
    }
    
    if(this.isArray(data)) {
        var cmd = [2, newObj.__id, [], null, newObj.__id];
    } else {
        var cmd = [1, newObj.__id, {}, null, newObj.__id];
    }
    if(parentObj) {
        newObj.__p = parentObj.__id;
        // this._moveCmdListToParent( newObj );
    }
    intoList.push( cmd );

    // Then, check for the member variables...
    for(var n in data) {
        if(data.hasOwnProperty(n)) {
            var value = data[n];
            if(this.isObject(value) || this.isArray(value)) {
                // Then create a new...
                var oo = this._createModelCommands( value, newObj, intoList );
                var cmd = [5, n, oo.__id, null, newObj.__id];
                intoList.push( cmd );
            } else {
                var cmd = [4, n, value, null, newObj.__id];
                intoList.push( cmd );
            }
        }
    }
    
    return newObj;
} else {
    
}



/*
var newObj = {
    data : data,
    __id : this.guid()
}
*/
```

### <a name="_channelData__createNewModel"></a>_channelData::_createNewModel(data, parentObj)


```javascript

/*
    _cmdIndex = {}; 
    _cmdIndex["createObject"] = 1;
    _cmdIndex["createArray"]  = 2;
    _cmdIndex["initProp"]  = 3;
    _cmdIndex["set"]  = 4;
    _cmdIndex["setMember"]  = 5;
    _cmdIndex["push"]  = 6;
    _cmdIndex["pushObj"]  = 7;
    _cmdIndex["removeItem"]  = 8;
    
    // reserved 9 for optimizations
    _cmdIndex["last"]  = 9;
    
    _cmdIndex["removeProperty"]  = 10;
    _cmdIndex["insertObjectAt"]  = 11;
    _cmdIndex["moveToIndex"]  = 12;
*/

if(this.isObject(data) || this.isArray(data)) {
    
    var newObj = {
        data : data,
        __id : this.guid()
    }
    
    this._objectHash[newObj.__id] = newObj;
    
    if(this.isArray(data)) {
        var cmd = [2, newObj.__id, [], null, newObj.__id];
    } else {
        var cmd = [1, newObj.__id, {}, null, newObj.__id];
    }

    if(parentObj) {
        newObj.__p = parentObj.__id;
        // this._moveCmdListToParent( newObj );
    }
    this.writeCommand(cmd, newObj);
    
    // Then, check for the member variables...
    for(var n in data) {
        if(data.hasOwnProperty(n)) {
            var value = data[n];
            if(this.isObject(value) || this.isArray(value)) {
                // Then create a new...
                var oo = this._createNewModel( value, newObj );
                newObj.data[n] = oo;
                var cmd = [5, n, oo.__id, null, newObj.__id];
                this.writeCommand(cmd, newObj);
                this._moveCmdListToParent( oo );
            } else {
                var cmd = [4, n, value, null, newObj.__id];
                this.writeCommand(cmd, newObj);
            }
        }
    }
    
    return newObj;
    
} else {
    
}


/*
var newObj = {
    data : data,
    __id : this.guid()
}
*/
```

### <a name="_channelData__find"></a>_channelData::_find(id)


```javascript
return this._objectHash[id];
```

### <a name="_channelData__findObjects"></a>_channelData::_findObjects(data, parentId, whenReady)


```javascript

if(!data) return null;

if(!this.isObject(data)) return data;

data = this._wrapData( data );
if(data.__id) {
    this._objectHash[data.__id] = data;
}

var me = this;
if(parentId) {
    data.__p = parentId;
}
if(data.data) {
    var sub = data.data;
    for(var n in sub) {
        if(sub.hasOwnProperty(n)) {
            var p = sub[n];
            if(this.isObject(p)) {
                var newData = this._findObjects(p, data.__id);
                if(newData !== p ) {
                    data.data[n] = newData;
                }
            }
        }
    }
}
return data;
```

### <a name="_channelData__getObjectHash"></a>_channelData::_getObjectHash(t)


```javascript
return this._objectHash;
```

### <a name="_channelData__prepareData"></a>_channelData::_prepareData(data)


```javascript
var d = this._wrapData( data );
if(!this._objectHash[d.__id]) {
    d = this._findObjects( d );
}
return d;
```

### <a name="_channelData__wCmd"></a>_channelData::_wCmd(cmdIndex, UUID, cmd)


```javascript

if(!this._workers[cmdIndex]) return;
if(!this._workers[cmdIndex][UUID]) return;
    
var workers = this._workers[cmdIndex][UUID];
var me = this;

var propFilter = cmd[1];
var allProps = workers["*"],
    thisProp = workers[propFilter];

if(allProps) {
    allProps.forEach( function(w) {
        var id = w[0],
            options = w[1];
        var worker = _workerCmds[id];
        if(worker) {
            worker( cmd, options );
        }
    });
}
if(thisProp) {
    thisProp.forEach( function(w) {
        var id = w[0],
            options = w[1];
        var worker = _workerCmds[id];
        if(worker) {
            worker( cmd, options );
        }
    });
}

```

### <a name="_channelData__wrapData"></a>_channelData::_wrapData(data, parent)


```javascript

// if instance of this object...
if(data && data._wrapData) {
    // we can use the same pointer to this data
    return data._data;
}

// if the data is "well formed"
if(data.__id && data.data) return data;

// if new data, then we must create a new object and return it

var newObj = this._createNewModel( data );
/*
var newObj = {
    data : data,
    __id : this.guid()
}
*/
return newObj;
```

### <a name="_channelData_createWorker"></a>_channelData::createWorker(workerID, cmdFilter, workerOptions)


```javascript

// cmdFilter could be something like this:
// [ 4, 'x', null, null, 'GUID' ]
// [ 8, null, null, null, 'GUID' ]

var cmdIndex = cmdFilter[0],
    UUID = cmdFilter[4];

if(!this._workers[cmdIndex]) {
    this._workers[cmdIndex] = {};
}

if(!this._workers[cmdIndex][UUID]) 
    this._workers[cmdIndex][UUID] = {};

var workers = this._workers[cmdIndex][UUID];

var propFilter = cmdFilter[1];
if(!propFilter) propFilter = "*";

if(!workers[propFilter]) workers[propFilter] = [];

workers[propFilter].push( [workerID, workerOptions ] );




// The original worker implementation was something like this:

// The worker has 
// 1. the Data item ID
// 2. property name
// 3. the worker function
// 4. the view information
// 5. extra params ( 4. and 5. could be simplified to options)

/*
   var w = _dataLink._createWorker( 
        dataItem.__id, 
        vName, 
        _workers().fetch(9), 
        subTplDOM, {
           modelid : dataItem.__id,
           compiler : me,
           view : myView
       });
*/
```

### <a name="_channelData_getData"></a>_channelData::getData(t)


```javascript
return this._data;
```

### <a name="_channelData_indexOf"></a>_channelData::indexOf(item)


```javascript

if(!item) item = this._data;

if(!this.isObject(item)) {
    item = this._find( item );
}
if(!item) return;

var parent = this._find( item.__p);

if(!parent) return;
if(!this.isArray( parent.data)) return;

return parent.data.indexOf( item );

```

### _channelData::constructor( channelId, mainData, journalCmds )

```javascript

// if no mainData defined, exit immediately
if(!mainData) return;
/*
The format of the main data is as follows : 
{
    data : {
        key : value,
        subObject : {
            data : {}
            __id : "subGuid"
        }
    },
    __id : "someGuid"
}
*/
if(!this._objectHash) {
    this._objectHash = {};
}

var me = this;
this._channelId = channelId;
this._data = mainData;
if(!this._data.__orphan) {
    this._data.__orphan = [];
}
this._workers = {};
this._journal = journalCmds || [];
this._journalPointer = this._journal.length;

var newData = this._findObjects(mainData);
if(newData != mainData ) this._data = newData;

// Then, the journal commands should be run on the object

if(journalCmds && this.isArray(journalCmds)) {
    journalCmds.forEach( function(c) {
        me.execCmd( c, true );
    });
}


```
        
### <a name="_channelData_setWorkerCommands"></a>_channelData::setWorkerCommands(cmdObject)

Notice that all channels are using the same commands.
```javascript

if(!_workerCmds) _workerCmds = {};


for(var i in cmdObject) {
    if(cmdObject.hasOwnProperty(i)) {
        _workerCmds[i] = cmdObject[i];
    }
}
// _workerCmds



```

### <a name="_channelData_toPlainData"></a>_channelData::toPlainData(obj)


```javascript

if(typeof( obj ) == "undefined" ) obj = this._data;

if(!this.isObject(obj)) return obj;

var plain;


if(this.isArray(obj.data)) {
    plain = [];
    var len = obj.data.length;
    for(var i=0; i<len; i++) {
        plain[i] = this.toPlainData( obj.data[i] );
    }
} else {
    plain = {};
    for( var n in obj.data) {
        if(obj.data.hasOwnProperty(n)) {
            plain[n] = this.toPlainData(obj.data[n]);
        }
    }
}

return plain;
```

### <a name="_channelData_writeCommand"></a>_channelData::writeCommand(a)


```javascript
if(!this._cmdBuffer) this._cmdBuffer = [];
this._cmdBuffer.push(a);

```



   
    
## trait _dataTrait

The class has following internal singleton variables:
        
        
### <a name="_dataTrait_guid"></a>_dataTrait::guid(t)


```javascript
return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);

```

### <a name="_dataTrait_isArray"></a>_dataTrait::isArray(t)


```javascript
return t instanceof Array;
```

### <a name="_dataTrait_isFunction"></a>_dataTrait::isFunction(fn)


```javascript
return Object.prototype.toString.call(fn) == '[object Function]';
```

### <a name="_dataTrait_isObject"></a>_dataTrait::isObject(t)


```javascript
return t === Object(t);
```


    
    
    
## trait commad_trait

The class has following internal singleton variables:
        
* _listeners
        
* _execInfo
        
* _doingRemote
        
* _cmds
        
* _reverseCmds
        
        
### <a name="commad_trait__cmd_aceCmd"></a>commad_trait::_cmd_aceCmd(a, isRemote)


```javascript
var obj = this._find( a[4] ),
    prop = a[1];
    
if(!obj || !prop) return false;
if(typeof( obj.data[prop] )  != "string" ) return false;

var conv = aceCmdConvert();
obj.data[prop] = conv.runToString( obj.data[prop], a[2]);

_doingRemote = isRemote;

var tmpCmd = [4, prop, obj.data[prop], null, a[4] ];
this._cmd(tmpCmd, obj, null);      

if(!isRemote) {
    this.writeCommand(a); 
} else {
    this._cmd(a, obj, null);
}
_doingRemote = false;
this._fireListener(obj, prop);

return true;

```

### <a name="commad_trait__cmd_createArray"></a>commad_trait::_cmd_createArray(a, isRemote)


```javascript
var objId = a[1];
if(!objId) return {
    error : 21,
    cmd   : a,
    text  : "Object ID was null or undefined"
};

var hash = this._getObjectHash();
if(hash[objId]) return {
    error : 22,
    cmd   : a,
    text  : "Object with same ID ("+objId+") was alredy created"
};

var newObj = { data : [], __id : objId };
hash[newObj.__id] = newObj;

// it is orphan object...
this._data.__orphan.push(newObj);

if(!(isRemote)) {
    this.writeCommand(a, newObj);
} 
return true;
```

### <a name="commad_trait__cmd_createObject"></a>commad_trait::_cmd_createObject(a, isRemote)


```javascript

var objId = a[1];

if(!objId) return {
    error : 11,
    cmd   : a,
    text  : "Object ID was null or undefined"
};

var hash = this._getObjectHash();

if(hash[objId]) return {
    error : 12,
    cmd   : a,
    text  : "Object with same ID ("+objId+") was alredy created"
};

var newObj = { data : {}, __id : objId };
hash[newObj.__id] = newObj;

// it is orphan object...
this._data.__orphan.push(newObj);

// --- adding to the data object...

if(!(isRemote)) {
    this.writeCommand(a, newObj);
} 
return true;
```

### <a name="commad_trait__cmd_moveToIndex"></a>commad_trait::_cmd_moveToIndex(a, isRemote)


```javascript
var obj = this._find( a[4] ),
    prop = "*",
    len = obj.data.length,
    targetObj,
    i = 0;

if(!obj) return {
    error : 2,
    cmd   : 1,
    text  : "Object with ID ("+a[4]+") did not exist"
};

var oldIndex = null;

for(i=0; i< len; i++) {
    var m = obj.data[i];
    if(m.__id == a[1]) {
        targetObj = m;
        oldIndex = i;
        break;
    }
}

if( oldIndex != a[3] ) {
    return {
        error : 121,
        cmd   : a,
        text  : "The old index was not what expected: "+oldIndex+" cmd have "+a[3]
    };
}

if( !targetObj  ) {
    return {
        error : 122,
        cmd   : a,
        text  : "Object to be moved ("+a[1]+") was not in the array"
    };
}



// Questions here:
// - should we move command list only on the parent object, not the child
//  =>  this._moveCmdListToParent(targetObj); could be
//      this._moveCmdListToParent(obj);
// That is... where the command is really saved???
// is the command actually written anywhere???
//  - where is the writeCommand?
// 
// Moving the object in the array

var targetIndex = parseInt(a[2]);
if(isNaN(targetIndex)) return {
        error : 123,
        cmd   : a,
        text  : "Target index ("+targetIndex+") was not a number"
    };

if(obj.data.length <= i || (i < 0)) return {
        error : 124,
        cmd   : a,
        text  : "Invalid original index ("+i+") given"
    };

_execInfo.fromIndex = i;

obj.data.splice(i, 1);
obj.data.splice(targetIndex, 0, targetObj);
this._cmd(a, null, a[1]);

if(!(isRemote)) {
    this.writeCommand(a);
}           
return true;


```

### <a name="commad_trait__cmd_pushToArray"></a>commad_trait::_cmd_pushToArray(a, isRemote)


```javascript

var parentObj = this._find( a[4] ),
    insertedObj = this._find( a[2] ),
    toIndex = parseInt( a[1] ),
    oldPos  = a[3],  // old position can also be "null"
    prop = "*",
    index = parentObj.data.length; // might check if valid...


if(!parentObj) return {
        error : 71,
        cmd   : a,
        text  : "Did not find object with ID ("+a[4]+") "
    };

if(!insertedObj) return {
        error : 72,
        cmd   : a,
        text  : "Did not find object with ID ("+a[2]+") "
    };

// NOTE: deny inserting object which already has been inserted
if(insertedObj.__p) return {
        error : 73,
        cmd   : a,
        text  : "The object already had a parent - need to remove first ("+a[2]+") "
    };
    
if(isNaN(toIndex)) return {
        error : 74,
        cmd   : a,
        text  : "toIndex was not a number"
    };
if(!this.isArray( parentObj.data )) return {
        error : 75,
        cmd   : a,
        text  : "Target Object was not an array"
    };
if( toIndex > parentObj.data.length || toIndex < 0) return {
        error : 76,
        cmd   : a,
        text  : "toIndex out of range"
    };

parentObj.data.splice( toIndex, 0, insertedObj );

insertedObj.__p = parentObj.__id;

this._cmd(a, null, a[2]);

// remove from orphans
var ii = this._data.__orphan.indexOf(insertedObj);
if(ii>=0) {
    this._data.__orphan.splice(ii,1);
}
// this._moveCmdListToParent(insertedObj);

// Saving the write to root document
if(!isRemote) {
    this.writeCommand(a);
}  

return true;
```

### <a name="commad_trait__cmd_removeObject"></a>commad_trait::_cmd_removeObject(a, isRemote)


```javascript

var parentObj = this._find( a[4] ),
    removedItem = this._find( a[2] ),
    oldPosition = parseInt( a[1] ),
    prop = "*";
    

if(!parentObj) return {
        error : 81,
        cmd   : a,
        text  : "Did not find object with ID ("+a[4]+") "
    };

if(!removedItem) return {
        error : 82,
        cmd   : a,
        text  : "Did not find object with ID ("+a[2]+") "
    };

// NOTE: deny inserting object which already has been inserted
if(!removedItem.__p) return {
        error : 83,
        cmd   : a,
        text  : "The removed item did not have a parent ("+a[2]+") "
    };

var index = parentObj.data.indexOf( removedItem ); // might check if valid...
if(isNaN(oldPosition)) return {
        error : 84,
        cmd   : a,
        text  : "oldPosition was not a number"
    };
if( oldPosition  != index ) return {
        error : 85,
        cmd   : a,
        text  : "oldPosition was not same as current position"
    };

// now the object is in the array...
parentObj.data.splice( index, 1 );

// removed at should not be necessary because journal has the data
// removedItem.__removedAt = index;

this._cmd(a, null, a[2]);

removedItem.__p = null; // must be set to null...

// remove from orphans
var ii = this._data.__orphan.indexOf(removedItem);
if(ii < 0) {
    this._data.__orphan.push( removedItem );
}


// Saving the write to root document
if(!isRemote) {
    this.writeCommand(a);
}        

return true;

```

### <a name="commad_trait__cmd_setMeta"></a>commad_trait::_cmd_setMeta(a, isRemote)


```javascript
var obj = this._find( a[4] ),
    prop = a[1];

if(!prop) return false;

if(prop == "data") return false;
if(prop == "__id") return false;

if(obj) {
    
    if( obj[prop] == a[2] ) return false;

    obj[prop] = a[2]; // value is now set...
    this._cmd(a, obj, null);
    
    // Saving the write to root document
    if(!isRemote) {
        this.writeCommand(a);
    } 
    return true;
} else {
    return false;
}
```

### <a name="commad_trait__cmd_setProperty"></a>commad_trait::_cmd_setProperty(a, isRemote)


```javascript
var obj = this._find( a[4] ),
    prop = a[1];
    
if(!obj) return {
        error : 41,
        cmd   : a,
        text  : "Did not find object with ID ("+a[4]+") "
    };

if(!prop) return {
        error : 42,
        cmd   : a,
        text  : "The property was not defined ("+a[1]+") "
    };

var oldValue = obj.data[prop];

if( oldValue == a[2] ) return {
        error : 43,
        cmd   : a,
        text  : "Trying to set the same value to the object twice"
    };

if(typeof( oldValue ) != "undefined") {
    if( oldValue != a[3] ) return {
        error : 44,
        cmd   : a,
        text  : "The old value "+oldValue+" was not the same as the commands old value"
    };

} else {
    if( this.isObject(oldValue) || this.isArray(oldValue) ) return {
        error : 45,
        cmd   : a,
        text  : "Trying to set Object or Array value to a scalar property"
    };
}

obj.data[prop] = a[2]; // value is now set...
this._cmd(a, obj, null);

// Saving the write to root document
if(!isRemote) {
    this.writeCommand(a);
} 
this._fireListener(obj, prop);

return true;

```

### <a name="commad_trait__cmd_setPropertyObject"></a>commad_trait::_cmd_setPropertyObject(a, isRemote)


```javascript
var obj = this._find( a[4] ),
    prop = a[1],
    setObj = this._find( a[2] );

if(!obj) return {
        error : 51,
        cmd   : a,
        text  : "Did not find object with ID ("+a[4]+") "
    };

if(!prop) return {
        error : 52,
        cmd   : a,
        text  : "The property was not defined ("+a[1]+") "
    };
    
// if(!obj || !prop)   return false;
// if(!setObj)         return false; 

if(!setObj) return {
        error : 53,
        cmd   : a,
        text  : "Could not find the Object to be set with ID ("+a[2]+") "
    };
    

if(typeof( obj.data[prop]) != "undefined" )  return {
        error : 54,
        cmd   : a,
        text  : "The property ("+a[1]+") was already set, try unsetting first "
    };

obj.data[prop] = setObj; // value is now set...
setObj.__p = obj.__id; // The parent relationship

this._cmd(a, null, a[2]);

var ii = this._data.__orphan.indexOf(setObj);
if(ii>=0) {
    this._data.__orphan.splice(ii,1);
}



if(!isRemote) {
    this._moveCmdListToParent(setObj);
    this.writeCommand(a);
} 
return true;
```

### <a name="commad_trait__cmd_unsetProperty"></a>commad_trait::_cmd_unsetProperty(a, isRemote)


```javascript
var obj = this._find( a[4] ),
    prop = a[1];
    
if(!obj) return {
        error : 101,
        cmd   : a,
        text  : "Did not find object with ID ("+a[4]+") "
    };

if(!prop) return {
        error : 102,
        cmd   : a,
        text  : "The property was not defined ("+a[1]+") "
    };

if(this.isArray( obj.data[prop] ) ) return {
        error : 103,
        cmd   : a,
        text  : "The Object data was Array ("+a[4]+") "
    };

delete obj.data[prop];
if(!isRemote) this.writeCommand(a);
         

return true;
       
```

### <a name="commad_trait__fireListener"></a>commad_trait::_fireListener(obj, prop)


```javascript
if(_listeners) {
    var lName = obj.__id+"::"+prop,
        eList = _listeners[lName];
    if(eList) {
        eList.forEach( function(fn) {
            fn( obj, obj.data[prop] );
        })
    }
}
```

### <a name="commad_trait__moveCmdListToParent"></a>commad_trait::_moveCmdListToParent(t)


```javascript

```

### <a name="commad_trait__reverse_aceCmd"></a>commad_trait::_reverse_aceCmd(a)


```javascript


var obj = this._find( a[4] ),
    prop = a[1];

var conv = aceCmdConvert();

var newCmds = conv.reverse( a[2] );

var tmpCmd = [4, prop, obj.data[prop], null, a[4] ];
var tmpCmd2 = [13, prop, newCmds, null, a[4] ];

var s = conv.runToString( obj.data[prop], newCmds );
obj.data[prop] = s;

// TODO: check that these work, may not be good idea to do both
this._cmd(tmpCmd);      
this._cmd(tmpCmd2);

```

### <a name="commad_trait__reverse_createObject"></a>commad_trait::_reverse_createObject(a)


```javascript
var objId =  a[1];
var hash = this._getObjectHash();

var o = hash[objId];

delete hash[objId];

var ii = this._data.__orphan.indexOf(o);

if(ii>=0) {
    this._data.__orphan.splice(ii,1);
}

```

### <a name="commad_trait__reverse_moveToIndex"></a>commad_trait::_reverse_moveToIndex(a)


```javascript
var obj = this._find( a[4] ),
    prop = "*",
    len = obj.data.length,
    targetObj,
    i = 0;

var oldIndex = null;

for(i=0; i< len; i++) {
    var m = obj.data[i];
    if(m.__id == a[1]) {
        targetObj = m;
        oldIndex = i;
        break;
    }
}

if(oldIndex != a[2]) {
    throw "_reverse_moveToIndex with invalid index value";
    return;
}

if(targetObj) {
    
    var targetIndex = parseInt(a[3]);
    
    obj.data.splice(i, 1);
    obj.data.splice(targetIndex, 0, targetObj);
    
    var tmpCmd = a.slice();
    tmpCmd[2] = targetIndex;
    tmpCmd[3] = a[2];
    
    this._cmd(tmpCmd, null, tmpCmd[1]);

}
```

### <a name="commad_trait__reverse_pushToArray"></a>commad_trait::_reverse_pushToArray(a)


```javascript
var parentObj = this._find( a[4] ),
    insertedObj = this._find( a[2] ),
    prop = "*",
    index = parentObj.data.length; 
    
// Moving the object in the array
if( parentObj && insertedObj) {
    
    var shouldBeAt = parentObj.data.length - 1;
    
    var item = parentObj.data[shouldBeAt];
    
    // old parent and old item id perhas should be also defined?
    if(item.__id == a[2]) {
        
        // the command which appears to be run, sent to the data listeners
        var tmpCmd = [ 8, shouldBeAt, item.__id,  null,  parentObj.__id  ];
        
        // too simple still...
        parentObj.data.splice( shouldBeAt, 1 ); 
        
        this._cmd(tmpCmd, null, tmpCmd[2]);
    }

}
```

### <a name="commad_trait__reverse_removeObject"></a>commad_trait::_reverse_removeObject(a)


```javascript

var parentObj = this._find( a[4] ),
    removedItem = this._find( a[2] ),
    oldPosition = a[1],
    prop = "*",
    index = parentObj.data.indexOf( removedItem ); // might check if valid...

// Moving the object in the array
if( parentObj && removedItem) {

    // now the object is in the array...
    parentObj.data.splice( oldPosition, 0, removedItem );
    
    var tmpCmd = [7, oldPosition, a[2], null, a[4]];
    
    this._cmd(tmpCmd, null, a[2]);
    
    // remove from orphans
    var ii = this._data.__orphan.indexOf(removedItem);
    if(ii >= 0) {
        this._data.__orphan.splice(ii,1);
    }    
    
    
    removedItem.__p = a[4];
}
```

### <a name="commad_trait__reverse_setMeta"></a>commad_trait::_reverse_setMeta(a)


```javascript
var obj = this._find( a[4] ),
    prop = a[1];

if(obj) {
    var tmpCmd = [3, prop, a[3], a[2], a[4] ];
    obj[prop] = a[3];  // the old value
    this._cmd(tmpCmd);
}
```

### <a name="commad_trait__reverse_setProperty"></a>commad_trait::_reverse_setProperty(a)


```javascript
var obj = this._find( a[4] ),
    prop = a[1];

if(obj) {
    var tmpCmd = [4, prop, a[3], a[2], a[4] ];
    obj.data[prop] = a[3];  // the old value
    this._cmd(tmpCmd);
}
```

### <a name="commad_trait__reverse_setPropertyObject"></a>commad_trait::_reverse_setPropertyObject(a)


```javascript

var obj = this._find( a[4] ),
    prop = a[1],
    setObj = this._find( a[2] );

if(!obj) return;
if(!setObj) return;        

delete obj.data[prop];   // removes the property object
setObj.__p = null;

var tmpCmd = [ 10, prop, null, null, a[4] ];
this._cmd(tmpCmd);

```

### <a name="commad_trait__reverse_unsetProperty"></a>commad_trait::_reverse_unsetProperty(a)


```javascript
var obj = this._find( a[4] ),
    removedObj = this._find( a[2] ),
    prop = a[1];

if(obj && prop && removedObj) {


    obj.data[prop] = removedObj;
    removedObj.__p = obj.__id; // The parent relationship
    
    var tmpCmd = [5, prop, removedObj.__id, 0, a[4] ];
    this._cmd(tmpCmd, null, removedObj.__id);

}      
```

### <a name="commad_trait_execCmd"></a>commad_trait::execCmd(a, isRemote, isRedo)


```javascript

try {
    if(!this.isArray(a)) return false;
    var c = _cmds[a[0]];
    if(c) {
        var rv =  c.apply(this, [a, isRemote]);
        if((rv===true) && !isRedo) this.writeLocalJournal( a );
        return rv;
    } else {
        return {
            error : 199,
            text  : "Invalid command"
        };
    }
} catch(e) {
    var txt = "";
    if(e && e.message) txt = e.message;
    return {
            error : 199,
            cmd : a,
            text  : "Exception raised " + txt
    };
}
```

### <a name="commad_trait_getJournalCmd"></a>commad_trait::getJournalCmd(i)


```javascript

return this._journal[i];
```

### <a name="commad_trait_getJournalLine"></a>commad_trait::getJournalLine(t)


```javascript
return this._journalPointer;
```

### <a name="commad_trait_getLocalJournal"></a>commad_trait::getLocalJournal(t)


```javascript
return this._journal;
```

### commad_trait::constructor( t )

```javascript
if(!_listeners) {
    _listeners = {};
    _execInfo = {};
}


if(!_cmds) {
    
    _reverseCmds = new Array(30);
    _cmds = new Array(30);
    
    _cmds[1] = this._cmd_createObject;
    _cmds[2] = this._cmd_createArray;
    _cmds[3] = this._cmd_setMeta;
    _cmds[4] = this._cmd_setProperty;
    _cmds[5] = this._cmd_setPropertyObject;
    _cmds[7] = this._cmd_pushToArray;
    _cmds[8] = this._cmd_removeObject;
    _cmds[10] = this._cmd_unsetProperty;
    _cmds[12] = this._cmd_moveToIndex;
    _cmds[13] = this._cmd_aceCmd;
    
    _reverseCmds[1] = this._reverse_createObject;
    _reverseCmds[3] = this._reverse_setMeta;
    _reverseCmds[4] = this._reverse_setProperty;
    _reverseCmds[5] = this._reverse_setPropertyObject;
    _reverseCmds[7] = this._reverse_pushToArray;
    _reverseCmds[8] = this._reverse_removeObject;
    _reverseCmds[10] = this._reverse_unsetProperty;
    _reverseCmds[12] = this._reverse_moveToIndex;
    _reverseCmds[13] = this._reverse_aceCmd;
    // _reverse_setPropertyObject
    
}
```
        
### <a name="commad_trait_redo"></a>commad_trait::redo(n)


```javascript
// if one line in buffer line == 1
var line = this.getJournalLine(); 
n = n || 1;
while( (n--) > 0 ) {
    
    var cmd = this._journal[line];
    if(!cmd) return;
    
    this.execCmd( cmd, false, true );
    line++;
    this._journalPointer++;
}
```

### <a name="commad_trait_reverseCmd"></a>commad_trait::reverseCmd(a)

This function reverses a given command. There may be cases when the command parameters make the command itself non-reversable. It is the responsibility of the framework to make sure all commands remain reversable.
```javascript
console.log("reversing command ", a);
if(!a) {
    console.error("reversing undefined command ");
    return;
}
var c = _reverseCmds[a[0]];
if(c) {
    var rv =  c.apply(this, [a]);
    return rv;
}
```

### <a name="commad_trait_reverseNLines"></a>commad_trait::reverseNLines(n)


```javascript
// if one line in buffer line == 1
var line = this.getJournalLine(); 

while( ( line - 1 )  >= 0 &&  ( (n--) > 0 )) {
    var cmd = this._journal[line-1];
    this.reverseCmd( cmd );
    line--;
    this._journalPointer--;
}
```

### <a name="commad_trait_reverseToLine"></a>commad_trait::reverseToLine(index)

0 = reverse all commands, 1 = reverse to the first line etc.
```javascript
// if one line in buffer line == 1
var line = this.getJournalLine(); 

while( ( line - 1 )  >= 0 &&  line > ( index  ) ) {
    var cmd = this._journal[line-1];
    this.reverseCmd( cmd );
    line--;
    this._journalPointer--;
}
```

### <a name="commad_trait_undo"></a>commad_trait::undo(n)


```javascript

if(n===0) return;
if(typeof(n)=="undefined") n = 1;

this.reverseNLines( n );

```

### <a name="commad_trait_writeLocalJournal"></a>commad_trait::writeLocalJournal(cmd)


```javascript

if(this._journal) {
    // truncate on write if length > journalPointer
    if(this._journal.length > this._journalPointer) {
        this._journal.length = this._journalPointer;
    }
    this._journal.push(cmd);
    this._journalPointer++;
}
```


    
    


   
      
    
      
    



      
    



      
    
      
            
# Class _channels


The class has following internal singleton variables:
        
        
### _channels::constructor( host )

```javascript

```
        


   
    
    
    
    
    
    
    
    
    
    
    
    


   
      
            
# Class later


The class has following internal singleton variables:
        
* _initDone
        
* _callers
        
* _oneTimers
        
* _everies
        
* _framers
        
        
### <a name="later_add"></a>later::add(fn, thisObj, args)


```javascript
if(thisObj || args) {
   var tArgs;
   if( Object.prototype.toString.call( args ) === '[object Array]' ) {
       tArgs = args;
   } else {
       tArgs = Array.prototype.slice.call(arguments, 2);
       if(!tArgs) tArgs = [];
   }
   _callers.push([thisObj, fn, tArgs]);   
} else {
    _callers.push(fn);
}
```

### <a name="later_asap"></a>later::asap(fn)


```javascript
this.add(fn);

```

### <a name="later_every"></a>later::every(seconds, fn, name)


```javascript

if(!name) {
    name = "time"+(new Date()).getTime()+Math.random(10000000);
}

_everies[name] = {
    step : Math.floor(seconds * 1000),
    fn : fn,
    nextTime : 0
};
```

### later::constructor( interval, fn )

```javascript
if(!_initDone) {

   var frame, cancelFrame;
   
   this.polyfill();
 
   if(typeof(window) != "undefined") {
       var frame = window['requestAnimationFrame'], 
           cancelFrame= window['cancelRequestAnimationFrame'];
       ['', 'ms', 'moz', 'webkit', 'o'].forEach( function(x) { 
           if(!frame) {
            frame = window[x+'RequestAnimationFrame'];
            cancelFrame = window[x+'CancelAnimationFrame'] 
                                       || window[x+'CancelRequestAnimationFrame'];
           }
        });
   }
 
    if (!frame)
        frame= function(cb) {
            return setTimeout(cb, 16);
        };
 
    if (!cancelFrame)
        cancelFrame = function(id) {
            clearTimeout(id);
        };    
        
    _callers = [];
    _oneTimers = {};
    _everies = {};
    _framers = [];
    var lastMs = 0;
    
    var _callQueQue = function() {
       var ms = (new Date()).getTime();
       var fn;
       while(fn=_callers.shift()) {
          if(Object.prototype.toString.call( fn ) === '[object Array]' ) {
              fn[1].apply(fn[0], fn[2]);
          } else {
              fn();
          }
           
       }
       
       for(var i=0; i<_framers.length;i++) {
           var fFn = _framers[i];
           fFn();
       }
       
       for(var n in _oneTimers) {
           if(_oneTimers.hasOwnProperty(n)) {
               var v = _oneTimers[n];
               v[0](v[1]);
               delete _oneTimers[n];
           }
       }
       
       for(var n in _everies) {
           if(_everies.hasOwnProperty(n)) {
               var v = _everies[n];
               if(v.nextTime < ms) {
                   v.fn();
                   v.nextTime = ms + v.step;
               }
               if(v.until) {
                   if(v.until < ms) {
                       delete _everies[n];
                   }
               }
           }
       }       
       
       frame(_callQueQue);
       lastMs = ms;
    };
    _callQueQue();
    _initDone = true;
}
```
        
### <a name="later_once"></a>later::once(key, fn, value)


```javascript
// _oneTimers

_oneTimers[key] = [fn,value];
```

### <a name="later_onFrame"></a>later::onFrame(fn)


```javascript

_framers.push(fn);
```

### <a name="later_polyfill"></a>later::polyfill(t)


```javascript
// --- let's not ---
```

### <a name="later_removeFrameFn"></a>later::removeFrameFn(fn)


```javascript

var i = _framers.indexOf(fn);
if(i>=0) {
    if(fn._onRemove) {
        fn._onRemove();
    }
    _framers.splice(i,1);
    return true;
} else {
    return false;
}
```



   


   



      
    
      
            
# Class _promise


The class has following internal singleton variables:
        
        
### <a name="_promise_all"></a>_promise::all(firstArg)


```javascript

var args;
if(this.isArray(firstArg)) {
  args = firstArg;
} else {
  args = Array.prototype.slice.call(arguments, 0);
}
// console.log(args);
var targetLen = args.length,
    rCnt = 0,
    myPromises = [],
    myResults = new Array(targetLen);
    
return this.then(
    function() {
 
        var allPromise = _promise();
        if(args.length==0) {
            allPromise.resolve([]);
        }
        args.forEach( function(b, index) {
            if(b.then) {
                // console.log("All, looking for ", b, " state = ", b._state);
                myPromises.push(b);
                
                b.then(function(v) {
                    myResults[index] = v;
                    rCnt++;
                    if(rCnt==targetLen) {

                        allPromise.resolve(myResults);
                    }
                }, function(v) {
                    allPromise.reject(v);
                });
                
            } else {
                allPromise.reject("Not list of promises");
            }
        })
        
        return allPromise;
        
    });



    

```

### <a name="_promise_collect"></a>_promise::collect(collectFn, promiseList, results)


```javascript

var args;
if(this.isArray(promiseList)) {
  args = promiseList;
} else {
  args = [promiseList];
}

// console.log(args);
var targetLen = args.length,
    isReady = false,
    noMore = false,
    rCnt = 0,
    myPromises = [],
    myResults = results || {};
    
return this.then(
    function() {
 
        var allPromise = _promise();
        args.forEach( function(b, index) {
            if(b.then) {
                // console.log("All, looking for ", b, " state = ", b._state);
                myPromises.push(b);
                
                b.then(function(v) {
                    rCnt++;
                    isReady = collectFn(v, myResults);
                    if( (isReady && !noMore) || (noMore==false && targetLen == rCnt) ) {
                        allPromise.resolve(myResults);
                        noMore = true;
                    }
                }, function(v) {
                    allPromise.reject(v);
                });
                
            } else {
                allPromise.reject("Not list of promises");
            }
        })
        
        return allPromise;
        
    });

```

### <a name="_promise_fail"></a>_promise::fail(fn)


```javascript
return this.then(null, fn);
```

### <a name="_promise_fulfill"></a>_promise::fulfill(withValue)


```javascript
// if(this._fulfilled || this._rejected) return;

if(this._rejected) return;
if(this._fulfilled && withValue != this._stateValue) {
    return;
}

var me = this;
this._fulfilled = true;
this._stateValue = withValue;

var chCnt = this._childPromises.length;

while(chCnt--) {
    var p = this._childPromises.shift();
    if(p._onFulfill) {
        try {
            var x = p._onFulfill(withValue);
            // console.log("Returned ",x);
            if(typeof(x)!="undefined") {
                p.resolve(x);
            } else {
                p.fulfill(withValue);
            }
        } catch(e) {
            // console.error(e);
            /*
                If either onFulfilled or onRejected throws an exception e, promise2 
                must be rejected with e as the reason.            
            */
            p.reject(e);
        }
    } else {
        /*
            If onFulfilled is not a function and promise1 is fulfilled, promise2 must be 
            fulfilled with the same value as promise1        
        */
        p.fulfill(withValue);
    }
};
// this._childPromises.length = 0;
this._state = 1;
this.triggerStateChange();

```

### _promise::constructor( onFulfilled, onRejected )

```javascript
// 0 = pending
// 1 = fullfilled
// 2 = error

this._state = 0;
this._stateValue = null;
this._isAPromise = true;
this._childPromises = [];

if(this.isFunction(onFulfilled))
    this._onFulfill = onFulfilled;
if(this.isFunction(onRejected))
    this._onReject = onRejected;
    
if(!onRejected && this.isFunction(onFulfilled) ) {

    var me = this;
    later().asap(
        function() {
            onFulfilled( function(v) {
                me.resolve(v)
            }, function(v) {
                me.reject(v);
            });           
        });
 
}
```
        
### <a name="_promise_isFulfilled"></a>_promise::isFulfilled(t)


```javascript
return this._state == 1;
```

### <a name="_promise_isPending"></a>_promise::isPending(t)


```javascript
return this._state == 0;
```

### <a name="_promise_isRejected"></a>_promise::isRejected(v)


```javascript
return this._state == 2;
```

### <a name="_promise_onStateChange"></a>_promise::onStateChange(fn)


```javascript

if(!this._listeners)
    this._listeners = [];

this._listeners.push(fn);
```

### <a name="_promise_reject"></a>_promise::reject(withReason)


```javascript

// if(this._rejected || this._fulfilled) return;

// conso

if(this._fulfilled) return;
if(this._rejected && withReason != this._rejectReason) return;


this._state = 2;
this._rejected = true;
this._rejectReason = withReason;
var me = this;

var chCnt = this._childPromises.length;
while(chCnt--) {
    var p = this._childPromises.shift();

    if(p._onReject) {
        try {
            p._onReject(withReason);
            p.reject(withReason);
        } catch(e) {
            /*
                If either onFulfilled or onRejected throws an exception e, promise2 
                must be rejected with e as the reason.            
            */
            p.reject(e);
        }
    } else {
        /*
            If onFulfilled is not a function and promise1 is fulfilled, promise2 must be 
            fulfilled with the same value as promise1        
        */
        p.reject(withReason);
    }
};

// this._childPromises.length = 0;
this.triggerStateChange();

```

### <a name="_promise_rejectReason"></a>_promise::rejectReason(reason)


```javascript
if(reason) {
    this._rejectReason = reason;
    return;
}
return this._rejectReason;
```

### <a name="_promise_resolve"></a>_promise::resolve(x)


```javascript

// console.log("Resolving ", x);

// can not do this many times...
if(this._state>0) return;

if(x==this) {
    // error
    this._rejectReason = "TypeError";
    this.reject(this._rejectReason);
    return;
}

if(this.isObject(x) && x._isAPromise) {
    
    // 
    this._state = x._state;
    this._stateValue = x._stateValue;
    this._rejectReason = x._rejectReason;
    // ... 
    if(this._state===0) {
        var me = this;
        x.onStateChange( function() {
            if(x._state==1) {
                // console.log("State change");
                me.resolve(x.value());
            } 
            if(x._state==2) {
                me.reject(x.rejectReason());                
            }
        });
    }
    if(this._state==1) {
        // console.log("Resolved to be Promise was fulfilled ", x._stateValue);
        this.fulfill(this._stateValue);    
    }
    if(this._state==2) {
        // console.log("Relved to be Promise was rejected ", x._rejectReason);
        this.reject(this._rejectReason);
    }
    return;
}
if(this.isObject(x) && x.then && this.isFunction(x.then)) {
    // console.log("Thenable ", x);
    var didCall = false;
    try {
        // Call the x.then
        var  me = this;
        x.then.call(x, 
            function(y) {
                if(didCall) return;
                // we have now value for the promise...
                // console.log("Got value from Thenable ", y);
                me.resolve(y);
                didCall = true;
            },
            function(r) {
                if(didCall) return;
                // console.log("Got reject from Thenable ", r);
                me.reject(r);
                didCall = true;
            });
    } catch(e) {
        if(!didCall) this.reject(e);
    }
    return;    
}
this._state = 1;
this._stateValue = x;

// fulfill the promise...
this.fulfill(x);

```

### <a name="_promise_state"></a>_promise::state(newState)


```javascript
if(typeof(newState)!="undefined") {
    this._state = newState;
}
return this._state;
```

### <a name="_promise_then"></a>_promise::then(onFulfilled, onRejected)


```javascript

if(!onRejected) onRejected = function() {};

var p = new _promise(onFulfilled, onRejected);
var me = this;

if(this._state==1) {
    later().asap( function() {
        me.fulfill(me.value());
    });
}
if(this._state==2) {
    later().asap( function() {
        me.reject(me.rejectReason());
    });
}
this._childPromises.push(p);
return p;



```

### <a name="_promise_triggerStateChange"></a>_promise::triggerStateChange(t)


```javascript
var me = this;
if(!this._listeners) return;
this._listeners.forEach( function(fn) {
    fn(me); 
});
// one-timer
this._listeners.length = 0;
```

### <a name="_promise_value"></a>_promise::value(v)


```javascript
if(typeof(v)!="undefined") {
    this._stateValue = v;
    return this;
}
return this._stateValue;
```



   
    
## trait util_fns

The class has following internal singleton variables:
        
        
### <a name="util_fns_isArray"></a>util_fns::isArray(someVar)


```javascript
return Object.prototype.toString.call( someVar ) === '[object Array]';
```

### <a name="util_fns_isFunction"></a>util_fns::isFunction(fn)


```javascript
return Object.prototype.toString.call(fn) == '[object Function]';
```

### <a name="util_fns_isObject"></a>util_fns::isObject(obj)


```javascript
return obj === Object(obj);
```


    
    


   
      
    



      
    
      
            
# Class sequenceStepper


The class has following internal singleton variables:
        
* _instances
        
        
### <a name="sequenceStepper__classFactory"></a>sequenceStepper::_classFactory(id, manual)


```javascript

if(id===false && manual) return;

if(!_instances) {
    _instances = {};
}

if(_instances[id]) {
    return _instances[id];
} else {
    _instances[id] = this;
}
```

### <a name="sequenceStepper_addCommands"></a>sequenceStepper::addCommands(cmdFunction, failure)


```javascript

if(this.isArray(cmdFunction)) {
    var me = this;
    cmdFunction.forEach( function(c) {
        me.addCommands( c );
    });
    return this;
}

this._commands.push( { 
                        fnCmd : cmdFunction, 
                        fnFail: failure, 
                        async : true }  );
```

### sequenceStepper::constructor( myId, manual )

```javascript

if(!this._commands) {
    this._commands = [];
    this.waitingList = [];
    this._index = 0;
}

var me = this;
if(!manual) {
    var _secStep = function() {
        me.step();
    }
    later().every(1/30, _secStep);
}

```
        
### <a name="sequenceStepper_step"></a>sequenceStepper::step(t)


```javascript
var i = this._index,
    len = this._commands.length;
    
if(i==len) return;

var first = _promise(),
    currentProm = first,
    myPromise = _promise(),
    me = this;

while(i<len) {
    var fn = this._commands[i];
    (function(fn) {
        currentProm = currentProm.then( function() {
            
            var p = _promise();
            
            // if(fn.async) {

            fn.fnCmd( function(res) {
                p.resolve(true); 
            }, function(failReason) {
                p.resolve(true);
                if(fn.fnFail) fn.fnFail( failReason );
            });                   

            return p; 
        }).fail( function(reason) {
            if(fn.fnFail) fn.fnFail( reason );
        });
    }(fn));
    this._index++;
    i++;
}

currentProm.then( function() {
   me.waitingList.shift(); // remvoe this promise from the queque
   myPromise.resolve(true);
   if(me.waitingList.length) {
       var newP = me.waitingList[0];
       newP.resolve(true);
   } 
}).fail( function(m) {
    
});


this.waitingList.push(first);
if(this.waitingList.length==1) {
    first.resolve(true);
} 
return myPromise;

```



   
    
## trait _dataTrait

The class has following internal singleton variables:
        
        
### <a name="_dataTrait_guid"></a>_dataTrait::guid(t)


```javascript

return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);

```

### <a name="_dataTrait_isArray"></a>_dataTrait::isArray(t)


```javascript
return Object.prototype.toString.call( t ) === '[object Array]';
```

### <a name="_dataTrait_isFunction"></a>_dataTrait::isFunction(fn)


```javascript
return Object.prototype.toString.call(fn) == '[object Function]';
```

### <a name="_dataTrait_isObject"></a>_dataTrait::isObject(t)


```javascript

return t === Object(t);
```


    
    


   
      
    



      
    
      
            
# Class _serverChannelMgr


The class has following internal singleton variables:
        
* _channelIndex
        
* _rootData
        
* _rooms
        
* _socketRooms
        
        
### <a name="_serverChannelMgr_addSocketToCh"></a>_serverChannelMgr::addSocketToCh(chId, socket)


```javascript

if(!this._channelSockets[chId]) {
    this._channelSockets[chId] = [];
}
if(this._channelSockets[chId].indexOf(socket) < 0 ) {
    this._channelSockets[chId].push(socket);
}
```

### <a name="_serverChannelMgr_getSocketsFromCh"></a>_serverChannelMgr::getSocketsFromCh(chId)


```javascript
if(!this._channelSockets[chId]) return [];

return this._channelSockets[chId];
```

### _serverChannelMgr::constructor( serverSocket, fileSystem, authManager )

```javascript

this._server = serverSocket;
this._auth = authManager;

this._channelSockets = {};

var me = this;

// The server which manages the client connections is here..

this._server.on("connect", function( socket ) {

    // keeps track of channels the socket is registered into    
    var _socketChannels = [];
    var ctrl; // the channel controller

    socket.on("requestChannel", function(cData, responseFn) {
        fileSystem.findPath(cData.channelId).then( function(fold) {
            if(fold) {
                
                // require first to authenticate, at least read access to join
                ctrl = _channelController( cData.channelId, fileSystem, me );
                ctrl.then( 
                    function() {
                        if(ctrl._groupACL(socket, "r")) {
                            socket.join(cData.channelId);
                            me.addSocketToCh(  cData.channelId, socket );
                            _socketChannels.push( cData.channelId );
                            responseFn({ success : true, channelId: cData.channelId});
                        } else {
                            responseFn({ success : false, channelId: null});
                        }
                    });
                
            } else {
                responseFn({ success : false, channelId: null});
            }
            
        })
    });
    
    socket.on("disconnect", function() {
        // console.log("--- channel manager got disconnect to the service pool ---- "); 
        // console.log("TODO: remove the channel so that it will not leak memory");
        // me.removeSocketFromCh(  socket );
        _socketChannels.forEach( function(chId) {
            me.removeSocketFromCh(chId, socket );
        });
    });
    
    socket.on("auth", function(cData, responseFn) {

        if(authManager) {
            authManager.login(cData.userId, cData.password).then( function(res) {
                if(res.result === true) {
                    var UID = res.userId;
                    var groups = res.groups;
                    console.log("AUTH groups ", res.groups);
                    socket.setAuthInfo( UID, groups);
                    responseFn( { success : true, userId: socket.getUserId(), groups : res.groups });
                } else {
                    responseFn( { success : false, userId: null });
                }
            })
        } else {
            responseFn( { success : false, userId: null });
        }
        
    });        
  

    // messages to the channel from the socket
    socket.on("channelCommand", function(cmd, responseFn) {

        if(!socket.getUserId()) {
            responseFn( { success : false, reason:"socket is not authenticated." });
            return;            
        }
        
        if(!socket.isInRoom( cmd.channelId) ) {
            responseFn( { success : false, reason:"not in room" });
            return;
        }
        
        // the command for the channel controller...
        ctrl.run( cmd, function(resp) {
            if(responseFn) responseFn( resp );
        }, socket);
        
    });
    
});
```
        
### <a name="_serverChannelMgr_removeSocketFromCh"></a>_serverChannelMgr::removeSocketFromCh(chId, socket)


```javascript
if(!this._channelSockets[chId]) return;

var i=this._channelSockets[chId].indexOf(socket);
if(i >= 0 ) {
    this._channelSockets[chId].splice(i,1);
}
```



   


   



      
    
      
            
# Class _localChannelModel


The class has following internal singleton variables:
        
* _instances
        
        
### <a name="_localChannelModel__classFactory"></a>_localChannelModel::_classFactory(id, fileSystem)


```javascript

if(!_instances) {
    _instances = {};
}

id = id + fileSystem.id();

if(_instances[id]) {
    return _instances[id];
} else {
    _instances[id] = this;
}
```

### <a name="_localChannelModel__createChannelDir"></a>_localChannelModel::_createChannelDir(channelId)

The channel ID should follow a normal path format like path/to/my/channel
```javascript

var str = channelId;
if(str.charAt(0)=="/") str = str.substring(1);

var parts = str.split("/");
var fs = this._fs,
    activeFolder = fs;

var actPromise = _promise();
var originalPromise = actPromise;
var me = this;


parts.forEach( 
    function(pathStr) {
        pathStr = pathStr.trim();
        if(pathStr.length==0) return;

        actPromise = actPromise.then( function() {
                         return activeFolder.isFolder(pathStr);
                    }).then( function(bCreate) {
                        if(!bCreate) {
                            return activeFolder.createDir(pathStr);
                        } else {
                            return true;
                        }
                    }).then( function() {
                        return activeFolder.getFolder(pathStr);         
                    }).then( function(f) {
                        activeFolder =  f;
                    });
    });
    
// after all done, place the active folder for our fs pointer
actPromise = actPromise.then( function() {
   me._folder = activeFolder;
});
originalPromise.resolve(true);

return actPromise;

```

### <a name="_localChannelModel__createChannelSettings"></a>_localChannelModel::_createChannelSettings(t)


```javascript
// The basic settings are like this:
/*
            obj.fromJournalLine = cnt;
            obj.version = 1;
            obj.fromVersion = me._latestVersion;
            obj.from = me._channelId;
            obj.to = forkData.channelId;
            obj.name = forkData.name;
            obj.utc = (new Date()).getTime();
*/

var folder = this._folder;
var me = this;
return _promise( function(result) {
   var bIsNew = false;
   folder.isFile("ch.settings").then( function(is_file) {
       if(!is_file) {
           bIsNew = true;
           return folder.writeFile("ch.settings", JSON.stringify({
               version : 1,
               name : "Initial version",
               utc : (new Date()).getTime(),
               channelId : me._channelId,
               journalLine : 0
           }));
       }
       return true;
   }).then( function() {
      return folder.readFile("ch.settings");
   }).then( function(jsonData) {
       var data = JSON.parse(jsonData);
       me._settings = data;
       result( me._settings );
   });
   
    
});
```

### <a name="_localChannelModel__isFreeToFork"></a>_localChannelModel::_isFreeToFork(channelId)


```javascript
var str = channelId;
if(str.charAt(0)=="/") str = str.substring(1);

var parts = str.split("/");
var fs = this._fs,
    activeFolder = fs;

var actPromise = _promise();
var originalPromise = actPromise;
var me = this,
    isFree = false;

parts.forEach( 
    function(pathStr) {
        
        pathStr = pathStr.trim();
        if(pathStr.length==0) return;
        actPromise = actPromise.then( function() {
                         if(isFree) return isFree;
                         return activeFolder.isFolder(pathStr);
                    }).then( function(isFolder) {
                        if(isFree) return;
                        if(!isFolder) {
                            isFree = true; // the folder path is free...
                            return isFree;
                        } else {
                            return isFree;
                        }
                    }).then( function() {
                        if(isFree) return isFree;
                        // get next level..
                        return activeFolder.getFolder(pathStr);         
                    }).then( function(f) {
                        if(isFree) return isFree;
                        activeFolder =  f;
                    });
    });
    
// after all done, place the active folder for our fs pointer
actPromise = actPromise.then( function() {
   return isFree;
});
originalPromise.resolve(true);

return actPromise;
```

### <a name="_localChannelModel__textLinesToArray"></a>_localChannelModel::_textLinesToArray(str)


```javascript
if(!str || typeof(str) != "string") return [];
var a = str.split("\n");
var res = [];
a.forEach( function(line) {
    if(line.trim().length==0) return;
    res.push( JSON.parse(line) );
})
return res;
```

### <a name="_localChannelModel__writeSettings"></a>_localChannelModel::_writeSettings(t)


```javascript
return this._folder.writeFile("ch.settings", JSON.stringify( this._settings) );
```

### <a name="_localChannelModel_childForkTree"></a>_localChannelModel::childForkTree(t)


```javascript
var local = this._folder, me = this;
return _promise( 
    function(response) {
        me.getForks()
            .then( function(forks) {
                var list = [],
                    results = [];
                if(!forks || forks.length==0) {
                    response([]);
                    return;
                }
                forks.forEach( function(fork) {
                    var forkModel = _localChannelModel( fork.to, me._fs );
                    list.push( forkModel.childForkTree() );
                });
                var prom = _promise();
                prom.all(list).then( function(childTrees) {
                     forks.forEach( function(fork, i) {
                         fork.children = childTrees[i];
                         results.push(fork);
                     });
                     response( results );
                });
                prom.resolve(true);            
            });

    });
```

### <a name="_localChannelModel_fork"></a>_localChannelModel::fork(forkData)
`forkData` Object with { channelId : &quot;path/to/the/challe&quot;,  name:&quot;name&quot;}
 

The forkData is object having properties &quot;channelId&quot; and &quot;name&quot; 
```javascript
var local = this._folder, me = this;
/*
// The basic data is like this
{
   version : 1,
   name : "Initial version",
   utc : (new Date()).getTime(),
   journalLine : 0,
   channelId : "my/channel/fork1/"
}
*/

return _promise( 
    function(response) {

        // ?? should we use the journal line provided by the forkData
        var settings = me._settings;
        
        var fromLine = settings.journalLine || 0;
        if(typeof( forkData.journalLine ) != "undefined" ) {
            fromLine = forkData.journalLine;
        }
        
        
        var obj = {
            fromJournalLine : fromLine,
            version : 1,    // the fork version is always 1 
            channelId : forkData.channelId,
            fromVersion : settings.version,
            from : me._channelId,
            to :  forkData.channelId,
            userId : forkData._userId,
            name : forkData.name,
            utc : (new Date()).getTime()
        };
        console.log("fork called with ");
        console.log(obj);
        
        // got to check first if the channel is free to be forked
        me._isFreeToFork(forkData.channelId).then( function(yesNo) {
            if(yesNo==true) {
                // TODO: check that the forked channel is valid here
                local.appendFile("forks", JSON.stringify(obj)+"\n")
                    .then( function() {
                        var newChann = _localChannelModel( forkData.channelId, me._fs );
                        newChann.then( function() {
                            return newChann.set( obj );
                        }).then( function() {
                            response(obj); 
                        });                
                    });
            } else {
                console.error("Channel already created");
                response({
                    result : false,
                    text : "Channel is already in use"
                }); 
            }
            
        }).fail( function(e) {
                console.error(e);
                response({
                    result : false,
                    text : "Creating the fork failed"
                });             
        })

    });



```

### <a name="_localChannelModel_get"></a>_localChannelModel::get(name)


```javascript
var local = this._db, me = this;
return _promise( 
    function(response) {
        me.then( function() {
            var settings = local.table("settings");
            settings.get(name).then( function(v) {
                response(v.value);   
            });
        })
    });
```

### <a name="_localChannelModel_getCurrentVersion"></a>_localChannelModel::getCurrentVersion(t)


```javascript
var local = this._folder, me = this;
return _promise( function(result) {
    result( me._settings.version );
});
```

### <a name="_localChannelModel_getForks"></a>_localChannelModel::getForks(t)


```javascript
var local = this._folder, me = this;
return _promise( function(result) {

    me.then( function() {
        return local.readFile("forks");
    }).then( function(res) {
        if(res) {
            result( me._textLinesToArray( res) );
        } else {
            result([]);
        }
    }).fail( function() {
        result([]);
    })
});
```

### <a name="_localChannelModel_incrementVersion"></a>_localChannelModel::incrementVersion(t)


```javascript
var local = this._folder, me = this;
return _promise( function(result) {
    me.then(
        function() {
            
            var settings = me._settings;
            
            settings.version++;
            settings.journalLine = 0;
            
            me._writeSettings().then( function() {
                result( settings.version );
            })
        });
});

```

### _localChannelModel::constructor( channelId, fileSystem )

```javascript

this._channelId = channelId;
this._latestVersion = 1;

this._fs = fileSystem; // store the filesystem into "fs" variable

var me = this;

// make sure the channel directory is there, then we are ready almost at least to go...
me._createChannelDir(channelId).then( function() {
    return me._createChannelSettings();
}).then( function() {
    me.resolve(true); 
}).fail( function(e) {
    console.error(e);
})

```
        
### <a name="_localChannelModel_readBuildTree"></a>_localChannelModel::readBuildTree(channelId, version, journalLine)


```javascript

var flatten = function(a) {
    return [].concat.apply([], a);
}

var local = this._folder, me = this;

if(channelId) {
    return _promise( 
         function(response) {
             var ch = _localChannelModel(channelId, me._fs);
             ch.then(
                 function() {
                     ch.readBuildTree(null, version, null).then( function(res) {
                          var jLen = res[0].length;
                          if(jLen > journalLine) {
                              res[0].splice( journalLine, jLen - journalLine );
                          }
                          response(res);
                     });
                 });
         });
}


return _promise( 
    function(response) {
        var repList = [],
            mainFile,
            journalFile;
        
        me.then( function() {
            return me.readMain(version); // first get the main
        }).then( function(mainFileRead) {
            if(mainFileRead) {
                mainFile = JSON.parse( mainFileRead );
            }
//             mainFile = mainFileRead;
            return me.readJournal(version);
        }).then( function(journal)  {
            journalFile = journal;
            
            if(me._settings.from && !mainFile) {

                var settings = me._settings;
                me.readBuildTree(settings.from, 
                                 settings.fromVersion, 
                                 settings.fromJournalLine).then( function(resp) {
                    repList.push(journal);
                    resp.forEach( function(r) {
                        repList.push(r);
                    });
                    response(repList);
                });
            } else {
                response( [journal, mainFile ]);
            }

        }).fail(function(msg) {
            console.error(msg);
        })
    });
```

### <a name="_localChannelModel_readJournal"></a>_localChannelModel::readJournal(version)


```javascript

var local = this._folder, 
    me = this,
    versionNumber = version || me._settings.version;

return _promise(
    function(res) {
        local.readFile( "journal."+versionNumber).then( function(data) {
            if(!data) {
                res([]);
                return;
            }
            res( me._textLinesToArray(data) );
        }).fail( function() {
            res([]);
        })
});
```

### <a name="_localChannelModel_readMain"></a>_localChannelModel::readMain(version)


```javascript

var local = this._folder, 
    me = this,
    versionNumber = version || me._settings.version;

if(versionNumber==1) {

    return _promise(function(r) {
        r(null);
    });
}

return local.readFile( "file."+versionNumber);

```

### <a name="_localChannelModel_set"></a>_localChannelModel::set(name, value)


```javascript
var local = this._folder, me = this,
    settings = this._settings;
    
if(this.isObject(name)) {
    for(var n in name) {
        if(name.hasOwnProperty(n)) {
            settings[n] = name[n];
        }
    }
} else {
    settings[name] = value;
}

return this._writeSettings( settings );

```

### <a name="_localChannelModel_snapshot"></a>_localChannelModel::snapshot(newMainData)


```javascript
var local = this._folder, me = this;

return _promise( 
    function(done) {
        var currentVersion;
        me.incrementVersion().then( function(nextVersion) {
            currentVersion = nextVersion-1;
            return me.writeMain( newMainData );
        }).then( function() {
            // The incrementVersion() call will do the following
            // me._settings.journalLine = 0;
            // me._settings.version = 0;
            done(true);
        });
    });

```

### <a name="_localChannelModel_status"></a>_localChannelModel::status(t)


```javascript
var local = this._folder, me = this;
return _promise( function(result) {
    me.then( function() {
        result( me._settings );
    });
});

```

### <a name="_localChannelModel_treeOfLife"></a>_localChannelModel::treeOfLife(channelId)


```javascript

// loads the whole tree of life for this entry, can be a big operation...

var local = this._folder, me = this;

if(channelId) {
    var model = _localChannelModel(channelId, this._fs);
    return model.treeOfLife();
}

return _promise( 
    function(response) {
        me.then( function() {

            if(me._settings.from) {
                me.treeOfLife(me._settings.from).then( response );
            } else {
                me.childForkTree().then( response );
            }
        })
    });
```

### <a name="_localChannelModel_writeMain"></a>_localChannelModel::writeMain(data, version)


```javascript

// NOTE: this function should not be used in typical situations
var local = this._folder, 
    me = this,
    versionNumber = version || me._settings.version;

if(typeof(data) != "string") data = JSON.stringify(data);

return local.writeFile( "file."+versionNumber, data);

```

### <a name="_localChannelModel_writeToJournal"></a>_localChannelModel::writeToJournal(row)


```javascript

var local = this._folder, me = this;

if(this.isArray(row[0])) {
    var str = "", cnt=0;
    row.forEach(function(r) {
        str+=JSON.stringify(r)+"\n";
        cnt++;
    });
    return _promise(
        function(resp) {
            local.appendFile( "journal."+me._settings.version, str)
                .then( function() {
                    me._settings.journalLine+=cnt;
                    me._writeSettings();
                    resp(true);
                })
        });    
}

return _promise(
    function(resp) {
        local.appendFile( "journal."+me._settings.version, JSON.stringify(row)+"\n")
            .then( function() {
                me._settings.journalLine++;
                me._writeSettings();
                resp(true);
            })
    });

```



   
    
## trait _dataTrait

The class has following internal singleton variables:
        
        
### <a name="_dataTrait_guid"></a>_dataTrait::guid(t)


```javascript

return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);

```

### <a name="_dataTrait_isArray"></a>_dataTrait::isArray(t)


```javascript
return Object.prototype.toString.call( t ) === '[object Array]';
```

### <a name="_dataTrait_isFunction"></a>_dataTrait::isFunction(fn)


```javascript
return Object.prototype.toString.call(fn) == '[object Function]';
```

### <a name="_dataTrait_isObject"></a>_dataTrait::isObject(t)


```javascript

return t === Object(t);
```


    
    


   
      
    



      
    
      
            
# Class _channelController


The class has following internal singleton variables:
        
* _instances
        
* _cmds
        
        
### <a name="_channelController__askChUpgrade"></a>_channelController::_askChUpgrade(t)


```javascript

var sockets = this._chManager.getSocketsFromCh(this._channelId);

var me = this;
sockets.forEach( function(socket) {
    debugger;
    if(!me._serverState.upgrade) me._serverState.upgrade = {};
     me._serverState.upgrade[socket.getId()] = {
         askFull : true,
         socket : socket
     };
});
```

### <a name="_channelController__classFactory"></a>_channelController::_classFactory(id, fileSystem)


```javascript
if(!_instances) {
    _instances = {};
}

id = id + fileSystem.id();

if(_instances[id]) {
    return _instances[id];
} else {
    _instances[id] = this;
}
```

### <a name="_channelController__doClientUpdate"></a>_channelController::_doClientUpdate(t)


```javascript

var updObj, me = this;

if(!me._serverState) return;

if(me._serverState.upgrade) {
    
    for(var n in me._serverState.upgrade) {
        
        if(me._serverState.upgrade.hasOwnProperty(n)) {
            var info = me._serverState.upgrade[n];
            
            if(info.socket) {
                debugger;
                // do we need a full update or partial update?
                if(info.version != me._serverState.version || (info.askFull)) {
                    var fullData = me._serverState.data.getData();
                    info.socket.emit("upgrade_"+me._channelId, {
                        version : me._serverState.version,
                        journal : me._serverState.data._journal,
                        data : fullData
                    });                        
                } else {
                    var lastJournaLine = info.last_update[1];
                    info.socket.emit("upgrade_"+me._channelId, {
                        partialFrom : lastJournaLine,
                        partialEnds : me._serverState.data._journal.length,
                        partial : me._serverState.data._journal.slice(lastJournaLine)
                    });  
                }
                delete me._serverState.upgrade[n];
            }
        }
    }
}

// sending to all the sockets if there is data to be sent
if(me._broadcastSocket && me._policy) {
    var data = me._policy.constructServerToClient( me._serverState );  
    if(data) {
        if(!updObj) updObj = me._broadcastSocket.to( me._channelId );
        updObj.emit( "s2c_"+me._channelId, data );
        me._model.writeToJournal( data.c ).then( function(r) {
            
        });               
    } 
}

```

### <a name="_channelController__groupACL"></a>_channelController::_groupACL(socket, flags)


```javascript
 
 var me = this;
 if(!me._acl) return false;
 
 var roles = socket.getUserRoles();
 var a_ok = false;
 for(var i=0; i<roles.length;i++) {
     // must have "read attributes" and "read ACL flags"
     if( me._acl.find("", roles[i]+"@", flags) ) {
         a_ok = true;
         break;
     }
 }
 return a_ok;
```

### <a name="_channelController__initCmds"></a>_channelController::_initCmds(t)


```javascript

if(!_cmds) _cmds = {};
if(this._cmds) return;

var me = this;
this._cmds = {
    treeOfLife : function(cmd, result, socket) {
        if(!me._groupACL(socket, "r")) { result(null); return; }

        me._model.treeOfLife( ).then( function(r) {
            result(r); 
        });        
    },
    readBuildTree : function(cmd, result, socket) {
        if(!me._groupACL(socket, "r")) { result(null); return; }
        
        // read the build tree and the status...
        me._model.readBuildTree( ).then( function(r) {
            
            me._model.status().then( function(status) {
                result({
                    status : status,
                    build : r
                });
            });
            // result(r); 
        });        
    },
    getForks : function(cmd, result, socket) {
        if(!me._groupACL(socket, "r")) { result(null); return; }
        me._model.getForks( ).then( function(r) {
            result(r); 
        });        
    },     
    channelStatus : function(cmd, result, socket) {
        if(!me._groupACL(socket, "tc")) { result(null); return; }
        me._model.status( ).then( function(r) {
            result(r); 
        });        
    },    
    raw : function(cmd, result, socket) {
        if(me._groupACL(socket, "tc")) {
            result(me._chData.getData()); 
        } else {
            result( null );
        }
    },     
    fork : function(cmd, result, socket) {
        if(!me._groupACL(socket, "w")) { result(null); return; }
        if(!cmd.data) {
            result({ ok : false }); 
            return;
        }
        cmd.data._userId = socket.getUserId();
        me._model.fork( cmd.data ).then( function(r) {
            result(r); 
        });        
    },    
    // the snapshot command should cause all the sockets to be upgraded
    snapshot : function(cmd, result, socket) {
        
        console.log("got snapshot command");
        
        if(!me._groupACL(socket, "w")) { result(null); return; }
        
        var fullData = me._serverState.data.getData();
        
        // first, save all the unsaved changes and refresh the clients with unsent data
        me._doClientUpdate();
        
        console.log("About to call me._model.snapshot ");
        debugger;
        // then, create new version of the main file
        me._model.snapshot( fullData ).then( function(r) {
            
            // the _serverState data must be also upgraded...
            me._serverState.version++; // ????
            me._serverState.data._journal.length = 0;
            me._serverState.last_update[0] = 0;
            me._serverState.last_update[1] = 0;
            
            console.log("After snapshot ");
            console.log(me._serverState);
            
            // ask channels to upgrade to the latest version of data
            me._askChUpgrade(me._channelId);
            result({ ok : true }); 
        });        
    },
    writeMain : function( cmd, result, socket ) {
        if(!me._groupACL(socket, "w")) { result(null); return; }
        me._model.writeFile( "main", cmd.data ).then( function(r) {
            result({ ok : true}); 
        });
    },
    readMain : function( cmd, result, socket ) {
        if(!me._groupACL(socket, "r")) { result(null); return; }
        me._model.readMain().then( function(r) {
            result(r); 
        });
    },
    readMainVersion : function( cmd, result, socket ) {
        if(!me._groupACL(socket, "r")) { result(null); return; }
        me._model.readMain(cmd.data).then( function(r) {
            result(r); 
        });
    },
    upgradeRequest : function( cmd, result, socket ) {

        if(!me._groupACL(socket, "r")) { result(null); return; }
        if(!me._serverState.upgrade) {
            me._serverState.upgrade = {};
        }

        // the upgrade request sent by the client...
        cmd.data.socket = socket;
        me._serverState.upgrade[socket.getId()] = cmd.data;
        
        result({ result : true });
    },     
    c2s : function( cmd, result, socket ) {

        if(!me._groupACL(socket, "w")) { result(null); return; }
        
        var uid = socket.getUserId();
        var len = cmd.data.c.length,
            list = cmd.data.c,
            utc = (new Date).getTime();
        for(var i=0; i<len; i++) {
            list[i][5] = utc;
            list[i][6] = uid;
        }
        
        var res = me._policy.deltaClientToServer( cmd.data, me._serverState );
        
        // pick one socket so that we can broadcast if necessary...
        if(! me._broadcastSocket ) me._broadcastSocket = socket;
        
        // in this case we do not write immediately to all clients, just return
        // the result to the client
        result(res);
        
        // TODO: socket, emit to all clients.
        
    },    
    changeFrame : function( cmd, result, socket ) {
        
        if(!me._groupACL(socket, "w")) { result(null); return; }


        var res = me._tManager.execute( cmd.data );
        
        // ERROR: should be checking the results here...
        // might also write to the actual file-buffer here...
        
        if(res.validCnt > 0 ) {
            cmd.data.commands.length = res.validCnt;
            me._model.writeToJournal( cmd.data.commands ).then( function(r) {
                socket.broadcast.to(cmd.channelId).emit("frame_"+cmd.channelId, cmd );
                result(res);
            });        
        } else {
            result(res);
        }
        // result(res);
        
        /*
        me._model.writeToJournal( cmd.data ).then( function(r) {
            socket.broadcast.to(cmd.channelId).emit("ch_"+cmd.channelId, cmd );
            result({ ok : true}); 
        });
        */
    },    
    writeJournal : function( cmd, result, socket ) {
        if(!me._groupACL(socket, "w")) { result(null); return; }
        me._model.writeToJournal( cmd.data ).then( function(r) {
            socket.broadcast.to(cmd.channelId).emit("ch_"+cmd.channelId, cmd );
            result({ ok : true}); 
        });
    },
    readJournal : function( cmd, result, socket ) {
        if(!me._groupACL(socket, "r")) { result(null); return; }
        me._model.readJournal().then( function(r) {
            result(r); 
        });
    },
    readJournalVersion : function( cmd, result, socket ) {
        if(!me._groupACL(socket, "r")) { result(null); return; }
        me._model.readJournal(cmd.data).then( function(r) {
            result(r); 
        });
    }
}
```

### <a name="_channelController__updateLoop"></a>_channelController::_updateLoop(t)


```javascript

var me = this;
later().every(1/5, function() {
    me._doClientUpdate();
});
```

### _channelController::constructor( channelId, fileSystem, chManager )

```javascript

this._channelId = channelId;
this._commands = sequenceStepper(channelId);
this._chManager = chManager;

// important point: the file system is passed here to the local channel model
this._model = _localChannelModel( channelId, fileSystem );

var me = this;

// Then, construct the channel model from the data
this._model.readBuildTree( ).then( function(r) {
    

    // the build tree
    var mainData = r.pop();
    var dataTest = _channelData( channelId+ fileSystem.id(), mainData, [] );
    var list = r.pop();
    
    // NOW, here is a problem, the in-memory channel "journal" should be truncated
    while(list) {
        dataTest._journalPointer = 0;
        dataTest._journal.length = 0; // <-- the journal length, last will be spared
        list.forEach( function(c) {
            dataTest.execCmd(c);
        });
        list = r.pop();
    }
    

    // The state of the server - what should be the "last_update" ?  
    me._serverState = {
        data :          dataTest,                       // The channel data object set here
        version :       me._model._settings.version,    // the version of the channel model
        last_update :   [0, dataTest.getJournalLine()],             // the range of last commands sent to the client
        _done :         {}              // hash of handled packet ID's
    };    
    
    
    var data = dataTest.getData();
    if(data.__acl) {
        me._acl = nfs4_acl( data.__acl );
    }
    
    // me._tManager = _channelTransaction(channelId + fileSystem.id(), dataTest);
    
    // The channel policy might replace the transaction manager...
    me._policy = _chPolicy();
    
    me._updateLoop(); // start the update loop
    
    // And, here it is finally then...
    me._chData = dataTest;
    me.resolve(true);
    
}); 


this._initCmds();

```
        
### <a name="_channelController_run"></a>_channelController::run(cmd, responseFn, socket)


```javascript

// 1. selecting the command to be run here...
var fn = this._cmds[cmd.cmd];
if(fn) {
    this._commands.addCommands(function(contFn) {
            fn(cmd, function(result) {
                responseFn(result);
                contFn();
            }, socket);
        });
}

```



   


   



      
    



      
    
      
            
# Class channelClientModule


The class has following internal singleton variables:
        
        
### channelClientModule::constructor( t )

```javascript

```
        


   
    
    
    
    
    
    


   
      
            
# Class later


The class has following internal singleton variables:
        
* _initDone
        
* _callers
        
* _oneTimers
        
* _everies
        
* _framers
        
        
### <a name="later_add"></a>later::add(fn, thisObj, args)


```javascript
if(thisObj || args) {
   var tArgs;
   if( Object.prototype.toString.call( args ) === '[object Array]' ) {
       tArgs = args;
   } else {
       tArgs = Array.prototype.slice.call(arguments, 2);
       if(!tArgs) tArgs = [];
   }
   _callers.push([thisObj, fn, tArgs]);   
} else {
    _callers.push(fn);
}
```

### <a name="later_asap"></a>later::asap(fn)


```javascript
this.add(fn);

```

### <a name="later_every"></a>later::every(seconds, fn, name)


```javascript

if(!name) {
    name = "time"+(new Date()).getTime()+Math.random(10000000);
}

_everies[name] = {
    step : Math.floor(seconds * 1000),
    fn : fn,
    nextTime : 0
};
```

### later::constructor( interval, fn )

```javascript
if(!_initDone) {

   var frame, cancelFrame;
   
   this.polyfill();
 
   if(typeof(window) != "undefined") {
       var frame = window['requestAnimationFrame'], 
           cancelFrame= window['cancelRequestAnimationFrame'];
       ['', 'ms', 'moz', 'webkit', 'o'].forEach( function(x) { 
           if(!frame) {
            frame = window[x+'RequestAnimationFrame'];
            cancelFrame = window[x+'CancelAnimationFrame'] 
                                       || window[x+'CancelRequestAnimationFrame'];
           }
        });
   }
 
    if (!frame)
        frame= function(cb) {
            return setTimeout(cb, 16);
        };
 
    if (!cancelFrame)
        cancelFrame = function(id) {
            clearTimeout(id);
        };    
        
    _callers = [];
    _oneTimers = {};
    _everies = {};
    _framers = [];
    var lastMs = 0;
    
    var _callQueQue = function() {
       var ms = (new Date()).getTime();
       var fn;
       while(fn=_callers.shift()) {
          if(Object.prototype.toString.call( fn ) === '[object Array]' ) {
              fn[1].apply(fn[0], fn[2]);
          } else {
              fn();
          }
           
       }
       
       for(var i=0; i<_framers.length;i++) {
           var fFn = _framers[i];
           fFn();
       }
       
       for(var n in _oneTimers) {
           if(_oneTimers.hasOwnProperty(n)) {
               var v = _oneTimers[n];
               v[0](v[1]);
               delete _oneTimers[n];
           }
       }
       
       for(var n in _everies) {
           if(_everies.hasOwnProperty(n)) {
               var v = _everies[n];
               if(v.nextTime < ms) {
                   v.fn();
                   v.nextTime = ms + v.step;
               }
               if(v.until) {
                   if(v.until < ms) {
                       delete _everies[n];
                   }
               }
           }
       }       
       
       frame(_callQueQue);
       lastMs = ms;
    };
    _callQueQue();
    _initDone = true;
}
```
        
### <a name="later_once"></a>later::once(key, fn, value)


```javascript
// _oneTimers

_oneTimers[key] = [fn,value];
```

### <a name="later_onFrame"></a>later::onFrame(fn)


```javascript

_framers.push(fn);
```

### <a name="later_polyfill"></a>later::polyfill(t)


```javascript
// --- let's not ---
```

### <a name="later_removeFrameFn"></a>later::removeFrameFn(fn)


```javascript

var i = _framers.indexOf(fn);
if(i>=0) {
    if(fn._onRemove) {
        fn._onRemove();
    }
    _framers.splice(i,1);
    return true;
} else {
    return false;
}
```



   


   



      
    
      
            
# Class _promise


The class has following internal singleton variables:
        
        
### <a name="_promise_all"></a>_promise::all(firstArg)


```javascript

var args;
if(this.isArray(firstArg)) {
  args = firstArg;
} else {
  args = Array.prototype.slice.call(arguments, 0);
}
// console.log(args);
var targetLen = args.length,
    rCnt = 0,
    myPromises = [],
    myResults = new Array(targetLen);
    
return this.then(
    function() {
 
        var allPromise = _promise();
        if(args.length==0) {
            allPromise.resolve([]);
        }
        args.forEach( function(b, index) {
            if(b.then) {
                // console.log("All, looking for ", b, " state = ", b._state);
                myPromises.push(b);
                
                b.then(function(v) {
                    myResults[index] = v;
                    rCnt++;
                    if(rCnt==targetLen) {

                        allPromise.resolve(myResults);
                    }
                }, function(v) {
                    allPromise.reject(v);
                });
                
            } else {
                allPromise.reject("Not list of promises");
            }
        })
        
        return allPromise;
        
    });



    

```

### <a name="_promise_collect"></a>_promise::collect(collectFn, promiseList, results)


```javascript

var args;
if(this.isArray(promiseList)) {
  args = promiseList;
} else {
  args = [promiseList];
}

// console.log(args);
var targetLen = args.length,
    isReady = false,
    noMore = false,
    rCnt = 0,
    myPromises = [],
    myResults = results || {};
    
return this.then(
    function() {
 
        var allPromise = _promise();
        args.forEach( function(b, index) {
            if(b.then) {
                // console.log("All, looking for ", b, " state = ", b._state);
                myPromises.push(b);
                
                b.then(function(v) {
                    rCnt++;
                    isReady = collectFn(v, myResults);
                    if( (isReady && !noMore) || (noMore==false && targetLen == rCnt) ) {
                        allPromise.resolve(myResults);
                        noMore = true;
                    }
                }, function(v) {
                    allPromise.reject(v);
                });
                
            } else {
                allPromise.reject("Not list of promises");
            }
        })
        
        return allPromise;
        
    });

```

### <a name="_promise_fail"></a>_promise::fail(fn)


```javascript
return this.then(null, fn);
```

### <a name="_promise_fulfill"></a>_promise::fulfill(withValue)


```javascript
// if(this._fulfilled || this._rejected) return;

if(this._rejected) return;
if(this._fulfilled && withValue != this._stateValue) {
    return;
}

var me = this;
this._fulfilled = true;
this._stateValue = withValue;

var chCnt = this._childPromises.length;

while(chCnt--) {
    var p = this._childPromises.shift();
    if(p._onFulfill) {
        try {
            var x = p._onFulfill(withValue);
            // console.log("Returned ",x);
            if(typeof(x)!="undefined") {
                p.resolve(x);
            } else {
                p.fulfill(withValue);
            }
        } catch(e) {
            // console.error(e);
            /*
                If either onFulfilled or onRejected throws an exception e, promise2 
                must be rejected with e as the reason.            
            */
            p.reject(e);
        }
    } else {
        /*
            If onFulfilled is not a function and promise1 is fulfilled, promise2 must be 
            fulfilled with the same value as promise1        
        */
        p.fulfill(withValue);
    }
};
// this._childPromises.length = 0;
this._state = 1;
this.triggerStateChange();

```

### _promise::constructor( onFulfilled, onRejected )

```javascript
// 0 = pending
// 1 = fullfilled
// 2 = error

this._state = 0;
this._stateValue = null;
this._isAPromise = true;
this._childPromises = [];

if(this.isFunction(onFulfilled))
    this._onFulfill = onFulfilled;
if(this.isFunction(onRejected))
    this._onReject = onRejected;
    
if(!onRejected && this.isFunction(onFulfilled) ) {

    var me = this;
    later().asap(
        function() {
            onFulfilled( function(v) {
                me.resolve(v)
            }, function(v) {
                me.reject(v);
            });           
        });
 
}
```
        
### <a name="_promise_isFulfilled"></a>_promise::isFulfilled(t)


```javascript
return this._state == 1;
```

### <a name="_promise_isPending"></a>_promise::isPending(t)


```javascript
return this._state == 0;
```

### <a name="_promise_isRejected"></a>_promise::isRejected(v)


```javascript
return this._state == 2;
```

### <a name="_promise_onStateChange"></a>_promise::onStateChange(fn)


```javascript

if(!this._listeners)
    this._listeners = [];

this._listeners.push(fn);
```

### <a name="_promise_reject"></a>_promise::reject(withReason)


```javascript

// if(this._rejected || this._fulfilled) return;

// conso

if(this._fulfilled) return;
if(this._rejected && withReason != this._rejectReason) return;


this._state = 2;
this._rejected = true;
this._rejectReason = withReason;
var me = this;

var chCnt = this._childPromises.length;
while(chCnt--) {
    var p = this._childPromises.shift();

    if(p._onReject) {
        try {
            p._onReject(withReason);
            p.reject(withReason);
        } catch(e) {
            /*
                If either onFulfilled or onRejected throws an exception e, promise2 
                must be rejected with e as the reason.            
            */
            p.reject(e);
        }
    } else {
        /*
            If onFulfilled is not a function and promise1 is fulfilled, promise2 must be 
            fulfilled with the same value as promise1        
        */
        p.reject(withReason);
    }
};

// this._childPromises.length = 0;
this.triggerStateChange();

```

### <a name="_promise_rejectReason"></a>_promise::rejectReason(reason)


```javascript
if(reason) {
    this._rejectReason = reason;
    return;
}
return this._rejectReason;
```

### <a name="_promise_resolve"></a>_promise::resolve(x)


```javascript

// console.log("Resolving ", x);

// can not do this many times...
if(this._state>0) return;

if(x==this) {
    // error
    this._rejectReason = "TypeError";
    this.reject(this._rejectReason);
    return;
}

if(this.isObject(x) && x._isAPromise) {
    
    // 
    this._state = x._state;
    this._stateValue = x._stateValue;
    this._rejectReason = x._rejectReason;
    // ... 
    if(this._state===0) {
        var me = this;
        x.onStateChange( function() {
            if(x._state==1) {
                // console.log("State change");
                me.resolve(x.value());
            } 
            if(x._state==2) {
                me.reject(x.rejectReason());                
            }
        });
    }
    if(this._state==1) {
        // console.log("Resolved to be Promise was fulfilled ", x._stateValue);
        this.fulfill(this._stateValue);    
    }
    if(this._state==2) {
        // console.log("Relved to be Promise was rejected ", x._rejectReason);
        this.reject(this._rejectReason);
    }
    return;
}
if(this.isObject(x) && x.then && this.isFunction(x.then)) {
    // console.log("Thenable ", x);
    var didCall = false;
    try {
        // Call the x.then
        var  me = this;
        x.then.call(x, 
            function(y) {
                if(didCall) return;
                // we have now value for the promise...
                // console.log("Got value from Thenable ", y);
                me.resolve(y);
                didCall = true;
            },
            function(r) {
                if(didCall) return;
                // console.log("Got reject from Thenable ", r);
                me.reject(r);
                didCall = true;
            });
    } catch(e) {
        if(!didCall) this.reject(e);
    }
    return;    
}
this._state = 1;
this._stateValue = x;

// fulfill the promise...
this.fulfill(x);

```

### <a name="_promise_state"></a>_promise::state(newState)


```javascript
if(typeof(newState)!="undefined") {
    this._state = newState;
}
return this._state;
```

### <a name="_promise_then"></a>_promise::then(onFulfilled, onRejected)


```javascript

if(!onRejected) onRejected = function() {};

var p = new _promise(onFulfilled, onRejected);
var me = this;

if(this._state==1) {
    later().asap( function() {
        me.fulfill(me.value());
    });
}
if(this._state==2) {
    later().asap( function() {
        me.reject(me.rejectReason());
    });
}
this._childPromises.push(p);
return p;



```

### <a name="_promise_triggerStateChange"></a>_promise::triggerStateChange(t)


```javascript
var me = this;
if(!this._listeners) return;
this._listeners.forEach( function(fn) {
    fn(me); 
});
// one-timer
this._listeners.length = 0;
```

### <a name="_promise_value"></a>_promise::value(v)


```javascript
if(typeof(v)!="undefined") {
    this._stateValue = v;
    return this;
}
return this._stateValue;
```



   
    
## trait util_fns

The class has following internal singleton variables:
        
        
### <a name="util_fns_isArray"></a>util_fns::isArray(someVar)


```javascript
return Object.prototype.toString.call( someVar ) === '[object Array]';
```

### <a name="util_fns_isFunction"></a>util_fns::isFunction(fn)


```javascript
return Object.prototype.toString.call(fn) == '[object Function]';
```

### <a name="util_fns_isObject"></a>util_fns::isObject(obj)


```javascript
return obj === Object(obj);
```


    
    


   
      
    



      
    
      
            
# Class channelClient


The class has following internal singleton variables:
        
* _instanceCache
        
        
### <a name="channelClient__classFactory"></a>channelClient::_classFactory(id, socket)


```javascript

if(!id || !socket) return;

id = id + socket.getId();

if(!_instanceCache) _instanceCache = {};
if(_instanceCache[id]) return _instanceCache[id];
_instanceCache[id] = this;
```

### <a name="channelClient__createTransaction"></a>channelClient::_createTransaction(t)


```javascript

// package to be sent to the server
this._currentFrame = {
    id : this.guid(),
    version : 1,
    from : this._data.getJournalLine(),
    fail_tolastok : true,
    commands : []
};

/*
    data : {
            id   : "t2",                   // unique ID for transaction
            version : 1,                    // channel version
            from : 1,                      // journal line to start the change
            to   : 2,                      // the last line ( optionsl, I guess )
            fail_tolastok : true,           // fail until last ok command
            // fail_all : true,
            commands : [
                [4, "fill", "black", "blue", "id1"]
            ]                               
    }
*/

```

### <a name="channelClient__fetch"></a>channelClient::_fetch(id)


```javascript
var ns_id = this._idToNs( id, this._ns ); // is this too slow?
var obj = this._data._find( ns_id );
if(obj) {
    return obj;
}

```

### <a name="channelClient__incoming"></a>channelClient::_incoming(socket, myNamespace)

This is the beef of almost everything, when a new frame comes around, what to do with it? There are many options what to do, we just have to pick one strategy.
```javascript

var me = this,
    channelId = this._channelId;

socket.on("upgrade_"+this._channelId, function(cmd) {

   me._upgradePending = false;
   // just don't accept any msgs 
   if(me._disconnected) return;

   if(cmd) {

       if(cmd.partial) {
           
           // should be reversing perhaps first to some line...
           var dd = me._clientState.data;

           dd.reverseToLine(cmd.partialFrom);
           console.log("--- refreshing the partials, reversed to line --- ", cmd.partialFrom);
           var errCnt=0;
           cmd.partial.forEach( function(c) {
               if(errCnt > 0 ) return;
               var r;
               var cmdIn  = me._transformCmdToNs(c);
               if(! ((r=dd.execCmd(cmdIn,true))===true ) ) {
                   console.error("Partial ", r);
                   errCnt++;
               }
           });

           if(errCnt==0) {
               me._clientState.needsRefresh = false;
               me._clientState.needsFullRefresh = false;
               
               dd._journal.length = cmd.partialEnds;
               
               // The correct position 
               me._clientState.last_update[0] = 0;
               me._clientState.last_update[1] = dd._journal.length;
               me._clientState.last_sent[0] = 0;
               me._clientState.last_sent[1] = dd._journal.length;               
           } else {
               me._clientState.needsFullRefresh = true;
           }
           
       }
       if(cmd.data) {
           
           // full upgrade coming here, must also replace the journal
           
           var myData = me._clientState.data.getData(); // <- the data
           me._transformObjToNs(cmd.data);
           
           var diff = diffEngine().compareFiles(myData, cmd.data );
           console.log("The diff ", JSON.stringify(diff));
           // run the commands for the local data
           var dd = me._clientState.data;
           var errCnt = 0;
           diff.cmds.forEach(function(c) {
               console.log("Diff cmd ", c);
               if(errCnt > 0 ) return;
               var r;
               /// dd.execCmd(c, true); // the point is just to change the data to something else
               if(! ((r=dd.execCmd(c,true))===true ) ) {
                   console.error("Full error ", r);
                   errCnt++;
               }               
           });
           
           // and now the hard part, upgrade the local client data.
           if(errCnt==0) {
               
               me._clientState.needsRefresh = false;
               me._clientState.needsFullRefresh = false;               
               
               console.log("** full update should have gone ok ** ");
               dd._journal.length = 0;
               dd._journal.push.apply(dd._journal, cmd.journal);
               me._clientState.needsRefresh = false;
               me._clientState.version = cmd.version;
               
               // dd._journal.length = cmd.updateEnds;
               
               me._clientState.last_update[0] = 0;
               me._clientState.last_update[1] = dd._journal.length;
               me._clientState.last_sent[0] = 0;
               me._clientState.last_sent[1] = dd._journal.length;    
               
               console.log("Version ", me._clientState.version);
               
           } else {
               console.error("** errors with the full update ** ");
               me._clientState.needsFullRefresh = true;
               // TODO: might be unresolvable error here, if too many 
               // re-connections or refreshes appear
           }
/*
                // the state management
                me._clientState = {
                    data : chData,              // The channel data object
                    client : me,                // The channel client object (for Namespace conversion )
                    needsRefresh : false,       // true if client is out of sync and needs to reload
                    version : me._channelStatus.version,               
                    last_update : [0, chData.getJournalLine()],  // last succesfull server update
                    last_sent : [0, chData.getJournalLine()]     // last range sent to the server
                
                };
*/
       }       
   }
});

socket.on("s2c_"+this._channelId, function(cmd) {

   // just don't accept any msgs 
   if(me._disconnected) return;
   if(cmd) {
       var res = me._policy.deltaServerToClient( cmd, me._clientState);
   }
   // done, no other action needed???
});

```

### <a name="channelClient__onFrameLoop"></a>channelClient::_onFrameLoop(socket)


```javascript

var me = this,
    channelId = this._channelId;
    
var _frameFn = function() {
    
    if(!me._policy) return;
    if(me._disconnected) return;    // in case disconnected, don't send data
    
    if(!me._connected) return;
    
    if(me._clientState.needsRefresh) {
        // *** if refresh is required, out of sync client **
        
        if(!me._upgradePending) {
            console.log(" needsRefresh && !_upgradePending " );
            me.askUpgrade(me._clientState.needsFullRefresh);
        }
        me._upgradePending = true;
    }
    
    var packet = me._policy.constructClientToServer( me._clientState );
    if(packet) {

            //console.log("Sending packet to server ");
            //console.log(packet);
            socket.send("channelCommand", {
                        channelId : channelId,
                        cmd : "c2s",
                        data : packet
                }).then( function(res) {
                    if(res && res.errors) {
                        // console.error(res.errors);
                        if(res.errors.length>0) {
                            var bRefresh = false;
                            res.errors.forEach(function(err) {
                                if(err.error==44) {
                                    bRefresh = true;
                                } 
                            });
                            if(bRefresh) {
                                me._clientState.needsRefresh = true;
                            }
                        }
                    }
                })    
    }
};
later().onFrame( _frameFn  );

```

### <a name="channelClient_addCommand"></a>channelClient::addCommand(cmd, dontBroadcast)

Add command to next change frame to be sent over the network. TODO: validate the commands against the own channelObject, for example the previous value etc.
```javascript
/*
    data : {
            id   : "t2",                   // unique ID for transaction
            version : 1,                    // channel version
            from : 1,                      // journal line to start the change
            to   : 2,                      // the last line ( optionsl, I guess )
            fail_tolastok : true,           // fail until last ok command
            // fail_all : true,
            commands : [
                [4, "fill", "black", "blue", "id1"]
            ]                               
    }
*/

if(this._currentFrame) {
    var cmdOut = this._transformCmdFromNs(cmd, this._ns);
    var cmdIn  = this._transformCmdToNs(cmd, this._ns);
    // the local command is run immediately and if it passes then we add it to the frame
    if( this._data.execCmd(cmdIn, dontBroadcast)  ) {
        this._currentFrame.commands.push( cmdOut );        
    }

} else {
    // local command, no frame to add commands.
    var cmdIn  = this._transformCmdToNs(cmd, this._ns);
    // the local command is run immediately and if it passes then we add it to the frame
    if( this._data.execCmd(cmdIn, dontBroadcast)  ) {
        
    }    
}
```

### <a name="channelClient_askUpgrade"></a>channelClient::askUpgrade(askFull)


```javascript

if(!this._socket) return;

this._socket.send("channelCommand", {
            channelId : this._channelId,
            cmd : "upgradeRequest",
            data : {
                version : this._clientState.version,
                last_update :  this._clientState.last_update,
                askFull : askFull
            }
    }).then( function() {
        
    }) 
```

### <a name="channelClient_at"></a>channelClient::at(id, index)


```javascript
var ns_id = this._idToNs( id, this._ns ); // is this too slow?
var obj = this._data._find( ns_id );
if(obj) {
    return obj.data[index];
}
```

### <a name="channelClient_disconnect"></a>channelClient::disconnect(t)


```javascript
this._disconnected = true;
return this;
```

### <a name="channelClient_fork"></a>channelClient::fork(name, description, options)


```javascript
/*
{
   version : 1,
   name : "Initial version",
   utc : (new Date()).getTime(),
   journalLine : 0,
   channelId : "my/channel/fork1/"
}
*/
// me._channelStatus = respData.status;
/*
// has channel + fork information included
{   "fromJournalLine":1,
    "version":1,
    "journalLine":1,
    "channelId":"my/channel/myFork",
    "fromVersion":2,
    "from":"my/channel",
    "to":"my/channel/myFork",
    "name":"test of fork","utc":14839287897}
*/

if(this._isLocal) return;



// ==> OK, ready to send data forward...

// What is the journal line we are using for the fork???
var forkCmd = {
    version : this._channelStatus.version,
    channelId : name,
    name : description,
    journalLine : 1
};
/*
me._clientState = {
    data : chData,              // The channel data object
    client : me,                // The channel client object (for Namespace conversion )
    needsRefresh : false,       // true if client is out of sync and needs to reload
    version : me._channelStatus.version,               
    last_update : [0, chData.getJournalLine()],  // last succesfull server update
    last_sent : []              // last range sent to the server

};
*/
// <= we must be using the last serverupdate, and maybe add the extra lines to the
// additional fork information to create a truly dynamic fork of the subject in case
// some other client is "resisting" the update...
forkCmd.journalLine = this._clientState.last_update[1]; 

// the fork is being processed, the response is going to be ready after the promise completes
var me = this;

return _promise(
    function(results) {
        me._socket.send("channelCommand", {
                    channelId : me._channelId,
                    cmd : "fork",
                    data : forkCmd
            }).then( function(resp) {
                // information from the server.
                // build new channel object
                // return it as the promise...
                results(resp);
                
                
            })          
    });





```

### <a name="channelClient_get"></a>channelClient::get(id, name)


```javascript
var ns_id = this._idToNs( id, this._ns ); // is this too slow?
var obj = this._data._find( ns_id );
if(obj) {
    return obj.data[name];
}
```

### <a name="channelClient_getChannelData"></a>channelClient::getChannelData(t)


```javascript
return this._data;
```

### <a name="channelClient_getData"></a>channelClient::getData(t)


```javascript
return this._data.getData();

```

### <a name="channelClient_indexOf"></a>channelClient::indexOf(id)


```javascript
var ns_id = this._idToNs( id, this._ns ); // is this too slow?
var obj = this._data._find( ns_id );
if(obj) {
    var parent = this._fetch( obj.__p );
    if(parent && parent.data) {
        var index = parent.data.indexOf( obj );
        return index;
    }
}
return -1;
```

### channelClient::constructor( channelId, socket, options )

```javascript

console.log("channelClient init starts");

if(options && options.localChannel) {
    
    this._channelId = channelId;
    this._options = options;
    this._socketGUID = this.guid();
    this._isLocal = true;
    
    this._socket = _clientSocket(this._socketGUID, 1);  
    var myNamespace = this._socket.getEnum();
    
    this._ns = myNamespace;
    this._id = channelId + this._socket.getId();
    var me = this;    

    var mainData = options.localData;
    mainData = me._transformObjToNs( options.localData, myNamespace );
    
    var chData = _channelData( me._id, mainData, [] );
    me._data = chData;
    me.resolve({ result : true, channelId : channelId });
    return;
    
} else {
    
    
}

if(!channelId || !socket) return;

this._channelId = channelId;
this._socket = socket;
this._options = options;
this._changeFrames = [];
this._pendingFrames = [];

var myNamespace = socket.getEnum();

this._ns = myNamespace;

this._id = channelId + socket.getId();
var me = this;

this._onFrameLoop( socket, myNamespace );
this._incoming(socket, myNamespace);

console.log("channelClient init");

this._connCnt = 0;

socket.on("disconnect", function() {
    me._connected = false;
})
socket.on("connect", function() {
    
    console.log("Socket sent connected");
    
    me._connCnt++;
    
    // Authenticate...
    if(options.auth) {
        socket.send("auth", {   userId :    options.auth.username, 
                                password :  options.auth.password 
                            }).then( function(resp) {
            
            if(resp.userId) {
                
                me._userId = resp.userId;
                me._logged = true;
            } else {
                me._logged = false;
                return false;
            }
            // ask to join the channel with this socket...
            return socket.send("requestChannel", {
                        channelId : channelId
                });
        })
        .then( function(resp) {
            // this channel client has been connected to the server ok
            if( resp && resp.channelId == channelId ) {
                
                me._connected = true;
                // The next step: to load the channel information for the
                // local objects to consume
                
                if(me._connCnt > 1) {
                    
                    // first, send the data we have to server, hope it get's through...
                    var packet = me._policy.constructClientToServer( me._clientState );
                    if(packet) {
                        socket.send("channelCommand", {
                                    channelId : channelId,
                                    cmd : "c2s",
                                    data : packet
                            }).then( function(res) {

                            })    
                    }               
                    // then, ask upgrade...
                    me.askUpgrade();
                    return false;
                }

                return socket.send("channelCommand", {
                            channelId : channelId,
                            cmd : "readBuildTree",
                            data : ""
                    });                  
                
            } else {
                return false;
            }
        })
        .then( function(respData) {

            
            if(respData) {
                
                var resp = respData.build;
                console.log("STATUS", JSON.stringify( respData.status) );
                
                // ? should we be updating this or is this just one-time info
                me._channelStatus = respData.status;
                /*
                // has channel + fork information included
                {   "fromJournalLine":1,
                    "version":1,
                    "journalLine":1,
                    "channelId":"my/channel/myFork",
                    "fromVersion":2,
                    "from":"my/channel",
                    "to":"my/channel/myFork",
                    "name":"test of fork","utc":14839287897}
                */
                
                // The build tree is here now...
                // Should you transform the objects to other namespaces...?
                
                var mainData = resp.pop();

                // The data is here... but transforming?
                mainData = me._transformObjToNs( mainData, myNamespace );

                var chData = _channelData( me._id, mainData, [] );
                var list = resp.pop();

                // should be updating the client
                // var res = me._policy.deltaServerToClient( cmd, me._clientState);
                while(list) {
                    chData._journalPointer = 0;
                    chData._journal.length = 0; // <-- the journal length, last will be spared
                    list.forEach( function(c) {
                        chData.execCmd(me._transformCmdToNs(c, myNamespace), true);
                    });
                    list = resp.pop();
                }                
                
                // the state management
                me._clientState = {
                    data : chData,              // The channel data object
                    client : me,                // The channel client object (for Namespace conversion )
                    needsRefresh : false,       // true if client is out of sync and needs to reload
                    version : me._channelStatus.version,               
                    last_update : [0, chData.getJournalLine()],  // last succesfull server update
                    last_sent : [0, chData.getJournalLine()]     // last range sent to the server
                
                };
                me._policy = _chPolicy();
                                
                me._data = chData;
                me._createTransaction();
                me.resolve({ result : true, channelId : channelId });
                
            } else {
                me.resolve({ result : false, text : "Authorization or connection failed" });
            }
        })
    }
});


```
        
### <a name="channelClient_length"></a>channelClient::length(id)


```javascript
var ns_id = this._idToNs( id, this._ns ); // is this too slow?
var obj = this._data._find( ns_id );
if(obj && obj.data) {
    return obj.data.length || 0;
}
return 0;
```

### <a name="channelClient_moveDown"></a>channelClient::moveDown(id)


```javascript
var ns_id = this._idToNs( id, this._ns ); // is this too slow?
var obj = this._data._find( ns_id );
if(obj) {
    var parent = this._fetch( obj.__p );
    if(parent && parent.data) {
        var index = parent.data.indexOf( obj );
        var newIndex = index-1;
        if(newIndex>=0 && index>=0 && index != newIndex && parent.data.length > newIndex) {
            this.addCommand([12, ns_id, newIndex, index, parent.__id]);
            // dataTest.execCmd( [12, "obj4", 0, 2, "array1"], true);
        }
        
    }
}

```

### <a name="channelClient_moveTo"></a>channelClient::moveTo(id, newIndex)


```javascript
var ns_id = this._idToNs( id, this._ns ); // is this too slow?
var obj = this._data._find( ns_id );
if(obj) {
    var parent = this._fetch( obj.__p );
    if(parent && parent.data) {
        var index = parent.data.indexOf( obj );
        if(index>=0 && index != newIndex && parent.data.length > newIndex) {
            this.addCommand([12, ns_id, newIndex, index, parent.__id]);
            // dataTest.execCmd( [12, "obj4", 0, 2, "array1"], true);
        }
        
    }
}

```

### <a name="channelClient_moveUp"></a>channelClient::moveUp(id)


```javascript
var ns_id = this._idToNs( id, this._ns ); // is this too slow?
var obj = this._data._find( ns_id );
if(obj) {
    var parent = this._fetch( obj.__p );
    if(parent && parent.data) {
        var index = parent.data.indexOf( obj );
        var newIndex = index+1;
        if(newIndex>=0 && index>=0 && index != newIndex && parent.data.length > newIndex) {
            this.addCommand([12, ns_id, newIndex, index, parent.__id]);
            // dataTest.execCmd( [12, "obj4", 0, 2, "array1"], true);
        }
        
    }
}

```

### <a name="channelClient_reconnect"></a>channelClient::reconnect(t)


```javascript
this._disconnected = false;
return this;
```

### <a name="channelClient_redo"></a>channelClient::redo(cnt)


```javascript
this._data.redo(cnt);
```

### <a name="channelClient_remove"></a>channelClient::remove(id)


```javascript
var ns_id = this._idToNs( id, this._ns ); // is this too slow?
var obj = this._data._find( ns_id );
if(obj) {
    var parent = this._fetch( obj.__p );
    if(parent && parent.data) {
        var index = parent.data.indexOf( obj );
        if(index>=0) {
            this.addCommand([8, index, ns_id, 0, parent.__id]);
            // this.addCommand([4, name, value, old_value, ns_id ]);
        }
        
    }
    // dataTest.execCmd( [8, 0, "obj1", 0, "array1"], true);
    // return obj.data[name];
}



```

### <a name="channelClient_set"></a>channelClient::set(id, name, value)


```javascript
var ns_id = this._idToNs( id, this._ns ); // is this too slow?
var obj = this._data._find( ns_id );
if(obj && !this.isObject(value)) {
    var old_value = obj.data[name];
    if( old_value != value) {
        this.addCommand([4, name, value, old_value, ns_id ]);
    }
}

```

### <a name="channelClient_setObject"></a>channelClient::setObject(id, name, propObj)


```javascript
var ns_id = this._idToNs( id, this._ns ); // is this too slow?
var obj = this._data._find( ns_id );

if(obj && this.isObject(propObj) && propObj.__id) {
    var old_value = obj.data[name];
    
    if( !old_value ) {
        // insert object only if there is no old value
        this.addCommand([5, name, propObj.__id, null, ns_id ]);
    }
}

```

### <a name="channelClient_undo"></a>channelClient::undo(cnt)


```javascript
this._data.undo(cnt);
```

### <a name="channelClient_unset"></a>channelClient::unset(id, name)


```javascript
var ns_id = this._idToNs( id, this._ns ); // is this too slow?
var obj = this._data._find( ns_id );
if(obj) {
    var old_obj = obj.data[name];
    if( old_obj && old_obj.__id ) {
        this.addCommand([10, name, old_obj.__id, null, ns_id ]);
    }
}

```

### <a name="channelClient_upgradeVersion"></a>channelClient::upgradeVersion(t)


```javascript

// should start the snapshot command
this._socket.send("channelCommand", {
            channelId : this._channelId,
            cmd : "snapshot",
            data : {}
    }).then( function() {
        
    })   
```



   
    
## trait _dataTrait

The class has following internal singleton variables:
        
        
### <a name="_dataTrait_guid"></a>_dataTrait::guid(t)


```javascript
return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);

```

### <a name="_dataTrait_isArray"></a>_dataTrait::isArray(t)


```javascript
return t instanceof Array;
```

### <a name="_dataTrait_isFunction"></a>_dataTrait::isFunction(fn)


```javascript
return Object.prototype.toString.call(fn) == '[object Function]';
```

### <a name="_dataTrait_isObject"></a>_dataTrait::isObject(t)


```javascript
return t === Object(t);
```


    
    
    
## trait commad_trait

The class has following internal singleton variables:
        
* _cmdNsMap
        
        
### <a name="commad_trait__getNsFromUrl"></a>commad_trait::_getNsFromUrl(url)


```javascript
if(_nsShortcuts[url]) {
    return _nsShortcuts[url];
}
_nsReverse[_nsIndex] = url;
_nsShortcuts[url] = _nsIndex++;

return _nsShortcuts[url];
```

### <a name="commad_trait__getNsShorthand"></a>commad_trait::_getNsShorthand(nsName)


```javascript

if(_nsShortcuts[nsName]) {
    return _nsShortcuts[nsName];
}
_nsReverse[_nsIndex] = nsName;
_nsShortcuts[nsName] = _nsIndex++;

return _nsShortcuts[nsName];
```

### <a name="commad_trait__getReflections"></a>commad_trait::_getReflections(t)


```javascript
return _localReflections;
```

### <a name="commad_trait__getReflectionsFor"></a>commad_trait::_getReflectionsFor(objId)


```javascript

if(_localReflections) {
    var list = _localReflections[objId];
    if(list) return list;
}
return [];
```

### <a name="commad_trait__getReverseNs"></a>commad_trait::_getReverseNs(index)


```javascript

return _nsReverse[index];
```

### <a name="commad_trait__idFromNs"></a>commad_trait::_idFromNs(id)


```javascript
if(id) {
    
    var len = id.length;
    if(id[len-1]=="#") {    
        id = id.split("@").shift();
    } 
}
return id;
```

### <a name="commad_trait__idToNs"></a>commad_trait::_idToNs(id, ns)


```javascript

if(id) {
    var len = id.length;
    // longString
    
    if(id[len-1]=="#") {
        var ind = id.indexOf("@");
        var oldNs = id.substring(ind+1, len-1);
        if(oldNs != ns ) {
            id = id.substring(0,ind) +"@"+ns+"#";
        }
    } else {
        id = id+"@"+ns+"#";
    }
}
return id;
```

### <a name="commad_trait__nsFromId"></a>commad_trait::_nsFromId(id)


```javascript
var ns;
if(id) {
    id = id+"";
    var len = id.length;
    if(id[len-1]=="#") {    
        ns = id.split("@").pop();
        ns = ns.split("#").shift();
    } 
}
return ns;
```

### <a name="commad_trait__transformCmdFromNs"></a>commad_trait::_transformCmdFromNs(cmd, ns)


```javascript

if(!ns) ns = this._ns;

var map = _cmdNsMap,
    nextCmd = cmd.slice(),
    swap = map[cmd[0]],
    me = this;
if(swap) {
    swap.forEach( function(index) {
        nextCmd[index] = me._idFromNs( nextCmd[index], ns );
    });
}
return nextCmd;
```

### <a name="commad_trait__transformCmdToNs"></a>commad_trait::_transformCmdToNs(cmd, ns)


```javascript

if(!ns) ns = this._ns;

var map = _cmdNsMap,
    nextCmd = cmd.slice(),
    swap = map[cmd[0]],
    me = this;
if(swap) {
    for(var i=0; i< swap.length;i++) {
        var index = swap[i];
        nextCmd[index] = this._idToNs( nextCmd[index], ns );
    }
} 
return nextCmd;

```

### <a name="commad_trait__transformObjFromNs"></a>commad_trait::_transformObjFromNs(obj, ns)


```javascript
if(!ns) ns = this._ns;

if(obj && obj.__id) {
    if(obj.__p) obj.__p = this._idFromNs( obj.__p, ns );
    obj.__id = this._idFromNs( obj.__id, ns );
    for(var n in obj.data) {
        if(obj.data.hasOwnProperty(n)) {
            if(this.isObject(obj.data[n])) this._transformObjFromNs( obj.data[n], ns );
        }
    }
}
return obj;

```

### <a name="commad_trait__transformObjToNs"></a>commad_trait::_transformObjToNs(obj, ns)


```javascript
if(!ns) ns = this._ns;
if(obj && obj.__id) {
    
    // the old way, currently the socket ID may be the same, but not used right now
    /*
    var nsNext;
    if(obj.__radioURL) {
        var nsNext = this._getNsShorthand( obj.__radioURL );
    }
    ns = nsNext || ns;
    */
    
    // obj = me._transformObjToNs( obj, ns );
    obj.__id = this._idToNs( obj.__id, ns );
    if(obj.__p) {
        obj.__p = this._idToNs( obj.__p, ns );
    }
    for(var n in obj.data) {
        if(obj.data.hasOwnProperty(n)) {
            if(this.isObject(obj.data[n])) this._transformObjToNs( obj.data[n], ns );
        }
    }
}

return obj;


```

### <a name="commad_trait__transformToNsBeforeInsert"></a>commad_trait::_transformToNsBeforeInsert(obj, parentObj, parentObj2)


```javascript

// OK, so...

var cmdList = obj.__ctxCmdList;
var ns = this._nsFromId( parentObj.__id );

console.log(" _transformToNsBeforeInsert ");

var me = this;
if(ns) {
    // console.log("Using namespace "+ns);
    if(cmdList) {
        cmdList.forEach( function(c) {
            c.cmd = me._transformCmdToNs( c.cmd, ns );
        });
    }
    obj = me._transformObjToNs( obj, ns );
    obj.__ctxCmdList = cmdList;
    this._addToCache( obj );
    return obj;
}
// this._addToCache( obj );
return obj;



```

### commad_trait::constructor( t )

```javascript
if(!_cmdNsMap) {
    _cmdNsMap = {
        1 : [1],
        2 : [1],
        4 : [4],
        5  : [2,4],
        7  : [2,4],
        8  : [2,4],
        10 : [2,4],
        12 : [1,4],
        13 : [4],
        16 : [3,4]
    };    
}
```
        

    
    


   
      
    
      
    



      
    



      
    
      
            
# Class socketEmulator


The class has following internal singleton variables:
        
* _initDone
        
        
### socketEmulator::constructor( host, bUseReal )

```javascript

// var socket = io('http://localhost');


```
        


   
    
## trait _dataTrait

The class has following internal singleton variables:
        
* _eventOn
        
* _commands
        
        
### <a name="_dataTrait_guid"></a>_dataTrait::guid(t)


```javascript

return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
        
```

### <a name="_dataTrait_isArray"></a>_dataTrait::isArray(t)


```javascript
return Object.prototype.toString.call( t ) === '[object Array]';
```

### <a name="_dataTrait_isFunction"></a>_dataTrait::isFunction(fn)


```javascript
return Object.prototype.toString.call(fn) == '[object Function]';
```

### <a name="_dataTrait_isObject"></a>_dataTrait::isObject(t)


```javascript
return t === Object(t);
```


    
    
    
    
    
    
    
    
    
    
    
    


   
      
    
      
            
# Class _clientSocket


The class has following internal singleton variables:
        
* _channelIndex
        
* _rootData
        
* _callBacks
        
* _socketIndex
        
* _socketCnt
        
        
### <a name="_clientSocket_disconnect"></a>_clientSocket::disconnect(t)


```javascript
this._socket.messageTo( {
    disconnect : true
});
me._connected = false;
```

### <a name="_clientSocket_emit"></a>_clientSocket::emit(name, data, callBackFn)
`name` Message name
 
`data` Data to be sent, Object or string
 
`callBackFn` Callback, message from the receiver
 

Emit data from client to server
```javascript

var obj = {
    name : name,
    data : data
}

if( callBackFn ) {
    obj._callBackId = this.guid();
    var me = this;
    var handleCb = function(data) {
        callBackFn( data );
        me.removeListener( obj._callBackId  , handleCb );
    }
    this.on( obj._callBackId, handleCb )
}

this._socket.messageTo(obj);
```

### <a name="_clientSocket_getEnum"></a>_clientSocket::getEnum(t)

The enumerated socket, stating from 1
```javascript
var myId = this.socketId;

if(!_socketIndex[myId]) {
    _socketIndex[myId] = _socketCnt++;
} 
return _socketIndex[myId];
```

### <a name="_clientSocket_getId"></a>_clientSocket::getId(t)

Returns GUID of the current socket.
```javascript
return this.socketId;
```

### _clientSocket::constructor( ip, port, realSocket )
Create new instance with _clientSocket(ip,port);
```javascript

// The socket ID must be told to the server side too

if(!_socketIndex) {
    _socketIndex = {};
    _socketCnt = 1;
}

var me = this;
var myId = this.guid();
this.socketId = myId;

if(!_socketIndex[this.socketId]) {
    _socketIndex[this.socketId] = _socketCnt++;
} 

if(realSocket) {

    var whenConnected = function() {
        console.log("whenConnected called");
        var openConnection = _tcpEmu(ip, port, "openConnection", "client", realSocket);
        var connection = _tcpEmu(ip, port, myId, "client", realSocket);
        
        connection.on("clientMessage", function(o,v) {
            console.log("clientMessage received ", v);
            if(v.connected) {
                me._socket = connection;
                me._connected = true;
                me.trigger("connect", connection);
            } else {
                me.trigger(v.name, v.data);
            }
        })
        console.log("Sending message to _tcpEmu with real socket ");
        openConnection.messageTo({
            socketId : myId
        });        
    };
    var me = this;
    realSocket.on("disconnect", function() {
        me.trigger("disconnect");
    })

    if(realSocket.connected) {
        console.log("realSocket was connected");
        whenConnected();
    } else {
        console.log("realSocket was not connected");
        realSocket.on("connect", whenConnected);
    }

    // this._connected
    return;
}

var openConnection = _tcpEmu(ip, port, "openConnection", "client", realSocket);
var connection = _tcpEmu(ip, port, myId, "client", realSocket);

connection.on("clientMessage", function(o,v) {
    if(v.connected) {
        me._socket = connection;
        me._connected = true;
        me.trigger("connect", connection);
    } else {
        me.trigger(v.name, v.data);
    }
})
openConnection.messageTo({
    socketId : myId
});


```
        
### <a name="_clientSocket_send"></a>_clientSocket::send(name, data)

A promisified interface of the &quot;emit&quot; for the _clientSocket
```javascript
var me = this;
return _promise( function(respFn) {
    me.emit( name, data, respFn);
});
```



   
    
## trait _dataTrait

The class has following internal singleton variables:
        
* _eventOn
        
* _commands
        
        
### <a name="_dataTrait_guid"></a>_dataTrait::guid(t)


```javascript

return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);

```

### <a name="_dataTrait_isArray"></a>_dataTrait::isArray(t)


```javascript
return Object.prototype.toString.call( t ) === '[object Array]';
```

### <a name="_dataTrait_isFunction"></a>_dataTrait::isFunction(fn)


```javascript
return Object.prototype.toString.call(fn) == '[object Function]';
```

### <a name="_dataTrait_isObject"></a>_dataTrait::isObject(t)


```javascript
return t === Object(t);
```


    
    
    
## trait events

The class has following internal singleton variables:
        
        
### <a name="_on"></a>::on(en, ef)
`en` Event name
 

Binds event name to event function
```javascript
if(!this._ev) this._ev = {};
if(!this._ev[en]) this._ev[en] = [];

this._ev[en].push(ef);

if(en == "connect" && this._connected) {
    ef(this._socket);
}

return this;
```

### <a name="_removeListener"></a>::removeListener(name, fn)


```javascript
if(!this._ev) return;
if(!this._ev[name]) return;

var list = this._ev[name];

for(var i=0; i<list.length; i++) {
    if(list[i]==fn) {
        list.splice(i,1);
        return;
    }
}

```

### <a name="_trigger"></a>::trigger(en, data, fn)

triggers event with data and optional function
```javascript

if(!this._ev) return;
if(!this._ev[en]) return;
var me = this;
this._ev[en].forEach( function(cb) { cb( data, fn) } );    
return this;
```


    
    


   
      
    
      
    



      
    
      
            
# Class _serverSocket


The class has following internal singleton variables:
        
* _channelIndex
        
* _rootData
        
* _clients
        
* _rooms
        
        
### <a name="_serverSocket_getPrefix"></a>_serverSocket::getPrefix(t)


```javascript
return this._ip+":"+this._port;
```

### _serverSocket::constructor( ip, port, ioLib )

```javascript
/*

// This is how the server side should be operating...
var io = require('socket.io')();
io.on('connection', function(socket){
  socket.emit('an event', { some: 'data' });
});

*/

if(!_rooms) {
    _rooms = {};
    _clients = {};
}

var me = this;

var sockets = [];

this._ip = ip;
this._port = port;

if(ioLib) {
    ioLib.on('connection', function(socket){
        
        console.log("socket.io got connection");
        console.log("ip, port", ip, port);
        
        var openConnection = _tcpEmu(ip, port, "openConnection", "server", socket);
        
        var  myRealSocket;
        socket.on('disconnect', function() {
            console.log("ioLib at server sent disconnect");
            if(myRealSocket) myRealSocket.close();
        });
      
        openConnection.on("serverMessage", function(o,v) {
            
            if(v.socketId) {

                var newSocket = _tcpEmu(ip, port, v.socketId, "server", socket);
                myRealSocket = newSocket;
                
                var wrappedSocket = _serverSocketWrap( newSocket, me );
                _clients[v.socketId] = wrappedSocket;
                me.trigger("connect",  wrappedSocket);
                
                if(wrappedSocket.isConnected()) {
                    console.log("Trying to send the connected message back to client");
                    newSocket.messageFrom({
                        connected : true,
                        socketId : v.socketId
                    });        
                } else {
                    console.log("The socket was not connected");
                }
            }
        })        
    });    
    return;
}


var openConnection = _tcpEmu(ip, port, "openConnection", "server");

openConnection.on("serverMessage", function(o,v) {

    if(v.socketId) {
        //console.log("Trying to send msg to client ", v);
        var newSocket = _tcpEmu(ip, port, v.socketId, "server");

        var socket = _serverSocketWrap( newSocket, me );
        _clients[v.socketId] = socket;
        me.trigger("connect",  socket);
        me.trigger("connection",  socket);
        
        if(socket.isConnected()) {

            newSocket.messageFrom({
                connected : true,
                socketId : v.socketId
            });        
        }
    }
})

```
        


   
    
## trait events

The class has following internal singleton variables:
        
        
### <a name="_on"></a>::on(en, ef)
`en` Event name
 

Binds event name to event function
```javascript
if(!this._ev) this._ev = {};
if(!this._ev[en]) this._ev[en] = [];

this._ev[en].push(ef);

return this;
```

### <a name="_trigger"></a>::trigger(en, data, fn)

triggers event with data and optional function
```javascript

if(!this._ev) return;
if(!this._ev[en]) return;
var me = this;
this._ev[en].forEach( function(cb) { cb( data, fn) } );    
return this;
```


    
    


   
      
    



      
    
      
            
# Class _tcpEmu


The class has following internal singleton variables:
        
* _channelIndex
        
* _rootData
        
* _msgBuffer
        
* _log
        
        
### <a name="_tcpEmu_close"></a>_tcpEmu::close(t)


```javascript
this.trigger("disconnect");
```

### _tcpEmu::constructor( server, port, socketId, role, socket )

```javascript

var me = this;
this._server = server;
this._port = port;
this._role = role;
this._socketId = socketId;
this._dbName = "tcp://"+this._server+":"+this._port+":"+this._socketId;

if(!_log) {
    if(typeof(lokki) != "undefined") {
        _log = lokki("tcp");
    } else {
        _log = {
            log : function() {},
            error : function() {}
        }
    }
}

if(socket) {
    // "this._dbName" is the message which is listened using socketPump
    this._socket = socket;
    this.socketPump(role);
} else {
    this.memoryPump(role);
}

```
        
### <a name="_tcpEmu_memoryPump"></a>_tcpEmu::memoryPump(role)

The memory storage transform layer implementation.
```javascript
var me = this;
var bnTo   = this._dbName+":to";
var bnFrom = this._dbName+":from";

if(!_msgBuffer) _msgBuffer = {};
if(!_msgBuffer[bnTo]) _msgBuffer[bnTo] = [];
if(!_msgBuffer[bnFrom]) _msgBuffer[bnFrom] = [];

var _mfn = function() {
    if(role=="server") {
        var list = _msgBuffer[bnTo].slice();
        list.forEach( function(msg) {
            _log.log("server got message ", msg);
             me.trigger("serverMessage", msg);
             _msgBuffer[bnTo].shift();
        });
    
    }
    if(role=="client") {
        var list = _msgBuffer[bnFrom].slice();
        list.forEach( function(msg) {
            me.trigger("clientMessage", msg);
            _msgBuffer[bnFrom].shift();
        });   
    }
};
later().every(1/10, _mfn);
```

### <a name="_tcpEmu_messageFrom"></a>_tcpEmu::messageFrom(msg)

Message &quot;from&quot; refers to client getting message from the server. This is the function to be used when a server sends data back to the client.
```javascript
var socket = this._socket;
if(socket) {
    //console.log("The socket should emit to "+this._dbName);
    //console.log(msg);
    socket.emit(this._dbName, msg);
    return;
}

var bn = this._dbName+":from";
_msgBuffer[bn].push( msg );


```

### <a name="_tcpEmu_messageTo"></a>_tcpEmu::messageTo(msg)

Message &quot;to&quot; refers to client sending message to server. This is the function to be used when a client socket sends data to the server.
```javascript

var socket = this._socket;
if(socket) {
    
    _log.log("_tcpEmu, emitting ", this._dbName, msg);
    socket.emit(this._dbName, msg);
    return;
}

var bn = this._dbName+":to";
_msgBuffer[bn].push( msg );

```

### <a name="_tcpEmu_socketPump"></a>_tcpEmu::socketPump(role)

The socket transform layer implementation.
```javascript
var me = this;

var socket = this._socket;
if(role=="server") {
    
    _log.log("initializing the socketPump for server");
    socket.on(this._dbName, function(data) {
        _log.log("socketPump", me._dbName);
        me.trigger("serverMessage", data);
    });
}
if(role=="client") {
    socket.on(this._dbName, function(data) {
        me.trigger("clientMessage", data);
    });
}

```



   
    
## trait events

The class has following internal singleton variables:
        
        
### <a name="_on"></a>::on(en, ef)
`en` Event name
 

Binds event name to event function
```javascript
if(!this._ev) this._ev = {};
if(!this._ev[en]) this._ev[en] = [];

this._ev[en].push(ef);

return this;
```

### <a name="_trigger"></a>::trigger(en, data, fn)

triggers event with data and optional function
```javascript

if(!this._ev) return;
if(!this._ev[en]) return;
var me = this;
this._ev[en].forEach( function(cb) { cb(me, data, fn) } );    
return this;
```


    
    
    
## trait _dataTrait

The class has following internal singleton variables:
        
* _eventOn
        
* _commands
        
        
### <a name="_dataTrait_guid"></a>_dataTrait::guid(t)


```javascript

return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);

```

### <a name="_dataTrait_isArray"></a>_dataTrait::isArray(t)


```javascript
return Object.prototype.toString.call( t ) === '[object Array]';
```

### <a name="_dataTrait_isFunction"></a>_dataTrait::isFunction(fn)


```javascript
return Object.prototype.toString.call(fn) == '[object Function]';
```

### <a name="_dataTrait_isObject"></a>_dataTrait::isObject(t)


```javascript
return t === Object(t);
```


    
    


   
      
    
      
    



      
    
      
            
# Class later


The class has following internal singleton variables:
        
* _initDone
        
* _callers
        
* _oneTimers
        
* _everies
        
* _framers
        
        
### <a name="later_add"></a>later::add(fn, thisObj, args)


```javascript
if(thisObj || args) {
   var tArgs;
   if( Object.prototype.toString.call( args ) === '[object Array]' ) {
       tArgs = args;
   } else {
       tArgs = Array.prototype.slice.call(arguments, 2);
       if(!tArgs) tArgs = [];
   }
   _callers.push([thisObj, fn, tArgs]);   
} else {
    _callers.push(fn);
}
```

### <a name="later_asap"></a>later::asap(fn)


```javascript
this.add(fn);

```

### <a name="later_every"></a>later::every(seconds, fn, name)


```javascript

if(!name) {
    name = "time"+(new Date()).getTime()+Math.random(10000000);
}

_everies[name] = {
    step : Math.floor(seconds * 1000),
    fn : fn,
    nextTime : 0
};
```

### later::constructor( interval, fn )

```javascript
if(!_initDone) {

   var frame, cancelFrame;
   
   this.polyfill();
 
   if(typeof(window) != "undefined") {
       var frame = window['requestAnimationFrame'], 
           cancelFrame= window['cancelRequestAnimationFrame'];
       ['', 'ms', 'moz', 'webkit', 'o'].forEach( function(x) { 
           if(!frame) {
            frame = window[x+'RequestAnimationFrame'];
            cancelFrame = window[x+'CancelAnimationFrame'] 
                                       || window[x+'CancelRequestAnimationFrame'];
           }
        });
   }
 
    if (!frame)
        frame= function(cb) {
            return setTimeout(cb, 16);
        };
 
    if (!cancelFrame)
        cancelFrame = function(id) {
            clearTimeout(id);
        };    
        
    _callers = [];
    _oneTimers = {};
    _everies = {};
    _framers = [];
    var lastMs = 0;
    
    var _callQueQue = function() {
       var ms = (new Date()).getTime();
       var fn;
       while(fn=_callers.shift()) {
          if(Object.prototype.toString.call( fn ) === '[object Array]' ) {
              fn[1].apply(fn[0], fn[2]);
          } else {
              fn();
          }
           
       }
       
       for(var i=0; i<_framers.length;i++) {
           var fFn = _framers[i];
           fFn();
       }
       
       for(var n in _oneTimers) {
           if(_oneTimers.hasOwnProperty(n)) {
               var v = _oneTimers[n];
               v[0](v[1]);
               delete _oneTimers[n];
           }
       }
       
       for(var n in _everies) {
           if(_everies.hasOwnProperty(n)) {
               var v = _everies[n];
               if(v.nextTime < ms) {
                   v.fn();
                   v.nextTime = ms + v.step;
               }
               if(v.until) {
                   if(v.until < ms) {
                       delete _everies[n];
                   }
               }
           }
       }       
       
       frame(_callQueQue);
       lastMs = ms;
    };
    _callQueQue();
    _initDone = true;
}
```
        
### <a name="later_once"></a>later::once(key, fn, value)


```javascript
// _oneTimers

_oneTimers[key] = [fn,value];
```

### <a name="later_onFrame"></a>later::onFrame(fn)


```javascript

_framers.push(fn);
```

### <a name="later_polyfill"></a>later::polyfill(t)


```javascript
// --- let's not ---
```

### <a name="later_removeFrameFn"></a>later::removeFrameFn(fn)


```javascript

var i = _framers.indexOf(fn);
if(i>=0) {
    if(fn._onRemove) {
        fn._onRemove();
    }
    _framers.splice(i,1);
    return true;
} else {
    return false;
}
```



   


   



      
    
      
            
# Class _serverSocketWrap


The class has following internal singleton variables:
        
* _channelIndex
        
* _rootData
        
* _rooms
        
* _socketRooms
        
        
### <a name="_serverSocketWrap_delegateToRoom"></a>_serverSocketWrap::delegateToRoom(roomName, name, data)


```javascript

var realRoomName = this._roomPrefix+":"+roomName;

if(_rooms && _rooms[realRoomName]) {
    var me = this;
    _rooms[realRoomName].forEach( function(socket) {
        if(socket != me ) {
            socket.emit( name, data );
        }
    })
}
```

### <a name="_serverSocketWrap_disconnect"></a>_serverSocketWrap::disconnect(t)


```javascript
var me = this;
me._disconnected = true;

console.log("_serverSocketWrap disconnecting");

me.leaveFromRooms();
console.log("_serverSocketWrap left from rooms");
me.trigger("disconnect", me);
// Then remove the socket from the listeners...
me._disconnected = true;

// TODO: check if the code below could be defined in a cross-platform way
/*
var dbName = this._tcp._dbName;
if(typeof(_localDB) != "undefined") {
    _localDB().clearDatabases( function(d) {
        if(d.name==dbName) return true;
    });
}
*/

return;
```

### <a name="_serverSocketWrap_emit"></a>_serverSocketWrap::emit(name, value)


```javascript

this._tcp.messageFrom({
    name : name,
    data : value
});
```

### <a name="_serverSocketWrap_getId"></a>_serverSocketWrap::getId(t)


```javascript
return this._tcp._socketId;
```

### <a name="_serverSocketWrap_getUserId"></a>_serverSocketWrap::getUserId(t)


```javascript

return this._userId;
```

### <a name="_serverSocketWrap_getUserRoles"></a>_serverSocketWrap::getUserRoles(t)


```javascript

return this._roles;
```

### _serverSocketWrap::constructor( tcpEmu, server, isReal )
The _serverSocketWrap is wrapper for the real server side socket functionality.
```javascript

var me = this;
this._roomPrefix = server.getPrefix();
this._server = server;
this._tcp = tcpEmu;

tcpEmu.on("disconnect", function() {
    console.log("tcpEmu sent disconnect");
    me.disconnect();
});

var disconnected = false;
tcpEmu.on("serverMessage", function(o,v) {
    
    if(me._disconnected) return; // not good enough
    
    if(v.disconnect) {
        me.disconnect();
        return;
    }    
    if(v._callBackId) {
        me.trigger(v.name, v.data, function(data) {
            me.emit(v._callBackId, data);
        });
    } else {
        me.trigger(v.name, v.data);
    }
})

this.broadcast = {
    to : function(room) {
        return {
            emit : function(name, value ) {
                me.delegateToRoom( room, name, value );
            }
        }
    }
}

/*
socket.broadcast.to(_ctx.channelId).emit('ctxupd_'+_ctx.channelId, cObj);
*/

```
        
### <a name="_serverSocketWrap_isConnected"></a>_serverSocketWrap::isConnected(t)


```javascript
if(this._disconnected) return false;
return true;
```

### <a name="_serverSocketWrap_isInRoom"></a>_serverSocketWrap::isInRoom(roomName)


```javascript
if(!_socketRooms) return false;
return _socketRooms[this.getId()].indexOf(roomName) >= 0;
```

### <a name="_serverSocketWrap_join"></a>_serverSocketWrap::join(roomName)

Adds a new client to some room
```javascript

var realRoomName = this._roomPrefix+":"+roomName;

if(!_rooms) _rooms = {};
if(!_rooms[realRoomName]) _rooms[realRoomName] = [];

if(_rooms[realRoomName].indexOf(this) < 0 ) {
    _rooms[realRoomName].push(this);
    if(!_socketRooms) _socketRooms = {};
    if(!_socketRooms[this.getId()]) _socketRooms[this.getId()] = [];
    
    _socketRooms[this.getId()].push(roomName);
}

```

### <a name="_serverSocketWrap_leave"></a>_serverSocketWrap::leave(roomName)


```javascript

var realRoomName = this._roomPrefix+":"+roomName;

if(!_rooms) _rooms = {};
if(!_rooms[realRoomName]) _rooms[realRoomName] = [];

var i;
if( ( i = _rooms[realRoomName].indexOf(this) ) >= 0 ) {
    _rooms[realRoomName].splice(i,1);
    var id = this.getId();
    
    var i2 = _socketRooms[id].indexOf( roomName );
    if(i2>=0) _socketRooms[id].splice(i2,1);
}


```

### <a name="_serverSocketWrap_leaveFromRooms"></a>_serverSocketWrap::leaveFromRooms(socket)


```javascript
var id = this.getId();
var me = this;

if(!_socketRooms) return;
if(!_socketRooms[id]) return;

_socketRooms[id].forEach( function(name) {
    me.leave(name); 
});
```

### <a name="_serverSocketWrap_removeListener"></a>_serverSocketWrap::removeListener(t)


```javascript
// TODO: not implemented yet
```

### <a name="_serverSocketWrap_setAuthInfo"></a>_serverSocketWrap::setAuthInfo(userId, roles)

Each socket can have and in many implementations must have some userID and role, which can be used together with the ACL implementations.
```javascript

this._userId = userId;
this._roles = roles;
```

### <a name="_serverSocketWrap_to"></a>_serverSocketWrap::to(roomName)


```javascript

var realRoomName = this._roomPrefix+":"+roomName;

return {
    emit : function(name, data) {
        console.log(" emit called ");
        if(_rooms && _rooms[realRoomName]) {
            _rooms[realRoomName].forEach( function(socket) {
                console.log(" emit with ", name, data);
                socket.emit( name, data );
            })        
        }
    }
}
```



   
    
## trait events

The class has following internal singleton variables:
        
        
### <a name="_on"></a>::on(en, ef)
`en` Event name
 

Binds event name to event function
```javascript
if(!this._ev) this._ev = {};
if(!this._ev[en]) this._ev[en] = [];

this._ev[en].push(ef);

return this;
```

### <a name="_trigger"></a>::trigger(en, data, fn)

triggers event with data and optional function
```javascript

if(!this._ev) return;
if(!this._ev[en]) return;
var me = this;
this._ev[en].forEach( function(cb) { cb( data, fn) } );    
return this;
```


    
    


   
      
    



      
    



      
    
      
            
# Class nfs4_acl


The class has following internal singleton variables:
        
        
### <a name="nfs4_acl_addPermission"></a>nfs4_acl::addPermission(obj, flags)


```javascript

for(var i=0; i<flags.length;i++) {
    var permission = flags[i];
    if( obj.permissions.indexOf( permission ) < 0 ) 
        obj.permissions += permission;
}
```

### <a name="nfs4_acl_allowGroup"></a>nfs4_acl::allowGroup(groupName, flag)


```javascript
var did = false, me = this;
this.map( function(o) {
        if(o.principal==groupName && ! ( o.flags.indexOf("g") >= 0)) {
            if(o.type=="A") {
                did = true;
                me.addPermission( o, flag);
            }
            if(o.type=="D") {
                me.removePermission( o, flag);
            }            
        }
        return o;
    });
    
if(!did) {
    this.push("A:g:"+groupName+":"+flag);
}
```

### <a name="nfs4_acl_allowUser"></a>nfs4_acl::allowUser(username, flag)


```javascript

var did = false, me = this;
this.map( function(o) {
        if(o.principal==username && !( o.flags.indexOf("g") >= 0)) {
            if(o.type=="A") {
                did = true;
                me.addPermission( o, flag);
            }
            if(o.type=="D") {
                me.removePermission( o, flag);
            }            
        }
        return o;
    });
    
if(!did) {
    this.push("A::"+username+":"+flag);
}


```

### <a name="nfs4_acl_denyGroup"></a>nfs4_acl::denyGroup(groupName, flag)


```javascript
var did = false, me = this;
this.map( function(o) {
        if(o.principal==groupName && ! ( o.flags.indexOf("g") >= 0)) {
            did = true;
            if(o.type=="A") {
                me.removePermission( o, flag);
            }
            if(o.type=="D") {
                me.addPermission( o, flag);
            }            
        }
        return o;
    });
    
if(!did) {
    this.push("D:g:"+groupName+":"+flag);
}
```

### <a name="nfs4_acl_denyUser"></a>nfs4_acl::denyUser(username, flag)


```javascript

var did = false, me = this;
this.map( function(o) {
        if(o.principal==username && ! ( o.flags.indexOf("g") >= 0)) {
            
            if(o.type=="A") {
                me.removePermission( o, flag);
            }
            if(o.type=="D") {
                did = true;
                me.addPermission( o, flag);
            }            
        }
        return o;
    });
    
if(!did) {
    this.push("D::"+username+":"+flag);
}

```

### <a name="nfs4_acl_filter"></a>nfs4_acl::filter(fn)


```javascript
var list = this._acl.split("\n");
list.filter(fn);
this._acl = list.join("\n");

return this;
```

### <a name="nfs4_acl_find"></a>nfs4_acl::find(username, rolename, rule)


```javascript
return this.has( username, rolename, rule);
```

### <a name="nfs4_acl_fromObject"></a>nfs4_acl::fromObject(obj)


```javascript
return obj.type+":"+obj.flags+":"+obj.principal+":"+obj.permissions;
```

### <a name="nfs4_acl_getACL"></a>nfs4_acl::getACL(t)


```javascript
return this._acl;
```

### <a name="nfs4_acl_has"></a>nfs4_acl::has(username, rolename, rule)


```javascript

var i=0, line_i = 0, type_i=0, length = this._acl.length;

var type, flags, principal, permissions, flag, bGroup = false, 
    uni=0, uni_match = false, uni_failed=false, mCnt=0, mokCnt=0, ignore_line = false;
    
/*
A::OWNER@:rwatTnNcCy
A::alice@nfsdomain.org:rxtncy
A::bob@nfsdomain.org:rwadtTnNcCy
A:g:GROUP@:rtncy
D:g:GROUP@:waxTC
*/

while(i < length) {
    
    if(this._acl.charAt(i)==":") {
        line_i++;
        type_i++;
        i++;
        continue;
    }
    if( this._acl.charAt(i) == "\n" ) {
        line_i = 0;
        type_i = 0;
        i++;
        continue;        
    }    
    
    if( line_i==0 ) {
        
        if(mokCnt > 0 && ( rule.length == mokCnt)) {
            if(type=="A") return true;
            if(type=="D") return false;
        }        
        
        ignore_line = false;
        type = this._acl.charAt(i);
        line_i++;
        i++;
        uni_match = false;
        uni_failed = false;
        uni=0;
        mCnt=0;
        mokCnt=0
        bGroup = false;
        continue;
    }
    if(type_i==1) {
        flag = this._acl.charAt(i);
        if(flag=="g") bGroup = true;
        if(flag=="i") ignore_line = true;
        line_i++;
        i++;
        continue;
    }
    if(type_i==2) {
        if(bGroup) {
            if( this._acl.charAt(i) == rolename.charAt( uni++ ) ) {
                uni_match = true;
            } else {
                uni_match = false;
                uni_failed = true;
            }
        } else {
            if( this._acl.charAt(i) == username.charAt( uni++ ) ) {
                uni_match = true;
            } else {
                uni_match = false;
                uni_failed = true;
            }
        }
        line_i++;
        i++;
        continue;
    }    
    if(type_i==3) {
        if(uni_match && !uni_failed && !ignore_line) {
            if( rule.indexOf( this._acl.charAt(i) ) >= 0 ) {
                //if(type=="A") return true;
                //if(type=="D") return false;
                mokCnt++;
            }
        }
        line_i++;
        i++;
        continue;        
    }
    line_i++;
    i++;    
}

if(mokCnt > 0 && ( rule.length == mokCnt)) {
    if(type=="A") return true;
    if(type=="D") return false;
}  
return false;

```

### nfs4_acl::constructor( aclFile )
Initialize the ACL with new file
```javascript
this._acl = aclFile.trim();

// type:flags:principal:permissions
// Types : A, D, U, L

/*
A principal is either a named user (e.g., 'myuser@nfsdomain.org') or group (provided the group flag is also set), 
or one of three special principals: 'OWNER@', 'GROUP@', and 'EVERYONE@', which are, respectively, analogous to the 
POSIX user/group/other distinctions used in, e.g., chmod(1).
*/
```
        
### <a name="nfs4_acl_map"></a>nfs4_acl::map(fn)


```javascript

if(this._acl.length==0) return this;

var list = this._acl.split("\n");
var newList = list.map(this.toObject).map(fn).map(this.fromObject);
this._acl = newList.join("\n").trim();
return this;

```

### <a name="nfs4_acl_push"></a>nfs4_acl::push(line)


```javascript

var len = this._acl.length;

if( (len == 0) || this._acl.charAt(len-1)=="\n") {
    this._acl += line;
} else {
    this._acl += "\n"+line;
}

this._acl = this._acl.trim();
```

### <a name="nfs4_acl_reduce"></a>nfs4_acl::reduce(fn, initialValue)


```javascript
var list = this._acl.split("\n");
list.reduce(fn, initialValue);
this._acl = list.join("\n");

return this;
```

### <a name="nfs4_acl_removeAll"></a>nfs4_acl::removeAll(t)


```javascript
this._acl = "";
```

### <a name="nfs4_acl_removePermission"></a>nfs4_acl::removePermission(obj, flags)


```javascript

for(var i=0; i<flags.length;i++) {
    var permission = flags[i];
    if( obj.permissions.indexOf( permission ) >= 0 ) {
        obj.permissions = obj.permissions.replace(permission, "");
    }
}


```

### <a name="nfs4_acl_replaceLines"></a>nfs4_acl::replaceLines(fn)


```javascript

var list = this._acl.split("\n");

for(var i=0; i<list.length;i++) {
    var n = fn(list[i]);
    if(n) list[i] = n;
}

```

### <a name="nfs4_acl_toObject"></a>nfs4_acl::toObject(line)


```javascript
/*
A::OWNER@:rwatTnNcCy
A::alice@nfsdomain.org:rxtncy
A::bob@nfsdomain.org:rwadtTnNcCy
A:g:GROUP@:rtncy
D:g:GROUP@:waxTC
*/

var obj = {};
if(!line) return obj;

var parts = line.split(":");
// var type, flags, principal, permissions,
if(line.length>0) {
    obj.type = line.charAt(0);
    obj.flags = parts[1];
    obj.principal = parts[2];
    obj.permissions = parts[3];
}
return obj;
```



   


   



      
    
      
            
# Class authModule


The class has following internal singleton variables:
        
        
### authModule::constructor( options )

```javascript

```
        


   
    
    
    
    
    
## trait _dataTrait

The class has following internal singleton variables:
        
        
### <a name="_dataTrait_guid"></a>_dataTrait::guid(t)


```javascript

return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);

```

### <a name="_dataTrait_isArray"></a>_dataTrait::isArray(t)


```javascript
return Object.prototype.toString.call( t ) === '[object Array]';
```

### <a name="_dataTrait_isFunction"></a>_dataTrait::isFunction(fn)


```javascript
return Object.prototype.toString.call(fn) == '[object Function]';
```

### <a name="_dataTrait_isObject"></a>_dataTrait::isObject(t)


```javascript

return t === Object(t);
```


    
    
    
    
    
    


   
      
            
# Class later


The class has following internal singleton variables:
        
* _initDone
        
* _callers
        
* _oneTimers
        
* _everies
        
* _framers
        
        
### <a name="later_add"></a>later::add(fn, thisObj, args)


```javascript
if(thisObj || args) {
   var tArgs;
   if( Object.prototype.toString.call( args ) === '[object Array]' ) {
       tArgs = args;
   } else {
       tArgs = Array.prototype.slice.call(arguments, 2);
       if(!tArgs) tArgs = [];
   }
   _callers.push([thisObj, fn, tArgs]);   
} else {
    _callers.push(fn);
}
```

### <a name="later_asap"></a>later::asap(fn)


```javascript
this.add(fn);

```

### <a name="later_every"></a>later::every(seconds, fn, name)


```javascript

if(!name) {
    name = "time"+(new Date()).getTime()+Math.random(10000000);
}

_everies[name] = {
    step : Math.floor(seconds * 1000),
    fn : fn,
    nextTime : 0
};
```

### later::constructor( interval, fn )

```javascript
if(!_initDone) {

   var frame, cancelFrame;
   
   this.polyfill();
 
   if(typeof(window) != "undefined") {
       var frame = window['requestAnimationFrame'], 
           cancelFrame= window['cancelRequestAnimationFrame'];
       ['', 'ms', 'moz', 'webkit', 'o'].forEach( function(x) { 
           if(!frame) {
            frame = window[x+'RequestAnimationFrame'];
            cancelFrame = window[x+'CancelAnimationFrame'] 
                                       || window[x+'CancelRequestAnimationFrame'];
           }
        });
   }
 
    if (!frame)
        frame= function(cb) {
            return setTimeout(cb, 16);
        };
 
    if (!cancelFrame)
        cancelFrame = function(id) {
            clearTimeout(id);
        };    
        
    _callers = [];
    _oneTimers = {};
    _everies = {};
    _framers = [];
    var lastMs = 0;
    
    var _callQueQue = function() {
       var ms = (new Date()).getTime();
       var fn;
       while(fn=_callers.shift()) {
          if(Object.prototype.toString.call( fn ) === '[object Array]' ) {
              fn[1].apply(fn[0], fn[2]);
          } else {
              fn();
          }
           
       }
       
       for(var i=0; i<_framers.length;i++) {
           var fFn = _framers[i];
           fFn();
       }
       
       for(var n in _oneTimers) {
           if(_oneTimers.hasOwnProperty(n)) {
               var v = _oneTimers[n];
               v[0](v[1]);
               delete _oneTimers[n];
           }
       }
       
       for(var n in _everies) {
           if(_everies.hasOwnProperty(n)) {
               var v = _everies[n];
               if(v.nextTime < ms) {
                   v.fn();
                   v.nextTime = ms + v.step;
               }
               if(v.until) {
                   if(v.until < ms) {
                       delete _everies[n];
                   }
               }
           }
       }       
       
       frame(_callQueQue);
       lastMs = ms;
    };
    _callQueQue();
    _initDone = true;
}
```
        
### <a name="later_once"></a>later::once(key, fn, value)


```javascript
// _oneTimers

_oneTimers[key] = [fn,value];
```

### <a name="later_onFrame"></a>later::onFrame(fn)


```javascript

_framers.push(fn);
```

### <a name="later_polyfill"></a>later::polyfill(t)


```javascript
// --- let's not ---
```

### <a name="later_removeFrameFn"></a>later::removeFrameFn(fn)


```javascript

var i = _framers.indexOf(fn);
if(i>=0) {
    if(fn._onRemove) {
        fn._onRemove();
    }
    _framers.splice(i,1);
    return true;
} else {
    return false;
}
```



   


   



      
    
      
            
# Class _promise


The class has following internal singleton variables:
        
        
### <a name="_promise_all"></a>_promise::all(firstArg)


```javascript

var args;
if(this.isArray(firstArg)) {
  args = firstArg;
} else {
  args = Array.prototype.slice.call(arguments, 0);
}
// console.log(args);
var targetLen = args.length,
    rCnt = 0,
    myPromises = [],
    myResults = new Array(targetLen);
    
return this.then(
    function() {
 
        var allPromise = _promise();
        if(args.length==0) {
            allPromise.resolve([]);
        }
        args.forEach( function(b, index) {
            if(b.then) {
                // console.log("All, looking for ", b, " state = ", b._state);
                myPromises.push(b);
                
                b.then(function(v) {
                    myResults[index] = v;
                    rCnt++;
                    if(rCnt==targetLen) {

                        allPromise.resolve(myResults);
                    }
                }, function(v) {
                    allPromise.reject(v);
                });
                
            } else {
                allPromise.reject("Not list of promises");
            }
        })
        
        return allPromise;
        
    });



    

```

### <a name="_promise_collect"></a>_promise::collect(collectFn, promiseList, results)


```javascript

var args;
if(this.isArray(promiseList)) {
  args = promiseList;
} else {
  args = [promiseList];
}

// console.log(args);
var targetLen = args.length,
    isReady = false,
    noMore = false,
    rCnt = 0,
    myPromises = [],
    myResults = results || {};
    
return this.then(
    function() {
 
        var allPromise = _promise();
        args.forEach( function(b, index) {
            if(b.then) {
                // console.log("All, looking for ", b, " state = ", b._state);
                myPromises.push(b);
                
                b.then(function(v) {
                    rCnt++;
                    isReady = collectFn(v, myResults);
                    if( (isReady && !noMore) || (noMore==false && targetLen == rCnt) ) {
                        allPromise.resolve(myResults);
                        noMore = true;
                    }
                }, function(v) {
                    allPromise.reject(v);
                });
                
            } else {
                allPromise.reject("Not list of promises");
            }
        })
        
        return allPromise;
        
    });

```

### <a name="_promise_fail"></a>_promise::fail(fn)


```javascript
return this.then(null, fn);
```

### <a name="_promise_fulfill"></a>_promise::fulfill(withValue)


```javascript
// if(this._fulfilled || this._rejected) return;

if(this._rejected) return;
if(this._fulfilled && withValue != this._stateValue) {
    return;
}

var me = this;
this._fulfilled = true;
this._stateValue = withValue;

var chCnt = this._childPromises.length;

while(chCnt--) {
    var p = this._childPromises.shift();
    if(p._onFulfill) {
        try {
            var x = p._onFulfill(withValue);
            // console.log("Returned ",x);
            if(typeof(x)!="undefined") {
                p.resolve(x);
            } else {
                p.fulfill(withValue);
            }
        } catch(e) {
            // console.error(e);
            /*
                If either onFulfilled or onRejected throws an exception e, promise2 
                must be rejected with e as the reason.            
            */
            p.reject(e);
        }
    } else {
        /*
            If onFulfilled is not a function and promise1 is fulfilled, promise2 must be 
            fulfilled with the same value as promise1        
        */
        p.fulfill(withValue);
    }
};
// this._childPromises.length = 0;
this._state = 1;
this.triggerStateChange();

```

### _promise::constructor( onFulfilled, onRejected )

```javascript
// 0 = pending
// 1 = fullfilled
// 2 = error

this._state = 0;
this._stateValue = null;
this._isAPromise = true;
this._childPromises = [];

if(this.isFunction(onFulfilled))
    this._onFulfill = onFulfilled;
if(this.isFunction(onRejected))
    this._onReject = onRejected;
    
if(!onRejected && this.isFunction(onFulfilled) ) {

    var me = this;
    later().asap(
        function() {
            onFulfilled( function(v) {
                me.resolve(v)
            }, function(v) {
                me.reject(v);
            });           
        });
 
}
```
        
### <a name="_promise_isFulfilled"></a>_promise::isFulfilled(t)


```javascript
return this._state == 1;
```

### <a name="_promise_isPending"></a>_promise::isPending(t)


```javascript
return this._state == 0;
```

### <a name="_promise_isRejected"></a>_promise::isRejected(v)


```javascript
return this._state == 2;
```

### <a name="_promise_onStateChange"></a>_promise::onStateChange(fn)


```javascript

if(!this._listeners)
    this._listeners = [];

this._listeners.push(fn);
```

### <a name="_promise_reject"></a>_promise::reject(withReason)


```javascript

// if(this._rejected || this._fulfilled) return;

// conso

if(this._fulfilled) return;
if(this._rejected && withReason != this._rejectReason) return;


this._state = 2;
this._rejected = true;
this._rejectReason = withReason;
var me = this;

var chCnt = this._childPromises.length;
while(chCnt--) {
    var p = this._childPromises.shift();

    if(p._onReject) {
        try {
            p._onReject(withReason);
            p.reject(withReason);
        } catch(e) {
            /*
                If either onFulfilled or onRejected throws an exception e, promise2 
                must be rejected with e as the reason.            
            */
            p.reject(e);
        }
    } else {
        /*
            If onFulfilled is not a function and promise1 is fulfilled, promise2 must be 
            fulfilled with the same value as promise1        
        */
        p.reject(withReason);
    }
};

// this._childPromises.length = 0;
this.triggerStateChange();

```

### <a name="_promise_rejectReason"></a>_promise::rejectReason(reason)


```javascript
if(reason) {
    this._rejectReason = reason;
    return;
}
return this._rejectReason;
```

### <a name="_promise_resolve"></a>_promise::resolve(x)


```javascript

// console.log("Resolving ", x);

// can not do this many times...
if(this._state>0) return;

if(x==this) {
    // error
    this._rejectReason = "TypeError";
    this.reject(this._rejectReason);
    return;
}

if(this.isObject(x) && x._isAPromise) {
    
    // 
    this._state = x._state;
    this._stateValue = x._stateValue;
    this._rejectReason = x._rejectReason;
    // ... 
    if(this._state===0) {
        var me = this;
        x.onStateChange( function() {
            if(x._state==1) {
                // console.log("State change");
                me.resolve(x.value());
            } 
            if(x._state==2) {
                me.reject(x.rejectReason());                
            }
        });
    }
    if(this._state==1) {
        // console.log("Resolved to be Promise was fulfilled ", x._stateValue);
        this.fulfill(this._stateValue);    
    }
    if(this._state==2) {
        // console.log("Relved to be Promise was rejected ", x._rejectReason);
        this.reject(this._rejectReason);
    }
    return;
}
if(this.isObject(x) && x.then && this.isFunction(x.then)) {
    // console.log("Thenable ", x);
    var didCall = false;
    try {
        // Call the x.then
        var  me = this;
        x.then.call(x, 
            function(y) {
                if(didCall) return;
                // we have now value for the promise...
                // console.log("Got value from Thenable ", y);
                me.resolve(y);
                didCall = true;
            },
            function(r) {
                if(didCall) return;
                // console.log("Got reject from Thenable ", r);
                me.reject(r);
                didCall = true;
            });
    } catch(e) {
        if(!didCall) this.reject(e);
    }
    return;    
}
this._state = 1;
this._stateValue = x;

// fulfill the promise...
this.fulfill(x);

```

### <a name="_promise_state"></a>_promise::state(newState)


```javascript
if(typeof(newState)!="undefined") {
    this._state = newState;
}
return this._state;
```

### <a name="_promise_then"></a>_promise::then(onFulfilled, onRejected)


```javascript

if(!onRejected) onRejected = function() {};

var p = new _promise(onFulfilled, onRejected);
var me = this;

if(this._state==1) {
    later().asap( function() {
        me.fulfill(me.value());
    });
}
if(this._state==2) {
    later().asap( function() {
        me.reject(me.rejectReason());
    });
}
this._childPromises.push(p);
return p;



```

### <a name="_promise_triggerStateChange"></a>_promise::triggerStateChange(t)


```javascript
var me = this;
if(!this._listeners) return;
this._listeners.forEach( function(fn) {
    fn(me); 
});
// one-timer
this._listeners.length = 0;
```

### <a name="_promise_value"></a>_promise::value(v)


```javascript
if(typeof(v)!="undefined") {
    this._stateValue = v;
    return this;
}
return this._stateValue;
```



   
    
## trait util_fns

The class has following internal singleton variables:
        
        
### <a name="util_fns_isArray"></a>util_fns::isArray(someVar)


```javascript
return Object.prototype.toString.call( someVar ) === '[object Array]';
```

### <a name="util_fns_isFunction"></a>util_fns::isFunction(fn)


```javascript
return Object.prototype.toString.call(fn) == '[object Function]';
```

### <a name="util_fns_isObject"></a>util_fns::isObject(obj)


```javascript
return obj === Object(obj);
```


    
    


   
      
    



      
    
      
    
      
            
# Class authFuzz


The class has following internal singleton variables:
        
        
### <a name="authFuzz__getGroupNames"></a>authFuzz::_getGroupNames(list, ignoreGroups)


```javascript
var orig = _promise(),
    reader = orig,
    res = [],
    folder = this._groups;

list.forEach( function(id) {

   if(ignoreGroups.indexOf(id)>=0) {
       res.push({
           id : id,
           name : id
       });
       return;
   }

   reader = reader.then( function() {
        return folder.readFile(id);    
   }).then( function(groupName) {
       res.push({
           id : id,
           name : groupName
       });
       return res;
   }).fail( function(m) {
       console.error("Error reading group index with "+m+" FOR "+id);
   })
});    
reader = reader.then( function() {
    return res;
});
orig.resolve(true);

return reader;
```

### <a name="authFuzz_addUserToGroup"></a>authFuzz::addUserToGroup(userId, groupName)


```javascript
var me = this;
var udata = me._udata;

return _promise(
    function(result) {
        udata.readFile(userId).then( function(jsonData) {

            var data = JSON.parse( jsonData );

            if(data.groups.indexOf(groupName) < 0 )
                data.groups.push( groupName );

            return udata.writeFile(userId, JSON.stringify(data));

        }).then( function() {
            result( { result : true, text : "User added to the group"});  
        });
    });
```

### <a name="authFuzz_changePassword"></a>authFuzz::changePassword(userId, newPassword)


```javascript
var local = this._users, me = this;
var udata = me._udata;

return _promise(
    function(result) {
        udata.readFile(userId).then( function(jsonData) {
            var data = JSON.parse( jsonData );
            // me.hash(password)+":"+id+":"+domain
            return local.writeFile( data.hash, me.hash(newPassword)+":"+userId+":"+data.domain );
        }).then( function() {
            result({result : true, text:"Password changed"});
        }).fail( function() {
            result( [] );  
        });
    });
```

### <a name="authFuzz_changeUsername"></a>authFuzz::changeUsername(userId, newUsername, newDomain)


```javascript
var local = this._users, me = this;
var udata = me._udata;

return _promise(
    function(result) {
        var hashData, data, newHash, domain;
        udata.readFile(userId).then( function(jsonData) {
            data = JSON.parse( jsonData );
            // me.hash(password)+":"+id+":"+domain
            domain = newDomain || data.domain;
            return local.readFile( data.hash );
        }).then( function(oldData) {
            hashData = oldData;
            if(hashData) {
                return local.removeFile( data.hash );
            }
        }).then( function() {
            if(hashData) {
                newHash = me.hash( newUsername+":"+domain );
                return local.writeFile( newHash, hashData );
            }
        }).then( function() {
            if(hashData) {
                data.hash = newHash;
                data.userName = newUsername;
                data.domain = domain;
                return udata.writeFile(userId,JSON.stringify( data) );
            } 
        }).then( function() {
            if(hashData) {
                result({result:true, text: "Username changed"});
            } else {
                result({result:false, text: "Could not change the username"});
            }
        }).fail( function() {
            result( {result:false, text: "Could not change the username"} );  
        });
    });
```

### <a name="authFuzz_createUser"></a>authFuzz::createUser(userName, password, id, domain)


```javascript
// username is used to find the user based on the username...
// userID should be

domain = domain || "";
if(!id) id = this.guid();

var userHash = this.hash( userName+":"+domain );
var me = this;

// store user information into object, which is serialized
var userData = {
    userName : userName,
    domain   : domain,
    hash     : userHash,
    groups   : []
};

return _promise(
    function(result) {
        me.then(
            function() {
                var local = me._users;
                var udata = me._udata;
                
                local.isFile(userHash).then( function(is_file) {
                    if(!is_file) {
                        local.writeFile(userHash, me.hash(password)+":"+id+":"+domain)
                            .then( function() {
                                return udata.writeFile(id, JSON.stringify( userData) );
                            })
                            .then( function() {
                                result( { result : true, userId : id} );
                            });       
                    } else {
                        local.readFile(userHash).then(
                            function(data) {
                                var parts = data.split(":");
                                result( { result : true, userId : parts[1]} );
                            });
                        
                    }
                })
                

            });
    });
```

### <a name="authFuzz_getUserData"></a>authFuzz::getUserData(userId)


```javascript
var me = this;
var udata = me._udata;

return _promise(
    function(result) {
        udata.readFile(userId).then( function(jsonData) {
            var data = JSON.parse( jsonData );
            result(data);
        }).fail( function() {
            result( null );  
        });
    });
```

### <a name="authFuzz_getUserGroups"></a>authFuzz::getUserGroups(userId)


```javascript
var local = this._users, me = this;

// local and udata...
var local = me._users;
var udata = me._udata;

return _promise(
    function(result) {
        udata.readFile(userId).then( function(jsonData) {
            var data = JSON.parse( jsonData );
            result(data.groups);
        }).fail( function() {
            result( [] );  
        });
    });
```

### <a name="authFuzz_hash"></a>authFuzz::hash(value)


```javascript
return _sha3().sha3_256( value + this._salt );
```

### authFuzz::constructor( fileSystem, hashSalt )

```javascript
if(!hashSalt) {
    this._salt = "31337"; // just use some kind of salting if no provided
} else {
    this._salt = hashSalt;
}

this._fs = fileSystem;
var me = this;

this._fs.createDir("users").then( function() {
   return me._fs.createDir("groups");
}).then( function() {
   return me._fs.createDir("domains");
}).then( function() {
   return me._fs.createDir("udata");
}).then( function() {
    me._users    = fileSystem.getFolder("users");
    me._groups   = fileSystem.getFolder("groups");
    me._domains  = fileSystem.getFolder("domains");
    me._udata    = fileSystem.getFolder("udata");
    me.resolve(true);
});

```
        
### <a name="authFuzz_login"></a>authFuzz::login(user, password, domain)


```javascript
var me = this;

if(!domain) domain = "";
var userHash = this.hash( user+":"+domain );

return _promise(
    function(result) {
        me.then(
            function() {
                var local = me._users,
                    udata = me._udata;
                var bOk = false, user_id;
                local.readFile(userHash)
                    .then( function(value) {

                        var parts = value.split(":");
                        var pwHash = parts[0],
                            uid = parts[1];

                        var ok =  ( pwHash == me.hash( password ) );
                        if(ok) {
                            bOk = true;
                            user_id = uid;
                            return udata.readFile(uid);
                            // result( { result : true,  userId : uid,  text : "Login successful"} );
                        } else {
                            // result( { result : false,  text : "Login failed"} );
                        }
                    })
                    .then( function(userData) {
                        if(bOk) {
                            userData = JSON.parse(userData);
                            result( { result : true,  userId : user_id, groups:userData.groups, text : "Login successful"} );
                        } else {
                            result( { result : false,  text : "Login failed"} );
                        }                        
                    })
                    .fail( function() {
                        result( { result : false, text : "Login failed"} );
                    })
            });
    });
```

### <a name="authFuzz_removeUserGroup"></a>authFuzz::removeUserGroup(userId, groupName)


```javascript
var me = this;
var udata = me._udata;

return _promise(
    function(result) {
        // The user ID... file??
        udata.readFile(userId).then( function(jsonData) {

            var data = JSON.parse( jsonData );

            var i = data.groups.indexOf(groupName);
            if(data.groups.indexOf(groupName) >= 0 )
                data.groups.splice(i,1);

            return udata.writeFile(userId, JSON.stringify(data));

        }).then( function() {
            result( { result : true, text : "Removed user from group"});  
        });
    });
```



   
    
## trait _dataTrait

The class has following internal singleton variables:
        
        
### <a name="_dataTrait_guid"></a>_dataTrait::guid(t)


```javascript

return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);

```

### <a name="_dataTrait_isArray"></a>_dataTrait::isArray(t)


```javascript
return Object.prototype.toString.call( t ) === '[object Array]';
```

### <a name="_dataTrait_isFunction"></a>_dataTrait::isFunction(fn)


```javascript
return Object.prototype.toString.call(fn) == '[object Function]';
```

### <a name="_dataTrait_isObject"></a>_dataTrait::isObject(t)


```javascript

return t === Object(t);
```


    
    


   
      
    



      
    
      
            
# Class _sha3


The class has following internal singleton variables:
        
* HEX_CHARS
        
* KECCAK_PADDING
        
* PADDING
        
* SHIFT
        
* RC
        
* blocks
        
* s
        
        
### <a name="_sha3__initSha"></a>_sha3::_initSha(t)


```javascript
if(RC) return;

HEX_CHARS = '0123456789abcdef'.split('');
KECCAK_PADDING = [1, 256, 65536, 16777216];
PADDING = [6, 1536, 393216, 100663296];
SHIFT = [0, 8, 16, 24];
RC = [1, 0, 32898, 0, 32906, 2147483648, 2147516416, 2147483648, 32907, 0, 2147483649,
        0, 2147516545, 2147483648, 32777, 2147483648, 138, 0, 136, 0, 2147516425, 0, 
        2147483658, 0, 2147516555, 0, 139, 2147483648, 32905, 2147483648, 32771, 
        2147483648, 32770, 2147483648, 128, 2147483648, 32778, 0, 2147483658, 2147483648,
        2147516545, 2147483648, 32896, 2147483648, 2147483649, 0, 2147516424, 2147483648];

blocks = [], s = [];
```

### _sha3::constructor( t )

```javascript
this._initSha();
```
        
### <a name="_sha3_keccak"></a>_sha3::keccak(message, bits, padding)


```javascript
var notString = typeof(message) != 'string';
if(notString && message.constructor == root.ArrayBuffer) {
  message = new Uint8Array(message);
}

if(bits === undefined) {
  bits = 512;
  padding = KECCAK_PADDING;
}

var block, code, end = false, index = 0, start = 0, length = message.length,
    n, i, h, l, c0, c1, c2, c3, c4, c5, c6, c7, c8, c9, 
    b0, b1, b2, b3, b4, b5, b6, b7, b8, b9, b10, b11, b12, b13, b14, b15, b16, b17, 
    b18, b19, b20, b21, b22, b23, b24, b25, b26, b27, b28, b29, b30, b31, b32, b33, 
    b34, b35, b36, b37, b38, b39, b40, b41, b42, b43, b44, b45, b46, b47, b48, b49;
var blockCount = (1600 - bits * 2) / 32;
var byteCount = blockCount * 4;

for(i = 0;i < 50;++i) {
  s[i] = 0;
}

block = 0;
do {
  blocks[0] = block;
  for(i = 1;i < blockCount + 1;++i) {
    blocks[i] = 0;
  }
  if(notString) {
    for (i = start;index < length && i < byteCount; ++index) {
      blocks[i >> 2] |= message[index] << SHIFT[i++ & 3];
    }
  } else {
    for (i = start;index < length && i < byteCount; ++index) {
      code = message.charCodeAt(index);
      if (code < 0x80) {
        blocks[i >> 2] |= code << SHIFT[i++ & 3];
      } else if (code < 0x800) {
        blocks[i >> 2] |= (0xc0 | (code >> 6)) << SHIFT[i++ & 3];
        blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
      } else if (code < 0xd800 || code >= 0xe000) {
        blocks[i >> 2] |= (0xe0 | (code >> 12)) << SHIFT[i++ & 3];
        blocks[i >> 2] |= (0x80 | ((code >> 6) & 0x3f)) << SHIFT[i++ & 3];
        blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
      } else {
        code = 0x10000 + (((code & 0x3ff) << 10) | (message.charCodeAt(++index) & 0x3ff));
        blocks[i >> 2] |= (0xf0 | (code >> 18)) << SHIFT[i++ & 3];
        blocks[i >> 2] |= (0x80 | ((code >> 12) & 0x3f)) << SHIFT[i++ & 3];
        blocks[i >> 2] |= (0x80 | ((code >> 6) & 0x3f)) << SHIFT[i++ & 3];
        blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
      }
    }
  }
  start = i - byteCount;
  if(index == length) {
    blocks[i >> 2] |= padding[i & 3];
    ++index;
  }
  block = blocks[blockCount];
  if(index > length && i < byteCount) {
    blocks[blockCount - 1] |= 0x80000000;
    end = true;
  }

  for(i = 0;i < blockCount;++i) {
    s[i] ^= blocks[i];
  }

  for(n = 0; n < 48; n += 2) {
    c0 = s[0] ^ s[10] ^ s[20] ^ s[30] ^ s[40];
    c1 = s[1] ^ s[11] ^ s[21] ^ s[31] ^ s[41];
    c2 = s[2] ^ s[12] ^ s[22] ^ s[32] ^ s[42];
    c3 = s[3] ^ s[13] ^ s[23] ^ s[33] ^ s[43];
    c4 = s[4] ^ s[14] ^ s[24] ^ s[34] ^ s[44];
    c5 = s[5] ^ s[15] ^ s[25] ^ s[35] ^ s[45];
    c6 = s[6] ^ s[16] ^ s[26] ^ s[36] ^ s[46];
    c7 = s[7] ^ s[17] ^ s[27] ^ s[37] ^ s[47];
    c8 = s[8] ^ s[18] ^ s[28] ^ s[38] ^ s[48];
    c9 = s[9] ^ s[19] ^ s[29] ^ s[39] ^ s[49];

    h = c8 ^ ((c2 << 1) | (c3 >>> 31));
    l = c9 ^ ((c3 << 1) | (c2 >>> 31));
    s[0] ^= h;
    s[1] ^= l;
    s[10] ^= h;
    s[11] ^= l;
    s[20] ^= h;
    s[21] ^= l;
    s[30] ^= h;
    s[31] ^= l;
    s[40] ^= h;
    s[41] ^= l;
    h = c0 ^ ((c4 << 1) | (c5 >>> 31));
    l = c1 ^ ((c5 << 1) | (c4 >>> 31));
    s[2] ^= h;
    s[3] ^= l;
    s[12] ^= h;
    s[13] ^= l;
    s[22] ^= h;
    s[23] ^= l;
    s[32] ^= h;
    s[33] ^= l;
    s[42] ^= h;
    s[43] ^= l;
    h = c2 ^ ((c6 << 1) | (c7 >>> 31));
    l = c3 ^ ((c7 << 1) | (c6 >>> 31));
    s[4] ^= h;
    s[5] ^= l;
    s[14] ^= h;
    s[15] ^= l;
    s[24] ^= h;
    s[25] ^= l;
    s[34] ^= h;
    s[35] ^= l;
    s[44] ^= h;
    s[45] ^= l;
    h = c4 ^ ((c8 << 1) | (c9 >>> 31));
    l = c5 ^ ((c9 << 1) | (c8 >>> 31));
    s[6] ^= h;
    s[7] ^= l;
    s[16] ^= h;
    s[17] ^= l;
    s[26] ^= h;
    s[27] ^= l;
    s[36] ^= h;
    s[37] ^= l;
    s[46] ^= h;
    s[47] ^= l;
    h = c6 ^ ((c0 << 1) | (c1 >>> 31));
    l = c7 ^ ((c1 << 1) | (c0 >>> 31));
    s[8] ^= h;
    s[9] ^= l;
    s[18] ^= h;
    s[19] ^= l;
    s[28] ^= h;
    s[29] ^= l;
    s[38] ^= h;
    s[39] ^= l;
    s[48] ^= h;
    s[49] ^= l;

    b0 = s[0];
    b1 = s[1];
    b32 = (s[11] << 4) | (s[10] >>> 28);
    b33 = (s[10] << 4) | (s[11] >>> 28);
    b14 = (s[20] << 3) | (s[21] >>> 29);
    b15 = (s[21] << 3) | (s[20] >>> 29);
    b46 = (s[31] << 9) | (s[30] >>> 23);
    b47 = (s[30] << 9) | (s[31] >>> 23);
    b28 = (s[40] << 18) | (s[41] >>> 14);
    b29 = (s[41] << 18) | (s[40] >>> 14);
    b20 = (s[2] << 1) | (s[3] >>> 31);
    b21 = (s[3] << 1) | (s[2] >>> 31);
    b2 = (s[13] << 12) | (s[12] >>> 20);
    b3 = (s[12] << 12) | (s[13] >>> 20);
    b34 = (s[22] << 10) | (s[23] >>> 22);
    b35 = (s[23] << 10) | (s[22] >>> 22);
    b16 = (s[33] << 13) | (s[32] >>> 19);
    b17 = (s[32] << 13) | (s[33] >>> 19);
    b48 = (s[42] << 2) | (s[43] >>> 30);
    b49 = (s[43] << 2) | (s[42] >>> 30);
    b40 = (s[5] << 30) | (s[4] >>> 2);
    b41 = (s[4] << 30) | (s[5] >>> 2);
    b22 = (s[14] << 6) | (s[15] >>> 26);
    b23 = (s[15] << 6) | (s[14] >>> 26);
    b4 = (s[25] << 11) | (s[24] >>> 21);
    b5 = (s[24] << 11) | (s[25] >>> 21);
    b36 = (s[34] << 15) | (s[35] >>> 17);
    b37 = (s[35] << 15) | (s[34] >>> 17);
    b18 = (s[45] << 29) | (s[44] >>> 3);
    b19 = (s[44] << 29) | (s[45] >>> 3);
    b10 = (s[6] << 28) | (s[7] >>> 4);
    b11 = (s[7] << 28) | (s[6] >>> 4);
    b42 = (s[17] << 23) | (s[16] >>> 9);
    b43 = (s[16] << 23) | (s[17] >>> 9);
    b24 = (s[26] << 25) | (s[27] >>> 7);
    b25 = (s[27] << 25) | (s[26] >>> 7);
    b6 = (s[36] << 21) | (s[37] >>> 11);
    b7 = (s[37] << 21) | (s[36] >>> 11);
    b38 = (s[47] << 24) | (s[46] >>> 8);
    b39 = (s[46] << 24) | (s[47] >>> 8);
    b30 = (s[8] << 27) | (s[9] >>> 5);
    b31 = (s[9] << 27) | (s[8] >>> 5);
    b12 = (s[18] << 20) | (s[19] >>> 12);
    b13 = (s[19] << 20) | (s[18] >>> 12);
    b44 = (s[29] << 7) | (s[28] >>> 25);
    b45 = (s[28] << 7) | (s[29] >>> 25);
    b26 = (s[38] << 8) | (s[39] >>> 24);
    b27 = (s[39] << 8) | (s[38] >>> 24);
    b8 = (s[48] << 14) | (s[49] >>> 18);
    b9 = (s[49] << 14) | (s[48] >>> 18);

    s[0] = b0 ^ (~b2 & b4);
    s[1] = b1 ^ (~b3 & b5);
    s[10] = b10 ^ (~b12 & b14);
    s[11] = b11 ^ (~b13 & b15);
    s[20] = b20 ^ (~b22 & b24);
    s[21] = b21 ^ (~b23 & b25);
    s[30] = b30 ^ (~b32 & b34);
    s[31] = b31 ^ (~b33 & b35);
    s[40] = b40 ^ (~b42 & b44);
    s[41] = b41 ^ (~b43 & b45);
    s[2] = b2 ^ (~b4 & b6);
    s[3] = b3 ^ (~b5 & b7);
    s[12] = b12 ^ (~b14 & b16);
    s[13] = b13 ^ (~b15 & b17);
    s[22] = b22 ^ (~b24 & b26);
    s[23] = b23 ^ (~b25 & b27);
    s[32] = b32 ^ (~b34 & b36);
    s[33] = b33 ^ (~b35 & b37);
    s[42] = b42 ^ (~b44 & b46);
    s[43] = b43 ^ (~b45 & b47);
    s[4] = b4 ^ (~b6 & b8);
    s[5] = b5 ^ (~b7 & b9);
    s[14] = b14 ^ (~b16 & b18);
    s[15] = b15 ^ (~b17 & b19);
    s[24] = b24 ^ (~b26 & b28);
    s[25] = b25 ^ (~b27 & b29);
    s[34] = b34 ^ (~b36 & b38);
    s[35] = b35 ^ (~b37 & b39);
    s[44] = b44 ^ (~b46 & b48);
    s[45] = b45 ^ (~b47 & b49);
    s[6] = b6 ^ (~b8 & b0);
    s[7] = b7 ^ (~b9 & b1);
    s[16] = b16 ^ (~b18 & b10);
    s[17] = b17 ^ (~b19 & b11);
    s[26] = b26 ^ (~b28 & b20);
    s[27] = b27 ^ (~b29 & b21);
    s[36] = b36 ^ (~b38 & b30);
    s[37] = b37 ^ (~b39 & b31);
    s[46] = b46 ^ (~b48 & b40);
    s[47] = b47 ^ (~b49 & b41);
    s[8] = b8 ^ (~b0 & b2);
    s[9] = b9 ^ (~b1 & b3);
    s[18] = b18 ^ (~b10 & b12);
    s[19] = b19 ^ (~b11 & b13);
    s[28] = b28 ^ (~b20 & b22);
    s[29] = b29 ^ (~b21 & b23);
    s[38] = b38 ^ (~b30 & b32);
    s[39] = b39 ^ (~b31 & b33);
    s[48] = b48 ^ (~b40 & b42);
    s[49] = b49 ^ (~b41 & b43);

    s[0] ^= RC[n];
    s[1] ^= RC[n + 1];
  }
} while(!end);

var hex = '';

for(i = 0, n = bits / 32;i < n;++i) {
    h = s[i];
    hex += HEX_CHARS[(h >> 4) & 0x0F] + HEX_CHARS[h & 0x0F] +
           HEX_CHARS[(h >> 12) & 0x0F] + HEX_CHARS[(h >> 8) & 0x0F] +
           HEX_CHARS[(h >> 20) & 0x0F] + HEX_CHARS[(h >> 16) & 0x0F] +
           HEX_CHARS[(h >> 28) & 0x0F] + HEX_CHARS[(h >> 24) & 0x0F];
}
return hex;
```

### <a name="_sha3_keccak_224"></a>_sha3::keccak_224(message)


```javascript
return this.keccak(message, 224, KECCAK_PADDING);
```

### <a name="_sha3_keccak_256"></a>_sha3::keccak_256(message)


```javascript
return this.keccak(message, 256, KECCAK_PADDING);
```

### <a name="_sha3_keccak_512"></a>_sha3::keccak_512(message)


```javascript
return this.keccak(message, 512, KECCAK_PADDING);
```

### <a name="_sha3_sha3_224"></a>_sha3::sha3_224(message)


```javascript
return this.keccak(message, 224, PADDING);
```

### <a name="_sha3_sha3_256"></a>_sha3::sha3_256(message)


```javascript
return this.keccak(message, 256, PADDING);
```

### <a name="_sha3_sha3_512"></a>_sha3::sha3_512(message)


```javascript
return this.keccak(message, 512, PADDING);
```



   


   



      
    



      
    
      
            
# Class localFs


The class has following internal singleton variables:
        
        
### localFs::constructor( aclFile )

```javascript

```
        


   
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    


   
      
            
# Class _promise


The class has following internal singleton variables:
        
        
### <a name="_promise_all"></a>_promise::all(firstArg)


```javascript

var args;
if(this.isArray(firstArg)) {
  args = firstArg;
} else {
  args = Array.prototype.slice.call(arguments, 0);
}
// console.log(args);
var targetLen = args.length,
    rCnt = 0,
    myPromises = [],
    myResults = new Array(targetLen);
    
return this.then(
    function() {
 
        var allPromise = _promise();
        if(args.length==0) {
            allPromise.resolve([]);
        }
        args.forEach( function(b, index) {
            if(b.then) {
                // console.log("All, looking for ", b, " state = ", b._state);
                myPromises.push(b);
                
                b.then(function(v) {
                    myResults[index] = v;
                    rCnt++;
                    if(rCnt==targetLen) {

                        allPromise.resolve(myResults);
                    }
                }, function(v) {
                    allPromise.reject(v);
                });
                
            } else {
                allPromise.reject("Not list of promises");
            }
        })
        
        return allPromise;
        
    });



    

```

### <a name="_promise_collect"></a>_promise::collect(collectFn, promiseList, results)


```javascript

var args;
if(this.isArray(promiseList)) {
  args = promiseList;
} else {
  args = [promiseList];
}

// console.log(args);
var targetLen = args.length,
    isReady = false,
    noMore = false,
    rCnt = 0,
    myPromises = [],
    myResults = results || {};
    
return this.then(
    function() {
 
        var allPromise = _promise();
        args.forEach( function(b, index) {
            if(b.then) {
                // console.log("All, looking for ", b, " state = ", b._state);
                myPromises.push(b);
                
                b.then(function(v) {
                    rCnt++;
                    isReady = collectFn(v, myResults);
                    if( (isReady && !noMore) || (noMore==false && targetLen == rCnt) ) {
                        allPromise.resolve(myResults);
                        noMore = true;
                    }
                }, function(v) {
                    allPromise.reject(v);
                });
                
            } else {
                allPromise.reject("Not list of promises");
            }
        })
        
        return allPromise;
        
    });

```

### <a name="_promise_fail"></a>_promise::fail(fn)


```javascript
return this.then(null, fn);
```

### <a name="_promise_fulfill"></a>_promise::fulfill(withValue)


```javascript
// if(this._fulfilled || this._rejected) return;

if(this._rejected) return;
if(this._fulfilled && withValue != this._stateValue) {
    return;
}

var me = this;
this._fulfilled = true;
this._stateValue = withValue;

var chCnt = this._childPromises.length;

while(chCnt--) {
    var p = this._childPromises.shift();
    if(p._onFulfill) {
        try {
            var x = p._onFulfill(withValue);
            // console.log("Returned ",x);
            if(typeof(x)!="undefined") {
                p.resolve(x);
            } else {
                p.fulfill(withValue);
            }
        } catch(e) {
            // console.error(e);
            /*
                If either onFulfilled or onRejected throws an exception e, promise2 
                must be rejected with e as the reason.            
            */
            p.reject(e);
        }
    } else {
        /*
            If onFulfilled is not a function and promise1 is fulfilled, promise2 must be 
            fulfilled with the same value as promise1        
        */
        p.fulfill(withValue);
    }
};
// this._childPromises.length = 0;
this._state = 1;
this.triggerStateChange();

```

### _promise::constructor( onFulfilled, onRejected )

```javascript
// 0 = pending
// 1 = fullfilled
// 2 = error

this._state = 0;
this._stateValue = null;
this._isAPromise = true;
this._childPromises = [];

if(this.isFunction(onFulfilled))
    this._onFulfill = onFulfilled;
if(this.isFunction(onRejected))
    this._onReject = onRejected;
    
if(!onRejected && this.isFunction(onFulfilled) ) {

    var me = this;
    later().asap(
        function() {
            onFulfilled( function(v) {
                me.resolve(v)
            }, function(v) {
                me.reject(v);
            });           
        });
 
}
```
        
### <a name="_promise_isFulfilled"></a>_promise::isFulfilled(t)


```javascript
return this._state == 1;
```

### <a name="_promise_isPending"></a>_promise::isPending(t)


```javascript
return this._state == 0;
```

### <a name="_promise_isRejected"></a>_promise::isRejected(v)


```javascript
return this._state == 2;
```

### <a name="_promise_onStateChange"></a>_promise::onStateChange(fn)


```javascript

if(!this._listeners)
    this._listeners = [];

this._listeners.push(fn);
```

### <a name="_promise_reject"></a>_promise::reject(withReason)


```javascript

// if(this._rejected || this._fulfilled) return;

// conso

if(this._fulfilled) return;
if(this._rejected && withReason != this._rejectReason) return;


this._state = 2;
this._rejected = true;
this._rejectReason = withReason;
var me = this;

var chCnt = this._childPromises.length;
while(chCnt--) {
    var p = this._childPromises.shift();

    if(p._onReject) {
        try {
            p._onReject(withReason);
            p.reject(withReason);
        } catch(e) {
            /*
                If either onFulfilled or onRejected throws an exception e, promise2 
                must be rejected with e as the reason.            
            */
            p.reject(e);
        }
    } else {
        /*
            If onFulfilled is not a function and promise1 is fulfilled, promise2 must be 
            fulfilled with the same value as promise1        
        */
        p.reject(withReason);
    }
};

// this._childPromises.length = 0;
this.triggerStateChange();

```

### <a name="_promise_rejectReason"></a>_promise::rejectReason(reason)


```javascript
if(reason) {
    this._rejectReason = reason;
    return;
}
return this._rejectReason;
```

### <a name="_promise_resolve"></a>_promise::resolve(x)


```javascript

// console.log("Resolving ", x);

// can not do this many times...
if(this._state>0) return;

if(x==this) {
    // error
    this._rejectReason = "TypeError";
    this.reject(this._rejectReason);
    return;
}

if(this.isObject(x) && x._isAPromise) {
    
    // 
    this._state = x._state;
    this._stateValue = x._stateValue;
    this._rejectReason = x._rejectReason;
    // ... 
    if(this._state===0) {
        var me = this;
        x.onStateChange( function() {
            if(x._state==1) {
                // console.log("State change");
                me.resolve(x.value());
            } 
            if(x._state==2) {
                me.reject(x.rejectReason());                
            }
        });
    }
    if(this._state==1) {
        // console.log("Resolved to be Promise was fulfilled ", x._stateValue);
        this.fulfill(this._stateValue);    
    }
    if(this._state==2) {
        // console.log("Relved to be Promise was rejected ", x._rejectReason);
        this.reject(this._rejectReason);
    }
    return;
}
if(this.isObject(x) && x.then && this.isFunction(x.then)) {
    // console.log("Thenable ", x);
    var didCall = false;
    try {
        // Call the x.then
        var  me = this;
        x.then.call(x, 
            function(y) {
                if(didCall) return;
                // we have now value for the promise...
                // console.log("Got value from Thenable ", y);
                me.resolve(y);
                didCall = true;
            },
            function(r) {
                if(didCall) return;
                // console.log("Got reject from Thenable ", r);
                me.reject(r);
                didCall = true;
            });
    } catch(e) {
        if(!didCall) this.reject(e);
    }
    return;    
}
this._state = 1;
this._stateValue = x;

// fulfill the promise...
this.fulfill(x);

```

### <a name="_promise_state"></a>_promise::state(newState)


```javascript
if(typeof(newState)!="undefined") {
    this._state = newState;
}
return this._state;
```

### <a name="_promise_then"></a>_promise::then(onFulfilled, onRejected)


```javascript

if(!onRejected) onRejected = function() {};

var p = new _promise(onFulfilled, onRejected);
var me = this;

if(this._state==1) {
    later().asap( function() {
        me.fulfill(me.value());
    });
}
if(this._state==2) {
    later().asap( function() {
        me.reject(me.rejectReason());
    });
}
this._childPromises.push(p);
return p;



```

### <a name="_promise_triggerStateChange"></a>_promise::triggerStateChange(t)


```javascript
var me = this;
if(!this._listeners) return;
this._listeners.forEach( function(fn) {
    fn(me); 
});
// one-timer
this._listeners.length = 0;
```

### <a name="_promise_value"></a>_promise::value(v)


```javascript
if(typeof(v)!="undefined") {
    this._stateValue = v;
    return this;
}
return this._stateValue;
```



   
    
## trait util_fns

The class has following internal singleton variables:
        
        
### <a name="util_fns_isArray"></a>util_fns::isArray(someVar)


```javascript
return Object.prototype.toString.call( someVar ) === '[object Array]';
```

### <a name="util_fns_isFunction"></a>util_fns::isFunction(fn)


```javascript
return Object.prototype.toString.call(fn) == '[object Function]';
```

### <a name="util_fns_isObject"></a>util_fns::isObject(obj)


```javascript
return obj === Object(obj);
```


    
    
    
    


   
      
    
      
            
# Class later


The class has following internal singleton variables:
        
* _initDone
        
* _callers
        
* _oneTimers
        
* _everies
        
* _framers
        
* _localCnt
        
        
### <a name="later_add"></a>later::add(fn, thisObj, args)


```javascript
if(thisObj || args) {
   var tArgs;
   if( Object.prototype.toString.call( args ) === '[object Array]' ) {
       tArgs = args;
   } else {
       tArgs = Array.prototype.slice.call(arguments, 2);
       if(!tArgs) tArgs = [];
   }
   _callers.push([thisObj, fn, tArgs]);   
} else {
    _callers.push(fn);
}
```

### <a name="later_after"></a>later::after(seconds, fn, name)


```javascript

if(!name) {
    name = "aft7491_"+(_localCnt++);
}

_everies[name] = {
    step : Math.floor(seconds * 1000),
    fn : fn,
    nextTime : 0,
    remove : true
};
```

### <a name="later_asap"></a>later::asap(fn)


```javascript
this.add(fn);

```

### <a name="later_every"></a>later::every(seconds, fn, name)


```javascript

if(!name) {
    name = "t7491_"+(_localCnt++);
}

_everies[name] = {
    step : Math.floor(seconds * 1000),
    fn : fn,
    nextTime : 0
};
```

### later::constructor( interval, fn )

```javascript
if(!_initDone) {

   _localCnt=1;
   this.polyfill();
 
   var frame, cancelFrame;
   if(typeof(window) != "undefined") {
       var frame = window['requestAnimationFrame'], 
           cancelFrame= window['cancelRequestAnimationFrame'];
       ['', 'ms', 'moz', 'webkit', 'o'].forEach( function(x) { 
           if(!frame) {
            frame = window[x+'RequestAnimationFrame'];
            cancelFrame = window[x+'CancelAnimationFrame'] 
                                       || window[x+'CancelRequestAnimationFrame'];
           }
        });
   }
 
    if (!frame)
        frame= function(cb) {
            return setTimeout(cb, 16);
        };
 
    if (!cancelFrame)
        cancelFrame = function(id) {
            clearTimeout(id);
        };    
        
    _callers = [];
    _oneTimers = {};
    _everies = {};
    _framers = [];
    var lastMs = 0;
    
    var _callQueQue = function() {
       var ms = (new Date()).getTime();
       var fn;
       while(fn=_callers.shift()) {
          if(Object.prototype.toString.call( fn ) === '[object Array]' ) {
              fn[1].apply(fn[0], fn[2]);
          } else {
              fn();
          }
           
       }
       
       for(var i=0; i<_framers.length;i++) {
           var fFn = _framers[i];
           fFn();
       }
       
       for(var n in _oneTimers) {
           if(_oneTimers.hasOwnProperty(n)) {
               var v = _oneTimers[n];
               v[0](v[1]);
               delete _oneTimers[n];
           }
       }
       
       for(var n in _everies) {
           if(_everies.hasOwnProperty(n)) {
               var v = _everies[n];
               if(v.nextTime < ms) {
                   if(v.remove) {
                       if(v.nextTime > 0) {
                          v.fn(); 
                          delete _everies[n];
                       } else {
                          v.nextTime = ms + v.step; 
                       }
                   } else {
                       v.fn();
                       v.nextTime = ms + v.step;
                   }
               }
               if(v.until) {
                   if(v.until < ms) {
                       delete _everies[n];
                   }
               }
           }
       }       
       
       frame(_callQueQue);
       lastMs = ms;
    };
    _callQueQue();
    _initDone = true;
}
```
        
### <a name="later_once"></a>later::once(key, fn, value)


```javascript
// _oneTimers

_oneTimers[key] = [fn,value];
```

### <a name="later_onFrame"></a>later::onFrame(fn)


```javascript

_framers.push(fn);
```

### <a name="later_polyfill"></a>later::polyfill(t)


```javascript
// --- let's not ---
```

### <a name="later_removeFrameFn"></a>later::removeFrameFn(fn)


```javascript

var i = _framers.indexOf(fn);
if(i>=0) {
    if(fn._onRemove) {
        fn._onRemove();
    }
    _framers.splice(i,1);
    return true;
} else {
    return false;
}
```



   


   



      
    



      
    
      
            
# Class _localDB


The class has following internal singleton variables:
        
* _initDone
        
* _dbList
        
* _db
        
        
### <a name="_localDB__initDB"></a>_localDB::_initDB(t)


```javascript

if(_db) return;
// if you want experimental support, enable browser based prefixes
_db = window.indexedDB; //  || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;

_initDone = true;

_dbList = _localDB( "sys.db", {
    tables : {
        databases : {
            createOptions : { keyPath : "name" },
        }
    }
});
```

### <a name="_localDB_clearDatabases"></a>_localDB::clearDatabases(fn)


```javascript

_dbList.then( function() {
  var dbs = _dbList.table("databases");
  dbs.forEach( function(data, cursor) {
     if(fn(data)) {
         _db.deleteDatabase(data.name);
         cursor.delete();
     }       
  });

})
```

### <a name="_localDB_getDB"></a>_localDB::getDB(t)


```javascript
return this._db;
```

### _localDB::constructor( dbName, options )

```javascript

if(this._db) return;
this._initDB();

if(!dbName) {
    return;
}

var me = this;

var request = _db.open(dbName, 4);

request.onerror = function(event) {
  // Do something with request.errorCode!
  console.error( event.target.errorCode );
};
request.onsuccess = function(event) {
  // Do something with request.result!
  _dbList.then( function() {
      var dbs = _dbList.table("databases");
      dbs.addRows( [{ name : dbName }]);
  })
  me._db = event.target.result;
  me.resolve(true);
  
};
request.onupgradeneeded = function (event) {

    var db = event.target.result;
    me._db = db;

    if(options && options.tables) {
        for(var n in options.tables) {
            if(options.tables.hasOwnProperty(n)) {
                var opts = options.tables[n];
                // Create another object store called "names" with the autoIncrement flag set as true.    
                var objStore = db.createObjectStore(n, opts.createOptions);

                if(opts.indexes) {
                    for(var iName in opts.indexes) {
                        if(opts.indexes.hasOwnProperty(iName)) {
                            var iData = opts.indexes[iName];
                            objStore.createIndex(iName, iName, iData);
                        }
                    }
                }
                
            }
        }
    }

};

```
        
### <a name="_localDB_table"></a>_localDB::table(name)


```javascript
return dbTable(this._db, name);
```



   
    
    
    
## trait _dataTrait

The class has following internal singleton variables:
        
* _eventOn
        
* _commands
        
        
### <a name="_dataTrait_guid"></a>_dataTrait::guid(t)


```javascript

return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);

```

### <a name="_dataTrait_isArray"></a>_dataTrait::isArray(t)


```javascript
return Object.prototype.toString.call( t ) === '[object Array]';
```

### <a name="_dataTrait_isFunction"></a>_dataTrait::isFunction(fn)


```javascript
return Object.prototype.toString.call(fn) == '[object Function]';
```

### <a name="_dataTrait_isObject"></a>_dataTrait::isObject(t)


```javascript
return t === Object(t);
```


    
    


   
      
            
# Class dbTable


The class has following internal singleton variables:
        
        
### <a name="dbTable__cursorAction"></a>dbTable::_cursorAction(mode, usingIndex, actionFn)


```javascript

var prom = _promise();

var trans = this._db.transaction(this._table,  mode);
var store = trans.objectStore(this._table);
var cursorRequest;

if(usingIndex) {

    var singleKeyRange, indexName;
    
    // BUG or FEATURE: currently accepts only one key like
    // { folderName : "data" };
    for(var n in usingIndex) {
        if(usingIndex.hasOwnProperty(n)) {
             indexName = n; 
             singleKeyRange = IDBKeyRange.only(usingIndex[n]);
        }
    }
    
    if(indexName) {
        var index = store.index(indexName); // open using the index only
        cursorRequest = index.openCursor(singleKeyRange);
    } else {
        prom.reject("invalid index key");
        return;
    }
} else {
    cursorRequest = store.openCursor();
}

trans.oncomplete = function(evt) {  
    prom.resolve(true);
};

cursorRequest.onerror = function(error) {
    console.log(error);
};

cursorRequest.onsuccess = function(evt) {                    
    var cursor = evt.target.result;
    if (cursor) {
        actionFn(cursor);
        cursor.continue();
    }
};

return prom;
```

### <a name="dbTable_addRows"></a>dbTable::addRows(rows)


```javascript

var prom = _promise();

var transaction = this._db.transaction([this._table], "readwrite");

var me = this;
// Do something when all the data is added to the database.
transaction.oncomplete = function(event) {
  // console.log("Writing into "+me._table+" was successfull");
  prom.resolve(true);
};

transaction.onerror = function(event) {
  prom.reject(event);
};

var objectStore = transaction.objectStore(this._table);
for (var i in rows) {
  var request = objectStore.add(rows[i]);
  request.onsuccess = function(event) {
    // console.log("Row ",i," written succesfully");
  };
}

return prom;
```

### <a name="dbTable_clear"></a>dbTable::clear(t)


```javascript

var prom = _promise();
var transaction = this._db.transaction(this._table, "readwrite");
var objectStore = transaction.objectStore(this._table);
var request = objectStore.clear();
request.onerror = function(event) {
  prom.fail(event.target.errorCode);
};
request.onsuccess = function(event) {
  prom.resolve( true );
};

return prom;

```

### <a name="dbTable_count"></a>dbTable::count(t)


```javascript
var prom = _promise();
var transaction = this._db.transaction([this._table], "readonly");

transaction.objectStore(this._table).count().onsuccess = function(e) {
	prom.resolve(e.target.result);
};

return prom;

```

### <a name="dbTable_forEach"></a>dbTable::forEach(fn, usingIndex)


```javascript

return this._cursorAction("readonly", usingIndex, function(cursor) {
   fn(cursor.value, cursor);
});

```

### <a name="dbTable_get"></a>dbTable::get(key)


```javascript

var prom = _promise();
var transaction = this._db.transaction(this._table, "readonly");
var objectStore = transaction.objectStore(this._table);
var request = objectStore.get(key);

request.onerror = function(event) {
  // Handle errors!
  console.log("Could not get ", key);
  prom.fail(event.target.errorCode);
};
request.onsuccess = function(event) {
  prom.resolve( request.result );
};

return prom;
```

### <a name="dbTable_getAll"></a>dbTable::getAll(usingIndex)


```javascript

var items = [],
    me = this;

return _promise(
        function(result, fail) {
            me._cursorAction("readonly", usingIndex, function(cursor) {
               items.push(cursor.value); 
            }).then( function() {
                result(items);
            }).fail(fail);
        });

```

### dbTable::constructor( db, tableName )

```javascript

this._db = db;
this._table = tableName;

```
        
### <a name="dbTable_readAndDelete"></a>dbTable::readAndDelete(usingIndex)


```javascript
var items = [],
    me = this;

return _promise(
        function(result, fail) {
            me._cursorAction("readwrite", usingIndex, function(cursor) {
               items.push(cursor.value); 
               cursor.delete(); // remove the key and continue... 
            }).then( function() {
                result(items);
            }).fail(fail);
        });

```

### <a name="dbTable_remove"></a>dbTable::remove(usingIndex)
`usingIndex` optional : { keyName : valueString}
 


```javascript
var me = this;

return _promise(
        function(result, fail) {
            me._cursorAction("readwrite", usingIndex, function(cursor) {
               cursor.delete(); // remove the key and continue... 
            }).then( function() {
                result(true);
            }).fail(fail);
        });

```

### <a name="dbTable_update"></a>dbTable::update(key, data)


```javascript
var prom = _promise();
var me = this;
var transaction = this._db.transaction([this._table], "readwrite");
var objectStore = transaction.objectStore(this._table);
try {
    var request = objectStore.get(key);
    request.onerror = function(event) {
      if(!request.result) {
          me.addRows([data]).then( function() {
              prom.resolve(data);
          });
          return;
      }     
      prom.fail(event.target.errorCode);
    };
    request.onsuccess = function(event) {
      if(!request.result) {
          me.addRows([data]).then( function() {
              prom.resolve(data);
          });
          return;
      }
      var requestUpdate = objectStore.put(data);
      requestUpdate.onerror = function(event) {
         // Do something with the error
         prom.fail( "update failed " );
      };
      requestUpdate.onsuccess = function(event) {
         // Success - the data is updated!
         prom.resolve(data);
      };
      
    };
} catch(e) {
    return this.addRows( [data] );
}

return prom;
```



   
    
## trait _dataTrait

The class has following internal singleton variables:
        
* _eventOn
        
* _commands
        
        
### <a name="_dataTrait_guid"></a>_dataTrait::guid(t)


```javascript

return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);

```

### <a name="_dataTrait_isArray"></a>_dataTrait::isArray(t)


```javascript
return Object.prototype.toString.call( t ) === '[object Array]';
```

### <a name="_dataTrait_isFunction"></a>_dataTrait::isFunction(fn)


```javascript
return Object.prototype.toString.call(fn) == '[object Function]';
```

### <a name="_dataTrait_isObject"></a>_dataTrait::isObject(t)


```javascript
return t === Object(t);
```


    
    


   
      
    



      
    
      
    



      
    
      
            
# Class memoryFsFolder


The class has following internal singleton variables:
        
        
### <a name="memoryFsFolder__isFile"></a>memoryFsFolder::_isFile(fileName)


```javascript
var fold = this._pathObj;
if(typeof( fold[fileName] ) != "undefined" && !this.isObject(fold[fileName]) ) return true;
return false;
```

### <a name="memoryFsFolder__isFolder"></a>memoryFsFolder::_isFolder(name)


```javascript
var fold = this._pathObj;
if(typeof( fold[name] ) != "undefined" && this.isObject(fold[name]) ) return true;
return false;
```

### <a name="memoryFsFolder_appendFile"></a>memoryFsFolder::appendFile(fileName, data)


```javascript
var p, me = this;
return _promise(
    function(result, fail) {
        var fold = me._pathObj;

        if(typeof(data) != "string") {
            // can not write anything else than strings
            fail({result : false, text : "Only string writes are accepted"});
            return;
        }        
        
        if(me._isFile(fileName)) {
            fold[fileName] += data;
            result({result : true});
        } else {
            fold[fileName]  = data;
            result({result : true, text:"Created the file"});
        }
        
    } );

```

### <a name="memoryFsFolder_createDir"></a>memoryFsFolder::createDir(dirName)


```javascript
var p, me = this;
return _promise(
    function(result, fail) {
        var fold = me._pathObj;
        if(!me._isFile(dirName) && !me._isFolder(dirName)) {
            fold[dirName] = {};
        } 
        result({result : true});
    } );
```

### <a name="memoryFsFolder_findPath"></a>memoryFsFolder::findPath(name)


```javascript

if(name.charAt(0)=="/") name = name.substring(0);
var parts = name.trim().split("/");
var fold = this;

return _promise( function(response) {
   
   if(!parts[0]) {
       response(fold);
       return;
   }
   
   var sub, rootProm, currFolder;
   parts.forEach(
       function(sub) {
           
           if(!sub || sub.trim().length==0) return;
           
           if(!fold) {
               response(false);
               return;
           }
           if(!rootProm) {
               currFolder = fold;
               rootProm = fold.isFolder(sub); 
           } else {
               rootProm = rootProm.then( function(f) {
                   currFolder = f;
                   if(f) return f.isFolder(sub);
                   return false;
               })
           }
           
           rootProm = rootProm.then( function(is_fold) {
                      if(is_fold) {
                          return currFolder.getFolder(sub);
                      } 
                      return false;
                  });
       });

   rootProm.then(response);
    
});




/*
            .then( function(r) {
                results.push( { result : r.channelId == "f1",  text : "request for channel f1 was successfull" } );
                return fsRoot.getFolder("my") || false;
            })
            .then( function(f)  {
                if(f) return f.getFolder("channel") || false;
            })
*/

```

### <a name="memoryFsFolder_fromData"></a>memoryFsFolder::fromData(obj)


```javascript
var me = this;
//this._server = server;
//this._pathObj = pathObj;
return _promise(
    function(result, fail) {
        if(!me._pathObj) {
            me._pathObj = {};
        }
        var all = [];
        var myProm = _promise();
        
        for( var n in obj ) {
            if(me.isObject(obj[n])) {
                if(!me._pathObj[n] || !me._isFolder(n)) {
                    me._pathObj[n] = {};
                }              
                var po = memoryFsFolder( me._server, me._pathObj[n] );
                all.push( po.fromData( obj[n]) );
                
            } else {
                if(obj[n]===true) {
                    
                } else {
                    me._pathObj[n] = obj[n];
                }
            }
        }

        myProm.all( all ).then( function() {
            result(true);
        }).fail( fail );
        myProm.resolve(true);        
        
});

  

```

### <a name="memoryFsFolder_getFolder"></a>memoryFsFolder::getFolder(name)


```javascript
return this.getSubFolderObj(name);
```

### <a name="memoryFsFolder_getSubFolderObj"></a>memoryFsFolder::getSubFolderObj(dirName)


```javascript

if(this.isObject( this._pathObj[dirName] ) ) {
    return memoryFsFolder( this._server, this._pathObj[dirName]);
}
```

### <a name="memoryFsFolder_getTree"></a>memoryFsFolder::getTree(t)


```javascript
var treePromise =  this.toData({ getData : false});
return treePromise;
```

### <a name="memoryFsFolder_id"></a>memoryFsFolder::id(t)


```javascript
return this._id;
```

### memoryFsFolder::constructor( server, pathObj )

```javascript

this._server = server;
this._pathObj = pathObj;
this._id = this.guid();

```
        
### <a name="memoryFsFolder_isFile"></a>memoryFsFolder::isFile(fileName)


```javascript
var p, me = this;
return _promise(
    function(result, fail) {
        result(me._isFile(fileName));
    } );
```

### <a name="memoryFsFolder_isFolder"></a>memoryFsFolder::isFolder(dirName)


```javascript
var p, me = this;
return _promise(
    function(result, fail) {
        result(me._isFolder(dirName));
    } );
```

### <a name="memoryFsFolder_linesToJsonArray"></a>memoryFsFolder::linesToJsonArray(str)


```javascript
if(!str || typeof(str) != "string") return [];
var a = str.split("\n");
var res = [];
a.forEach( function(line) {
    if(line.trim().length==0) return;
    res.push( JSON.parse(line) );
})
return res;
```

### <a name="memoryFsFolder_listFiles"></a>memoryFsFolder::listFiles(filter)


```javascript

var p, me = this;
return _promise(
    function(result, fail) {
        var fold = me._pathObj;
        var list = [];
        for( var n in fold) {
            if(me._isFile(n)) list.push(n);
        }
        result(list);
    } );


```

### <a name="memoryFsFolder_listFolders"></a>memoryFsFolder::listFolders(filter)


```javascript

var p, me = this;
return _promise(
    function(result, fail) {
        var fold = me._pathObj;
        var list = [];
        for( var n in fold) {
            if(me._isFolder(n)) list.push(n);
        }
        result(list);
    } );
```

### <a name="memoryFsFolder_readFile"></a>memoryFsFolder::readFile(fileName, fn)


```javascript
var p, me = this;
return _promise(
    function(result, fail) {
        var fold = me._pathObj;
        if(me._isFile(fileName)) {
            result( fold[fileName]);
            return;
        }
        fail("File does not exist");
        
    } );

```

### <a name="memoryFsFolder_removeFile"></a>memoryFsFolder::removeFile(fileName)


```javascript
var p, me = this;
return _promise(
    function(result, fail) {
        var fold = me._pathObj;
        if(me._isFile(fileName)) {
            delete fold[fileName];
        } 
        result({result : true, text : "file "+fileName+" removed"});
    } );

```

### <a name="memoryFsFolder_toData"></a>memoryFsFolder::toData(options, notUsed)


```javascript
var _rootDir = this._rootDir;
var me = this;

var options = options || {};

var fileFilter = options.fileFilter,
    dirFilter = options.dirFilter;

if(typeof( options.getData ) == "undefined" ) options.getData = true;

return _promise(
    function(result, fail) {
        
        var o = {};
        me.listFiles().then( function(list) {
            var cnt = list.length, done = 0,
                waiting = _promise();
            list.forEach(function(n) {
                if(fileFilter) {
                    if(!fileFilter(n)) {
                        done++;
                        if(done==cnt) waiting.resolve(true);       
                        return;
                    }
                }
                if(options.getData) {
                    me.readFile(n).then( function(data) {
                        o[n] = data;
                        done++;
                        if(done==cnt) waiting.resolve(true);
                    });
                } else {
                    o[n] = true;
                    done++;
                    if(done==cnt) waiting.resolve(true);                    
                }
            });
            if(cnt==0) waiting.resolve(true);
            return waiting;
        }).then( function() {
            return me.listFolders();
        }).then( function(list) {
            var cnt = list.length, done = 0,
                waiting = _promise();
            list.forEach(function(dirName) {
                if(dirFilter) {
                    if(!dirFilter(dirName)) {
                        done++;
                        if(done==cnt) waiting.resolve(true);     
                        return;
                    }
                }                
                var newF = me.getSubFolderObj(dirName);
                newF.toData(fileFilter, dirFilter).then( function(data) {
                    o[dirName] = data;
                    done++;
                    if(done==cnt) waiting.resolve(true);
                });
            });
            if(cnt==0) waiting.resolve(true);
            return waiting;            
        }).then( function() {
            result( o );  
        }).fail( function() {
            result({}); 
        });
});
```

### <a name="memoryFsFolder_writeFile"></a>memoryFsFolder::writeFile(fileName, fileData)


```javascript
var p, me = this;
return _promise(
    function(result, fail) {
        var fold = me._pathObj;
        if(typeof(fileData) != "string") {
            // can not write anything else than strings
            fail({result : false, text : "Only string writes are accepted"});
            return;
        }
        if(!me._isFolder(fileName)) {
            fold[fileName] = fileData;
        } else {
            fail({result : false, text : "Modifying the file failed"});
            return;
        }
        result({result : true});
    } );

```



   
    
## trait _dataTrait

The class has following internal singleton variables:
        
        
### <a name="_dataTrait_guid"></a>_dataTrait::guid(t)


```javascript

return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);

```

### <a name="_dataTrait_isArray"></a>_dataTrait::isArray(t)


```javascript
return Object.prototype.toString.call( t ) === '[object Array]';
```

### <a name="_dataTrait_isFunction"></a>_dataTrait::isFunction(fn)


```javascript
return Object.prototype.toString.call(fn) == '[object Function]';
```

### <a name="_dataTrait_isObject"></a>_dataTrait::isObject(t)


```javascript
return t === Object(t);
```


    
    


   
      
    



      
    
      
            
# Class fsServerMemory


The class has following internal singleton variables:
        
* _servers
        
        
### <a name="fsServerMemory__initServers"></a>fsServerMemory::_initServers(t)


```javascript
if(!_servers) {
    _servers = {};
}
```

### <a name="fsServerMemory_getRootFolder"></a>fsServerMemory::getRootFolder(t)


```javascript
var me = this;
return memoryFsFolder( me, me._fsData );

```

### fsServerMemory::constructor( serverName, createFrom )

```javascript
this._serverName = serverName;
this._initServers();
this._fsData = createFrom || {};

this.resolve(true);
```
        


   


   



      
    
      
            
# Class nodeFsFolder


The class has following internal singleton variables:
        
* fs
        
* path
        
        
### <a name="nodeFsFolder__mkDir"></a>nodeFsFolder::_mkDir(dirName)


```javascript

if(typeof(dirName) != "string") {
    console.log(JSON.stringiry(dirName));
    console.log("--- is not object");
    throw "WRROR";
    return;
}
if(!fs.existsSync(dirName)) {
  fs.mkdirSync(dirName, 502, function(err){});   
}    
```

### <a name="nodeFsFolder_appendFile"></a>nodeFsFolder::appendFile(fileName, data, fn)


```javascript
var _rootDir = this._rootDir;
var me = this;

return _promise(
    function(result, fail) {

        if(typeof(data) != "string") {
            // can not write anything else than strings
            fail({result : false, text : "Only string writes are accepted"});
            return;
        }         
        fileName = path.basename(fileName);
        var filePath = _rootDir+"/"+fileName;
        
        fs.appendFile(filePath, data, function (err) {
            if (err) {
               fail( err );
               return;
            }
            result({result:true, text:"File written"});            
        });
    });
```

### <a name="nodeFsFolder_createDir"></a>nodeFsFolder::createDir(dirName)


```javascript

var _rootDir = this._rootDir;
var me = this;

return _promise(
    function(result, fail) {
        // TODO: Should check if the directory is really under this diretory
        // basname is trying to normalize, but should be tested.
        var dirN = path.basename(dirName);
        me._mkDir(_rootDir + "/" +dirN); 
        result({result:true, text:"Directory created"});
    });

```

### <a name="nodeFsFolder_findPath"></a>nodeFsFolder::findPath(name)


```javascript

if(name.charAt(0)=="/") name = name.substring(0);
var parts = name.trim().split("/");
var fold = this;

return _promise( function(response) {
   
   if(!parts[0]) {
       response(fold);
       return;
   }
   
   var sub, rootProm, currFolder;
   parts.forEach(
       function(sub) {
           
           if(!sub || sub.trim().length==0) return;
           
           if(!fold) {
               response(false);
               return;
           }
           if(!rootProm) {
               currFolder = fold;
               rootProm = fold.isFolder(sub); 
           } else {
               rootProm = rootProm.then( function(f) {
                   currFolder = f;
                   if(f) return f.isFolder(sub);
                   return false;
               })
           }
           
           rootProm = rootProm.then( function(is_fold) {
                      if(is_fold) {
                          return currFolder.getFolder(sub);
                      } 
                      return false;
                  });
       });

   rootProm.then(response);
    
});

```

### <a name="nodeFsFolder_fromData"></a>nodeFsFolder::fromData(obj)


```javascript

// Create new directories...
var me = this;
var _rootDir = this._rootDir;

return _promise(
    function(result, fail) {
        var all = [];
        var myProm = _promise();
        
        for(var n in obj ) {
            
            if(n.indexOf("..") >=0) {
                fail(".. symbol is not allowed in the file or path names");
                return;
            }
            
            var name = path.basename(n);
            if(me.isObject(obj[name])) {
                ( function(obj,name) { 
                    var dirDone = _promise();
                    all.push(dirDone);
                    me.createDir(name)
                        .then( function() {
                            var newF = me.getSubFolderObj(name);
                            return newF.fromData( obj[name] );
                        })
                        .then( function() {
                            dirDone.resolve();
                        })
                        .fail( function() {
                            dirDone.resolve();
                        });
                }(obj,name));
            } else {
                if(typeof(obj[name]) == "string") {                
                    all.push( me.writeFile( name, obj[name] ));
                }
            }
        }        
        myProm.all( all ).then( function() {
            result(true);
        }).fail( fail );
        myProm.resolve(true);
    });



```

### <a name="nodeFsFolder_getFolder"></a>nodeFsFolder::getFolder(name)


```javascript
return this.getSubFolderObj(name);
```

### <a name="nodeFsFolder_getSubFolderObj"></a>nodeFsFolder::getSubFolderObj(dirName)


```javascript
return nodeFsFolder(this._rootDir+"/"+dirName);
```

### <a name="nodeFsFolder_getTree"></a>nodeFsFolder::getTree(t)


```javascript
return this.toData({ getData : false});
```

### <a name="nodeFsFolder_id"></a>nodeFsFolder::id(t)


```javascript
return this._id;
```

### nodeFsFolder::constructor( dirName )

```javascript
this._rootDir = dirName;
this._id = this.guid();

if(!dirName) {
    throw " The directory must be specified ";
    return;
}
if(!(typeof(dirName) == "string")) {
    throw " The directory must be string ";
    return;
}
if(dirName.indexOf("..") >=0 || dirName.indexOf("~") >=0  ) {
    throw "The directory must not contain relative path parts";
    return;
}

if(!fs) {
    fs = require('fs');
    path = require('path');
}


```
        
### <a name="nodeFsFolder_isFile"></a>nodeFsFolder::isFile(fileName)


```javascript

var _rootDir = this._rootDir;
var me = this;

return _promise(
    function(result, fail) {
        fileName = path.basename(fileName);

       fs.stat(_rootDir+"/"+fileName, function(err,stats){
         if(err || !stats.isFile()) {
             result(false);
             return;
         }
         result(true);
       });        
 
    });
```

### <a name="nodeFsFolder_isFolder"></a>nodeFsFolder::isFolder(fileName)


```javascript
var _rootDir = this._rootDir;
var me = this;

return _promise(
    function(result, fail) {
        fileName = path.basename(fileName);

       fs.stat(_rootDir+"/"+fileName, function(err,stats){
         if(err || !stats.isDirectory()) {
             result(false);
             return;
         }
         result(true);
       });        
 
    });
```

### <a name="nodeFsFolder_linesToJsonArray"></a>nodeFsFolder::linesToJsonArray(str)


```javascript
if(!str || typeof(str) != "string") return [];
var a = str.split("\n");
var res = [];
a.forEach( function(line) {
    if(line.trim().length==0) return;
    res.push( JSON.parse(line) );
})
return res;
```

### <a name="nodeFsFolder_listFiles"></a>nodeFsFolder::listFiles(filter)


```javascript
var _rootDir = this._rootDir;
var me = this;

return _promise(
    function(result, fail) {
        // Then we list the directory's file here...
        fs.readdir(_rootDir, function(err,files) {
            if(err) {
                fail(err);
                return;
            }
            
            var cnt = files.length, list = [];
            if(cnt==0) result(list);
            
            files.forEach( function(file) {
               fs.stat(_rootDir+"/"+file, function(err,stats){
                 // stats.isDirectory() would be alternative
                 if(!err && stats.isFile()) list.push( file );
                 cnt--;
                 if(cnt==0) result(list);
              });
            });
            
        });
});

```

### <a name="nodeFsFolder_listFolders"></a>nodeFsFolder::listFolders(filter)


```javascript
var _rootDir = this._rootDir;
var me = this;

return _promise(
    function(result, fail) {
        // Then we list the directory's file here...
        fs.readdir(_rootDir, function(err,files) {
            
            console.log(files);
            if(err) {
                fail(err);
                return;
            }
            
            var cnt = files.length, list = [];
            if(cnt==0) result(list);
            
            files.forEach( function(file) {
               fs.stat(_rootDir+"/"+file, function(err,stats){
                 // stats.isFiles() would be alternative
                 if(!err && stats.isDirectory()) {
                     console.log("Dir "+file);
                     list.push( file );
                 }
                 cnt--;
                 if(cnt==0) {
                    console.log("Cnt == 0");
                    result(list);
                 }
              });
            });
            
        });
});
```

### <a name="nodeFsFolder_readFile"></a>nodeFsFolder::readFile(fileName, fn)


```javascript
var _rootDir = this._rootDir;
var me = this;

return _promise(
    function(result, fail) {
        fileName = path.basename(fileName);
        fs.readFile(_rootDir+"/"+fileName, 'utf8', function (err, data) {
            if (err) {
               fail( err );
               return;
            }
            result( data );
        });
});
```

### <a name="nodeFsFolder_removeFile"></a>nodeFsFolder::removeFile(fileName)


```javascript
var _rootDir = this._rootDir;
var me = this;

return _promise(
    function(result, fail) {
        fileName = path.basename(fileName);
        fs.unlink(_rootDir+"/"+fileName, function (err, data) {
            if (err) {
               fail( err );
               return;
            }
            result({result : true, text : "file "+fileName+" removed"});
        });
});
```

### <a name="nodeFsFolder_toData"></a>nodeFsFolder::toData(options, notUsed)


```javascript
var _rootDir = this._rootDir;
var me = this;

var options = options || {};

var fileFilter = options.fileFilter,
    dirFilter = options.dirFilter;

if(typeof( options.getData ) == "undefined" ) options.getData = true;

return _promise(
    function(result, fail) {
        
        var o = {};
        me.listFiles().then( function(list) {
            var cnt = list.length, done = 0,
                waiting = _promise();
            list.forEach(function(n) {
                if(fileFilter) {
                    if(!fileFilter(n)) {
                        done++;
                        if(done==cnt) waiting.resolve(true);       
                        return;
                    }
                }
                if(options.getData) {
                    me.readFile(n).then( function(data) {
                        o[n] = data;
                        done++;
                        if(done==cnt) waiting.resolve(true);
                    });
                } else {
                    o[n] = true;
                    done++;
                    if(done==cnt) waiting.resolve(true);                    
                }
            });
            if(cnt==0) waiting.resolve(true);
            return waiting;
        }).then( function() {
            return me.listFolders();
        }).then( function(list) {
            var cnt = list.length, done = 0,
                waiting = _promise();
            list.forEach(function(dirName) {
                if(dirFilter) {
                    if(!dirFilter(dirName)) {
                        done++;
                        if(done==cnt) waiting.resolve(true);     
                        return;
                    }
                }                
                var newF = me.getSubFolderObj(dirName);
                newF.toData(fileFilter, dirFilter).then( function(data) {
                    o[dirName] = data;
                    done++;
                    if(done==cnt) waiting.resolve(true);
                });
            });
            if(cnt==0) waiting.resolve(true);
            return waiting;            
        }).then( function() {
            result( o );  
        }).fail( function() {
            result({}); 
        });
});
```

### <a name="nodeFsFolder_writeFile"></a>nodeFsFolder::writeFile(fileName, fileData, fn)


```javascript
var _rootDir = this._rootDir;
var me = this;

return _promise(
    function(result, fail) {
        
        if(typeof(fileData) != "string") {
            // can not write anything else than strings
            fail({result : false, text : "Only string writes are accepted"});
            return;
        } 
        
        fileName = path.basename(fileName);
        fs.writeFile(_rootDir+"/"+fileName, fileData, function (err, data) {
            if (err) {
               fail( err );
               return;
            }
            result({result:true, text:"File written"});
        });
});

```



   
    
## trait _dataTrait

The class has following internal singleton variables:
        
        
### <a name="_dataTrait_guid"></a>_dataTrait::guid(t)


```javascript

return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);

```

### <a name="_dataTrait_isArray"></a>_dataTrait::isArray(t)


```javascript
return Object.prototype.toString.call( t ) === '[object Array]';
```

### <a name="_dataTrait_isFunction"></a>_dataTrait::isFunction(fn)


```javascript
return Object.prototype.toString.call(fn) == '[object Function]';
```

### <a name="_dataTrait_isObject"></a>_dataTrait::isObject(t)


```javascript
return t === Object(t);
```


    
    


   
      
    



      
    
      
            
# Class indexedDBFsFolder


The class has following internal singleton variables:
        
* _instances
        
        
### <a name="indexedDBFsFolder__classFactory"></a>indexedDBFsFolder::_classFactory(server, pathString)


```javascript

var id = server.getID()+pathString;

if(!_instances) {
    _instances = {};
}

if(_instances[id]) {
    return _instances[id];
} else {
    _instances[id] = this;
}
```

### <a name="indexedDBFsFolder__filePath"></a>indexedDBFsFolder::_filePath(fileName)

Simple helper, Later this function might be doing checking for duplicate // or similar mistakes in the path name
```javascript

var str = this._path+"/"+fileName;
str = str.replace("//", "/");
return str;
```

### <a name="indexedDBFsFolder__initCreateDir"></a>indexedDBFsFolder::_initCreateDir(dirName)


```javascript
var p, me = this;
var local = this._db,
    server = this._server;

return _promise(
    function(result, fail) {

        me._isFolder( dirName )
        .then( function(isFolder) {
            if(!isFolder) {
                var row = { name : me._normalize( me._path+dirName+"/" ), parentFolder : me._path };
                return local.table("folders").addRows([row]);
            } else {
                return "OK";
            } 
        }).then( function() {
            
            result({result : true, text : "folder "+dirName+" created"});
        }).fail(fail);

    } );
```

### <a name="indexedDBFsFolder__initFromData"></a>indexedDBFsFolder::_initFromData(obj)


```javascript

// Create new directories...
var me = this;
var local = this._db,
    server = this._server;

return _promise(
    function(result, fail) {
        var all = [];
        var myProm = _promise();

        for(var n in obj ) {
            
            if(n.indexOf("..") >=0) {
                fail(".. symbol is not allowed in the file or path names");
                result(false);
                return;
            }
            
            var name = n;
            if(me.isObject(obj[name])) {

                ( function(obj, name) { 
                    var dirDone = _promise();
                    all.push(dirDone);
                    me._initCreateDir(name)
                        .then( function() {
                            var newF = me.getSubFolderObj(name);
                            return newF._initFromData( obj[name] );
                        })
                        .then( function() {
                            dirDone.resolve();
                        })
                        .fail( function() {
                            dirDone.resolve();
                        });
                }(obj, name));
            } else {
                if(typeof(obj[name]) == "string") {      
                    all.push( me._writeFile( name, obj[name] ));
                }
            }
        }        
        myProm.all( all ).then( function() {
            result(true);
        }).fail( fail );
        myProm.resolve(true);                

    });



```

### <a name="indexedDBFsFolder__isFile"></a>indexedDBFsFolder::_isFile(fileName)


```javascript
var me = this;
return _promise(
    function(result, failure) {
        me._loadFiles().then(function(list) {
            for(var i=0; i<list.length;i++) {
                if(list[i].name==fileName) {
                    result(true);
                    return;
                }
            }             
            result(false);
         }).fail( failure );
    });
```

### <a name="indexedDBFsFolder__isFolder"></a>indexedDBFsFolder::_isFolder(name)


```javascript
var me = this;
return _promise(
    function(result, failure) {
        name = me._normalize( me._path + "/" + name+"/");
        me._loadFolders().then(function(list) {
            for(var i=0; i<list.length;i++) {
                if(list[i].name==name) {
                    result(true);
                    return;
                }
            }             
            result(false);
         }).fail( failure );
    });
```

### <a name="indexedDBFsFolder__lastPath"></a>indexedDBFsFolder::_lastPath(str)


```javascript

var parts = str.split("/");

var str = parts.pop();
while(parts.length > 0 ) {
    if(str.length>0) return str;
    str = parts.pop();
}
return str;
```

### <a name="indexedDBFsFolder__loadFiles"></a>indexedDBFsFolder::_loadFiles(t)


```javascript

var local = this._db,
    me = this;
    
return _promise(
    function(result) {
        local.table("files").getAll({folderName:me._path}).then( function(res) {
            me._fileCache = res;
            result(me._fileCache);
        });    
    });
```

### <a name="indexedDBFsFolder__loadFolders"></a>indexedDBFsFolder::_loadFolders(t)


```javascript
var local = this._db,
    me = this;
    
return _promise(
    function(result) {
        local.table("folders").getAll({parentFolder:me._path}).then( function(res) {
            me._folderCache = res;
            result(me._folderCache);
        });    
    });
```

### <a name="indexedDBFsFolder__normalize"></a>indexedDBFsFolder::_normalize(pathName)


```javascript
var str = pathName.replace("//", "/");
return str;
```

### <a name="indexedDBFsFolder__onlyClearWrites"></a>indexedDBFsFolder::_onlyClearWrites(fileName)


```javascript
var p, me = this;
var local = this._db,
    server = this._server;

return _promise(
    function(result, fail) {

        server.then( function() {
            return me._isFile( fileName );
        }).then( function(isFile) {
            if(!isFile) {
                return local.table("files").addRows([
                    { name : fileName, folderName : me._path }
                ]);
            } else {
                return "OK";
            } 
        }).then( function() {
            // remove the old write from the file table
            return local.table("fileWrites").remove({filePath : me._filePath(fileName) });
        }).then( function() {
            // all should be ready...
            result({result : true, text : "writes cleared"});
        }).fail(fail);

    } );

```

### <a name="indexedDBFsFolder__removeFileFromCache"></a>indexedDBFsFolder::_removeFileFromCache(fileName)


```javascript
if(this._fileCache) {
    for(var i=0; i<this._fileCache.length; i++) {
        if(this._fileCache[i].name == fileName) {
            this._fileCache.splice(i,1);
            return;
        }
    }
}
```

### <a name="indexedDBFsFolder__removeFolderFromCache"></a>indexedDBFsFolder::_removeFolderFromCache(name)


```javascript
if(this._folderCache) {
    for(var i=0; i<this._fileCache.length; i++) {
        if(this._folderCache[i].name == name) {
            this._folderCache.splice(i,1);
            return;
        }
    }
}
```

### <a name="indexedDBFsFolder__writeFile"></a>indexedDBFsFolder::_writeFile(fileName, fileData)


```javascript
var p, me = this;
var local = this._db,
    server = this._server;

console.log("writeFile ",fileName,fileData);


return _promise(
    function(result, fail) {
        
        if(typeof(fileData) != "string") {
            // can not write anything else than strings
            fail({result : false, text : "Only string writes are accepted"});
            return;
        }

        me._isFile( fileName ).then( function(isFile) {
            if(!isFile) {
                return local.table("files").addRows([
                    { name : fileName, folderName : me._path }
                ]);
            } else {
                return "OK";
            } 
        }).then( function() {
            // remove the old write from the file table
            return local.table("fileWrites").remove({filePath : me._filePath(fileName) });
        }).then( function() {
            return local.table("fileWrites").addRows([{filePath : me._filePath(fileName), data : fileData }]);
        }).then( function() {
            // all should be ready...
            result({result : true, text : "file "+fileName+" written"});
        }).fail(fail);

    } );

```

### <a name="indexedDBFsFolder_appendFile"></a>indexedDBFsFolder::appendFile(fileName, data)


```javascript

var p, me = this;
var local = this._db,
    server = this._server;

return _promise(
    function(result, fail) {
        
        if(typeof(data) != "string") {
            // can not write anything else than strings
            fail({result : false, text : "Only string writes are accepted"});
            return;
        }   

        server.then( function() {
            return me._isFile( fileName );
        }).then( function(isFile) {
            if(!isFile) {
                return local.table("files").addRows([
                    { name : fileName, folderName : me._path }
                ]);
            } else {
                return "OK";
            } 
        }).then( function() {
            return local.table("fileWrites").addRows([{filePath : me._filePath(fileName), data : data }]);
        }).then( function() {
            // all should be ready...
            result({result : true, text : "file "+fileName+" written"});
        }).fail(fail);

    } );    

```

### <a name="indexedDBFsFolder_createDir"></a>indexedDBFsFolder::createDir(dirName)


```javascript
var p, me = this;
var local = this._db,
    server = this._server;

return _promise(
    function(result, fail) {

        server.then( function() {
            return me._isFolder( dirName );
        }).then( function(isFolder) {
            if(!isFolder) {
                var row = { name : me._normalize( me._path+dirName+"/" ), parentFolder : me._path };
                return local.table("folders").addRows([row]);
            } else {
                return "OK";
            } 
        }).then( function() {
            
            result({result : true, text : "folder "+dirName+" created"});
        }).fail(fail);

    } );
```

### <a name="indexedDBFsFolder_findPath"></a>indexedDBFsFolder::findPath(name)


```javascript

if(name.charAt(0)=="/") name = name.substring(0);
var parts = name.trim().split("/");
var fold = this;

return _promise( function(response) {
   
   if(!parts[0]) {
       response(fold);
       return;
   }
   
   var sub, rootProm, currFolder;
   parts.forEach(
       function(sub) {
           
           if(!sub || sub.trim().length==0) return;
           
           if(!fold) {
               response(false);
               return;
           }
           if(!rootProm) {
               currFolder = fold;
               rootProm = fold.isFolder(sub); 
           } else {
               rootProm = rootProm.then( function(f) {
                   currFolder = f;
                   if(f) return f.isFolder(sub);
                   return false;
               })
           }
           
           rootProm = rootProm.then( function(is_fold) {
                      if(is_fold) {
                          return currFolder.getFolder(sub);
                      } 
                      return false;
                  });
       });

   rootProm.then(response);
    
});

```

### <a name="indexedDBFsFolder_fromData"></a>indexedDBFsFolder::fromData(obj)


```javascript

// Create new directories...
var me = this;
var local = this._db,
    server = this._server;

return _promise(
    function(result, fail) {
        var all = [];
        var myProm = _promise();
        server.then(
            function() {
                for(var n in obj ) {
                    
                    if(n.indexOf("..") >=0) {
                        fail(".. symbol is not allowed in the file or path names");
                        return;
                    }
                    
                    var name = n;
                    if(me.isObject(obj[name])) {
                        ( function() { 
                            var dirDone = _promise();
                            all.push(dirDone);
                            me.createDir(name)
                                .then( function() {
                                    var newF = me.getSubFolderObj(name);
                                    return newF.fromData( obj[name] );
                                })
                                .then( function() {
                                    dirDone.resolve();
                                })
                                .fail( function() {
                                    dirDone.resolve();
                                });
                        }());
                    } else {
                        if(typeof(obj[name]) == "string") {                
                            all.push( me.writeFile( name, obj[name] ));
                        }
                    }
                }        
                myProm.all( all ).then( function() {
                    result(true);
                }).fail( fail );
                myProm.resolve(true);                
            });

    });



```

### <a name="indexedDBFsFolder_getFolder"></a>indexedDBFsFolder::getFolder(name)


```javascript
return this.getSubFolderObj(name);
```

### <a name="indexedDBFsFolder_getSubFolderObj"></a>indexedDBFsFolder::getSubFolderObj(dirName)


```javascript

var subPath = this._normalize( this._path+dirName+"/" );
return indexedDBFsFolder( this._server, subPath );

```

### <a name="indexedDBFsFolder_getTree"></a>indexedDBFsFolder::getTree(t)


```javascript
var treePromise =  this.toData({ getData : false});
return treePromise;
```

### <a name="indexedDBFsFolder_id"></a>indexedDBFsFolder::id(t)


```javascript
return this._id;
```

### indexedDBFsFolder::constructor( server, pathString )

```javascript


this._server  = server;
this._path = pathString;
this._id = this.guid();
this._db = server.getDb();


```
        
### <a name="indexedDBFsFolder_isFile"></a>indexedDBFsFolder::isFile(fileName)


```javascript
var p, me = this;
return _promise(
    function(result, fail) {
        result(me._isFile(fileName));
    } );
```

### <a name="indexedDBFsFolder_isFolder"></a>indexedDBFsFolder::isFolder(fileName)


```javascript
var p, me = this;
return _promise(
    function(result, fail) {
        result(me._isFolder(fileName));
    } );
```

### <a name="indexedDBFsFolder_linesToJsonArray"></a>indexedDBFsFolder::linesToJsonArray(str)


```javascript
if(!str || typeof(str) != "string") return [];
var a = str.split("\n");
var res = [];
a.forEach( function(line) {
    if(line.trim().length==0) return;
    res.push( JSON.parse(line) );
})
return res;
```

### <a name="indexedDBFsFolder_listFiles"></a>indexedDBFsFolder::listFiles(filter)


```javascript

var p, me = this;
var local = this._db,
    server = this._server;

return _promise(
    function(result, fail) {
        server.then( function() {
            me._loadFiles().then( function(list) {
                var res = [];
                list.forEach( function(data) {
                    res.push(data.name);
                })
                result(res);
            })
        }).fail(fail);
    });


```

### <a name="indexedDBFsFolder_listFolders"></a>indexedDBFsFolder::listFolders(filter)


```javascript
var p, me = this;
var local = this._db,
    server = this._server;

return _promise(
    function(result, fail) {
        server.then( function() {
            me._loadFolders().then( function(list) {
                var res = [];
                list.forEach( function(data) {
                    res.push(data.name);
                })
                result(res);
            })
        }).fail(fail);
    });
```

### <a name="indexedDBFsFolder_readFile"></a>indexedDBFsFolder::readFile(fileName, notUsed)


```javascript
var p, me = this;
var local = this._db,
    server = this._server;

return _promise(
    function(result, fail) {

        server.then( function() {
            return me._isFile( fileName );
        }).then( function(isFile) {
            if(!isFile) {
                throw "The file does not exist";
            } else {
                return "OK";
            } 
        }).then( function() {
            // remove the old write from the file table
            return local.table("fileWrites").getAll({filePath : me._filePath(fileName) });
        }).then( function(list) {
            var str = "";
            list.forEach( function(write) {
                str+=write.data;
            })
            result(str);
        }).fail(fail);

    } );
```

### <a name="indexedDBFsFolder_removeFile"></a>indexedDBFsFolder::removeFile(fileName)


```javascript
var p, me = this;
var local = this._db,
    server = this._server;

return _promise(
    function(result, fail) {
    
        var bIsFile = false;
        server.then( function() {
            return me._isFile( fileName );
        }).then( function(isFile) {
            bIsFile = isFile;
            if(!isFile) {
                return "OK";
            } else {
                return local.table("fileWrites").remove({filePath : me._filePath(fileName) });
            } 
        }).then( function() {
            if(bIsFile) {
                // {name: "README.TXT", folderName: "/"}
                return local.table("files")._cursorAction("readwrite", {folderName : me._path }, 
                    function(cursor) {
                        var data = cursor.value;
                        if(data.name==fileName) {
                            cursor.delete(); // remove the file if
                            me._removeFileFromCache(fileName);
                        }
                    }
                )
            } else {
                return "OK";
            } 
        }).then( function() {
            // all should be ready...
            result({result : true, text : "file "+fileName+" removed"});
        }).fail(fail);

    } );


```

### <a name="indexedDBFsFolder_toData"></a>indexedDBFsFolder::toData(options, notUsed)


```javascript

var me = this;

var options = options || {};

var fileFilter = options.fileFilter,
    dirFilter = options.dirFilter;

if(typeof( options.getData ) == "undefined" ) options.getData = true;

return _promise(
    function(result, fail) {
        
        var o = {};
        me.listFiles().then( function(list) {
            var cnt = list.length, done = 0,
                waiting = _promise();
            
            list.forEach(function(n) {
                if(fileFilter) {
                    if(!fileFilter(n)) {
                        done++;
                        if(done==cnt) waiting.resolve(true);       
                        return;
                    }
                }
                if(options.getData) {
                    me.readFile(n).then( function(data) {
                        o[n] = data;
                        done++;
                        if(done==cnt) waiting.resolve(true);
                    });
                } else {
                    o[n] = true;
                    done++;
                    if(done==cnt) waiting.resolve(true);                    
                }
            });
            if(cnt==0) waiting.resolve(true);
            return waiting;
        }).then( function() {
            return me.listFolders();
        }).then( function(list) {
            var cnt = list.length, done = 0,
                waiting = _promise();
            list.forEach(function(dirName) {
                if(dirFilter) {
                    if(!dirFilter(dirName)) {
                        done++;
                        if(done==cnt) waiting.resolve(true);     
                        return;
                    }
                }             
                var subName = me._lastPath(dirName);
                var newF = me.getSubFolderObj(subName);
                newF.toData(fileFilter, dirFilter).then( function(data) {
                    o[subName] = data;
                    done++;
                    if(done==cnt) waiting.resolve(true);
                });
            });
            if(cnt==0) waiting.resolve(true);
            return waiting;            
        }).then( function() {
            result( o );  
        }).fail( function() {
            result({}); 
        });
});
```

### <a name="indexedDBFsFolder_writeFile"></a>indexedDBFsFolder::writeFile(fileName, fileData)


```javascript
var p, me = this;
var local = this._db,
    server = this._server;

return _promise(
    function(result, fail) {
        
        if(typeof(fileData) != "string") {
            // can not write anything else than strings
            fail({result : false, text : "Only string writes are accepted"});
            return;
        }

        server.then( function() {
            return me._isFile( fileName );
        }).then( function(isFile) {
            if(!isFile) {
                return local.table("files").addRows([
                    { name : fileName, folderName : me._path }
                ]);
            } else {
                return "OK";
            } 
        }).then( function() {
            // remove the old write from the file table
            return local.table("fileWrites").remove({filePath : me._filePath(fileName) });
        }).then( function() {
            return local.table("fileWrites").addRows([{filePath : me._filePath(fileName), data : fileData }]);
        }).then( function() {
            // all should be ready...
            result({result : true, text : "file "+fileName+" written"});
        }).fail(fail);

    } );

```



   
    
## trait _dataTrait

The class has following internal singleton variables:
        
* _eventOn
        
* _commands
        
        
### <a name="_dataTrait_guid"></a>_dataTrait::guid(t)


```javascript

return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);

```

### <a name="_dataTrait_isArray"></a>_dataTrait::isArray(t)


```javascript
return Object.prototype.toString.call( t ) === '[object Array]';
```

### <a name="_dataTrait_isFunction"></a>_dataTrait::isFunction(fn)


```javascript
return Object.prototype.toString.call(fn) == '[object Function]';
```

### <a name="_dataTrait_isObject"></a>_dataTrait::isObject(t)


```javascript
return t === Object(t);
```


    
    


   
      
    



      
    
      
            
# Class fsServerIndexedDB


The class has following internal singleton variables:
        
* _instances
        
        
### <a name="fsServerIndexedDB__classFactory"></a>fsServerIndexedDB::_classFactory(id)


```javascript
if(!_instances) {
    _instances = {};
}

if(_instances[id]) {
    return _instances[id];
} else {
    _instances[id] = this;
}
```

### <a name="fsServerIndexedDB_createFrom"></a>fsServerIndexedDB::createFrom(t)


```javascript

```

### <a name="fsServerIndexedDB_getDb"></a>fsServerIndexedDB::getDb(t)


```javascript
return this._db;
```

### <a name="fsServerIndexedDB_getID"></a>fsServerIndexedDB::getID(t)

UUID for the server
```javascript

if(!this._id) {
    this._id = this.guid();
}
return this._id;
```

### <a name="fsServerIndexedDB_getRootFolder"></a>fsServerIndexedDB::getRootFolder(t)


```javascript


return indexedDBFsFolder(this, "/");
```

### fsServerIndexedDB::constructor( serverName, createFrom )
the database is named &quot;vserver://&quot;+serverName
```javascript

var me = this;
this._serverName = serverName;
this._dbName = "vserver://"+serverName;
this._db = _localDB(this._dbName,
    {
        tables : {
            folders : {
                createOptions : { keyPath : "name" },
                indexes : {
                    parentFolder : { unique: false }
                }
            },
            files : {
                createOptions : { autoIncrement : true  },
                indexes : {
                    folderName : { unique: false }
                }
            },
            fileWrites : {
                createOptions : { autoIncrement : true  },
                indexes : {
                    filePath : { unique: false }
                }                
            }
        }
    });
  
// make sure that there is at least the root folder ...
this._db.then( function() {
    me._db.table("folders").count().then( function(cnt) {

        if(cnt >= 1) {
            
            if(createFrom) {

                me.getRootFolder()._initFromData( createFrom ).then(
                    function() {
                        me.resolve(true); 
                    });
            } else {
                me.resolve(true);
            }
        } else {
            
            me._db.table("folders").addRows([{name:"/"}]).then( function() {
                if(createFrom) {

                    me.getRootFolder()._initFromData( createFrom ).then(
                        function() {
                            me.resolve(true); 
                        });
                } else {
                    me.resolve(true);
                }
            });
        }
    });
})  

```
        


   
    
## trait _dataTrait

The class has following internal singleton variables:
        
        
### <a name="_dataTrait_guid"></a>_dataTrait::guid(t)


```javascript

return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);

```

### <a name="_dataTrait_isArray"></a>_dataTrait::isArray(t)


```javascript
return Object.prototype.toString.call( t ) === '[object Array]';
```

### <a name="_dataTrait_isFunction"></a>_dataTrait::isFunction(fn)


```javascript
return Object.prototype.toString.call(fn) == '[object Function]';
```

### <a name="_dataTrait_isObject"></a>_dataTrait::isObject(t)


```javascript
return t === Object(t);
```


    
    


   
      
    



      
    
      
            
# Class fsServerNode


The class has following internal singleton variables:
        
* _servers
        
        
### <a name="fsServerNode__initServers"></a>fsServerNode::_initServers(t)


```javascript
if(!_servers) {
    _servers = {};
}
```

### <a name="fsServerNode_getRootFolder"></a>fsServerNode::getRootFolder(t)


```javascript

// just a trivial security that the FS is not used for root folder
var root = this._fsRoot;
if(!root || root.length< 15 || (root.indexOf("..") >=0)) {
    throw "Invalid root folder";
    return false;
}

var me = this;
return nodeFsFolder( me._fsRoot );

```

### fsServerNode::constructor( fsRoot, createFrom )

```javascript

// trivial security check to prevent accidentally using system root or
// directories close to it
if(!fsRoot || fsRoot.length< 15 || (fsRoot.indexOf("..") >=0)) {
    throw "Invalid root folder";
    return false;
}
this._fsRoot = fsRoot;
var me = this;

if(createFrom) {
    this.getRootFolder().fromData(createFrom).then( function() {
        me.resolve(true);
    });
} else {
    this.resolve(true);
}
```
        


   


   



      
    



      
    
      
            
# Class channelPolicyModule


The class has following internal singleton variables:
        
        
### channelPolicyModule::constructor( t )

```javascript

```
        


   
    
    


   
      
            
# Class _chPolicy


The class has following internal singleton variables:
        
        
### <a name="_chPolicy_constructClientToServer"></a>_chPolicy::constructClientToServer(clientState)


```javascript
var chData = clientState.data;

if(!clientState.last_sent) {
    clientState.last_sent = [];
}


// last_update : [1, 30]
var start = clientState.last_sent[1] || 0;
var end = chData._journal.length;

// --- do not re-send


// last_update[]
// clientState.last_update

// problems here??
if(clientState.last_update) {

    if(start < clientState.last_update[1]) {
        start = clientState.last_update[1];
    }    
    
    var fromServer = clientState.last_update[1] || 0;
    if(fromServer >= end) {
        //console.log(" fromServer >= end ");
        return null;
    }
}


if( start == end ) {
    // console.log(" start == end ");
    return null;
}

console.log("clientToServer");
console.log(clientState.last_update);
console.log(start,end);


// [2,4]
// 0 
// 1
// 2 *
// 3 *

clientState.last_sent[0] = start;
clientState.last_sent[1] = end;

var obj = {
    id : this.guid(),
    c : chData._journal.slice( start, end ),
    start : start,
    end : end,
    version : clientState.version
};

if(clientState.client) {
    for(var i=0; i<obj.c.length;i++) {
        var c = obj.c[i];
        obj.c[i] = clientState.client._transformCmdFromNs( c );
    }
}
return obj;

```

### <a name="_chPolicy_constructServerToClient"></a>_chPolicy::constructServerToClient(serverState)


```javascript

var chData = serverState.data;

if(!serverState.last_update) {
    serverState.last_update = [];
}

// last_update : [1, 30]
var start = serverState.last_update[1] || 0;
var end = chData._journal.length;

if( start == end ) return null;

// [2,4]
// 0 
// 1
// 2 *
// 3 *

serverState.last_update[0] = start;
serverState.last_update[1] = end;

return {
    c : chData._journal.slice( start, end ),
    start : start,
    end : end,
    version : serverState.version
};



```

### <a name="_chPolicy_deltaClientToServer"></a>_chPolicy::deltaClientToServer(clientFrame, serverState)
`clientFrame` This is the clients changeFrame which should be applied to the servers internal state
 
`serverState` This object holds the data the server needs
 


```javascript
// the client frame
/*
{
    id          : "transaction ID",        // unique ID for transaction
    socket_id   : "socketid",              // added by the server
    v : 1,                          // main file + journal version
    lu : [1,10],                        // last update from server 0..N
    tl : 1,                          // transaction level
    c : [
                                    // list of channel commands to run
    ]
}
*/
// the server state structure
/*
{
    data : channelData,     // The channel data object
    version : 1,
    last_update : [1, 30],  // version + journal line
    lagging_sockets : {}    // hash of invalid sockets
}
*/

if(!clientFrame) return;

if(!serverState._done) serverState._done = {};

console.log("Processing client frame");
console.log(JSON.stringify(clientFrame));

try {
        
    if(!clientFrame.id) return;
    // if(!clientFrame.socket_id) return;
    if(serverState._done[clientFrame.id]) return res;
    
    serverState._done[clientFrame.id] = true;    
    
    var chData = serverState.data; // the channel data object
    var errors = [];

    // now, it's simple, we just try to apply all the comands
    for(var i=0; i<clientFrame.c.length; i++) {
        var c = clientFrame.c[i];
        var cmdRes = chData.execCmd(c);
        if( cmdRes !== true ) {
            errors.push( cmdRes );
        }
    }
    
    var results =  {
        errors : errors
    };
    console.log(JSON.stringify(results));   
    
    return results;

} catch(e) {
    // in this version, NO PROBLEMO!
    return e.message;
}



```

### <a name="_chPolicy_deltaServerToClient"></a>_chPolicy::deltaServerToClient(updateFrame, clientState)
`updateFrame` request from server to client
 
`clientState` This object holds the data the client needs to pefrform it&#39;s actions
 


```javascript

// the client state
/*
{
    data : channelData,     // The channel data object
    version : 1,
    last_update : [1, 30],  // last server update
}
*/

// the server sends
/*
{
    c : chData._journal.slice( start, end ),
    start : start,
    end : end,
    version : serverState.version
}
*/
// check where is our last point of action...

if(!updateFrame) return;

var data = clientState.data; // the channel data we have now

if(!clientState.last_update) {
    clientState.last_update = [];
}
// [2,4] = [start, end]
// 0 
// 1
// 2 *
// 3 *

var result = {
    goodCnt : 0,
    oldCnt : 0,
    newCnt : 0,
    reverseCnt : 0
};

console.log("deltaServerToClient");
console.log(clientState.last_update);

var sameUntil = updateFrame.start;

if(clientState.needsRefresh) {
    console.log("** client needs refresh **");
    return;
}

if(updateFrame.start > data._journal.length ) {

    console.log("--- setting refresh on because of ---- ");
    console.log(" updateFrame.start > data._journal.length ");  
    
    clientState.needsRefresh = true;
    result.fail = true;
    return result;
}

if(clientState.client) {
    for(var i=updateFrame.start; i<updateFrame.end; i++) {
        var serverCmd = updateFrame.c[i-updateFrame.start];
        updateFrame.c[i-updateFrame.start] = clientState.client._transformCmdToNs( serverCmd );
    }
}


for(var i=updateFrame.start; i<updateFrame.end; i++) {
    
    var myJ = data.getJournalCmd(i);    
    var serverCmd = updateFrame.c[i-updateFrame.start];
    
    var bSame = true;
    if(myJ) {
        
        if(myJ[0]==13 && serverCmd[0] ==13 && (myJ[4]== serverCmd[4]) && (myJ[1]== serverCmd[1])) {
            var mainArray1 = myJ[2],  
                mainArray2 = serverCmd[2];
            if(mainArray1.length != mainArray2.length) {
                bSame = false;
            } else {
                for(var mi=0; mi<mainArray1.length;mi++) {
                    if(!bSame) break;
                    var arr1 = mainArray1[mi],
                        arr2 = mainArray2[mi];
                    for(var ai=0; ai<5; ai++) {
                        if(arr1[ai]!=arr2[ai]) {
                            console.log("not same ", ai, arr1[ai], arr2[ai]);
                            bSame = false;
                            break;
                        }
                    }
                    if(bSame) {
                        if(this.isArray(arr1[5])) {
                            var arr1 = arr1[5],  
                                arr2 = arr2[5];
                            var len = Math.max( arr1.length || 0, arr2.length || 0);
                            for(var ai=0; ai<len; ai++) {
                                if(arr1[ai]!=arr2[ai]) {
                                    console.log("not same array ", ai);
                                    bSame = false;
                                    break;
                                }
                            }                    
                        } else {
                           if(arr1[5]!=arr2[5]) {
                                bSame = false;
                            } 
                        }
                    }
                    if(!bSame) {
                        console.log("was not the same");
                        console.log(serverCmd, "vs", myJ );           
                    }
                }
            }
        } else {
            for(var j=0; j<=4; j++) {
                if(myJ[j] != serverCmd[j]) {
                    bSame = false;
                    console.log("was not the same");
                    console.log(serverCmd[j], "vs", myJ[j] );
                }
            }
        }
    } else {
        // a new command has arrived...
        
        var cmdRes = data.execCmd(serverCmd, true); // true = remote cmd
        if( cmdRes !== true ) {
            // if we get errors then we have some kind of problem
                console.log("--- setting refresh on because of ---- ");
                console.log(JSON.stringify(cmdRes));  
            clientState.needsRefresh = true;
            result.fail = true;
            result.reason = cmdRes;
            return result;             
        } else {         
            sameUntil = i; // ??
            result.goodCnt++;
            result.newCnt++;
        }
        
        continue;
    }
    if(bSame) {
        sameUntil = i;
        result.goodCnt++;
        result.oldCnt++;
    } else {
        // the sent commands did differ...
        
        // TODO: rollback
        data.reverseToLine( sameUntil  );
        // and then run commands without sending them outside...
        for(var i=sameUntil; i<updateFrame.end; i++) {
            
            var serverCmd = updateFrame.c[i-updateFrame.start];    
            var cmdRes = data.execCmd(serverCmd, true); // true = remote cmd
            if( cmdRes !== true ) {
    
                console.log("--- setting refresh on because of ---- ");
                console.log(JSON.stringify(cmdRes));                
                
                // if we get errors then we have some kind of problem
                clientState.needsRefresh = true;
                result.fail = true;
                result.reason = cmdRes;
                return result;             
            }        
            result.reverseCnt++;
        }
        
        clientState.last_update[0] = updateFrame.start;
        clientState.last_update[1] = updateFrame.end;
        
        return result;
    }
}
clientState.last_update[0] = updateFrame.start;
clientState.last_update[1] = updateFrame.end;
return result;


```



   
    
## trait _dataTrait

The class has following internal singleton variables:
        
        
### <a name="_dataTrait_guid"></a>_dataTrait::guid(t)


```javascript
return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);

```

### <a name="_dataTrait_isArray"></a>_dataTrait::isArray(t)


```javascript
return t instanceof Array;
```

### <a name="_dataTrait_isFunction"></a>_dataTrait::isFunction(fn)


```javascript
return Object.prototype.toString.call(fn) == '[object Function]';
```

### <a name="_dataTrait_isObject"></a>_dataTrait::isObject(t)


```javascript
return t === Object(t);
```


    
    


   
      
    



      
    



      
    
      
            
# Class subClassTemplate


The class has following internal singleton variables:
        
        
### <a name="subClassTemplate_helloWorld"></a>subClassTemplate::helloWorld(t)


```javascript
return "Hello World";
```



   


   



      
    




