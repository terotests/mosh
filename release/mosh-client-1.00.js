'use strict';

(function () {

  var __amdDefs__ = {};

  var _tcpEmu_prototype = function _tcpEmu_prototype() {

    (function (_myTrait_) {

      // Initialize static variables here...

      /**
       * @param float t
       */
      _myTrait_.clearEvents = function (t) {
        delete this._ev;
      };

      /**
       * Binds event name to event function
       * @param string en  - Event name
       * @param float ef
       */
      _myTrait_.on = function (en, ef) {
        if (!this._ev) this._ev = {};
        if (!this._ev[en]) this._ev[en] = [];

        this._ev[en].push(ef);

        return this;
      };

      /**
       * triggers event with data and optional function
       * @param string en
       * @param float data
       * @param float fn
       */
      _myTrait_.trigger = function (en, data, fn) {

        if (!this._ev) return;
        if (!this._ev[en]) return;
        var me = this;
        this._ev[en].forEach(function (cb) {
          cb(me, data, fn);
        });
        return this;
      };
    })(this);

    (function (_myTrait_) {
      var _eventOn;
      var _commands;

      // Initialize static variables here...

      /**
       * @param float t
       */
      _myTrait_.guid = function (t) {

        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      };

      /**
       * @param float t
       */
      _myTrait_.isArray = function (t) {
        return Object.prototype.toString.call(t) === '[object Array]';
      };

      /**
       * @param float fn
       */
      _myTrait_.isFunction = function (fn) {
        return Object.prototype.toString.call(fn) == '[object Function]';
      };

      /**
       * @param float t
       */
      _myTrait_.isObject = function (t) {
        return t === Object(t);
      };
    })(this);

    (function (_myTrait_) {
      var _channelIndex;
      var _rootData;
      var _msgBuffer;
      var _log;

      // Initialize static variables here...

      /**
       * @param float t
       */
      _myTrait_.close = function (t) {
        this.trigger('disconnect');
      };

      if (_myTrait_.__traitInit && !_myTrait_.hasOwnProperty('__traitInit')) _myTrait_.__traitInit = _myTrait_.__traitInit.slice();
      if (!_myTrait_.__traitInit) _myTrait_.__traitInit = [];
      _myTrait_.__traitInit.push(function (server, port, socketId, role, socket) {

        var me = this;
        this._server = server;
        this._port = port;
        this._role = role;
        this._socketId = socketId;
        this._dbName = 'tcp://' + this._server + ':' + this._port + ':' + this._socketId;

        if (!_log) {
          if (typeof lokki != 'undefined') {
            _log = lokki('tcp');
          } else {
            _log = {
              log: function log() {},
              error: function error() {}
            };
          }
        }

        if (socket) {
          // "this._dbName" is the message which is listened using socketPump
          this._socket = socket;
          this.socketPump(role);
        } else {
          this.memoryPump(role);
        }
      });

      /**
       * The memory storage transform layer implementation.
       * @param float role
       */
      _myTrait_.memoryPump = function (role) {
        var me = this;
        var bnTo = this._dbName + ':to';
        var bnFrom = this._dbName + ':from';

        if (!_msgBuffer) _msgBuffer = {};
        if (!_msgBuffer[bnTo]) _msgBuffer[bnTo] = [];
        if (!_msgBuffer[bnFrom]) _msgBuffer[bnFrom] = [];

        var _mfn = function _mfn() {
          if (role == 'server') {
            var list = _msgBuffer[bnTo].slice();
            list.forEach(function (msg) {
              _log.log('server got message ', msg);
              me.trigger('serverMessage', msg);
              _msgBuffer[bnTo].shift();
            });
          }
          if (role == 'client') {
            var list = _msgBuffer[bnFrom].slice();
            list.forEach(function (msg) {
              me.trigger('clientMessage', msg);
              _msgBuffer[bnFrom].shift();
            });
          }
        };
        this._memoryFn = _mfn;
        later().every(1 / 10, _mfn);
      };

      /**
       * Message &quot;from&quot; refers to client getting message from the server. This is the function to be used when a server sends data back to the client.
       * @param float msg
       */
      _myTrait_.messageFrom = function (msg) {
        var socket = this._socket;
        if (socket) {
          //console.log("The socket should emit to "+this._dbName);
          //console.log(msg);
          socket.emit(this._dbName, msg);
          return;
        }

        var bn = this._dbName + ':from';
        _msgBuffer[bn].push(msg);
      };

      /**
       * Message &quot;to&quot; refers to client sending message to server. This is the function to be used when a client socket sends data to the server.
       * @param float msg
       */
      _myTrait_.messageTo = function (msg) {

        var socket = this._socket;
        if (socket) {

          // _log.log("_tcpEmu, emitting ", this._dbName, msg);
          socket.emit(this._dbName, msg);
          return;
        }

        var bn = this._dbName + ':to';
        _msgBuffer[bn].push(msg);
      };

      /**
       * Should be called after reconnecting with new socket
       * @param float t
       */
      _myTrait_.release = function (t) {
        this.clearEvents();

        var socket = this._socket;

        if (this._pumpListener) {
          socket.removeListener(this._dbName, this._pumpListener);
        }
        if (this._memoryFn && this._memoryFn._release) this._memoryFn._release();
      };

      /**
       * The socket transform layer implementation.
       * @param float role
       */
      _myTrait_.socketPump = function (role) {
        var me = this;

        var socket = this._socket;

        if (role == 'server') {
          this._pumpListener = function (data) {
            // _log.log("socketPump", me._dbName);
            me.trigger('serverMessage', data);
          };
          socket.on(this._dbName, this._pumpListener);
        }

        if (role == 'client') {
          this._pumpListener = function (data) {
            me.trigger('clientMessage', data);
          };
          socket.on(this._dbName, this._pumpListener);
        }
      };
    })(this);
  };

  var _tcpEmu = function _tcpEmu(a, b, c, d, e, f, g, h) {
    var m = this,
        res;
    if (m instanceof _tcpEmu) {
      var args = [a, b, c, d, e, f, g, h];
      if (m.__factoryClass) {
        m.__factoryClass.forEach(function (initF) {
          res = initF.apply(m, args);
        });
        if (typeof res == 'function') {
          if (res._classInfo.name != _tcpEmu._classInfo.name) return new res(a, b, c, d, e, f, g, h);
        } else {
          if (res) return res;
        }
      }
      if (m.__traitInit) {
        m.__traitInit.forEach(function (initF) {
          initF.apply(m, args);
        });
      } else {
        if (typeof m.init == 'function') m.init.apply(m, args);
      }
    } else return new _tcpEmu(a, b, c, d, e, f, g, h);
  };

  _tcpEmu._classInfo = {
    name: '_tcpEmu'
  };
  _tcpEmu.prototype = new _tcpEmu_prototype();

  var later_prototype = function later_prototype() {

    (function (_myTrait_) {
      var _initDone;
      var _callers;
      var _oneTimers;
      var _everies;
      var _framers;
      var _localCnt;
      var _easings;
      var _easeFns;

      // Initialize static variables here...

      /**
       * @param float t
       */
      _myTrait_._easeFns = function (t) {
        _easings = {
          easeIn: function easeIn(t) {
            return t * t;
          },
          easeOut: function easeOut(t) {
            return -1 * t * (t - 2);
          },
          easeInOut: function easeInOut(t) {
            if (t < 0.5) return t * t;
            return -1 * t * (t - 2);
          },
          easeInCubic: function easeInCubic(t) {
            return t * t * t;
          },
          easeOutCubic: function easeOutCubic(t) {
            return (1 - t) * (1 - t) * (1 - t) + 1;
          },
          pow: function pow(t) {
            return Math.pow(t, parseFloat(1.5 - t));
          },
          linear: function linear(t) {
            return t;
          }
        };
      };

      /**
       * @param function fn
       * @param float thisObj
       * @param float args
       */
      _myTrait_.add = function (fn, thisObj, args) {
        if (thisObj || args) {
          var tArgs;
          if (Object.prototype.toString.call(args) === '[object Array]') {
            tArgs = args;
          } else {
            tArgs = Array.prototype.slice.call(arguments, 2);
            if (!tArgs) tArgs = [];
          }
          _callers.push([thisObj, fn, tArgs]);
        } else {
          _callers.push(fn);
        }
      };

      /**
       * @param float name
       * @param float fn
       */
      _myTrait_.addEasingFn = function (name, fn) {
        _easings[name] = fn;
      };

      /**
       * @param float seconds
       * @param float fn
       * @param float name
       */
      _myTrait_.after = function (seconds, fn, name) {

        if (!name) {
          name = 'aft_' + _localCnt++;
        }

        _everies[name] = {
          step: Math.floor(seconds * 1000),
          fn: fn,
          nextTime: 0,
          remove: true
        };
      };

      /**
       * @param function fn
       */
      _myTrait_.asap = function (fn) {
        this.add(fn);
      };

      /**
       * @param String name  - Name of the easing to use
       * @param int delay  - Delay of the transformation in ms
       * @param function callback  - Callback to set the values
       * @param function over  - When animation is over
       */
      _myTrait_.ease = function (name, delay, callback, over) {

        var fn = _easings[name];
        if (!fn) fn = _easings.pow;
        var id_name = 'e_' + _localCnt++;
        _easeFns[id_name] = {
          easeFn: fn,
          duration: delay,
          cb: callback,
          over: over
        };
      };

      /**
       * @param float seconds
       * @param float fn
       * @param float name
       */
      _myTrait_.every = function (seconds, fn, name) {

        if (!name) {
          name = 't7491_' + _localCnt++;
        }

        _everies[name] = {
          step: Math.floor(seconds * 1000),
          fn: fn,
          nextTime: 0
        };
      };

      if (_myTrait_.__traitInit && !_myTrait_.hasOwnProperty('__traitInit')) _myTrait_.__traitInit = _myTrait_.__traitInit.slice();
      if (!_myTrait_.__traitInit) _myTrait_.__traitInit = [];
      _myTrait_.__traitInit.push(function (interval, fn) {
        if (!_initDone) {
          this._easeFns();
          _localCnt = 1;

          var frame, cancelFrame;
          if (typeof window != 'undefined') {
            var frame = window['requestAnimationFrame'],
                cancelFrame = window['cancelRequestAnimationFrame'];
            ['', 'ms', 'moz', 'webkit', 'o'].forEach(function (x) {
              if (!frame) {
                frame = window[x + 'RequestAnimationFrame'];
                cancelFrame = window[x + 'CancelAnimationFrame'] || window[x + 'CancelRequestAnimationFrame'];
              }
            });
          }

          var is_node_js = new Function('try { return this == global; } catch(e) { return false; }')();

          if (is_node_js) {
            frame = function (cb) {
              return setImmediate(cb); // (cb,1);
            };
          } else {
            if (!frame) {
              frame = function (cb) {
                return setTimeout(cb, 16);
              };
            }
          }

          if (!cancelFrame) cancelFrame = function (id) {
            clearTimeout(id);
          };

          _callers = [];
          _oneTimers = {};
          _everies = {};
          _framers = [];
          _easeFns = {};
          var lastMs = 0;

          var _callQueQue = function _callQueQue() {
            var ms = new Date().getTime(),
                elapsed = lastMs - ms;

            if (lastMs == 0) elapsed = 0;
            var fn;
            while (fn = _callers.shift()) {
              if (Object.prototype.toString.call(fn) === '[object Array]') {
                fn[1].apply(fn[0], fn[2]);
              } else {
                fn();
              }
            }

            for (var i = 0; i < _framers.length; i++) {
              var fFn = _framers[i];
              fFn();
            }
            /*
            _easeFns.push({
            easeFn : fn,
            duration : delay,
            cb : callback
            });
               */
            for (var n in _easeFns) {
              if (_easeFns.hasOwnProperty(n)) {
                var v = _easeFns[n];
                if (!v.start) v.start = ms;
                var delta = ms - v.start,
                    dt = delta / v.duration;
                if (dt >= 1) {
                  dt = 1;
                  delete _easeFns[n];
                }
                v.cb(v.easeFn(dt));
                if (dt == 1 && v.over) v.over();
              }
            }

            for (var n in _oneTimers) {
              if (_oneTimers.hasOwnProperty(n)) {
                var v = _oneTimers[n];
                v[0](v[1]);
                delete _oneTimers[n];
              }
            }

            for (var n in _everies) {
              if (_everies.hasOwnProperty(n)) {
                var v = _everies[n];
                if (v.nextTime < ms) {
                  if (v.remove) {
                    if (v.nextTime > 0) {
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
                if (v.until) {
                  if (v.until < ms) {
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
      });

      /**
       * @param  key
       * @param float fn
       * @param float value
       */
      _myTrait_.once = function (key, fn, value) {
        // _oneTimers

        _oneTimers[key] = [fn, value];
      };

      /**
       * @param function fn
       */
      _myTrait_.onFrame = function (fn) {

        _framers.push(fn);
      };

      /**
       * @param float fn
       */
      _myTrait_.removeFrameFn = function (fn) {

        var i = _framers.indexOf(fn);
        if (i >= 0) {
          if (fn._onRemove) {
            fn._onRemove();
          }
          _framers.splice(i, 1);
          return true;
        } else {
          return false;
        }
      };
    })(this);
  };

  var later = function later(a, b, c, d, e, f, g, h) {
    var m = this,
        res;
    if (m instanceof later) {
      var args = [a, b, c, d, e, f, g, h];
      if (m.__factoryClass) {
        m.__factoryClass.forEach(function (initF) {
          res = initF.apply(m, args);
        });
        if (typeof res == 'function') {
          if (res._classInfo.name != later._classInfo.name) return new res(a, b, c, d, e, f, g, h);
        } else {
          if (res) return res;
        }
      }
      if (m.__traitInit) {
        m.__traitInit.forEach(function (initF) {
          initF.apply(m, args);
        });
      } else {
        if (typeof m.init == 'function') m.init.apply(m, args);
      }
    } else return new later(a, b, c, d, e, f, g, h);
  };

  later._classInfo = {
    name: 'later'
  };
  later.prototype = new later_prototype();

  (function () {
    if (typeof define !== 'undefined' && define !== null && define.amd != null) {
      __amdDefs__['later'] = later;
      this.later = later;
    } else if (typeof module !== 'undefined' && module !== null && module.exports != null) {
      module.exports['later'] = later;
    } else {
      this.later = later;
    }
  }).call(new Function('return this')());

  var _promise_prototype = function _promise_prototype() {

    (function (_myTrait_) {

      // Initialize static variables here...

      /**
       * @param float someVar
       */
      _myTrait_.isArray = function (someVar) {
        return Object.prototype.toString.call(someVar) === '[object Array]';
      };

      /**
       * @param Function fn
       */
      _myTrait_.isFunction = function (fn) {
        return Object.prototype.toString.call(fn) == '[object Function]';
      };

      /**
       * @param Object obj
       */
      _myTrait_.isObject = function (obj) {
        return obj === Object(obj);
      };
    })(this);

    (function (_myTrait_) {

      // Initialize static variables here...

      /**
       * @param Array firstArg
       */
      _myTrait_.all = function (firstArg) {

        var args;
        if (this.isArray(firstArg)) {
          args = firstArg;
        } else {
          args = Array.prototype.slice.call(arguments, 0);
        }
        // console.log(args);
        var targetLen = args.length,
            rCnt = 0,
            myPromises = [],
            myResults = new Array(targetLen);

        return this.then(function () {

          var allPromise = _promise();
          if (args.length == 0) {
            allPromise.resolve([]);
          }
          args.forEach(function (b, index) {
            if (b.then) {
              // console.log("All, looking for ", b, " state = ", b._state);
              myPromises.push(b);

              b.then(function (v) {
                myResults[index] = v;
                // console.log("Got a promise...",b, " cnt = ", rCnt);
                rCnt++;
                if (rCnt == targetLen) {
                  allPromise.resolve(myResults);
                }
              }, function (v) {
                allPromise.reject(v);
              });
            } else {
              allPromise.reject('Not list of promises');
            }
          });

          return allPromise;
        });
      };

      /**
       * @param function collectFn
       * @param array promiseList
       * @param Object results
       */
      _myTrait_.collect = function (collectFn, promiseList, results) {

        var args;
        if (this.isArray(promiseList)) {
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

        return this.then(function () {

          var allPromise = _promise();
          args.forEach(function (b, index) {
            if (b.then) {
              // console.log("All, looking for ", b, " state = ", b._state);
              myPromises.push(b);

              b.then(function (v) {
                rCnt++;
                isReady = collectFn(v, myResults);
                if (isReady && !noMore || noMore == false && targetLen == rCnt) {
                  allPromise.resolve(myResults);
                  noMore = true;
                }
              }, function (v) {
                allPromise.reject(v);
              });
            } else {
              allPromise.reject('Not list of promises');
            }
          });

          return allPromise;
        });
      };

      /**
       * @param function fn
       */
      _myTrait_.fail = function (fn) {
        return this.then(null, fn);
      };

      /**
       * @param float withValue
       */
      _myTrait_.fulfill = function (withValue) {
        // if(this._fulfilled || this._rejected) return;

        if (this._rejected) return;
        if (this._fulfilled && withValue != this._stateValue) {
          return;
        }

        var me = this;
        this._fulfilled = true;
        this._stateValue = withValue;

        var chCnt = this._childPromises.length;

        while (chCnt--) {
          var p = this._childPromises.shift();
          if (p._onFulfill) {
            try {
              var x = p._onFulfill(withValue);
              // console.log("Returned ",x);
              if (typeof x != 'undefined') {
                p.resolve(x);
              } else {
                p.fulfill(withValue);
              }
            } catch (e) {
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
      };

      /**
       * @param float fname
       * @param float fn
       */
      _myTrait_.genPlugin = function (fname, fn) {
        var me = this;
        this.plugin(fname, function () {
          var args = Array.prototype.slice.call(arguments, 0);
          console.log('Plugin args', args);
          var myPromise = _promise();
          this.then(function (v) {
            var args2 = Array.prototype.slice.call(arguments, 0);
            var z = args.concat(args2);
            var res = fn.apply(this, z);
            myPromise.resolve(res);
          }, function (r) {
            myPromise.reject(r);
          });
          return myPromise;
        });
      };

      if (_myTrait_.__traitInit && !_myTrait_.hasOwnProperty('__traitInit')) _myTrait_.__traitInit = _myTrait_.__traitInit.slice();
      if (!_myTrait_.__traitInit) _myTrait_.__traitInit = [];
      _myTrait_.__traitInit.push(function (onFulfilled, onRejected) {
        // 0 = pending
        // 1 = fullfilled
        // 2 = error

        this._state = 0;
        this._stateValue = null;
        this._isAPromise = true;
        this._childPromises = [];

        if (this.isFunction(onFulfilled)) this._onFulfill = onFulfilled;
        if (this.isFunction(onRejected)) this._onReject = onRejected;

        if (!onRejected && this.isFunction(onFulfilled)) {

          var me = this;
          later().asap(function () {
            onFulfilled(function (v) {
              me.resolve(v);
            }, function (v) {
              me.resolve(v);
            });
          });
        }
      });

      /**
       * @param float t
       */
      _myTrait_.isFulfilled = function (t) {
        return this._state == 1;
      };

      /**
       * @param float t
       */
      _myTrait_.isPending = function (t) {
        return this._state == 0;
      };

      /**
       * @param bool v
       */
      _myTrait_.isRejected = function (v) {
        return this._state == 2;
      };

      /**
       * @param float fname
       * @param float fn
       */
      _myTrait_.nodeStyle = function (fname, fn) {
        var me = this;
        this.plugin(fname, function () {
          var args = Array.prototype.slice.call(arguments, 0);
          var last,
              userCb,
              cbIndex = 0;
          if (args.length >= 0) {
            last = args[args.length - 1];
            if (Object.prototype.toString.call(last) == '[object Function]') {
              userCb = last;
              cbIndex = args.length - 1;
            }
          }

          var mainPromise = wishes().pending();
          this.then(function () {
            var nodePromise = wishes().pending();
            var args2 = Array.prototype.slice.call(arguments, 0);
            console.log('Orig args', args);
            console.log('Then args', args2);
            var z;
            if (args.length == 0) z = args2;
            if (args2.length == 0) z = args;
            if (!z) z = args2.concat(args);
            cbIndex = z.length; // 0,fn... 2
            if (userCb) cbIndex--;
            z[cbIndex] = function (err) {
              if (err) {
                console.log('Got error ', err);
                nodePromise.reject(err);
                mainPromise.reject(err);
                return;
              }
              if (userCb) {
                var args = Array.prototype.slice.call(arguments);
                var res = userCb.apply(this, args);
                mainPromise.resolve(res);
              } else {
                var args = Array.prototype.slice.call(arguments, 1);
                mainPromise.resolve.apply(mainPromise, args);
              }
            };
            nodePromise.then(function (v) {
              mainPromise.resolve(v);
            });

            console.log('nodeStyle after concat', z);
            var res = fn.apply(this, z);
            // myPromise.resolve(res);
            // return nodePromise;
            return nodePromise;
          }, function (v) {
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
        });
      };

      /**
       * @param function fn
       */
      _myTrait_.onStateChange = function (fn) {

        if (!this._listeners) this._listeners = [];

        this._listeners.push(fn);
      };

      /**
       * @param float n
       * @param float fn
       */
      _myTrait_.plugin = function (n, fn) {

        _myTrait_[n] = fn;

        return this;
      };

      /**
       * @param Object obj
       */
      _myTrait_.props = function (obj) {
        var args = [];

        for (var n in obj) {
          if (obj.hasOwnProperty(n)) {
            args.push({
              name: n,
              promise: obj[n]
            });
          }
        }

        // console.log(args);
        var targetLen = args.length,
            rCnt = 0,
            myPromises = [],
            myResults = {};

        return this.then(function () {

          var allPromise = wishes().pending();
          args.forEach(function (def) {
            var b = def.promise,
                name = def.name;
            if (b.then) {
              // console.log("All, looking for ", b, " state = ", b._state);
              myPromises.push(b);

              b.then(function (v) {
                myResults[name] = v;
                rCnt++;
                if (rCnt == targetLen) {
                  allPromise.resolve(myResults);
                }
              }, function (v) {
                allPromise.reject(v);
              });
            } else {
              allPromise.reject('Not list of promises');
            }
          });

          return allPromise;
        });
      };

      /**
       * @param Object withReason
       */
      _myTrait_.reject = function (withReason) {

        // if(this._rejected || this._fulfilled) return;

        // conso

        if (this._fulfilled) return;
        if (this._rejected && withReason != this._rejectReason) return;

        this._state = 2;
        this._rejected = true;
        this._rejectReason = withReason;
        var me = this;

        var chCnt = this._childPromises.length;
        while (chCnt--) {
          var p = this._childPromises.shift();

          if (p._onReject) {
            try {
              p._onReject(withReason);
              p.reject(withReason);
            } catch (e) {
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
      };

      /**
       * @param Object reason
       */
      _myTrait_.rejectReason = function (reason) {
        if (reason) {
          this._rejectReason = reason;
          return;
        }
        return this._rejectReason;
      };

      /**
       * @param Object x
       */
      _myTrait_.resolve = function (x) {

        // console.log("Resolving ", x);

        // can not do this many times...
        if (this._state > 0) return;

        if (x == this) {
          // error
          this._rejectReason = 'TypeError';
          this.reject(this._rejectReason);
          return;
        }

        if (this.isObject(x) && x._isAPromise) {

          //
          this._state = x._state;
          this._stateValue = x._stateValue;
          this._rejectReason = x._rejectReason;
          // ...
          if (this._state === 0) {
            var me = this;
            x.onStateChange(function () {
              if (x._state == 1) {
                // console.log("State change");
                me.resolve(x.value());
              }
              if (x._state == 2) {
                me.reject(x.rejectReason());
              }
            });
          }
          if (this._state == 1) {
            // console.log("Resolved to be Promise was fulfilled ", x._stateValue);
            this.fulfill(this._stateValue);
          }
          if (this._state == 2) {
            // console.log("Relved to be Promise was rejected ", x._rejectReason);
            this.reject(this._rejectReason);
          }
          return;
        }
        if (this.isObject(x) && x.then && this.isFunction(x.then)) {
          // console.log("Thenable ", x);
          var didCall = false;
          try {
            // Call the x.then
            var me = this;
            x.then.call(x, function (y) {
              if (didCall) return;
              // we have now value for the promise...
              // console.log("Got value from Thenable ", y);
              me.resolve(y);
              didCall = true;
            }, function (r) {
              if (didCall) return;
              // console.log("Got reject from Thenable ", r);
              me.reject(r);
              didCall = true;
            });
          } catch (e) {
            if (!didCall) this.reject(e);
          }
          return;
        }
        this._state = 1;
        this._stateValue = x;

        // fulfill the promise...
        this.fulfill(x);
      };

      /**
       * @param float newState
       */
      _myTrait_.state = function (newState) {
        if (typeof newState != 'undefined') {
          this._state = newState;
        }
        return this._state;
      };

      /**
       * @param function onFulfilled
       * @param function onRejected
       */
      _myTrait_.then = function (onFulfilled, onRejected) {

        if (!onRejected) onRejected = function () {};

        var p = new _promise(onFulfilled, onRejected);
        var me = this;

        if (this._state == 1) {
          later().asap(function () {
            me.fulfill(me.value());
          });
        }
        if (this._state == 2) {
          ater().asap(function () {
            me.reject(me.rejectReason());
          });
        }
        this._childPromises.push(p);
        return p;
      };

      /**
       * @param float t
       */
      _myTrait_.triggerStateChange = function (t) {
        var me = this;
        if (!this._listeners) return;
        this._listeners.forEach(function (fn) {
          fn(me);
        });
        // one-timer
        this._listeners.length = 0;
      };

      /**
       * @param float v
       */
      _myTrait_.value = function (v) {
        if (typeof v != 'undefined') {
          this._stateValue = v;
          return this;
        }
        return this._stateValue;
      };
    })(this);
  };

  var _promise = function _promise(a, b, c, d, e, f, g, h) {
    var m = this,
        res;
    if (m instanceof _promise) {
      var args = [a, b, c, d, e, f, g, h];
      if (m.__factoryClass) {
        m.__factoryClass.forEach(function (initF) {
          res = initF.apply(m, args);
        });
        if (typeof res == 'function') {
          if (res._classInfo.name != _promise._classInfo.name) return new res(a, b, c, d, e, f, g, h);
        } else {
          if (res) return res;
        }
      }
      if (m.__traitInit) {
        m.__traitInit.forEach(function (initF) {
          initF.apply(m, args);
        });
      } else {
        if (typeof m.init == 'function') m.init.apply(m, args);
      }
    } else return new _promise(a, b, c, d, e, f, g, h);
  };

  _promise._classInfo = {
    name: '_promise'
  };
  _promise.prototype = new _promise_prototype();

  (function () {
    if (typeof define !== 'undefined' && define !== null && define.amd != null) {
      __amdDefs__['_promise'] = _promise;
      this._promise = _promise;
    } else if (typeof module !== 'undefined' && module !== null && module.exports != null) {
      module.exports['_promise'] = _promise;
    } else {
      this._promise = _promise;
    }
  }).call(new Function('return this')());

  var _data_prototype = function _data_prototype() {

    (function (_myTrait_) {
      var _eventOn;
      var _commands;
      var _authToken;
      var _authRandom;
      var _authUser;
      var _up;
      var _dataCache;
      var _createdFunctions;
      var _setWorkers;

      // Initialize static variables here...

      /**
       * @param float t
       */
      _myTrait_.__dataTr = function (t) {};

      /**
       * @param float me
       * @param float what
       * @param float cb
       */
      _myTrait_._collectObject = function (me, what, cb) {
        if (!this.isArray(what)) what = what.split(',');

        var myData = {};
        what.forEach(function (n) {
          myData[n] = me[n]();
          me.on(n, function () {
            myData[n] = me[n]();
            cb(myData);
          });
        });
        cb(myData);
      };

      /**
       * @param float fn
       */
      _myTrait_._forMembers = function (fn) {
        var me = this;

        if (this.isArray()) {
          for (var i = 0; i < this._data.length; i++) {
            var o = this._data[i];
            if (this.isObject(o)) {
              if (o.__dataTr) {
                fn(o);
              }
            }
          }
        } else {
          this._members.forEach(function (n) {
            if (me[n]) fn(me[n]);
          });
        }
      };

      /**
       * @param float docData
       * @param float options
       */
      _myTrait_._initializeData = function (docData, options) {

        if (!docData) return;

        // pointer to the docUp data
        this._data = docData.data;
        this._docData = docData;

        // TODO: might add worker 14 here...
        var dataCh = this._client.getChannelData();

        var ns_id = this._client._idToNs(this._docData.__id, this._client._ns);

        dataCh.createWorker('_to_ch', // worker ID
        [7, '*', null, null, ns_id], // filter
        {
          target: this
        });

        dataCh.createWorker('_to_ch', // worker ID
        [5, '*', null, null, ns_id], // filter
        {
          target: this
        });

        dataCh.createWorker('_d_set', // worker ID
        [4, '*', null, null, ns_id], // filter
        {
          target: this
        });

        dataCh.createWorker('_d_rem', // worker ID
        [8, '*', null, null, ns_id], // filter
        {
          target: this
        });

        dataCh.createWorker('_d_ins', // worker ID
        [7, '*', null, null, ns_id], // filter
        {
          target: this
        });

        dataCh.createWorker('_d_mv', // worker ID
        [12, '*', null, null, ns_id], // filter
        {
          target: this
        });

        // "_d_cf"

        dataCh.createWorker('_d_cf', // worker ID
        [5, '*', null, null, ns_id], // filter
        {
          obj: this
        });
        dataCh.createWorker('_d_cf', // worker ID
        [4, '*', null, null, ns_id], // filter
        {
          obj: this
        });

        // _d_ch -> child object has changed event
        dataCh.createWorker('_d_ch', // worker ID
        [42, '*', null, null, ns_id], // filter
        {
          target: this
        });

        var data = docData.data;

        // create the subdata instances for the objects...
        if (data instanceof Array) {

          for (var n in data) {
            this[n] = _data(data[n], options, this._client);
          }
          this._initIterator();
        } else {
          for (var n in data) {
            if (data.hasOwnProperty(n)) {
              var v = data[n];
              if (this.isFunction(v)) {
                continue;
              }
              if (!this.isFunction(v) && (v === Object(v) || v instanceof Array)) {
                this[n] = new _data(v, options, this._client);
                continue;
              }
              // just plain member variable function setting
              if (!this.isFunction(v) && !this.isObject(v) && !this.isArray(v)) {
                if (!this[n]) {
                  this.createPropertyUpdateFn(n, v);
                }
              }
            }
          }
        }
      };

      /**
       * Creates the commands to create the object - the object should be in { data : , __id}  - format, use _wrapToData if not already in this format.
       * @param Object data
       * @param float list
       */
      _myTrait_._objectCreateCmds = function (data, list) {
        if (!list) list = [];

        if (this.isObject(data) && data.data) {

          if (this.isArray(data.data)) {
            list.push([2, data.__id, '', null, data.__id]);

            for (var i = 0; i < data.data.length; i++) {
              var obj = data.data[i];
              if (this.isObject(obj)) {
                // they should be...
                this._objectCreateCmds(obj, list);
                var cmd = [7, i, obj.__id, null, data.__id];
                list.push(cmd);
              }
            }
          } else {
            list.push([1, data.__id, '', null, data.__id]);
            // var cmd = [1, newObj.__id, {}, null, newObj.__id];

            for (var n in data.data) {
              if (data.data.hasOwnProperty(n)) {
                var value = data.data[n];
                if (this.isObject(value)) {
                  this._objectCreateCmds(value, list);
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
      };

      /**
       * @param float url
       */
      _myTrait_._parseURL = function (url) {

        var parts1 = url.split('://');
        var protocol = parts1.shift(),
            rest = parts1.shift();
        var serverParts = rest.split('/'),
            ipAndPort = serverParts.shift(),
            iParts = ipAndPort.split(':'),
            ip = iParts[0],
            port = iParts[1],
            sandbox = serverParts.shift(),
            fileName = serverParts.pop(),
            path = serverParts.join('/');

        return {
          url: url,
          ip: ip,
          port: port,
          sandbox: sandbox,
          path: path,
          file: fileName,
          protocol: protocol
        };
      };

      /**
       * @param object data
       */
      _myTrait_._reGuidRawData = function (data) {

        if (this.isArray(data)) {
          var me = this;
          data.forEach(function (i) {
            me._reGuidRawData(i);
          });
        } else {
          if (this.isObject(data)) {
            for (var n in data) {
              if (!data.hasOwnProperty(n)) continue;
              if (n == '__id') {
                data[n] = this.guid();
                continue;
              }
              if (this.isObject(data[n])) this._reGuidRawData(data[n]);
              if (this.isArray(data[n])) this._reGuidRawData(data[n]);
            }
          }
        }
      };

      /**
       * @param float data
       */
      _myTrait_._wrapToData = function (data) {

        var newObj;
        // if the data is "well formed"
        if (data.__id && data.data) {
          newObj = data;
        } else {
          var newObj = {
            data: data,
            __id: this.guid()
          };
        }

        if (newObj.data && this.isObject(newObj.data)) {
          for (var n in newObj.data) {
            if (n == '__oid') {
              delete newObj.data[n];
              continue;
            }
            if (newObj.data.hasOwnProperty(n)) {
              var o = newObj.data[n];
              if (this.isFunction(o)) continue;
              if (this.isObject(o)) {
                newObj.data[n] = this._wrapToData(o);
              }
            }
          }
        }
        return newObj;
      };

      /**
       * @param Object c
       */
      _myTrait_.addController = function (c) {
        console.error('** askChannelQuestion ** not implemented now ');
      };

      /**
       * @param float question
       * @param float data
       * @param float cb
       */
      _myTrait_.askChannelQuestion = function (question, data, cb) {

        console.error('** askChannelQuestion ** not implemented now ');

        /*
        var url = this._findURL();
        console.log("Asking, the URL was "+url);
        var doc = _docUp( url );
        doc.then( function() {
        console.log("Resolved the doc, asking the channel the question "+question);
        doc._ask(question, data, cb ); 
        });
        */
      };

      /**
       * @param float i
       */
      _myTrait_.at = function (i) {
        var ii = this._docData.data[i];
        if (ii) return _data(ii, null, this._client);
      };

      /**
       * @param float t
       */
      _myTrait_.clear = function (t) {
        var len = this.length();
        while (len--) {
          this.pop();
        }
      };

      /**
       * @param float t
       */
      _myTrait_.clone = function (t) {
        return _data(this.serialize());
      };

      /**
       * @param float t
       */
      _myTrait_.copyToData = function (t) {

        var raw = this.toData();
        this._reGuidRawData(raw);

        return raw;
      };

      /**
       * @param string n
       * @param float v
       * @param float validators
       */
      _myTrait_.createArrayField = function (n, v, validators) {

        return this.set(this._docData.__id, n, v);
      };

      /**
       * @param float n
       * @param float defaultValue
       */
      _myTrait_.createField = function (n, defaultValue) {
        this.set(n, defaultValue || '');
        return this;
      };

      /**
       * @param float n
       * @param float v
       */
      _myTrait_.createObjectField = function (n, v) {
        return this.set(this._docData.__id, n, v);
      };

      /**
       * @param float name
       * @param float value
       */
      _myTrait_.createPropertyUpdateFn = function (name, value) {

        if (this.isObject(value) || this.isObject(this._docData.data[name])) {
          this[name] = _data(value, null, this._client);
          return;
        }

        var me = this;
        if (!_myTrait_[name]) {
          _myTrait_[name] = function (value) {

            if (typeof value == 'undefined') {
              return this._client.get(this._docData.__id, name);
            }
            this._client.set(this._docData.__id, name, value);
            return this;
          };
          _createdFunctions[name] = true;
        }
      };

      /**
       * @param string workerName
       * @param float workerFilter
       * @param float workerData
       * @param float workerFn
       */
      _myTrait_.createWorker = function (workerName, workerFilter, workerData, workerFn) {

        workerFilter[4] = this._client._idToNs(workerFilter[4], this._client._ns);

        var dataCh = this._client.getChannelData();
        dataCh.createWorker(workerName, // worker ID
        workerFilter, // filter
        workerData);

        if (workerFn) {
          if (!_setWorkers) _setWorkers = {};
          if (!_setWorkers[workerName]) {

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
      };

      /**
       * @param float name
       * @param float value
       */
      _myTrait_.diff_set = function (name, value) {

        // functions are not handled too...

        if (this.isObject(value)) {
          // objects are not to be set...
          return this;
        } else {
          this._client.diffSet(this._docData.__id, name, value);
          this.createPropertyUpdateFn(name, value);
          return this;
        }
      };

      /**
       * @param float scope
       * @param float data
       */
      _myTrait_.emitValue = function (scope, data) {
        if (this._processingEmit) return this;

        this._processingEmit = true;
        // adding controllers to the data...
        if (this._controllers) {
          var cnt = 0;
          for (var i = 0; i < this._controllers.length; i++) {
            var c = this._controllers[i];
            if (c[scope]) {
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

        if (this._valueFn && this._valueFn[scope]) {
          this._valueFn[scope].forEach(function (fn) {
            fn(data);
          });
        }
        if (1) {
          if (this._parent) {
            if (!this._parent.emitValue) {} else {
              this._parent.emitValue(scope, data);
            }
          }
        }
        this._processingEmit = false;
      };

      /**
       * @param Extension obj
       */
      _myTrait_.extendWith = function (obj) {

        for (var n in obj) {
          var fn = obj[n];
          if (this.isFunction(fn)) {
            _myTrait_[n] = fn;
          }
        }
      };

      /**
       * @param float path
       */
      _myTrait_.find = function (path) {
        // should find the item from the path...

        console.error('*** FIND IS NOT IMPLEMENTED *** ');

        // var dataObj = _up._getObjectInPath(path, this._docData);
        // if(dataObj) return _data(dataObj.__id);

        return null;
      };

      /**
       * @param float fn
       */
      _myTrait_.forEach = function (fn) {
        var me = this;
        this._docData.data.forEach(function (d) {
          fn(_data(d, null, me._client));
        });
      };

      /**
       * @param float arrayKeys
       * @param float fn
       */
      _myTrait_.forTree = function (arrayKeys, fn) {
        var limitFilter = {},
            bLimit = false;
        if (!fn) {
          fn = arrayKeys;
        } else {
          var limit = arrayKeys.split(',');
          limit.forEach(function (k) {
            limitFilter[k.trim()] = true;
            bLimit = true;
          });
        }
        fn(this);
        var me = this;
        if (this.isArray()) {
          this.forEach(function (item) {
            item.forTree(fn);
          });
        } else {
          this.keys(function (key) {
            if (bLimit) {
              if (!limitFilter[key]) return;
            }
            if (me[key] && me.hasOwn(key)) {
              var o = me[key];
              if (o.forTree) {
                o.forTree(fn);
              }
            }
          });
        }
        return this;
      };

      /**
       * @param float name
       */
      _myTrait_.get = function (name) {

        console.log('Calling get for ' + name);
        console.log('docData ' + JSON.stringify(this._docData));

        return this._client.get(this._docData.__id, name);
      };

      /**
       * @param bool stripNamespace
       */
      _myTrait_.getData = function (stripNamespace) {

        if (!this._docData) {
          if (this._client) {
            var data = this._client.getData();
          } else {
            return;
          }
        } else {
          var data = this._client._fetch(this._docData.__id);
        }
        if (stripNamespace) {
          // got to create a new object out of this...
          var newData = JSON.parse(JSON.stringify(data));
          data = this._client._transformObjFromNs(newData);
        }
        return data;
        /*
        var data = this._client.getData();
        if(stripNamespace) {
        // got to create a new object out of this...
        var newData = JSON.parse( JSON.stringify(data ));
        data = this._client._transformObjFromNs(newData);
        }
        return data;
        */
      };

      /**
       * @param float t
       */
      _myTrait_.getID = function (t) {

        return this._docData.__id;
      };

      /**
       * @param float t
       */
      _myTrait_.guid = function (t) {

        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

        /*        
        function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
               .toString(16)
               .substring(1);
        }
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();*/
      };

      /**
       * @param float name
       */
      _myTrait_.hasOwn = function (name) {

        if (typeof this._docData.data[name] != 'undefined' && this[name]) {
          return true;
        }
        return false;
      };

      /**
       * @param float t
       */
      _myTrait_.indexOf = function (t) {
        return this._client.indexOf(this._docData.__id);
      };

      if (_myTrait_.__traitInit && !_myTrait_.hasOwnProperty('__traitInit')) _myTrait_.__traitInit = _myTrait_.__traitInit.slice();
      if (!_myTrait_.__traitInit) _myTrait_.__traitInit = [];
      _myTrait_.__traitInit.push(function (data, options, notUsed, notUsed2) {

        if (!_dataCache) {
          _dataCache = {};
          _createdFunctions = {};
        }
      });

      /**
       * @param float index
       * @param float v
       */
      _myTrait_.insertAt = function (index, v) {
        return this.push(v, index);
      };

      /**
       * @param float t
       */
      _myTrait_.isArray = function (t) {

        if (typeof t == 'undefined') {
          if (!this._docData) return false;
          if (!this._docData.data) return false;
          return this.isArray(this._docData.data);
        }
        return Object.prototype.toString.call(t) === '[object Array]';
      };

      /**
       * @param object obj
       */
      _myTrait_.isDataTrait = function (obj) {

        if (obj._docData) return true;
      };

      /**
       * @param float fn
       */
      _myTrait_.isFunction = function (fn) {
        return Object.prototype.toString.call(fn) == '[object Function]';
      };

      /**
       * @param float t
       */
      _myTrait_.isObject = function (t) {

        if (typeof t == 'undefined') {
          if (!this._docData) return false;
          if (!this._docData.data) return false;
          return this.isObject(this._docData.data);
        }

        return t === Object(t);
      };

      /**
       * @param float i
       */
      _myTrait_.item = function (i) {
        return this.at(i);
      };

      /**
       * @param float fn
       */
      _myTrait_.keys = function (fn) {
        var i = 0;
        for (var n in this._docData.data) {

          if (this._docData.data.hasOwnProperty(n)) {
            fn(n, this._docData.data[n], this._docData.data);
          }
        }

        return this;
      };

      /**
       * @param float t
       */
      _myTrait_.length = function (t) {
        if (!this._docData) return 0;
        if (!this._docData.data) return 0;
        return this._docData.data.length;
      };

      /**
       * @param float t
       */
      _myTrait_.moveDown = function (t) {
        this._client.moveDown(this._docData.__id);
        return this;
      };

      /**
       * @param float index
       */
      _myTrait_.moveToIndex = function (index) {
        this._client.moveTo(this._docData.__id, index);

        return this;
      };

      /**
       * @param float t
       */
      _myTrait_.moveUp = function (t) {
        this._client.moveUp(this._docData.__id);

        return this;
      };

      /**
       * @param float scope
       * @param float fn
       */
      _myTrait_.onValue = function (scope, fn) {
        if (!this._valueFn) {
          this._valueFn = {};
        }
        if (!this._valueFn[scope]) this._valueFn[scope] = [];

        if (this._valueFn[scope].indexOf(fn) < 0) this._valueFn[scope].push(fn);
      };

      /**
       * @param Object p
       */
      _myTrait_.parent = function (p) {

        if (typeof p != 'undefined') {
          return this;
        }
        if (!this._docData) {
          return;
        }

        var p = this._docData.__p;
        if (p) return _data(p);
      };

      /**
       * @param float what
       */
      _myTrait_.pick = function (what) {

        var stream = simpleStream();
        var me = this;

        this.then(function () {
          me._collectObject(me, what, function (data) {
            stream.pushValue(data);
          });
        });

        return stream;
      };

      /**
       * @param float t
       */
      _myTrait_.pop = function (t) {

        var len = this.length();
        if (len) {
          var it = this.at(len - 1);
          if (it) it.remove();
          return it;
        }
      };

      /**
       * @param Object newData
       * @param float toIndex
       */
      _myTrait_.push = function (newData, toIndex) {

        if (!this.isArray()) return this;

        var data,
            bOldData = false;
        if (newData._wrapToData) {
          newData = newData.getData();
          var dd = this._client._fetch(newData.__id);
          if (dd) bOldData = true;
        }

        // is raw data
        if (newData.__id && newData.data) {
          // ??? should you create a full copy of the original object here just in case...
          data = this._client._transformObjToNs(newData, this._client._ns);
        } else {
          data = this._wrapToData(newData);
        }

        if (!bOldData) {
          var cmds = this._objectCreateCmds(data);
          for (var i = 0; i < cmds.length; i++) {
            this._client.addCommand(cmds[i]);
          }
        }
        var index;
        if (typeof toIndex != 'undefined') {
          index = toIndex;
          var dd = this._client._fetch(this._docData.__id);
          if (index < 0 || index > dd.data.length) return;
        } else {
          var dd = this._client._fetch(this._docData.__id);
          index = dd.data.length;
        }

        this._client.addCommand([7, index, data.__id, null, this._docData.__id]);

        return this;
      };

      /**
       * @param int cnt
       */
      _myTrait_.redo = function (cnt) {
        this._client.redo(cnt);
        return this;
      };

      /**
       * @param float options
       */
      _myTrait_.redoStep = function (options) {
        this._client.redoStep(options);
        return this;
      };

      /**
       * @param float t
       */
      _myTrait_.remove = function (t) {
        this._client.remove(this._docData.__id);
        return this;
      };

      /**
       * @param String eventName
       * @param float fn
       */
      _myTrait_.removeListener = function (eventName, fn) {
        if (this._events && this._events[eventName]) {
          var i = this._events[eventName].indexOf(fn);
          if (i >= 0) this._events[eventName].splice(i, 1);
          if (this._events[eventName].length == 0) {
            delete this._events[eventName];
          }
        }
      };

      /**
       * @param float tplData
       */
      _myTrait_.renderTemplate = function (tplData) {

        console.error('RenderTemplate not implemented');

        /*
        var comp = templateCompiler();  
        var jsonTplData = comp.compile( tplData );
        var dom = comp.composeTemplate( this._docData,  jsonTplData );
        return dom;
        */
      };

      /**
       * @param bool nonRecursive
       */
      _myTrait_.serialize = function (nonRecursive) {
        var o,
            me = this,
            data = this._docData.data;
        if (this.isArray(this._data)) {
          o = [];
        } else {
          o = {};
        }

        for (var n in data) {
          if (data.hasOwnProperty(n)) {
            var v = data[n];
            if (typeof v == 'undefined') continue;
            if (nonRecursive) {
              if (this.isObject(v) || this.isArray(v)) continue;
            }
            if (this.isObject(v)) {
              o[n] = _data(v).serialize();
            } else {
              o[n] = v;
            }
          }
        }

        return o;
      };

      /**
       * @param float name
       * @param float value
       */
      _myTrait_.set = function (name, value) {

        if (this.isFunction(value)) {
          var me = this;
          this.then(function () {
            return me.set(name, value(me.get(name)));
          });
          return this;
        }

        if (this.isObject(value)) {

          var data,
              newData = value;

          if (newData._wrapToData) {
            newData = newData.getData();
          }

          if (newData.__id && newData.data) {
            data = this._client._transformObjToNs(newData, this._client._ns);
          } else {
            data = this._wrapToData(newData);
          }

          var cmds = this._objectCreateCmds(data);
          for (var i = 0; i < cmds.length; i++) {
            this._client.addCommand(cmds[i]);
          }
          this._client.setObject(this._docData.__id, name, data);
          var objData = this._client._fetch(data.__id);
          this.createPropertyUpdateFn(name, objData);

          return this;
        } else {

          console.log('value set ' + name + ' = ' + value);
          debugger;
          this._client.set(this._docData.__id, name, value);
          this.createPropertyUpdateFn(name, value);
          return this;
        }
      };

      /**
       * @param bool nonRecursive
       */
      _myTrait_.toData = function (nonRecursive) {

        var str = JSON.stringify(this._docData);
        var data = JSON.parse(str);

        if (data.__ctxCmdList) delete data.__ctxCmdList;
        if (data.__cmdList) delete data.__cmdList;

        return data;
      };

      /**
       * @param float nonRecursive
       */
      _myTrait_.toPlainData = function (nonRecursive) {

        return this.getChannelData().toPlainData(this._docData);
      };

      /**
       * @param int cnt
       */
      _myTrait_.undo = function (cnt) {
        this._client.undo(cnt);
        return this;
      };

      /**
       * @param float options
       */
      _myTrait_.undoStep = function (options) {
        this._client.undoStep(options);
        return this;
      };

      /**
       * @param float name
       */
      _myTrait_.unset = function (name) {

        this._client.unset(this._docData.__id, name);

        return this;
      };

      /**
       * @param float t
       */
      _myTrait_.upgradeVersion = function (t) {

        this._client.upgradeVersion();
        return this;
      };
    })(this);

    (function (_myTrait_) {
      var _eventOn;

      // Initialize static variables here...

      if (_myTrait_.__traitInit && !_myTrait_.hasOwnProperty('__traitInit')) _myTrait_.__traitInit = _myTrait_.__traitInit.slice();
      if (!_myTrait_.__traitInit) _myTrait_.__traitInit = [];
      _myTrait_.__traitInit.push(function (t) {

        if (!_eventOn) _eventOn = [];
      });

      /**
       * @param float eventName
       * @param float fn
       */
      _myTrait_.on = function (eventName, fn) {
        if (!this._events) this._events = {};
        if (!this._events[eventName]) this._events[eventName] = [];
        this._events[eventName].push(fn);

        // This might remove the old event...
        var me = this;
        fn._unbindEvent = function () {
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

        ;
      };

      /**
       * @param float eventName
       * @param float fn
       */
      _myTrait_.removeListener = function (eventName, fn) {
        if (this._events && this._events[eventName]) {
          var i = this._events[eventName].indexOf(fn);
          if (i >= 0) this._events[eventName].splice(i, 1);
          if (this._events[eventName].length == 0) {
            delete this._events[eventName];
          }
        }
      };

      /**
       * @param float eventName
       * @param float data
       */
      _myTrait_.trigger = function (eventName, data) {
        if (_eventOn.indexOf(eventName + this._guid) >= 0) {
          return;
        }

        if (this._events && this._events[eventName]) {
          var el = this._events[eventName],
              me = this;
          _eventOn.push(eventName + this._guid);
          var len = el.length;
          for (var i = 0; i < len; i++) {
            el[i](me, data);
          }

          var mi = _eventOn.indexOf(eventName + this._guid);
          _eventOn.splice(mi, 1);
          // console.log("The event array", _eventOn);
        }
      };
    })(this);

    (function (_myTrait_) {

      // Initialize static variables here...

      /**
       * @param float propName
       * @param float workerName
       * @param float options
       */
      _myTrait_.propWorker = function (propName, workerName, options) {

        this.createWorker(workerName, [4, propName, null, null, this.getID()], // Condition to run worker
        options); // Options for the worker

        return this;
      };
    })(this);

    (function (_myTrait_) {
      var _up;
      var _factoryProperties;
      var _registry;
      var _objectCache;
      var _workersDone;
      var _atObserve;

      // Initialize static variables here...

      /**
       * @param float name
       */
      _myTrait_._addFactoryProperty = function (name) {
        if (!_factoryProperties) _factoryProperties = [];
        _factoryProperties.push(name);
      };

      /**
       * @param float t
       */
      _myTrait_._atObserveEvent = function (t) {
        _atObserve = t;
      };

      if (!_myTrait_.hasOwnProperty('__factoryClass')) _myTrait_.__factoryClass = [];
      _myTrait_.__factoryClass.push(function (data) {

        if (!_objectCache) _objectCache = {};

        if (this.isObject(data)) {

          if (data._objEventWorker) return data;

          if (data.data && data.__id) {

            var oo = _objectCache[data.__id];
            if (oo) {
              // console.log("did find object "+data.__id+" from cache");
              return oo;
            } else {}
          }
        } else {
          if (typeof data == 'string') {
            var oo = _objectCache[data];
            if (oo) {
              return oo;
            }
          }
        }

        if (_factoryProperties && _registry) {
          for (var i = 0; i < _factoryProperties.length; i++) {
            var pn = _factoryProperties[i];
            var name;

            if (data && data.data) {

              name = data.data[pn];
            } else {
              if (data) name = data[pn];
            }

            if (name) {
              var cf = _registry[name];
              if (cf) {
                return cf;
              }
            }
          }
        }
      });

      /**
       * @param float t
       */
      _myTrait_._findConnOptions = function (t) {
        if (this._connectionOptions) return this._connectionOptions;

        var p = this.parent();
        if (p) return p._findConnOptions();
      };

      /**
       * @param float t
       */
      _myTrait_._initIterator = function (t) {
        var me = this;
        if (typeof Symbol != 'undefined' && typeof Symbol.iterator != 'undefined') {
          me[Symbol.iterator] = function () {
            var idx = 0;
            return { // this is the iterator object, returning a single element, the string "bye"
              next: function next() {
                var item = me.at(idx++);
                if (item) {
                  return {
                    value: item,
                    done: false
                  };
                } else {
                  return {
                    done: true
                  };
                }
              } };
          };
        }
      };

      /**
       * @param float t
       */
      _myTrait_._initWorkers = function (t) {
        var me = this;
        if (!_workersDone) {
          var dataCh = me._client.getChannelData();
          dataCh.setWorkerCommands({
            '_obs_4': function _obs_4(cmd, options) {
              if (_atObserve) return;
              // Object.observe - set value to object
              options.target[cmd[1]] = cmd[2];
            },
            '_obs_7': function _obs_7(cmd, options) {
              if (_atObserve) return;
              var toIndex = cmd[1];
              var dataObj = _data(cmd[2]);
              if (dataObj.isFulfilled()) {
                Array.unobserve(options.target, options.parentObserver);
                options.target[toIndex] = dataObj.toObservable(options.target, options.parentObserver);
                Array.observe(options.target, options.parentObserver);
              }
            },
            '_obs_8': function _obs_8(cmd, options) {
              if (_atObserve) {
                return;
              }
              var toIndex = cmd[1];
              Array.unobserve(options.target, options.parentObserver);
              options.target.splice(toIndex, 1); //  = dataObj.toObservable();
              Array.observe(options.target, options.parentObserver);
            },
            '_obs_12': function _obs_12(cmd, options) {
              if (_atObserve) return;

              // move the item inside the array...a bit trickier than the rest
              var fromIndex = parseInt(cmd[3]);
              var targetIndex = parseInt(cmd[2]);
              var data = options.target;
              var targetObj = data[fromIndex];

              Array.unobserve(data, options.parentObserver);
              // how to temporarily disable the observing ?
              data.splice(fromIndex, 1);
              data.splice(targetIndex, 0, targetObj);

              Array.observe(data, options.parentObserver);
              // options.target.splice(toIndex, 1); //  = dataObj.toObservable();
            },
            '_d_set': function _d_set(cmd, options) {
              // for example, trigger .on("x", value);
              options.target.trigger(cmd[1], cmd[2]);
            },
            '_d_cf': function _d_cf(cmd, options) {
              // create field for the object
              var o = options.obj;
              if (cmd[0] == 4) {
                if (!o[cmd[1]]) {
                  o.createPropertyUpdateFn(cmd[1], cmd[2]);
                }
              }
              if (cmd[0] == 5) {
                if (!o[cmd[1]]) {
                  var newProp = o._docData.data[cmd[1]];
                  if (newProp) {
                    // does this work???
                    o.createPropertyUpdateFn(cmd[1], newProp);
                  }
                }
              }
            },
            '_d_rem': function _d_rem(cmd, options) {

              options.target.trigger('remove', cmd[1]);
              // delete _objectCache[cmd[1]];
              // remove the object from the object cache
            },
            '_to_ch': function _to_ch(cmd, options) {
              // new object has been inserted to this channel
              // if this is a broadcast channel, create a new _data for the object

              // note both _cmd_setPropertyObject and and
              //    _cmd_pushToArray have the new object at cmd[2]
              var me = options.target;
              if (me._client && !me._client._isLocal) {
                // if not a local client, then create the sub object
                var objData = me._client._fetch(cmd[2]);
                if (objData) {
                  _data(objData, null, me._client);
                }
              }
            },
            '_d_ins': function _d_ins(cmd, options) {
              options.target.trigger('insert', cmd[1]);
            },
            '_d_mv': function _d_mv(cmd, options) {
              options.target.trigger('move', {
                itemId: cmd[1],
                parentId: cmd[4],
                from: cmd[3],
                to: cmd[2]
              });
            },
            '_d_ch': function _d_ch(cmd, options) {
              // command which did change the child..
              options.target.trigger('childChanged', cmd);
            } });
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
      };

      /**
       * The old Object Event worker code
       * @param float t
       */
      _myTrait_._objEventWorker = function (t) {
        //console.log("******* if Then Worker ******");
        //console.log(change);
        //console.log(options);

        if (!change) return;

        // how to create something new...
        if (change[0] == 4) {

          // createPropertyUpdateFn
          // console.log("%c  set for objects, property updf ", "background:orange;color:white");

          var dom = targetObj;
          var up = _docUp();

          var dI = _data();
          dI.createPropertyUpdateFn(change[1], null);

          var dataItem = up._find(options.modelid);

          if (dataItem.__undone) return;

          if (options && options.eventObj) {
            if (change[3] != change[2]) {
              options.eventObj.trigger(change[1], change[2]);
            }
          }
        }

        if (options2) {
          var origOptions = options;
          options = options2;
        }

        if (change[0] == 5) {
          var up = _docUp();
          var dataItem = up._find(change[2]),
              dataItem2 = up._find(change[4]);

          if (dataItem.__undone) return;
          if (dataItem2.__undone) return;

          var dc = _data();

          if (dc.findFromCache(change[4])) {

            var dI = _data(change[4]),
                setObj = _data(change[2]),
                prop = change[1];

            if (!dI) return;
            if (!setObj) return;

            dI[prop] = setObj;
          }
          // could trigger some event here perhaps... 
        }

        // __removedAt
        if (change[0] == 8) {

          var dom = targetObj;
          var up = _docUp();
          var dataItem = up._find(change[2]);
          if (dataItem.__undone) return;

          if (options.bListenMVC && options.eventObj) {
            options.eventObj.trigger('remove', dataItem.__removedAt);
          }
        }

        // insert
        if (change[0] == 7) {

          var up = _docUp();

          var parentObj = up._find(change[4]),
              insertedObj = up._find(change[2]);

          if (parentObj.__undone) return;
          if (insertedObj.__undone) return;

          var index = parentObj.data.indexOf(insertedObj);

          if (options.bListenMVC && options.eventObj) {
            options.eventObj.trigger('insert', index);
          }
        }

        if (change[0] == 12) {

          var up = _docUp();

          var parentObj = up._find(change[4]),
              index = parseInt(change[2]),
              len = parentObj.data.length;

          if (parentObj.__undone) return;

          for (var i = 0; i < len; i++) {
            var m = parentObj.data[i];
            if (m.__id == change[1]) {
              targetObj = m;
              break;
            }
          }

          if (targetObj && targetObj.__undone) return;

          // move item, this may not be working as expected...
          var fromIndex = targetObj.__fromIndex; //  up._getExecInfo().fromIndex;

          // console.log("about to trigger move with ", targetObj, change[2], index, len, parentObj );

          if (targetObj) {
            var targetIndex = parseInt(change[2]);
            if (options.bListenMVC && options.eventObj) {
              // console.log("Triggering move ", fromIndex, targetIndex);
              options.eventObj.trigger('move', {
                from: fromIndex,
                to: targetIndex
              });
            }
          }
        }
      };

      /**
       * @param string url
       */
      _myTrait_._parseURL = function (url) {
        var parts1 = url.split('://');
        var protocol = parts1.shift(),
            rest = parts1.shift();
        var serverParts = rest.split('/'),
            ipAndPort = serverParts.shift(),
            fullPath = serverParts.join('/'),
            iParts = ipAndPort.split(':'),
            ip = iParts[0],
            port = iParts[1],
            sandbox = serverParts.shift(),
            fileName = serverParts.pop(),
            path = serverParts.join('/');

        var reqData = {
          protocol: protocol,
          ip: ip,
          port: port,
          sandbox: sandbox,
          fullPath: fullPath,
          path: path,
          file: fileName
        };

        return reqData;
      };

      /**
       * @param float id
       * @param float obj
       */
      _myTrait_.addToCache = function (id, obj) {
        if (!_objectCache) _objectCache = {};

        if (id) {
          _objectCache[id] = obj;
        }
      };

      /**
       * @param float t
       */
      _myTrait_.channel = function (t) {
        return this._client;
      };

      /**
       * @param float newChannelId
       * @param float description
       * @param float baseData
       */
      _myTrait_.createChannel = function (newChannelId, description, baseData) {

        var me = this;

        return _promise(function (result) {

          if (!baseData) baseData = {};
          me._client.createChannel(newChannelId, description, baseData).then(function (res) {
            if (res.result === false) {
              result(res);
              return;
            }
            var req = me._request;
            var myD = _data(req.protocol + '://' + req.ip + ':' + req.port + '/' + newChannelId, me._initOptions);
            myD.then(function () {
              result({
                result: true,
                channel: myD
              });
            });
          });
        });
      };

      /**
       * @param float propertyName
       * @param float className
       * @param float classConstructor
       */
      _myTrait_.createSubClass = function (propertyName, className, classConstructor) {

        // resStr+=cName+"_prototype.prototype = "+compileInfo.inheritFrom+".prototype\n";

        var myDataClass_prototype = classConstructor;

        var myDataClass = function myDataClass(a, b, c, d, e, f, g, h) {
          if (this instanceof myDataClass) {
            console.log('is instance of...');
            console.log(this.__traitInit);
            var args = [a, b, c, d, e, f, g, h];
            if (this.__factoryClass) {
              var m = this;
              var res;
              this.__factoryClass.forEach(function (initF) {
                res = initF.apply(m, args);
              });
              if (Object.prototype.toString.call(res) == '[object Function]') {
                if (res._classInfo.name != myDataClass._classInfo.name) return new res(a, b, c, d, e, f, g, h);
              } else {
                if (res) return res;
              }
            }
            if (this.__traitInit) {
              console.log('Calling the subclass trait init...');
              var m = this;
              this.__traitInit.forEach(function (initF) {
                initF.apply(m, args);
              });
            } else {
              if (typeof this.init == 'function') this.init.apply(this, args);
            }
          } else {
            console.log('NOT instance of...');
            return new myDataClass(a, b, c, d, e, f, g, h);
          }
        };
        myDataClass._classInfo = {
          name: this.guid()
        };

        myDataClass_prototype.prototype = _data.prototype;
        myDataClass.prototype = new myDataClass_prototype();

        this.registerComponent(className, myDataClass);
        this._addFactoryProperty(propertyName);

        return myDataClass;
      };

      /**
       * @param Object dataObj
       */
      _myTrait_.diff = function (dataObj) {
        var diff = diffEngine();

        var res = diff.compareFiles(this.getData(true), dataObj.getData(true));

        return res.cmds;
      };

      /**
       * Disconnects the object from listening the server update
       * @param float t
       */
      _myTrait_.disconnect = function (t) {

        if (this._client) {
          this._client.disconnect();
        }
        return this;
      };

      /**
       * @param function fn
       */
      _myTrait_.filter = function (fn) {
        var newArr = _data([]);
        this.localFork().forEach(function (item) {
          if (fn(item)) newArr.push(item.toData(true));
        });
        return newArr;
      };

      /**
       * @param string newChannelId
       * @param string description
       */
      _myTrait_.fork = function (newChannelId, description) {
        // fork

        if (!newChannelId || this._client._isLocal) {
          return this.localFork();
        }

        var me = this;

        return _promise(function (result) {

          me._client.fork(newChannelId, description).then(function (res) {

            if (res.result === false) {
              result(res);
              return;
            }
            /*
            var req = this._parseURL(data);
            this._request = req;
            this._socket = _clientSocket(req.protocol+"://"+req.ip, req.port);          
            */
            var req = me._request;
            var myD = _data(req.protocol + '://' + req.ip + ':' + req.port + '/' + newChannelId, me._initOptions);
            myD.then(function () {
              result({
                result: true,
                fork: myD
              });
            });
            //         result(res);
          });
        });
      };

      /**
       * @param float t
       */
      _myTrait_.getChannelClient = function (t) {
        return this._client;
      };

      /**
       * @param float t
       */
      _myTrait_.getChannelData = function (t) {
        return this._client.getChannelData();
      };

      /**
       * @param float t
       */
      _myTrait_.getJournal = function (t) {
        var d = this.getChannelData();

        // make a copy of the journal, just in case
        return d._journal.slice();
      };

      if (_myTrait_.__traitInit && !_myTrait_.hasOwnProperty('__traitInit')) _myTrait_.__traitInit = _myTrait_.__traitInit.slice();
      if (!_myTrait_.__traitInit) _myTrait_.__traitInit = [];
      _myTrait_.__traitInit.push(function (data, options, client) {

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

        if (typeof data == 'string') {

          if (!data.match('://')) {
            return;
          }

          var req = this._parseURL(data);
          this._request = req;

          this._connectionOptions = options;
          this._socket = _clientSocket(req.protocol + '://' + req.ip, req.port, options.ioLib);
          var opts = {};
          if (options.auth) {
            opts.auth = options.auth;
          } else {
            opts.auth = {};
          }
          if (options.initWithData) {
            // the data must have ID's and all...
            opts.initWithData = this._wrapToData(options.initWithData);
          }
          this._client = channelClient(req.fullPath, this._socket, opts);
          this._client.then(function (resp) {

            if (resp.result === false) {
              me.trigger('login::failed');
              return;
            }
            var rawData = me._client.getData();

            me._initializeData(rawData);
            me.addToCache(rawData.__id, me);

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

          if (client) {
            if (client && !this._client) this._client = client;
            if (this.isObject(data) && data.__id) {
              this._initializeData(data);
              this.addToCache(data.__id, this);
            }

            me._initWorkers();

            this.resolve(true);
          } else {

            if (this.isObject(data) && !data.__id) {
              data = this._wrapToData(data);
            }

            var chClient = channelClient(this.guid(), null, {
              localChannel: true,
              localData: data
            });

            this._client = chClient;
            var me = this;
            // this._client.then( function(resp) {
            var rawData = me._client.getData();
            if (!rawData) {
              me.resolve(true);
              return;
            }
            me._initializeData(rawData);
            me.addToCache(rawData.__id, me);

            me._initWorkers();

            me.resolve(true);
            // });      
          }
        }
      });

      /**
       * @param float t
       */
      _myTrait_.localFork = function (t) {

        // _transformObjFromNs
        var forkData = this.getData(true);

        return _data(forkData);
      };

      /**
       * @param function fn
       */
      _myTrait_.map = function (fn) {
        var newArr = _data([]);
        var localF = this.localFork();
        var idx = 0;
        this.localFork().forEach(function (item) {
          var newObj = fn(item, idx, localF);
          newArr.push(newObj);
          idx++;
        });
        return newArr;
      };

      /**
       * Merges object, which was forked from this object into this object.
       * @param Object forkedObject  - Object which was forked
       */
      _myTrait_.merge = function (forkedObject) {
        var patchCmds = this.diff(forkedObject);
        this.patch(patchCmds);

        return this;
      };

      /**
       * @param string channelURL
       */
      _myTrait_.openChannel = function (channelURL) {
        // fork

        var me = this;
        return _promise(function (result) {
          var req = me._request;
          var myD = _data(channelURL, me._findConnOptions());
          myD.then(function () {
            result({
              result: true,
              channel: myD
            });
          });
        });
      };

      /**
       * @param float cmds
       */
      _myTrait_.patch = function (cmds) {
        var me = this;
        cmds.forEach(function (c, index) {
          var tc = me._client._transformCmdToNs(c);
          me._client.addCommand(tc, true);
        });
        return this;
      };

      /**
       * @param float options
       */
      _myTrait_.playback = function (options) {

        // playback
        var data = this.getChannelData();
        return data.playback(options);
      };

      /**
      * Pushes raw data into Array of objects consisting of subarrays.
      The iterator definition is like:
      ``` 
      {
        title: &quot;{path}&quot;,
        items: [],
        &quot;icon&quot;: &quot;fa fa-folder&quot;
      }
      ````
       * @param String path  - Path to push to, for example &quot;music/favourites&quot; 
      * @param Object itemData  - Raw object data to push 
      * @param float iteratorDef  
      */
      _myTrait_.pushToObjArray = function (path, itemData, iteratorDef) {
        var parts = path.split('/'),
            model = this;

        var subPathName,
            titleName,
            extraAttrs = {},
            objTemplate;

        if (!iteratorDef) return;
        for (var n in iteratorDef) {
          if (iteratorDef.hasOwnProperty(n)) {
            var val = iteratorDef[n];
            if (this.isArray(val)) {
              subPathName = n;
            } else {
              if (val == '{path}') {
                titleName = n;
              } else {
                extraAttrs[n] = val;
              }
            }
          }
        }

        if (!subPathName) return;
        if (!titleName) return;

        objTemplate = JSON.stringify(extraAttrs);

        if (!subPathName) subPathName = 'items';
        if (!titleName) titleName = 'title';
        var find_or_insert_item = function find_or_insert_item(_x, _x2) {
          var _again = true;

          _function: while (_again) {
            var index = _x,
                from = _x2;
            name = did_find = newObj = undefined;
            _again = false;

            var name = parts[index];
            if (!name) return from;
            if (!from.hasOwn(subPathName)) {
              from.set(subPathName, []);
            }
            var did_find;
            from[subPathName].forEach(function (i) {
              if (i.get(titleName) == name) did_find = i;
            });
            if (!did_find) {
              var newObj = JSON.parse(objTemplate);
              newObj[titleName] = name;
              newObj[subPathName] = [];

              from[subPathName].push(newObj);
              did_find = from[subPathName].at(from[subPathName].length() - 1);
            }
            if (did_find && parts.length <= index + 1) {

              return did_find;
            } else {
              _x = index + 1;
              _x2 = did_find;
              _again = true;
              continue _function;
            }
          }
        };

        var parentNode = find_or_insert_item(0, model);
        if (parentNode && parentNode[subPathName]) {
          parentNode[subPathName].push(itemData);
        }
      };

      /**
       * @param float t
       */
      _myTrait_.reconnect = function (t) {
        if (this._client) {
          this._client.reconnect();
        }
        return this;
      };

      /**
       * @param function fn
       * @param Object initValue
       */
      _myTrait_.reduce = function (fn, initValue) {
        var newArr = _data([]);
        var idx = 0;
        var localF = this.localFork();
        var currentValue = initValue;
        localF.forEach(function (item) {
          currentValue = fn(currentValue, item, idx, localF);
          idx++;
        });
        return currentValue;
      };

      /**
       * @param float name
       * @param float classDef
       */
      _myTrait_.registerComponent = function (name, classDef) {

        if (!_registry) _registry = {};

        if (!_registry[name]) {
          _registry[name] = classDef;
        }
      };
    })(this);
  };

  var _data = function _data(a, b, c, d, e, f, g, h) {
    var m = this,
        res;
    if (m instanceof _data) {
      var args = [a, b, c, d, e, f, g, h];
      if (m.__factoryClass) {
        m.__factoryClass.forEach(function (initF) {
          res = initF.apply(m, args);
        });
        if (typeof res == 'function') {
          if (res._classInfo.name != _data._classInfo.name) return new res(a, b, c, d, e, f, g, h);
        } else {
          if (res) return res;
        }
      }
      if (m.__traitInit) {
        m.__traitInit.forEach(function (initF) {
          initF.apply(m, args);
        });
      } else {
        if (typeof m.init == 'function') m.init.apply(m, args);
      }
    } else return new _data(a, b, c, d, e, f, g, h);
  };

  _data_prototype.prototype = _promise.prototype;

  _data._classInfo = {
    name: '_data'
  };
  _data.prototype = new _data_prototype();

  (function () {
    if (typeof define !== 'undefined' && define !== null && define.amd != null) {
      __amdDefs__['_data'] = _data;
      this._data = _data;
    } else if (typeof module !== 'undefined' && module !== null && module.exports != null) {
      module.exports['_data'] = _data;
    } else {
      this._data = _data;
    }
  }).call(new Function('return this')());

  var _chPolicy_prototype = function _chPolicy_prototype() {

    (function (_myTrait_) {

      // Initialize static variables here...

      /**
       * @param float t
       */
      _myTrait_.guid = function (t) {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      };

      /**
       * @param float t
       */
      _myTrait_.isArray = function (t) {
        return t instanceof Array;
      };

      /**
       * @param float fn
       */
      _myTrait_.isFunction = function (fn) {
        return Object.prototype.toString.call(fn) == '[object Function]';
      };

      /**
       * @param float t
       */
      _myTrait_.isObject = function (t) {
        return t === Object(t);
      };
    })(this);

    (function (_myTrait_) {
      var _hooks;

      // Initialize static variables here...

      /**
       * @param Object clientState
       */
      _myTrait_.constructClientToServer = function (clientState) {
        var chData = clientState.data;

        if (!clientState.last_sent) {
          clientState.last_sent = [];
        }

        // last_update : [1, 30]
        var start = clientState.last_sent[1] || 0;
        var end = chData._journal.length;

        // --- do not re-send

        // last_update[]
        // clientState.last_update

        // problems here??
        if (clientState.last_update) {

          if (start < clientState.last_update[1]) {
            start = clientState.last_update[1];
          }

          var fromServer = clientState.last_update[1] || 0;
          if (fromServer >= end) {
            //console.log(" fromServer >= end ");
            return null;
          }
        }

        if (start == end) {
          // console.log(" start == end ");
          return null;
        }

        //console.log("clientToServer");
        //console.log(clientState.last_update);
        //console.log(start,end);

        // [2,4]
        // 0
        // 1
        // 2 *
        // 3 *

        clientState.last_sent[0] = start;
        clientState.last_sent[1] = end;

        var obj = {
          cmd: 'c2s',
          id: this.guid(),
          c: chData._journal.slice(start, end),
          start: start,
          end: end,
          version: clientState.version
        };

        if (clientState.client) {
          for (var i = 0; i < obj.c.length; i++) {
            var c = obj.c[i];
            obj.c[i] = clientState.client._transformCmdFromNs(c);
          }
        }
        return obj;
      };

      /**
       * @param Object serverState
       */
      _myTrait_.constructServerToClient = function (serverState) {

        var chData = serverState.data;

        if (!serverState.last_update) {
          serverState.last_update = [];
        }

        // last_update : [1, 30]
        var start = serverState.last_update[1] || 0;
        var end = chData._journal.length;

        if (start == end) return null;

        // [2,4]
        // 0
        // 1
        // 2 *
        // 3 *

        serverState.last_update[0] = start;
        serverState.last_update[1] = end;

        return {
          cmd: 's2c',
          c: chData._journal.slice(start, end),
          start: start,
          end: end,
          version: serverState.version
        };
      };

      /**
       * @param Object clientFrame  - This is the clients changeFrame which should be applied to the servers internal state
       * @param Object serverState  - This object holds the data the server needs
       */
      _myTrait_.deltaClientToServer = function (clientFrame, serverState) {
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

        if (!clientFrame) return;

        if (!serverState._done) serverState._done = {};

        // console.log("Processing client frame");
        // console.log(JSON.stringify(clientFrame));

        try {

          if (!clientFrame.id) return;
          // if(!clientFrame.socket_id) return;
          if (serverState._done[clientFrame.id]) return res;

          serverState._done[clientFrame.id] = true;

          var chData = serverState.data; // the channel data object
          var errors = [];

          // now, it's simple, we just try to apply all the comands
          for (var i = 0; i < clientFrame.c.length; i++) {
            var c = clientFrame.c[i];
            var cmdRes = chData.execCmd(c);
            if (cmdRes !== true) {
              errors.push(cmdRes);
            }
          }

          var results = {
            errors: errors
          };
          // console.log(JSON.stringify(results));  

          return results;
        } catch (e) {
          // in this version, NO PROBLEMO!
          return e.message;
        }
      };

      /**
       * @param float updateFrame
       * @param float serverState
       */
      _myTrait_.deltaMasterToSlave = function (updateFrame, serverState) {

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
        // The server state
        /*
        {
        data : channelData,     // The channel data object
        version : 1,
        last_update : [1, 30],  // version + journal line
        lagging_sockets : {}    // hash of invalid sockets
        }
        */
        // check where is our last point of action...

        if (!updateFrame) return;

        var data = serverState.data; // the channel data we have now

        // [2,4] = [start, end]
        // 0
        // 1
        // 2 *
        // 3 *

        var result = {
          goodCnt: 0,
          oldCnt: 0,
          newCnt: 0,
          reverseCnt: 0
        };

        console.log('deltaMasterToSlave');
        var sameUntil = updateFrame.start;

        if (serverState.needsRefresh) {
          console.log('** serverState needs refresh **');
          return;
        }

        // if the server's journal is a lot behind the sent data...
        if (updateFrame.start > data._journal.length) {

          console.log('--- setting refresh on because of ---- ');
          console.log(' updateFrame.start > data._journal.length ');

          serverState.needsRefresh = true;
          result.fail = true;
          return result;
        }

        // this should not be needed at the server side, because object ID's are without
        // the namespace
        /*
        if(serverState.client) {
        for(var i=updateFrame.start; i<updateFrame.end; i++) {
        var serverCmd = updateFrame.c[i-updateFrame.start];
        updateFrame.c[i-updateFrame.start] = serverState.client._transformCmdToNs( serverCmd );
        }
        }
        */

        var goodList = [];

        // process the commands a long as they are the same
        for (var i = updateFrame.start; i < updateFrame.end; i++) {

          var myJ = data.getJournalCmd(i);
          var serverCmd = updateFrame.c[i - updateFrame.start];

          var bSame = true;
          if (myJ) {

            if (myJ[0] == 13 && serverCmd[0] == 13 && myJ[4] == serverCmd[4] && myJ[1] == serverCmd[1]) {
              var mainArray1 = myJ[2],
                  mainArray2 = serverCmd[2];
              if (mainArray1.length != mainArray2.length) {
                bSame = false;
              } else {
                for (var mi = 0; mi < mainArray1.length; mi++) {
                  if (!bSame) break;
                  var arr1 = mainArray1[mi],
                      arr2 = mainArray2[mi];
                  for (var ai = 0; ai < 5; ai++) {
                    if (arr1[ai] != arr2[ai]) {
                      console.log('not same ', ai, arr1[ai], arr2[ai]);
                      bSame = false;
                      break;
                    }
                  }
                  if (bSame) {
                    if (this.isArray(arr1[5])) {
                      var arr1 = arr1[5],
                          arr2 = arr2[5];
                      var len = Math.max(arr1.length || 0, arr2.length || 0);
                      for (var ai = 0; ai < len; ai++) {
                        if (arr1[ai] != arr2[ai]) {
                          console.log('not same array ', ai);
                          bSame = false;
                          break;
                        }
                      }
                    } else {
                      if (arr1[5] != arr2[5]) {
                        bSame = false;
                      }
                    }
                  }
                  if (!bSame) {
                    console.log('was not the same');
                    console.log(serverCmd, 'vs', myJ);
                  }
                }
              }
            } else {
              for (var j = 0; j <= 4; j++) {
                if (myJ[j] != serverCmd[j]) {
                  bSame = false;
                  console.log('was not the same');
                  console.log(serverCmd[j], 'vs', myJ[j]);
                }
              }
            }
          } else {
            // a new command has arrived...

            var cmdRes = data.execCmd(serverCmd); // set data ready to be broadcasted
            if (cmdRes !== true) {
              // if we get errors then we have some kind of problem
              console.log('--- setting refresh on because of ---- ');
              console.log(JSON.stringify(cmdRes));
              serverState.needsRefresh = true;
              result.fail = true;
              result.reason = cmdRes;
              return result;
            } else {
              sameUntil = i; // ??
              result.goodCnt++;
              result.newCnt++;
            }
            goodList.push(serverCmd);

            continue;
          }
          if (bSame) {
            sameUntil = i;
            result.goodCnt++;
            result.oldCnt++;
          } else {
            console.log('Not same ');
            console.log(JSON.stringify(updateFrame.c));
            return _promise(function (done) {
              // here is the point where the data is reversed and also the server journal should be truncated:
              data.reverseToLine(sameUntil);
              var size = updateFrame.journalSize;
              console.log('Truncating the journal to ', size, sameUntil);
              // truncate server journal to certain length
              serverState.model.truncateJournalTo(size, sameUntil).then(function () {

                // and then run commands without sending them outside...
                var list = [];
                for (var i = sameUntil; i < updateFrame.end; i++) {

                  var serverCmd = updateFrame.c[i - updateFrame.start];
                  var cmdRes = data.execCmd(serverCmd); // data ready to be broadcasted
                  if (cmdRes !== true) {

                    console.log('--- there is need for a bigger refersh ---- ');
                    console.log(JSON.stringify(cmdRes));

                    // if we get errors then we have some kind of problem
                    serverState.needsRefresh = true;
                    result.fail = true;
                    result.reason = cmdRes;
                    done(result);
                    return result;
                  }
                  list.push(serverCmd);
                  result.reverseCnt++;
                }

                // serverState.last_update[0] = updateFrame.start;
                // serverState.last_update[1] = updateFrame.end;

                // mark the new start for next update,
                serverState.last_update[0] = 0;
                serverState.last_update[1] = sameUntil; // <- this is what matters

                // --> writing to the journal is done at the client loop
                // write the new lines to the servers journal
                //serverState.model.writeToJournal( list ).then( function() {
                //    done(result);
                //});

                return result;
              });
            });
          }
        }
        //clientState.last_update[0] = updateFrame.start;
        //clientState.last_update[1] = updateFrame.end;

        console.log('server last update ' + JSON.stringify(serverState.last_update));
        console.log('server data length ' + serverState.data._journal.length);

        if (goodList.length) {}

        return result;
      };

      /**
       * @param Object updateFrame  - request from server to client
       * @param float clientState  - This object holds the data the client needs to pefrform it&#39;s actions
       */
      _myTrait_.deltaServerToClient = function (updateFrame, clientState) {

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

        if (!updateFrame) return;

        var data = clientState.data; // the channel data we have now

        if (!clientState.last_update) {
          clientState.last_update = [];
        }
        // [2,4] = [start, end]
        // 0
        // 1
        // 2 *
        // 3 *

        var result = {
          goodCnt: 0,
          oldCnt: 0,
          newCnt: 0,
          reverseCnt: 0
        };

        //console.log("deltaServerToClient");
        //console.log(clientState.last_update);

        var sameUntil = updateFrame.start;

        if (clientState.needsRefresh) {
          // console.log("** client needs refresh **");
          if (_hooks['onCancel']) {
            _hooks['onCancel']({
              data: data,
              reason: cmdRes,
              clientState: clientState,
              updateFrame: updateFrame,
              serverCmds: updateFrame.c
            });
          }
          return;
        }

        if (updateFrame.start > data._journal.length) {

          if (_hooks['onError']) {
            _hooks['onError']({
              data: data,
              reason: ' updateFrame.start > data._journal.length ',
              clientState: clientState,
              updateFrame: updateFrame,
              serverCmds: updateFrame.c
            });
          }
          clientState.needsRefresh = true;
          result.fail = true;
          return result;
        }

        if (clientState.client) {
          for (var i = updateFrame.start; i < updateFrame.end; i++) {
            var serverCmd = updateFrame.c[i - updateFrame.start];
            updateFrame.c[i - updateFrame.start] = clientState.client._transformCmdToNs(serverCmd);
          }
        }

        if (_hooks['onServerData']) {
          _hooks['onServerData']({
            data: data,
            clientState: clientState,
            updateFrame: updateFrame,
            serverCmds: updateFrame.c
          });
        }

        for (var i = updateFrame.start; i < updateFrame.end; i++) {

          var myJ = data.getJournalCmd(i);
          var serverCmd = updateFrame.c[i - updateFrame.start];

          var bSame = true;
          if (myJ) {

            if (myJ[0] == 13 && serverCmd[0] == 13 && myJ[4] == serverCmd[4] && myJ[1] == serverCmd[1]) {
              var mainArray1 = myJ[2],
                  mainArray2 = serverCmd[2];
              if (mainArray1.length != mainArray2.length) {
                bSame = false;
              } else {
                for (var mi = 0; mi < mainArray1.length; mi++) {
                  if (!bSame) break;
                  var arr1 = mainArray1[mi],
                      arr2 = mainArray2[mi];
                  for (var ai = 0; ai < 5; ai++) {
                    if (arr1[ai] != arr2[ai]) {
                      console.log('not same ', ai, arr1[ai], arr2[ai]);
                      bSame = false;
                      break;
                    }
                  }
                  if (bSame) {
                    if (this.isArray(arr1[5])) {
                      var arr1 = arr1[5],
                          arr2 = arr2[5];
                      var len = Math.max(arr1.length || 0, arr2.length || 0);
                      for (var ai = 0; ai < len; ai++) {
                        if (arr1[ai] != arr2[ai]) {
                          console.log('not same array ', ai);
                          bSame = false;
                          break;
                        }
                      }
                    } else {
                      if (arr1[5] != arr2[5]) {
                        bSame = false;
                      }
                    }
                  }
                  if (!bSame) {
                    console.log('was not the same at array compare');
                    console.log(serverCmd, 'vs', myJ);
                  }
                }
              }
            } else {
              for (var j = 0; j <= 4; j++) {
                if (myJ[j] != serverCmd[j]) {
                  bSame = false;
                  if (_hooks['onError']) {
                    _hooks['onError']({
                      data: data,
                      reason: ' server datas are different ',
                      clientState: clientState,
                      updateFrame: updateFrame,
                      serverCmds: updateFrame.c
                    });
                  }
                }
              }
            }
          } else {
            // a new command has arrived...

            var cmdRes = data.execCmd(serverCmd, true); // true = remote cmd
            if (cmdRes !== true) {
              // if we get errors then we have some kind of problem
              console.log('--- setting refresh on because of ---- ');
              console.log(JSON.stringify(cmdRes));

              if (_hooks['onError']) {
                _hooks['onError']({
                  data: data,
                  reason: cmdRes,
                  clientState: clientState,
                  updateFrame: updateFrame,
                  serverCmds: updateFrame.c
                });
              }
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
          if (bSame) {
            sameUntil = i;
            result.goodCnt++;
            result.oldCnt++;
          } else {
            // the sent commands did differ...

            // TODO: rollback
            data.reverseToLine(sameUntil);
            // and then run commands without sending them outside...
            for (var i = sameUntil; i < updateFrame.end; i++) {

              var serverCmd = updateFrame.c[i - updateFrame.start];
              var cmdRes = data.execCmd(serverCmd, true); // true = remote cmd
              if (cmdRes !== true) {

                console.log('--- setting refresh on because of ---- ');
                console.log(JSON.stringify(cmdRes));
                if (_hooks['onError']) {
                  _hooks['onError']({
                    data: data,
                    reason: cmdRes,
                    clientState: clientState,
                    updateFrame: updateFrame,
                    serverCmds: updateFrame.c
                  });
                }
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
      };

      if (_myTrait_.__traitInit && !_myTrait_.hasOwnProperty('__traitInit')) _myTrait_.__traitInit = _myTrait_.__traitInit.slice();
      if (!_myTrait_.__traitInit) _myTrait_.__traitInit = [];
      _myTrait_.__traitInit.push(function (t) {
        if (!_hooks) {
          _hooks = {};
        }
      });

      /**
       * @param float n
       * @param float fn
       */
      _myTrait_.setHook = function (n, fn) {
        if (!_hooks) {
          _hooks = {};
        }
        _hooks[n] = fn;
      };
    })(this);
  };

  var _chPolicy = function _chPolicy(a, b, c, d, e, f, g, h) {
    var m = this,
        res;
    if (m instanceof _chPolicy) {
      var args = [a, b, c, d, e, f, g, h];
      if (m.__factoryClass) {
        m.__factoryClass.forEach(function (initF) {
          res = initF.apply(m, args);
        });
        if (typeof res == 'function') {
          if (res._classInfo.name != _chPolicy._classInfo.name) return new res(a, b, c, d, e, f, g, h);
        } else {
          if (res) return res;
        }
      }
      if (m.__traitInit) {
        m.__traitInit.forEach(function (initF) {
          initF.apply(m, args);
        });
      } else {
        if (typeof m.init == 'function') m.init.apply(m, args);
      }
    } else return new _chPolicy(a, b, c, d, e, f, g, h);
  };

  _chPolicy._classInfo = {
    name: '_chPolicy'
  };
  _chPolicy.prototype = new _chPolicy_prototype();

  (function () {
    if (typeof define !== 'undefined' && define !== null && define.amd != null) {
      __amdDefs__['_chPolicy'] = _chPolicy;
      this._chPolicy = _chPolicy;
    } else if (typeof module !== 'undefined' && module !== null && module.exports != null) {
      module.exports['_chPolicy'] = _chPolicy;
    } else {
      this._chPolicy = _chPolicy;
    }
  }).call(new Function('return this')());

  var aceCmdConvert_prototype = function aceCmdConvert_prototype() {

    (function (_myTrait_) {
      var _newAce;

      // Initialize static variables here...

      /**
       * @param Array cmdList
       */
      _myTrait_.fromAce = function (cmdList) {

        if (cmdList && cmdList[0]) {
          if (!cmdList[0].range && !cmdList[0].data) {
            _newAce = true;
          }
        }

        if (_newAce) return this.fromAce2(cmdList);

        var newList = [];

        cmdList.forEach(function (theCmd) {

          var cmd;
          if (theCmd.data) {
            cmd = theCmd.data;
          } else {
            cmd = theCmd;
          }

          var range = cmd.range;
          if (cmd.action == 'insertText') {
            newList.push([1, range.start.row, range.start.column, range.end.row, range.end.column, cmd.text]);
          }
          if (cmd.action == 'removeText') {
            newList.push([2, range.start.row, range.start.column, range.end.row, range.end.column, cmd.text]);
          }
          if (cmd.action == 'insertLines') {
            newList.push([3, range.start.row, range.start.column, range.end.row, range.end.column, cmd.lines]);
          }
          if (cmd.action == 'removeLines') {
            newList.push([4, range.start.row, range.start.column, range.end.row, range.end.column, cmd.lines, cmd.nl]);
          }
        });

        return newList;

        /*
        {"action":"insertText","range":{"start":{"row":0,"column":0},
        "end":{"row":0,"column":1}},"text":"d"}
        */
      };

      /**
       * @param Array cmdList
       */
      _myTrait_.fromAce2 = function (cmdList) {

        var newList = [];
        /*
        cmdList: Array[1]
        0: Object
        action: "insert"
        end: Object
        lines: Array[1]
        start: Object
        __proto__: Object
        length: 1
        __proto__: Array[0]
        */

        cmdList.forEach(function (cmd) {

          var range = cmd;
          if (cmd.action == 'insert' && cmd.lines.length == 1) {
            newList.push([1, range.start.row, range.start.column, range.end.row, range.end.column, cmd.lines[0]]);
          }
          if (cmd.action == 'remove' && cmd.lines.length == 1) {
            newList.push([2, range.start.row, range.start.column, range.end.row, range.end.column, cmd.lines[0]]);
          }
          if (cmd.action == 'insert' && cmd.lines.length > 1) {
            newList.push([3, range.start.row, range.start.column, range.end.row, range.end.column, cmd.lines]);
          }
          if (cmd.action == 'remove' && cmd.lines.length > 1) {
            newList.push([4, range.start.row, range.start.column, range.end.row, range.end.column, cmd.lines, cmd.nl]);
          }
        });

        return newList;

        /*
        {"action":"insertText","range":{"start":{"row":0,"column":0},
        "end":{"row":0,"column":1}},"text":"d"}
        */
      };

      if (_myTrait_.__traitInit && !_myTrait_.hasOwnProperty('__traitInit')) _myTrait_.__traitInit = _myTrait_.__traitInit.slice();
      if (!_myTrait_.__traitInit) _myTrait_.__traitInit = [];
      _myTrait_.__traitInit.push(function (onFulfilled, onRejected) {});

      /**
       * @param Array cmdList
       */
      _myTrait_.reverse = function (cmdList) {

        var newList = [];

        cmdList.forEach(function (oldCmd) {

          var cmd = oldCmd.slice(); // create a copy of the old command

          var row = cmd[1],
              col = cmd[2],
              endRow = cmd[3],
              endCol = cmd[4];

          // add characters...
          if (cmd[0] == 1) {
            cmd[0] = 2;
            newList.unshift(cmd);
            return; // this simple ???
          }
          if (cmd[0] == 2) {
            cmd[0] = 1;
            newList.unshift(cmd);
            return; // this simple ???
          }
          if (cmd[0] == 3) {
            cmd[0] = 4;
            newList.unshift(cmd);
            return; // this simple ???     
            /*
            var cnt = endRow - row;
            for(var i=0; i<cnt; i++) {
            lines.splice(row+i, 0, cmd[5][i]);
            } 
            */
          }
          if (cmd[0] == 4) {
            cmd[0] = 3;
            newList.unshift(cmd);
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
      };

      /**
       * @param float cmdList
       */
      _myTrait_.runToAce = function (cmdList) {

        if (_newAce) return this.runToAce2(cmdList);

        var newList = [],
            _convert = ['', 'insertText', 'removeText', 'insertLines', 'removeLines'];

        cmdList.forEach(function (cmd) {
          var c = {
            action: _convert[cmd[0]],
            range: {
              start: {
                row: cmd[1],
                column: cmd[2]
              },
              end: {
                row: cmd[3],
                column: cmd[4]
              }
            }
          };
          if (cmd[0] < 3) {
            c.text = cmd[5];
          } else {
            c.lines = cmd[5];
          }
          if (cmd[0] == 4) c.nl = cmd[6] || '\n';
          newList.push(c);
        });
        return newList;

        /*
        {"action":"insertText","range":{"start":{"row":0,"column":0},
        "end":{"row":0,"column":1}},"text":"d"}
        */
      };

      /**
       * @param float cmdList
       */
      _myTrait_.runToAce2 = function (cmdList) {
        var newList = [],
            _convert = ['', 'insert', 'remove', 'insert', 'remove'];
        /*
        0: Object
        action: "insert"
        end: Object
        lines: Array[1]
        0: "d"
        length: 1
        __proto__: Array[0]
        start: Object
        __proto__: Objec
        */

        cmdList.forEach(function (cmd) {
          var c = {
            action: _convert[cmd[0]],
            start: {
              row: cmd[1],
              column: cmd[2]
            },
            end: {
              row: cmd[3],
              column: cmd[4]
            }
          };
          if (cmd[0] < 3) {
            c.lines = [cmd[5]];
          } else {
            c.lines = cmd[5];
          }
          if (cmd[0] == 4) c.nl = cmd[6] || '\n';
          newList.push(c);
        });
        return newList;
      };

      /**
       * @param Object lines
       * @param float cmdList
       */
      _myTrait_.runToLineObj = function (lines, cmdList) {

        cmdList.forEach(function (cmd) {
          var row = cmd[1],
              col = cmd[2],
              endRow = cmd[3],
              endCol = cmd[4];
          if (cmd[0] == 1) {
            if (cmd[5] == '\n') {
              // add the newline can be a bit tricky
              var line = lines.item(row);
              if (!line) {
                lines.insertAt(row, {
                  text: ''
                });
                lines.insertAt(row + 1, {
                  text: ''
                });
              } else {
                var txt = line.text();
                line.text(txt.slice(0, col));
                var newLine = {
                  text: txt.slice(col) || ''
                };
                lines.insertAt(row + 1, newLine);
              }
              //lines[row] = line.slice(0,col);
              //var newLine = line.slice(col) || "";
              //lines.splice(row+1, 0, newLine);
            } else {
              var line = lines.item(row);
              if (!line) {
                lines.insertAt(row, {
                  text: cmd[5]
                });
              } else {
                var txt = line.text();
                line.text(txt.slice(0, col) + cmd[5] + txt.slice(col));
                // lines[row] = line.slice(0, col) + cmd[5] + line.slice(col);
              }
            }
          }
          if (cmd[0] == 2) {
            if (cmd[5] == '\n') {
              // removing the newline can be a bit tricky
              // lines[row]
              var thisLine = lines.item(row),
                  nextLine = lines.item(row + 1);

              // lines[row] = thisLine + nextLine;
              // lines.splice(row+1, 1); // remove the line...
              var txt1 = '',
                  txt2 = '';
              if (thisLine) txt1 = thisLine.text();
              if (nextLine) txt2 = nextLine.text();
              if (!thisLine) {
                lines.insertAt(row, {
                  text: ''
                });
              } else {
                thisLine.text(txt1 + txt2);
              }
              if (nextLine) nextLine.remove();
            } else {
              var line = lines.item(row),
                  txt = line.text();
              line.text(txt.slice(0, col) + txt.slice(endCol));
              //  str.slice(0, 4) + str.slice(5, str.length))
              // lines[row] = line.slice(0, col) + line.slice(endCol);
            }
          }
          if (cmd[0] == 3) {
            var cnt = endRow - row;
            for (var i = 0; i < cnt; i++) {
              // var line = lines.item(row+i);
              lines.insertAt(row + i, {
                text: cmd[5][i]
              });
              // lines.splice(row+i, 0, cmd[5][i]);
            }
          }
          if (cmd[0] == 4) {
            var cnt = endRow - row;
            for (var i = 0; i < cnt; i++) {
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
      };

      /**
       * @param float str
       * @param float cmdList
       */
      _myTrait_.runToString = function (str, cmdList) {

        if (!cmdList || typeof str == 'undefined') {
          return '';
        }
        str = str + '';

        var lines = str.split('\n');

        cmdList.forEach(function (cmd) {
          var row = cmd[1],
              col = cmd[2],
              endRow = cmd[3],
              endCol = cmd[4];
          if (cmd[0] == 1) {
            if (cmd[5] == '\n') {
              // add the newline can be a bit tricky
              var line = lines[row] || '';
              lines[row] = line.slice(0, col);
              var newLine = line.slice(col) || '';
              lines.splice(row + 1, 0, newLine);
            } else {
              var line = lines[row] || '';
              lines[row] = line.slice(0, col) + cmd[5] + line.slice(col);
            }
          }
          if (cmd[0] == 2) {
            if (cmd[5] == '\n') {
              // removing the newline can be a bit tricky
              // lines[row]
              var thisLine = lines[row] || '',
                  nextLine = lines[row + 1] || '';
              lines[row] = thisLine + nextLine;
              lines.splice(row + 1, 1); // remove the line...
            } else {
              var line = lines[row] || '';
              // str.slice(0, 4) + str.slice(5, str.length))
              lines[row] = line.slice(0, col) + line.slice(endCol);
            }
          }
          if (cmd[0] == 3) {
            var cnt = endRow - row;
            for (var i = 0; i < cnt; i++) {
              lines.splice(row + i, 0, cmd[5][i]);
            }
          }
          if (cmd[0] == 4) {
            var cnt = endRow - row;
            for (var i = 0; i < cnt; i++) {
              lines.splice(row, 1);
            }
          }
        });

        return lines.join('\n');
      };

      /**
       * @param String version  - Just setting this makes it apply for the new command format
       */
      _myTrait_.setAceVersion = function (version) {
        _newAce = version;
      };

      /**
       * @param array cmdList
       */
      _myTrait_.simplify = function (cmdList) {

        // [[1,0,0,0,1,"a"],[1,0,1,0,2,"b"],[1,0,2,0,3,"c"],[1,0,3,0,4,"e"],[1,0,4,0,5,"d"],
        // [1,0,5,0,6,"e"],[1,0,6,0,7,"f"],[1,0,7,0,8,"g"]]
        var newList = [],
            lastCmd,
            lastCol,
            lastRow,
            collect = null;

        cmdList.forEach(function (cmd) {

          if (lastCmd && cmd[0] == 1 && lastCmd[0] == 1 && cmd[3] == cmd[1] && lastCmd[1] == cmd[1] && lastCmd[3] == cmd[3] && lastCmd[4] == cmd[2]) {
            if (!collect) {
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
            if (collect) {
              newList.push(collect);
              collect = null;
            }
            if (cmd[0] == 1) {
              collect = cmd.slice();
            } else {
              newList.push(cmd);
            }
          }
          lastCmd = cmd;
        });
        if (collect) newList.push(collect);
        return newList;
      };
    })(this);
  };

  var aceCmdConvert = function aceCmdConvert(a, b, c, d, e, f, g, h) {
    var m = this,
        res;
    if (m instanceof aceCmdConvert) {
      var args = [a, b, c, d, e, f, g, h];
      if (m.__factoryClass) {
        m.__factoryClass.forEach(function (initF) {
          res = initF.apply(m, args);
        });
        if (typeof res == 'function') {
          if (res._classInfo.name != aceCmdConvert._classInfo.name) return new res(a, b, c, d, e, f, g, h);
        } else {
          if (res) return res;
        }
      }
      if (m.__traitInit) {
        m.__traitInit.forEach(function (initF) {
          initF.apply(m, args);
        });
      } else {
        if (typeof m.init == 'function') m.init.apply(m, args);
      }
    } else return new aceCmdConvert(a, b, c, d, e, f, g, h);
  };

  aceCmdConvert._classInfo = {
    name: 'aceCmdConvert'
  };
  aceCmdConvert.prototype = new aceCmdConvert_prototype();

  (function () {
    if (typeof define !== 'undefined' && define !== null && define.amd != null) {
      __amdDefs__['aceCmdConvert'] = aceCmdConvert;
      this.aceCmdConvert = aceCmdConvert;
    } else if (typeof module !== 'undefined' && module !== null && module.exports != null) {
      module.exports['aceCmdConvert'] = aceCmdConvert;
    } else {
      this.aceCmdConvert = aceCmdConvert;
    }
  }).call(new Function('return this')());

  var diffEngine_prototype = function diffEngine_prototype() {

    (function (_myTrait_) {
      var _eventOn;
      var _commands;

      // Initialize static variables here...

      /**
       * @param float t
       */
      _myTrait_.guid = function (t) {

        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

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
      };

      /**
       * @param float t
       */
      _myTrait_.isArray = function (t) {

        if (typeof t == 'undefined') return this.__isA;

        return Object.prototype.toString.call(t) === '[object Array]';
      };

      /**
       * @param float fn
       */
      _myTrait_.isFunction = function (fn) {
        return Object.prototype.toString.call(fn) == '[object Function]';
      };

      /**
       * @param float t
       */
      _myTrait_.isObject = function (t) {

        if (typeof t == 'undefined') return this.__isO;

        return t === Object(t);
      };
    })(this);

    (function (_myTrait_) {
      var _all;
      var _data1;
      var _data2;
      var _up;
      var _reals;
      var _missing;
      var _added;
      var _parents;

      // Initialize static variables here...

      /**
       * @param float obj
       * @param float parentObj
       * @param float intoList
       */
      _myTrait_._createModelCommands = function (obj, parentObj, intoList) {

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

        if (!intoList) intoList = [];

        var data;

        if (obj.data && obj.__id) {
          data = obj.data;
        } else {
          data = obj;
        }

        if (this.isObject(data) || this.isArray(data)) {

          var newObj;

          if (obj.__id) {
            newObj = obj;
          } else {
            newObj = {
              data: data,
              __id: this.guid()
            };
          }

          if (this.isArray(data)) {
            var cmd = [2, newObj.__fork || newObj.__id, [], null, newObj.__fork || newObj.__id];
          } else {
            var cmd = [1, newObj.__fork || newObj.__id, {}, null, newObj.__fork || newObj.__id];
          }
          if (parentObj) {
            newObj.__p = parentObj.__id;
            // this._moveCmdListToParent( newObj );
          }
          intoList.push(cmd);

          // Then, check for the member variables...
          for (var n in data) {
            if (data.hasOwnProperty(n)) {
              var value = data[n];
              if (this.isObject(value) || this.isArray(value)) {
                // Then create a new...
                var oo = this._createModelCommands(value, newObj, intoList);
                var cmd = [5, n, oo.__fork || oo.__id, null, newObj.__fork || newObj.__id];
                intoList.push(cmd);
              } else {
                var cmd = [4, n, value, null, newObj.__fork || newObj.__id];
                intoList.push(cmd);
              }
            }
          }

          return newObj;
        } else {}

        /*
        var newObj = {
        data : data,
        __id : this.guid()
        }
        */
      };

      /**
       * @param float t
       */
      _myTrait_.addedObjects = function (t) {

        var res = [];

        for (var id in _data2) {
          if (_data2.hasOwnProperty(id)) {
            if (!_data1[id]) {
              res.push(id);
              _added[id] = _data2[id];
            }
          }
        }

        return res;
      };

      /**
       * @param float t
       */
      _myTrait_.commonObjects = function (t) {
        var res = [];

        for (var id in _all) {
          if (_data1[id] && _data2[id]) {
            res.push(id);
          }
        }

        return res;
      };

      /**
       * @param float data1
       * @param float data2
       */
      _myTrait_.compareFiles = function (data1, data2) {

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
          missing: this.missingObjects(),
          added: this.addedObjects(),
          common: this.commonObjects(),
          cMod: [],
          cmds: []
        };

        var me = this;
        details.common.forEach(function (id) {
          var diff = me.objectDiff(_data1[id], _data2[id]);
          details.cMod.push(diff);
        });

        var me = this;
        details.added.forEach(function (cid) {
          var cmdList = [];
          var obj = _all[cid];
          me._createModelCommands(obj, null, cmdList);

          cmdList.forEach(function (cmd) {
            details.cmds.push(cmd);
          });
        });
        details.cMod.forEach(function (c) {
          c.cmds.forEach(function (cc) {
            details.cmds.push(cc);
          });
        });

        return details;
      };

      /**
       * @param float data
       * @param float saveTo
       * @param float parentObj
       */
      _myTrait_.findObjects = function (data, saveTo, parentObj) {

        if (data && data.__id) {
          saveTo[data.__fork || data.__id] = data;
          _all[data.__fork || data.__id] = data;
          _reals[data.__id] = data;
        }

        if (data.data) {
          var sub = data.data;
          for (var n in sub) {
            if (sub.hasOwnProperty(n)) {
              var p = sub[n];
              if (this.isObject(p)) {
                _parents[p.__fork || p.__id] = data.__fork || data.__id;
                this.findObjects(p, saveTo);
              }
            }
          }
        }
      };

      if (_myTrait_.__traitInit && !_myTrait_.hasOwnProperty('__traitInit')) _myTrait_.__traitInit = _myTrait_.__traitInit.slice();
      if (!_myTrait_.__traitInit) _myTrait_.__traitInit = [];
      _myTrait_.__traitInit.push(function (t) {});

      /**
       * @param float t
       */
      _myTrait_.missingObjects = function (t) {

        var res = [];

        for (var id in _data1) {
          if (_data1.hasOwnProperty(id)) {
            if (!_data2[id]) {
              _missing[id] = _data1[id];
              res.push(id);
            }
          }
        }

        return res;
      };

      /**
       * @param float obj1
       * @param float obj2
       */
      _myTrait_.objectDiff = function (obj1, obj2) {
        var res = {
          modified: [],
          posMoved: [],
          sourcesAndTargets: [],
          cmds: []
        };

        if (obj1.data && obj2.data && this.isObject(obj1.data) && !this.isArray(obj1.data)) {
          var sub = obj1.data,
              hadProps = {};
          for (var n in obj2.data) {
            if (obj2.data.hasOwnProperty(n)) {
              var v = sub[n],
                  objid = obj1.__fork || obj1.__id;
              if (!this.isObject(v) && !this.isArray(v)) {
                hadProps[n] = true;
                var v2 = obj2.data[n];
                if (obj2.data[n] != v) {
                  if (this.isObject(v) || this.isObject(v2)) {
                    if (v2 && v2.__id) {
                      res.cmds.push([5, n, obj2.data[n].__id, null, objid]);
                    } else {
                      res.cmds.push([10, n, v.__id, null, objid]);
                    }
                  } else {
                    res.modified.push({
                      id: objid,
                      prop: n,
                      from: v,
                      to: obj2.data[n]
                    });
                    res.cmds.push([4, n, obj2.data[n], v, objid]);
                  }
                }
              } else {}
            }
          }
          for (var n in obj1.data) {
            if (obj1.data.hasOwnProperty(n)) {
              if (hadProps[n]) continue;
              var v = obj1.data[n],
                  objid = obj1.__id;

              if (this.isObject(v) && !this.isArray(v)) {
                var v2 = obj2.data[n];
                if (!v2 && v && v.__id) {
                  res.cmds.push([10, n, v.__id, null, objid]);
                }
              }
            }
          }
        }
        if (this.isArray(obj1.data)) {

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
          for (var i = 0; i < len1; i++) {
            var o = arr1[i];
            if (this.isObject(o)) {
              var activeId = o.__fork || o.__id;
              if (!_missing[activeId]) {
                sourceArray.push(activeId);
              } else {
                // res.cmds.push("remove "+activeId);
                res.cmds.push([8, 0, activeId, 0, _parents[activeId]]);
              }
            }
          }
          var indexArr = {},
              reverseIndex = {},
              sourceReverseIndex = {};
          for (var i = 0; i < len2; i++) {
            var o = arr2[i];
            if (this.isObject(o)) {
              var activeId = o.__fork || o.__id;
              indexArr[activeId] = i;
              reverseIndex[i] = activeId;
              if (_added[activeId]) {
                sourceArray.push(activeId);
                // res.cmds.push("insert "+activeId);
                res.cmds.push([7, i, activeId, 0, _parents[activeId]]);
              }
              targetArray.push(activeId);
            }
          }

          var list = [],
              i = 0;
          sourceArray.forEach(function (id) {
            list.push(indexArr[id]);
            sourceReverseIndex[id] = i;
            i++;
          });

          res.restackIndex = indexArr;
          res.restackList = list;
          res.reverseIndex = reverseIndex;
          res.restack = this.restackOps(list);

          // insert
          // [7, 0, <insertedID>, 0, <parentId>]

          // remove
          // [8, 0, <insertedID>, 0, <parentId>]

          // move
          // [12, <insertedID>, <index>, 0, <parentId>]      

          var cmdList = [],
              sourceArrayWork = sourceArray.slice();

          res.restack.forEach(function (c) {
            if (c[0] == 'a') {
              var moveItemId = reverseIndex[c[1]],
                  aboveItemId = reverseIndex[c[2]],
                  atIndex = indexArr[aboveItemId],
                  fromIndex = sourceArrayWork.indexOf(moveItemId);

              sourceArrayWork.splice(fromIndex, 1);
              var toIndex = sourceArrayWork.indexOf(aboveItemId);
              sourceArrayWork.splice(toIndex, 0, moveItemId);

              var obj = _all[moveItemId];

              res.cmds.push([12, moveItemId, toIndex, fromIndex, _parents[moveItemId]]);
              //             cmdList.push(" move item "+moveItemId+" above "+aboveItemId+ " from "+fromIndex+ " to "+toIndex);
            } else {
              var moveItemId = reverseIndex[c[1]],
                  aboveItemId = reverseIndex[c[2]],
                  atIndex = indexArr[aboveItemId],
                  fromIndex = sourceArrayWork.indexOf(moveItemId);
              sourceArrayWork.splice(fromIndex, 1);
              var toIndex = sourceArrayWork.indexOf(aboveItemId) + 1;
              sourceArrayWork.splice(toIndex, 0, moveItemId);
              // cmdList.push(" move item "+moveItemId+" above "+aboveItemId+ " from "+fromIndex+ " to "+toIndex); 
              res.cmds.push([12, moveItemId, toIndex, fromIndex, _parents[moveItemId]]);
            }
          });
          res.stackCmds = cmdList;
          res.sourceArrayWork = sourceArrayWork;

          res.sourcesAndTargets.push([sourceArray, targetArray]);
        }

        return res;
      };

      /**
       * @param float input
       */
      _myTrait_.restackOps = function (input) {
        var moveCnt = 0,
            cmds = [];

        function restack(input) {
          var data = input.slice(0);
          var dataIn = input.slice(0);
          var goalIn = input.slice(0).sort(function (a, b) {
            return a - b;
          });

          var mapper = {};
          var indexes = {};
          // Testing this kind of simple system...
          for (var i = 0; i < dataIn.length; i++) {
            var mm = goalIn.indexOf(dataIn[i]);
            mapper[dataIn[i]] = mm;
            indexes[mm] = dataIn[i];
            data[i] = mm;
          }

          var goal = data.slice(0).sort(function (a, b) {
            return a - b;
          });

          var minValue = data[0],
              maxValue = data[0],
              partDiffs = [],
              partCum = 0,
              avgDiff = (function () {
            var i = 0,
                len = data.length,
                df = 0;
            for (; i < len; i++) {
              var v = data[i];
              if (v > maxValue) maxValue = v;
              if (v < minValue) minValue = v;
              if (i > 0) partDiffs.push(goal[i] - goal[i - 1]);
              if (i > 0) partCum += Math.abs(goal[i] - goal[i - 1]);
              df += Math.abs(v - goal[i]);
            }
            partCum = partCum / len;
            return df / len;
          })();

          partDiffs.sort(function (a, b) {
            return a - b;
          });
          var minDelta = partDiffs[0];

          // collects one "acceptable" array
          var accept = function accept(fn) {
            var collect = function collect(i, sx, last) {
              var res = [];
              var len = data.length;
              if (!sx) sx = 0;
              for (; i < len; i++) {
                var v = data[i];
                if (v - last == 1) {
                  res.push(v);
                  last = v;
                  continue;
                }
                var gi = i + sx;
                if (gi < 0) gi = 0;
                if (gi >= len) gi = len - 1;
                if (fn(v, goal[gi], v, last, i, len)) {
                  if (data[i + 1] && data[i + 1] < v && data[i + 1] > last) {} else {
                    res.push(v);
                    last = v;
                  }
                }
              }
              return res;
            };

            var m = [];
            var ii = 0,
                a = 0;
            // small tricks to improve the algo, just for comp's sake...
            while (a < 0.1) {
              for (var sx = -5; sx <= 5; sx++) m.push(collect(Math.floor(data.length * a), sx, minValue - 1));
              a += 0.05;
            }
            m.sort(function (a, b) {
              return b.length - a.length;
            });
            return m[0];
          };

          // different search agents...
          var test = [accept(function (dv, gv, v, last, i, len) {
            // console.log(Math.abs(v-last)+" vs "+partCum);
            if (v < last) return false;
            if (i > 0) if (Math.abs(v - last) > partDiffs[i - 1]) return false;
            if (Math.abs(v - last) > avgDiff) return false;
            if (Math.abs(dv - gv) <= avgDiff * (i / len) && v >= last) return true;
            if (Math.abs(last - v) <= avgDiff * (i / len) && v >= last) return true;
            return false;
          }), accept(function (dv, gv, v, last, i, len) {
            if (v < last) return false;
            if (Math.abs(v - last) > avgDiff) return false;
            if (Math.abs(dv - gv) <= avgDiff * (i / len) && v >= last) return true;
            if (Math.abs(last - v) <= avgDiff * (i / len) && v >= last) return true;
            return false;
          }), accept(function (dv, gv, v, last, i, len) {
            if (v < last) return false;
            if (Math.abs(v - last) > avgDiff) return false;
            if (Math.abs(dv - gv) <= avgDiff * (i / len) && v >= last) return true;
            if (Math.abs(last - v) <= avgDiff * (i / len) && v >= last) return true;
            return false;
          }), accept(function (dv, gv, v, last, i, len) {
            if (v < last) return false;
            if (Math.abs(dv - gv) <= avgDiff * (i / len) && v >= last) return true;
            if (Math.abs(last - v) <= avgDiff * (i / len) && v >= last) return true;
            return false;
          }), accept(function (dv, gv, v, last, i, len) {
            if (v < last) return false;
            if (Math.abs(dv - gv) <= avgDiff && v >= last) return true;
            if (Math.abs(last - v) <= avgDiff * (i / len) && v >= last) return true;
            return false;
          }), accept(function (dv, gv, v, last, i, len) {
            if (v < last) return false;
            if (Math.abs(v - last) < partCum) return true;
            if (Math.abs(dv - gv) <= partCum && v >= last) return true;
            return false;
          }), accept(function (dv, gv, v, last, i, len) {
            if (v > last) return true;
            return false;
          }), accept(function (dv, gv, v, last, i, len) {
            if (v < last) return false;
            if (Math.abs(v - last) > avgDiff) return false;
            if (Math.abs(dv - gv) <= avgDiff && v >= last) return true;
            return false;
          }), accept(function (dv, gv, v, last, i, len) {
            if (v < last) return false;
            if (i > 0) if (Math.abs(v - last) > avgDiff) return false;
            if (Math.abs(dv - gv) <= avgDiff * (i / len) && v >= last) return true;
            if (i > 0) if (Math.abs(last - v) <= avgDiff * (i / len) && v >= last) return true;
            return false;
          }), accept(function (dv, gv, v, last, i, len) {
            if (v < last) return false;
            if (last >= minValue) {
              if (v >= last) return true;
            } else {
              if (v == minValue) return true;
            }
            return false;
          })];

          // choose between algorithms
          var okVals = [],
              maxSet = 0;
          for (var i = 0; i < test.length; i++) {
            var set = test[i];
            if (set.length > maxSet) {
              okVals = set;
              maxSet = set.length;
            }
          }
          // if nothing, take something
          if (okVals.length == 0) okVals = [goal[Math.floor(goal.length / 2)]];

          // divide the list to big and small
          var big = [],
              small = [];
          var divide = (function () {
            var min = minValue,
                max = okVals[0],
                okLen = okVals.length,
                oki = data.indexOf(max),
                index = 0;

            var i = 0,
                len = data.length;
            for (; i < len; i++) {
              var v = data[i];
              if (v >= min && v <= max && i <= oki) {
                big.push(v);
                min = v;
              } else {
                small.push(v);
              }
              if (v == max) {
                min = v;
                if (index < okLen - 1) {
                  index++;
                  max = okVals[index];
                  oki = data.indexOf(max);
                } else {
                  max = maxValue;
                  oki = len + 1;
                }
              }
            }
          })();

          // sort the small list before joining them
          small.sort(function (a, b) {
            return a - b;
          });

          //console.log(big);
          //console.log(small);

          var joinThem = (function () {
            var si = 0,
                bi = 0,
                lastb = big[0],
                slen = small.length;
            while (si < slen) {
              var b = big[bi],
                  s = small[si];
              if (typeof b == 'undefined') {
                while (si < slen) {
                  cmds.push(['b', indexes[s], indexes[lastb]]);
                  // restackXBelowY(dataIn, indexes[s], indexes[lastb]);
                  lastb = s;
                  si++;
                  s = small[si];
                }
                return;
              }
              if (b < s) {
                // console.log("B was smaller");
                lastb = b;
                bi++;
              } else {
                cmds.push(['a', indexes[s], indexes[b]]);
                // restackXAboveY(dataIn, indexes[s], indexes[b]);
                si++;
              }
            }
          })();

          // console.log(dataIn);
          return data; // actually the return value is not used for anything  
        }
        restack(input);

        return cmds;
      };
    })(this);
  };

  var diffEngine = function diffEngine(a, b, c, d, e, f, g, h) {
    var m = this,
        res;
    if (m instanceof diffEngine) {
      var args = [a, b, c, d, e, f, g, h];
      if (m.__factoryClass) {
        m.__factoryClass.forEach(function (initF) {
          res = initF.apply(m, args);
        });
        if (typeof res == 'function') {
          if (res._classInfo.name != diffEngine._classInfo.name) return new res(a, b, c, d, e, f, g, h);
        } else {
          if (res) return res;
        }
      }
      if (m.__traitInit) {
        m.__traitInit.forEach(function (initF) {
          initF.apply(m, args);
        });
      } else {
        if (typeof m.init == 'function') m.init.apply(m, args);
      }
    } else return new diffEngine(a, b, c, d, e, f, g, h);
  };

  diffEngine._classInfo = {
    name: 'diffEngine'
  };
  diffEngine.prototype = new diffEngine_prototype();

  var _channelData_prototype = function _channelData_prototype() {

    (function (_myTrait_) {

      // Initialize static variables here...

      /**
       * @param float t
       */
      _myTrait_.guid = function (t) {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      };

      /**
       * @param float t
       */
      _myTrait_.isArray = function (t) {
        return t instanceof Array;
      };

      /**
       * @param float fn
       */
      _myTrait_.isFunction = function (fn) {
        return Object.prototype.toString.call(fn) == '[object Function]';
      };

      /**
       * @param float t
       */
      _myTrait_.isObject = function (t) {
        return t === Object(t);
      };
    })(this);

    (function (_myTrait_) {
      var _listeners;
      var _execInfo;
      var _doingRemote;
      var _cmds;
      var _reverseCmds;
      var _settings;
      var _hotObjs;
      var _dmp;
      var _clearCreated;

      // Initialize static variables here...

      /**
       * @param float a
       * @param float isRemote
       */
      _myTrait_._cmd_aceCmd = function (a, isRemote) {
        var obj = this._find(a[4]),
            prop = a[1];

        if (!obj || !prop) return false;
        if (typeof obj.data[prop] != 'string') return false;

        var conv = aceCmdConvert();
        obj.data[prop] = conv.runToString(obj.data[prop], a[2]);

        _doingRemote = isRemote;

        var tmpCmd = [4, prop, obj.data[prop], null, a[4], a[5], a[6]];
        this._cmd(tmpCmd, obj, null);

        if (!isRemote) {
          this._cmd(a, obj, null); // this is the problematic.
          this.writeCommand(a);
        } else {
          this._cmd(a, obj, null);
        }
        _doingRemote = false;
        // this._fireListener(obj, prop);

        return true;
      };

      /**
       * @param float a
       * @param float isRemote
       */
      _myTrait_._cmd_createArray = function (a, isRemote) {
        var objId = a[1];
        if (!objId) return {
          error: 21,
          cmd: a,
          text: 'Object ID was null or undefined'
        };

        var hash = this._getObjectHash();
        if (hash[objId]) return {
          error: 22,
          cmd: a,
          text: 'Array with ID was already created'
        };

        var newObj;
        var _removedHash = this._getRemovedHash();

        if (_removedHash[objId]) {
          newObj = _removedHash[objId];
          newObj.__p = null;
        } else {
          newObj = {
            data: [],
            __id: objId
          };
        }
        // var newObj = { data : [], __id : objId };
        hash[newObj.__id] = newObj;

        // it is orphan object...
        this._data.__orphan.push(newObj);

        if (!isRemote) {}
        return true;
      };

      /**
       * @param float a
       * @param float isRemote
       */
      _myTrait_._cmd_createObject = function (a, isRemote) {

        var objId = a[1];

        if (!objId) return {
          error: 11,
          cmd: a,
          text: 'Object ID was null or undefined'
        };

        var hash = this._getObjectHash();

        // not error, skip the cmd
        if (hash[objId]) return {
          error: 12,
          cmd: a,
          text: 'Object ID was already created'
        };

        var newObj;
        var _removedHash = this._getRemovedHash();

        if (_removedHash[objId]) {
          newObj = _removedHash[objId];
          newObj.__p = null;
        } else {
          newObj = {
            data: {},
            __id: objId
          };
        }
        hash[newObj.__id] = newObj;

        // it is orphan object...
        this._data.__orphan.push(newObj);

        // --- adding to the data object...

        if (!isRemote) {}
        return true;
      };

      /**
       * @param float a
       * @param float isRemote
       */
      _myTrait_._cmd_diffPatch = function (a, isRemote) {

        if (!_dmp) return {
          error: 141,
          cmd: a,
          text: 'diff-match-patch not initialized'
        };

        var obj = this._find(a[4]),
            prop = a[1];

        if (!obj) return {
          error: 41,
          cmd: a,
          text: 'Did not find object with ID (' + a[4] + ') '
        };

        if (!prop) return {
          error: 42,
          cmd: a,
          text: 'The property was not defined (' + a[1] + ') '
        };

        var oldValue = obj.data[prop];
        if (this.isObject(oldValue) || this.isArray(oldValue)) return {
          error: 145,
          cmd: a,
          text: 'Trying to apply text diff/patch to  Object or Array'
        };

        // TODO: data -integrity problem, can you verify the reverse diff, this might cause problems...
        // a[2] -> the patch as text
        // a[3] -> the reverse patch as text

        var patch = _dmp.patch_fromText(a[2]);
        // TODO: error condition?

        var newValue = _dmp.patch_apply(patch, oldValue);
        if (!this.isArray(newValue)) return {
          error: 146,
          cmd: a,
          text: 'patch_apply failed'
        };
        var list = newValue[1];
        if (!list) return {
          error: 146,
          cmd: a,
          text: 'patch_apply failed'
        };
        for (var i = 0; i < list.length; i++) {
          if (!list[i]) return {
            error: 146,
            cmd: a,
            text: 'patch_apply failed'
          };
        }
        obj.data[prop] = newValue[0]; // the new value for the data property
        _doingRemote = isRemote;

        // from the listeners point of view this is only object property change
        var tmpCmd = [4, prop, obj.data[prop], oldValue, a[4], a[5], a[6]];
        this._cmd(tmpCmd, obj, null);

        if (!isRemote) {
          this.writeCommand(a);
        } else {
          this._cmd(a, obj, null);
        }
        _doingRemote = false;

        return true;
      };

      /**
       * @param float a
       * @param float isRemote
       */
      _myTrait_._cmd_moveToIndex = function (a, isRemote) {
        var obj = this._find(a[4]),
            prop = '*',
            len = obj.data.length,
            targetObj;

        if (!obj) return {
          error: 2,
          cmd: 1,
          text: 'Object with ID (' + a[4] + ') did not exist'
        };

        var oldIndex = null,
            i;

        var targetObj = this._find(a[1]);
        i = oldIndex = obj.data.indexOf(targetObj);

        /*
        for(i=0; i< len; i++) {
        var m = obj.data[i];
        if(m.__id == a[1]) {
        targetObj = m;
        oldIndex = i;
        break;
        }
        }
        */

        if (oldIndex != a[3]) {
          return {
            error: 121,
            cmd: a,
            text: 'The old index was not what expected: ' + oldIndex + ' cmd have ' + a[3]
          };
        }

        if (!targetObj) {
          return {
            error: 122,
            cmd: a,
            text: 'Object to be moved (' + a[1] + ') was not in the array'
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
        if (isNaN(targetIndex)) return {
          error: 123,
          cmd: a,
          text: 'Target index (' + targetIndex + ') was not a number'
        };

        if (obj.data.length <= i || i < 0) return {
          error: 124,
          cmd: a,
          text: 'Invalid original index (' + i + ') given'
        };

        _execInfo.fromIndex = i;

        obj.data.splice(i, 1);
        obj.data.splice(targetIndex, 0, targetObj);
        this._cmd(a, null, a[1]);

        return true;
      };

      /**
       * @param float a
       * @param float isRemote
       */
      _myTrait_._cmd_pushToArray = function (a, isRemote) {

        var parentObj = this._find(a[4]),
            insertedObj = this._find(a[2]),
            toIndex = parseInt(a[1]),
            oldPos = a[3],
            // old position can also be "null"
        prop = '*',
            index = parentObj.data.length; // might check if valid...

        if (!parentObj) return {
          error: 71,
          cmd: a,
          text: 'Did not find object with ID (' + a[4] + ') '
        };

        if (!insertedObj) return {
          error: 72,
          cmd: a,
          text: 'Did not find object with ID (' + a[2] + ') '
        };

        // NOTE: deny inserting object which already has been inserted
        if (insertedObj.__p) {
          if (insertedObj.__p == parentObj.__id) {
            // nothing needs to be done here, unnecessary command though
            console.log('WARNING : Unnecessary pushToArray');
            console.log(a);
            return true;
          }
          return {
            error: 73,
            cmd: a,
            text: 'The object already had a parent - need to remove first (' + a[2] + ') '
          };
        }
        if (isNaN(toIndex)) return {
          error: 74,
          cmd: a,
          text: 'toIndex was not a number'
        };
        if (!this.isArray(parentObj.data)) return {
          error: 75,
          cmd: a,
          text: 'Target Object was not an array'
        };
        if (toIndex > parentObj.data.length || toIndex < 0) return {
          error: 76,
          cmd: a,
          text: 'toIndex out of range, parent data len ' + parentObj.data.length
        };

        parentObj.data.splice(toIndex, 0, insertedObj);

        insertedObj.__p = parentObj.__id;

        // remove from orphans
        var ii = this._data.__orphan.indexOf(insertedObj);
        if (ii >= 0) {
          this._data.__orphan.splice(ii, 1);
        }
        // this._moveCmdListToParent(insertedObj);

        // Saving the write to root document
        if (!isRemote) {}
        this._cmd(a, null, a[2]);

        return true;
      };

      /**
       * @param float a
       * @param float isRemote
       */
      _myTrait_._cmd_removeObject = function (a, isRemote) {

        var parentObj = this._find(a[4]),
            removedItem = this._find(a[2]),
            oldPosition = parseInt(a[1]),
            prop = '*';

        if (!parentObj) return {
          error: 81,
          cmd: a,
          text: 'Did not find object with ID (' + a[4] + ') '
        };

        if (!removedItem) return {
          error: 82,
          cmd: a,
          text: 'Did not find object with ID (' + a[2] + ') '
        };

        // NOTE: deny inserting object which already has been inserted
        if (!removedItem.__p) return {
          error: 83,
          cmd: a,
          text: 'The removed item did not have a parent (' + a[2] + ') '
        };

        var index = parentObj.data.indexOf(removedItem); // might check if valid...
        if (isNaN(oldPosition)) return {
          error: 84,
          cmd: a,
          text: 'oldPosition was not a number'
        };
        if (oldPosition != index) return {
          error: 85,
          cmd: a,
          text: 'oldPosition was not same as current position'
        };

        var _removedHash = this._getRemovedHash();
        _removedHash[a[2]] = removedItem;
        // now the object is in the array...
        parentObj.data.splice(index, 1);

        // removed at should not be necessary because journal has the data
        // removedItem.__removedAt = index;

        this._cmd(a, null, a[2]);

        removedItem.__p = null; // must be set to null...

        // remove from orphans
        var ii = this._data.__orphan.indexOf(removedItem);
        if (ii < 0) {
          this._data.__orphan.push(removedItem);
        }

        // Saving the write to root document
        if (!isRemote) {}

        return true;
      };

      /**
       * @param float a
       * @param float isRemote
       */
      _myTrait_._cmd_setMeta = function (a, isRemote) {
        var obj = this._find(a[4]),
            prop = a[1];

        if (!prop) return false;

        if (prop == 'data') return false;
        if (prop == '__id') return false;

        if (obj) {

          if (obj[prop] == a[2]) return false;

          obj[prop] = a[2]; // value is now set...
          this._cmd(a, obj, null);

          // Saving the write to root document
          if (!isRemote) {
            this.writeCommand(a);
          }
          return true;
        } else {
          return false;
        }
      };

      /**
       * @param float a
       * @param float isRemote
       */
      _myTrait_._cmd_setProperty = function (a, isRemote) {
        var obj = this._find(a[4]),
            prop = a[1];

        if (!obj) return {
          error: 41,
          cmd: a,
          text: 'Did not find object with ID (' + a[4] + ') '
        };

        if (!prop) return {
          error: 42,
          cmd: a,
          text: 'The property was not defined (' + a[1] + ') '
        };

        var oldValue = obj.data[prop];

        if (oldValue == a[2]) return {
          error: 43,
          cmd: a,
          text: 'Trying to set the same value to the object twice'
        };

        if (typeof oldValue == 'undefined' || oldValue === null) {
          if (typeof a[3] != 'undefined' && a[3] !== null) return {
            error: 44,
            cmd: a,
            text: 'The old value ' + oldValue + ' was not the same as the commands old value'
          };
        } else {

          if (this.isObject(oldValue) || this.isArray(oldValue)) return {
            error: 45,
            cmd: a,
            text: 'Trying to set Object or Array value to a scalar property'
          };

          if (oldValue != a[3]) return {
            error: 44,
            cmd: a,
            text: 'The old value ' + oldValue + ' was not the same as the commands old value'
          };
        }

        obj.data[prop] = a[2]; // value is now set...
        this._cmd(a, obj, null);

        // Saving the write to root document
        if (!isRemote) {}
        //this._fireListener(obj, prop);

        return true;
      };

      /**
       * @param float a
       * @param float isRemote
       */
      _myTrait_._cmd_setPropertyObject = function (a, isRemote) {
        var obj = this._find(a[4]),
            prop = a[1],
            setObj = this._find(a[2]);

        if (!obj) return {
          error: 51,
          cmd: a,
          text: 'Did not find object with ID (' + a[4] + ') '
        };

        if (!prop) return {
          error: 52,
          cmd: a,
          text: 'The property was not defined (' + a[1] + ') '
        };

        // if(!obj || !prop)   return false;
        // if(!setObj)         return false;

        if (!setObj) return {
          error: 53,
          cmd: a,
          text: 'Could not find the Object to be set with ID (' + a[2] + ') '
        };

        if (typeof obj.data[prop] != 'undefined') return {
          error: 54,
          cmd: a,
          text: 'The property (' + a[1] + ') was already set, try unsetting first '
        };
        if (!this.isObject(obj.data) || this.isArray(obj.data)) return {
          error: 55,
          cmd: a,
          text: 'The object (' + a[2] + ') was not of type Object '
        };

        obj.data[prop] = setObj; // value is now set...
        setObj.__p = obj.__id; // The parent relationship

        this._cmd(a, null, a[2]);

        var ii = this._data.__orphan.indexOf(setObj);
        if (ii >= 0) {
          this._data.__orphan.splice(ii, 1);
        }

        if (!isRemote) {
          this._moveCmdListToParent(setObj);
          // this.writeCommand(a);
        }
        return true;
      };

      /**
       * @param float a
       * @param float isRemote
       */
      _myTrait_._cmd_unsetProperty = function (a, isRemote) {
        var obj = this._find(a[4]),
            prop = a[1];

        if (!obj) return {
          error: 101,
          cmd: a,
          text: 'Did not find object with ID (' + a[4] + ') '
        };

        if (!prop) return {
          error: 102,
          cmd: a,
          text: 'The property was not defined (' + a[1] + ') '
        };

        if (this.isArray(obj.data[prop])) return {
          error: 103,
          cmd: a,
          text: 'The Object data was Array (' + a[4] + ') '
        };

        delete obj.data[prop];
        // if(!isRemote) this.writeCommand(a);

        return true;
      };

      /**
       * @param float obj
       * @param float prop
       */
      _myTrait_._fireListener = function (obj, prop) {
        if (_listeners) {
          var lName = obj.__id + '::' + prop,
              eList = _listeners[lName];
          if (eList) {
            eList.forEach(function (fn) {
              fn(obj, obj.data[prop]);
            });
          }
        }
      };

      /**
       * @param float t
       */
      _myTrait_._moveCmdListToParent = function (t) {};

      /**
       * @param float a
       */
      _myTrait_._reverse_aceCmd = function (a) {

        var obj = this._find(a[4]),
            prop = a[1];

        var conv = aceCmdConvert();

        var newCmds = conv.reverse(a[2]);

        var tmpCmd = [4, prop, obj.data[prop], null, a[4]];
        var tmpCmd2 = [13, prop, newCmds, null, a[4]];

        var s = conv.runToString(obj.data[prop], newCmds);
        obj.data[prop] = s;

        // TODO: check that these work, may not be good idea to do both
        this._cmd(tmpCmd);
        this._cmd(tmpCmd2);
      };

      /**
       * @param float a
       */
      _myTrait_._reverse_createArray = function (a) {
        var objId = a[1];
        var hash = this._getObjectHash();

        var o = hash[objId];
        var _removedHash = this._getRemovedHash();
        _removedHash[objId] = o;

        delete hash[objId];

        var ii = this._data.__orphan.indexOf(o);

        if (ii >= 0) {
          this._data.__orphan.splice(ii, 1);
        }
      };

      /**
       * @param float a
       */
      _myTrait_._reverse_createObject = function (a) {
        var objId = a[1];
        var hash = this._getObjectHash();

        var o = hash[objId];
        var _removedHash = this._getRemovedHash();
        _removedHash[objId] = o;

        delete hash[objId];

        var ii = this._data.__orphan.indexOf(o);

        if (ii >= 0) {
          this._data.__orphan.splice(ii, 1);
        }
      };

      /**
       * @param float a
       * @param float isRemote
       */
      _myTrait_._reverse_diffPatch = function (a, isRemote) {

        if (!_dmp) return {
          error: 141,
          cmd: a,
          text: 'diff-match-patch not initialized'
        };

        var obj = this._find(a[4]),
            prop = a[1];

        if (!obj) return {
          error: 41,
          cmd: a,
          text: 'Did not find object with ID (' + a[4] + ') '
        };

        if (!prop) return {
          error: 42,
          cmd: a,
          text: 'The property was not defined (' + a[1] + ') '
        };

        var oldValue = obj.data[prop];
        if (this.isObject(oldValue) || this.isArray(oldValue)) return {
          error: 145,
          cmd: a,
          text: 'Trying to apply text diff/patch to  Object or Array'
        };

        // the reverse command...
        var patch = _dmp.patch_fromText(a[3]);

        var newValue = _dmp.patch_apply(patch, oldValue);
        if (!this.isArray(newValue)) return {
          error: 146,
          cmd: a,
          text: 'patch_apply failed'
        };
        var list = newValue[1];
        if (!list) return {
          error: 146,
          cmd: a,
          text: 'patch_apply failed'
        };
        for (var i = 0; i < list.length; i++) {
          if (!list[i]) return {
            error: 146,
            cmd: a,
            text: 'patch_apply failed'
          };
        }
        obj.data[prop] = newValue[0]; // the new value for the data property
        _doingRemote = isRemote;

        // from the listeners point of view this is only object property change
        var tmpCmd = [4, prop, obj.data[prop], oldValue, a[4], a[5], a[6]];
        this._cmd(tmpCmd, obj, null);

        if (!isRemote) {
          this.writeCommand(a);
        } else {
          this._cmd(a, obj, null);
        }
        _doingRemote = false;

        return true;
      };

      /**
       * @param float a
       */
      _myTrait_._reverse_moveToIndex = function (a) {
        var obj = this._find(a[4]),
            prop = '*',
            len = obj.data.length,
            targetObj,
            i = 0;

        var oldIndex = null;

        for (i = 0; i < len; i++) {
          var m = obj.data[i];
          if (m.__id == a[1]) {
            targetObj = m;
            oldIndex = i;
            break;
          }
        }

        if (oldIndex != a[2]) {
          throw '_reverse_moveToIndex with invalid index value';
          return;
        }

        if (targetObj) {

          var targetIndex = parseInt(a[3]);

          obj.data.splice(i, 1);
          obj.data.splice(targetIndex, 0, targetObj);

          var tmpCmd = a.slice();
          tmpCmd[2] = targetIndex;
          tmpCmd[3] = a[2];

          this._cmd(tmpCmd, null, tmpCmd[1]);
        }
      };

      /**
       * @param float a
       */
      _myTrait_._reverse_pushToArray = function (a) {
        var parentObj = this._find(a[4]),
            insertedObj = this._find(a[2]),
            prop = '*',
            index = parentObj.data.length;

        // Moving the object in the array
        if (parentObj && insertedObj) {

          var shouldBeAt = parentObj.data.length - 1;

          var item = parentObj.data[shouldBeAt];

          // old parent and old item id perhas should be also defined?
          if (item.__id == a[2]) {

            // the command which appears to be run, sent to the data listeners
            var tmpCmd = [8, shouldBeAt, item.__id, null, parentObj.__id];

            // too simple still...
            parentObj.data.splice(shouldBeAt, 1);

            this._cmd(tmpCmd, null, tmpCmd[2]);
          }
        }
      };

      /**
       * @param float a
       */
      _myTrait_._reverse_removeObject = function (a) {

        var parentObj = this._find(a[4]),
            removedItem = this._find(a[2]),
            oldPosition = a[1],
            prop = '*',
            index = parentObj.data.indexOf(removedItem); // might check if valid...

        // Moving the object in the array
        if (parentObj && removedItem) {

          // now the object is in the array...
          parentObj.data.splice(oldPosition, 0, removedItem);

          var tmpCmd = [7, oldPosition, a[2], null, a[4]];

          this._cmd(tmpCmd, null, a[2]);

          // remove from orphans
          var ii = this._data.__orphan.indexOf(removedItem);
          if (ii >= 0) {
            this._data.__orphan.splice(ii, 1);
          }

          removedItem.__p = a[4];
        }
      };

      /**
       * @param Array a
       */
      _myTrait_._reverse_setMeta = function (a) {
        var obj = this._find(a[4]),
            prop = a[1];

        if (obj) {
          var tmpCmd = [3, prop, a[3], a[2], a[4]];
          obj[prop] = a[3]; // the old value
          this._cmd(tmpCmd);
        }
      };

      /**
       * @param Array a
       */
      _myTrait_._reverse_setProperty = function (a) {
        var obj = this._find(a[4]),
            prop = a[1];

        if (obj) {
          var tmpCmd = [4, prop, a[3], a[2], a[4]];
          obj.data[prop] = a[3]; // the old value
          this._cmd(tmpCmd);
        }
      };

      /**
       * @param float a
       */
      _myTrait_._reverse_setPropertyObject = function (a) {

        var obj = this._find(a[4]),
            prop = a[1],
            setObj = this._find(a[2]);

        if (!obj) return;
        if (!setObj) return;

        delete obj.data[prop]; // removes the property object
        setObj.__p = null;

        var tmpCmd = [10, prop, null, null, a[4]];
        this._cmd(tmpCmd);
      };

      /**
       * @param Array a
       */
      _myTrait_._reverse_unsetProperty = function (a) {
        var obj = this._find(a[4]),
            removedObj = this._find(a[2]),
            prop = a[1];

        if (a[3] != 'value') {
          if (obj && prop && removedObj) {

            obj.data[prop] = removedObj;
            removedObj.__p = obj.__id; // The parent relationship

            var tmpCmd = [5, prop, removedObj.__id, 0, a[4]];
            this._cmd(tmpCmd, null, removedObj.__id);
          }
        } else {
          if (obj && prop) {
            var tmpCmd = [4, prop, a[2], null, a[4]];
            this._cmd(tmpCmd, null, obj.__id);
          }
        }
      };

      /**
       * @param bool forceWrite
       */
      _myTrait_._updateHotBuffer = function (forceWrite) {
        var me = this;
        var ms = new Date().getTime();
        for (var n in _hotObjs) {
          if (_hotObjs.hasOwnProperty(n)) {
            var hoot = _hotObjs[n];

            if (forceWrite || ms - hoot.ms > _settings.hotMs) {
              // => one should write this command now

              if (hoot.lastCmd) {
                var a = hoot.firstCmd,
                    b = hoot.lastCmd;
                hoot.chObj.writeLocalJournal([4, a[1], b[2], a[3], a[4]]);
              } else {
                hoot.chObj.writeLocalJournal(hoot.firstCmd);
              }
              delete _hotObjs[n];
            }
          }
        }
      };

      /**
       * @param float a
       * @param float isRemote
       * @param float isRedo
       */
      _myTrait_.execCmd = function (a, isRemote, isRedo) {

        try {
          if (!this.isArray(a)) return false;
          var c = _cmds[a[0]];

          if (this._playBackOnFn && !isRedo) {
            // do not allow commands when playback is on
            return false;
          }
          console.log('cmd ' + a);

          if (c) {
            var rv = c.apply(this, [a, isRemote]);

            if (rv !== true) {
              console.log('ERROR ' + JSON.stringify(a));
              console.log(JSON.stringify(rv));
            }

            if (rv === true && !isRedo) {
              // there is the hot buffer possibility for the object
              if (!isRemote) {

                if (a[0] == 4 && _settings.hotMs) {
                  var objid = a[4];
                  var key = objid + ':' + a[1];
                  var hot = _hotObjs[key];
                  if (!hot) {
                    _hotObjs[key] = {
                      ms: new Date().getTime(),
                      firstCmd: a,
                      chObj: this
                    };
                  } else {
                    hot.lastCmd = a;
                  }
                  // console.log(JSON.stringify(hot));
                } else {
                  this._updateHotBuffer(true);
                  this.writeLocalJournal(a);
                }
              } else {
                this.writeLocalJournal(a);
              }
            }
            return rv;
          } else {
            return {
              error: 199,
              text: 'Invalid command'
            };
          }
        } catch (e) {
          var txt = '';
          if (e && e.message) txt = e.message;
          console.error(e, e.message);
          return {
            error: 199,
            cmd: a,
            text: 'Exception raised ' + txt
          };
        }
      };

      /**
       * @param Int i
       */
      _myTrait_.getJournalCmd = function (i) {

        return this._journal[i];
      };

      /**
       * @param float t
       */
      _myTrait_.getJournalLine = function (t) {
        return this._journalPointer;
      };

      /**
       * @param float t
       */
      _myTrait_.getJournalRange = function (t) {
        return [0, this._journal.length];
      };

      /**
       * @param float t
       */
      _myTrait_.getLocalJournal = function (t) {
        return this._journal;
      };

      if (_myTrait_.__traitInit && !_myTrait_.hasOwnProperty('__traitInit')) _myTrait_.__traitInit = _myTrait_.__traitInit.slice();
      if (!_myTrait_.__traitInit) _myTrait_.__traitInit = [];
      _myTrait_.__traitInit.push(function (t) {
        if (!_listeners) {
          _listeners = {};
          _execInfo = {};
          _settings = {};
          _hotObjs = {};
        }

        if (!_cmds) {

          if (!_dmp) {
            if (typeof diff_match_patch != 'undefined') {
              _dmp = new diff_match_patch();
            } else {
              // if in node.js try to require the module
              if (typeof require != 'undefined') {
                var DiffMatchPatch = require('diff-match-patch');
                _dmp = new DiffMatchPatch();
              }
            }
          }

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
          _cmds[14] = this._cmd_diffPatch;

          _reverseCmds[1] = this._reverse_createObject;
          _reverseCmds[2] = this._reverse_createArray;
          _reverseCmds[3] = this._reverse_setMeta;
          _reverseCmds[4] = this._reverse_setProperty;
          _reverseCmds[5] = this._reverse_setPropertyObject;
          _reverseCmds[7] = this._reverse_pushToArray;
          _reverseCmds[8] = this._reverse_removeObject;
          _reverseCmds[10] = this._reverse_unsetProperty;
          _reverseCmds[12] = this._reverse_moveToIndex;
          _reverseCmds[13] = this._reverse_aceCmd;
          _reverseCmds[14] = this._reverse_diffPatch;
          // _reverse_setPropertyObject

          var me = this;
          later().every(0.5, function () {
            me._updateHotBuffer();
          });
        }
      });

      /**
       * Moves the journal pointer to specified line, also executes the commands along the way.
       * @param int index  - Journal line to move to
       */
      _myTrait_.moveToLine = function (index) {
        return this.reverseToLine(parseInt(index));
      };

      /**
       * @param float options
       */
      _myTrait_.playback = function (options) {

        // NOTE: playback requires later() library to work

        options = options || {};
        var deferMe = _promise();

        var firstMs = this._journal[0][5];
        if (!firstMs) {
          console.error('journal does not have timestamps');
          return;
        }

        var maxDelay = options.ms || 2000; // max delay on the playback, if the ms loop has some delays

        // then start the playback using the current journal buffer
        var journal;
        if (options.journal) {
          journal = options.journal;
        } else {
          journal = this._journal.slice();
        }
        var journalLen = journal.length;

        // starting from beginning may change in the future
        this.reverseToLine(0); // start from the beginning :)

        var msStart = new Date().getTime();

        var journal_index = 0,
            me = this,
            baseMs = firstMs;

        var rCnt = 0;

        var frameFn = function frameFn() {

          var msNow = new Date().getTime();
          var delta = msNow - msStart; // <- time elapsed from beginng
          var len = journalLen;
          var lastCmdTime;

          for (var i = journal_index; i < len;) {

            var jTime = journal[i][5],
                // ms,
            jDelta = jTime - baseMs;

            if (lastCmdTime && jTime - lastCmdTime > maxDelay) {
              // if there is a long delay in the stream, we move the virtual starting
              // point of the "stream time" relative to the elapsed time now
              var newStartTime = jTime - delta - parseInt(maxDelay / 2);
              baseMs = newStartTime;
              jDelta = jTime - baseMs;
            }
            // console.log(jTime, msNow, jDelta, delta);
            // test if the command should have been executd
            if (jDelta < delta) {
              // then should be executed
              try {
                me.redo(1, journal);
              } catch (e) {
                console.error(e);
              }
              rCnt++;
              // console.log("doing redo");
            } else {
              break;
            }

            i++;
            lastCmdTime = jTime;
          }
          journal_index = i;
          if (journal_index == len) {
            later().removeFrameFn(frameFn);
            me._journal = journal;
            me._playBackOnFn = null;
            deferMe.resolve(true);
          }
        };
        this._playBackOnFn = frameFn;
        later().onFrame(frameFn);
        return deferMe;
      };

      /**
       * @param float n
       * @param float journal
       */
      _myTrait_.redo = function (n, journal) {
        // if one line in buffer line == 1
        var line = this.getJournalLine();
        n = n || 1;
        while (n-- > 0) {

          var cmd;
          if (journal) {
            cmd = journal[line];
          } else {
            cmd = this._journal[line];
          }
          if (!cmd) return;

          var res = this.execCmd(cmd, false, true);
          if (res !== true) {
            console.error(res);
          }
          line++;
          this._journalPointer++;
        }
      };

      /**
       * @param float options
       */
      _myTrait_.redoStep = function (options) {
        options = options || {};
        var pulseMs = options.ms || 400;

        var idx = this.getJournalLine();

        if (!this._journal[idx]) return;

        var firstMs = this._journal[idx][5];
        var stepCnt = 0;

        // stepping the problem forward...
        while (this._journal[idx]) {
          var ms = this._journal[idx][5];
          var diff = Math.abs(ms - firstMs);
          if (diff > pulseMs) break;
          idx++;
          stepCnt++;
        }

        if (stepCnt > 0) this.redo(stepCnt);
      };

      /**
       * This function reverses a given command. There may be cases when the command parameters make the command itself non-reversable. It is the responsibility of the framework to make sure all commands remain reversable.
       * @param float a
       */
      _myTrait_.reverseCmd = function (a) {
        if (!a) {
          return;
        }
        var c = _reverseCmds[a[0]];
        if (c) {
          var rv = c.apply(this, [a]);
          return rv;
        }
      };

      /**
       * @param int n
       */
      _myTrait_.reverseNLines = function (n) {
        // if one line in buffer line == 1
        var line = this.getJournalLine();

        while (line - 1 >= 0 && n-- > 0) {
          var cmd = this._journal[line - 1];
          this.reverseCmd(cmd);
          line--;
          this._journalPointer--;
        }
      };

      /**
       * 0 = reverse all commands, 1 = reverse to the first line etc.
       * @param int index
       */
      _myTrait_.reverseToLine = function (index) {
        // if one line in buffer line == 1
        var line = this.getJournalLine();
        var jLen = this._journal.length;

        if (index < 0 || index > jLen) return;
        if (index == line) return;

        // direction of cmd buffer iteration
        var step = -1;
        if (index > line) {
          step = 1;
        }

        var i = line,
            cmdJournal = this._journal.slice();

        while (i >= 0 && i <= jLen) {
          if (index == i) return;
          if (step < 0 && i > 0) {
            var cmd = cmdJournal[i - 1];
          } else {
            var cmd = cmdJournal[i];
          }
          if (!cmd) break;

          i = i + step;
          if (i < 0 || i > jLen) break;

          if (step > 0) {
            var res = this.execCmd(cmd, false, true);
          } else {
            this.reverseCmd(cmd);
          }
          this._journalPointer = i;
        }

        // old reverse without directions
        /*
        while( ( line - 1 )  >= 0 &&  line > ( index  ) ) {
        var cmd = this._journal[line-1];
         this.reverseCmd( cmd );
        line--;
        this._journalPointer--;
        }
        */
      };

      /**
       * In case we are running update from server set this flag to true to enable crearing the object in case an existing object is asked to be created.
       * @param Boolean bClear  - If new object is created, should it clear the object
       */
      _myTrait_.setClearCreated = function (bClear) {
        _clearCreated = bClear;
      };

      /**
       * Hotbuffer delay in ms. The property sets will be throttled by this amount.
       * @param float t
       */
      _myTrait_.setHotMs = function (t) {
        _settings.hotMs = t;
      };

      /**
       * @param int n
       */
      _myTrait_.undo = function (n) {

        if (n === 0) return;
        if (typeof n == 'undefined') n = 1;

        this.reverseNLines(n);
      };

      /**
       * @param Object options
       */
      _myTrait_.undoStep = function (options) {

        options = options || {};
        var pulseMs = options.ms || 400;

        var idx = this.getJournalLine();
        // var idx = this._journal.length;
        if (idx == 0) return;

        var firstMs = this._journal[idx - 1][5];
        var stepCnt = 0;

        // stepping the problem forward...
        while (idx - 1 >= 0) {
          var ms = this._journal[idx - 1][5];
          var diff = Math.abs(ms - firstMs);
          if (diff > pulseMs) break;
          idx--;
          stepCnt++;
        }

        if (stepCnt > 0) this.undo(stepCnt);
      };

      /**
       * @param float t
       */
      _myTrait_.writeCommand = function (t) {};

      /**
       * @param Array cmd
       */
      _myTrait_.writeLocalJournal = function (cmd) {

        if (this._journal) {

          // truncate on write if length > journalPointer

          if (this._journal.length > this._journalPointer) {
            this._journal.length = this._journalPointer;
          }

          if (!cmd[5]) cmd[5] = new Date().getTime();

          this._journal.push(cmd);
          this._journalPointer++;
        }
      };
    })(this);

    (function (_myTrait_) {
      var _hooks;

      // Initialize static variables here...

      /**
       * @param String name  - Name of the hook to call
       * @param Object params  - Object to send as params
       */
      _myTrait_.callHook = function (name, params) {
        if (_hooks && _hooks[name]) {
          var list = _hooks[name];
          for (var i = 0; i < list.length; i++) {
            list[i](params);
          }
        }
      };

      /**
       * @param String name
       */
      _myTrait_.hasHook = function (name) {
        if (_hooks && _hooks[name]) {
          return _hooks[name].length;
        }
      };

      /**
       * @param String name  - Name of the hook to remove
       * @param float fn
       */
      _myTrait_.removeHook = function (name, fn) {
        if (!_hooks) return;
        if (!_hooks[name]) return;

        var i = _hooks[name].indexOf(fn);

        if (i >= 0) _hooks[name].splice(i, 1);
      };

      /**
       * Sets a command hook on the object
       * @param float name
       * @param float fn
       */
      _myTrait_.setHook = function (name, fn) {

        if (!_hooks) _hooks = {};
        if (!_hooks[name]) _hooks[name] = [];

        _hooks[name].push(fn);
      };
    })(this);

    (function (_myTrait_) {
      var _instanceCache;
      var _workerCmds;

      // Initialize static variables here...

      /**
       * @param float data
       */
      _myTrait_._addToCache = function (data) {

        if (data && data.__id) {
          this._objectHash[data.__id] = data;
        }
      };

      if (!_myTrait_.hasOwnProperty('__factoryClass')) _myTrait_.__factoryClass = [];
      _myTrait_.__factoryClass.push(function (id) {

        if (!_instanceCache) _instanceCache = {};

        if (_instanceCache[id]) return _instanceCache[id];

        _instanceCache[id] = this;
      });

      /**
       * In the future can be used to initiate events, if required.
       * @param float cmd
       * @param String UUID1
       * @param String UUID2
       */
      _myTrait_._cmd = function (cmd, UUID1, UUID2) {

        var cmdIndex = cmd[0],
            UUID = cmd[4];

        this._wCmd(cmdIndex, UUID, cmd);

        if (UUID2 && UUID2 != UUID) this._wCmd(cmdIndex, UUID2, cmd);

        // -- create commands for parent elements about the changes --
        // var obj = this._find( a[4] ),

        this._parentCmd(UUID, cmd);
      };

      /**
       * @param float obj
       * @param float parentObj
       * @param float intoList
       */
      _myTrait_._createModelCommands = function (obj, parentObj, intoList) {

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

        if (!intoList) intoList = [];

        var data;

        if (obj.data && obj.__id) {
          data = obj.data;
        } else {
          data = obj;
        }

        if (this.isObject(data) || this.isArray(data)) {

          var newObj;

          if (obj.__id) {
            newObj = obj;
          } else {
            newObj = {
              data: data,
              __id: this.guid()
            };
          }

          if (this.isArray(data)) {
            var cmd = [2, newObj.__id, [], null, newObj.__id];
          } else {
            var cmd = [1, newObj.__id, {}, null, newObj.__id];
          }
          if (parentObj) {
            newObj.__p = parentObj.__id;
            // this._moveCmdListToParent( newObj );
          }
          intoList.push(cmd);

          // Then, check for the member variables...
          for (var n in data) {
            if (data.hasOwnProperty(n)) {
              var value = data[n];
              if (this.isObject(value) || this.isArray(value)) {
                // Then create a new...
                var oo = this._createModelCommands(value, newObj, intoList);
                var cmd = [5, n, oo.__id, null, newObj.__id];
                intoList.push(cmd);
              } else {
                var cmd = [4, n, value, null, newObj.__id];
                intoList.push(cmd);
              }
            }
          }

          return newObj;
        } else {}

        /*
        var newObj = {
        data : data,
        __id : this.guid()
        }
        */
      };

      /**
       * @param Object data
       * @param float parentObj
       */
      _myTrait_._createNewModel = function (data, parentObj) {

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

        if (this.isObject(data) || this.isArray(data)) {

          var newObj = {
            data: data,
            __id: this.guid()
          };

          this._objectHash[newObj.__id] = newObj;

          if (this.isArray(data)) {
            var cmd = [2, newObj.__id, [], null, newObj.__id];
          } else {
            var cmd = [1, newObj.__id, {}, null, newObj.__id];
          }

          if (parentObj) {
            newObj.__p = parentObj.__id;
            // this._moveCmdListToParent( newObj );
          }
          this.writeCommand(cmd, newObj);

          // Then, check for the member variables...
          for (var n in data) {
            if (data.hasOwnProperty(n)) {
              var value = data[n];
              if (this.isObject(value) || this.isArray(value)) {
                // Then create a new...
                var oo = this._createNewModel(value, newObj);
                newObj.data[n] = oo;
                var cmd = [5, n, oo.__id, null, newObj.__id];
                this.writeCommand(cmd, newObj);
                this._moveCmdListToParent(oo);
              } else {
                var cmd = [4, n, value, null, newObj.__id];
                this.writeCommand(cmd, newObj);
              }
            }
          }

          return newObj;
        } else {}

        /*
        var newObj = {
        data : data,
        __id : this.guid()
        }
        */
      };

      /**
       * @param float id
       */
      _myTrait_._find = function (id) {
        var o = this._objectHash[id];
        if (o) return o;
        return this._removedHash[id];
      };

      /**
       * @param float data
       * @param float parentId
       * @param float whenReady
       */
      _myTrait_._findObjects = function (data, parentId, whenReady) {

        if (!data) return null;

        if (!this.isObject(data)) return data;

        data = this._wrapData(data);
        if (data.__id) {
          this._objectHash[data.__id] = data;
        }

        var me = this;
        if (parentId) {
          data.__p = parentId;
        }
        if (data.data) {
          var sub = data.data;
          for (var n in sub) {
            if (sub.hasOwnProperty(n)) {
              var p = sub[n];
              if (this.isObject(p)) {
                var newData = this._findObjects(p, data.__id);
                if (newData !== p) {
                  data.data[n] = newData;
                }
              }
            }
          }
        }
        return data;
      };

      /**
       * @param float t
       */
      _myTrait_._getObjectHash = function (t) {
        return this._objectHash;
      };

      /**
       * @param float t
       */
      _myTrait_._getRemovedHash = function (t) {
        return this._removedHash;
      };

      /**
       * @param String UUID
       * @param float cmd
       * @param float parent
       */
      _myTrait_._parentCmd = function (UUID, cmd, parent) {

        var obj = this._find(UUID);

        if (obj) {
          this._wCmd(42, UUID, cmd);
          if (obj.__p) {
            if (!parent) parent = this._find(obj.__p);
            if (parent) {
              this._parentCmd(obj.__p, cmd, parent);
            }
          }
        }
      };

      /**
       * @param Object data
       */
      _myTrait_._prepareData = function (data) {
        var d = this._wrapData(data);
        if (!this._objectHash[d.__id]) {
          d = this._findObjects(d);
        }
        return d;
      };

      /**
       * @param int cmdIndex
       * @param float UUID
       * @param float cmd
       */
      _myTrait_._wCmd = function (cmdIndex, UUID, cmd) {

        if (!this._workers[cmdIndex]) return;
        if (!this._workers[cmdIndex][UUID]) return;

        var workers = this._workers[cmdIndex][UUID];
        var me = this;

        var propFilter = cmd[1];
        var allProps = workers['*'],
            thisProp = workers[propFilter];

        if (allProps) {
          allProps.forEach(function (w) {
            var id = w[0],
                options = w[1];
            var worker = _workerCmds[id];
            if (worker) {
              worker(cmd, options);
            }
          });
        }
        if (thisProp) {
          thisProp.forEach(function (w) {
            var id = w[0],
                options = w[1];
            var worker = _workerCmds[id];
            if (worker) {
              worker(cmd, options);
            }
          });
        }
      };

      /**
       * @param float data
       * @param float parent
       */
      _myTrait_._wrapData = function (data, parent) {

        // if instance of this object...
        if (data && data._wrapData) {
          // we can use the same pointer to this data
          return data._data;
        }

        // if the data is "well formed"
        if (data.__id && data.data) return data;

        // if new data, then we must create a new object and return it

        var newObj = this._createNewModel(data);
        /*
        var newObj = {
        data : data,
        __id : this.guid()
        }
        */
        return newObj;
      };

      /**
       * @param string workerID
       * @param Array cmdFilter
       * @param Object workerOptions
       */
      _myTrait_.createWorker = function (workerID, cmdFilter, workerOptions) {

        // cmdFilter could be something like this:
        // [ 4, 'x', null, null, 'GUID' ]
        // [ 8, null, null, null, 'GUID' ]

        var cmdIndex = cmdFilter[0],
            UUID = cmdFilter[4];

        if (!this._workers[cmdIndex]) {
          this._workers[cmdIndex] = {};
        }

        if (!this._workers[cmdIndex][UUID]) this._workers[cmdIndex][UUID] = {};

        var workers = this._workers[cmdIndex][UUID];

        var propFilter = cmdFilter[1];
        if (!propFilter) propFilter = '*';

        if (!workers[propFilter]) workers[propFilter] = [];

        workers[propFilter].push([workerID, workerOptions]);

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
      };

      /**
       * @param float t
       */
      _myTrait_.getData = function (t) {
        return this._data;
      };

      /**
       * @param float item
       */
      _myTrait_.indexOf = function (item) {

        if (!item) item = this._data;

        if (!this.isObject(item)) {
          item = this._find(item);
        }
        if (!item) return;

        var parent = this._find(item.__p);

        if (!parent) return;
        if (!this.isArray(parent.data)) return;

        return parent.data.indexOf(item);
      };

      if (_myTrait_.__traitInit && !_myTrait_.hasOwnProperty('__traitInit')) _myTrait_.__traitInit = _myTrait_.__traitInit.slice();
      if (!_myTrait_.__traitInit) _myTrait_.__traitInit = [];
      _myTrait_.__traitInit.push(function (channelId, mainData, journalCmds) {

        // if no mainData defined, exit immediately
        if (!mainData) return;
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
        if (!this._objectHash) {
          this._objectHash = {};
          this._removedHash = {};
        }

        var me = this;
        this._channelId = channelId;
        this._data = mainData;
        this._workers = {};
        this._journal = journalCmds || [];
        this._journalPointer = this._journal.length;

        var newData = this._findObjects(mainData);
        if (newData != mainData) this._data = newData;

        if (!this._data.__orphan) {
          this._data.__orphan = [];
        }

        // Then, the journal commands should be run on the object

        if (journalCmds && this.isArray(journalCmds)) {
          journalCmds.forEach(function (c) {
            me.execCmd(c, true);
          });
        }
      });

      /**
       * Notice that all channels are using the same commands.
       * @param Object cmdObject
       */
      _myTrait_.setWorkerCommands = function (cmdObject) {

        if (!_workerCmds) _workerCmds = {};

        for (var i in cmdObject) {
          if (cmdObject.hasOwnProperty(i)) {
            _workerCmds[i] = cmdObject[i];
          }
        }
        // _workerCmds
      };

      /**
       * @param float obj
       * @param float recursive
       */
      _myTrait_.toPlainData = function (obj, recursive) {

        if (typeof obj == 'undefined') {
          if (recursive) return obj;
          return obj = this._data;
        }

        if (this.isFunction(obj) || typeof obj == 'function') {
          return;
        }
        if (!this.isObject(obj)) return obj;

        var plain;

        if (this.isArray(obj.data)) {
          plain = [];
          var len = obj.data.length;
          for (var i = 0; i < len; i++) {
            plain[i] = this.toPlainData(obj.data[i], true);
          }
        } else {
          plain = {};
          for (var n in obj.data) {
            if (obj.data.hasOwnProperty(n)) {
              plain[n] = this.toPlainData(obj.data[n], true);
            }
          }
        }

        return plain;
      };
    })(this);
  };

  var _channelData = function _channelData(a, b, c, d, e, f, g, h) {
    var m = this,
        res;
    if (m instanceof _channelData) {
      var args = [a, b, c, d, e, f, g, h];
      if (m.__factoryClass) {
        m.__factoryClass.forEach(function (initF) {
          res = initF.apply(m, args);
        });
        if (typeof res == 'function') {
          if (res._classInfo.name != _channelData._classInfo.name) return new res(a, b, c, d, e, f, g, h);
        } else {
          if (res) return res;
        }
      }
      if (m.__traitInit) {
        m.__traitInit.forEach(function (initF) {
          initF.apply(m, args);
        });
      } else {
        if (typeof m.init == 'function') m.init.apply(m, args);
      }
    } else return new _channelData(a, b, c, d, e, f, g, h);
  };

  _channelData._classInfo = {
    name: '_channelData'
  };
  _channelData.prototype = new _channelData_prototype();

  (function () {
    if (typeof define !== 'undefined' && define !== null && define.amd != null) {
      __amdDefs__['_channelData'] = _channelData;
      this._channelData = _channelData;
    } else if (typeof module !== 'undefined' && module !== null && module.exports != null) {
      module.exports['_channelData'] = _channelData;
    } else {
      this._channelData = _channelData;
    }
  }).call(new Function('return this')());

  var channelObjects_prototype = function channelObjects_prototype() {

    (function (_myTrait_) {

      // Initialize static variables here...

      if (_myTrait_.__traitInit && !_myTrait_.hasOwnProperty('__traitInit')) _myTrait_.__traitInit = _myTrait_.__traitInit.slice();
      if (!_myTrait_.__traitInit) _myTrait_.__traitInit = [];
      _myTrait_.__traitInit.push(function (options) {});
    })(this);
  };

  var channelObjects = function channelObjects(a, b, c, d, e, f, g, h) {
    var m = this,
        res;
    if (m instanceof channelObjects) {
      var args = [a, b, c, d, e, f, g, h];
      if (m.__factoryClass) {
        m.__factoryClass.forEach(function (initF) {
          res = initF.apply(m, args);
        });
        if (typeof res == 'function') {
          if (res._classInfo.name != channelObjects._classInfo.name) return new res(a, b, c, d, e, f, g, h);
        } else {
          if (res) return res;
        }
      }
      if (m.__traitInit) {
        m.__traitInit.forEach(function (initF) {
          initF.apply(m, args);
        });
      } else {
        if (typeof m.init == 'function') m.init.apply(m, args);
      }
    } else return new channelObjects(a, b, c, d, e, f, g, h);
  };

  channelObjects._classInfo = {
    name: 'channelObjects'
  };
  channelObjects.prototype = new channelObjects_prototype();

  var channelClient_prototype = function channelClient_prototype() {

    (function (_myTrait_) {

      // Initialize static variables here...

      /**
       * @param float t
       */
      _myTrait_.guid = function (t) {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      };

      /**
       * @param float t
       */
      _myTrait_.isArray = function (t) {
        return t instanceof Array;
      };

      /**
       * @param float fn
       */
      _myTrait_.isFunction = function (fn) {
        return Object.prototype.toString.call(fn) == '[object Function]';
      };

      /**
       * @param float t
       */
      _myTrait_.isObject = function (t) {
        return t === Object(t);
      };
    })(this);

    (function (_myTrait_) {
      var _cmdNsMap;

      // Initialize static variables here...

      /**
       * @param float url
       */
      _myTrait_._getNsFromUrl = function (url) {
        if (_nsShortcuts[url]) {
          return _nsShortcuts[url];
        }
        _nsReverse[_nsIndex] = url;
        _nsShortcuts[url] = _nsIndex++;

        return _nsShortcuts[url];
      };

      /**
       * @param float nsName
       */
      _myTrait_._getNsShorthand = function (nsName) {

        if (_nsShortcuts[nsName]) {
          return _nsShortcuts[nsName];
        }
        _nsReverse[_nsIndex] = nsName;
        _nsShortcuts[nsName] = _nsIndex++;

        return _nsShortcuts[nsName];
      };

      /**
       * @param float t
       */
      _myTrait_._getReflections = function (t) {
        return _localReflections;
      };

      /**
       * @param float objId
       */
      _myTrait_._getReflectionsFor = function (objId) {

        if (_localReflections) {
          var list = _localReflections[objId];
          if (list) return list;
        }
        return [];
      };

      /**
       * @param int index
       */
      _myTrait_._getReverseNs = function (index) {

        return _nsReverse[index];
      };

      /**
       * @param float id
       */
      _myTrait_._idFromNs = function (id) {
        if (id) {

          var len = id.length;
          if (id[len - 1] == '#') {
            id = id.split('@').shift();
          }
        }
        return id;
      };

      /**
       * @param float id
       * @param float ns
       */
      _myTrait_._idToNs = function (id, ns) {

        if (id) {
          var len = id.length;
          // longString

          if (id[len - 1] == '#') {
            var ind = id.indexOf('@');
            var oldNs = id.substring(ind + 1, len - 1);
            if (oldNs != ns) {
              id = id.substring(0, ind) + '@' + ns + '#';
            }
          } else {
            id = id + '@' + ns + '#';
          }
        }
        return id;
      };

      /**
       * @param float id
       */
      _myTrait_._nsFromId = function (id) {
        var ns;
        if (id) {
          id = id + '';
          var len = id.length;
          if (id[len - 1] == '#') {
            ns = id.split('@').pop();
            ns = ns.split('#').shift();
          }
        }
        return ns;
      };

      /**
       * @param float cmd
       * @param float ns
       */
      _myTrait_._transformCmdFromNs = function (cmd, ns) {

        if (!ns) ns = this._ns;

        var map = _cmdNsMap,
            nextCmd = cmd.slice(),
            swap = map[cmd[0]],
            me = this;
        if (swap) {
          swap.forEach(function (index) {
            nextCmd[index] = me._idFromNs(nextCmd[index], ns);
          });
        }
        return nextCmd;
      };

      /**
       * @param float cmd
       * @param float ns
       */
      _myTrait_._transformCmdToNs = function (cmd, ns) {

        if (!ns) ns = this._ns;

        var map = _cmdNsMap,
            nextCmd = cmd.slice(),
            swap = map[cmd[0]],
            me = this;
        if (swap) {
          for (var i = 0; i < swap.length; i++) {
            var index = swap[i];
            nextCmd[index] = this._idToNs(nextCmd[index], ns);
          }
        }
        return nextCmd;
      };

      /**
       * @param float obj
       * @param float ns
       */
      _myTrait_._transformObjFromNs = function (obj, ns) {
        if (!ns) ns = this._ns;

        if (obj && obj.__id) {
          if (obj.__p) obj.__p = this._idFromNs(obj.__p, ns);
          obj.__id = this._idFromNs(obj.__id, ns);
          for (var n in obj.data) {
            if (obj.data.hasOwnProperty(n)) {
              if (this.isObject(obj.data[n])) this._transformObjFromNs(obj.data[n], ns);
            }
          }
        }
        return obj;
      };

      /**
       * @param float obj
       * @param float ns
       */
      _myTrait_._transformObjToNs = function (obj, ns) {
        if (!ns) ns = this._ns;
        if (obj && obj.__id) {

          // the old way, currently the socket ID may be the same, but not used right now
          /*
          var nsNext;
          if(obj.__radioURL) {
          var nsNext = this._getNsShorthand( obj.__radioURL );
          }
          ns = nsNext || ns;
          */

          // obj = me._transformObjToNs( obj, ns );
          obj.__id = this._idToNs(obj.__id, ns);
          if (obj.__p) {
            obj.__p = this._idToNs(obj.__p, ns);
          }
          for (var n in obj.data) {
            if (obj.data.hasOwnProperty(n)) {
              if (this.isObject(obj.data[n])) this._transformObjToNs(obj.data[n], ns);
            }
          }
        }

        return obj;
      };

      /**
       * @param float obj
       * @param float parentObj
       * @param float parentObj2
       */
      _myTrait_._transformToNsBeforeInsert = function (obj, parentObj, parentObj2) {

        // OK, so...

        var cmdList = obj.__ctxCmdList;
        var ns = this._nsFromId(parentObj.__id);

        console.log(' _transformToNsBeforeInsert ');

        var me = this;
        if (ns) {
          // console.log("Using namespace "+ns);
          if (cmdList) {
            cmdList.forEach(function (c) {
              c.cmd = me._transformCmdToNs(c.cmd, ns);
            });
          }
          obj = me._transformObjToNs(obj, ns);
          obj.__ctxCmdList = cmdList;
          this._addToCache(obj);
          return obj;
        }
        // this._addToCache( obj );
        return obj;
      };

      if (_myTrait_.__traitInit && !_myTrait_.hasOwnProperty('__traitInit')) _myTrait_.__traitInit = _myTrait_.__traitInit.slice();
      if (!_myTrait_.__traitInit) _myTrait_.__traitInit = [];
      _myTrait_.__traitInit.push(function (t) {
        if (!_cmdNsMap) {
          _cmdNsMap = {
            1: [1],
            2: [1],
            4: [4],
            5: [2, 4],
            7: [2, 4],
            8: [2, 4],
            10: [2, 4],
            12: [1, 4],
            13: [4],
            14: [4],
            16: [3, 4]
          };
        }
      });
    })(this);

    (function (_myTrait_) {
      var _instanceCache;
      var _dmp;

      // Initialize static variables here...

      /**
       * @param float channelId
       */
      _myTrait_._checkout = function (channelId) {

        var me = this,
            socket = this._socket;

        return _promise(function (result) {

          if (!me._policy) return;
          if (me._disconnected) return; // in case disconnected, don't send data
          if (!me._connected) return;

          socket.send('channelCommand', {
            channelId: channelId,
            cmd: 'checkout',
            data: ''
          }).then(function (res) {

            debugger;
            console.log('Checkout tree ');
            console.log(res);
            result(res);
          });
        });
      };

      if (!_myTrait_.hasOwnProperty('__factoryClass')) _myTrait_.__factoryClass = [];
      _myTrait_.__factoryClass.push(function (id, socket) {

        if (!id || !socket) return;

        id = id + socket.getId();

        if (!_instanceCache) _instanceCache = {};
        if (_instanceCache[id]) return _instanceCache[id];
        _instanceCache[id] = this;
      });

      /**
       * @param float t
       */
      _myTrait_._createTransaction = function (t) {

        // package to be sent to the server
        this._currentFrame = {
          id: this.guid(),
          version: 1,
          from: this._data.getJournalLine(),
          fail_tolastok: true,
          commands: []
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
      };

      /**
       * @param float id
       */
      _myTrait_._fetch = function (id) {
        var ns_id = this._idToNs(id, this._ns); // is this too slow?
        var obj = this._data._find(ns_id);
        if (obj) {
          return obj;
        }
      };

      /**
       * This is the beef of almost everything, when a new frame comes around, what to do with it? There are many options what to do, we just have to pick one strategy.
       * @param float socket
       * @param float myNamespace
       */
      _myTrait_._incoming = function (socket, myNamespace) {

        var me = this,
            channelId = this._channelId,
            fullUpgradeFailCnt = 0;

        socket.on('upgrade_' + this._channelId, function (cmd) {

          me._upgradePending = false;
          // just don't accept any msgs
          if (me._disconnected) return;
          //console.log("upgrade_cmd");
          //console.log(JSON.stringify(cmd));
          if (cmd) {

            if (cmd.partial) {

              // should be reversing perhaps first to some line...
              var dd = me._clientState.data;

              dd.reverseToLine(cmd.partialFrom);
              // console.log("--- refreshing the partials, reversed to line --- ", cmd.partialFrom);
              var errCnt = 0;

              dd.setClearCreated(true);
              cmd.partial.forEach(function (c) {
                if (errCnt > 0) return;
                var r;
                var cmdIn = me._transformCmdToNs(c);
                if (!((r = dd.execCmd(cmdIn, true)) === true)) {
                  // console.error("Partial ", r);
                  errCnt++;
                }
              });
              dd.setClearCreated(false);

              if (errCnt == 0) {
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
            if (cmd.data) {

              // full upgrade coming here, must also replace the journal

              var myData = me._clientState.data.getData(); // <- the data
              me._transformObjToNs(cmd.data);

              var diff = diffEngine().compareFiles(myData, cmd.data);
              console.log('Diff obj , myData, cmd.data');
              console.log(diff);
              console.log(myData);
              console.log(cmd.data);

              // run the commands for the local data
              var dd = me._clientState.data;
              var errCnt = 0;

              dd.setClearCreated(true);
              diff.cmds.forEach(function (c) {
                console.log('Diff cmd ', c);
                if (errCnt > 0) return;
                var r;
                /// dd.execCmd(c, true); // the point is just to change the data to something else
                if (!((r = dd.execCmd(c, true)) === true)) {
                  console.error('Full error ', r);
                  console.log('Return value from failed cmd: ', r);
                  errCnt++;
                }
              });
              dd.setClearCreated(false);

              // and now the hard part, upgrade the local client data.
              if (errCnt == 0) {

                me._clientState.needsRefresh = false;
                me._clientState.needsFullRefresh = false;

                console.log('** full update should have gone ok ** ');
                dd._journal.length = 0;
                dd._journal.push.apply(dd._journal, cmd.journal);
                me._clientState.needsRefresh = false;
                me._clientState.version = cmd.version;

                // dd._journal.length = cmd.updateEnds;

                me._clientState.last_update[0] = 0;
                me._clientState.last_update[1] = dd._journal.length;
                me._clientState.last_sent[0] = 0;
                me._clientState.last_sent[1] = dd._journal.length;

                console.log('Version ', me._clientState.version);
              } else {
                fullUpgradeFailCnt++;

                // must stop full refresh at this point
                console.error('** errors with the full update ** ');
                if (fullUpgradeFailCnt > 0) {
                  console.log('--- server command data ---');
                  console.log(cmd);
                  console.log('--- the client state ---');
                  console.log(me._clientState);
                  me._clientState.needsFullRefresh = false;
                } else {
                  me._clientState.needsFullRefresh = true;
                  me._clientState.fullUpgradeFailCnt = fullUpgradeFailCnt;
                }

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

            if (me._slaveController) {
              me._slaveController._execCmd({
                cmd: 'masterJournalUpgrade',
                data: cmd
              });
            }
          }
        });

        socket.on('s2c_' + this._channelId, function (cmd) {

          // just don't accept any msgs
          if (me._disconnected) return;
          if (cmd) {

            var res = me._policy.deltaServerToClient(cmd, me._clientState);

            // if there is a slave controller, send this command as masterUpgrade to
            // the slave server so that the slave can update it's own data state
            if (me._slaveController) {

              // --> then try slave to master command building...

              var newList = [];
              for (var i = 0; i < cmd.c.length; i++) {
                var c = cmd.c[i].slice();
                newList.push(me._transformCmdFromNs(c));
              }

              cmd.c = newList;
              me._slaveController._execCmd({
                cmd: 'masterUpgrade',
                data: cmd
              });
            }
          }
        });
      };

      /**
       * @param float t
       */
      _myTrait_._isNodeJs = function (t) {
        return new Function('try { return this === global; } catch(e) { return false; }')();
      };

      /**
       * @param Object socket
       */
      _myTrait_._onFrameLoop = function (socket) {

        var me = this,
            channelId = this._channelId;

        var _frameFn = function _frameFn() {

          if (!me._policy) return;
          if (me._disconnected) return; // in case disconnected, don't send data

          if (!me._connected) return;
          if (!me._clientState) return;

          if (me._clientState.needsRefresh) {
            // *** if refresh is required, out of sync client **

            if (!me._upgradePending) {
              // console.log(" needsRefresh && !_upgradePending " );
              me.askUpgrade(me._clientState.needsFullRefresh);
            }
            me._upgradePending = true;
          }

          var packet = me._policy.constructClientToServer(me._clientState);
          if (packet) {

            //console.log("Sending packet to server ");
            //console.log(packet);
            socket.send('channelCommand', {
              channelId: channelId,
              cmd: 'c2s',
              data: packet
            }).then(function (res) {
              if (res && res.errors) {
                // console.error(res.errors);
                if (res.errors.length > 0) {
                  var bRefresh = false;
                  res.errors.forEach(function (err) {
                    if (err.error == 44) {
                      bRefresh = true;
                    }
                  });
                  if (bRefresh) {
                    me._clientState.needsRefresh = true;
                  }
                }
              }
            });
          }
        };
        later().onFrame(_frameFn);
      };

      /**
       * Actions to do when the client reconnects to other server
       * @param float t
       */
      _myTrait_._onReconnect = function (t) {

        // do we have a slave connection???
        if (this._slave) {
          console.log('*** reconnect to the master ***');
        }

        var me = this;

        console.log('_onReconnect');

        // if we have a slave controller...
        if (me._slaveController) {
          console.log('_slaveController -> trying to send data ');
          me._slaveController._sendUnsentToMaster();
        }

        // first, send the data we have to server, hope it get's through...
        var packet = me._policy.constructClientToServer(me._clientState);
        var socket = this._socket;
        var channelId = this._channelId;

        if (packet) {
          socket.send('channelCommand', {
            channelId: channelId,
            cmd: 'c2s',
            data: packet
          }).then(function (res) {});
        }
        // then, ask upgrade...
        me.askUpgrade();

        // -->

        // me._sendUnsentToMaster();
      };

      /**
       * Add command to next change frame to be sent over the network. TODO: validate the commands against the own channelObject, for example the previous value etc.
       * @param Array cmd
       * @param float dontBroadcast
       */
      _myTrait_.addCommand = function (cmd, dontBroadcast) {
        var cmdIn = this._transformCmdToNs(cmd, this._ns);
        return this._data.execCmd(cmdIn, dontBroadcast);
      };

      /**
       * @param bool askFull
       */
      _myTrait_.askUpgrade = function (askFull) {

        if (!this._socket) return;

        // do not ask upgrade if failCnt > 0
        if (this._clientState.fullUpgradeFailCnt) return;

        this._socket.send('channelCommand', {
          channelId: this._channelId,
          cmd: 'upgradeRequest',
          data: {
            version: this._clientState.version,
            last_update: this._clientState.last_update,
            askFull: askFull
          }
        }).then(function () {});
      };

      /**
       * @param float id
       * @param float index
       */
      _myTrait_.at = function (id, index) {
        var ns_id = this._idToNs(id, this._ns); // is this too slow?
        var obj = this._data._find(ns_id);
        if (obj) {
          return obj.data[index];
        }
      };

      /**
       * @param float name
       * @param float description
       * @param float baseData
       */
      _myTrait_.createChannel = function (name, description, baseData) {

        if (this._isLocal) return;

        // a fresh copy of the base data
        var copyOf = JSON.parse(JSON.stringify(baseData));
        var chData = _channelData(this.guid(), copyOf, []);

        copyOf = chData.getData();
        copyOf = this._transformObjFromNs(copyOf);

        // The command to be sent to the server-side
        var forkCmd = {
          channelId: name,
          name: description,
          chData: copyOf
        };

        // the fork is being processed, the response is going to be ready after the promise completes
        var me = this;
        return _promise(function (results) {
          me._socket.send('channelCommand', {
            channelId: me._channelId,
            cmd: 'createChannel',
            data: forkCmd
          }).then(function (resp) {
            results(resp);
          });
        });
      };

      /**
       * @param float id
       * @param float name
       * @param float value
       */
      _myTrait_.diffSet = function (id, name, value) {

        if (!_dmp) return;

        var ns_id = this._idToNs(id, this._ns); // is this too slow?
        var obj = this._data._find(ns_id);
        if (obj && !this.isObject(value)) {
          var old_value = obj.data[name];
          if (old_value != value) {

            // this.addCommand([4, name, value, old_value, ns_id ]);
            var diff1 = _dmp.diff_main(old_value, value);
            var diff2 = _dmp.diff_main(value, old_value);

            _dmp.diff_cleanupEfficiency(diff1);
            _dmp.diff_cleanupEfficiency(diff2);

            var t1 = _dmp.patch_toText(_dmp.patch_make(old_value, diff1));
            var t2 = _dmp.patch_toText(_dmp.patch_make(value, diff2));

            this.addCommand([14, name, t1, t2, ns_id]);
          }
        }
      };

      /**
       * @param float t
       */
      _myTrait_.disconnect = function (t) {
        this._disconnected = true;
        return this;
      };

      /**
       * @param float name
       * @param float description
       * @param float options
       */
      _myTrait_.fork = function (name, description, options) {
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

        if (this._isLocal) return;

        // ==> OK, ready to send data forward...

        // What is the journal line we are using for the fork???
        var forkCmd = {
          version: this._channelStatus.version,
          channelId: name,
          name: description,
          journalLine: 1
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

        return _promise(function (results) {
          me._socket.send('channelCommand', {
            channelId: me._channelId,
            cmd: 'fork',
            data: forkCmd
          }).then(function (resp) {
            // information from the server.
            // build new channel object
            // return it as the promise...
            results(resp);
          });
        });
      };

      /**
       * @param Object change
       */
      _myTrait_.fromMaster = function (change) {
        console.log('from master', JSON.stringify(change));
      };

      /**
       * @param Object change
       */
      _myTrait_.fromSlave = function (change) {
        console.log('from slave', JSON.stringify(change));

        if (change.cmd == 's2c') {

          // --> we have server to client command coming in..
          // this is the connection to the master, thus the commands should be run
          // here as if they were "local" commands which are about to be sent to the
          // remote server
          /*
          return {
          cmd : "s2c",
          c : chData._journal.slice( start, end ),
          start : start,
          end : end,
          version : serverState.version
          };    
          */

          // this channelClient is only responsible of sending the commands to the
          // actual master server
          var me = this;
          change.c.forEach(function (eCmd) {
            console.log(eCmd);
            var r = me.addCommand(eCmd);
            console.log(JSON.stringify(r));
            console.log(JSON.stringify(me._data.getData()));
          });
        }
      };

      /**
       * @param string id
       * @param float name
       */
      _myTrait_.get = function (id, name) {
        var ns_id = this._idToNs(id, this._ns); // is this too slow?
        var obj = this._data._find(ns_id);
        if (obj) {
          return obj.data[name];
        }
      };

      /**
       * @param float t
       */
      _myTrait_.getChannelData = function (t) {
        return this._data;
      };

      /**
       * @param float t
       */
      _myTrait_.getData = function (t) {
        return this._data.getData();
      };

      /**
       * @param float id
       */
      _myTrait_.indexOf = function (id) {
        var ns_id = this._idToNs(id, this._ns); // is this too slow?
        var obj = this._data._find(ns_id);
        if (obj) {
          var parent = this._fetch(obj.__p);
          if (parent && parent.data) {
            var index = parent.data.indexOf(obj);
            return index;
          }
        }
        return -1;
      };

      if (_myTrait_.__traitInit && !_myTrait_.hasOwnProperty('__traitInit')) _myTrait_.__traitInit = _myTrait_.__traitInit.slice();
      if (!_myTrait_.__traitInit) _myTrait_.__traitInit = [];
      _myTrait_.__traitInit.push(function (channelId, socket, options) {

        if (!_dmp) {
          if (typeof diff_match_patch != 'undefined') {
            _dmp = new diff_match_patch();
          } else {
            // if in node.js try to require the module
            if (typeof require != 'undefined') {
              var DiffMatchPatch = require('diff-match-patch');
              _dmp = new DiffMatchPatch();
            }
          }
        }

        if (!this._policy) this._policy = _chPolicy();

        if (options && options.localChannel) {

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
          mainData = me._transformObjToNs(options.localData, myNamespace);

          var chData = _channelData(me._id, mainData, []);
          me._data = chData;
          me.resolve({
            result: true,
            channelId: channelId
          });
          return;
        } else {}

        if (!channelId || !socket) return;

        this._channelId = channelId;
        this._socket = socket;
        this._options = options;
        this._changeFrames = [];
        this._pendingFrames = [];

        var myNamespace = socket.getEnum();

        this._ns = myNamespace;

        this._id = channelId + socket.getId();
        var me = this;

        this._onFrameLoop(socket, myNamespace);
        this._incoming(socket, myNamespace);

        this._connCnt = 0;

        socket.on('disconnect', function () {
          me._connected = false;
        });
        socket.on('connect', function () {

          console.log('*** socket reconnect for ' + channelId + ' *** ');
          console.log('Connection count ' + me._connCnt);

          me._connCnt++;

          // Authenticate...
          if (options.auth) {
            socket.send('auth', {
              userId: options.auth.username,
              password: options.auth.password
            }).then(function (resp) {

              if (resp.userId) {

                me._userId = resp.userId;
                me._logged = true;
              } else {
                me._logged = false;
                return false;
              }
              // ask to join the channel with this socket...
              return socket.send('requestChannel', {
                channelId: channelId,
                initWithData: options.initWithData
              });
            }).then(function (resp) {
              // this channel client has been connected to the server ok
              if (resp && resp.channelId == channelId) {

                me._connected = true;
                // The next step: to load the channel information for the
                // local objects to consume

                if (me._connCnt > 1) {
                  // if reconnecting to the other server, ask upgrade only, not the whole
                  // build tree...
                  me._onReconnect();
                  return false;
                }

                return socket.send('channelCommand', {
                  channelId: channelId,
                  cmd: 'readBuildTree',
                  data: ''
                });
              } else {
                return false;
              }
            }).then(function (respData) {

              if (respData) {

                var resp = respData.build;

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
                mainData = me._transformObjToNs(mainData, myNamespace);

                var chData = _channelData(me._id, mainData, []);
                var list = resp.pop();

                // should be updating the client
                // var res = me._policy.deltaServerToClient( cmd, me._clientState);
                while (list) {
                  chData._journalPointer = 0;
                  chData._journal.length = 0; // <-- the journal length, last will be spared
                  list.forEach(function (c) {
                    chData.execCmd(me._transformCmdToNs(c, myNamespace), true);
                  });
                  list = resp.pop();
                }

                // the state management
                me._clientState = {
                  data: chData, // The channel data object
                  client: me, // The channel client object (for Namespace conversion )
                  needsRefresh: false, // true if client is out of sync and needs to reload
                  version: me._channelStatus.version,
                  last_update: [0, chData.getJournalLine()], // last succesfull server update
                  last_sent: [0, chData.getJournalLine()] // last range sent to the server

                };

                me._data = chData;
                me._createTransaction();
                me.resolve({
                  result: true,
                  channelId: channelId
                });
              } else {
                me.resolve({
                  result: false,
                  text: 'Authorization or connection failed'
                });
              }
            });
          }
        });
      });

      /**
       * @param float t
       */
      _myTrait_.isConnected = function (t) {
        if (this._disconnected) return false;
        if (this._connCnt && this._connected) return true;

        return false;
      };

      /**
       * @param float t
       */
      _myTrait_.isLocal = function (t) {
        return this._isLocal;
      };

      /**
       * @param float id
       */
      _myTrait_.length = function (id) {
        var ns_id = this._idToNs(id, this._ns); // is this too slow?
        var obj = this._data._find(ns_id);
        if (obj && obj.data) {
          return obj.data.length || 0;
        }
        return 0;
      };

      /**
       * @param float id
       */
      _myTrait_.moveDown = function (id) {
        var ns_id = this._idToNs(id, this._ns); // is this too slow?
        var obj = this._data._find(ns_id);
        if (obj) {
          var parent = this._fetch(obj.__p);
          if (parent && parent.data) {
            var index = parent.data.indexOf(obj);
            var newIndex = index - 1;
            if (newIndex >= 0 && index >= 0 && index != newIndex && parent.data.length > newIndex) {
              this.addCommand([12, ns_id, newIndex, index, parent.__id]);
              // dataTest.execCmd( [12, "obj4", 0, 2, "array1"], true);
            }
          }
        }
      };

      /**
       * @param float id
       * @param float newIndex
       */
      _myTrait_.moveTo = function (id, newIndex) {
        var ns_id = this._idToNs(id, this._ns); // is this too slow?
        var obj = this._data._find(ns_id);
        if (obj) {
          var parent = this._fetch(obj.__p);
          if (parent && parent.data) {
            var index = parent.data.indexOf(obj);
            if (index >= 0 && index != newIndex && parent.data.length > newIndex) {
              this.addCommand([12, ns_id, newIndex, index, parent.__id]);
              // dataTest.execCmd( [12, "obj4", 0, 2, "array1"], true);
            }
          }
        }
      };

      /**
       * @param float id
       */
      _myTrait_.moveUp = function (id) {
        var ns_id = this._idToNs(id, this._ns); // is this too slow?
        var obj = this._data._find(ns_id);
        if (obj) {
          var parent = this._fetch(obj.__p);
          if (parent && parent.data) {
            var index = parent.data.indexOf(obj);
            var newIndex = index + 1;
            if (newIndex >= 0 && index >= 0 && index != newIndex && parent.data.length > newIndex) {
              this.addCommand([12, ns_id, newIndex, index, parent.__id]);
              // dataTest.execCmd( [12, "obj4", 0, 2, "array1"], true);
            }
          }
        }
      };

      /**
       * @param float t
       */
      _myTrait_.reconnect = function (t) {
        this._disconnected = false;
        return this;
      };

      /**
       * @param float cnt
       */
      _myTrait_.redo = function (cnt) {
        this._data.redo(cnt);
      };

      /**
       * @param float options
       */
      _myTrait_.redoStep = function (options) {
        this._data.redoStep(options);
      };

      /**
       * @param float id
       */
      _myTrait_.remove = function (id) {
        var ns_id = this._idToNs(id, this._ns); // is this too slow?
        var obj = this._data._find(ns_id);
        if (obj) {
          var parent = this._fetch(obj.__p);
          if (parent && parent.data) {
            var index = parent.data.indexOf(obj);
            if (index >= 0) {
              this.addCommand([8, index, ns_id, 0, parent.__id]);
              // this.addCommand([4, name, value, old_value, ns_id ]);
            }
          }
          // dataTest.execCmd( [8, 0, "obj1", 0, "array1"], true);
          // return obj.data[name];
        }
      };

      /**
       * @param float commandName
       * @param float packet
       */
      _myTrait_.sendCommand = function (commandName, packet) {
        var me = this,
            channelId = this._channelId,
            socket = this._socket;

        if (!me._policy) return;
        if (me._disconnected) return; // in case disconnected, don't send data
        if (!me._connected) return;
        if (!socket) return;

        return socket.send('channelCommand', {
          channelId: channelId,
          cmd: commandName,
          data: packet
        });
      };

      /**
       * @param float id
       * @param float name
       * @param float value
       */
      _myTrait_.set = function (id, name, value) {
        var ns_id = this._idToNs(id, this._ns); // is this too slow?
        var obj = this._data._find(ns_id);
        if (obj && !this.isObject(value)) {
          var old_value = obj.data[name];
          if (old_value != value) {
            console.log('command 4 ' + JSON.stringify([4, name, value, old_value, ns_id]));
            this.addCommand([4, name, value, old_value, ns_id]);
          }
        }
      };

      /**
       * @param float model
       */
      _myTrait_.setChannelModel = function (model) {

        this._serverModel = model;
      };

      /**
       * @param float masterConnection
       */
      _myTrait_.setMasterConnection = function (masterConnection) {
        this._master = masterConnection;
      };

      /**
       * @param float id
       * @param float name
       * @param float propObj
       */
      _myTrait_.setObject = function (id, name, propObj) {
        var ns_id = this._idToNs(id, this._ns); // is this too slow?
        var obj = this._data._find(ns_id);

        if (obj && this.isObject(propObj) && propObj.__id) {
          var old_value = obj.data[name];

          if (!old_value) {
            // insert object only if there is no old value
            this.addCommand([5, name, propObj.__id, null, ns_id]);
          }
        }
      };

      /**
       * Will set the slave server for this connection
       * @param Object slaveServer
       */
      _myTrait_.setSlaveServer = function (slaveServer) {

        this._slave = slaveServer;
      };

      /**
       * Create a new syncable channel...
       * @param Object syncData
       */
      _myTrait_.sync = function (syncData) {
        /*
        {
        "out" : {
        "channelId" : "sync/test1",
        "protocol" : "http",
        "ip" : "localhost",
        "port" : "1234",
        "extPort" : "7778",
        "method" : "node.socket",
        "username" : "Tero",
        "password" : "teropw"
        },
        "in" : {
        "channelId" : "sync/test2",
        "protocol" : "http",
        "ip" : "localhost",
        "port" : "1234",
        "extPort" : "7779",
        "method" : "node.socket",
        "username" : "Tero",
        "password" : "teropw"
        }
        }
        */
        var socket = this._socket,
            me = this,
            channelId = this._channelId;
        return _promise(function (result) {

          if (!me.isConnected() || !syncData || !syncData.out || !syncData.out.channelId) {
            result({
              success: false
            });
            return;
          }

          socket.send('channelCommand', {
            channelId: channelId,
            cmd: 'sync',
            data: {
              sync: syncData
            }
          }).then(function (res) {
            result(res);
          });
        });
      };

      /**
       * @param int cnt
       */
      _myTrait_.undo = function (cnt) {
        this._data.undo(cnt);
      };

      /**
       * @param float options
       */
      _myTrait_.undoStep = function (options) {
        this._data.undoStep(options);
      };

      /**
       * @param float id
       * @param float name
       */
      _myTrait_.unset = function (id, name) {
        var ns_id = this._idToNs(id, this._ns); // is this too slow?
        var obj = this._data._find(ns_id);
        if (obj && obj.data) {

          if (this.isObject(obj.data[name])) {
            this.addCommand([10, name, obj.data[name].__id, null, ns_id]);
          } else {
            if (obj.data && typeof obj.data[name] != 'undefined') {
              this.addCommand([10, name, obj.data[name], 'value', ns_id]);
            }
          }
        }
      };

      /**
       * @param float t
       */
      _myTrait_.upgradeVersion = function (t) {

        // should start the snapshot command
        this._socket.send('channelCommand', {
          channelId: this._channelId,
          cmd: 'snapshot',
          data: {}
        }).then(function () {});
      };
    })(this);
  };

  var channelClient = function channelClient(a, b, c, d, e, f, g, h) {
    var m = this,
        res;
    if (m instanceof channelClient) {
      var args = [a, b, c, d, e, f, g, h];
      if (m.__factoryClass) {
        m.__factoryClass.forEach(function (initF) {
          res = initF.apply(m, args);
        });
        if (typeof res == 'function') {
          if (res._classInfo.name != channelClient._classInfo.name) return new res(a, b, c, d, e, f, g, h);
        } else {
          if (res) return res;
        }
      }
      if (m.__traitInit) {
        m.__traitInit.forEach(function (initF) {
          initF.apply(m, args);
        });
      } else {
        if (typeof m.init == 'function') m.init.apply(m, args);
      }
    } else return new channelClient(a, b, c, d, e, f, g, h);
  };

  channelClient_prototype.prototype = _promise.prototype;

  channelClient._classInfo = {
    name: 'channelClient'
  };
  channelClient.prototype = new channelClient_prototype();

  (function () {
    if (typeof define !== 'undefined' && define !== null && define.amd != null) {
      __amdDefs__['channelClient'] = channelClient;
      this.channelClient = channelClient;
    } else if (typeof module !== 'undefined' && module !== null && module.exports != null) {
      module.exports['channelClient'] = channelClient;
    } else {
      this.channelClient = channelClient;
    }
  }).call(new Function('return this')());

  var _clientSocket_prototype = function _clientSocket_prototype() {

    (function (_myTrait_) {
      var _eventOn;
      var _commands;

      // Initialize static variables here...

      /**
       * @param float t
       */
      _myTrait_.guid = function (t) {

        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      };

      /**
       * @param float t
       */
      _myTrait_.isArray = function (t) {
        return Object.prototype.toString.call(t) === '[object Array]';
      };

      /**
       * @param float fn
       */
      _myTrait_.isFunction = function (fn) {
        return Object.prototype.toString.call(fn) == '[object Function]';
      };

      /**
       * @param float t
       */
      _myTrait_.isObject = function (t) {
        return t === Object(t);
      };
    })(this);

    (function (_myTrait_) {

      // Initialize static variables here...

      /**
       * Binds event name to event function
       * @param string en  - Event name
       * @param float ef
       */
      _myTrait_.on = function (en, ef) {
        if (!this._ev) this._ev = {};
        if (!this._ev[en]) this._ev[en] = [];

        this._ev[en].push(ef);

        if (en == 'connect' && this._connected) {
          ef(this._socket);
        }

        return this;
      };

      /**
       * @param float name
       * @param float fn
       */
      _myTrait_.removeListener = function (name, fn) {
        if (!this._ev) return;
        if (!this._ev[name]) return;

        var list = this._ev[name];

        for (var i = 0; i < list.length; i++) {
          if (list[i] == fn) {
            list.splice(i, 1);
            return;
          }
        }
      };

      /**
       * triggers event with data and optional function
       * @param string en
       * @param float data
       * @param float fn
       */
      _myTrait_.trigger = function (en, data, fn) {

        if (!this._ev) return;
        if (!this._ev[en]) return;
        var me = this;
        this._ev[en].forEach(function (cb) {
          cb(data, fn);
        });
        return this;
      };
    })(this);

    (function (_myTrait_) {
      var _channelIndex;
      var _rootData;
      var _callBacks;
      var _socketIndex;
      var _socketCnt;

      // Initialize static variables here...

      /**
       * @param float t
       */
      _myTrait_.disconnect = function (t) {
        this._socket.messageTo({
          disconnect: true
        });
        me._connected = false;
      };

      /**
       * Emit data from client to server
       * @param String name  - Message name
       * @param Object data  - Data to be sent, Object or string
       * @param Function callBackFn  - Callback, message from the receiver
       */
      _myTrait_.emit = function (name, data, callBackFn) {

        var obj = {
          name: name,
          data: data
        };

        if (callBackFn) {
          obj._callBackId = this.guid();
          var me = this;
          var handleCb = function handleCb(data) {
            callBackFn(data);
            me.removeListener(obj._callBackId, handleCb);
          };
          this.on(obj._callBackId, handleCb);
        }

        this._socket.messageTo(obj);
      };

      /**
       * The enumerated socket, stating from 1
       * @param float t
       */
      _myTrait_.getEnum = function (t) {
        var myId = this.socketId;

        if (!_socketIndex[myId]) {
          _socketIndex[myId] = _socketCnt++;
        }
        return _socketIndex[myId];
      };

      /**
       * Returns GUID of the current socket.
       * @param float t
       */
      _myTrait_.getId = function (t) {
        return this.socketId;
      };

      if (_myTrait_.__traitInit && !_myTrait_.hasOwnProperty('__traitInit')) _myTrait_.__traitInit = _myTrait_.__traitInit.slice();
      if (!_myTrait_.__traitInit) _myTrait_.__traitInit = [];
      _myTrait_.__traitInit.push(function (ip, port, realSocket) {

        // The socket ID must be told to the server side too

        if (!_socketIndex) {
          _socketIndex = {};
          _socketCnt = 1;
        }

        var me = this;
        var myId = this.guid();
        this.socketId = myId;

        if (!_socketIndex[this.socketId]) {
          _socketIndex[this.socketId] = _socketCnt++;
        }

        if (realSocket) {

          var _hasbeenConnected = false;
          var openConnection, connection;

          var whenConnected = function whenConnected() {
            // console.log("whenConnected called");

            if (!_hasbeenConnected) {

              if (openConnection) openConnection.release();
              if (connection) connection.release();

              openConnection = _tcpEmu(ip, port, 'openConnection', 'client', realSocket);
              connection = _tcpEmu(ip, port, myId, 'client', realSocket);

              connection.on('clientMessage', function (o, v) {
                // console.log("clientMessage received ", v);
                if (v.connected) {
                  me._socket = connection;
                  me._connected = true;
                  me.trigger('connect', connection);
                } else {
                  me.trigger(v.name, v.data);
                }
              });
              // should this be called again?
              openConnection.messageTo({
                socketId: myId
              });
            } else {
              // does this kind of connection work...
              // console.log("Triggering connect again");
              me.trigger('connect', me._socket);
            }
            // console.log("Sending message to _tcpEmu with real socket ");
            // _hasbeenConnected = true;
          };
          var me = this;
          realSocket.on('disconnect', function () {
            me.trigger('disconnect');
          });

          if (realSocket.connected) {
            // console.log("realSocket was connected");
            whenConnected();
          } else {
            // console.log("realSocket was not connected");
            realSocket.on('connect', whenConnected);
          }

          // this._connected
          return;
        }

        var openConnection = _tcpEmu(ip, port, 'openConnection', 'client', realSocket);
        var connection = _tcpEmu(ip, port, myId, 'client', realSocket);

        connection.on('clientMessage', function (o, v) {
          if (v.connected) {
            me._socket = connection;
            me._connected = true;
            me.trigger('connect', connection);
          } else {
            me.trigger(v.name, v.data);
          }
        });
        openConnection.messageTo({
          socketId: myId
        });
      });

      /**
       * A promisified interface of the &quot;emit&quot; for the _clientSocket
       * @param float name
       * @param float data
       */
      _myTrait_.send = function (name, data) {
        var me = this;
        return _promise(function (respFn) {
          me.emit(name, data, respFn);
        });
      };
    })(this);
  };

  var _clientSocket = function _clientSocket(a, b, c, d, e, f, g, h) {
    var m = this,
        res;
    if (m instanceof _clientSocket) {
      var args = [a, b, c, d, e, f, g, h];
      if (m.__factoryClass) {
        m.__factoryClass.forEach(function (initF) {
          res = initF.apply(m, args);
        });
        if (typeof res == 'function') {
          if (res._classInfo.name != _clientSocket._classInfo.name) return new res(a, b, c, d, e, f, g, h);
        } else {
          if (res) return res;
        }
      }
      if (m.__traitInit) {
        m.__traitInit.forEach(function (initF) {
          initF.apply(m, args);
        });
      } else {
        if (typeof m.init == 'function') m.init.apply(m, args);
      }
    } else return new _clientSocket(a, b, c, d, e, f, g, h);
  };

  _clientSocket._classInfo = {
    name: '_clientSocket'
  };
  _clientSocket.prototype = new _clientSocket_prototype();

  (function () {
    if (typeof define !== 'undefined' && define !== null && define.amd != null) {
      __amdDefs__['_clientSocket'] = _clientSocket;
      this._clientSocket = _clientSocket;
    } else if (typeof module !== 'undefined' && module !== null && module.exports != null) {
      module.exports['_clientSocket'] = _clientSocket;
    } else {
      this._clientSocket = _clientSocket;
    }
  }).call(new Function('return this')());

  var moshModule_prototype = function moshModule_prototype() {

    (function (_myTrait_) {

      // Initialize static variables here...

      if (_myTrait_.__traitInit && !_myTrait_.hasOwnProperty('__traitInit')) _myTrait_.__traitInit = _myTrait_.__traitInit.slice();
      if (!_myTrait_.__traitInit) _myTrait_.__traitInit = [];
      _myTrait_.__traitInit.push(function (main) {});
    })(this);
  };

  var moshModule = function moshModule(a, b, c, d, e, f, g, h) {
    var m = this,
        res;
    if (m instanceof moshModule) {
      var args = [a, b, c, d, e, f, g, h];
      if (m.__factoryClass) {
        m.__factoryClass.forEach(function (initF) {
          res = initF.apply(m, args);
        });
        if (typeof res == 'function') {
          if (res._classInfo.name != moshModule._classInfo.name) return new res(a, b, c, d, e, f, g, h);
        } else {
          if (res) return res;
        }
      }
      if (m.__traitInit) {
        m.__traitInit.forEach(function (initF) {
          initF.apply(m, args);
        });
      } else {
        if (typeof m.init == 'function') m.init.apply(m, args);
      }
    } else return new moshModule(a, b, c, d, e, f, g, h);
  };

  moshModule._classInfo = {
    name: 'moshModule'
  };
  moshModule.prototype = new moshModule_prototype();

  if (typeof define !== 'undefined' && define !== null && define.amd != null) {
    define(__amdDefs__);
  }
}).call(new Function('return this')());

// console.log("Strange... no emit value in ", this._parent);

// objectCache[data.__id] = this;

/*
serverState.model.writeToJournal( goodList ).then( function() {
// done(result);
});
*/

// skip, if next should be taken instead

// this.writeCommand(a, newObj);

// this.writeCommand(a, newObj);

// this.writeCommand(a);

// this.writeCommand(a);

//    this.writeCommand(a);