"use strict";

(function () {

  var __amdDefs__ = {};

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
          if (Object.prototype.toString.call(args) === "[object Array]") {
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
          name = "aft_" + _localCnt++;
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
        var id_name = "e_" + _localCnt++;
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
          name = "t7491_" + _localCnt++;
        }

        _everies[name] = {
          step: Math.floor(seconds * 1000),
          fn: fn,
          nextTime: 0
        };
      };

      if (_myTrait_.__traitInit && !_myTrait_.hasOwnProperty("__traitInit")) _myTrait_.__traitInit = _myTrait_.__traitInit.slice();
      if (!_myTrait_.__traitInit) _myTrait_.__traitInit = [];
      _myTrait_.__traitInit.push(function (interval, fn) {
        if (!_initDone) {
          this._easeFns();
          _localCnt = 1;

          var frame, cancelFrame;
          if (typeof window != "undefined") {
            var frame = window["requestAnimationFrame"],
                cancelFrame = window["cancelRequestAnimationFrame"];
            ["", "ms", "moz", "webkit", "o"].forEach(function (x) {
              if (!frame) {
                frame = window[x + "RequestAnimationFrame"];
                cancelFrame = window[x + "CancelAnimationFrame"] || window[x + "CancelRequestAnimationFrame"];
              }
            });
          }

          var is_node_js = new Function("try { return this == global; } catch(e) { return false; }")();

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
              if (Object.prototype.toString.call(fn) === "[object Array]") {
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
        if (typeof res == "function") {
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
        if (typeof m.init == "function") m.init.apply(m, args);
      }
    } else return new later(a, b, c, d, e, f, g, h);
  };

  later._classInfo = {
    name: "later"
  };
  later.prototype = new later_prototype();

  (function () {
    if (typeof define !== "undefined" && define !== null && define.amd != null) {
      __amdDefs__["later"] = later;
      this.later = later;
    } else if (typeof module !== "undefined" && module !== null && module.exports != null) {
      module.exports["later"] = later;
    } else {
      this.later = later;
    }
  }).call(new Function("return this")());

  var _promise_prototype = function _promise_prototype() {

    (function (_myTrait_) {

      // Initialize static variables here...

      /**
       * @param float someVar
       */
      _myTrait_.isArray = function (someVar) {
        return Object.prototype.toString.call(someVar) === "[object Array]";
      };

      /**
       * @param Function fn
       */
      _myTrait_.isFunction = function (fn) {
        return Object.prototype.toString.call(fn) == "[object Function]";
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
              allPromise.reject("Not list of promises");
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
              allPromise.reject("Not list of promises");
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
              if (typeof x != "undefined") {
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
          console.log("Plugin args", args);
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

      if (_myTrait_.__traitInit && !_myTrait_.hasOwnProperty("__traitInit")) _myTrait_.__traitInit = _myTrait_.__traitInit.slice();
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
            if (Object.prototype.toString.call(last) == "[object Function]") {
              userCb = last;
              cbIndex = args.length - 1;
            }
          }

          var mainPromise = wishes().pending();
          this.then(function () {
            var nodePromise = wishes().pending();
            var args2 = Array.prototype.slice.call(arguments, 0);
            console.log("Orig args", args);
            console.log("Then args", args2);
            var z;
            if (args.length == 0) z = args2;
            if (args2.length == 0) z = args;
            if (!z) z = args2.concat(args);
            cbIndex = z.length; // 0,fn... 2
            if (userCb) cbIndex--;
            z[cbIndex] = function (err) {
              if (err) {
                console.log("Got error ", err);
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

            console.log("nodeStyle after concat", z);
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
              allPromise.reject("Not list of promises");
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
          this._rejectReason = "TypeError";
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
        if (typeof newState != "undefined") {
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
        if (typeof v != "undefined") {
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
        if (typeof res == "function") {
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
        if (typeof m.init == "function") m.init.apply(m, args);
      }
    } else return new _promise(a, b, c, d, e, f, g, h);
  };

  _promise._classInfo = {
    name: "_promise"
  };
  _promise.prototype = new _promise_prototype();

  (function () {
    if (typeof define !== "undefined" && define !== null && define.amd != null) {
      __amdDefs__["_promise"] = _promise;
      this._promise = _promise;
    } else if (typeof module !== "undefined" && module !== null && module.exports != null) {
      module.exports["_promise"] = _promise;
    } else {
      this._promise = _promise;
    }
  }).call(new Function("return this")());

  var nfs4_acl_prototype = function nfs4_acl_prototype() {

    (function (_myTrait_) {

      // Initialize static variables here...

      /**
       * @param float obj
       * @param float flags
       */
      _myTrait_.addPermission = function (obj, flags) {

        for (var i = 0; i < flags.length; i++) {
          var permission = flags[i];
          if (obj.permissions.indexOf(permission) < 0) obj.permissions += permission;
        }
      };

      /**
       * @param float groupName
       * @param float flag
       */
      _myTrait_.allowGroup = function (groupName, flag) {
        var did = false,
            me = this;
        this.map(function (o) {
          if (o.principal == groupName && !(o.flags.indexOf("g") >= 0)) {
            if (o.type == "A") {
              did = true;
              me.addPermission(o, flag);
            }
            if (o.type == "D") {
              me.removePermission(o, flag);
            }
          }
          return o;
        });

        if (!did) {
          this.push("A:g:" + groupName + ":" + flag);
        }
      };

      /**
       * @param String username
       * @param float flag
       */
      _myTrait_.allowUser = function (username, flag) {

        var did = false,
            me = this;
        this.map(function (o) {
          if (o.principal == username && !(o.flags.indexOf("g") >= 0)) {
            if (o.type == "A") {
              did = true;
              me.addPermission(o, flag);
            }
            if (o.type == "D") {
              me.removePermission(o, flag);
            }
          }
          return o;
        });

        if (!did) {
          this.push("A::" + username + ":" + flag);
        }
      };

      /**
       * @param float groupName
       * @param float flag
       */
      _myTrait_.denyGroup = function (groupName, flag) {
        var did = false,
            me = this;
        this.map(function (o) {
          if (o.principal == groupName && !(o.flags.indexOf("g") >= 0)) {
            did = true;
            if (o.type == "A") {
              me.removePermission(o, flag);
            }
            if (o.type == "D") {
              me.addPermission(o, flag);
            }
          }
          return o;
        });

        if (!did) {
          this.push("D:g:" + groupName + ":" + flag);
        }
      };

      /**
       * @param float username
       * @param float flag
       */
      _myTrait_.denyUser = function (username, flag) {

        var did = false,
            me = this;
        this.map(function (o) {
          if (o.principal == username && !(o.flags.indexOf("g") >= 0)) {

            if (o.type == "A") {
              me.removePermission(o, flag);
            }
            if (o.type == "D") {
              did = true;
              me.addPermission(o, flag);
            }
          }
          return o;
        });

        if (!did) {
          this.push("D::" + username + ":" + flag);
        }
      };

      /**
       * @param float fn
       */
      _myTrait_.filter = function (fn) {
        var list = this._acl.split("\n");
        list.filter(fn);
        this._acl = list.join("\n");

        return this;
      };

      /**
       * @param String username
       * @param float rolename
       * @param float rule
       */
      _myTrait_.find = function (username, rolename, rule) {
        return this.has(username, rolename, rule);
      };

      /**
       * @param float obj
       */
      _myTrait_.fromObject = function (obj) {
        return obj.type + ":" + obj.flags + ":" + obj.principal + ":" + obj.permissions;
      };

      /**
       * @param float t
       */
      _myTrait_.getACL = function (t) {
        return this._acl;
      };

      /**
       * @param float username
       * @param float rolename
       * @param float rule
       */
      _myTrait_.has = function (username, rolename, rule) {

        var i = 0,
            line_i = 0,
            type_i = 0,
            length = this._acl.length;

        var type,
            flags,
            principal,
            permissions,
            flag,
            bGroup = false,
            uni = 0,
            uni_match = false,
            uni_failed = false,
            mCnt = 0,
            mokCnt = 0,
            ignore_line = false;

        /*
        A::OWNER@:rwatTnNcCy
        A::alice@nfsdomain.org:rxtncy
        A::bob@nfsdomain.org:rwadtTnNcCy
        A:g:GROUP@:rtncy
        D:g:GROUP@:waxTC
        */

        while (i < length) {

          if (this._acl.charAt(i) == ":") {
            line_i++;
            type_i++;
            i++;
            continue;
          }
          if (this._acl.charAt(i) == "\n") {
            line_i = 0;
            type_i = 0;
            i++;
            continue;
          }

          if (line_i == 0) {

            if (mokCnt > 0 && rule.length == mokCnt) {
              if (type == "A") return true;
              if (type == "D") return false;
            }

            ignore_line = false;
            type = this._acl.charAt(i);
            line_i++;
            i++;
            uni_match = false;
            uni_failed = false;
            uni = 0;
            mCnt = 0;
            mokCnt = 0;
            bGroup = false;
            continue;
          }
          if (type_i == 1) {
            flag = this._acl.charAt(i);
            if (flag == "g") bGroup = true;
            if (flag == "i") ignore_line = true;
            line_i++;
            i++;
            continue;
          }
          if (type_i == 2) {
            if (bGroup) {
              if (this._acl.charAt(i) == rolename.charAt(uni++)) {
                uni_match = true;
              } else {
                uni_match = false;
                uni_failed = true;
              }
            } else {
              if (this._acl.charAt(i) == username.charAt(uni++)) {
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
          if (type_i == 3) {
            if (uni_match && !uni_failed && !ignore_line) {
              if (rule.indexOf(this._acl.charAt(i)) >= 0) {
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

        if (mokCnt > 0 && rule.length == mokCnt) {
          if (type == "A") return true;
          if (type == "D") return false;
        }
        return false;
      };

      if (_myTrait_.__traitInit && !_myTrait_.hasOwnProperty("__traitInit")) _myTrait_.__traitInit = _myTrait_.__traitInit.slice();
      if (!_myTrait_.__traitInit) _myTrait_.__traitInit = [];
      _myTrait_.__traitInit.push(function (aclFile) {
        this._acl = aclFile.trim();

        // type:flags:principal:permissions
        // Types : A, D, U, L

        /*
        A principal is either a named user (e.g., 'myuser@nfsdomain.org') or group (provided the group flag is also set), 
        or one of three special principals: 'OWNER@', 'GROUP@', and 'EVERYONE@', which are, respectively, analogous to the 
        POSIX user/group/other distinctions used in, e.g., chmod(1).
        */
      });

      /**
       * @param float fn
       */
      _myTrait_.map = function (fn) {

        if (this._acl.length == 0) return this;

        var list = this._acl.split("\n");
        var newList = list.map(this.toObject).map(fn).map(this.fromObject);
        this._acl = newList.join("\n").trim();
        return this;
      };

      /**
       * @param float line
       */
      _myTrait_.push = function (line) {

        var len = this._acl.length;

        if (len == 0 || this._acl.charAt(len - 1) == "\n") {
          this._acl += line;
        } else {
          this._acl += "\n" + line;
        }

        this._acl = this._acl.trim();
      };

      /**
       * @param float fn
       * @param float initialValue
       */
      _myTrait_.reduce = function (fn, initialValue) {
        var list = this._acl.split("\n");
        list.reduce(fn, initialValue);
        this._acl = list.join("\n");

        return this;
      };

      /**
       * @param float t
       */
      _myTrait_.removeAll = function (t) {
        this._acl = "";
      };

      /**
       * @param float obj
       * @param float flags
       */
      _myTrait_.removePermission = function (obj, flags) {

        for (var i = 0; i < flags.length; i++) {
          var permission = flags[i];
          if (obj.permissions.indexOf(permission) >= 0) {
            obj.permissions = obj.permissions.replace(permission, "");
          }
        }
      };

      /**
       * @param float fn
       */
      _myTrait_.replaceLines = function (fn) {

        var list = this._acl.split("\n");

        for (var i = 0; i < list.length; i++) {
          var n = fn(list[i]);
          if (n) list[i] = n;
        }
      };

      /**
       * @param float line
       */
      _myTrait_.toObject = function (line) {
        /*
        A::OWNER@:rwatTnNcCy
        A::alice@nfsdomain.org:rxtncy
        A::bob@nfsdomain.org:rwadtTnNcCy
        A:g:GROUP@:rtncy
        D:g:GROUP@:waxTC
        */

        var obj = {};
        if (!line) return obj;

        var parts = line.split(":");
        // var type, flags, principal, permissions,
        if (line.length > 0) {
          obj.type = line.charAt(0);
          obj.flags = parts[1];
          obj.principal = parts[2];
          obj.permissions = parts[3];
        }
        return obj;
      };
    })(this);
  };

  var nfs4_acl = function nfs4_acl(a, b, c, d, e, f, g, h) {
    var m = this,
        res;
    if (m instanceof nfs4_acl) {
      var args = [a, b, c, d, e, f, g, h];
      if (m.__factoryClass) {
        m.__factoryClass.forEach(function (initF) {
          res = initF.apply(m, args);
        });
        if (typeof res == "function") {
          if (res._classInfo.name != nfs4_acl._classInfo.name) return new res(a, b, c, d, e, f, g, h);
        } else {
          if (res) return res;
        }
      }
      if (m.__traitInit) {
        m.__traitInit.forEach(function (initF) {
          initF.apply(m, args);
        });
      } else {
        if (typeof m.init == "function") m.init.apply(m, args);
      }
    } else return new nfs4_acl(a, b, c, d, e, f, g, h);
  };

  nfs4_acl._classInfo = {
    name: "nfs4_acl"
  };
  nfs4_acl.prototype = new nfs4_acl_prototype();

  (function () {
    if (typeof define !== "undefined" && define !== null && define.amd != null) {
      __amdDefs__["nfs4_acl"] = nfs4_acl;
      this.nfs4_acl = nfs4_acl;
    } else if (typeof module !== "undefined" && module !== null && module.exports != null) {
      module.exports["nfs4_acl"] = nfs4_acl;
    } else {
      this.nfs4_acl = nfs4_acl;
    }
  }).call(new Function("return this")());

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
        return Object.prototype.toString.call(fn) == "[object Function]";
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
          if (id[len - 1] == "#") {
            id = id.split("@").shift();
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

          if (id[len - 1] == "#") {
            var ind = id.indexOf("@");
            var oldNs = id.substring(ind + 1, len - 1);
            if (oldNs != ns) {
              id = id.substring(0, ind) + "@" + ns + "#";
            }
          } else {
            id = id + "@" + ns + "#";
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
          id = id + "";
          var len = id.length;
          if (id[len - 1] == "#") {
            ns = id.split("@").pop();
            ns = ns.split("#").shift();
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

        console.log(" _transformToNsBeforeInsert ");

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

      if (_myTrait_.__traitInit && !_myTrait_.hasOwnProperty("__traitInit")) _myTrait_.__traitInit = _myTrait_.__traitInit.slice();
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
      var _repClass;

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

          socket.send("channelCommand", {
            channelId: channelId,
            cmd: "checkout",
            data: ""
          }).then(function (res) {

            debugger;
            console.log("Checkout tree ");
            console.log(res);
            result(res);
          });
        });
      };

      if (!_myTrait_.hasOwnProperty("__factoryClass")) _myTrait_.__factoryClass = [];
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
       * @param float t
       */
      _myTrait_._dataWorkerClass = function (t) {

        console.log("_dataWorkerClass");

        if (typeof Marx == "undefined") return;

        var self = this;
        var marx = Marx();

        // Create the data worker class to open up connection from inside the Web Worker
        if (!_repClass && marx) {
          _repClass = marx.createClass({
            requires: {
              js: [{
                url: "https://cdnjs.cloudflare.com/ajax/libs/socket.io/1.3.7/socket.io.min.js"
              }, {
                url: "http://tp.treeni.fi/static/mosh-server-1.01.js?v=6"
              }]
            },
            processWorkers: {
              init: function init() {
                // console.log("Replicator object created");
                this._hot = {};
              },
              clientReady: function clientReady() {
                if (!this._readyCallback) return;
                this._readyCallback();
                this._readyCallback = null;
              },
              close: function close() {
                if (this._serverData && this._serverData.closeChannel) {
                  this._serverData.closeChannel();
                }
              },
              patchShadowCmds: function patchShadowCmds(listOfCmds) {
                // console.log("Patching shadow commands");
                this._clientData.patch(listOfCmds);
              },
              patchShadowCmd: function patchShadowCmd(cmd) {
                // console.log("Patching client with "+cmd);               
                this._clientData.patch([cmd]);
              },
              sendCommands: function sendCommands(cmdList) {

                this.trigger("myMsg", cmdList);

                var client = this._serverData._client;
                var socket = this._serverData._socket;

                var ms = new Date().getTime();

                // the current client status
                // TODO: should be self-correcting
                var me = this,
                    remoteList = [];
                cmdList.forEach(function (c) {
                  c[1] = client._transformCmdFromNs(c[1]);
                  if (c[0]) remoteList.push(c[1]);
                  // console.log("patching "+c[1]);
                  me._clientData.patch([c[1]]);
                  me._hot[c[1][4]] = ms; // the ID marked as "hot"
                });
                this.trigger("myMsg", remoteList);
                if (remoteList.length > 0) {
                  // console.log("sendCommands");
                  // console.log(remoteList);               
                  try {
                    socket.send("channelCommand", {
                      channelId: client._channelId,
                      cmd: "sendCmds",
                      data: {
                        commands: remoteList
                      }
                    });
                    this.trigger("myMsg", "should have sent some data");
                  } catch (e) {
                    this.trigger("myMsg", e.message);
                  }
                }
              },
              applyToShadow: function applyToShadow(cmd) {
                var client = this._serverData._client;
                var socket = this._serverData._socket;

                // the current client status
                // TODO: should be self-correcting
                this._clientData._client.addCommand(cmd);

                socket.send("channelCommand", {
                  channelId: client._channelId,
                  cmd: "sendCmds",
                  data: {
                    commands: [client._transformCmdFromNs(cmd)]
                  }
                });
              },
              connect: function connect(options, whenReady) {

                // console.log("The replicator is connecting to "+options.db);
                // if(typeof(ioLib)=="undefined") console.log("REPLICA ioLib not defined")

                this.trigger("myMsg", "Connecting");
                this.trigger("myMsg", options);

                var realSocket = io(options.url);
                // console.log("REPLICA : realSocket ok");
                var theData = _data(options.db, {
                  auth: {
                    username: "Tero",
                    password: "teropw"
                  },
                  ioLib: realSocket,
                  protocolVersion: options.protocolVersion
                });
                // console.log("REPLICA : _data ok");
                this._serverData = theData;
                this._readyCallback = whenReady;

                var me = this;
                this._serverData.then(function () {

                  // console.log("REPLICA : Got the connection");
                  var bHasData = false;
                  // if no clientdata specified
                  if (!options.clientData) {
                    var rawData = theData.getData(true);

                    var clientData = theData.localFork();
                    me._clientData = clientData;

                    // send the raw data to server
                    // whenReady(rawData);
                  } else {
                    // console.log("REPLICA : using options.clientData");
                    me._clientData = _data(options.clientData);
                  }

                  // listen to changes from the server...
                  var chServerData = me._serverData.getChannelData();
                  chServerData.on("cmd", function (d) {
                    bHasData = true;
                  });

                  if (options.clientData) {
                    whenReady();
                    me._readyCallback = null;
                  } else {
                    // console.log("REPLICA : about to call whenReady with raw data");
                    whenReady(rawData);
                    me._readyCallback = null;
                  }
                  bHasData = true;

                  // if we have skipped some data, b_hot_pending tells us that we are not
                  // finished yet with processing of the server data
                  var b_hot_pending = false;
                  setInterval(function () {

                    if (!me._clientData) return;
                    if (!b_hot_pending && !bHasData) return;
                    bHasData = false;

                    // console.log("R: has data, running diff");
                    var diff = me._clientData.diff(theData);
                    if (diff.length == 0) {
                      b_hot_pending = false;
                      return;
                    }
                    // console.log("R: diff had something to send");
                    // only send the diff directly to client               

                    // me._hot[c[1][4]]
                    var msNow = new Date().getTime();
                    var diff_list = [];
                    b_hot_pending = false;
                    for (var i = 0; i < diff.length; i++) {
                      var cmd = diff[i],
                          testId = cmd[4];
                      if (me._hot[testId]) {
                        var ms_hot = msNow - me._hot[testId];
                        if (ms_hot < 1000) {
                          b_hot_pending = true;
                          continue;
                        } else {
                          delete me._hot[testId];
                          diff_list.push(cmd);
                        }
                      } else {
                        diff_list.push(cmd);
                      }
                    }
                    // console.log("--> sending DIFF to the client process");
                    // console.log(JSON.stringify(diff_list, null, 2));
                    if (diff_list.length > 0) me.trigger("diff", diff_list);
                  }, 1);
                });
              }
            },
            // local process methods for the replicated data
            methods: {

              getDataObj: function getDataObj() {
                return this._myData;
              }
            }
          });
        }

        return _repClass;
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

        socket.on("upgrade_" + this._channelId, function (cmd) {

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
              console.log("Diff obj , myData, cmd.data");
              console.log(diff);
              console.log(myData);
              console.log(cmd.data);

              // run the commands for the local data
              var dd = me._clientState.data;
              var errCnt = 0;

              dd.setClearCreated(true);
              diff.cmds.forEach(function (c) {
                console.log("Diff cmd ", c);
                if (errCnt > 0) return;
                var r;
                /// dd.execCmd(c, true); // the point is just to change the data to something else
                if (!((r = dd.execCmd(c, true)) === true)) {
                  console.error("Full error ", r);
                  console.log("Return value from failed cmd: ", r);
                  errCnt++;
                }
              });
              dd.setClearCreated(false);

              // and now the hard part, upgrade the local client data.
              if (errCnt == 0) {

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
                fullUpgradeFailCnt++;

                // must stop full refresh at this point
                console.error("** errors with the full update ** ");
                if (fullUpgradeFailCnt > 0) {
                  console.log("--- server command data ---");
                  console.log(cmd);
                  console.log("--- the client state ---");
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
                cmd: "masterJournalUpgrade",
                data: cmd
              });
            }
          }
        });

        socket.on("s2c_" + this._channelId, function (cmd) {

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
                cmd: "masterUpgrade",
                data: cmd
              });
            }
          }
        });
      };

      /**
       * @param float t
       */
      _myTrait_._initProtocol2 = function (t) {
        var me = this,
            socket = this._socket;

        //   
        // debugger;
        var wClass = this._dataWorkerClass();

        if (wClass) {
          var ob = new wClass();

          ob.then(function (o) {

            o.on("myMsg", function (d) {
              console.log(d);
            });

            o.connect({
              url: "http://54.165.147.161:7777",
              db: "http://localhost:1234/replica/pieces",
              protocolVersion: 2
            }, function (theData) {

              console.log("The worker send response");
              console.log(theData);

              // TODO : Channel status ???
              me._channelStatus = {};
              var mainData = me._transformObjToNs(theData, me._ns);

              var chData = _channelData(me._id, mainData, []);

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
              me.resolve({
                result: true,
                channelId: me._channelId
              });

              var bDiffOn = false;

              var toShadowList = [];
              chData.on("cmd", function (d) {
                if (bDiffOn) return; // do not re-send the diff
                console.log("cData cmd");
                console.log(d);
                toShadowList.push([1, d.cmd]);
              });

              later().onFrame(function () {
                if (toShadowList.length > 0) {
                  console.log("-> should call sendCommands");
                  o.sendCommands(toShadowList.slice());
                }
                toShadowList.length = 0;
              });

              o.on("diff", function (cmdList) {
                bDiffOn = true;
                try {
                  cmdList.forEach(function (cmd) {
                    var chData = me._serverState.data;
                    var cmdRes = chData.execCmd(cmd);
                    if (cmdRes === true) {
                      toShadowList.push([0, cmd]);
                    }
                  });
                } catch (e) {}
                bDiffOn = false;
              });
            });
          });

          return;
        }

        // ---- the code below works, but we want to create a web worker  
        this._connCnt = 0;
        // console.log("Initializing protocol v2");

        socket.on("connect", function () {
          me._connCnt++;
          socket.send("joinChannel", {
            channelId: me._channelId
          }).then(function (data) {
            //console.log("Protocol v2 got response for joinChannel");
            //console.log(data);

            var mainData = me._transformObjToNs(data.start.data, me._ns);

            var chData = _channelData(me._id, mainData, []);

            // the state management
            me._clientState = {
              data: chData, // The channel data object
              chData: chData,
              client: me, // The channel client object (for Namespace conversion )
              needsRefresh: false, // true if client is out of sync and needs to reload
              version: data.start.version,
              last_update: [0, data.start.journal], // last succesfull server update
              last_sent: [0, data.start.journal] // last range sent to the server

            };
            me._data = chData;
            me.resolve({
              result: true,
              channelId: me._channelId
            });
          });
        });

        // the first big data coming from the server...
        /*
        me._state = {
        data : chData,              // The channel data object
        client : me,                // The channel client object (for Namespace conversion )
        needsRefresh : false,       // true if client is out of sync and needs to reload
        version : me._channelStatus.version,               
        last_update : [0, chData.getJournalLine()],  // last succesfull server update
        last_sent : [0, chData.getJournalLine()]     // last range sent to the server
        };
        */

        socket.on("cmds_" + this._channelId, function (cmd) {

          // just don't accept any msgs
          if (me._disconnected) return;

          console.log("protocal v2 got command");
          console.log(cmd);

          var state = me._clientState;
          var list = [];
          cmd.cmds.forEach(function (serverCmd) {
            list.push(me._transformCmdToNs(serverCmd));
          });

          list.forEach(function (cmd) {
            state.chData.execCmd(cmd, true);
          });

          /*
          var cmdPacket = {
          cmd : "s2c",
          cmds : chData._journal.slice(),  // send all the journal lines
          big : big_update,
          start : start,
          end : end,
          version : settings.version
          };
          // Big update
          if(big_update) {
          cmdPacket.data = chData.getData();
          serverState.dataStart.version = settings.version;
          }
          */
        });
        return;

        // ------ the old initialization code is below -----

        /*
        this._onFrameLoop( socket, myNamespace );
        this._incoming(socket, myNamespace);
        this._connCnt = 0;
        socket.on("disconnect", function() {
        me._connected = false;
        })
        socket.on("connect", function() {
        console.log("*** socket reconnect for "+channelId+" *** ");
        console.log("Connection count "+me._connCnt);
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
                    channelId : channelId,
                    initWithData  : options.initWithData
            });
        })
        .then( function(resp) {
        // this channel client has been connected to the server ok
        if( resp && resp.channelId == channelId ) {
            
            me._connected = true;
            // The next step: to load the channel information for the
            // local objects to consume
            
            if(me._connCnt > 1) {
                // if reconnecting to the other server, ask upgrade only, not the whole
                // build tree...
                me._onReconnect();
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
            
            // ? should we be updating this or is this just one-time info
            me._channelStatus = respData.status;
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
                          
            me._data = chData;
            me._createTransaction();
            me.resolve({ result : true, channelId : channelId });
            
        } else {
            me.resolve({ result : false, text : "Authorization or connection failed" });
        }
        })
        }
        });
        */
      };

      /**
       * @param float t
       */
      _myTrait_._isNodeJs = function (t) {
        return new Function("try { return this === global; } catch(e) { return false; }")();
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
            socket.send("channelCommand", {
              channelId: channelId,
              cmd: "c2s",
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
          console.log("*** reconnect to the master ***");
        }

        var me = this;

        console.log("_onReconnect");

        // if we have a slave controller...
        if (me._slaveController) {
          console.log("_slaveController -> trying to send data ");
          me._slaveController._sendUnsentToMaster();
        }

        // first, send the data we have to server, hope it get's through...
        var packet = me._policy.constructClientToServer(me._clientState);
        var socket = this._socket;
        var channelId = this._channelId;

        if (packet) {
          socket.send("channelCommand", {
            channelId: channelId,
            cmd: "c2s",
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

        this._socket.send("channelCommand", {
          channelId: this._channelId,
          cmd: "upgradeRequest",
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
       * @param float t
       */
      _myTrait_.closeChannel = function (t) {
        this._socket.send("exitChannel", {
          channelId: this._channelId
        }).then(function () {});
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
          me._socket.send("channelCommand", {
            channelId: me._channelId,
            cmd: "createChannel",
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
          me._socket.send("channelCommand", {
            channelId: me._channelId,
            cmd: "fork",
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
        console.log("from master", JSON.stringify(change));
      };

      /**
       * @param Object change
       */
      _myTrait_.fromSlave = function (change) {
        console.log("from slave", JSON.stringify(change));

        if (change.cmd == "s2c") {

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

      if (_myTrait_.__traitInit && !_myTrait_.hasOwnProperty("__traitInit")) _myTrait_.__traitInit = _myTrait_.__traitInit.slice();
      if (!_myTrait_.__traitInit) _myTrait_.__traitInit = [];
      _myTrait_.__traitInit.push(function (channelId, socket, options) {

        if (!_dmp) {
          if (typeof diff_match_patch != "undefined") {
            _dmp = new diff_match_patch();
          } else {
            // if in node.js try to require the module
            if (typeof require != "undefined") {
              var DiffMatchPatch = require("diff-match-patch");
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

        if (options.protocolVersion == 2) {
          // options.connectFn.apply(this, []);

          console.log("Initializing protocol v2");

          this._initProtocol2();

          return;
        }

        this._onFrameLoop(socket, myNamespace);
        this._incoming(socket, myNamespace);

        this._connCnt = 0;

        socket.on("disconnect", function () {
          me._connected = false;
        });
        socket.on("connect", function () {

          console.log("*** socket reconnect for " + channelId + " *** ");
          console.log("Connection count " + me._connCnt);

          me._connCnt++;

          // Authenticate...
          if (options.auth) {
            socket.send("auth", {
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
              return socket.send("requestChannel", {
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

                return socket.send("channelCommand", {
                  channelId: channelId,
                  cmd: "readBuildTree",
                  data: ""
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
                  text: "Authorization or connection failed"
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

        return socket.send("channelCommand", {
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
            console.log("command 4 " + JSON.stringify([4, name, value, old_value, ns_id]));
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

          socket.send("channelCommand", {
            channelId: channelId,
            cmd: "sync",
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
            if (obj.data && typeof obj.data[name] != "undefined") {
              this.addCommand([10, name, obj.data[name], "value", ns_id]);
            }
          }
        }
      };

      /**
       * @param float t
       */
      _myTrait_.upgradeVersion = function (t) {

        // should start the snapshot command
        this._socket.send("channelCommand", {
          channelId: this._channelId,
          cmd: "snapshot",
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
        if (typeof res == "function") {
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
        if (typeof m.init == "function") m.init.apply(m, args);
      }
    } else return new channelClient(a, b, c, d, e, f, g, h);
  };

  channelClient_prototype.prototype = _promise.prototype;

  channelClient._classInfo = {
    name: "channelClient"
  };
  channelClient.prototype = new channelClient_prototype();

  (function () {
    if (typeof define !== "undefined" && define !== null && define.amd != null) {
      __amdDefs__["channelClient"] = channelClient;
      this.channelClient = channelClient;
    } else if (typeof module !== "undefined" && module !== null && module.exports != null) {
      module.exports["channelClient"] = channelClient;
    } else {
      this.channelClient = channelClient;
    }
  }).call(new Function("return this")());

  var sequenceStepper_prototype = function sequenceStepper_prototype() {

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
        return Object.prototype.toString.call(t) === "[object Array]";
      };

      /**
       * @param float fn
       */
      _myTrait_.isFunction = function (fn) {
        return Object.prototype.toString.call(fn) == "[object Function]";
      };

      /**
       * @param float t
       */
      _myTrait_.isObject = function (t) {

        return t === Object(t);
      };
    })(this);

    (function (_myTrait_) {
      var _instances;

      // Initialize static variables here...

      if (!_myTrait_.hasOwnProperty("__factoryClass")) _myTrait_.__factoryClass = [];
      _myTrait_.__factoryClass.push(function (id, manual) {

        if (id === false && manual) return;

        if (!_instances) {
          _instances = {};
        }

        if (_instances[id]) {
          return _instances[id];
        } else {
          _instances[id] = this;
        }
      });

      /**
       * @param float cmdFunction
       * @param float failure
       */
      _myTrait_.addCommands = function (cmdFunction, failure) {

        if (this.isArray(cmdFunction)) {
          var me = this;
          cmdFunction.forEach(function (c) {
            me.addCommands(c);
          });
          return this;
        }

        this._commands.push({
          fnCmd: cmdFunction,
          fnFail: failure,
          async: true
        });
      };

      if (_myTrait_.__traitInit && !_myTrait_.hasOwnProperty("__traitInit")) _myTrait_.__traitInit = _myTrait_.__traitInit.slice();
      if (!_myTrait_.__traitInit) _myTrait_.__traitInit = [];
      _myTrait_.__traitInit.push(function (myId, manual) {

        if (!this._commands) {
          this._commands = [];
          this.waitingList = [];
          this._index = 0;
        }

        var me = this;
        if (!manual) {
          var _secStep = function _secStep() {
            me.step();
          };
          var is_node = new Function("try { return this === global; } catch(e) { return false; }")();
          if (is_node) {
            later().onFrame(_secStep);
          } else {
            later().every(1 / 30, _secStep);
          }
        }
      });

      /**
       * @param float t
       */
      _myTrait_.step = function (t) {
        var i = this._index,
            len = this._commands.length;

        if (i == len) return;

        var first = _promise(),
            currentProm = first,
            myPromise = _promise(),
            me = this;

        while (i < len) {
          var fn = this._commands[i];
          (function (fn) {
            currentProm = currentProm.then(function () {
              var p = _promise();
              fn.fnCmd(function (res) {
                p.resolve(true);
              }, function (failReason) {
                p.resolve(true);
                if (fn.fnFail) fn.fnFail(failReason);
              });

              return p;
            }).fail(function (reason) {
              if (fn.fnFail) fn.fnFail(reason);
            });
          })(fn);
          this._index++;
          i++;
        }

        currentProm.then(function () {
          me.waitingList.shift(); // remvoe this promise from the queque
          myPromise.resolve(true);
          if (me.waitingList.length) {
            var newP = me.waitingList[0];
            newP.resolve(true);
          }
        }).fail(function (m) {});

        this.waitingList.push(first);
        if (this.waitingList.length == 1) {
          first.resolve(true);
        }
        return myPromise;
      };
    })(this);
  };

  var sequenceStepper = function sequenceStepper(a, b, c, d, e, f, g, h) {
    var m = this,
        res;
    if (m instanceof sequenceStepper) {
      var args = [a, b, c, d, e, f, g, h];
      if (m.__factoryClass) {
        m.__factoryClass.forEach(function (initF) {
          res = initF.apply(m, args);
        });
        if (typeof res == "function") {
          if (res._classInfo.name != sequenceStepper._classInfo.name) return new res(a, b, c, d, e, f, g, h);
        } else {
          if (res) return res;
        }
      }
      if (m.__traitInit) {
        m.__traitInit.forEach(function (initF) {
          initF.apply(m, args);
        });
      } else {
        if (typeof m.init == "function") m.init.apply(m, args);
      }
    } else return new sequenceStepper(a, b, c, d, e, f, g, h);
  };

  sequenceStepper._classInfo = {
    name: "sequenceStepper"
  };
  sequenceStepper.prototype = new sequenceStepper_prototype();

  var authFuzz_prototype = function authFuzz_prototype() {

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
        return Object.prototype.toString.call(t) === "[object Array]";
      };

      /**
       * @param float fn
       */
      _myTrait_.isFunction = function (fn) {
        return Object.prototype.toString.call(fn) == "[object Function]";
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
       * @param float list
       * @param float ignoreGroups
       */
      _myTrait_._getGroupNames = function (list, ignoreGroups) {
        var orig = _promise(),
            reader = orig,
            res = [],
            folder = this._groups;

        list.forEach(function (id) {

          if (ignoreGroups.indexOf(id) >= 0) {
            res.push({
              id: id,
              name: id
            });
            return;
          }

          reader = reader.then(function () {
            return folder.readFile(id);
          }).then(function (groupName) {
            res.push({
              id: id,
              name: groupName
            });
            return res;
          }).fail(function (m) {
            console.error("Error reading group index with " + m + " FOR " + id);
          });
        });
        reader = reader.then(function () {
          return res;
        });
        orig.resolve(true);

        return reader;
      };

      /**
       * @param string userId
       * @param float groupName
       */
      _myTrait_.addUserToGroup = function (userId, groupName) {
        var me = this;
        var udata = me._udata;

        return _promise(function (result) {
          udata.readFile(userId).then(function (jsonData) {

            var data = JSON.parse(jsonData);

            if (data.groups.indexOf(groupName) < 0) data.groups.push(groupName);

            return udata.writeFile(userId, JSON.stringify(data));
          }).then(function () {
            result({
              result: true,
              text: "User added to the group"
            });
          });
        });
      };

      /**
       * @param string userId
       * @param string newPassword
       */
      _myTrait_.changePassword = function (userId, newPassword) {
        var local = this._users,
            me = this;
        var udata = me._udata;

        return _promise(function (result) {
          udata.readFile(userId).then(function (jsonData) {
            var data = JSON.parse(jsonData);
            // me.hash(password)+":"+id+":"+domain
            return local.writeFile(data.hash, me.hash(newPassword) + ":" + userId + ":" + data.domain);
          }).then(function () {
            result({
              result: true,
              text: "Password changed"
            });
          }).fail(function () {
            result([]);
          });
        });
      };

      /**
       * @param string userId
       * @param float newUsername
       * @param float newDomain
       */
      _myTrait_.changeUsername = function (userId, newUsername, newDomain) {
        var local = this._users,
            me = this;
        var udata = me._udata;

        return _promise(function (result) {
          var hashData, data, newHash, domain;
          udata.readFile(userId).then(function (jsonData) {
            data = JSON.parse(jsonData);
            // me.hash(password)+":"+id+":"+domain
            domain = newDomain || data.domain;
            return local.readFile(data.hash);
          }).then(function (oldData) {
            hashData = oldData;
            if (hashData) {
              return local.removeFile(data.hash);
            }
          }).then(function () {
            if (hashData) {
              newHash = me.hash(newUsername + ":" + domain);
              return local.writeFile(newHash, hashData);
            }
          }).then(function () {
            if (hashData) {
              data.hash = newHash;
              data.userName = newUsername;
              data.domain = domain;
              return udata.writeFile(userId, JSON.stringify(data));
            }
          }).then(function () {
            if (hashData) {
              result({
                result: true,
                text: "Username changed"
              });
            } else {
              result({
                result: false,
                text: "Could not change the username"
              });
            }
          }).fail(function () {
            result({
              result: false,
              text: "Could not change the username"
            });
          });
        });
      };

      /**
       * @param float userName
       * @param float password
       * @param float id
       * @param float domain
       */
      _myTrait_.createUser = function (userName, password, id, domain) {
        // username is used to find the user based on the username...
        // userID should be

        domain = domain || "";
        if (!id) id = this.guid();

        var userHash = this.hash(userName + ":" + domain);
        var me = this;

        // store user information into object, which is serialized
        var userData = {
          userName: userName,
          domain: domain,
          hash: userHash,
          groups: []
        };

        return _promise(function (result) {
          me.then(function () {
            var local = me._users;
            var udata = me._udata;

            local.isFile(userHash).then(function (is_file) {
              if (!is_file) {
                local.writeFile(userHash, me.hash(password) + ":" + id + ":" + domain).then(function () {
                  return udata.writeFile(id, JSON.stringify(userData));
                }).then(function () {
                  result({
                    result: true,
                    userId: id
                  });
                });
              } else {
                local.readFile(userHash).then(function (data) {
                  var parts = data.split(":");
                  result({
                    result: true,
                    userId: parts[1]
                  });
                });
              }
            });
          });
        });
      };

      /**
       * @param string userId
       */
      _myTrait_.getUserData = function (userId) {
        var me = this;
        var udata = me._udata;

        return _promise(function (result) {
          udata.readFile(userId).then(function (jsonData) {
            var data = JSON.parse(jsonData);
            result(data);
          }).fail(function () {
            result(null);
          });
        });
      };

      /**
       * @param float userId
       */
      _myTrait_.getUserGroups = function (userId) {
        var local = this._users,
            me = this;

        // local and udata...
        var local = me._users;
        var udata = me._udata;

        return _promise(function (result) {
          udata.readFile(userId).then(function (jsonData) {
            var data = JSON.parse(jsonData);
            result(data.groups);
          }).fail(function () {
            result([]);
          });
        });
      };

      /**
       * @param string value
       */
      _myTrait_.hash = function (value) {
        return _sha3().sha3_256(value + this._salt);
      };

      if (_myTrait_.__traitInit && !_myTrait_.hasOwnProperty("__traitInit")) _myTrait_.__traitInit = _myTrait_.__traitInit.slice();
      if (!_myTrait_.__traitInit) _myTrait_.__traitInit = [];
      _myTrait_.__traitInit.push(function (fileSystem, hashSalt) {
        if (!hashSalt) {
          this._salt = "31337"; // just use some kind of salting if no provided
        } else {
          this._salt = hashSalt;
        }

        this._fs = fileSystem;
        var me = this;

        this._fs.createDir("users").then(function () {
          return me._fs.createDir("groups");
        }).then(function () {
          return me._fs.createDir("domains");
        }).then(function () {
          return me._fs.createDir("udata");
        }).then(function () {
          me._users = fileSystem.getFolder("users");
          me._groups = fileSystem.getFolder("groups");
          me._domains = fileSystem.getFolder("domains");
          me._udata = fileSystem.getFolder("udata");
          me.resolve(true);
        });
      });

      /**
       * @param float user
       * @param float password
       * @param float domain
       */
      _myTrait_.login = function (user, password, domain) {
        var me = this;

        if (!domain) domain = "";
        var userHash = this.hash(user + ":" + domain);

        return _promise(function (result) {
          me.then(function () {
            var local = me._users,
                udata = me._udata;
            var bOk = false,
                user_id;
            local.readFile(userHash).then(function (value) {

              var parts = value.split(":");
              var pwHash = parts[0],
                  uid = parts[1];

              var ok = pwHash == me.hash(password);
              if (ok) {
                bOk = true;
                user_id = uid;
                return udata.readFile(uid);
                // result( { result : true,  userId : uid,  text : "Login successful"} );
              } else {}
            }).then(function (userData) {
              if (bOk) {
                userData = JSON.parse(userData);
                result({
                  result: true,
                  userId: user_id,
                  groups: userData.groups,
                  text: "Login successful"
                });
              } else {
                result({
                  result: false,
                  text: "Login failed"
                });
              }
            }).fail(function () {
              result({
                result: false,
                text: "Login failed"
              });
            });
          });
        });
      };

      /**
       * @param string userId
       * @param string groupName
       */
      _myTrait_.removeUserGroup = function (userId, groupName) {
        var me = this;
        var udata = me._udata;

        return _promise(function (result) {
          // The user ID... file??
          udata.readFile(userId).then(function (jsonData) {

            var data = JSON.parse(jsonData);

            var i = data.groups.indexOf(groupName);
            if (data.groups.indexOf(groupName) >= 0) data.groups.splice(i, 1);

            return udata.writeFile(userId, JSON.stringify(data));
          }).then(function () {
            result({
              result: true,
              text: "Removed user from group"
            });
          });
        });
      };
    })(this);
  };

  var authFuzz = function authFuzz(a, b, c, d, e, f, g, h) {
    var m = this,
        res;
    if (m instanceof authFuzz) {
      var args = [a, b, c, d, e, f, g, h];
      if (m.__factoryClass) {
        m.__factoryClass.forEach(function (initF) {
          res = initF.apply(m, args);
        });
        if (typeof res == "function") {
          if (res._classInfo.name != authFuzz._classInfo.name) return new res(a, b, c, d, e, f, g, h);
        } else {
          if (res) return res;
        }
      }
      if (m.__traitInit) {
        m.__traitInit.forEach(function (initF) {
          initF.apply(m, args);
        });
      } else {
        if (typeof m.init == "function") m.init.apply(m, args);
      }
    } else return new authFuzz(a, b, c, d, e, f, g, h);
  };

  authFuzz_prototype.prototype = _promise.prototype;

  authFuzz._classInfo = {
    name: "authFuzz"
  };
  authFuzz.prototype = new authFuzz_prototype();

  (function () {
    if (typeof define !== "undefined" && define !== null && define.amd != null) {
      __amdDefs__["authFuzz"] = authFuzz;
      this.authFuzz = authFuzz;
    } else if (typeof module !== "undefined" && module !== null && module.exports != null) {
      module.exports["authFuzz"] = authFuzz;
    } else {
      this.authFuzz = authFuzz;
    }
  }).call(new Function("return this")());

  var _sha3_prototype = function _sha3_prototype() {

    (function (_myTrait_) {
      var HEX_CHARS;
      var KECCAK_PADDING;
      var PADDING;
      var SHIFT;
      var RC;
      var blocks;
      var s;

      // Initialize static variables here...

      /**
       * @param float t
       */
      _myTrait_._initSha = function (t) {
        if (RC) return;

        HEX_CHARS = "0123456789abcdef".split("");
        KECCAK_PADDING = [1, 256, 65536, 16777216];
        PADDING = [6, 1536, 393216, 100663296];
        SHIFT = [0, 8, 16, 24];
        RC = [1, 0, 32898, 0, 32906, 2147483648, 2147516416, 2147483648, 32907, 0, 2147483649, 0, 2147516545, 2147483648, 32777, 2147483648, 138, 0, 136, 0, 2147516425, 0, 2147483658, 0, 2147516555, 0, 139, 2147483648, 32905, 2147483648, 32771, 2147483648, 32770, 2147483648, 128, 2147483648, 32778, 0, 2147483658, 2147483648, 2147516545, 2147483648, 32896, 2147483648, 2147483649, 0, 2147516424, 2147483648];

        blocks = [], s = [];
      };

      if (_myTrait_.__traitInit && !_myTrait_.hasOwnProperty("__traitInit")) _myTrait_.__traitInit = _myTrait_.__traitInit.slice();
      if (!_myTrait_.__traitInit) _myTrait_.__traitInit = [];
      _myTrait_.__traitInit.push(function (t) {
        this._initSha();
      });

      /**
       * @param float message
       * @param float bits
       * @param float padding
       */
      _myTrait_.keccak = function (message, bits, padding) {
        var notString = typeof message != "string";
        if (notString && message.constructor == root.ArrayBuffer) {
          message = new Uint8Array(message);
        }

        if (bits === undefined) {
          bits = 512;
          padding = KECCAK_PADDING;
        }

        var block,
            code,
            end = false,
            index = 0,
            start = 0,
            length = message.length,
            n,
            i,
            h,
            l,
            c0,
            c1,
            c2,
            c3,
            c4,
            c5,
            c6,
            c7,
            c8,
            c9,
            b0,
            b1,
            b2,
            b3,
            b4,
            b5,
            b6,
            b7,
            b8,
            b9,
            b10,
            b11,
            b12,
            b13,
            b14,
            b15,
            b16,
            b17,
            b18,
            b19,
            b20,
            b21,
            b22,
            b23,
            b24,
            b25,
            b26,
            b27,
            b28,
            b29,
            b30,
            b31,
            b32,
            b33,
            b34,
            b35,
            b36,
            b37,
            b38,
            b39,
            b40,
            b41,
            b42,
            b43,
            b44,
            b45,
            b46,
            b47,
            b48,
            b49;
        var blockCount = (1600 - bits * 2) / 32;
        var byteCount = blockCount * 4;

        for (i = 0; i < 50; ++i) {
          s[i] = 0;
        }

        block = 0;
        do {
          blocks[0] = block;
          for (i = 1; i < blockCount + 1; ++i) {
            blocks[i] = 0;
          }
          if (notString) {
            for (i = start; index < length && i < byteCount; ++index) {
              blocks[i >> 2] |= message[index] << SHIFT[i++ & 3];
            }
          } else {
            for (i = start; index < length && i < byteCount; ++index) {
              code = message.charCodeAt(index);
              if (code < 128) {
                blocks[i >> 2] |= code << SHIFT[i++ & 3];
              } else if (code < 2048) {
                blocks[i >> 2] |= (192 | code >> 6) << SHIFT[i++ & 3];
                blocks[i >> 2] |= (128 | code & 63) << SHIFT[i++ & 3];
              } else if (code < 55296 || code >= 57344) {
                blocks[i >> 2] |= (224 | code >> 12) << SHIFT[i++ & 3];
                blocks[i >> 2] |= (128 | code >> 6 & 63) << SHIFT[i++ & 3];
                blocks[i >> 2] |= (128 | code & 63) << SHIFT[i++ & 3];
              } else {
                code = 65536 + ((code & 1023) << 10 | message.charCodeAt(++index) & 1023);
                blocks[i >> 2] |= (240 | code >> 18) << SHIFT[i++ & 3];
                blocks[i >> 2] |= (128 | code >> 12 & 63) << SHIFT[i++ & 3];
                blocks[i >> 2] |= (128 | code >> 6 & 63) << SHIFT[i++ & 3];
                blocks[i >> 2] |= (128 | code & 63) << SHIFT[i++ & 3];
              }
            }
          }
          start = i - byteCount;
          if (index == length) {
            blocks[i >> 2] |= padding[i & 3];
            ++index;
          }
          block = blocks[blockCount];
          if (index > length && i < byteCount) {
            blocks[blockCount - 1] |= 2147483648;
            end = true;
          }

          for (i = 0; i < blockCount; ++i) {
            s[i] ^= blocks[i];
          }

          for (n = 0; n < 48; n += 2) {
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

            h = c8 ^ (c2 << 1 | c3 >>> 31);
            l = c9 ^ (c3 << 1 | c2 >>> 31);
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
            h = c0 ^ (c4 << 1 | c5 >>> 31);
            l = c1 ^ (c5 << 1 | c4 >>> 31);
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
            h = c2 ^ (c6 << 1 | c7 >>> 31);
            l = c3 ^ (c7 << 1 | c6 >>> 31);
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
            h = c4 ^ (c8 << 1 | c9 >>> 31);
            l = c5 ^ (c9 << 1 | c8 >>> 31);
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
            h = c6 ^ (c0 << 1 | c1 >>> 31);
            l = c7 ^ (c1 << 1 | c0 >>> 31);
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
            b32 = s[11] << 4 | s[10] >>> 28;
            b33 = s[10] << 4 | s[11] >>> 28;
            b14 = s[20] << 3 | s[21] >>> 29;
            b15 = s[21] << 3 | s[20] >>> 29;
            b46 = s[31] << 9 | s[30] >>> 23;
            b47 = s[30] << 9 | s[31] >>> 23;
            b28 = s[40] << 18 | s[41] >>> 14;
            b29 = s[41] << 18 | s[40] >>> 14;
            b20 = s[2] << 1 | s[3] >>> 31;
            b21 = s[3] << 1 | s[2] >>> 31;
            b2 = s[13] << 12 | s[12] >>> 20;
            b3 = s[12] << 12 | s[13] >>> 20;
            b34 = s[22] << 10 | s[23] >>> 22;
            b35 = s[23] << 10 | s[22] >>> 22;
            b16 = s[33] << 13 | s[32] >>> 19;
            b17 = s[32] << 13 | s[33] >>> 19;
            b48 = s[42] << 2 | s[43] >>> 30;
            b49 = s[43] << 2 | s[42] >>> 30;
            b40 = s[5] << 30 | s[4] >>> 2;
            b41 = s[4] << 30 | s[5] >>> 2;
            b22 = s[14] << 6 | s[15] >>> 26;
            b23 = s[15] << 6 | s[14] >>> 26;
            b4 = s[25] << 11 | s[24] >>> 21;
            b5 = s[24] << 11 | s[25] >>> 21;
            b36 = s[34] << 15 | s[35] >>> 17;
            b37 = s[35] << 15 | s[34] >>> 17;
            b18 = s[45] << 29 | s[44] >>> 3;
            b19 = s[44] << 29 | s[45] >>> 3;
            b10 = s[6] << 28 | s[7] >>> 4;
            b11 = s[7] << 28 | s[6] >>> 4;
            b42 = s[17] << 23 | s[16] >>> 9;
            b43 = s[16] << 23 | s[17] >>> 9;
            b24 = s[26] << 25 | s[27] >>> 7;
            b25 = s[27] << 25 | s[26] >>> 7;
            b6 = s[36] << 21 | s[37] >>> 11;
            b7 = s[37] << 21 | s[36] >>> 11;
            b38 = s[47] << 24 | s[46] >>> 8;
            b39 = s[46] << 24 | s[47] >>> 8;
            b30 = s[8] << 27 | s[9] >>> 5;
            b31 = s[9] << 27 | s[8] >>> 5;
            b12 = s[18] << 20 | s[19] >>> 12;
            b13 = s[19] << 20 | s[18] >>> 12;
            b44 = s[29] << 7 | s[28] >>> 25;
            b45 = s[28] << 7 | s[29] >>> 25;
            b26 = s[38] << 8 | s[39] >>> 24;
            b27 = s[39] << 8 | s[38] >>> 24;
            b8 = s[48] << 14 | s[49] >>> 18;
            b9 = s[49] << 14 | s[48] >>> 18;

            s[0] = b0 ^ ~b2 & b4;
            s[1] = b1 ^ ~b3 & b5;
            s[10] = b10 ^ ~b12 & b14;
            s[11] = b11 ^ ~b13 & b15;
            s[20] = b20 ^ ~b22 & b24;
            s[21] = b21 ^ ~b23 & b25;
            s[30] = b30 ^ ~b32 & b34;
            s[31] = b31 ^ ~b33 & b35;
            s[40] = b40 ^ ~b42 & b44;
            s[41] = b41 ^ ~b43 & b45;
            s[2] = b2 ^ ~b4 & b6;
            s[3] = b3 ^ ~b5 & b7;
            s[12] = b12 ^ ~b14 & b16;
            s[13] = b13 ^ ~b15 & b17;
            s[22] = b22 ^ ~b24 & b26;
            s[23] = b23 ^ ~b25 & b27;
            s[32] = b32 ^ ~b34 & b36;
            s[33] = b33 ^ ~b35 & b37;
            s[42] = b42 ^ ~b44 & b46;
            s[43] = b43 ^ ~b45 & b47;
            s[4] = b4 ^ ~b6 & b8;
            s[5] = b5 ^ ~b7 & b9;
            s[14] = b14 ^ ~b16 & b18;
            s[15] = b15 ^ ~b17 & b19;
            s[24] = b24 ^ ~b26 & b28;
            s[25] = b25 ^ ~b27 & b29;
            s[34] = b34 ^ ~b36 & b38;
            s[35] = b35 ^ ~b37 & b39;
            s[44] = b44 ^ ~b46 & b48;
            s[45] = b45 ^ ~b47 & b49;
            s[6] = b6 ^ ~b8 & b0;
            s[7] = b7 ^ ~b9 & b1;
            s[16] = b16 ^ ~b18 & b10;
            s[17] = b17 ^ ~b19 & b11;
            s[26] = b26 ^ ~b28 & b20;
            s[27] = b27 ^ ~b29 & b21;
            s[36] = b36 ^ ~b38 & b30;
            s[37] = b37 ^ ~b39 & b31;
            s[46] = b46 ^ ~b48 & b40;
            s[47] = b47 ^ ~b49 & b41;
            s[8] = b8 ^ ~b0 & b2;
            s[9] = b9 ^ ~b1 & b3;
            s[18] = b18 ^ ~b10 & b12;
            s[19] = b19 ^ ~b11 & b13;
            s[28] = b28 ^ ~b20 & b22;
            s[29] = b29 ^ ~b21 & b23;
            s[38] = b38 ^ ~b30 & b32;
            s[39] = b39 ^ ~b31 & b33;
            s[48] = b48 ^ ~b40 & b42;
            s[49] = b49 ^ ~b41 & b43;

            s[0] ^= RC[n];
            s[1] ^= RC[n + 1];
          }
        } while (!end);

        var hex = "";

        for (i = 0, n = bits / 32; i < n; ++i) {
          h = s[i];
          hex += HEX_CHARS[h >> 4 & 15] + HEX_CHARS[h & 15] + HEX_CHARS[h >> 12 & 15] + HEX_CHARS[h >> 8 & 15] + HEX_CHARS[h >> 20 & 15] + HEX_CHARS[h >> 16 & 15] + HEX_CHARS[h >> 28 & 15] + HEX_CHARS[h >> 24 & 15];
        }
        return hex;
      };

      /**
       * @param string message
       */
      _myTrait_.keccak_224 = function (message) {
        return this.keccak(message, 224, KECCAK_PADDING);
      };

      /**
       * @param string message
       */
      _myTrait_.keccak_256 = function (message) {
        return this.keccak(message, 256, KECCAK_PADDING);
      };

      /**
       * @param string message
       */
      _myTrait_.keccak_512 = function (message) {
        return this.keccak(message, 512, KECCAK_PADDING);
      };

      /**
       * @param string message
       */
      _myTrait_.sha3_224 = function (message) {
        return this.keccak(message, 224, PADDING);
      };

      /**
       * @param string message
       */
      _myTrait_.sha3_256 = function (message) {
        return this.keccak(message, 256, PADDING);
      };

      /**
       * @param string message
       */
      _myTrait_.sha3_512 = function (message) {
        return this.keccak(message, 512, PADDING);
      };
    })(this);
  };

  var _sha3 = function _sha3(a, b, c, d, e, f, g, h) {
    var m = this,
        res;
    if (m instanceof _sha3) {
      var args = [a, b, c, d, e, f, g, h];
      if (m.__factoryClass) {
        m.__factoryClass.forEach(function (initF) {
          res = initF.apply(m, args);
        });
        if (typeof res == "function") {
          if (res._classInfo.name != _sha3._classInfo.name) return new res(a, b, c, d, e, f, g, h);
        } else {
          if (res) return res;
        }
      }
      if (m.__traitInit) {
        m.__traitInit.forEach(function (initF) {
          initF.apply(m, args);
        });
      } else {
        if (typeof m.init == "function") m.init.apply(m, args);
      }
    } else return new _sha3(a, b, c, d, e, f, g, h);
  };

  _sha3._classInfo = {
    name: "_sha3"
  };
  _sha3.prototype = new _sha3_prototype();

  (function () {
    if (typeof define !== "undefined" && define !== null && define.amd != null) {
      __amdDefs__["_sha3"] = _sha3;
      this._sha3 = _sha3;
    } else if (typeof module !== "undefined" && module !== null && module.exports != null) {
      module.exports["_sha3"] = _sha3;
    } else {
      this._sha3 = _sha3;
    }
  }).call(new Function("return this")());

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
          if (cmd.action == "insertText") {
            newList.push([1, range.start.row, range.start.column, range.end.row, range.end.column, cmd.text]);
          }
          if (cmd.action == "removeText") {
            newList.push([2, range.start.row, range.start.column, range.end.row, range.end.column, cmd.text]);
          }
          if (cmd.action == "insertLines") {
            newList.push([3, range.start.row, range.start.column, range.end.row, range.end.column, cmd.lines]);
          }
          if (cmd.action == "removeLines") {
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
          if (cmd.action == "insert" && cmd.lines.length == 1) {
            newList.push([1, range.start.row, range.start.column, range.end.row, range.end.column, cmd.lines[0]]);
          }
          if (cmd.action == "remove" && cmd.lines.length == 1) {
            newList.push([2, range.start.row, range.start.column, range.end.row, range.end.column, cmd.lines[0]]);
          }
          if (cmd.action == "insert" && cmd.lines.length > 1) {
            newList.push([3, range.start.row, range.start.column, range.end.row, range.end.column, cmd.lines]);
          }
          if (cmd.action == "remove" && cmd.lines.length > 1) {
            newList.push([4, range.start.row, range.start.column, range.end.row, range.end.column, cmd.lines, cmd.nl]);
          }
        });

        return newList;

        /*
        {"action":"insertText","range":{"start":{"row":0,"column":0},
        "end":{"row":0,"column":1}},"text":"d"}
        */
      };

      if (_myTrait_.__traitInit && !_myTrait_.hasOwnProperty("__traitInit")) _myTrait_.__traitInit = _myTrait_.__traitInit.slice();
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
            _convert = ["", "insertText", "removeText", "insertLines", "removeLines"];

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
          if (cmd[0] == 4) c.nl = cmd[6] || "\n";
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
            _convert = ["", "insert", "remove", "insert", "remove"];
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
          if (cmd[0] == 4) c.nl = cmd[6] || "\n";
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
            if (cmd[5] == "\n") {
              // add the newline can be a bit tricky
              var line = lines.item(row);
              if (!line) {
                lines.insertAt(row, {
                  text: ""
                });
                lines.insertAt(row + 1, {
                  text: ""
                });
              } else {
                var txt = line.text();
                line.text(txt.slice(0, col));
                var newLine = {
                  text: txt.slice(col) || ""
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
            if (cmd[5] == "\n") {
              // removing the newline can be a bit tricky
              // lines[row]
              var thisLine = lines.item(row),
                  nextLine = lines.item(row + 1);

              // lines[row] = thisLine + nextLine;
              // lines.splice(row+1, 1); // remove the line...
              var txt1 = "",
                  txt2 = "";
              if (thisLine) txt1 = thisLine.text();
              if (nextLine) txt2 = nextLine.text();
              if (!thisLine) {
                lines.insertAt(row, {
                  text: ""
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

        if (!cmdList || typeof str == "undefined") {
          return "";
        }
        str = str + "";

        var lines = str.split("\n");

        cmdList.forEach(function (cmd) {
          var row = cmd[1],
              col = cmd[2],
              endRow = cmd[3],
              endCol = cmd[4];
          if (cmd[0] == 1) {
            if (cmd[5] == "\n") {
              // add the newline can be a bit tricky
              var line = lines[row] || "";
              lines[row] = line.slice(0, col);
              var newLine = line.slice(col) || "";
              lines.splice(row + 1, 0, newLine);
            } else {
              var line = lines[row] || "";
              lines[row] = line.slice(0, col) + cmd[5] + line.slice(col);
            }
          }
          if (cmd[0] == 2) {
            if (cmd[5] == "\n") {
              // removing the newline can be a bit tricky
              // lines[row]
              var thisLine = lines[row] || "",
                  nextLine = lines[row + 1] || "";
              lines[row] = thisLine + nextLine;
              lines.splice(row + 1, 1); // remove the line...
            } else {
              var line = lines[row] || "";
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

        return lines.join("\n");
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
        if (typeof res == "function") {
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
        if (typeof m.init == "function") m.init.apply(m, args);
      }
    } else return new aceCmdConvert(a, b, c, d, e, f, g, h);
  };

  aceCmdConvert._classInfo = {
    name: "aceCmdConvert"
  };
  aceCmdConvert.prototype = new aceCmdConvert_prototype();

  (function () {
    if (typeof define !== "undefined" && define !== null && define.amd != null) {
      __amdDefs__["aceCmdConvert"] = aceCmdConvert;
      this.aceCmdConvert = aceCmdConvert;
    } else if (typeof module !== "undefined" && module !== null && module.exports != null) {
      module.exports["aceCmdConvert"] = aceCmdConvert;
    } else {
      this.aceCmdConvert = aceCmdConvert;
    }
  }).call(new Function("return this")());

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

        if (typeof t == "undefined") return this.__isA;

        return Object.prototype.toString.call(t) === "[object Array]";
      };

      /**
       * @param float fn
       */
      _myTrait_.isFunction = function (fn) {
        return Object.prototype.toString.call(fn) == "[object Function]";
      };

      /**
       * @param float t
       */
      _myTrait_.isObject = function (t) {

        if (typeof t == "undefined") return this.__isO;

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

      if (_myTrait_.__traitInit && !_myTrait_.hasOwnProperty("__traitInit")) _myTrait_.__traitInit = _myTrait_.__traitInit.slice();
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
            if (c[0] == "a") {
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
              if (typeof b == "undefined") {
                while (si < slen) {
                  cmds.push(["b", indexes[s], indexes[lastb]]);
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
                cmds.push(["a", indexes[s], indexes[b]]);
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
        if (typeof res == "function") {
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
        if (typeof m.init == "function") m.init.apply(m, args);
      }
    } else return new diffEngine(a, b, c, d, e, f, g, h);
  };

  diffEngine._classInfo = {
    name: "diffEngine"
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
        return Object.prototype.toString.call(fn) == "[object Function]";
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
        if (typeof obj.data[prop] != "string") return false;

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
          text: "Object ID was null or undefined"
        };

        var hash = this._getObjectHash();
        if (hash[objId]) return {
          error: 22,
          cmd: a,
          text: "Array with ID was already created"
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
          text: "Object ID was null or undefined"
        };

        var hash = this._getObjectHash();

        // not error, skip the cmd
        if (hash[objId]) return {
          error: 12,
          cmd: a,
          text: "Object ID was already created"
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
          text: "diff-match-patch not initialized"
        };

        var obj = this._find(a[4]),
            prop = a[1];

        if (!obj) return {
          error: 41,
          cmd: a,
          text: "Did not find object with ID (" + a[4] + ") "
        };

        if (!prop) return {
          error: 42,
          cmd: a,
          text: "The property was not defined (" + a[1] + ") "
        };

        var oldValue = obj.data[prop];
        if (this.isObject(oldValue) || this.isArray(oldValue)) return {
          error: 145,
          cmd: a,
          text: "Trying to apply text diff/patch to  Object or Array"
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
          text: "patch_apply failed"
        };
        var list = newValue[1];
        if (!list) return {
          error: 146,
          cmd: a,
          text: "patch_apply failed"
        };
        for (var i = 0; i < list.length; i++) {
          if (!list[i]) return {
            error: 146,
            cmd: a,
            text: "patch_apply failed"
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
            prop = "*",
            len = obj.data.length,
            targetObj;

        if (!obj) return {
          error: 2,
          cmd: 1,
          text: "Object with ID (" + a[4] + ") did not exist"
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
            text: "The old index was not what expected: " + oldIndex + " cmd have " + a[3]
          };
        }

        if (!targetObj) {
          return {
            error: 122,
            cmd: a,
            text: "Object to be moved (" + a[1] + ") was not in the array"
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
          text: "Target index (" + targetIndex + ") was not a number"
        };

        if (obj.data.length <= i || i < 0) return {
          error: 124,
          cmd: a,
          text: "Invalid original index (" + i + ") given"
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
        prop = "*",
            index = parentObj.data.length; // might check if valid...

        if (!parentObj) return {
          error: 71,
          cmd: a,
          text: "Did not find object with ID (" + a[4] + ") "
        };

        if (!insertedObj) return {
          error: 72,
          cmd: a,
          text: "Did not find object with ID (" + a[2] + ") "
        };

        // NOTE: deny inserting object which already has been inserted
        if (insertedObj.__p) {
          if (insertedObj.__p == parentObj.__id) {
            // nothing needs to be done here, unnecessary command though
            //console.log("WARNING : Unnecessary pushToArray");
            //console.log(a);
            return true;
          }
          return {
            error: 73,
            cmd: a,
            text: "The object already had a parent - need to remove first (" + a[2] + ") "
          };
        }
        if (isNaN(toIndex)) return {
          error: 74,
          cmd: a,
          text: "toIndex was not a number"
        };
        if (!this.isArray(parentObj.data)) return {
          error: 75,
          cmd: a,
          text: "Target Object was not an array"
        };
        if (toIndex > parentObj.data.length || toIndex < 0) return {
          error: 76,
          cmd: a,
          text: "toIndex out of range, parent data len " + parentObj.data.length
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
            prop = "*";

        if (!parentObj) return {
          error: 81,
          cmd: a,
          text: "Did not find object with ID (" + a[4] + ") "
        };

        if (!removedItem) return {
          error: 82,
          cmd: a,
          text: "Did not find object with ID (" + a[2] + ") "
        };

        // NOTE: deny inserting object which already has been inserted
        if (!removedItem.__p) return {
          error: 83,
          cmd: a,
          text: "The removed item did not have a parent (" + a[2] + ") "
        };

        var index = parentObj.data.indexOf(removedItem); // might check if valid...
        if (isNaN(oldPosition)) return {
          error: 84,
          cmd: a,
          text: "oldPosition was not a number"
        };

        if (oldPosition != index) {
          // if old position is not the same as current index
          a[1] = index;
        }

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

        if (prop == "data") return false;
        if (prop == "__id") return false;

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
          text: "Did not find object with ID (" + a[4] + ") "
        };

        if (!prop) return {
          error: 42,
          cmd: a,
          text: "The property was not defined (" + a[1] + ") "
        };

        var oldValue = obj.data[prop];

        if (oldValue == a[2]) return {
          error: 43,
          cmd: a,
          text: "Trying to set the same value to the object twice"
        };

        if (typeof oldValue == "undefined" || oldValue === null) {
          if (typeof a[3] != "undefined" && a[3] !== null) return {
            error: 44,
            cmd: a,
            text: "The old value " + oldValue + " was not the same as the commands old value"
          };
        } else {

          if (this.isObject(oldValue) || this.isArray(oldValue)) return {
            error: 45,
            cmd: a,
            text: "Trying to set Object or Array value to a scalar property"
          };

          if (oldValue != a[3]) return {
            error: 44,
            cmd: a,
            text: "The old value " + oldValue + " was not the same as the commands old value"
          };
        }

        obj.data[prop] = a[2]; // value is now set...

        if (!this._options.disableWorkers) this._cmd(a, obj, null);

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
          text: "Did not find object with ID (" + a[4] + ") "
        };

        if (!prop) return {
          error: 52,
          cmd: a,
          text: "The property was not defined (" + a[1] + ") "
        };

        // if(!obj || !prop)   return false;
        // if(!setObj)         return false;

        if (!setObj) return {
          error: 53,
          cmd: a,
          text: "Could not find the Object to be set with ID (" + a[2] + ") "
        };

        if (typeof obj.data[prop] != "undefined") return {
          error: 54,
          cmd: a,
          text: "The property (" + a[1] + ") was already set, try unsetting first "
        };
        if (!this.isObject(obj.data) || this.isArray(obj.data)) return {
          error: 55,
          cmd: a,
          text: "The object (" + a[2] + ") was not of type Object "
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
          text: "Did not find object with ID (" + a[4] + ") "
        };

        if (!prop) return {
          error: 102,
          cmd: a,
          text: "The property was not defined (" + a[1] + ") "
        };

        if (this.isArray(obj.data[prop])) return {
          error: 103,
          cmd: a,
          text: "The Object data was Array (" + a[4] + ") "
        };

        delete obj.data[prop];
        // if(!isRemote) this.writeCommand(a);

        return true;
      };

      /**
       * @param Object a  - The command
       * @param Boolean isRemote  - Is remote command
       * @param Boolean isRedo  - is Redo command
       */
      _myTrait_._fastExec = function (a, isRemote, isRedo) {

        if (a) {
          var c = _cmds[a[0]];
          if (c) {
            var rv = c.apply(this, [a, isRemote]);
            if (rv === true && !isRedo) {
              this.writeLocalJournal(a);
            }
            return rv;
          } else {
            return {
              error: 199,
              text: "Invalid command"
            };
          }
        }
      };

      /**
       * @param float obj
       * @param float prop
       */
      _myTrait_._fireListener = function (obj, prop) {
        if (_listeners) {
          var lName = obj.__id + "::" + prop,
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
          text: "diff-match-patch not initialized"
        };

        var obj = this._find(a[4]),
            prop = a[1];

        if (!obj) return {
          error: 41,
          cmd: a,
          text: "Did not find object with ID (" + a[4] + ") "
        };

        if (!prop) return {
          error: 42,
          cmd: a,
          text: "The property was not defined (" + a[1] + ") "
        };

        var oldValue = obj.data[prop];
        if (this.isObject(oldValue) || this.isArray(oldValue)) return {
          error: 145,
          cmd: a,
          text: "Trying to apply text diff/patch to  Object or Array"
        };

        // the reverse command...
        var patch = _dmp.patch_fromText(a[3]);

        var newValue = _dmp.patch_apply(patch, oldValue);
        if (!this.isArray(newValue)) return {
          error: 146,
          cmd: a,
          text: "patch_apply failed"
        };
        var list = newValue[1];
        if (!list) return {
          error: 146,
          cmd: a,
          text: "patch_apply failed"
        };
        for (var i = 0; i < list.length; i++) {
          if (!list[i]) return {
            error: 146,
            cmd: a,
            text: "patch_apply failed"
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
            prop = "*",
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
          throw "_reverse_moveToIndex with invalid index value";
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
            prop = "*",
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
            prop = "*",
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

        if (a[3] != "value") {
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
       * @param float a
       * @param float isRemote
       * @param float isRedo
       */
      _myTrait_._safeExec = function (a, isRemote, isRedo) {

        try {
          if (!this.isArray(a)) return false;
          var c = _cmds[a[0]];

          if (this._playBackOnFn && !isRedo) {
            // do not allow commands when playback is on
            return false;
          }
          // console.log("cmd "+a);

          if (c) {
            var rv = c.apply(this, [a, isRemote]);

            if (rv !== true) {
              console.log("ERROR " + JSON.stringify(a));
              console.log(JSON.stringify(rv));
              console.trace("_safeExec::cmd_err");
            }

            if (rv === true && !isRedo) {
              // there is the hot buffer possibility for the object
              if (!isRemote) {

                if (a[0] == 4 && _settings.hotMs) {
                  var objid = a[4];
                  var key = objid + ":" + a[1];
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
              text: "Invalid command"
            };
          }
        } catch (e) {
          var txt = "";
          if (e && e.message) txt = e.message;
          console.error(e, e.message);
          return {
            error: 199,
            cmd: a,
            text: "Exception raised " + txt
          };
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

        if (this._options.fast) {
          return this._fastExec(a, isRemote, isRedo);
        } else {
          return this._safeExec(a, isRemote, isRedo);
        }
      };

      /**
       * @param Array a  - Command to execute as action
       * @param float isRemote
       * @param float isRedo
       */
      _myTrait_.execCmdAsAction = function (a, isRemote, isRedo) {

        var a = a.slice();

        // fix the old value problem for "set value"
        if (a[0] == 4) {
          var obj = this._find(a[4]),
              prop = a[1];

          if (!obj) {
            console.log("Could not find the object " + a[4]);
            return {
              text: "Error, object not found"
            };
          }
          var oldValue = obj.data[prop];

          if (oldValue == a[2]) return true;
          a[3] = oldValue;
        }

        if (a[0] == 7) {
          var parentObj = this._find(a[4]),
              insertedObj = this._find(a[2]),
              toIndex = parseInt(a[1]),
              index = parentObj.data.length; // might check if valid...

          if (parentObj && insertedObj) {
            a[1] = index;
          }
        }
        if (a[0] == 12) {
          var obj = this._find(a[4]),
              len = obj.data.length,
              targetObj;

          if (!obj) return {
            error: 2,
            cmd: 1,
            text: "Object with ID (" + a[4] + ") did not exist"
          };
          var oldIndex = null,
              i;
          var targetObj = this._find(a[1]);
          i = oldIndex = obj.data.indexOf(targetObj);

          if (oldIndex >= 0) a[3] = oldIndex;
        }

        return this.execCmd(a, isRemote, isRedo);
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

      if (_myTrait_.__traitInit && !_myTrait_.hasOwnProperty("__traitInit")) _myTrait_.__traitInit = _myTrait_.__traitInit.slice();
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
            if (typeof diff_match_patch != "undefined") {
              _dmp = new diff_match_patch();
            } else {
              // if in node.js try to require the module
              if (typeof require != "undefined") {
                var DiffMatchPatch = require("diff-match-patch");
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
          console.error("journal does not have timestamps");
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
       * @param float t
       */
      _myTrait_.resetJournal = function (t) {
        this._journalPointer = 0;
        this._journal.length = 0;
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
        if (typeof n == "undefined") n = 1;

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

          this.trigger("cmd", {
            line: this._journal.length - 1,
            cmd: cmd
          });

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

        return this;
      };

      /**
       * @param String name  - Name of the event the listener was listening to
       * @param Function fn  - The listener function
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

      if (!_myTrait_.hasOwnProperty("__factoryClass")) _myTrait_.__factoryClass = [];
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

        if (this._options.disableWorkers) return;

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
        var allProps = workers["*"],
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
        if (!propFilter) propFilter = "*";

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

      if (_myTrait_.__traitInit && !_myTrait_.hasOwnProperty("__traitInit")) _myTrait_.__traitInit = _myTrait_.__traitInit.slice();
      if (!_myTrait_.__traitInit) _myTrait_.__traitInit = [];
      _myTrait_.__traitInit.push(function (channelId, mainData, journalCmds, options) {

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
        this._options = options || {};
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

        if (typeof obj == "undefined") {
          if (recursive) return obj;
          return obj = this._data;
        }

        if (this.isFunction(obj) || typeof obj == "function") {
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
        if (typeof res == "function") {
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
        if (typeof m.init == "function") m.init.apply(m, args);
      }
    } else return new _channelData(a, b, c, d, e, f, g, h);
  };

  _channelData._classInfo = {
    name: "_channelData"
  };
  _channelData.prototype = new _channelData_prototype();

  (function () {
    if (typeof define !== "undefined" && define !== null && define.amd != null) {
      __amdDefs__["_channelData"] = _channelData;
      this._channelData = _channelData;
    } else if (typeof module !== "undefined" && module !== null && module.exports != null) {
      module.exports["_channelData"] = _channelData;
    } else {
      this._channelData = _channelData;
    }
  }).call(new Function("return this")());

  var channelObjects_prototype = function channelObjects_prototype() {

    (function (_myTrait_) {

      // Initialize static variables here...

      if (_myTrait_.__traitInit && !_myTrait_.hasOwnProperty("__traitInit")) _myTrait_.__traitInit = _myTrait_.__traitInit.slice();
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
        if (typeof res == "function") {
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
        if (typeof m.init == "function") m.init.apply(m, args);
      }
    } else return new channelObjects(a, b, c, d, e, f, g, h);
  };

  channelObjects._classInfo = {
    name: "channelObjects"
  };
  channelObjects.prototype = new channelObjects_prototype();

  var _localChannelModel_prototype = function _localChannelModel_prototype() {

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
        return Object.prototype.toString.call(t) === "[object Array]";
      };

      /**
       * @param float fn
       */
      _myTrait_.isFunction = function (fn) {
        return Object.prototype.toString.call(fn) == "[object Function]";
      };

      /**
       * @param float t
       */
      _myTrait_.isObject = function (t) {

        return t === Object(t);
      };
    })(this);

    (function (_myTrait_) {
      var _instances;

      // Initialize static variables here...

      if (!_myTrait_.hasOwnProperty("__factoryClass")) _myTrait_.__factoryClass = [];
      _myTrait_.__factoryClass.push(function (id, fileSystem) {

        if (!_instances) {
          _instances = {};
        }

        id = id + fileSystem.id();

        if (_instances[id]) {
          return _instances[id];
        } else {
          _instances[id] = this;
        }
      });

      /**
       * The channel ID should follow a normal path format like path/to/my/channel
       * @param String channelId
       */
      _myTrait_._createChannelDir = function (channelId) {

        var str = channelId;
        if (str.charAt(0) == "/") str = str.substring(1);

        var parts = str.split("/");
        var fs = this._fs,
            activeFolder = fs;

        var actPromise = _promise();
        var originalPromise = actPromise;
        var me = this;

        parts.forEach(function (pathStr) {
          pathStr = pathStr.trim();
          if (pathStr.length == 0) return;

          actPromise = actPromise.then(function () {
            return activeFolder.isFolder(pathStr);
          }).then(function (bCreate) {
            if (!bCreate) {
              return activeFolder.createDir(pathStr);
            } else {
              return true;
            }
          }).then(function () {
            return activeFolder.getFolder(pathStr);
          }).then(function (f) {
            activeFolder = f;
          });
        });

        // after all done, place the active folder for our fs pointer
        actPromise = actPromise.then(function () {
          me._folder = activeFolder;
        });
        originalPromise.resolve(true);

        return actPromise;
      };

      /**
       * @param float t
       */
      _myTrait_._createChannelSettings = function (t) {
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
        return _promise(function (result) {
          var bIsNew = false;
          folder.isFile("ch.settings").then(function (is_file) {
            if (!is_file) {
              bIsNew = true;
              return folder.writeFile("ch.settings", JSON.stringify({
                version: 1,
                name: "Automatic first version",
                utc: new Date().getTime(),
                channelId: me._channelId,
                journalLine: 0
              }));
            }
            return true;
          }).then(function () {
            return folder.readFile("ch.settings");
          }).then(function (jsonData) {
            var data = JSON.parse(jsonData);
            me._settings = data;
            result(me._settings);
          });
        });
      };

      /**
       * @param string channelId
       */
      _myTrait_._isFreeToFork = function (channelId) {
        var str = channelId;
        if (str.charAt(0) == "/") str = str.substring(1);

        var parts = str.split("/");
        var fs = this._fs,
            activeFolder = fs;

        var actPromise = _promise();
        var originalPromise = actPromise;
        var me = this,
            isFree = false;

        parts.forEach(function (pathStr) {

          pathStr = pathStr.trim();
          if (pathStr.length == 0) return;
          actPromise = actPromise.then(function () {
            if (isFree) return isFree;
            return activeFolder.isFolder(pathStr);
          }).then(function (isFolder) {
            if (isFree) return;
            if (!isFolder) {
              isFree = true; // the folder path is free...
              return isFree;
            } else {
              return isFree;
            }
          }).then(function () {
            if (isFree) return isFree;
            // get next level..
            return activeFolder.getFolder(pathStr);
          }).then(function (f) {
            if (isFree) return isFree;
            activeFolder = f;
          });
        });

        // after all done, place the active folder for our fs pointer
        actPromise = actPromise.then(function () {
          return isFree;
        });
        originalPromise.resolve(true);

        return actPromise;
      };

      /**
       * @param string str
       */
      _myTrait_._textLinesToArray = function (str) {
        if (!str || typeof str != "string") return [];
        var a = str.split("\n");
        var res = [];
        a.forEach(function (line) {
          if (line.trim().length == 0) return;
          res.push(JSON.parse(line));
        });
        return res;
      };

      /**
       * @param float t
       */
      _myTrait_._writeSettings = function (t) {
        return this._folder.writeFile("ch.settings", JSON.stringify(this._settings));
      };

      /**
       * @param float t
       */
      _myTrait_.childForkTree = function (t) {
        var local = this._folder,
            me = this;
        return _promise(function (response) {
          me.getForks().then(function (forks) {
            var list = [],
                results = [];
            if (!forks || forks.length == 0) {
              response([]);
              return;
            }
            forks.forEach(function (fork) {
              var forkModel = _localChannelModel(fork.to, me._fs);
              list.push(forkModel.childForkTree());
            });
            var prom = _promise();
            prom.all(list).then(function (childTrees) {
              forks.forEach(function (fork, i) {
                fork.children = childTrees[i];
                results.push(fork);
              });
              response(results);
            });
            prom.resolve(true);
          });
        });
      };

      /**
       * Creates a new channel with pre-initialized data.
       * @param float chSettings
       * @param float notUsed
       */
      _myTrait_.createChannel = function (chSettings, notUsed) {
        var local = this._folder,
            me = this,
            chData;
        return _promise(function (response) {

          chData = chSettings.chData;
          if (!chData) {
            chData = {
              data: {},
              __id: me.guid(),
              __acl: chSettings.__acl
            };
          }
          if (chData && !chData.__acl) {
            chData.__acl = chSettings.__acl;
          }

          if (!chSettings.channelId || !chSettings._userId) {
            response({
              result: false,
              text: "Could not create the channel, missing information"
            });
            return;
          }

          var obj = {
            version: 2, // with pre-initialized data, the first version is 2
            channelId: chSettings.channelId,
            userId: chSettings._userId,
            name: chSettings.name || "",
            utc: new Date().getTime()
          };

          // got to check first if the channel is free to be forked
          me._isFreeToFork(chSettings.channelId).then(function (yesNo) {
            if (yesNo == true) {
              var newChann = _localChannelModel(chSettings.channelId, me._fs);
              newChann.then(function () {
                return newChann.writeFile("file.2", JSON.stringify(chData));
              }).then(function () {
                return newChann.set(obj);
              }).then(function () {
                response({
                  result: true,
                  channelId: chSettings.channelId
                });
              }).fail(function (e) {
                var msg = "";
                if (e && e.message) msg = e.message;
                response({
                  result: false,
                  text: "Failed to create channel " + msg
                });
              });
            } else {
              console.error("Channel already created");
              response({
                result: false,
                text: "Channel is already in use"
              });
            }
          }).fail(function (e) {
            console.error(e);
            response({
              result: false,
              text: "Creating the new channel failed"
            });
          });
        });
      };

      /**
       * @param float cmd
       */
      _myTrait_.createSyncedModel = function (cmd) {
        var me = this;
        var cc = null; // <-- connect to the channel

        // master-sync file contents
        // [2,621]

        // The sync file contents
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

        console.log("** startin createSyncedModel with data **");
        console.log(JSON.stringify(cmd));

        return _promise(function (syncReady, syncFail) {

          // -> channel to checkout...
          var sync = cmd.sync; // <-- the sync file contents
          var outSocket;

          if (sync.out.method == "memory.socket") {
            outSocket = _clientSocket(sync.out.protocol + "://" + sync.out.ip, sync.out.port);
          }

          if (sync.out.method == "node.socket") {
            var ioLib = require("socket.io-client");
            var realSocket1 = ioLib.connect(sync.out.protocol + "://" + sync.out.ip + ":" + (sync.out.extPort || sync.out.port));
            outSocket = _clientSocket(sync.out.protocol + "://" + sync.out.ip, sync.out.port, realSocket1);
          }

          // cc = HERE the slave connection which the server1 has to server2
          // slave <-> master connection
          var cc = channelClient(sync.out.channelId, outSocket, {
            auth: {
              username: sync.out.username,
              password: sync.out.password
            }
          });

          cc.then(function () {
            cc._checkout(sync.out.channelId).then(function (r) {

              debugger;
              console.log("Checkout returned ");
              console.log(JSON.stringify(r));

              // the channel has been now checked out
              /*
              {"ch":"my/channel",
              "file":"ch.settings",
              "data":"{\"version\":2,\"channelId\":\"my/channel\",\"journalLine\":1,\"utc\":14839287897}"}        
              */
              var wait = _promise();
              var start = wait;

              var fileSystem = me.getFilesystem(); // <- the root filesystem for the checkout process

              // TODO: this is all overriding sync, what if the channel already does exist?
              if (r.build) r.build.forEach(function (fileData) {
                var m;
                wait = wait.then(function () {

                  var chName = fileData.ch;
                  if (fileData.ch == sync.out.channelId) {
                    chName = sync["in"].channelId;
                  }

                  m = _localChannelModel(chName, fileSystem);
                  return m;
                }).then(function () {
                  return m.folder().isFile(fileData.file);
                }).then(function (is_file) {

                  if (fileData.file == "ch.settings") {
                    var data = JSON.parse(fileData.data);
                    data.channelId = sync["in"].channelId;
                    return m.writeFile(fileData.file, JSON.stringify(data));
                  } else {
                    // if the local file already does exist then do not write it
                    if (!is_file) {
                      return m.writeFile(fileData.file, fileData.data);
                    } else {
                      return is_file;
                    }
                  }
                });
              });

              // after this has been done, the data should be loaded and the checkout is ready to be used by any
              // connection which opens it
              var folder = me.folder();
              wait.then(function () {
                return folder.isFile("sync");
              }).then(function (is_file) {
                if (!is_file) {
                  return folder.writeFile("sync", JSON.stringify(sync));
                }
              }).then(function (is_file) {
                return folder.isFile("master-sync");
              }).then(function (is_file) {
                if (!is_file) {
                  var ms = [cc._clientState.version, cc._clientState.data.getJournalLine()];
                  return folder.writeFile("master-sync", JSON.stringify(ms));
                }
              }).then(function () {
                return me._createChannelSettings();
              }).then(function () {
                syncReady(sync);
              }).fail(syncFail);

              start.resolve(true);
            }).fail(syncFail);
          }).fail(syncFail);
        });
      };

      /**
       * @param float t
       */
      _myTrait_.folder = function (t) {
        return this._folder;
      };

      /**
       * The forkData is object having properties &quot;channelId&quot; and &quot;name&quot;
       * @param Object forkData  - Object with { channelId : &quot;path/to/the/challe&quot;,  name:&quot;name&quot;}
       */
      _myTrait_.fork = function (forkData) {
        var local = this._folder,
            me = this;
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

        return _promise(function (response) {

          // ?? should we use the journal line provided by the forkData
          var settings = me._settings;

          var fromLine = settings.journalLine || 0;
          if (typeof forkData.journalLine != "undefined") {
            fromLine = forkData.journalLine;
          }

          var obj = {
            fromJournalLine: fromLine,
            version: 1, // the fork version is always 1
            channelId: forkData.channelId,
            fromVersion: settings.version,
            from: me._channelId,
            to: forkData.channelId,
            userId: forkData._userId,
            name: forkData.name,
            utc: new Date().getTime()
          };
          console.log("fork called with ");
          console.log(obj);

          // got to check first if the channel is free to be forked
          me._isFreeToFork(forkData.channelId).then(function (yesNo) {
            if (yesNo == true) {
              // TODO: check that the forked channel is valid here
              local.appendFile("forks", JSON.stringify(obj) + "\n").then(function () {
                var newChann = _localChannelModel(forkData.channelId, me._fs);
                newChann.then(function () {
                  return newChann.set(obj);
                }).then(function () {
                  response(obj);
                });
              });
            } else {
              console.error("Channel already created");
              response({
                result: false,
                text: "Channel is already in use"
              });
            }
          }).fail(function (e) {
            console.error(e);
            response({
              result: false,
              text: "Creating the fork failed"
            });
          });
        });
      };

      /**
       * @param String name
       */
      _myTrait_.get = function (name) {
        var local = this._db,
            me = this;
        return _promise(function (response) {
          me.then(function () {
            var settings = local.table("settings");
            settings.get(name).then(function (v) {
              response(v.value);
            });
          });
        });
      };

      /**
       * @param float t
       */
      _myTrait_.getCurrentVersion = function (t) {
        var local = this._folder,
            me = this;
        return _promise(function (result) {
          result(me._settings.version);
        });
      };

      /**
       * @param float t
       */
      _myTrait_.getFilesystem = function (t) {
        return this._fs;
      };

      /**
       * @param float t
       */
      _myTrait_.getForks = function (t) {
        var local = this._folder,
            me = this;
        return _promise(function (result) {

          me.then(function () {
            return local.readFile("forks");
          }).then(function (res) {
            if (res) {
              result(me._textLinesToArray(res));
            } else {
              result([]);
            }
          }).fail(function () {
            result([]);
          });
        });
      };

      /**
       * @param float t
       */
      _myTrait_.getJournalSize = function (t) {
        return this._settings.journalSize;
      };

      /**
       * @param float t
       */
      _myTrait_.incrementVersion = function (t) {
        var local = this._folder,
            me = this;
        return _promise(function (result) {
          me.then(function () {

            var settings = me._settings;

            settings.version++;
            settings.journalLine = 0;

            me._writeSettings().then(function () {
              result(settings.version);
            });
          });
        });
      };

      if (_myTrait_.__traitInit && !_myTrait_.hasOwnProperty("__traitInit")) _myTrait_.__traitInit = _myTrait_.__traitInit.slice();
      if (!_myTrait_.__traitInit) _myTrait_.__traitInit = [];
      _myTrait_.__traitInit.push(function (channelId, fileSystem) {

        this._channelId = channelId;
        this._latestVersion = 1;

        this._fs = fileSystem;

        var me = this;

        // create channel directory only if channel is defined
        if (channelId) {
          me._createChannelDir(channelId).then(function () {
            return me._createChannelSettings();
          }).then(function () {
            me.resolve(true);
          }).fail(function (e) {
            console.error(e);
          });
        }
      });

      /**
       * @param String fileName  - The filename to check
       */
      _myTrait_.isFile = function (fileName) {
        return this._folder.isFile(fileName);
      };

      /**
       * @param float channelId
       * @param float version
       * @param float journalLine
       */
      _myTrait_.readBuildTree = function (channelId, version, journalLine) {

        var flatten = function flatten(a) {
          return [].concat.apply([], a);
        };

        var local = this._folder,
            me = this;

        if (channelId) {
          return _promise(function (response) {
            var ch = _localChannelModel(channelId, me._fs);
            ch.then(function () {
              ch.readBuildTree(null, version, null).then(function (res) {
                var jLen = res[0].length;
                if (jLen > journalLine) {
                  res[0].splice(journalLine, jLen - journalLine);
                }
                response(res);
              });
            });
          });
        }

        return _promise(function (response) {
          var repList = [],
              mainFile,
              journalFile;

          me.then(function () {
            return me.readMain(version); // first get the main
          }).then(function (mainFileRead) {
            if (mainFileRead) {
              mainFile = JSON.parse(mainFileRead);
            }
            //             mainFile = mainFileRead;
            return me.readJournal(version);
          }).then(function (journal) {
            journalFile = journal;

            if (me._settings.from && !mainFile) {

              var settings = me._settings;
              me.readBuildTree(settings.from, settings.fromVersion, settings.fromJournalLine).then(function (resp) {
                repList.push(journal);
                resp.forEach(function (r) {
                  repList.push(r);
                });
                response(repList);
              });
            } else {
              response([journal, mainFile]);
            }
          }).fail(function (msg) {
            console.error(msg);
          });
        });
      };

      /**
       * @param String channelId
       * @param float version
       * @param float list
       */
      _myTrait_.readCheckoutData = function (channelId, version, list) {

        var flatten = function flatten(a) {
          return [].concat.apply([], a);
        };

        // What we already have:
        // 1. me._settings  - is holding the channel settings
        // 2.

        var local = this._folder,
            me = this,
            versionNumber = version || me._settings.version;

        if (channelId) {
          return _promise(function (response) {
            var ch = _localChannelModel(channelId, me._fs);
            ch.then(function () {
              ch.readCheckoutData(null, version).then(function (res) {
                response(res);
              });
            });
          });
        }

        // Read main is like this:
        /*
        var local = this._folder, 
        me = this,
        versionNumber = version || me._settings.version;
        if(versionNumber==1) {
        return _promise(function(r) {
        r(null);
        });
        }
        return local.readFile( "file."+versionNumber);
        */

        // Read journal goes like:
        /*
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
        */

        return _promise(function (response) {
          var repList = [],
              mainFile,
              journalFile,
              myFiles = [];

          me.then(function () {
            if (versionNumber == 1) {
              return null;
            }
            return local.readFile("file." + versionNumber);
          }).then(function (mainFileRead) {
            if (mainFileRead) {
              mainFile = mainFileRead;
              myFiles.push({
                ch: channelId || me._channelId,
                file: "file." + versionNumber,
                data: mainFileRead
              });
            }
            return local.readFile("journal." + versionNumber);
          }).then(function (journal) {
            if (journal) {
              myFiles.push({
                ch: channelId || me._channelId,
                file: "journal." + versionNumber,
                data: journal
              });
            }
            return local.readFile("ch.settings");
          }).then(function (data) {
            if (data) {
              myFiles.push({
                ch: channelId || me._channelId,
                file: "ch.settings",
                data: data
              });
            }
            // if a fork then read also the forked channel data
            if (me._settings.from && !mainFile) {

              var settings = me._settings;
              me.readCheckoutData(settings.from, settings.fromVersion).then(function (resp) {
                resp.forEach(function (r) {
                  myFiles.push(r);
                });
                response(myFiles);
              });
            } else {
              response(myFiles);
            }
          }).fail(function (msg) {
            console.error(msg);
          });
        });
      };

      /**
       * @param float fileName
       */
      _myTrait_.readFile = function (fileName) {

        var local = this._folder;
        return local.readFile(fileName);
      };

      /**
       * @param float version
       */
      _myTrait_.readJournal = function (version) {

        var local = this._folder,
            me = this,
            versionNumber = version || me._settings.version;

        return _promise(function (res) {
          local.readFile("journal." + versionNumber).then(function (data) {
            if (!data) {
              me._settings.journalSize = 0;
              res([]);
              return;
            }
            me._settings.journalSize = data.length;
            res(me._textLinesToArray(data));
          }).fail(function () {
            res([]);
          });
        });
      };

      /**
       * @param float version
       */
      _myTrait_.readMain = function (version) {

        var local = this._folder,
            me = this,
            versionNumber = version || me._settings.version;

        if (versionNumber == 1) {
          return _promise(function (r) {
            r(null);
          });
        }

        return local.readFile("file." + versionNumber);
      };

      /**
       * @param String name
       * @param float value
       */
      _myTrait_.set = function (name, value) {
        var local = this._folder,
            me = this,
            settings = this._settings;

        if (this.isObject(name)) {
          for (var n in name) {
            if (name.hasOwnProperty(n)) {
              settings[n] = name[n];
            }
          }
        } else {
          settings[name] = value;
        }

        return this._writeSettings(settings);
      };

      /**
       * @param Object newMainData
       */
      _myTrait_.snapshot = function (newMainData) {
        var local = this._folder,
            me = this;

        return _promise(function (done) {
          var currentVersion;
          me.incrementVersion().then(function (nextVersion) {
            currentVersion = nextVersion - 1;
            return me.writeMain(newMainData);
          }).then(function () {
            // The incrementVersion() call will do the following
            // me._settings.journalLine = 0;
            // me._settings.version = 0;
            done(true);
          });
        });
      };

      /**
       * @param float t
       */
      _myTrait_.status = function (t) {
        var local = this._folder,
            me = this;
        return _promise(function (result) {
          me.then(function () {
            result(me._settings);
          });
        });
      };

      /**
       * @param float t
       */
      _myTrait_.syncData = function (t) {
        var local = this._folder,
            me = this;

        return _promise(function (result) {
          local.isFile(".sync").then(function (is_file) {
            if (is_file) {
              local.readFile(".sync").then(result);
              return;
            }
            result(null);
          });
        });
      };

      /**
       * @param float channelId
       */
      _myTrait_.treeOfLife = function (channelId) {

        // loads the whole tree of life for this entry, can be a big operation...

        var local = this._folder,
            me = this;

        if (channelId) {
          var model = _localChannelModel(channelId, this._fs);
          return model.treeOfLife();
        }

        return _promise(function (response) {
          me.then(function () {

            if (me._settings.from) {
              me.treeOfLife(me._settings.from).then(response);
            } else {
              me.childForkTree().then(response);
            }
          });
        });
      };

      /**
       * @param int size
       * @param float lineNumber
       */
      _myTrait_.truncateJournalTo = function (size, lineNumber) {

        var local = this._folder,
            me = this;

        return _promise(function (resp) {

          local.truncateFile("journal." + me._settings.version, size).then(function () {

            // add the journal size after the write...
            me._settings.journalSize = size;
            me._settings.journalLine = lineNumber;

            me._writeSettings();
            resp(true);
          });
        });
      };

      /**
       * @param string fileName
       * @param float fileData
       */
      _myTrait_.writeFile = function (fileName, fileData) {
        // NOTE: this function should not be used in typical situations
        var local = this._folder;

        if (typeof fileData != "string") fileData = JSON.stringify(fileData);

        return local.writeFile(fileName, fileData);
      };

      /**
       * @param string data
       * @param float version
       */
      _myTrait_.writeMain = function (data, version) {

        // NOTE: this function should not be used in typical situations
        var local = this._folder,
            me = this,
            versionNumber = version || me._settings.version;

        if (typeof data != "string") data = JSON.stringify(data);

        return local.writeFile("file." + versionNumber, data);
      };

      /**
       * @param Object row
       */
      _myTrait_.writeToJournal = function (row) {

        var local = this._folder,
            me = this;

        if (this.isArray(row[0])) {
          var str = "",
              cnt = 0;
          row.forEach(function (r) {
            str += JSON.stringify(r) + "\n";
            cnt++;
          });
          return _promise(function (resp) {
            local.appendFile("journal." + me._settings.version, str).then(function () {

              // keep the size of the journal available for quicly truncating the server file
              me._settings.journalSize += str.length;

              me._settings.journalLine += cnt;
              me._writeSettings();
              resp(true);
            });
          });
        }

        return _promise(function (resp) {
          var str = JSON.stringify(row) + "\n";
          local.appendFile("journal." + me._settings.version, str).then(function () {

            // add the journal size after the write...
            me._settings.journalSize += str.length;

            me._settings.journalLine++;
            me._writeSettings();
            resp(true);
          });
        });
      };
    })(this);
  };

  var _localChannelModel = function _localChannelModel(a, b, c, d, e, f, g, h) {
    var m = this,
        res;
    if (m instanceof _localChannelModel) {
      var args = [a, b, c, d, e, f, g, h];
      if (m.__factoryClass) {
        m.__factoryClass.forEach(function (initF) {
          res = initF.apply(m, args);
        });
        if (typeof res == "function") {
          if (res._classInfo.name != _localChannelModel._classInfo.name) return new res(a, b, c, d, e, f, g, h);
        } else {
          if (res) return res;
        }
      }
      if (m.__traitInit) {
        m.__traitInit.forEach(function (initF) {
          initF.apply(m, args);
        });
      } else {
        if (typeof m.init == "function") m.init.apply(m, args);
      }
    } else return new _localChannelModel(a, b, c, d, e, f, g, h);
  };

  _localChannelModel_prototype.prototype = _promise.prototype;

  _localChannelModel._classInfo = {
    name: "_localChannelModel"
  };
  _localChannelModel.prototype = new _localChannelModel_prototype();

  (function () {
    if (typeof define !== "undefined" && define !== null && define.amd != null) {
      __amdDefs__["_localChannelModel"] = _localChannelModel;
      this._localChannelModel = _localChannelModel;
    } else if (typeof module !== "undefined" && module !== null && module.exports != null) {
      module.exports["_localChannelModel"] = _localChannelModel;
    } else {
      this._localChannelModel = _localChannelModel;
    }
  }).call(new Function("return this")());

  var _serverChannelMgr_prototype = function _serverChannelMgr_prototype() {

    (function (_myTrait_) {
      var _channelIndex;
      var _rootData;
      var _rooms;
      var _socketRooms;
      var _authExtension;
      var _accessManager;
      var _autoCreateFn;
      var _cmds;
      var _cmdLookup;
      var _repClass;

      // Initialize static variables here...

      /**
       * @param String name  - Command to look for
       * @param String channelId  - The Channel ID
       * @param Object socket  - The server socket object
       */
      _myTrait_._findCmd = function (name, channelId, socket) {

        if (_cmdLookup) {
          var fn = _cmdLookup(name, channelId, socket);
          if (fn) return fn;
        }

        return _cmds[name];
      };

      /**
       * @param float chId
       * @param float socket
       */
      _myTrait_.addSocketToCh = function (chId, socket) {

        if (!this._channelSockets[chId]) {
          this._channelSockets[chId] = [];
        }
        if (this._channelSockets[chId].indexOf(socket) < 0) {
          this._channelSockets[chId].push(socket);
          console.log("-- client joined " + chId + ", now  " + this._channelSockets[chId].length + " connected");
        }
      };

      /**
       * @param Function cb  - When ready
       */
      _myTrait_.cleanChannels = function (cb) {

        console.log("--- cleaning all channels ---");
        var me = this;
        var start = _promise(),
            p = start;

        for (var n in this._openChannels) {
          if (this._openChannels.hasOwnProperty(n)) {
            var ch = this._openChannels[n];
            (function (ch) {
              p = p.then(function () {
                return ch.closeChannel();
              });
            })(ch);
          }
        }
        p.then(cb);
        start.resolve(true);
      };

      /**
       * @param String name  - Name of the command
       * @param float fn
       */
      _myTrait_.cmd = function (name, fn) {

        if (!_cmds) {
          _cmds = {};
        }

        _cmds[name] = fn;
      };

      /**
       * @param float t
       */
      _myTrait_.createReplClass = function (t) {

        console.log("createReplClass");

        var self = this;
        if (!_repClass && this._marx) {
          _repClass = this._marx.createClass({
            requires: {
              js: [{
                name: self._options.moshModule,
                varName: "_data",
                assignTo: "_data"
              }, {
                name: "socket.io-client",
                assignTo: "ioLib"
              }]
            },
            processWorkers: {
              init: function init() {
                console.log("Replicator object created");
                this._hot = {};
              },
              clientReady: function clientReady() {
                if (!this._readyCallback) return;
                this._readyCallback();
                this._readyCallback = null;
              },
              close: function close() {
                if (this._serverData && this._serverData.closeChannel) {
                  this._serverData.closeChannel();
                }
              },
              patchShadowCmds: function patchShadowCmds(listOfCmds) {
                console.log("Patching shadow commands");
                this._clientData.patch(listOfCmds);
              },
              patchShadowCmd: function patchShadowCmd(cmd) {
                console.log("Patching client with " + cmd);
                this._clientData.patch([cmd]);
              },
              sendCommands: function sendCommands(cmdList) {
                var client = this._serverData._client;
                var socket = this._serverData._socket;

                var ms = new Date().getTime();

                // the current client status
                // TODO: should be self-correcting
                var me = this,
                    remoteList = [];
                cmdList.forEach(function (c) {
                  if (c[0]) remoteList.push(c[1]);
                  // console.log("patching "+c[1]);
                  me._clientData.patch([c[1]]);
                  me._hot[c[1][4]] = ms; // the ID marked as "hot"
                });

                if (remoteList.length > 0) {
                  // console.log("sendCommands");
                  // console.log(remoteList);               
                  socket.send("channelCommand", {
                    channelId: client._channelId,
                    cmd: "sendCmds",
                    data: {
                      commands: remoteList
                    }
                  });
                }
              },
              applyToShadow: function applyToShadow(cmd) {
                var client = this._serverData._client;
                var socket = this._serverData._socket;

                // the current client status
                // TODO: should be self-correcting
                this._clientData._client.addCommand(cmd);

                socket.send("channelCommand", {
                  channelId: client._channelId,
                  cmd: "sendCmds",
                  data: {
                    commands: [client._transformCmdFromNs(cmd)]
                  }
                });
              },
              connect: function connect(options, whenReady) {

                console.log("The replicator is connecting to " + options.db);
                if (typeof ioLib == "undefined") console.log("REPLICA ioLib not defined");
                var realSocket = ioLib.connect(options.url);
                console.log("REPLICA : realSocket ok");
                var theData = _data(options.db, {
                  auth: {
                    username: "Tero",
                    password: "teropw"
                  },
                  ioLib: realSocket
                });
                console.log("REPLICA : _data ok");
                this._serverData = theData;
                this._readyCallback = whenReady;

                var me = this;
                this._serverData.then(function () {

                  console.log("REPLICA : Got the connection");
                  var bHasData = false;
                  // if no clientdata specified
                  if (!options.clientData) {
                    var rawData = theData.getData(true);

                    var clientData = theData.localFork();
                    me._clientData = clientData;

                    // send the raw data to server
                    // whenReady(rawData);
                  } else {
                    console.log("REPLICA : using options.clientData");
                    me._clientData = _data(options.clientData);
                  }

                  // listen to changes from the server...
                  var chServerData = me._serverData.getChannelData();
                  chServerData.on("cmd", function (d) {
                    bHasData = true;
                  });

                  if (options.clientData) {
                    whenReady();
                    me._readyCallback = null;
                  } else {
                    console.log("REPLICA : about to call whenReady with raw data");
                    whenReady(rawData);
                    me._readyCallback = null;
                  }
                  console.log("REPLICA : all done");

                  bHasData = true;

                  // if we have skipped some data, b_hot_pending tells us that we are not
                  // finished yet with processing of the server data
                  var b_hot_pending = false;
                  setInterval(function () {

                    if (!me._clientData) return;
                    if (!b_hot_pending && !bHasData) return;
                    bHasData = false;

                    // console.log("R: has data, running diff");
                    var diff = me._clientData.diff(theData);
                    if (diff.length == 0) {
                      b_hot_pending = false;
                      return;
                    }
                    // console.log("R: diff had something to send");
                    // only send the diff directly to client               

                    // me._hot[c[1][4]]
                    var msNow = new Date().getTime();
                    var diff_list = [];
                    b_hot_pending = false;
                    for (var i = 0; i < diff.length; i++) {
                      var cmd = diff[i],
                          testId = cmd[4];
                      if (me._hot[testId]) {
                        var ms_hot = msNow - me._hot[testId];
                        if (ms_hot < 1000) {
                          b_hot_pending = true;
                          continue;
                        } else {
                          delete me._hot[testId];
                          diff_list.push(cmd);
                        }
                      } else {
                        diff_list.push(cmd);
                      }
                    }
                    // console.log("--> sending DIFF to the client process");
                    // console.log(JSON.stringify(diff_list, null, 2));
                    if (diff_list.length > 0) me.trigger("diff", diff_list);
                  }, 1);
                });
              }
            },
            // local process methods for the replicated data
            methods: {

              initLocalData: function initLocalData(data) {

                // this is how to roll the data, however this is done by the server usually.

                this._myData = _data(data);
                var chData = this._myData.getChannelData();
                var me = this;
                chData.on("cmd", function (d) {
                  if (me._diffOn) return; // do not re-send the diff commands
                  me.applyToShadow(d.cmd);
                });
                this.clientReady();
              },
              getDataObj: function getDataObj() {
                return this._myData;
              }
            }
          });
        }

        return _repClass;
      };

      /**
       * Returns the access manager, if defined
       * @param float t
       */
      _myTrait_.getAccessManager = function (t) {
        return _accessManager;
      };

      /**
       * @param float t
       */
      _myTrait_.getServerSocket = function (t) {
        return this._server;
      };

      /**
       * @param float chId
       */
      _myTrait_.getSocketsFromCh = function (chId) {
        if (!this._channelSockets[chId]) return [];

        return this._channelSockets[chId];
      };

      if (_myTrait_.__traitInit && !_myTrait_.hasOwnProperty("__traitInit")) _myTrait_.__traitInit = _myTrait_.__traitInit.slice();
      if (!_myTrait_.__traitInit) _myTrait_.__traitInit = [];
      _myTrait_.__traitInit.push(function (serverSocket, fileSystem, authManager, options) {

        if (!_cmds) {
          _cmds = {};
        }

        options = options || {};

        this._server = serverSocket;
        this._auth = authManager;
        this._channelSockets = {};
        this._openChannels = {};

        if (options.marx) {
          this._marx = options.marx;
        } else {
          // initiating the marx class, the raw way here...
          var Marx = require("./marx-0.10.js").Marx;
          this._marx = Marx({
            forkFile: "./moshProcess.js",
            processCnt: 1
          });
          this._marx.__promiseClass(_promise);
        }
        this._options = options;
        if (!this._options.moshModule) {
          this._options.moshModule = "./mosh-server-1.01.js";
        }

        var me = this;

        // The server which manages the client connections is here..

        this._server.on("connect", function (socket) {

          // keeps track of channels the socket is registered into   
          var _socketChannels = [];
          var ctrl; // the channel controller

          if (!socket.__channels) socket.__channels = [];

          // fast join + get channel data...
          socket.on("joinChannel", function (cData, responseFn) {

            // TODO: add authentication, skip it for now, simply a cll to authhandler

            console.log("Received 'joinChannel' for " + cData.channelId);
            console.time("join_time");
            // Initialize the channel
            fileSystem.findPath(cData.channelId).then(function (fold) {
              if (fold) {

                // require first to authenticate, at least read access to join
                ctrl = _channelController(cData.channelId, fileSystem, me, {
                  clientProtocol: 2
                });
                ctrl.then(function () {
                  console.log("\u001b[36m", "Channel Controller inited", "\u001b[0m");
                  socket.join(cData.channelId);
                  me._openChannels[ctrl.getID()] = ctrl;
                  me.addSocketToCh(cData.channelId, socket);
                  socket.__channels.push(cData.channelId);
                  socket.setAuthInfo([777], ["users"]);
                  console.log("\u001b[36m", "Ready to send response", "\u001b[0m");

                  try {
                    responseFn({
                      success: true,
                      channelId: cData.channelId,
                      start: ctrl.getStartupData()
                    });
                    console.timeEnd("join_time");
                    console.log("\u001b[36m", "Response was sent", "\u001b[0m");
                  } catch (e) {
                    console.log("\u001b[35m", e.message, "\u001b[0m");
                  }
                });
              } else {
                responseFn({
                  success: false,
                  channelId: null
                });
              }
            }).fail(function () {
              responseFn({
                success: false,
                channelId: null
              });
            });
          });

          socket.on("requestChannel", function (cData, responseFn) {

            // Request channel -> possible also autocreate channels, if they don't exist

            fileSystem.findPath(cData.channelId).then(function (fold) {
              if (fold) {

                // require first to authenticate, at least read access to join
                ctrl = _channelController(cData.channelId, fileSystem, me);
                ctrl.then(function () {
                  if (ctrl._groupACL(socket, "r")) {
                    socket.join(cData.channelId);
                    me._openChannels[ctrl.getID()] = ctrl;
                    me.addSocketToCh(cData.channelId, socket);
                    socket.__channels.push(cData.channelId);
                    responseFn({
                      success: true,
                      channelId: cData.channelId
                    });
                    console.timeEnd("join_time");
                  } else {
                    responseFn({
                      success: false,
                      channelId: null
                    });
                  }
                });
              } else {
                /*
                if(chData && !chData.__acl) {
                chData.__acl = chSettings.__acl;
                }
                 if(!chSettings.channelId || !chSettings._userId ) {
                response({
                result : false,
                text : "Could not create the channel, missing information"
                });             
                return;
                }
                 var obj = {
                version : 2,    // with pre-initialized data, the first version is 2
                channelId : chSettings.channelId,
                userId : chSettings._userId,
                name : chSettings.name || "",
                utc : (new Date()).getTime()
                };                
                */
                if (_autoCreateFn) {
                  // ---
                  console.log("** Starting to autocreate channel **" + cData.channelId);
                  _autoCreateFn(cData, socket, function (shouldCreate, withData) {
                    if (shouldCreate && withData) {
                      // --> creates a new channel...
                      var model = _localChannelModel(null, fileSystem);
                      model.createChannel({
                        chData: withData,
                        _userId: socket.getUserId(),
                        name: "autocreated",
                        channelId: cData.channelId
                      }).then(function (r) {
                        if (!r.result) {
                          responseFn({
                            success: false,
                            channelId: null
                          });
                          return;
                        }
                        ctrl = _channelController(cData.channelId, fileSystem, me);
                        ctrl.then(function () {
                          if (ctrl._groupACL(socket, "r")) {
                            console.log("** autocreated a channel **" + cData.channelId);
                            socket.join(cData.channelId);
                            me.addSocketToCh(cData.channelId, socket);
                            socket.__channels.push(cData.channelId);
                            responseFn({
                              success: true,
                              channelId: cData.channelId
                            });
                          } else {
                            responseFn({
                              success: false,
                              channelId: null
                            });
                          }
                        });
                      });
                    } else {
                      responseFn({
                        success: false,
                        channelId: null
                      });
                    }
                  });
                } else {
                  responseFn({
                    success: false,
                    channelId: null
                  });
                }
              }
            });
          });

          socket.on("disconnect", function () {
            // console.log("--- channel manager got disconnect to the service pool ---- ");
            // console.log("TODO: remove the channel so that it will not leak memory");
            // me.removeSocketFromCh(  socket );
            console.log("Socket is in " + socket.__channels.length + " channels ");
            socket.__channels.forEach(function (chId) {
              if (me.removeSocketFromCh(chId, socket)) {
                // the channel should be archived here...
                ctrl = _channelController(chId, fileSystem, me);
                if (ctrl) {
                  ctrl.closeChannel();
                }
              }
            });
          });

          socket.on("auth", function (cData, responseFn) {
            console.time("join_time");
            if (_authExtension) {
              try {
                _authExtension(cData, function (success, userid, groups) {
                  if (success === true) {
                    var UID = userid;
                    console.log("custom authentication into ", groups);
                    socket.setAuthInfo(UID, groups);
                    responseFn({
                      success: true,
                      userId: socket.getUserId(),
                      groups: groups
                    });
                  } else {
                    responseFn({
                      success: false,
                      userId: null
                    });
                  }
                });
              } catch (e) {
                responseFn({
                  success: false,
                  userId: null
                });
              }
            } else {
              if (authManager) {
                authManager.login(cData.userId, cData.password).then(function (res) {
                  if (res.result === true) {
                    var UID = res.userId;
                    var groups = res.groups;
                    console.log("AUTH groups ", res.groups);
                    socket.setAuthInfo(UID, groups);
                    responseFn({
                      success: true,
                      userId: socket.getUserId(),
                      groups: res.groups
                    });
                  } else {
                    responseFn({
                      success: false,
                      userId: null
                    });
                  }
                });
              } else {
                responseFn({
                  success: false,
                  userId: null
                });
              }
            }
          });

          socket.on("exitChannel", function (cmd, responseFn) {
            if (cmd.channelId && me.removeSocketFromCh(cmd.channelId, socket)) {
              // the channel should be archived here...
              ctrl = _channelController(cmd.channelId, fileSystem, me);
              if (ctrl) {
                ctrl.closeChannel();
                delete me._openChannels[ctrl.getID()];
              }
            }
            responseFn();
          });

          // messages to the channel from the socket
          socket.on("channelCommand", function (cmd, responseFn) {

            console.log("Channel command ");
            console.log(cmd);

            if (!socket.getUserId()) {
              console.log("ERROR: no userid");
              responseFn({
                success: false,
                reason: "socket is not authenticated."
              });
              return;
            }

            if (!socket.isInRoom(cmd.channelId)) {
              console.log("ERROR: not in room");
              responseFn({
                success: false,
                reason: "not in room"
              });
              return;
            }
            console.log("ok to run ");
            // the command for the channel controller...
            ctrl.run(cmd, function (resp) {
              if (responseFn) responseFn(resp);
            }, socket);
          });
        });
      });

      /**
       * @param float chId
       * @param float socket
       */
      _myTrait_.removeSocketFromCh = function (chId, socket) {
        if (!this._channelSockets[chId]) return;

        var list = this._channelSockets[chId];
        var i = list.indexOf(socket);
        if (i >= 0) {
          list.splice(i, 1);
        }

        if (list.length == 0) {
          console.log("-- all clients have left " + chId + " => should close the channel --- ");
          return true;
        } else {
          console.log("-- client left " + chId + " still  " + list.length + " connected");
        }
      };

      /**
       * @param float fn
       */
      _myTrait_.setAccessManager = function (fn) {
        _accessManager = fn;
      };

      /**
       * @param float fn
       */
      _myTrait_.setAuthExtension = function (fn) {
        _authExtension = fn;
      };

      /**
       * @param float fn
       */
      _myTrait_.setAutoCreateFn = function (fn) {
        _autoCreateFn = fn;
      };

      /**
       * Sets primary command lookup function for the server.
       * @param Function fn  - Function to return the command
       */
      _myTrait_.setCmdLookup = function (fn) {
        _cmdLookup = fn;
      };
    })(this);
  };

  var _serverChannelMgr = function _serverChannelMgr(a, b, c, d, e, f, g, h) {
    var m = this,
        res;
    if (m instanceof _serverChannelMgr) {
      var args = [a, b, c, d, e, f, g, h];
      if (m.__factoryClass) {
        m.__factoryClass.forEach(function (initF) {
          res = initF.apply(m, args);
        });
        if (typeof res == "function") {
          if (res._classInfo.name != _serverChannelMgr._classInfo.name) return new res(a, b, c, d, e, f, g, h);
        } else {
          if (res) return res;
        }
      }
      if (m.__traitInit) {
        m.__traitInit.forEach(function (initF) {
          initF.apply(m, args);
        });
      } else {
        if (typeof m.init == "function") m.init.apply(m, args);
      }
    } else return new _serverChannelMgr(a, b, c, d, e, f, g, h);
  };

  _serverChannelMgr._classInfo = {
    name: "_serverChannelMgr"
  };
  _serverChannelMgr.prototype = new _serverChannelMgr_prototype();

  (function () {
    if (typeof define !== "undefined" && define !== null && define.amd != null) {
      __amdDefs__["_serverChannelMgr"] = _serverChannelMgr;
      this._serverChannelMgr = _serverChannelMgr;
    } else if (typeof module !== "undefined" && module !== null && module.exports != null) {
      module.exports["_serverChannelMgr"] = _serverChannelMgr;
    } else {
      this._serverChannelMgr = _serverChannelMgr;
    }
  }).call(new Function("return this")());

  var _channelController_prototype = function _channelController_prototype() {

    (function (_myTrait_) {
      var _instances;
      var _cmds;

      // Initialize static variables here...

      /**
       * @param float t
       */
      _myTrait_._askChUpgrade = function (t) {

        var sockets = this._chManager.getSocketsFromCh(this._channelId);

        var me = this;
        sockets.forEach(function (socket) {

          if (!me._serverState.upgrade) me._serverState.upgrade = {};
          me._serverState.upgrade[socket.getId()] = {
            askFull: true,
            socket: socket
          };
        });
      };

      if (!_myTrait_.hasOwnProperty("__factoryClass")) _myTrait_.__factoryClass = [];
      _myTrait_.__factoryClass.push(function (id, fileSystem) {
        if (!_instances) {
          _instances = {};
        }

        id = id + fileSystem.id();

        if (_instances[id]) {
          return _instances[id];
        } else {
          this._instanceId = id;
          _instances[id] = this;
        }
      });

      /**
       * @param float t
       */
      _myTrait_._createRepWorker = function (t) {};

      /**
       * @param Object cmd
       */
      _myTrait_._createSyncCh = function (cmd) {
        var me = this;
        var cc = null; // <-- connect to the channel

        // master-sync file contents
        // [2,621]

        // The sync file contents
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

        console.log("** startin _createSyncCh with data **");
        console.log(JSON.stringify(cmd));

        return _promise(function (syncReady, syncFail) {

          // -> channel to checkout...
          var sync = cmd.sync; // <-- the sync file contents
          var outSocket;

          if (sync.out.method == "memory.socket") {
            outSocket = _clientSocket(sync.out.protocol + "://" + sync.out.ip, sync.out.port);
          }

          if (sync.out.method == "node.socket") {
            var ioLib = require("socket.io-client");
            var realSocket1 = ioLib.connect(sync.out.protocol + "://" + sync.out.ip + ":" + (sync.out.extPort || sync.out.port));
            outSocket = _clientSocket(sync.out.protocol + "://" + sync.out.ip, sync.out.port, realSocket1);
          }

          // cc = HERE the slave connection which the server1 has to server2
          // slave <-> master connection
          var cc = channelClient(sync.out.channelId, outSocket, {
            auth: {
              username: sync.out.username,
              password: sync.out.password
            }
          });

          cc.then(function () {
            cc._checkout(sync.out.channelId).then(function (r) {

              // the channel has been now checked out
              /*
              {"ch":"my/channel",
              "file":"ch.settings",
              "data":"{\"version\":2,\"channelId\":\"my/channel\",\"journalLine\":1,\"utc\":14839287897}"}        
              */
              var wait = _promise();
              var start = wait;

              var fileSystem = me._model.getFilesystem(); // <- the root filesystem for the checkout process

              // TODO: this is all overriding sync, what if the channel already does exist?
              if (r.build) r.build.forEach(function (fileData) {
                var m;
                wait = wait.then(function () {
                  m = _localChannelModel(fileData.ch, fileSystem);
                  return m;
                }).then(function () {
                  return m.folder().isFile(fileData.ch);
                }).then(function (is_file) {
                  // if the local file already does exist then do not write it
                  if (!is_file) {
                    return m.writeFile(fileData.file, fileData.data);
                  } else {
                    return is_file;
                  }
                });
              });

              // after this has been done, the data should be loaded and the checkout is ready to be used by any
              // connection which opens it
              var folder = me._model.folder();
              wait = wait.then(function () {
                // TODO:
                // - create masterSync NOTE : good to write so that it does not start from [0,0]
                // - create sync file
                //
                return folder.isFile("sync");
              }).then(function (is_file) {
                if (!is_file) {
                  return folder.writeFile("sync", JSON.stringify(sync));
                }
              }).then(function (is_file) {
                return folder.isFile("master-sync");
              }).then(function (is_file) {
                if (!is_file) {
                  var ms = [cc._clientState.version, cc._clientState.data.getJournalLine()];
                  return folder.writeFile("master-sync", JSON.stringify(ms));
                }
              }).then(function () {
                syncReady(sync);
              }).fail(syncFail);
            }).fail(syncFail);
          }).fail(syncFail);
        });
      };

      /**
       * @param float t
       */
      _myTrait_._doClientUpdate = function (t) {

        var updObj,
            me = this;

        if (!me._serverState) return;

        // if client has sent "upgradeRequest" command, because it notices that it has
        // been drifted out of state. The client's request can have .askFull = true
        // flag set to indicate that the client requires the full channelData with
        // the whole journal to be sent to the client from server.
        if (me._serverState.upgrade) {

          // me._serverState.upgrade is a hash having the socketID values as keys
          for (var n in me._serverState.upgrade) {

            if (me._serverState.upgrade.hasOwnProperty(n)) {
              var info = me._serverState.upgrade[n];

              if (info.socket) {
                // do we need a full update or partial update?
                if (info.version != me._serverState.version || info.askFull) {
                  var fullData = me._serverState.data.getData();
                  info.socket.emit("upgrade_" + me._channelId, {
                    version: me._serverState.version,
                    journal: me._serverState.data._journal,
                    data: fullData
                  });
                } else {
                  var lastJournaLine = info.last_update[1];
                  info.socket.emit("upgrade_" + me._channelId, {
                    partialFrom: lastJournaLine,
                    partialEnds: me._serverState.data._journal.length,
                    partial: me._serverState.data._journal.slice(lastJournaLine)
                  });
                }
                delete me._serverState.upgrade[n]; // make sure not handled again
              }
            }
          }
        }

        // This is the "business as usual" data from server to the clients.
        // If server has received commands which have been added to the journal and
        // these lines have not been yet sent to the clients, _policy will construct
        // the packet to be sent to listeners.
        if (me._broadcastSocket && me._policy) {
          var data = me._policy.constructServerToClient(me._serverState);
          if (data) {

            //console.log(" has something to sent to the clients ");
            //console.log(JSON.stringify(data));

            if (!updObj) updObj = me._broadcastSocket.to(me._channelId);

            var currentJournalSize = me._model.getJournalSize();
            data.journalSize = currentJournalSize;

            updObj.emit("s2c_" + me._channelId, data);

            var updStartMsEnd = new Date().getTime();
            // the server's connection to the remote client goes here...
            if (me._syncConnection && me._syncConnection.isConnected()) {
              // console.log("--- sending data to me._syncConnection --- ");
              if (data.c) {
                data.c.forEach(function (eCmd) {
                  // Note: the addCommand is just fine because it will run the command against the
                  // client -> server connection state, if the command fails, then it will not be
                  // sent over the network to the remote server at all
                  var r = me._syncConnection.addCommand(eCmd);
                });
              }
              // the last lines sent to the server
              me._masterSync = [me._serverState.version, me._serverState.data.getJournalLine()];
              me._model.folder().writeFile("master-sync", JSON.stringify(me._masterSync));
            }

            // data.c is array of journal entries to be written to the actual journal file
            me._model.writeToJournal(data.c).then(function (r) {});
          }
        }
      };

      /**
       * Executes command with admin priviledges wihtout socket connection
       * @param float cmd
       * @param float socket  - not used
       * @param float options  - not used
       */
      _myTrait_._execCmd = function (cmd, socket, options) {
        // 1. selecting the command to be run here...
        var me = this;
        return _promise(function (result) {
          if (!cmd || !cmd.cmd) {
            result(null);
            return;
          }
          var fn = me._cmds[cmd.cmd];
          if (fn) {
            me._commands.addCommands(function (contFn) {
              fn(cmd, function (r) {
                result(r);
                contFn();
              }, {
                _adminSocket: true
              });
            });
          } else {
            result(null);
          }
        });
        /*
        var me = this;
        return _promise(
        function(result) {
        if(!cmd || ! cmd.cmd) {
            result(null);
            return;
        }
        var fn = me._cmds[cmd.cmd];
        if(fn) {
            fn(cmd, function(r) {
                result(r);
            }, socket);
        } else {
            result(null);
        }
        });
        */
      };

      /**
       * @param float socket
       * @param float flags
       * @param float cmd
       */
      _myTrait_._groupACL = function (socket, flags, cmd) {

        // for local commands
        if (socket._adminSocket) {
          return true;
        }

        var am = this._chManager.getAccessManager();
        if (am) {
          return am(this, socket, cmd);
        }

        var me = this;
        if (!me._acl) return false;

        var roles = socket.getUserRoles();
        var a_ok = false;
        for (var i = 0; i < roles.length; i++) {
          // must have "read attributes" and "read ACL flags"
          if (me._acl.find("", roles[i] + "@", flags)) {
            a_ok = true;
            break;
          }
        }
        return a_ok;
      };

      /**
       * @param float t
       */
      _myTrait_._initCmds = function (t) {

        if (!_cmds) _cmds = {};
        if (this._cmds) return;

        var me = this;
        this._cmds = {
          treeOfLife: function treeOfLife(cmd, result, socket) {
            if (!me._groupACL(socket, "r", cmd)) {
              result(null);
              return;
            }

            me._model.treeOfLife().then(function (r) {
              result(r);
            });
          },
          // -- perhaps a bit hard command here...
          sync: function sync(cmd, result, socket) {
            if (!me._groupACL(socket, "w", cmd)) {
              result(null);
              return;
            }

            // can you check that the local port is not the same as the out port

            if (!cmd || !cmd.data || !cmd.data.sync || !cmd.data.sync.out || !cmd.data.sync["in"]) {
              console.log("ERROR: Sync failed");
              console.log(JSON.stringify(cmd));
              result({
                success: false
              });
              return;
            }
            var out = cmd.data.sync.out;
            var serverSocket = socket;
            /*
            this._ip = ip;
            this._port = port;
            this._ioLib = ioLib;
            */
            if (serverSocket._ip == out.ip) {
              if (serverSocket._ioLib) {
                var ss = serverSocket._ioLib;
                if (ss.handshake) {
                  var address = ss.handshake.address;
                  if (address && address.port == out.extPort) {
                    result({
                      success: false
                    });
                    return;
                  }
                }
                // console.log("New connection from " + address.address + ":" + address.port);       
              }
            }
            // --> can you just create a new channel based on the data..
            //me._model.createChannel( cmd.data ).then( function(r) {
            //    result(r);
            // });

            var localModel = _localChannelModel(cmd.data.sync["in"].channelId, me._model.getFilesystem());

            // must create the channel controller...
            // var ctrl = _channelController( cmd.data.sync["in"].channelId, me._model.getFilesystem(), me._chManager );

            localModel.then(function () {
              return localModel.createSyncedModel(cmd.data); // <-- should create the sync
            }).then(function () {
              result({
                success: true
              });
            }).fail(function () {
              result({
                success: false
              });
            });
          },
          checkout: function checkout(cmd, result, socket) {
            if (!me._groupACL(socket, "r", cmd)) {
              result(null);
              return;
            }

            // read the build tree and the status...
            me._model.readCheckoutData().then(function (r) {
              result({
                build: r
              });
            });
          },
          readBuildTree: function readBuildTree(cmd, result, socket) {

            if (!me._groupACL(socket, "r", cmd)) {
              result(null);
              return;
            }

            if (!me._broadcastSocket && socket.getUserId) me._broadcastSocket = socket;

            // read the build tree and the status...
            me._model.readBuildTree().then(function (r) {

              me._model.status().then(function (status) {
                result({
                  status: status,
                  build: r
                });
              });
              // result(r);
            });
          },
          getForks: function getForks(cmd, result, socket) {
            if (!me._groupACL(socket, "r", cmd)) {
              result(null);
              return;
            }
            me._model.getForks().then(function (r) {
              result(r);
            });
          },
          channelStatus: function channelStatus(cmd, result, socket) {
            if (!me._groupACL(socket, "tc", cmd)) {
              result(null);
              return;
            }
            me._model.status().then(function (r) {
              result(r);
            });
          },
          raw: function raw(cmd, result, socket) {
            if (me._groupACL(socket, "tc")) {
              result(me._chData.getData());
            } else {
              result(null);
            }
          },
          createChannel: function createChannel(cmd, result, socket) {
            if (!me._groupACL(socket, "w", cmd)) {
              result(null);
              return;
            }
            if (!cmd.data) {
              result({
                ok: false
              });
              return;
            }
            if (!cmd.data.__acl) {
              var fullData = me._serverState.data.getData();
              if (!fullData || !fullData.__acl) {
                result({
                  ok: false
                });
                return;
              }
              cmd.data.__acl = fullData.__acl;
            }
            cmd.data._userId = socket.getUserId();
            me._model.createChannel(cmd.data).then(function (r) {
              result(r);
            });
          },
          fork: function fork(cmd, result, socket) {
            if (!me._groupACL(socket, "w", cmd)) {
              result(null);
              return;
            }
            if (!cmd.data) {
              result({
                ok: false
              });
              return;
            }
            cmd.data._userId = socket.getUserId();
            me._model.fork(cmd.data).then(function (r) {
              result(r);
            });
          },
          // the snapshot command should cause all the sockets to be upgraded
          snapshot: function snapshot(cmd, result, socket) {

            console.log("got snapshot command");

            if (!me._groupACL(socket, "w", cmd)) {
              result(null);
              return;
            }

            var fullData = me._serverState.data.getData();

            if (fullData.__orphan) {
              fullData.__orphan.length = 0;
            }

            // first, save all the unsaved changes and refresh the clients with unsent data
            me._doClientUpdate();

            // then, create new version of the main file
            me._model.snapshot(fullData).then(function (r) {

              // the _serverState data must be also upgraded...
              me._serverState.version++; // ????
              me._serverState.data._journal.length = 0;
              me._serverState.last_update[0] = 0;
              me._serverState.last_update[1] = 0;

              if (me._masterSync) {
                me._masterSync = [me._serverState.version, 0];
                me._model.folder().writeFile("master-sync", JSON.stringify(me._masterSync)).then(function () {
                  me._askChUpgrade(me._channelId);
                  result({
                    ok: true
                  });
                });
              } else {
                // ask channels to upgrade to the latest version of data
                me._askChUpgrade(me._channelId);
                result({
                  ok: true
                });
              }
            });
          },
          writeMain: function writeMain(cmd, result, socket) {
            if (!me._groupACL(socket, "w", cmd)) {
              result(null);
              return;
            }
            me._model.writeFile("main", cmd.data).then(function (r) {
              result({
                ok: true
              });
            });
          },
          readMain: function readMain(cmd, result, socket) {
            if (!me._groupACL(socket, "r", cmd)) {
              result(null);
              return;
            }
            me._model.readMain().then(function (r) {
              result(r);
            });
          },
          readMainVersion: function readMainVersion(cmd, result, socket) {
            if (!me._groupACL(socket, "r", cmd)) {
              result(null);
              return;
            }
            me._model.readMain(cmd.data).then(function (r) {
              result(r);
            });
          },
          upgradeRequest: function upgradeRequest(cmd, result, socket) {

            if (!me._groupACL(socket, "r", cmd)) {
              result(null);
              return;
            }
            if (!me._serverState.upgrade) {
              me._serverState.upgrade = {};
            }

            // the upgrade request sent by the client...
            cmd.data.socket = socket;
            me._serverState.upgrade[socket.getId()] = cmd.data;

            result({
              result: true
            });
          },
          chCmd: function chCmd(cmd, result, socket) {
            console.log("chCmd command ");
            if (!me._groupACL(socket, "w", cmd)) {
              result(null);
              return;
            }
            try {
              // multiple commands are possible
              /*
              {
                cmdList : [
                    { cmd : "setTitle", params : { id : "", title : "" }
                ]
              }
              */
              if (!me._broadcastSocket && socket.getUserId) me._broadcastSocket = socket;
              var list = cmd.data.cmdList;
              if (list) {
                for (var i = 0; i < list.length; i++) {

                  var cmdData = list[i];
                  var chData = me._serverState.data;
                  var name = cmdData.cmd;

                  // finding the commands for the channels etc.
                  var fn = me._chManager._findCmd(name, me._channelId, socket);

                  if (fn) {
                    if (cmdData.__id) {
                      var chAgent = _agent(chData._find(cmdData.__id), chData);
                    } else {
                      var chAgent = _agent(chData);
                    }
                    chAgent.socket = socket;

                    if (fn) {
                      fn.apply(chAgent, [cmdData.params]);
                    }
                  }
                }
              }
              result(true);
            } catch (e) {
              console.log("chCmd failed with " + e.message);
              result(false);
            }
          },
          // simple command update from the client
          sendCmds: function sendCmds(cmd, result, socket) {

            console.log("sendCmds command ");
            if (!me._groupACL(socket, "w", cmd)) {
              console.log("permission denied");
              result(null);
              return;
            }
            if (!me._broadcastSocket && socket.getUserId) me._broadcastSocket = socket;
            try {

              var chData = me._serverState.data;
              var list = cmd.data.commands;

              // now, it's simple, we just try to apply all the comands
              for (var i = 0; i < list.length; i++) {
                console.log("executing " + list[i]);
                console.log(chData);
                console.log(chData.getData());
                var cmdRes = chData.execCmdAsAction(list[i]);
                if (cmdRes !== true) {
                  console.log("\u001b[33m", cmdRes, "\u001b[0m");
                  break;
                }
                console.log(chData._journal.length);
              }
              result(true);
            } catch (e) {
              // in this version, NO PROBLEMO!
              console.log("\u001b[33m", e.message, "\u001b[0m");
              result(e.message);
            }
          },
          c2s: function c2s(cmd, result, socket) {

            if (!me._groupACL(socket, "w", cmd)) {
              result(null);
              return;
            }

            // adding timestamp + user id, perhaps the transaction ID would be better?
            if (socket.getUserId) {
              var uid = socket.getUserId();
              var len = cmd.data.c.length,
                  list = cmd.data.c,
                  utc = new Date().getTime();
              for (var i = 0; i < len; i++) {
                list[i][5] = utc;
                list[i][6] = uid;
              }
            }

            // TODO: transaction types here...
            var res = {};
            try {
              var clientFrame = cmd.data;
              var chData = me._serverState.data; // the channel data object
              // now, it's simple, we just try to apply all the comands
              for (var i = 0; i < clientFrame.c.length; i++) {
                var c = clientFrame.c[i];
                var cmdRes = chData.execCmdAsAction(c);
                // handle errors, if necessary...
                if (cmdRes !== true) {}
              }
            } catch (e) {}

            if (!me._broadcastSocket && socket.getUserId) me._broadcastSocket = socket;
            result(res);
          },
          // here is the point to upgrade the server according to data sent from the client
          masterUpgrade: function masterUpgrade(cmd, result, socket) {
            if (!me._groupACL(socket, "w", cmd)) {
              result(null);
              return;
            }

            console.log("creating a master upgrade with ");
            console.log(JSON.stringify(cmd));

            if (socket.getUserId) {
              var uid = socket.getUserId();
              var len = cmd.data.c.length,
                  list = cmd.data.c,
                  utc = new Date().getTime();
              for (var i = 0; i < len; i++) {
                list[i][5] = utc;
                list[i][6] = uid;
              }
            }

            // check that the command is valid
            var res = me._policy.deltaMasterToSlave(cmd.data, me._serverState);

            if (!me._broadcastSocket && socket.getUserId) me._broadcastSocket = socket;

            // here is a problem, can not wait for the deltaMasterToSlave to finish
            // because it is a thenable
            if (res && res.then) {
              result({
                upgradeingMaster: true
              });
              return;
              /*
              res.then( function(r) {
                // result(r);
              });
              result({
                
              });
              return;
              */
            }
            console.log("result of master upgrade ");
            console.log(JSON.stringify(res));
            result(res);
          } };
      };

      /**
       * @param float t
       */
      _myTrait_._ngClientUpdate = function (t) {

        var updObj,
            me = this;

        if (!me._serverState) {
          console.log("_ngClientUpdate no server state");
          return;
        }

        var model = this._model;
        var settings = model._settings;
        var chData = this._serverState.data;
        var serverState = me._serverState;
        var dataStart = serverState.dataStart; // .line and .version
        var journal_len = chData._journal.length;

        // hFile = ".hibernated."+settings.version+"."+settings.journalLine;

        // send data to clients which have requested full data
        if (me._serverState.upgrade) {
          // send data + current position of the servers (Version,Journal)
          for (var n in me._serverState.upgrade) {
            if (me._serverState.upgrade.hasOwnProperty(n)) {
              var info = me._serverState.upgrade[n];
              if (info.socket) {
                var fullData = chData.getData();
                info.socket.emit("full_" + me._channelId, {
                  version: settings.version,
                  journal: journal_len + dataStart.line,
                  data: fullData
                });
                delete me._serverState.upgrade[n]; // make sure not handled again
              }
            }
          }
        }

        if (!serverState.last_update) serverState.last_update = [];

        // last_update : [1, 30]
        var start = serverState.last_update[1] || 0;
        var end = journal_len + dataStart.line;

        // if last end is same as last journal line, do nothing
        if (start == end && serverState.last_sent_version == settings.version) {
          console.log("_ngClientUpdate - nothing to send");
          console.log("Journal length " + journal_len);
          console.log("Start, end ", start, end);
          return;
        }

        console.log("ngUpdate, something to send");

        // the version number has changed, send all data to all client to re-sync them
        var big_update = false;
        if (serverState.last_sent_version != settings.version) {
          big_update = true;
        }

        // sending these lines now:
        serverState.last_update[0] = start;
        serverState.last_update[1] = end;
        serverState.last_sent_version = settings.version;

        // TODO send also the last update + possibly information if we are
        // upgrading the version? How to handle the version upgrade in this case?

        var cmdPacket = {
          cmd: "s2c",
          cmds: chData._journal.slice(), // send all the journal lines
          big: big_update,
          start: start,
          end: end,
          version: settings.version
        };

        // Big update
        if (big_update) {
          cmdPacket.data = chData.getData();
          serverState.dataStart.version = settings.version;
        }

        // Then, move the data start pointer forward
        serverState.dataStart.line += journal_len;

        // and reset the journal position to 0, truncates the in-memory journal
        chData.resetJournal();

        if (me._broadcastSocket) {

          console.log("ngUpdate, broadcasting to sockets");

          var updObj = me._broadcastSocket.to(me._channelId);
          updObj.emit("cmds_" + me._channelId, cmdPacket);

          // and finally, write dat to the journa l
          serverState.lastJournalPromise = me._model.writeToJournal(cmdPacket.cmds);
        }
      };

      /**
       * @param float t
       */
      _myTrait_._oldConstructor = function (t) {
        // Then, construct the channel model from the data

        var me = this;

        this._model.readBuildTree().then(function (r) {

          // the build tree
          var mainData = r.pop();
          var chData = _channelData(me.getID(), mainData, []);
          var list = r.pop();

          // NOW, here is a problem, the in-memory channel "journal" should be truncated
          while (list) {
            chData._journalPointer = 0;
            chData._journal.length = 0; // <-- the journal length, last will be spared
            list.forEach(function (c) {
              chData.execCmd(c);
            });
            list = r.pop();
          }
          // The state of the server - what should be the "last_update" ? 
          me._serverState = {
            model: me._model, // model of the server state, if truncate needed
            data: chData, // The channel data object set here
            version: me._model._settings.version, // the version of the channel model
            last_update: [0, chData.getJournalLine()], // the range of last commands sent to the client
            _done: {} // hash of handled packet ID's
          };

          var data = chData.getData();
          if (data.__acl) {
            me._acl = nfs4_acl(data.__acl);
          }

          // The channel policy might replace the transaction manager...
          me._policy = _chPolicy();

          me._updateLoop(); // start the update loop
          me._chData = chData;
          me.resolve(true);

          // changed from "startSync"
          me._replica = me._startReplica(data);
        });
      };

      /**
       * @param float t
       */
      _myTrait_._sendUnsentToMaster = function (t) {
        // the server's connection to the remote client goes here...
        var me = this;
        if (me._syncConnection && me._syncConnection.isConnected() && me._masterSync) {

          var lastSent = me._masterSync[1];
          var currLine = me._serverState.data.getJournalLine();

          if (currLine > lastSent) {

            console.log("--- _sendUnsentToMaster --- ");
            var cmds = me._serverState.data._journal.slice(lastSent, currLine);

            cmds.forEach(function (eCmd) {
              var r = me._syncConnection.addCommand(eCmd);
            });

            // the last lines sent to the server
            me._masterSync = [0, currLine];
            me._model.folder().writeFile("master-sync", JSON.stringify(me._masterSync));
          }
        }
      };

      /**
       * @param String hFile  - The hibernation filename
       */
      _myTrait_._startFromHibernate = function (hFile) {

        var me = this;
        var model = this._model;

        console.log("\u001b[36m", "Reading hibernated file", "\u001b[0m");
        // Then, construct the channel model from the data
        model.readFile(hFile).then(function (mainData) {

          mainData = JSON.parse(mainData);
          // one might just send the data to clients using the model
          var chData = _channelData(me.getID(), mainData, []);

          console.log("\u001b[36m", "Channel data inited", "\u001b[0m");

          console.log(chData);

          var settings = model._settings;

          // intialize the server state
          me._serverState = {
            model: model, // model of the server state, if truncate needed
            data: chData, // The channel data object set here
            dataStart: {
              line: settings.journalLine,
              version: settings.version
            },
            version: settings.version, // the version of the channel model
            last_sent_version: settings.version, // number of last major version
            last_update: [0, settings.journalLine], // the range of last commands sent to the client
            _done: {} // hash of handled packet ID's
          };

          // -- continue from here --
          // TODO: check that hibernate will hibernate correct version
          // TODO: check the _ngClientUpdate

          var data = chData.getData();
          if (data.__acl) {
            me._acl = nfs4_acl(data.__acl);
          }

          // The channel policy might replace the transaction manager...
          me._policy = _chPolicy();

          me._updateLoop2(); // start the update loop
          me._chData = chData;
          me.resolve(true);

          // changed from "startSync"
          me._replica = me._startReplica(data);
        });
      };

      /**
       * @param Object withData  - The initial data sent to client
       */
      _myTrait_._startReplica = function (withData) {
        var me = this;

        return _promise(function (result) {
          // --> test also if the channel has a master server
          me._model.readFile(".replica").then(function (data) {

            if (!data) {
              console.log("-> no replication data found");
              result(false);
              return;
            }

            console.log("replication data was found");

            var rep = me._chManager.createReplClass();

            new rep().then(function (o) {
              me._replicator = o;
              o.connect({
                clientData: withData,
                url: "http://localhost:7777",
                db: "http://localhost:1234/galaxy/umos/model/piece/positions"
              }, function (rawData) {
                console.log("***** replicator connected ******");
                console.log("***** replicator connected ******");
                console.log(JSON.stringify(rawData));

                var bDiffOn = false;

                // if channel has new data and currently not patching...
                var chData = me._serverState.data,
                    toShadowList = [];
                chData.on("cmd", function (d) {
                  if (bDiffOn) return; // do not re-send the diff commands
                  toShadowList.push([1, d.cmd]);
                  // o.applyToShadow(d.cmd);
                });

                later().onFrame(function () {
                  if (toShadowList.length > 0) o.sendCommands(toShadowList.slice());
                  toShadowList.length = 0;
                });

                o.on("diff", function (cmdList) {
                  bDiffOn = true;
                  // console.log("Trying diff ",cmdList);
                  try {
                    cmdList.forEach(function (cmd) {
                      var chData = me._serverState.data;
                      var cmdRes = chData.execCmd(cmd);
                      if (cmdRes === true) {
                        toShadowList.push([0, cmd]);
                      }
                      // console.log(cmdRes);
                    });
                    // o.patchShadowCmds( list );
                  } catch (e) {
                    console.log(e.message);
                  }
                  bDiffOn = false;
                });
                console.log("initializing the _startReplica done");
              });
            });

            console.log(data);
            result(true);
          });
        });
      };

      /**
       * @param float t
       */
      _myTrait_._startSync = function (t) {
        var me = this;

        return _promise(function (result) {
          // --> test also if the channel has a master server
          me._model.syncData().then(function (data) {

            if (!data) {
              result(false);
              return;
            }

            if (data) {
              console.log("Sync data");
              console.log(data);
              var connData = JSON.parse(data);
              var outConn = connData.out;

              // inConn = connData.in;
              // there is a slave <-> master connection, should create the sync between the two
              // channels around here for some client which takes care of sending the data...

              if (outConn.method == "memory.socket") {
                var outSocket = _clientSocket(outConn.protocol + "://" + outConn.ip, outConn.port);
              }

              if (outConn.method == "node.socket") {
                var ioLib = require("socket.io-client");
                var realSocket1 = ioLib.connect(outConn.protocol + "://" + outConn.ip + ":" + (outConn.extPort || outConn.port));
                var outSocket = _clientSocket(outConn.protocol + "://" + outConn.ip, outConn.port, realSocket1);
              }

              /*
              // TODO: think about if there is need for inConn method at all?  
              if(inConn.method=="memory.socket") {
                  var inSocket  = _clientSocket(inConn.protocol+"://"+inConn.ip, inConn.port);
              }
                       if(inConn.method=="node.socket") {
                  var ioLib = require('socket.io-client')
                  var realSocket2 = ioLib.connect(outConn.protocol+"://"+inConn.ip+":"+( inConn.extPort || inConn.port));            
                  var inSocket  = _clientSocket(outConn.protocol+"://"+inConn.ip, inConn.port, realSocket2);
              } 
              
              // TODO: how to make the authentication between 2 clients ?
              var inConnection = channelClient( inConn.channelId, inSocket, {
                      auth : {
                          username : inConn.username,
                          password : inConn.password
                      }
                  });         
              */

              // TODO: how to make the authentication between 2 clients ?
              var outConnection = channelClient(outConn.channelId, outSocket, {
                auth: {
                  username: outConn.username,
                  password: outConn.password
                }
              });

              outConnection.then(function () {
                console.log("out done, checking for master-sync");
                return me._model.folder().isFile("master-sync");
              }).then(function (is_file) {
                if (!is_file) {
                  console.log("master-sync missing");

                  // TODO: is there a problem here, [0,0] may not be a valid start for the channel...
                  return me._model.writeFile("master-sync", JSON.stringify([me._serverState.version, 0]));
                }
                return 0;
              }).then(function () {
                console.log("reading master-sync missing");
                return me._model.readFile("master-sync");
              }).then(function (d) {
                console.log(d);
                me._masterSync = JSON.parse(d);
                return d;
              }).then(function (d) {
                // ?? whot if there would be only the "out" connection
                // inConnection.setMasterConnection( outConnection );
                // outConnection.setSlaveServer( inConnection );    

                outConnection._slaveController = me;
                me._syncConnection = outConnection;

                // <- when sync starts, send first all unsent data
                me._sendUnsentToMaster();

                // outConnection.setChannelModel( me._model );
                console.log("sync: ---- in / out connection ready --- ");
                result(true);
              });
            }
          });
        });
      };

      /**
       * @param float t
       */
      _myTrait_._updateLoop = function (t) {

        // TODO: make the update loop a setting or automatically adjusting value depending
        // on the server load - the function is not required to be run if there is no activity
        // and it should be removed if the client exits from the channel.
        var me = this;
        later().onFrame(function () {
          me._doClientUpdate();
        });
      };

      /**
       * @param float t
       */
      _myTrait_._updateLoop2 = function (t) {

        console.log("\u001b[36m", "_updateLoop2 started", "\u001b[0m");
        var me = this;
        // slow interval
        later().every(2, function () {
          me._ngClientUpdate();
        });
      };

      /**
       * @param float t
       */
      _myTrait_.channelId = function (t) {
        return this._channelId;
      };

      /**
       * @param float t
       */
      _myTrait_.closeChannel = function (t) {

        console.log("Hibernating " + this._channelId);

        // this._closing = true;

        var serverState = this._serverState,
            model = this._model;

        var data = serverState.data.getData();

        // serverState.lastJournalPromise

        // Channel model version + _settings
        // _settings
        var settings = model._settings;

        // TODO: make sure we are really hibernating the the right version
        // of the data, could be that the version to be written to file has not
        // yet updatedfilesystem

        // TODO: disallow possible pending writes to the chData object which might
        // modify the settings.version + settings.journaLine

        // TODO: if there is a pending filewrite to the system, you might wait for
        // that to complete before

        if (serverState.lastJournalPromise) {
          return serverState.lastJournalPromise.then(function () {
            return model.writeFile(".hibernated." + settings.version + "." + settings.journalLine, data);
          });
        }

        // Hibernate to the version + journal line
        return model.writeFile(".hibernated." + settings.version + "." + settings.journalLine, data);
      };

      /**
       * @param float t
       */
      _myTrait_.getID = function (t) {
        return this._instanceId;
      };

      /**
       * @param float t
       */
      _myTrait_.getStartupData = function (t) {

        var updObj,
            me = this;
        if (!me._serverState) return;

        var settings = this._model._settings;
        var chData = this._serverState.data;
        var dataStart = this._serverState.dataStart; // .line and .version
        var journal_len = chData._journal.length;

        var fullData = chData.getData();

        return {
          version: settings.version,
          journal: journal_len + dataStart.line,
          data: fullData
        };
      };

      if (_myTrait_.__traitInit && !_myTrait_.hasOwnProperty("__traitInit")) _myTrait_.__traitInit = _myTrait_.__traitInit.slice();
      if (!_myTrait_.__traitInit) _myTrait_.__traitInit = [];
      _myTrait_.__traitInit.push(function (channelId, fileSystem, chManager, options) {

        this._channelId = channelId;
        this._commands = sequenceStepper(channelId + fileSystem.id());
        this._chManager = chManager;
        this._fileSystem = fileSystem;

        // important point: the file system is passed here to the local channel model
        // to enable singleton models using the fileSystem ID value together with the
        // channel ID value.

        this._model = _localChannelModel(channelId, fileSystem);
        var me = this;
        options = options || {};

        this._options = options;

        // options.fast = next generation faster loading of the channel data
        if (options.clientProtocol == 2) {
          console.log("\u001b[36m", "Trying protocol v2.0", "\u001b[0m");
          var model = this._model;
          model.then(function () {

            var settings = model._settings,
                hFile = ".hibernated." + settings.version + "." + settings.journalLine;

            // if the hibernated channel does exist then start from it   
            model.isFile(hFile).then(function (is_file) {
              if (is_file) {
                console.log("\u001b[36m", "Starting Protocol v2.0", "\u001b[0m");
                me._startFromHibernate(hFile);
              } else {
                console.log("\u001b[35m", "The Hibernation file was invalid", "\u001b[0m");
                me._oldConstructor();
              }
            });
          });
        } else {
          this._oldConstructor();
        }

        this._initCmds();
      });

      /**
       * @param float cmd
       * @param float responseFn
       * @param float socket
       */
      _myTrait_.run = function (cmd, responseFn, socket) {

        // 1. selecting the command to be run here...
        var fn = this._cmds[cmd.cmd],
            me = this;
        if (fn) {
          this._commands.addCommands(function (contFn) {
            if (me._closing) return;
            console.log("#" + cmd.cmd);
            fn(cmd, function (result) {
              responseFn(result);
              contFn();
            }, socket);
          });
        }
      };
    })(this);
  };

  var _channelController = function _channelController(a, b, c, d, e, f, g, h) {
    var m = this,
        res;
    if (m instanceof _channelController) {
      var args = [a, b, c, d, e, f, g, h];
      if (m.__factoryClass) {
        m.__factoryClass.forEach(function (initF) {
          res = initF.apply(m, args);
        });
        if (typeof res == "function") {
          if (res._classInfo.name != _channelController._classInfo.name) return new res(a, b, c, d, e, f, g, h);
        } else {
          if (res) return res;
        }
      }
      if (m.__traitInit) {
        m.__traitInit.forEach(function (initF) {
          initF.apply(m, args);
        });
      } else {
        if (typeof m.init == "function") m.init.apply(m, args);
      }
    } else return new _channelController(a, b, c, d, e, f, g, h);
  };

  _channelController_prototype.prototype = _promise.prototype;

  _channelController._classInfo = {
    name: "_channelController"
  };
  _channelController.prototype = new _channelController_prototype();

  (function () {
    if (typeof define !== "undefined" && define !== null && define.amd != null) {
      __amdDefs__["_channelController"] = _channelController;
      this._channelController = _channelController;
    } else if (typeof module !== "undefined" && module !== null && module.exports != null) {
      module.exports["_channelController"] = _channelController;
    } else {
      this._channelController = _channelController;
    }
  }).call(new Function("return this")());

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
        if (!this.isArray(what)) what = what.split(",");

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

        dataCh.createWorker("_to_ch", // worker ID
        [7, "*", null, null, ns_id], // filter
        {
          target: this
        });

        dataCh.createWorker("_to_ch", // worker ID
        [5, "*", null, null, ns_id], // filter
        {
          target: this
        });

        dataCh.createWorker("_d_set", // worker ID
        [4, "*", null, null, ns_id], // filter
        {
          target: this
        });

        dataCh.createWorker("_d_rem", // worker ID
        [8, "*", null, null, ns_id], // filter
        {
          target: this
        });

        dataCh.createWorker("_d_ins", // worker ID
        [7, "*", null, null, ns_id], // filter
        {
          target: this
        });

        dataCh.createWorker("_d_mv", // worker ID
        [12, "*", null, null, ns_id], // filter
        {
          target: this
        });

        // "_d_cf"

        dataCh.createWorker("_d_cf", // worker ID
        [5, "*", null, null, ns_id], // filter
        {
          obj: this
        });
        dataCh.createWorker("_d_cf", // worker ID
        [4, "*", null, null, ns_id], // filter
        {
          obj: this
        });

        // _d_ch -> child object has changed event
        dataCh.createWorker("_d_ch", // worker ID
        [42, "*", null, null, ns_id], // filter
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
            list.push([2, data.__id, "", null, data.__id]);

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
            list.push([1, data.__id, "", null, data.__id]);
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
              if (n == "__id") {
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
            if (n == "__oid") {
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
        console.error("** askChannelQuestion ** not implemented now ");
      };

      /**
       * @param float question
       * @param float data
       * @param float cb
       */
      _myTrait_.askChannelQuestion = function (question, data, cb) {

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
        this.set(n, defaultValue || "");
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

            if (typeof value == "undefined") {
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

        console.error("*** FIND IS NOT IMPLEMENTED *** ");

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
          var limit = arrayKeys.split(",");
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

        if (typeof this._docData.data[name] != "undefined" && this[name]) {
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

      if (_myTrait_.__traitInit && !_myTrait_.hasOwnProperty("__traitInit")) _myTrait_.__traitInit = _myTrait_.__traitInit.slice();
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

        if (typeof t == "undefined") {
          if (!this._docData) return false;
          if (!this._docData.data) return false;
          return this.isArray(this._docData.data);
        }
        return Object.prototype.toString.call(t) === "[object Array]";
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
        return Object.prototype.toString.call(fn) == "[object Function]";
      };

      /**
       * @param float t
       */
      _myTrait_.isObject = function (t) {

        if (typeof t == "undefined") {
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

        if (typeof p != "undefined") {
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
        if (typeof toIndex != "undefined") {
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

        console.error("RenderTemplate not implemented");

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
            if (typeof v == "undefined") continue;
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

      if (_myTrait_.__traitInit && !_myTrait_.hasOwnProperty("__traitInit")) _myTrait_.__traitInit = _myTrait_.__traitInit.slice();
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

      if (!_myTrait_.hasOwnProperty("__factoryClass")) _myTrait_.__factoryClass = [];
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
          if (typeof data == "string") {
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
        if (typeof Symbol != "undefined" && typeof Symbol.iterator != "undefined") {
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
            "_obs_4": function _obs_4(cmd, options) {
              if (_atObserve) return;
              // Object.observe - set value to object
              options.target[cmd[1]] = cmd[2];
            },
            "_obs_7": function _obs_7(cmd, options) {
              if (_atObserve) return;
              var toIndex = cmd[1];
              var dataObj = _data(cmd[2]);
              if (dataObj.isFulfilled()) {
                Array.unobserve(options.target, options.parentObserver);
                options.target[toIndex] = dataObj.toObservable(options.target, options.parentObserver);
                Array.observe(options.target, options.parentObserver);
              }
            },
            "_obs_8": function _obs_8(cmd, options) {
              if (_atObserve) {
                return;
              }
              var toIndex = cmd[1];
              Array.unobserve(options.target, options.parentObserver);
              options.target.splice(toIndex, 1); //  = dataObj.toObservable();
              Array.observe(options.target, options.parentObserver);
            },
            "_obs_12": function _obs_12(cmd, options) {
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
            "_d_set": function _d_set(cmd, options) {
              // for example, trigger .on("x", value);
              options.target.trigger(cmd[1], cmd[2]);
            },
            "_d_cf": function _d_cf(cmd, options) {
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
            "_d_rem": function _d_rem(cmd, options) {

              options.target.trigger("remove", cmd[1]);
              // delete _objectCache[cmd[1]];
              // remove the object from the object cache
            },
            "_to_ch": function _to_ch(cmd, options) {
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
            "_d_ins": function _d_ins(cmd, options) {
              options.target.trigger("insert", cmd[1]);
            },
            "_d_mv": function _d_mv(cmd, options) {
              options.target.trigger("move", {
                itemId: cmd[1],
                parentId: cmd[4],
                from: cmd[3],
                to: cmd[2]
              });
            },
            "_d_ch": function _d_ch(cmd, options) {
              // command which did change the child..
              options.target.trigger("childChanged", cmd);
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
            options.eventObj.trigger("remove", dataItem.__removedAt);
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
            options.eventObj.trigger("insert", index);
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
              options.eventObj.trigger("move", {
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
       * @param String cmdName  - Name of the action
       * @param Object params  - The argument object for the action
       */
      _myTrait_.action = function (cmdName, params) {

        var id = this.getID();

        var client = this._client;

        if (!client) return;

        var socket = client._socket;

        if (!socket) return;
        // send the command to server...
        socket.send("channelCommand", {
          channelId: client._channelId,
          cmd: "chCmd",
          data: {
            cmdList: [{
              cmd: cmdName,
              __id: client._idFromNs(id),
              params: params
            }]
          }
        });
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
       * @param float t
       */
      _myTrait_.closeChannel = function (t) {
        this._client.closeChannel();
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
            var myD = _data(req.protocol + "://" + req.ip + ":" + req.port + "/" + newChannelId, me._initOptions);
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
            console.log("is instance of...");
            console.log(this.__traitInit);
            var args = [a, b, c, d, e, f, g, h];
            if (this.__factoryClass) {
              var m = this;
              var res;
              this.__factoryClass.forEach(function (initF) {
                res = initF.apply(m, args);
              });
              if (Object.prototype.toString.call(res) == "[object Function]") {
                if (res._classInfo.name != myDataClass._classInfo.name) return new res(a, b, c, d, e, f, g, h);
              } else {
                if (res) return res;
              }
            }
            if (this.__traitInit) {
              console.log("Calling the subclass trait init...");
              var m = this;
              this.__traitInit.forEach(function (initF) {
                initF.apply(m, args);
              });
            } else {
              if (typeof this.init == "function") this.init.apply(this, args);
            }
          } else {
            console.log("NOT instance of...");
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
            var myD = _data(req.protocol + "://" + req.ip + ":" + req.port + "/" + newChannelId, me._initOptions);
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

      if (_myTrait_.__traitInit && !_myTrait_.hasOwnProperty("__traitInit")) _myTrait_.__traitInit = _myTrait_.__traitInit.slice();
      if (!_myTrait_.__traitInit) _myTrait_.__traitInit = [];
      _myTrait_.__traitInit.push(function (data, options, client) {

        options = options || {};
        var me = this;

        this._initOptions = options;

        if (typeof data == "string") {

          if (!data.match("://")) {
            return;
          }

          var req = this._parseURL(data);
          this._request = req;

          this._connectionOptions = options;
          this._socket = _clientSocket(req.protocol + "://" + req.ip, req.port, options.ioLib);
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
          if (options.protocolVersion) opts.protocolVersion = options.protocolVersion;
          if (options.connectFn) opts.connectFn = options.connectFn;

          this._client = channelClient(req.fullPath, this._socket, opts);
          this._client.then(function (resp) {

            if (resp.result === false) {
              me.trigger("login::failed");
              return;
            }
            var rawData = me._client.getData();

            me._initializeData(rawData);
            me.addToCache(rawData.__id, me);
            me._initWorkers();
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
        var parts = path.split("/"),
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
              if (val == "{path}") {
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

        if (!subPathName) subPathName = "items";
        if (!titleName) titleName = "title";
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
        if (typeof res == "function") {
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
        if (typeof m.init == "function") m.init.apply(m, args);
      }
    } else return new _data(a, b, c, d, e, f, g, h);
  };

  _data_prototype.prototype = _promise.prototype;

  _data._classInfo = {
    name: "_data"
  };
  _data.prototype = new _data_prototype();

  (function () {
    if (typeof define !== "undefined" && define !== null && define.amd != null) {
      __amdDefs__["_data"] = _data;
      this._data = _data;
    } else if (typeof module !== "undefined" && module !== null && module.exports != null) {
      module.exports["_data"] = _data;
    } else {
      this._data = _data;
    }
  }).call(new Function("return this")());

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
          if (Object.prototype.toString.call(args) === "[object Array]") {
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
          name = "aft_" + _localCnt++;
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
        var id_name = "e_" + _localCnt++;
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
          name = "t7491_" + _localCnt++;
        }

        _everies[name] = {
          step: Math.floor(seconds * 1000),
          fn: fn,
          nextTime: 0
        };
      };

      if (_myTrait_.__traitInit && !_myTrait_.hasOwnProperty("__traitInit")) _myTrait_.__traitInit = _myTrait_.__traitInit.slice();
      if (!_myTrait_.__traitInit) _myTrait_.__traitInit = [];
      _myTrait_.__traitInit.push(function (interval, fn) {
        if (!_initDone) {
          this._easeFns();
          _localCnt = 1;

          var frame, cancelFrame;
          if (typeof window != "undefined") {
            var frame = window["requestAnimationFrame"],
                cancelFrame = window["cancelRequestAnimationFrame"];
            ["", "ms", "moz", "webkit", "o"].forEach(function (x) {
              if (!frame) {
                frame = window[x + "RequestAnimationFrame"];
                cancelFrame = window[x + "CancelAnimationFrame"] || window[x + "CancelRequestAnimationFrame"];
              }
            });
          }

          var is_node_js = new Function("try { return this == global; } catch(e) { return false; }")();

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
              if (Object.prototype.toString.call(fn) === "[object Array]") {
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
        if (typeof res == "function") {
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
        if (typeof m.init == "function") m.init.apply(m, args);
      }
    } else return new later(a, b, c, d, e, f, g, h);
  };

  later._classInfo = {
    name: "later"
  };
  later.prototype = new later_prototype();

  (function () {
    if (typeof define !== "undefined" && define !== null && define.amd != null) {
      __amdDefs__["later"] = later;
      this.later = later;
    } else if (typeof module !== "undefined" && module !== null && module.exports != null) {
      module.exports["later"] = later;
    } else {
      this.later = later;
    }
  }).call(new Function("return this")());

  var _promise_prototype = function _promise_prototype() {

    (function (_myTrait_) {

      // Initialize static variables here...

      /**
       * @param float someVar
       */
      _myTrait_.isArray = function (someVar) {
        return Object.prototype.toString.call(someVar) === "[object Array]";
      };

      /**
       * @param Function fn
       */
      _myTrait_.isFunction = function (fn) {
        return Object.prototype.toString.call(fn) == "[object Function]";
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
                rCnt++;
                if (rCnt == targetLen) {

                  allPromise.resolve(myResults);
                }
              }, function (v) {
                allPromise.reject(v);
              });
            } else {
              allPromise.reject("Not list of promises");
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
              allPromise.reject("Not list of promises");
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
              if (typeof x != "undefined") {
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

      if (_myTrait_.__traitInit && !_myTrait_.hasOwnProperty("__traitInit")) _myTrait_.__traitInit = _myTrait_.__traitInit.slice();
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
              me.reject(v);
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
       * @param function fn
       */
      _myTrait_.onStateChange = function (fn) {

        if (!this._listeners) this._listeners = [];

        this._listeners.push(fn);
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
          this._rejectReason = "TypeError";
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
        if (typeof newState != "undefined") {
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
          later().asap(function () {
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
        if (typeof v != "undefined") {
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
        if (typeof res == "function") {
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
        if (typeof m.init == "function") m.init.apply(m, args);
      }
    } else return new _promise(a, b, c, d, e, f, g, h);
  };

  _promise._classInfo = {
    name: "_promise"
  };
  _promise.prototype = new _promise_prototype();

  var dbTable_prototype = function dbTable_prototype() {

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
        return Object.prototype.toString.call(t) === "[object Array]";
      };

      /**
       * @param float fn
       */
      _myTrait_.isFunction = function (fn) {
        return Object.prototype.toString.call(fn) == "[object Function]";
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
       * @param float mode
       * @param float usingIndex
       * @param float actionFn
       */
      _myTrait_._cursorAction = function (mode, usingIndex, actionFn) {

        var prom = _promise();

        var trans = this._db.transaction(this._table, mode);
        var store = trans.objectStore(this._table);
        var cursorRequest;

        if (usingIndex) {

          var singleKeyRange, indexName;

          // BUG or FEATURE: currently accepts only one key like
          // { folderName : "data" };
          for (var n in usingIndex) {
            if (usingIndex.hasOwnProperty(n)) {
              indexName = n;
              singleKeyRange = IDBKeyRange.only(usingIndex[n]);
            }
          }

          if (indexName) {
            var index = store.index(indexName); // open using the index only
            cursorRequest = index.openCursor(singleKeyRange);
          } else {
            prom.reject("invalid index key");
            return;
          }
        } else {
          cursorRequest = store.openCursor();
        }

        trans.oncomplete = function (evt) {
          prom.resolve(true);
        };

        cursorRequest.onerror = function (error) {
          console.log(error);
        };

        cursorRequest.onsuccess = function (evt) {
          var cursor = evt.target.result;
          if (cursor) {
            actionFn(cursor);
            cursor["continue"]();
          }
        };

        return prom;
      };

      /**
       * @param float rows
       */
      _myTrait_.addRows = function (rows) {

        var prom = _promise();

        var transaction = this._db.transaction([this._table], "readwrite");

        var me = this;
        // Do something when all the data is added to the database.
        transaction.oncomplete = function (event) {
          // console.log("Writing into "+me._table+" was successfull");
          prom.resolve(true);
        };

        transaction.onerror = function (event) {
          prom.reject(event);
        };

        var objectStore = transaction.objectStore(this._table);
        for (var i in rows) {
          var request = objectStore.add(rows[i]);
          request.onsuccess = function (event) {};
        }

        return prom;
      };

      /**
       * @param float t
       */
      _myTrait_.clear = function (t) {

        var prom = _promise();
        var transaction = this._db.transaction(this._table, "readwrite");
        var objectStore = transaction.objectStore(this._table);
        var request = objectStore.clear();
        request.onerror = function (event) {
          prom.fail(event.target.errorCode);
        };
        request.onsuccess = function (event) {
          prom.resolve(true);
        };

        return prom;
      };

      /**
       * @param float t
       */
      _myTrait_.count = function (t) {
        var prom = _promise();
        var transaction = this._db.transaction([this._table], "readonly");

        transaction.objectStore(this._table).count().onsuccess = function (e) {
          prom.resolve(e.target.result);
        };

        return prom;
      };

      /**
       * @param function fn
       * @param float usingIndex
       */
      _myTrait_.forEach = function (fn, usingIndex) {

        return this._cursorAction("readonly", usingIndex, function (cursor) {
          fn(cursor.value, cursor);
        });
      };

      /**
       * @param float key
       */
      _myTrait_.get = function (key) {

        var prom = _promise();
        var transaction = this._db.transaction(this._table, "readonly");
        var objectStore = transaction.objectStore(this._table);
        var request = objectStore.get(key);

        request.onerror = function (event) {
          // Handle errors!
          console.log("Could not get ", key);
          prom.fail(event.target.errorCode);
        };
        request.onsuccess = function (event) {
          prom.resolve(request.result);
        };

        return prom;
      };

      /**
       * @param float usingIndex
       */
      _myTrait_.getAll = function (usingIndex) {

        var items = [],
            me = this;

        return _promise(function (result, fail) {
          me._cursorAction("readonly", usingIndex, function (cursor) {
            items.push(cursor.value);
          }).then(function () {
            result(items);
          }).fail(fail);
        });
      };

      if (_myTrait_.__traitInit && !_myTrait_.hasOwnProperty("__traitInit")) _myTrait_.__traitInit = _myTrait_.__traitInit.slice();
      if (!_myTrait_.__traitInit) _myTrait_.__traitInit = [];
      _myTrait_.__traitInit.push(function (db, tableName) {

        this._db = db;
        this._table = tableName;
      });

      /**
       * @param float usingIndex
       */
      _myTrait_.readAndDelete = function (usingIndex) {
        var items = [],
            me = this;

        return _promise(function (result, fail) {
          me._cursorAction("readwrite", usingIndex, function (cursor) {
            items.push(cursor.value);
            cursor["delete"](); // remove the key and continue...
          }).then(function () {
            result(items);
          }).fail(fail);
        });
      };

      /**
       * @param Object usingIndex  - optional : { keyName : valueString}
       */
      _myTrait_.remove = function (usingIndex) {
        var me = this;

        return _promise(function (result, fail) {
          me._cursorAction("readwrite", usingIndex, function (cursor) {
            cursor["delete"](); // remove the key and continue...
          }).then(function () {
            result(true);
          }).fail(fail);
        });
      };

      /**
       * @param float key
       * @param float data
       */
      _myTrait_.update = function (key, data) {
        var prom = _promise();
        var me = this;
        var transaction = this._db.transaction([this._table], "readwrite");
        var objectStore = transaction.objectStore(this._table);
        try {
          var request = objectStore.get(key);
          request.onerror = function (event) {
            if (!request.result) {
              me.addRows([data]).then(function () {
                prom.resolve(data);
              });
              return;
            }
            prom.fail(event.target.errorCode);
          };
          request.onsuccess = function (event) {
            if (!request.result) {
              me.addRows([data]).then(function () {
                prom.resolve(data);
              });
              return;
            }
            var requestUpdate = objectStore.put(data);
            requestUpdate.onerror = function (event) {
              // Do something with the error
              prom.fail("update failed ");
            };
            requestUpdate.onsuccess = function (event) {
              // Success - the data is updated!
              prom.resolve(data);
            };
          };
        } catch (e) {
          return this.addRows([data]);
        }

        return prom;
      };
    })(this);
  };

  var dbTable = function dbTable(a, b, c, d, e, f, g, h) {
    var m = this,
        res;
    if (m instanceof dbTable) {
      var args = [a, b, c, d, e, f, g, h];
      if (m.__factoryClass) {
        m.__factoryClass.forEach(function (initF) {
          res = initF.apply(m, args);
        });
        if (typeof res == "function") {
          if (res._classInfo.name != dbTable._classInfo.name) return new res(a, b, c, d, e, f, g, h);
        } else {
          if (res) return res;
        }
      }
      if (m.__traitInit) {
        m.__traitInit.forEach(function (initF) {
          initF.apply(m, args);
        });
      } else {
        if (typeof m.init == "function") m.init.apply(m, args);
      }
    } else return new dbTable(a, b, c, d, e, f, g, h);
  };

  dbTable._classInfo = {
    name: "dbTable"
  };
  dbTable.prototype = new dbTable_prototype();

  var _localDB_prototype = function _localDB_prototype() {

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
        return Object.prototype.toString.call(t) === "[object Array]";
      };

      /**
       * @param float fn
       */
      _myTrait_.isFunction = function (fn) {
        return Object.prototype.toString.call(fn) == "[object Function]";
      };

      /**
       * @param float t
       */
      _myTrait_.isObject = function (t) {
        return t === Object(t);
      };
    })(this);

    (function (_myTrait_) {
      var _initDone;
      var _dbList;
      var _db;

      // Initialize static variables here...

      /**
       * @param float t
       */
      _myTrait_._initDB = function (t) {

        if (_db) return;
        // if you want experimental support, enable browser based prefixes
        _db = window.indexedDB; //  || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;

        _initDone = true;

        _dbList = _localDB("sys.db", {
          tables: {
            databases: {
              createOptions: {
                keyPath: "name"
              } }
          }
        });
      };

      /**
       * @param float fn
       */
      _myTrait_.clearDatabases = function (fn) {

        _dbList.then(function () {
          var dbs = _dbList.table("databases");
          dbs.forEach(function (data, cursor) {
            if (fn(data)) {
              _db.deleteDatabase(data.name);
              cursor["delete"]();
            }
          });
        });
      };

      /**
       * @param float t
       */
      _myTrait_.getDB = function (t) {
        return this._db;
      };

      if (_myTrait_.__traitInit && !_myTrait_.hasOwnProperty("__traitInit")) _myTrait_.__traitInit = _myTrait_.__traitInit.slice();
      if (!_myTrait_.__traitInit) _myTrait_.__traitInit = [];
      _myTrait_.__traitInit.push(function (dbName, options) {

        if (this._db) return;
        this._initDB();

        if (!dbName) {
          return;
        }

        var me = this;

        var request = _db.open(dbName, 4);

        request.onerror = function (event) {
          // Do something with request.errorCode!
          console.error(event.target.errorCode);
        };
        request.onsuccess = function (event) {
          // Do something with request.result!
          _dbList.then(function () {
            var dbs = _dbList.table("databases");
            dbs.addRows([{
              name: dbName
            }]);
          });
          me._db = event.target.result;
          me.resolve(true);
        };
        request.onupgradeneeded = function (event) {

          var db = event.target.result;
          me._db = db;

          if (options && options.tables) {
            for (var n in options.tables) {
              if (options.tables.hasOwnProperty(n)) {
                var opts = options.tables[n];
                // Create another object store called "names" with the autoIncrement flag set as true.   
                var objStore = db.createObjectStore(n, opts.createOptions);

                if (opts.indexes) {
                  for (var iName in opts.indexes) {
                    if (opts.indexes.hasOwnProperty(iName)) {
                      var iData = opts.indexes[iName];
                      objStore.createIndex(iName, iName, iData);
                    }
                  }
                }
              }
            }
          }
        };
      });

      /**
       * @param float name
       */
      _myTrait_.table = function (name) {
        return dbTable(this._db, name);
      };
    })(this);
  };

  var _localDB = function _localDB(a, b, c, d, e, f, g, h) {
    var m = this,
        res;
    if (m instanceof _localDB) {
      var args = [a, b, c, d, e, f, g, h];
      if (m.__factoryClass) {
        m.__factoryClass.forEach(function (initF) {
          res = initF.apply(m, args);
        });
        if (typeof res == "function") {
          if (res._classInfo.name != _localDB._classInfo.name) return new res(a, b, c, d, e, f, g, h);
        } else {
          if (res) return res;
        }
      }
      if (m.__traitInit) {
        m.__traitInit.forEach(function (initF) {
          initF.apply(m, args);
        });
      } else {
        if (typeof m.init == "function") m.init.apply(m, args);
      }
    } else return new _localDB(a, b, c, d, e, f, g, h);
  };

  _localDB_prototype.prototype = _promise.prototype;

  _localDB._classInfo = {
    name: "_localDB"
  };
  _localDB.prototype = new _localDB_prototype();

  var memoryFsFolder_prototype = function memoryFsFolder_prototype() {

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
        return Object.prototype.toString.call(t) === "[object Array]";
      };

      /**
       * @param float fn
       */
      _myTrait_.isFunction = function (fn) {
        return Object.prototype.toString.call(fn) == "[object Function]";
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
       * @param float fileName
       */
      _myTrait_._isFile = function (fileName) {
        var fold = this._pathObj;
        if (typeof fold[fileName] != "undefined" && !this.isObject(fold[fileName])) return true;
        return false;
      };

      /**
       * @param float name
       */
      _myTrait_._isFolder = function (name) {
        var fold = this._pathObj;
        if (typeof fold[name] != "undefined" && this.isObject(fold[name])) return true;
        return false;
      };

      /**
       * @param float fileName
       * @param float data
       */
      _myTrait_.appendFile = function (fileName, data) {
        var p,
            me = this;
        return _promise(function (result, fail) {
          var fold = me._pathObj;

          if (typeof data != "string") {
            // can not write anything else than strings
            fail({
              result: false,
              text: "Only string writes are accepted"
            });
            return;
          }

          if (me._isFile(fileName)) {
            fold[fileName] += data;
            result({
              result: true
            });
          } else {
            fold[fileName] = data;
            result({
              result: true,
              text: "Created the file"
            });
          }
        });
      };

      /**
       * @param float dirName
       */
      _myTrait_.createDir = function (dirName) {
        var p,
            me = this;
        return _promise(function (result, fail) {
          var fold = me._pathObj;
          if (!me._isFile(dirName) && !me._isFolder(dirName)) {
            fold[dirName] = {};
          }
          result({
            result: true
          });
        });
      };

      /**
       * @param float name
       */
      _myTrait_.findPath = function (name) {

        if (name.charAt(0) == "/") name = name.substring(0);
        var parts = name.trim().split("/");
        var fold = this;

        return _promise(function (response) {

          if (!parts[0]) {
            response(fold);
            return;
          }

          var sub, rootProm, currFolder;
          parts.forEach(function (sub) {

            if (!sub || sub.trim().length == 0) return;

            if (!fold) {
              response(false);
              return;
            }
            if (!rootProm) {
              currFolder = fold;
              rootProm = fold.isFolder(sub);
            } else {
              rootProm = rootProm.then(function (f) {
                currFolder = f;
                if (f) return f.isFolder(sub);
                return false;
              });
            }

            rootProm = rootProm.then(function (is_fold) {
              if (is_fold) {
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
      };

      /**
       * @param float obj
       */
      _myTrait_.fromData = function (obj) {
        var me = this;
        //this._server = server;
        //this._pathObj = pathObj;
        return _promise(function (result, fail) {
          if (!me._pathObj) {
            me._pathObj = {};
          }
          var all = [];
          var myProm = _promise();

          for (var n in obj) {
            if (me.isObject(obj[n])) {
              if (!me._pathObj[n] || !me._isFolder(n)) {
                me._pathObj[n] = {};
              }
              var po = memoryFsFolder(me._server, me._pathObj[n]);
              all.push(po.fromData(obj[n]));
            } else {
              if (obj[n] === true) {} else {
                me._pathObj[n] = obj[n];
              }
            }
          }

          myProm.all(all).then(function () {
            result(true);
          }).fail(fail);
          myProm.resolve(true);
        });
      };

      /**
       * @param string name
       */
      _myTrait_.getFolder = function (name) {
        return this.getSubFolderObj(name);
      };

      /**
       * @param Object dirName
       */
      _myTrait_.getSubFolderObj = function (dirName) {

        if (this.isObject(this._pathObj[dirName])) {
          return memoryFsFolder(this._server, this._pathObj[dirName]);
        }
      };

      /**
       * @param float t
       */
      _myTrait_.getTree = function (t) {
        var treePromise = this.toData({
          getData: false
        });
        return treePromise;
      };

      /**
       * @param float t
       */
      _myTrait_.id = function (t) {
        return this._id;
      };

      if (_myTrait_.__traitInit && !_myTrait_.hasOwnProperty("__traitInit")) _myTrait_.__traitInit = _myTrait_.__traitInit.slice();
      if (!_myTrait_.__traitInit) _myTrait_.__traitInit = [];
      _myTrait_.__traitInit.push(function (server, pathObj) {

        this._server = server;
        this._pathObj = pathObj;
        this._id = this.guid();
      });

      /**
       * @param float fileName
       */
      _myTrait_.isFile = function (fileName) {
        var p,
            me = this;
        return _promise(function (result, fail) {
          result(me._isFile(fileName));
        });
      };

      /**
       * @param float dirName
       */
      _myTrait_.isFolder = function (dirName) {
        var p,
            me = this;
        return _promise(function (result, fail) {
          result(me._isFolder(dirName));
        });
      };

      /**
       * @param string str
       */
      _myTrait_.linesToJsonArray = function (str) {
        if (!str || typeof str != "string") return [];
        var a = str.split("\n");
        var res = [];
        a.forEach(function (line) {
          if (line.trim().length == 0) return;
          res.push(JSON.parse(line));
        });
        return res;
      };

      /**
       * @param function filter
       */
      _myTrait_.listFiles = function (filter) {

        var p,
            me = this;
        return _promise(function (result, fail) {
          var fold = me._pathObj;
          var list = [];
          for (var n in fold) {
            if (me._isFile(n)) list.push(n);
          }
          result(list);
        });
      };

      /**
       * @param float filter
       */
      _myTrait_.listFolders = function (filter) {

        var p,
            me = this;
        return _promise(function (result, fail) {
          var fold = me._pathObj;
          var list = [];
          for (var n in fold) {
            if (me._isFolder(n)) list.push(n);
          }
          result(list);
        });
      };

      /**
       * @param string fileName
       * @param float fn
       */
      _myTrait_.readFile = function (fileName, fn) {
        var p,
            me = this;
        return _promise(function (result, fail) {
          var fold = me._pathObj;
          if (me._isFile(fileName)) {
            result(fold[fileName]);
            return;
          }
          fail("File does not exist");
        });
      };

      /**
       * @param float fileName
       */
      _myTrait_.removeFile = function (fileName) {
        var p,
            me = this;
        return _promise(function (result, fail) {
          var fold = me._pathObj;
          if (me._isFile(fileName)) {
            delete fold[fileName];
          }
          result({
            result: true,
            text: "file " + fileName + " removed"
          });
        });
      };

      /**
       * @param Object options
       * @param String notUsed
       */
      _myTrait_.toData = function (options, notUsed) {
        var _rootDir = this._rootDir;
        var me = this;

        var options = options || {};

        var fileFilter = options.fileFilter,
            dirFilter = options.dirFilter;

        if (typeof options.getData == "undefined") options.getData = true;

        return _promise(function (result, fail) {

          var o = {};
          me.listFiles().then(function (list) {
            var cnt = list.length,
                done = 0,
                waiting = _promise();
            list.forEach(function (n) {
              if (fileFilter) {
                if (!fileFilter(n)) {
                  done++;
                  if (done == cnt) waiting.resolve(true);
                  return;
                }
              }
              if (options.getData) {
                me.readFile(n).then(function (data) {
                  o[n] = data;
                  done++;
                  if (done == cnt) waiting.resolve(true);
                });
              } else {
                o[n] = true;
                done++;
                if (done == cnt) waiting.resolve(true);
              }
            });
            if (cnt == 0) waiting.resolve(true);
            return waiting;
          }).then(function () {
            return me.listFolders();
          }).then(function (list) {
            var cnt = list.length,
                done = 0,
                waiting = _promise();
            list.forEach(function (dirName) {
              if (dirFilter) {
                if (!dirFilter(dirName)) {
                  done++;
                  if (done == cnt) waiting.resolve(true);
                  return;
                }
              }
              var newF = me.getSubFolderObj(dirName);
              newF.toData(fileFilter, dirFilter).then(function (data) {
                o[dirName] = data;
                done++;
                if (done == cnt) waiting.resolve(true);
              });
            });
            if (cnt == 0) waiting.resolve(true);
            return waiting;
          }).then(function () {
            result(o);
          }).fail(function () {
            result({});
          });
        });
      };

      /**
       * @param string fileName
       * @param float newSize
       */
      _myTrait_.truncateFile = function (fileName, newSize) {
        var p,
            me = this;
        return _promise(function (result, fail) {
          var fold = me._pathObj;
          if (fold[fileName]) {
            fold[fileName] = fold[fileName].substring(0, newSize);;
          }
          result({
            result: true
          });
        });
      };

      /**
       * @param float fileName
       * @param float fileData
       */
      _myTrait_.writeFile = function (fileName, fileData) {
        var p,
            me = this;
        return _promise(function (result, fail) {
          var fold = me._pathObj;
          if (typeof fileData != "string") {
            // can not write anything else than strings
            fail({
              result: false,
              text: "Only string writes are accepted"
            });
            return;
          }
          if (!me._isFolder(fileName)) {
            fold[fileName] = fileData;
          } else {
            fail({
              result: false,
              text: "Modifying the file failed"
            });
            return;
          }
          result({
            result: true
          });
        });
      };
    })(this);
  };

  var memoryFsFolder = function memoryFsFolder(a, b, c, d, e, f, g, h) {
    var m = this,
        res;
    if (m instanceof memoryFsFolder) {
      var args = [a, b, c, d, e, f, g, h];
      if (m.__factoryClass) {
        m.__factoryClass.forEach(function (initF) {
          res = initF.apply(m, args);
        });
        if (typeof res == "function") {
          if (res._classInfo.name != memoryFsFolder._classInfo.name) return new res(a, b, c, d, e, f, g, h);
        } else {
          if (res) return res;
        }
      }
      if (m.__traitInit) {
        m.__traitInit.forEach(function (initF) {
          initF.apply(m, args);
        });
      } else {
        if (typeof m.init == "function") m.init.apply(m, args);
      }
    } else return new memoryFsFolder(a, b, c, d, e, f, g, h);
  };

  memoryFsFolder._classInfo = {
    name: "memoryFsFolder"
  };
  memoryFsFolder.prototype = new memoryFsFolder_prototype();

  (function () {
    if (typeof define !== "undefined" && define !== null && define.amd != null) {
      __amdDefs__["memoryFsFolder"] = memoryFsFolder;
      this.memoryFsFolder = memoryFsFolder;
    } else if (typeof module !== "undefined" && module !== null && module.exports != null) {
      module.exports["memoryFsFolder"] = memoryFsFolder;
    } else {
      this.memoryFsFolder = memoryFsFolder;
    }
  }).call(new Function("return this")());

  var fsServerMemory_prototype = function fsServerMemory_prototype() {

    (function (_myTrait_) {
      var _servers;

      // Initialize static variables here...

      /**
       * @param float t
       */
      _myTrait_._initServers = function (t) {
        if (!_servers) {
          _servers = {};
        }
      };

      /**
       * @param float t
       */
      _myTrait_.getRootFolder = function (t) {
        var me = this;
        return memoryFsFolder(me, me._fsData);
      };

      if (_myTrait_.__traitInit && !_myTrait_.hasOwnProperty("__traitInit")) _myTrait_.__traitInit = _myTrait_.__traitInit.slice();
      if (!_myTrait_.__traitInit) _myTrait_.__traitInit = [];
      _myTrait_.__traitInit.push(function (serverName, createFrom) {
        this._serverName = serverName;
        this._initServers();
        this._fsData = createFrom || {};

        this.resolve(true);
      });
    })(this);
  };

  var fsServerMemory = function fsServerMemory(a, b, c, d, e, f, g, h) {
    var m = this,
        res;
    if (m instanceof fsServerMemory) {
      var args = [a, b, c, d, e, f, g, h];
      if (m.__factoryClass) {
        m.__factoryClass.forEach(function (initF) {
          res = initF.apply(m, args);
        });
        if (typeof res == "function") {
          if (res._classInfo.name != fsServerMemory._classInfo.name) return new res(a, b, c, d, e, f, g, h);
        } else {
          if (res) return res;
        }
      }
      if (m.__traitInit) {
        m.__traitInit.forEach(function (initF) {
          initF.apply(m, args);
        });
      } else {
        if (typeof m.init == "function") m.init.apply(m, args);
      }
    } else return new fsServerMemory(a, b, c, d, e, f, g, h);
  };

  fsServerMemory_prototype.prototype = _promise.prototype;

  fsServerMemory._classInfo = {
    name: "fsServerMemory"
  };
  fsServerMemory.prototype = new fsServerMemory_prototype();

  (function () {
    if (typeof define !== "undefined" && define !== null && define.amd != null) {
      __amdDefs__["fsServerMemory"] = fsServerMemory;
      this.fsServerMemory = fsServerMemory;
    } else if (typeof module !== "undefined" && module !== null && module.exports != null) {
      module.exports["fsServerMemory"] = fsServerMemory;
    } else {
      this.fsServerMemory = fsServerMemory;
    }
  }).call(new Function("return this")());

  var nodeFsFolder_prototype = function nodeFsFolder_prototype() {

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
        return Object.prototype.toString.call(t) === "[object Array]";
      };

      /**
       * @param float fn
       */
      _myTrait_.isFunction = function (fn) {
        return Object.prototype.toString.call(fn) == "[object Function]";
      };

      /**
       * @param float t
       */
      _myTrait_.isObject = function (t) {
        return t === Object(t);
      };
    })(this);

    (function (_myTrait_) {
      var fs;
      var path;

      // Initialize static variables here...

      /**
       * @param float dirName
       */
      _myTrait_._mkDir = function (dirName) {

        if (typeof dirName != "string") {
          console.log(JSON.stringiry(dirName));
          console.log("--- is not object");
          throw "WRROR";
          return;
        }
        if (!fs.existsSync(dirName)) {
          fs.mkdirSync(dirName, 502, function (err) {});
        }
      };

      /**
       * @param float fileName
       * @param float data
       * @param float fn
       */
      _myTrait_.appendFile = function (fileName, data, fn) {
        var _rootDir = this._rootDir;
        var me = this;

        return _promise(function (result, fail) {

          if (typeof data != "string") {
            // can not write anything else than strings
            fail({
              result: false,
              text: "Only string writes are accepted"
            });
            return;
          }
          fileName = path.basename(fileName);
          var filePath = _rootDir + "/" + fileName;

          fs.appendFile(filePath, data, function (err) {
            if (err) {
              fail(err);
              return;
            }
            result({
              result: true,
              text: "File written"
            });
          });
        });
      };

      /**
       * @param float dirName
       */
      _myTrait_.createDir = function (dirName) {

        var _rootDir = this._rootDir;
        var me = this;

        return _promise(function (result, fail) {
          // TODO: Should check if the directory is really under this diretory
          // basname is trying to normalize, but should be tested.
          var dirN = path.basename(dirName);
          me._mkDir(_rootDir + "/" + dirN);
          result({
            result: true,
            text: "Directory created"
          });
        });
      };

      /**
       * @param string name
       */
      _myTrait_.findPath = function (name) {

        if (name.charAt(0) == "/") name = name.substring(0);
        var parts = name.trim().split("/");
        var fold = this;

        return _promise(function (response) {

          if (!parts[0]) {
            response(fold);
            return;
          }

          var sub, rootProm, currFolder;
          parts.forEach(function (sub) {

            if (!sub || sub.trim().length == 0) return;

            if (!fold) {
              response(false);
              return;
            }
            if (!rootProm) {
              currFolder = fold;
              rootProm = fold.isFolder(sub);
            } else {
              rootProm = rootProm.then(function (f) {
                currFolder = f;
                if (f) return f.isFolder(sub);
                return false;
              });
            }

            rootProm = rootProm.then(function (is_fold) {
              if (is_fold) {
                return currFolder.getFolder(sub);
              }
              return false;
            });
          });

          rootProm.then(response);
        });
      };

      /**
       * @param float obj
       */
      _myTrait_.fromData = function (obj) {

        // Create new directories...
        var me = this;
        var _rootDir = this._rootDir;

        return _promise(function (result, fail) {
          var all = [];
          var myProm = _promise();

          for (var n in obj) {

            if (n.indexOf("..") >= 0) {
              fail(".. symbol is not allowed in the file or path names");
              return;
            }

            var name = path.basename(n);
            if (me.isObject(obj[name])) {
              (function (obj, name) {
                var dirDone = _promise();
                all.push(dirDone);
                me.createDir(name).then(function () {
                  var newF = me.getSubFolderObj(name);
                  return newF.fromData(obj[name]);
                }).then(function () {
                  dirDone.resolve();
                }).fail(function () {
                  dirDone.resolve();
                });
              })(obj, name);
            } else {
              if (typeof obj[name] == "string") {
                all.push(me.writeFile(name, obj[name]));
              }
            }
          }
          myProm.all(all).then(function () {
            result(true);
          }).fail(fail);
          myProm.resolve(true);
        });
      };

      /**
       * @param string name
       */
      _myTrait_.getFolder = function (name) {
        return this.getSubFolderObj(name);
      };

      /**
       * @param float dirName
       */
      _myTrait_.getSubFolderObj = function (dirName) {
        return nodeFsFolder(this._rootDir + "/" + dirName);
      };

      /**
       * @param float t
       */
      _myTrait_.getTree = function (t) {
        return this.toData({
          getData: false
        });
      };

      /**
       * @param float t
       */
      _myTrait_.id = function (t) {
        return this._id;
      };

      if (_myTrait_.__traitInit && !_myTrait_.hasOwnProperty("__traitInit")) _myTrait_.__traitInit = _myTrait_.__traitInit.slice();
      if (!_myTrait_.__traitInit) _myTrait_.__traitInit = [];
      _myTrait_.__traitInit.push(function (dirName) {
        this._rootDir = dirName;
        this._id = this.guid();

        if (!dirName) {
          throw " The directory must be specified ";
          return;
        }
        if (!(typeof dirName == "string")) {
          throw " The directory must be string ";
          return;
        }
        if (dirName.indexOf("..") >= 0 || dirName.indexOf("~") >= 0) {
          throw "The directory must not contain relative path parts";
          return;
        }

        if (!fs) {
          fs = require("fs");
          path = require("path");
        }
      });

      /**
       * @param string fileName
       */
      _myTrait_.isFile = function (fileName) {

        var _rootDir = this._rootDir;
        var me = this;

        return _promise(function (result, fail) {
          fileName = path.basename(fileName);

          fs.stat(_rootDir + "/" + fileName, function (err, stats) {
            if (err || !stats.isFile()) {
              result(false);
              return;
            }
            result(true);
          });
        });
      };

      /**
       * @param float fileName
       */
      _myTrait_.isFolder = function (fileName) {
        var _rootDir = this._rootDir;
        var me = this;

        return _promise(function (result, fail) {
          fileName = path.basename(fileName);

          fs.stat(_rootDir + "/" + fileName, function (err, stats) {
            if (err || !stats.isDirectory()) {
              result(false);
              return;
            }
            result(true);
          });
        });
      };

      /**
       * @param string str
       */
      _myTrait_.linesToJsonArray = function (str) {
        if (!str || typeof str != "string") return [];
        var a = str.split("\n");
        var res = [];
        a.forEach(function (line) {
          if (line.trim().length == 0) return;
          res.push(JSON.parse(line));
        });
        return res;
      };

      /**
       * @param function filter
       */
      _myTrait_.listFiles = function (filter) {
        var _rootDir = this._rootDir;
        var me = this;

        return _promise(function (result, fail) {
          // Then we list the directory's file here...
          fs.readdir(_rootDir, function (err, files) {
            if (err) {
              fail(err);
              return;
            }

            var cnt = files.length,
                list = [];
            if (cnt == 0) result(list);

            files.forEach(function (file) {
              fs.stat(_rootDir + "/" + file, function (err, stats) {
                // stats.isDirectory() would be alternative
                if (!err && stats.isFile()) list.push(file);
                cnt--;
                if (cnt == 0) result(list);
              });
            });
          });
        });
      };

      /**
       * @param float filter
       */
      _myTrait_.listFolders = function (filter) {
        var _rootDir = this._rootDir;
        var me = this;

        return _promise(function (result, fail) {
          // Then we list the directory's file here...
          fs.readdir(_rootDir, function (err, files) {

            console.log(files);
            if (err) {
              fail(err);
              return;
            }

            var cnt = files.length,
                list = [];
            if (cnt == 0) result(list);

            files.forEach(function (file) {
              fs.stat(_rootDir + "/" + file, function (err, stats) {
                // stats.isFiles() would be alternative
                if (!err && stats.isDirectory()) {
                  console.log("Dir " + file);
                  list.push(file);
                }
                cnt--;
                if (cnt == 0) {
                  console.log("Cnt == 0");
                  result(list);
                }
              });
            });
          });
        });
      };

      /**
       * @param string fileName
       * @param float fn
       */
      _myTrait_.readFile = function (fileName, fn) {
        var _rootDir = this._rootDir;
        var me = this;

        return _promise(function (result, fail) {
          fileName = path.basename(fileName);
          fs.readFile(_rootDir + "/" + fileName, "utf8", function (err, data) {
            if (err) {
              result(null);
              return;
            }
            result(data);
          });
        });
      };

      /**
       * @param string fileName
       */
      _myTrait_.removeFile = function (fileName) {
        var _rootDir = this._rootDir;
        var me = this;

        return _promise(function (result, fail) {
          fileName = path.basename(fileName);
          fs.unlink(_rootDir + "/" + fileName, function (err, data) {
            if (err) {
              fail(err);
              return;
            }
            result({
              result: true,
              text: "file " + fileName + " removed"
            });
          });
        });
      };

      /**
       * @param function options
       * @param function notUsed
       */
      _myTrait_.toData = function (options, notUsed) {
        var _rootDir = this._rootDir;
        var me = this;

        var options = options || {};

        var fileFilter = options.fileFilter,
            dirFilter = options.dirFilter;

        if (typeof options.getData == "undefined") options.getData = true;

        return _promise(function (result, fail) {

          var o = {};
          me.listFiles().then(function (list) {
            var cnt = list.length,
                done = 0,
                waiting = _promise();
            list.forEach(function (n) {
              if (fileFilter) {
                if (!fileFilter(n)) {
                  done++;
                  if (done == cnt) waiting.resolve(true);
                  return;
                }
              }
              if (options.getData) {
                me.readFile(n).then(function (data) {
                  o[n] = data;
                  done++;
                  if (done == cnt) waiting.resolve(true);
                });
              } else {
                o[n] = true;
                done++;
                if (done == cnt) waiting.resolve(true);
              }
            });
            if (cnt == 0) waiting.resolve(true);
            return waiting;
          }).then(function () {
            return me.listFolders();
          }).then(function (list) {
            var cnt = list.length,
                done = 0,
                waiting = _promise();
            list.forEach(function (dirName) {
              if (dirFilter) {
                if (!dirFilter(dirName)) {
                  done++;
                  if (done == cnt) waiting.resolve(true);
                  return;
                }
              }
              var newF = me.getSubFolderObj(dirName);
              newF.toData(fileFilter, dirFilter).then(function (data) {
                o[dirName] = data;
                done++;
                if (done == cnt) waiting.resolve(true);
              });
            });
            if (cnt == 0) waiting.resolve(true);
            return waiting;
          }).then(function () {
            result(o);
          }).fail(function () {
            result({});
          });
        });
      };

      /**
       * @param float fileName
       * @param float newSize
       */
      _myTrait_.truncateFile = function (fileName, newSize) {

        var _rootDir = this._rootDir;
        var me = this;

        return _promise(function (result, fail) {

          if (typeof fileFilename != "string") {
            // can not write anything else than strings
            fail({
              result: false,
              text: "Only string filenames are accepted"
            });
            return;
          }

          fileName = path.basename(fileName);
          fs.truncate(_rootDir + "/" + fileName, newSize, function (err, data) {
            if (err) {
              fail(err);
              return;
            }
            result({
              result: true,
              text: "File truncated"
            });
          });
        });
      };

      /**
       * @param string fileName
       * @param float fileData
       * @param float fn
       */
      _myTrait_.writeFile = function (fileName, fileData, fn) {
        var _rootDir = this._rootDir;
        var me = this;

        return _promise(function (result, fail) {

          if (typeof fileData != "string") {
            // can not write anything else than strings
            fail({
              result: false,
              text: "Only string writes are accepted"
            });
            return;
          }

          fileName = path.basename(fileName);
          fs.writeFile(_rootDir + "/" + fileName, fileData, function (err, data) {
            if (err) {
              fail(err);
              return;
            }
            result({
              result: true,
              text: "File written"
            });
          });
        });
      };
    })(this);
  };

  var nodeFsFolder = function nodeFsFolder(a, b, c, d, e, f, g, h) {
    var m = this,
        res;
    if (m instanceof nodeFsFolder) {
      var args = [a, b, c, d, e, f, g, h];
      if (m.__factoryClass) {
        m.__factoryClass.forEach(function (initF) {
          res = initF.apply(m, args);
        });
        if (typeof res == "function") {
          if (res._classInfo.name != nodeFsFolder._classInfo.name) return new res(a, b, c, d, e, f, g, h);
        } else {
          if (res) return res;
        }
      }
      if (m.__traitInit) {
        m.__traitInit.forEach(function (initF) {
          initF.apply(m, args);
        });
      } else {
        if (typeof m.init == "function") m.init.apply(m, args);
      }
    } else return new nodeFsFolder(a, b, c, d, e, f, g, h);
  };

  nodeFsFolder._classInfo = {
    name: "nodeFsFolder"
  };
  nodeFsFolder.prototype = new nodeFsFolder_prototype();

  (function () {
    if (typeof define !== "undefined" && define !== null && define.amd != null) {
      __amdDefs__["nodeFsFolder"] = nodeFsFolder;
      this.nodeFsFolder = nodeFsFolder;
    } else if (typeof module !== "undefined" && module !== null && module.exports != null) {
      module.exports["nodeFsFolder"] = nodeFsFolder;
    } else {
      this.nodeFsFolder = nodeFsFolder;
    }
  }).call(new Function("return this")());

  var indexedDBFsFolder_prototype = function indexedDBFsFolder_prototype() {

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
        return Object.prototype.toString.call(t) === "[object Array]";
      };

      /**
       * @param float fn
       */
      _myTrait_.isFunction = function (fn) {
        return Object.prototype.toString.call(fn) == "[object Function]";
      };

      /**
       * @param float t
       */
      _myTrait_.isObject = function (t) {
        return t === Object(t);
      };
    })(this);

    (function (_myTrait_) {
      var _instances;

      // Initialize static variables here...

      if (!_myTrait_.hasOwnProperty("__factoryClass")) _myTrait_.__factoryClass = [];
      _myTrait_.__factoryClass.push(function (server, pathString) {

        var id = server.getID() + pathString;

        if (!_instances) {
          _instances = {};
        }

        if (_instances[id]) {
          return _instances[id];
        } else {
          _instances[id] = this;
        }
      });

      /**
       * Simple helper, Later this function might be doing checking for duplicate // or similar mistakes in the path name
       * @param float fileName
       */
      _myTrait_._filePath = function (fileName) {

        var str = this._path + "/" + fileName;
        str = str.replace("//", "/");
        return str;
      };

      /**
       * @param string dirName
       */
      _myTrait_._initCreateDir = function (dirName) {
        var p,
            me = this;
        var local = this._db,
            server = this._server;

        return _promise(function (result, fail) {

          me._isFolder(dirName).then(function (isFolder) {
            if (!isFolder) {
              var row = {
                name: me._normalize(me._path + dirName + "/"),
                parentFolder: me._path
              };
              return local.table("folders").addRows([row]);
            } else {
              return "OK";
            }
          }).then(function () {

            result({
              result: true,
              text: "folder " + dirName + " created"
            });
          }).fail(fail);
        });
      };

      /**
       * @param float obj
       */
      _myTrait_._initFromData = function (obj) {

        // Create new directories...
        var me = this;
        var local = this._db,
            server = this._server;

        return _promise(function (result, fail) {
          var all = [];
          var myProm = _promise();

          for (var n in obj) {

            if (n.indexOf("..") >= 0) {
              fail(".. symbol is not allowed in the file or path names");
              result(false);
              return;
            }

            var name = n;
            if (me.isObject(obj[name])) {

              (function (obj, name) {
                var dirDone = _promise();
                all.push(dirDone);
                me._initCreateDir(name).then(function () {
                  var newF = me.getSubFolderObj(name);
                  return newF._initFromData(obj[name]);
                }).then(function () {
                  dirDone.resolve();
                }).fail(function () {
                  dirDone.resolve();
                });
              })(obj, name);
            } else {
              if (typeof obj[name] == "string") {
                all.push(me._writeFile(name, obj[name]));
              }
            }
          }
          myProm.all(all).then(function () {
            result(true);
          }).fail(fail);
          myProm.resolve(true);
        });
      };

      /**
       * @param float fileName
       */
      _myTrait_._isFile = function (fileName) {
        var me = this;
        return _promise(function (result, failure) {
          me._loadFiles().then(function (list) {
            for (var i = 0; i < list.length; i++) {
              if (list[i].name == fileName) {
                result(true);
                return;
              }
            }
            result(false);
          }).fail(failure);
        });
      };

      /**
       * @param float name
       */
      _myTrait_._isFolder = function (name) {
        var me = this;
        return _promise(function (result, failure) {
          name = me._normalize(me._path + "/" + name + "/");
          me._loadFolders().then(function (list) {
            for (var i = 0; i < list.length; i++) {
              if (list[i].name == name) {
                result(true);
                return;
              }
            }
            result(false);
          }).fail(failure);
        });
      };

      /**
       * @param float str
       */
      _myTrait_._lastPath = function (str) {

        var parts = str.split("/");

        var str = parts.pop();
        while (parts.length > 0) {
          if (str.length > 0) return str;
          str = parts.pop();
        }
        return str;
      };

      /**
       * @param float t
       */
      _myTrait_._loadFiles = function (t) {

        var local = this._db,
            me = this;

        return _promise(function (result) {
          local.table("files").getAll({
            folderName: me._path
          }).then(function (res) {
            me._fileCache = res;
            result(me._fileCache);
          });
        });
      };

      /**
       * @param float t
       */
      _myTrait_._loadFolders = function (t) {
        var local = this._db,
            me = this;

        return _promise(function (result) {
          local.table("folders").getAll({
            parentFolder: me._path
          }).then(function (res) {
            me._folderCache = res;
            result(me._folderCache);
          });
        });
      };

      /**
       * @param float pathName
       */
      _myTrait_._normalize = function (pathName) {
        var str = pathName.replace("//", "/");
        return str;
      };

      /**
       * @param float fileName
       */
      _myTrait_._onlyClearWrites = function (fileName) {
        var p,
            me = this;
        var local = this._db,
            server = this._server;

        return _promise(function (result, fail) {

          server.then(function () {
            return me._isFile(fileName);
          }).then(function (isFile) {
            if (!isFile) {
              return local.table("files").addRows([{
                name: fileName,
                folderName: me._path
              }]);
            } else {
              return "OK";
            }
          }).then(function () {
            // remove the old write from the file table
            return local.table("fileWrites").remove({
              filePath: me._filePath(fileName)
            });
          }).then(function () {
            // all should be ready...
            result({
              result: true,
              text: "writes cleared"
            });
          }).fail(fail);
        });
      };

      /**
       * @param float fileName
       */
      _myTrait_._removeFileFromCache = function (fileName) {
        if (this._fileCache) {
          for (var i = 0; i < this._fileCache.length; i++) {
            if (this._fileCache[i].name == fileName) {
              this._fileCache.splice(i, 1);
              return;
            }
          }
        }
      };

      /**
       * @param float name
       */
      _myTrait_._removeFolderFromCache = function (name) {
        if (this._folderCache) {
          for (var i = 0; i < this._fileCache.length; i++) {
            if (this._folderCache[i].name == name) {
              this._folderCache.splice(i, 1);
              return;
            }
          }
        }
      };

      /**
       * @param string fileName
       * @param float fileData
       */
      _myTrait_._writeFile = function (fileName, fileData) {
        var p,
            me = this;
        var local = this._db,
            server = this._server;

        console.log("writeFile ", fileName, fileData);

        return _promise(function (result, fail) {

          if (typeof fileData != "string") {
            // can not write anything else than strings
            fail({
              result: false,
              text: "Only string writes are accepted"
            });
            return;
          }

          me._isFile(fileName).then(function (isFile) {
            if (!isFile) {
              return local.table("files").addRows([{
                name: fileName,
                folderName: me._path
              }]);
            } else {
              return "OK";
            }
          }).then(function () {
            // remove the old write from the file table
            return local.table("fileWrites").remove({
              filePath: me._filePath(fileName)
            });
          }).then(function () {
            return local.table("fileWrites").addRows([{
              filePath: me._filePath(fileName),
              data: fileData
            }]);
          }).then(function () {
            // all should be ready...
            result({
              result: true,
              text: "file " + fileName + " written"
            });
          }).fail(fail);
        });
      };

      /**
       * @param float fileName
       * @param float data
       */
      _myTrait_.appendFile = function (fileName, data) {

        var p,
            me = this;
        var local = this._db,
            server = this._server;

        return _promise(function (result, fail) {

          if (typeof data != "string") {
            // can not write anything else than strings
            fail({
              result: false,
              text: "Only string writes are accepted"
            });
            return;
          }

          server.then(function () {
            return me._isFile(fileName);
          }).then(function (isFile) {
            if (!isFile) {
              return local.table("files").addRows([{
                name: fileName,
                folderName: me._path
              }]);
            } else {
              return "OK";
            }
          }).then(function () {
            return local.table("fileWrites").addRows([{
              filePath: me._filePath(fileName),
              data: data
            }]);
          }).then(function () {
            // all should be ready...
            result({
              result: true,
              text: "file " + fileName + " written"
            });
          }).fail(fail);
        });
      };

      /**
       * @param float dirName
       */
      _myTrait_.createDir = function (dirName) {
        var p,
            me = this;
        var local = this._db,
            server = this._server;

        return _promise(function (result, fail) {

          server.then(function () {
            return me._isFolder(dirName);
          }).then(function (isFolder) {
            if (!isFolder) {
              var row = {
                name: me._normalize(me._path + dirName + "/"),
                parentFolder: me._path
              };
              return local.table("folders").addRows([row]);
            } else {
              return "OK";
            }
          }).then(function () {

            result({
              result: true,
              text: "folder " + dirName + " created"
            });
          }).fail(fail);
        });
      };

      /**
       * @param string name
       */
      _myTrait_.findPath = function (name) {

        if (name.charAt(0) == "/") name = name.substring(0);
        var parts = name.trim().split("/");
        var fold = this;

        return _promise(function (response) {

          if (!parts[0]) {
            response(fold);
            return;
          }

          var sub, rootProm, currFolder;
          parts.forEach(function (sub) {

            if (!sub || sub.trim().length == 0) return;

            if (!fold) {
              response(false);
              return;
            }
            if (!rootProm) {
              currFolder = fold;
              rootProm = fold.isFolder(sub);
            } else {
              rootProm = rootProm.then(function (f) {
                currFolder = f;
                if (f) return f.isFolder(sub);
                return false;
              });
            }

            rootProm = rootProm.then(function (is_fold) {
              if (is_fold) {
                return currFolder.getFolder(sub);
              }
              return false;
            });
          });

          rootProm.then(response);
        });
      };

      /**
       * @param float obj
       */
      _myTrait_.fromData = function (obj) {

        // Create new directories...
        var me = this;
        var local = this._db,
            server = this._server;

        return _promise(function (result, fail) {
          var all = [];
          var myProm = _promise();
          server.then(function () {
            for (var n in obj) {

              if (n.indexOf("..") >= 0) {
                fail(".. symbol is not allowed in the file or path names");
                return;
              }

              var name = n;
              if (me.isObject(obj[name])) {
                (function () {
                  var dirDone = _promise();
                  all.push(dirDone);
                  me.createDir(name).then(function () {
                    var newF = me.getSubFolderObj(name);
                    return newF.fromData(obj[name]);
                  }).then(function () {
                    dirDone.resolve();
                  }).fail(function () {
                    dirDone.resolve();
                  });
                })();
              } else {
                if (typeof obj[name] == "string") {
                  all.push(me.writeFile(name, obj[name]));
                }
              }
            }
            myProm.all(all).then(function () {
              result(true);
            }).fail(fail);
            myProm.resolve(true);
          });
        });
      };

      /**
       * @param string name
       */
      _myTrait_.getFolder = function (name) {
        return this.getSubFolderObj(name);
      };

      /**
       * @param Object dirName
       */
      _myTrait_.getSubFolderObj = function (dirName) {

        var subPath = this._normalize(this._path + dirName + "/");
        return indexedDBFsFolder(this._server, subPath);
      };

      /**
       * @param float t
       */
      _myTrait_.getTree = function (t) {
        var treePromise = this.toData({
          getData: false
        });
        return treePromise;
      };

      /**
       * @param float t
       */
      _myTrait_.id = function (t) {
        return this._id;
      };

      if (_myTrait_.__traitInit && !_myTrait_.hasOwnProperty("__traitInit")) _myTrait_.__traitInit = _myTrait_.__traitInit.slice();
      if (!_myTrait_.__traitInit) _myTrait_.__traitInit = [];
      _myTrait_.__traitInit.push(function (server, pathString) {

        this._server = server;
        this._path = pathString;
        this._id = this.guid();
        this._db = server.getDb();
      });

      /**
       * @param float fileName
       */
      _myTrait_.isFile = function (fileName) {
        var p,
            me = this;
        return _promise(function (result, fail) {
          result(me._isFile(fileName));
        });
      };

      /**
       * @param float fileName
       */
      _myTrait_.isFolder = function (fileName) {
        var p,
            me = this;
        return _promise(function (result, fail) {
          result(me._isFolder(fileName));
        });
      };

      /**
       * @param string str
       */
      _myTrait_.linesToJsonArray = function (str) {
        if (!str || typeof str != "string") return [];
        var a = str.split("\n");
        var res = [];
        a.forEach(function (line) {
          if (line.trim().length == 0) return;
          res.push(JSON.parse(line));
        });
        return res;
      };

      /**
       * @param function filter
       */
      _myTrait_.listFiles = function (filter) {

        var p,
            me = this;
        var local = this._db,
            server = this._server;

        return _promise(function (result, fail) {
          server.then(function () {
            me._loadFiles().then(function (list) {
              var res = [];
              list.forEach(function (data) {
                res.push(data.name);
              });
              result(res);
            });
          }).fail(fail);
        });
      };

      /**
       * @param float filter
       */
      _myTrait_.listFolders = function (filter) {
        var p,
            me = this;
        var local = this._db,
            server = this._server;

        return _promise(function (result, fail) {
          server.then(function () {
            me._loadFolders().then(function (list) {
              var res = [];
              list.forEach(function (data) {
                res.push(data.name);
              });
              result(res);
            });
          }).fail(fail);
        });
      };

      /**
       * @param string fileName
       * @param Object notUsed
       */
      _myTrait_.readFile = function (fileName, notUsed) {
        var p,
            me = this;
        var local = this._db,
            server = this._server;

        return _promise(function (result, fail) {

          server.then(function () {
            return me._isFile(fileName);
          }).then(function (isFile) {
            if (!isFile) {
              throw "The file does not exist";
            } else {
              return "OK";
            }
          }).then(function () {
            // remove the old write from the file table
            return local.table("fileWrites").getAll({
              filePath: me._filePath(fileName)
            });
          }).then(function (list) {
            var str = "";
            list.forEach(function (write) {
              str += write.data;
            });
            result(str);
          }).fail(fail);
        });
      };

      /**
       * @param float fileName
       */
      _myTrait_.removeFile = function (fileName) {
        var p,
            me = this;
        var local = this._db,
            server = this._server;

        return _promise(function (result, fail) {

          var bIsFile = false;
          server.then(function () {
            return me._isFile(fileName);
          }).then(function (isFile) {
            bIsFile = isFile;
            if (!isFile) {
              return "OK";
            } else {
              return local.table("fileWrites").remove({
                filePath: me._filePath(fileName)
              });
            }
          }).then(function () {
            if (bIsFile) {
              // {name: "README.TXT", folderName: "/"}
              return local.table("files")._cursorAction("readwrite", {
                folderName: me._path
              }, function (cursor) {
                var data = cursor.value;
                if (data.name == fileName) {
                  cursor["delete"](); // remove the file if
                  me._removeFileFromCache(fileName);
                }
              });
            } else {
              return "OK";
            }
          }).then(function () {
            // all should be ready...
            result({
              result: true,
              text: "file " + fileName + " removed"
            });
          }).fail(fail);
        });
      };

      /**
       * @param Object options
       * @param String notUsed
       */
      _myTrait_.toData = function (options, notUsed) {

        var me = this;

        var options = options || {};

        var fileFilter = options.fileFilter,
            dirFilter = options.dirFilter;

        if (typeof options.getData == "undefined") options.getData = true;

        return _promise(function (result, fail) {

          var o = {};
          me.listFiles().then(function (list) {
            var cnt = list.length,
                done = 0,
                waiting = _promise();

            list.forEach(function (n) {
              if (fileFilter) {
                if (!fileFilter(n)) {
                  done++;
                  if (done == cnt) waiting.resolve(true);
                  return;
                }
              }
              if (options.getData) {
                me.readFile(n).then(function (data) {
                  o[n] = data;
                  done++;
                  if (done == cnt) waiting.resolve(true);
                });
              } else {
                o[n] = true;
                done++;
                if (done == cnt) waiting.resolve(true);
              }
            });
            if (cnt == 0) waiting.resolve(true);
            return waiting;
          }).then(function () {
            return me.listFolders();
          }).then(function (list) {
            var cnt = list.length,
                done = 0,
                waiting = _promise();
            list.forEach(function (dirName) {
              if (dirFilter) {
                if (!dirFilter(dirName)) {
                  done++;
                  if (done == cnt) waiting.resolve(true);
                  return;
                }
              }
              var subName = me._lastPath(dirName);
              var newF = me.getSubFolderObj(subName);
              newF.toData(fileFilter, dirFilter).then(function (data) {
                o[subName] = data;
                done++;
                if (done == cnt) waiting.resolve(true);
              });
            });
            if (cnt == 0) waiting.resolve(true);
            return waiting;
          }).then(function () {
            result(o);
          }).fail(function () {
            result({});
          });
        });
      };

      /**
       * @param float fileName
       * @param float fileData
       */
      _myTrait_.writeFile = function (fileName, fileData) {
        var p,
            me = this;
        var local = this._db,
            server = this._server;

        return _promise(function (result, fail) {

          if (typeof fileData != "string") {
            // can not write anything else than strings
            fail({
              result: false,
              text: "Only string writes are accepted"
            });
            return;
          }

          server.then(function () {
            return me._isFile(fileName);
          }).then(function (isFile) {
            if (!isFile) {
              return local.table("files").addRows([{
                name: fileName,
                folderName: me._path
              }]);
            } else {
              return "OK";
            }
          }).then(function () {
            // remove the old write from the file table
            return local.table("fileWrites").remove({
              filePath: me._filePath(fileName)
            });
          }).then(function () {
            return local.table("fileWrites").addRows([{
              filePath: me._filePath(fileName),
              data: fileData
            }]);
          }).then(function () {
            // all should be ready...
            result({
              result: true,
              text: "file " + fileName + " written"
            });
          }).fail(fail);
        });
      };
    })(this);
  };

  var indexedDBFsFolder = function indexedDBFsFolder(a, b, c, d, e, f, g, h) {
    var m = this,
        res;
    if (m instanceof indexedDBFsFolder) {
      var args = [a, b, c, d, e, f, g, h];
      if (m.__factoryClass) {
        m.__factoryClass.forEach(function (initF) {
          res = initF.apply(m, args);
        });
        if (typeof res == "function") {
          if (res._classInfo.name != indexedDBFsFolder._classInfo.name) return new res(a, b, c, d, e, f, g, h);
        } else {
          if (res) return res;
        }
      }
      if (m.__traitInit) {
        m.__traitInit.forEach(function (initF) {
          initF.apply(m, args);
        });
      } else {
        if (typeof m.init == "function") m.init.apply(m, args);
      }
    } else return new indexedDBFsFolder(a, b, c, d, e, f, g, h);
  };

  indexedDBFsFolder._classInfo = {
    name: "indexedDBFsFolder"
  };
  indexedDBFsFolder.prototype = new indexedDBFsFolder_prototype();

  (function () {
    if (typeof define !== "undefined" && define !== null && define.amd != null) {
      __amdDefs__["indexedDBFsFolder"] = indexedDBFsFolder;
      this.indexedDBFsFolder = indexedDBFsFolder;
    } else if (typeof module !== "undefined" && module !== null && module.exports != null) {
      module.exports["indexedDBFsFolder"] = indexedDBFsFolder;
    } else {
      this.indexedDBFsFolder = indexedDBFsFolder;
    }
  }).call(new Function("return this")());

  var fsServerIndexedDB_prototype = function fsServerIndexedDB_prototype() {

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
        return Object.prototype.toString.call(t) === "[object Array]";
      };

      /**
       * @param float fn
       */
      _myTrait_.isFunction = function (fn) {
        return Object.prototype.toString.call(fn) == "[object Function]";
      };

      /**
       * @param float t
       */
      _myTrait_.isObject = function (t) {
        return t === Object(t);
      };
    })(this);

    (function (_myTrait_) {
      var _instances;

      // Initialize static variables here...

      if (!_myTrait_.hasOwnProperty("__factoryClass")) _myTrait_.__factoryClass = [];
      _myTrait_.__factoryClass.push(function (id) {
        if (!_instances) {
          _instances = {};
        }

        if (_instances[id]) {
          return _instances[id];
        } else {
          _instances[id] = this;
        }
      });

      /**
       * @param float t
       */
      _myTrait_.createFrom = function (t) {};

      /**
       * @param float t
       */
      _myTrait_.getDb = function (t) {
        return this._db;
      };

      /**
       * UUID for the server
       * @param float t
       */
      _myTrait_.getID = function (t) {

        if (!this._id) {
          this._id = this.guid();
        }
        return this._id;
      };

      /**
       * @param float t
       */
      _myTrait_.getRootFolder = function (t) {

        return indexedDBFsFolder(this, "/");
      };

      if (_myTrait_.__traitInit && !_myTrait_.hasOwnProperty("__traitInit")) _myTrait_.__traitInit = _myTrait_.__traitInit.slice();
      if (!_myTrait_.__traitInit) _myTrait_.__traitInit = [];
      _myTrait_.__traitInit.push(function (serverName, createFrom) {

        var me = this;
        this._serverName = serverName;
        this._dbName = "vserver://" + serverName;
        this._db = _localDB(this._dbName, {
          tables: {
            folders: {
              createOptions: {
                keyPath: "name"
              },
              indexes: {
                parentFolder: {
                  unique: false
                }
              }
            },
            files: {
              createOptions: {
                autoIncrement: true
              },
              indexes: {
                folderName: {
                  unique: false
                }
              }
            },
            fileWrites: {
              createOptions: {
                autoIncrement: true
              },
              indexes: {
                filePath: {
                  unique: false
                }
              }
            }
          }
        });

        // make sure that there is at least the root folder ...
        this._db.then(function () {
          me._db.table("folders").count().then(function (cnt) {

            if (cnt >= 1) {

              if (createFrom) {

                me.getRootFolder()._initFromData(createFrom).then(function () {
                  me.resolve(true);
                });
              } else {
                me.resolve(true);
              }
            } else {

              me._db.table("folders").addRows([{
                name: "/"
              }]).then(function () {
                if (createFrom) {

                  me.getRootFolder()._initFromData(createFrom).then(function () {
                    me.resolve(true);
                  });
                } else {
                  me.resolve(true);
                }
              });
            }
          });
        });
      });
    })(this);
  };

  var fsServerIndexedDB = function fsServerIndexedDB(a, b, c, d, e, f, g, h) {
    var m = this,
        res;
    if (m instanceof fsServerIndexedDB) {
      var args = [a, b, c, d, e, f, g, h];
      if (m.__factoryClass) {
        m.__factoryClass.forEach(function (initF) {
          res = initF.apply(m, args);
        });
        if (typeof res == "function") {
          if (res._classInfo.name != fsServerIndexedDB._classInfo.name) return new res(a, b, c, d, e, f, g, h);
        } else {
          if (res) return res;
        }
      }
      if (m.__traitInit) {
        m.__traitInit.forEach(function (initF) {
          initF.apply(m, args);
        });
      } else {
        if (typeof m.init == "function") m.init.apply(m, args);
      }
    } else return new fsServerIndexedDB(a, b, c, d, e, f, g, h);
  };

  fsServerIndexedDB_prototype.prototype = _promise.prototype;

  fsServerIndexedDB._classInfo = {
    name: "fsServerIndexedDB"
  };
  fsServerIndexedDB.prototype = new fsServerIndexedDB_prototype();

  (function () {
    if (typeof define !== "undefined" && define !== null && define.amd != null) {
      __amdDefs__["fsServerIndexedDB"] = fsServerIndexedDB;
      this.fsServerIndexedDB = fsServerIndexedDB;
    } else if (typeof module !== "undefined" && module !== null && module.exports != null) {
      module.exports["fsServerIndexedDB"] = fsServerIndexedDB;
    } else {
      this.fsServerIndexedDB = fsServerIndexedDB;
    }
  }).call(new Function("return this")());

  var fsServerNode_prototype = function fsServerNode_prototype() {

    (function (_myTrait_) {
      var _servers;

      // Initialize static variables here...

      /**
       * @param float t
       */
      _myTrait_._initServers = function (t) {
        if (!_servers) {
          _servers = {};
        }
      };

      /**
       * @param float t
       */
      _myTrait_.getRootFolder = function (t) {

        // just a trivial security that the FS is not used for root folder
        var root = this._fsRoot;
        if (!root || root.length < 15 || root.indexOf("..") >= 0) {
          throw "Invalid root folder";
          return false;
        }

        var me = this;
        return nodeFsFolder(me._fsRoot);
      };

      if (_myTrait_.__traitInit && !_myTrait_.hasOwnProperty("__traitInit")) _myTrait_.__traitInit = _myTrait_.__traitInit.slice();
      if (!_myTrait_.__traitInit) _myTrait_.__traitInit = [];
      _myTrait_.__traitInit.push(function (fsRoot, createFrom) {

        // trivial security check to prevent accidentally using system root or
        // directories close to it
        if (!fsRoot || fsRoot.length < 15 || fsRoot.indexOf("..") >= 0) {
          throw "Invalid root folder";
          return false;
        }
        this._fsRoot = fsRoot;
        var me = this;

        if (createFrom) {
          this.getRootFolder().fromData(createFrom).then(function () {
            me.resolve(true);
          });
        } else {
          this.resolve(true);
        }
      });
    })(this);
  };

  var fsServerNode = function fsServerNode(a, b, c, d, e, f, g, h) {
    var m = this,
        res;
    if (m instanceof fsServerNode) {
      var args = [a, b, c, d, e, f, g, h];
      if (m.__factoryClass) {
        m.__factoryClass.forEach(function (initF) {
          res = initF.apply(m, args);
        });
        if (typeof res == "function") {
          if (res._classInfo.name != fsServerNode._classInfo.name) return new res(a, b, c, d, e, f, g, h);
        } else {
          if (res) return res;
        }
      }
      if (m.__traitInit) {
        m.__traitInit.forEach(function (initF) {
          initF.apply(m, args);
        });
      } else {
        if (typeof m.init == "function") m.init.apply(m, args);
      }
    } else return new fsServerNode(a, b, c, d, e, f, g, h);
  };

  fsServerNode_prototype.prototype = _promise.prototype;

  fsServerNode._classInfo = {
    name: "fsServerNode"
  };
  fsServerNode.prototype = new fsServerNode_prototype();

  (function () {
    if (typeof define !== "undefined" && define !== null && define.amd != null) {
      __amdDefs__["fsServerNode"] = fsServerNode;
      this.fsServerNode = fsServerNode;
    } else if (typeof module !== "undefined" && module !== null && module.exports != null) {
      module.exports["fsServerNode"] = fsServerNode;
    } else {
      this.fsServerNode = fsServerNode;
    }
  }).call(new Function("return this")());

  var localFs_prototype = function localFs_prototype() {

    (function (_myTrait_) {

      // Initialize static variables here...

      if (_myTrait_.__traitInit && !_myTrait_.hasOwnProperty("__traitInit")) _myTrait_.__traitInit = _myTrait_.__traitInit.slice();
      if (!_myTrait_.__traitInit) _myTrait_.__traitInit = [];
      _myTrait_.__traitInit.push(function (aclFile) {});
    })(this);
  };

  var localFs = function localFs(a, b, c, d, e, f, g, h) {
    var m = this,
        res;
    if (m instanceof localFs) {
      var args = [a, b, c, d, e, f, g, h];
      if (m.__factoryClass) {
        m.__factoryClass.forEach(function (initF) {
          res = initF.apply(m, args);
        });
        if (typeof res == "function") {
          if (res._classInfo.name != localFs._classInfo.name) return new res(a, b, c, d, e, f, g, h);
        } else {
          if (res) return res;
        }
      }
      if (m.__traitInit) {
        m.__traitInit.forEach(function (initF) {
          initF.apply(m, args);
        });
      } else {
        if (typeof m.init == "function") m.init.apply(m, args);
      }
    } else return new localFs(a, b, c, d, e, f, g, h);
  };

  localFs._classInfo = {
    name: "localFs"
  };
  localFs.prototype = new localFs_prototype();

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
        return Object.prototype.toString.call(fn) == "[object Function]";
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
          cmd: "c2s",
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
          cmd: "s2c",
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

        console.log("deltaMasterToSlave");
        var sameUntil = updateFrame.start;

        if (serverState.needsRefresh) {
          console.log("** serverState needs refresh **");
          return;
        }

        // if the server's journal is a lot behind the sent data...
        if (updateFrame.start > data._journal.length) {

          console.log("--- setting refresh on because of ---- ");
          console.log(" updateFrame.start > data._journal.length ");

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
                      console.log("not same ", ai, arr1[ai], arr2[ai]);
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
                          console.log("not same array ", ai);
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
                    console.log("was not the same");
                    console.log(serverCmd, "vs", myJ);
                  }
                }
              }
            } else {
              for (var j = 0; j <= 4; j++) {
                if (myJ[j] != serverCmd[j]) {
                  bSame = false;
                  console.log("was not the same");
                  console.log(serverCmd[j], "vs", myJ[j]);
                }
              }
            }
          } else {
            // a new command has arrived...

            var cmdRes = data.execCmd(serverCmd); // set data ready to be broadcasted
            if (cmdRes !== true) {
              // if we get errors then we have some kind of problem
              console.log("--- setting refresh on because of ---- ");
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
            console.log("Not same ");
            console.log(JSON.stringify(updateFrame.c));
            return _promise(function (done) {
              // here is the point where the data is reversed and also the server journal should be truncated:
              data.reverseToLine(sameUntil);
              var size = updateFrame.journalSize;
              console.log("Truncating the journal to ", size, sameUntil);
              // truncate server journal to certain length
              serverState.model.truncateJournalTo(size, sameUntil).then(function () {

                // and then run commands without sending them outside...
                var list = [];
                for (var i = sameUntil; i < updateFrame.end; i++) {

                  var serverCmd = updateFrame.c[i - updateFrame.start];
                  var cmdRes = data.execCmd(serverCmd); // data ready to be broadcasted
                  if (cmdRes !== true) {

                    console.log("--- there is need for a bigger refersh ---- ");
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

        console.log("server last update " + JSON.stringify(serverState.last_update));
        console.log("server data length " + serverState.data._journal.length);

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
          if (_hooks["onCancel"]) {
            _hooks["onCancel"]({
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

          if (_hooks["onError"]) {
            _hooks["onError"]({
              data: data,
              reason: " updateFrame.start > data._journal.length ",
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

        if (_hooks["onServerData"]) {
          _hooks["onServerData"]({
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
                      console.log("not same ", ai, arr1[ai], arr2[ai]);
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
                          console.log("not same array ", ai);
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
                    console.log("was not the same at array compare");
                    console.log(serverCmd, "vs", myJ);
                  }
                }
              }
            } else {
              for (var j = 0; j <= 4; j++) {
                if (myJ[j] != serverCmd[j]) {
                  bSame = false;
                  if (_hooks["onError"]) {
                    _hooks["onError"]({
                      data: data,
                      reason: " server datas are different ",
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
              console.log("--- setting refresh on because of ---- ");
              console.log(JSON.stringify(cmdRes));

              if (_hooks["onError"]) {
                _hooks["onError"]({
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

                console.log("--- setting refresh on because of ---- ");
                console.log(JSON.stringify(cmdRes));
                if (_hooks["onError"]) {
                  _hooks["onError"]({
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

      if (_myTrait_.__traitInit && !_myTrait_.hasOwnProperty("__traitInit")) _myTrait_.__traitInit = _myTrait_.__traitInit.slice();
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
        if (typeof res == "function") {
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
        if (typeof m.init == "function") m.init.apply(m, args);
      }
    } else return new _chPolicy(a, b, c, d, e, f, g, h);
  };

  _chPolicy._classInfo = {
    name: "_chPolicy"
  };
  _chPolicy.prototype = new _chPolicy_prototype();

  (function () {
    if (typeof define !== "undefined" && define !== null && define.amd != null) {
      __amdDefs__["_chPolicy"] = _chPolicy;
      this._chPolicy = _chPolicy;
    } else if (typeof module !== "undefined" && module !== null && module.exports != null) {
      module.exports["_chPolicy"] = _chPolicy;
    } else {
      this._chPolicy = _chPolicy;
    }
  }).call(new Function("return this")());

  var testFs_prototype = function testFs_prototype() {

    (function (_myTrait_) {
      var _instanceCache;

      // Initialize static variables here...

      if (_myTrait_.__traitInit && !_myTrait_.hasOwnProperty("__traitInit")) _myTrait_.__traitInit = _myTrait_.__traitInit.slice();
      if (!_myTrait_.__traitInit) _myTrait_.__traitInit = [];
      _myTrait_.__traitInit.push(function (t) {});
    })(this);
  };

  var testFs = function testFs(a, b, c, d, e, f, g, h) {
    var m = this,
        res;
    if (m instanceof testFs) {
      var args = [a, b, c, d, e, f, g, h];
      if (m.__factoryClass) {
        m.__factoryClass.forEach(function (initF) {
          res = initF.apply(m, args);
        });
        if (typeof res == "function") {
          if (res._classInfo.name != testFs._classInfo.name) return new res(a, b, c, d, e, f, g, h);
        } else {
          if (res) return res;
        }
      }
      if (m.__traitInit) {
        m.__traitInit.forEach(function (initF) {
          initF.apply(m, args);
        });
      } else {
        if (typeof m.init == "function") m.init.apply(m, args);
      }
    } else return new testFs(a, b, c, d, e, f, g, h);
  };

  testFs._classInfo = {
    name: "testFs"
  };
  testFs.prototype = new testFs_prototype();

  (function () {
    if (typeof define !== "undefined" && define !== null && define.amd != null) {
      __amdDefs__["testFs"] = testFs;
      this.testFs = testFs;
    } else if (typeof module !== "undefined" && module !== null && module.exports != null) {
      module.exports["testFs"] = testFs;
    } else {
      this.testFs = testFs;
    }
  }).call(new Function("return this")());

  var channelTesting_prototype = function channelTesting_prototype() {

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
        return Object.prototype.toString.call(fn) == "[object Function]";
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

      if (_myTrait_.__traitInit && !_myTrait_.hasOwnProperty("__traitInit")) _myTrait_.__traitInit = _myTrait_.__traitInit.slice();
      if (!_myTrait_.__traitInit) _myTrait_.__traitInit = [];
      _myTrait_.__traitInit.push(function (t) {});

      /**
       * The test users are &quot;Tero&quot; with password &quot;teropw&quot; and &quot;Juha&quot; with password &quot;juhapw&quot;. Juha has groups &quot;users&quot; and Tero has groups &quot;users&quot; and &quot;admins&quot;
       * @param float t
       */
      _myTrait_.pwFilesystem = function (t) {

        // The password and user infra, in the simulation environment:

        var pwData = {
          "groups": {},
          "domains": {},
          "users": {
            "505d18cbea690d03eb240729299468071c9f133758b6c527e2dddd458de2ad36": "ee8f858602fabad8e7f30372a4d910ab875b869d52d9206c0257d59678ba6031:id1:",
            "dce8981dec48df66ed7b139dfd1a680aa1d404a006264f24fda9e0e598c1ac8a": "add2bbda7947ab86c2e9f277ccee254611bedd1e3b8542113ea36931c1fdbf3e:id2:"
          },
          "udata": {
            "id1": "{\"userName\":\"Tero\",\"domain\":\"\",\"hash\":\"505d18cbea690d03eb240729299468071c9f133758b6c527e2dddd458de2ad36\",\"groups\":[\"users\",\"admins\"]}",
            "id2": "{\"userName\":\"Juha\",\"domain\":\"\",\"hash\":\"dce8981dec48df66ed7b139dfd1a680aa1d404a006264f24fda9e0e598c1ac8a\",\"groups\":[\"users\"]}"
          }
        };

        var pwFiles = fsServerMemory("pwServer1", pwData);

        return pwFiles;
      };

      /**
       * @param float options
       */
      _myTrait_.serverSetup1 = function (options) {

        options = options || {};
        var readyPromise = _promise();

        var baseData = {
          data: {
            path: "M22.441,28.181c-0.419,0-0.835-0.132-1.189-0.392l-5.751-4.247L9.75,27.789c-0.354,0.26-0.771,0.392-1.189,0.392c-0.412,0-0.824-0.128-1.175-0.384c-0.707-0.511-1-1.422-0.723-2.25l2.26-6.783l-5.815-4.158c-0.71-0.509-1.009-1.416-0.74-2.246c0.268-0.826,1.037-1.382,1.904-1.382c0.004,0,0.01,0,0.014,0l7.15,0.056l2.157-6.816c0.262-0.831,1.035-1.397,1.906-1.397s1.645,0.566,1.906,1.397l2.155,6.816l7.15-0.056c0.004,0,0.01,0,0.015,0c0.867,0,1.636,0.556,1.903,1.382c0.271,0.831-0.028,1.737-0.739,2.246l-5.815,4.158l2.263,6.783c0.276,0.826-0.017,1.737-0.721,2.25C23.268,28.053,22.854,28.181,22.441,28.181L22.441,28.181z",
            fill: "red",
            stroke: "black",
            sub: {
              data: {
                value1: "abba"
              },
              __id: "sub1"
            }
          },
          __id: "id1",
          __acl: "A:g:users@:rwx\nA:g:admins@:rwxadtTnNcCy"
        };

        if (options && options.data) {
          baseData.data = options.data;
        }

        // create a channel files
        var fsData = {
          "my": {
            "channel": {
              "journal.1": "",
              "file.2": JSON.stringify(baseData),
              "journal.2": JSON.stringify([4, "fill", "yellow", "red", "id1"]) + "\n",
              "ch.settings": JSON.stringify({
                version: 2, // version of the channel
                channelId: "my/channel", // ID of this channel
                journalLine: 1,
                utc: 14839287897 // UTC timestamp of creation               
              }),
              "forks": JSON.stringify({ // == forks on list of forks
                fromJournalLine: 1,
                version: 1,
                channelId: "my/channel/myFork",
                fromVersion: 2,
                from: "my/channel",
                to: "my/channel/myFork",
                name: "test of fork",
                utc: 14839287897
              }),
              "myFork": {
                "journal.1": JSON.stringify([4, "fill", "blue", "yellow", "id1"]) + "\n",
                "ch.settings": JSON.stringify({
                  fromJournalLine: 1, // from which line the fork starts
                  version: 1, // version of the channel
                  channelId: "my/channel/myFork", // ID of this channel
                  fromVersion: 2, // version of the fork's source
                  from: "my/channel", // the fork channels ID
                  to: "my/channel/myFork", // forks target channel
                  journalLine: 1,
                  name: "test of fork",
                  utc: 14839287897 // UTC timestamp of creation
                })
              }
            }
          }
        };

        if (options && options.fileSystemData) {
          fsData = options.fileSystemData;
        }

        var filesystem = fsServerMemory("ms" + this.guid(), fsData);

        // The password and user infra, in the simulation environment:
        var pwData = {
          "groups": {},
          "domains": {},
          "users": {
            "505d18cbea690d03eb240729299468071c9f133758b6c527e2dddd458de2ad36": "ee8f858602fabad8e7f30372a4d910ab875b869d52d9206c0257d59678ba6031:id1:",
            "dce8981dec48df66ed7b139dfd1a680aa1d404a006264f24fda9e0e598c1ac8a": "add2bbda7947ab86c2e9f277ccee254611bedd1e3b8542113ea36931c1fdbf3e:id2:"
          },
          "udata": {
            "id1": "{\"userName\":\"Tero\",\"domain\":\"\",\"hash\":\"505d18cbea690d03eb240729299468071c9f133758b6c527e2dddd458de2ad36\",\"groups\":[\"users\",\"admins\"]}",
            "id2": "{\"userName\":\"Juha\",\"domain\":\"\",\"hash\":\"dce8981dec48df66ed7b139dfd1a680aa1d404a006264f24fda9e0e598c1ac8a\",\"groups\":[\"users\"]}"
          }
        };

        var pwFiles = fsServerMemory("pw" + this.guid(), pwData);
        pwFiles.then(function () {
          return filesystem;
        }).then(function () {

          // Setting up the server       
          var root = pwFiles.getRootFolder();
          var auth = authFuzz(root);
          var fsRoot = filesystem.getRootFolder();

          var server = _serverSocket((options.protocol || "http") + "://" + (options.ip || "localhost"), options.port || 1234);
          var manager = _serverChannelMgr(server, filesystem.getRootFolder(), auth);

          readyPromise.resolve({
            server: server,
            manager: manager,
            fsRoot: fsRoot,
            auth: auth,
            pwRoot: root
          });
        });

        return readyPromise;
      };

      /**
       * Test filesystem 1 represents a channel &quot;my/channel&quot; with one fork with channelID &quot;my/channel/myFork&quot;.
       * @param float t
       */
      _myTrait_.testFilesystem1 = function (t) {
        var fsData = {
          "my": {
            "channel": {
              "journal.1": "",
              "file.2": JSON.stringify({
                data: {
                  path: "M22.441,28.181c-0.419,0-0.835-0.132-1.189-0.392l-5.751-4.247L9.75,27.789c-0.354,0.26-0.771,0.392-1.189,0.392c-0.412,0-0.824-0.128-1.175-0.384c-0.707-0.511-1-1.422-0.723-2.25l2.26-6.783l-5.815-4.158c-0.71-0.509-1.009-1.416-0.74-2.246c0.268-0.826,1.037-1.382,1.904-1.382c0.004,0,0.01,0,0.014,0l7.15,0.056l2.157-6.816c0.262-0.831,1.035-1.397,1.906-1.397s1.645,0.566,1.906,1.397l2.155,6.816l7.15-0.056c0.004,0,0.01,0,0.015,0c0.867,0,1.636,0.556,1.903,1.382c0.271,0.831-0.028,1.737-0.739,2.246l-5.815,4.158l2.263,6.783c0.276,0.826-0.017,1.737-0.721,2.25C23.268,28.053,22.854,28.181,22.441,28.181L22.441,28.181z",
                  fill: "red"
                },
                __id: "id1",
                __acl: "A:g:users@:rwx\nA:g:admins@:rwxadtTnNcCy"
              }),
              "journal.2": JSON.stringify([4, "fill", "yellow", "red", "id1"]) + "\n",
              "ch.settings": JSON.stringify({
                version: 2, // version of the channel
                channelId: "my/channel", // ID of this channel
                journalLine: 1,
                utc: 14839287897 // UTC timestamp of creation               
              }),
              "forks": JSON.stringify({ // == forks on list of forks
                fromJournalLine: 1,
                version: 1,
                channelId: "my/channel/myFork",
                fromVersion: 2,
                from: "my/channel",
                to: "my/channel/myFork",
                name: "test of fork",
                utc: 14839287897
              }),
              "myFork": {
                "journal.1": JSON.stringify([4, "fill", "blue", "yellow", "id1"]) + "\n",
                "ch.settings": JSON.stringify({
                  fromJournalLine: 1, // from which line the fork starts
                  version: 1, // version of the channel
                  channelId: "my/channel/myFork", // ID of this channel
                  fromVersion: 2, // version of the fork's source
                  from: "my/channel", // the fork channels ID
                  to: "my/channel/myFork", // forks target channel
                  name: "test of fork",
                  utc: 14839287897 // UTC timestamp of creation
                })
              }
            }
          }
        };

        return;
      };
    })(this);
  };

  var channelTesting = function channelTesting(a, b, c, d, e, f, g, h) {
    var m = this,
        res;
    if (m instanceof channelTesting) {
      var args = [a, b, c, d, e, f, g, h];
      if (m.__factoryClass) {
        m.__factoryClass.forEach(function (initF) {
          res = initF.apply(m, args);
        });
        if (typeof res == "function") {
          if (res._classInfo.name != channelTesting._classInfo.name) return new res(a, b, c, d, e, f, g, h);
        } else {
          if (res) return res;
        }
      }
      if (m.__traitInit) {
        m.__traitInit.forEach(function (initF) {
          initF.apply(m, args);
        });
      } else {
        if (typeof m.init == "function") m.init.apply(m, args);
      }
    } else return new channelTesting(a, b, c, d, e, f, g, h);
  };

  channelTesting._classInfo = {
    name: "channelTesting"
  };
  channelTesting.prototype = new channelTesting_prototype();

  (function () {
    if (typeof define !== "undefined" && define !== null && define.amd != null) {
      __amdDefs__["channelTesting"] = channelTesting;
      this.channelTesting = channelTesting;
    } else if (typeof module !== "undefined" && module !== null && module.exports != null) {
      module.exports["channelTesting"] = channelTesting;
    } else {
      this.channelTesting = channelTesting;
    }
  }).call(new Function("return this")());

  var subClassTemplate_prototype = function subClassTemplate_prototype() {

    (function (_myTrait_) {

      // Initialize static variables here...

      /**
       * @param float t
       */
      _myTrait_.helloWorld = function (t) {
        return "Hello World";
      };
    })(this);
  };

  var subClassTemplate = function subClassTemplate(a, b, c, d, e, f, g, h) {
    var m = this,
        res;
    if (m instanceof subClassTemplate) {
      var args = [a, b, c, d, e, f, g, h];
      if (m.__factoryClass) {
        m.__factoryClass.forEach(function (initF) {
          res = initF.apply(m, args);
        });
        if (typeof res == "function") {
          if (res._classInfo.name != subClassTemplate._classInfo.name) return new res(a, b, c, d, e, f, g, h);
        } else {
          if (res) return res;
        }
      }
      if (m.__traitInit) {
        m.__traitInit.forEach(function (initF) {
          initF.apply(m, args);
        });
      } else {
        if (typeof m.init == "function") m.init.apply(m, args);
      }
    } else return new subClassTemplate(a, b, c, d, e, f, g, h);
  };

  subClassTemplate_prototype.prototype = _data.prototype;

  subClassTemplate._classInfo = {
    name: "subClassTemplate"
  };
  subClassTemplate.prototype = new subClassTemplate_prototype();

  (function () {
    if (typeof define !== "undefined" && define !== null && define.amd != null) {
      __amdDefs__["subClassTemplate"] = subClassTemplate;
      this.subClassTemplate = subClassTemplate;
    } else if (typeof module !== "undefined" && module !== null && module.exports != null) {
      module.exports["subClassTemplate"] = subClassTemplate;
    } else {
      this.subClassTemplate = subClassTemplate;
    }
  }).call(new Function("return this")());

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
        return Object.prototype.toString.call(t) === "[object Array]";
      };

      /**
       * @param float fn
       */
      _myTrait_.isFunction = function (fn) {
        return Object.prototype.toString.call(fn) == "[object Function]";
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

        if (en == "connect" && this._connected) {
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

      if (_myTrait_.__traitInit && !_myTrait_.hasOwnProperty("__traitInit")) _myTrait_.__traitInit = _myTrait_.__traitInit.slice();
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

              openConnection = _tcpEmu(ip, port, "openConnection", "client", realSocket);
              connection = _tcpEmu(ip, port, myId, "client", realSocket);

              connection.on("clientMessage", function (o, v) {
                // console.log("clientMessage received ", v);
                if (v.connected) {
                  me._socket = connection;
                  me._connected = true;
                  me.trigger("connect", connection);
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
              me.trigger("connect", me._socket);
            }
            // console.log("Sending message to _tcpEmu with real socket ");
            // _hasbeenConnected = true;
          };
          var me = this;
          realSocket.on("disconnect", function () {
            me.trigger("disconnect");
          });

          if (realSocket.connected) {
            // console.log("realSocket was connected");
            whenConnected();
          } else {
            // console.log("realSocket was not connected");
            realSocket.on("connect", whenConnected);
          }

          // this._connected
          return;
        }

        var openConnection = _tcpEmu(ip, port, "openConnection", "client", realSocket);
        var connection = _tcpEmu(ip, port, myId, "client", realSocket);

        connection.on("clientMessage", function (o, v) {
          if (v.connected) {
            me._socket = connection;
            me._connected = true;
            me.trigger("connect", connection);
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
        if (typeof res == "function") {
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
        if (typeof m.init == "function") m.init.apply(m, args);
      }
    } else return new _clientSocket(a, b, c, d, e, f, g, h);
  };

  _clientSocket._classInfo = {
    name: "_clientSocket"
  };
  _clientSocket.prototype = new _clientSocket_prototype();

  (function () {
    if (typeof define !== "undefined" && define !== null && define.amd != null) {
      __amdDefs__["_clientSocket"] = _clientSocket;
      this._clientSocket = _clientSocket;
    } else if (typeof module !== "undefined" && module !== null && module.exports != null) {
      module.exports["_clientSocket"] = _clientSocket;
    } else {
      this._clientSocket = _clientSocket;
    }
  }).call(new Function("return this")());

  var _serverSocket_prototype = function _serverSocket_prototype() {

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
          cb(data, fn);
        });
        return this;
      };
    })(this);

    (function (_myTrait_) {
      var _channelIndex;
      var _rootData;
      var _clients;
      var _rooms;

      // Initialize static variables here...

      /**
       * @param float t
       */
      _myTrait_.getPrefix = function (t) {
        return this._ip + ":" + this._port;
      };

      if (_myTrait_.__traitInit && !_myTrait_.hasOwnProperty("__traitInit")) _myTrait_.__traitInit = _myTrait_.__traitInit.slice();
      if (!_myTrait_.__traitInit) _myTrait_.__traitInit = [];
      _myTrait_.__traitInit.push(function (ip, port, ioLib) {
        /*
        // This is how the server side should be operating...
        var io = require('socket.io')();
        io.on('connection', function(socket){
        socket.emit('an event', { some: 'data' });
        });
        */

        if (!_rooms) {
          _rooms = {};
          _clients = {};
        }

        var me = this;

        var sockets = [];

        this._ip = ip;
        this._port = port;
        this._ioLib = ioLib;

        if (ioLib) {
          ioLib.on("connection", function (socket) {

            console.log("socket.io got connection " + socket.handshake.address);

            me.remoteIP = socket.handshake.address;

            var openConnection = _tcpEmu(ip, port, "openConnection", "server", socket);

            var socket_list = [];
            socket.on("disconnect", function () {
              console.log("ioLib at server sent disconnect, closing opened connections");
              socket_list.forEach(function (s) {
                s.close();
              });
            });

            openConnection.on("serverMessage", function (o, v) {

              if (v.socketId) {

                var newSocket = _tcpEmu(ip, port, v.socketId, "server", socket);

                // save the virtual sockets for disconnection...
                socket_list.push(newSocket);

                var wrappedSocket = _serverSocketWrap(newSocket, me);
                wrappedSocket.remoteIP = socket.handshake.address;

                _clients[v.socketId] = wrappedSocket;
                me.trigger("connect", wrappedSocket);

                if (wrappedSocket.isConnected()) {
                  // console.log("Trying to send the connected message back to client");
                  newSocket.messageFrom({
                    connected: true,
                    socketId: v.socketId
                  });
                } else {}
              }
            });
          });
          return;
        }

        var openConnection = _tcpEmu(ip, port, "openConnection", "server");

        openConnection.on("serverMessage", function (o, v) {

          if (v.socketId) {
            //console.log("Trying to send msg to client ", v);
            var newSocket = _tcpEmu(ip, port, v.socketId, "server");

            var socket = _serverSocketWrap(newSocket, me);
            _clients[v.socketId] = socket;
            me.trigger("connect", socket);
            me.trigger("connection", socket);

            if (socket.isConnected()) {

              newSocket.messageFrom({
                connected: true,
                socketId: v.socketId
              });
            }
          }
        });
      });
    })(this);
  };

  var _serverSocket = function _serverSocket(a, b, c, d, e, f, g, h) {
    var m = this,
        res;
    if (m instanceof _serverSocket) {
      var args = [a, b, c, d, e, f, g, h];
      if (m.__factoryClass) {
        m.__factoryClass.forEach(function (initF) {
          res = initF.apply(m, args);
        });
        if (typeof res == "function") {
          if (res._classInfo.name != _serverSocket._classInfo.name) return new res(a, b, c, d, e, f, g, h);
        } else {
          if (res) return res;
        }
      }
      if (m.__traitInit) {
        m.__traitInit.forEach(function (initF) {
          initF.apply(m, args);
        });
      } else {
        if (typeof m.init == "function") m.init.apply(m, args);
      }
    } else return new _serverSocket(a, b, c, d, e, f, g, h);
  };

  _serverSocket._classInfo = {
    name: "_serverSocket"
  };
  _serverSocket.prototype = new _serverSocket_prototype();

  (function () {
    if (typeof define !== "undefined" && define !== null && define.amd != null) {
      __amdDefs__["_serverSocket"] = _serverSocket;
      this._serverSocket = _serverSocket;
    } else if (typeof module !== "undefined" && module !== null && module.exports != null) {
      module.exports["_serverSocket"] = _serverSocket;
    } else {
      this._serverSocket = _serverSocket;
    }
  }).call(new Function("return this")());

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
        return Object.prototype.toString.call(t) === "[object Array]";
      };

      /**
       * @param float fn
       */
      _myTrait_.isFunction = function (fn) {
        return Object.prototype.toString.call(fn) == "[object Function]";
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
        this.trigger("disconnect");
      };

      if (_myTrait_.__traitInit && !_myTrait_.hasOwnProperty("__traitInit")) _myTrait_.__traitInit = _myTrait_.__traitInit.slice();
      if (!_myTrait_.__traitInit) _myTrait_.__traitInit = [];
      _myTrait_.__traitInit.push(function (server, port, socketId, role, socket) {

        var me = this;
        this._server = server;
        this._port = port;
        this._role = role;
        this._socketId = socketId;
        this._dbName = "tcp://" + this._server + ":" + this._port + ":" + this._socketId;

        if (!_log) {
          if (typeof lokki != "undefined") {
            _log = lokki("tcp");
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
        var bnTo = this._dbName + ":to";
        var bnFrom = this._dbName + ":from";

        if (!_msgBuffer) _msgBuffer = {};
        if (!_msgBuffer[bnTo]) _msgBuffer[bnTo] = [];
        if (!_msgBuffer[bnFrom]) _msgBuffer[bnFrom] = [];

        var _mfn = function _mfn() {
          if (role == "server") {
            var list = _msgBuffer[bnTo].slice();
            list.forEach(function (msg) {
              _log.log("server got message ", msg);
              me.trigger("serverMessage", msg);
              _msgBuffer[bnTo].shift();
            });
          }
          if (role == "client") {
            var list = _msgBuffer[bnFrom].slice();
            list.forEach(function (msg) {
              me.trigger("clientMessage", msg);
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

        var bn = this._dbName + ":from";
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

        var bn = this._dbName + ":to";
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

        if (role == "server") {
          this._pumpListener = function (data) {
            // _log.log("socketPump", me._dbName);
            me.trigger("serverMessage", data);
          };
          socket.on(this._dbName, this._pumpListener);
        }

        if (role == "client") {
          this._pumpListener = function (data) {
            me.trigger("clientMessage", data);
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
        if (typeof res == "function") {
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
        if (typeof m.init == "function") m.init.apply(m, args);
      }
    } else return new _tcpEmu(a, b, c, d, e, f, g, h);
  };

  _tcpEmu._classInfo = {
    name: "_tcpEmu"
  };
  _tcpEmu.prototype = new _tcpEmu_prototype();

  var _serverSocketWrap_prototype = function _serverSocketWrap_prototype() {

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
          cb(data, fn);
        });
        return this;
      };
    })(this);

    (function (_myTrait_) {
      var _channelIndex;
      var _rootData;
      var _rooms;
      var _socketRooms;

      // Initialize static variables here...

      /**
       * @param float roomName
       * @param float name
       * @param float data
       */
      _myTrait_.delegateToRoom = function (roomName, name, data) {

        var realRoomName = this._roomPrefix + ":" + roomName;

        if (_rooms && _rooms[realRoomName]) {
          var me = this;
          _rooms[realRoomName].forEach(function (socket) {
            if (socket != me) {
              socket.emit(name, data);
            }
          });
        }
      };

      /**
       * @param float t
       */
      _myTrait_.disconnect = function (t) {
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
      };

      /**
       * @param float name
       * @param float value
       */
      _myTrait_.emit = function (name, value) {

        this._tcp.messageFrom({
          name: name,
          data: value
        });
      };

      /**
       * @param float t
       */
      _myTrait_.getId = function (t) {
        return this._tcp._socketId;
      };

      /**
       * @param float t
       */
      _myTrait_.getUserId = function (t) {

        return this._userId;
      };

      /**
       * @param float t
       */
      _myTrait_.getUserRoles = function (t) {

        return this._roles;
      };

      if (_myTrait_.__traitInit && !_myTrait_.hasOwnProperty("__traitInit")) _myTrait_.__traitInit = _myTrait_.__traitInit.slice();
      if (!_myTrait_.__traitInit) _myTrait_.__traitInit = [];
      _myTrait_.__traitInit.push(function (tcpEmu, server, isReal) {

        var me = this;
        this._roomPrefix = server.getPrefix();
        this._server = server;
        this._tcp = tcpEmu;

        tcpEmu.on("disconnect", function () {
          console.log("tcpEmu sent disconnect");
          me.disconnect();
        });

        var disconnected = false;
        tcpEmu.on("serverMessage", function (o, v) {

          if (me._disconnected) return; // not good enough

          if (v.disconnect) {
            me.disconnect();
            return;
          }
          if (v._callBackId) {
            me.trigger(v.name, v.data, function (data) {
              me.emit(v._callBackId, data);
            });
          } else {
            me.trigger(v.name, v.data);
          }
        });

        this.broadcast = {
          to: function to(room) {
            return {
              emit: function emit(name, value) {
                me.delegateToRoom(room, name, value);
              }
            };
          }
        }

        /*
        socket.broadcast.to(_ctx.channelId).emit('ctxupd_'+_ctx.channelId, cObj);
        */

        ;
      });

      /**
       * @param float t
       */
      _myTrait_.isConnected = function (t) {
        if (this._disconnected) return false;
        return true;
      };

      /**
       * @param float roomName
       */
      _myTrait_.isInRoom = function (roomName) {
        if (!_socketRooms) return false;
        return _socketRooms[this.getId()].indexOf(roomName) >= 0;
      };

      /**
       * Adds a new client to some room
       * @param String roomName
       */
      _myTrait_.join = function (roomName) {

        var realRoomName = this._roomPrefix + ":" + roomName;

        if (!_rooms) _rooms = {};
        if (!_rooms[realRoomName]) _rooms[realRoomName] = [];

        if (_rooms[realRoomName].indexOf(this) < 0) {
          _rooms[realRoomName].push(this);
          if (!_socketRooms) _socketRooms = {};
          if (!_socketRooms[this.getId()]) _socketRooms[this.getId()] = [];

          _socketRooms[this.getId()].push(roomName);
        }
      };

      /**
       * @param float roomName
       */
      _myTrait_.leave = function (roomName) {

        var realRoomName = this._roomPrefix + ":" + roomName;

        if (!_rooms) _rooms = {};
        if (!_rooms[realRoomName]) _rooms[realRoomName] = [];

        var i;
        if ((i = _rooms[realRoomName].indexOf(this)) >= 0) {
          _rooms[realRoomName].splice(i, 1);
          var id = this.getId();

          var i2 = _socketRooms[id].indexOf(roomName);
          if (i2 >= 0) _socketRooms[id].splice(i2, 1);
        }
      };

      /**
       * @param float socket
       */
      _myTrait_.leaveFromRooms = function (socket) {
        var id = this.getId();
        var me = this;

        if (!_socketRooms) return;
        if (!_socketRooms[id]) return;

        _socketRooms[id].forEach(function (name) {
          me.leave(name);
        });
      };

      /**
       * @param float t
       */
      _myTrait_.removeListener = function (t) {};

      /**
       * Each socket can have and in many implementations must have some userID and role, which can be used together with the ACL implementations.
       * @param float userId
       * @param float roles
       */
      _myTrait_.setAuthInfo = function (userId, roles) {

        this._userId = userId;
        this._roles = roles;
      };

      /**
       * @param string roomName
       */
      _myTrait_.to = function (roomName) {

        var realRoomName = this._roomPrefix + ":" + roomName;

        return {
          emit: function emit(name, data) {
            //console.log(" emit called ");
            if (_rooms && _rooms[realRoomName]) {
              _rooms[realRoomName].forEach(function (socket) {
                // console.log(" emit with ", name, data);
                socket.emit(name, data);
              });
            }
          }
        };
      };
    })(this);
  };

  var _serverSocketWrap = function _serverSocketWrap(a, b, c, d, e, f, g, h) {
    var m = this,
        res;
    if (m instanceof _serverSocketWrap) {
      var args = [a, b, c, d, e, f, g, h];
      if (m.__factoryClass) {
        m.__factoryClass.forEach(function (initF) {
          res = initF.apply(m, args);
        });
        if (typeof res == "function") {
          if (res._classInfo.name != _serverSocketWrap._classInfo.name) return new res(a, b, c, d, e, f, g, h);
        } else {
          if (res) return res;
        }
      }
      if (m.__traitInit) {
        m.__traitInit.forEach(function (initF) {
          initF.apply(m, args);
        });
      } else {
        if (typeof m.init == "function") m.init.apply(m, args);
      }
    } else return new _serverSocketWrap(a, b, c, d, e, f, g, h);
  };

  _serverSocketWrap._classInfo = {
    name: "_serverSocketWrap"
  };
  _serverSocketWrap.prototype = new _serverSocketWrap_prototype();

  var socketEmulator_prototype = function socketEmulator_prototype() {

    (function (_myTrait_) {
      var _initDone;

      // Initialize static variables here...

      if (_myTrait_.__traitInit && !_myTrait_.hasOwnProperty("__traitInit")) _myTrait_.__traitInit = _myTrait_.__traitInit.slice();
      if (!_myTrait_.__traitInit) _myTrait_.__traitInit = [];
      _myTrait_.__traitInit.push(function (host, bUseReal) {});
    })(this);
  };

  var socketEmulator = function socketEmulator(a, b, c, d, e, f, g, h) {
    var m = this,
        res;
    if (m instanceof socketEmulator) {
      var args = [a, b, c, d, e, f, g, h];
      if (m.__factoryClass) {
        m.__factoryClass.forEach(function (initF) {
          res = initF.apply(m, args);
        });
        if (typeof res == "function") {
          if (res._classInfo.name != socketEmulator._classInfo.name) return new res(a, b, c, d, e, f, g, h);
        } else {
          if (res) return res;
        }
      }
      if (m.__traitInit) {
        m.__traitInit.forEach(function (initF) {
          initF.apply(m, args);
        });
      } else {
        if (typeof m.init == "function") m.init.apply(m, args);
      }
    } else return new socketEmulator(a, b, c, d, e, f, g, h);
  };

  socketEmulator._classInfo = {
    name: "socketEmulator"
  };
  socketEmulator.prototype = new socketEmulator_prototype();

  var _agent_prototype = function _agent_prototype() {

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

        dataCh.createWorker("_to_ch", // worker ID
        [7, "*", null, null, ns_id], // filter
        {
          target: this
        });

        dataCh.createWorker("_to_ch", // worker ID
        [5, "*", null, null, ns_id], // filter
        {
          target: this
        });

        dataCh.createWorker("_d_set", // worker ID
        [4, "*", null, null, ns_id], // filter
        {
          target: this
        });

        dataCh.createWorker("_d_rem", // worker ID
        [8, "*", null, null, ns_id], // filter
        {
          target: this
        });

        dataCh.createWorker("_d_ins", // worker ID
        [7, "*", null, null, ns_id], // filter
        {
          target: this
        });

        dataCh.createWorker("_d_mv", // worker ID
        [12, "*", null, null, ns_id], // filter
        {
          target: this
        });

        // "_d_cf"

        dataCh.createWorker("_d_cf", // worker ID
        [5, "*", null, null, ns_id], // filter
        {
          obj: this
        });
        dataCh.createWorker("_d_cf", // worker ID
        [4, "*", null, null, ns_id], // filter
        {
          obj: this
        });

        // _d_ch -> child object has changed event
        dataCh.createWorker("_d_ch", // worker ID
        [42, "*", null, null, ns_id], // filter
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

          // if the object already exists, do not re-create   
          if (this._chData._find(data.__id)) return list;

          if (this.isArray(data.data)) {

            list.push([2, data.__id, "", null, data.__id]);

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

            list.push([1, data.__id, "", null, data.__id]);
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
              if (n == "__id") {
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
            if (n == "__oid") {
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
        this.set(n, defaultValue || "");
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

            if (typeof value == "undefined") {
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

        console.error("*** FIND IS NOT IMPLEMENTED *** ");

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
          fn(_agent(d, me._chData));
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
          var limit = arrayKeys.split(",");
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
       * @param String name  - Property name to get
       */
      _myTrait_.get = function (name) {

        var obj = this._docData;
        if (obj) {
          var value = obj.data[name];
          if (this.isObject(value)) {
            return _agent(value, this._chData);
          } else {
            return value;
          }
        }
      };

      /**
       * @param bool bNew  - Boolean, if new data
       */
      _myTrait_.getData = function (bNew) {

        return this._docData;
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

        if (typeof this._docData.data[name] != "undefined") {
          return true;
        }
        return false;
      };

      /**
       * @param float t
       */
      _myTrait_.indexOf = function (t) {

        var obj = this._docData;
        if (obj) {
          var parent = this._chData._find(obj.__p);
          if (parent && parent.data) {
            var index = parent.data.indexOf(obj);
            return index;
          }
        }
        return -1;
      };

      if (_myTrait_.__traitInit && !_myTrait_.hasOwnProperty("__traitInit")) _myTrait_.__traitInit = _myTrait_.__traitInit.slice();
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

        if (typeof t == "undefined") {
          if (!this._docData) return false;
          if (!this._docData.data) return false;
          return this.isArray(this._docData.data);
        }
        return Object.prototype.toString.call(t) === "[object Array]";
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
        return Object.prototype.toString.call(fn) == "[object Function]";
      };

      /**
       * @param float t
       */
      _myTrait_.isObject = function (t) {

        if (typeof t == "undefined") {
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

        if (typeof p != "undefined") {
          return this;
        }
        if (!this._docData) {
          return;
        }

        var p = this._docData.__p;
        if (p) return _agent(p);
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
            bOldData = false,
            plainData;

        var dd = this._docData;

        if (newData.__dataTr) {
          plainData = newData.getData();
          if (plainData.__p) {
            // remove from parent
            newData.remove();
          }
          var index;
          if (typeof toIndex != "undefined") {
            index = toIndex;
            if (index < 0 || index > dd.data.length) return;
          } else {
            index = dd.data.length;
          }
          this._chData.execCmd([7, index, plainData.__id, null, this._docData.__id]);
          return this;
        }

        // is raw data
        if (!(newData.__id && newData.data)) {
          data = this._wrapToData(newData);
        }

        var cmds = this._objectCreateCmds(data);
        for (var i = 0; i < cmds.length; i++) {
          this._chData.execCmd(cmds[i]);
        }

        var index;
        if (typeof toIndex != "undefined") {
          index = toIndex;
          if (index < 0 || index > dd.data.length) return;
        } else {
          index = dd.data.length;
        }

        this._chData.execCmd([7, index, data.__id, null, this._docData.__id]);

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
        var obj = this._docData;
        if (obj) {
          var parent = this._chData._find(obj.__p);
          if (parent && parent.data) {
            var index = parent.data.indexOf(obj);
            if (index >= 0) {
              this._chData.execCmd([8, index, ns_id, 0, parent.__id]);
            }
          }
        }
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

        console.error("RenderTemplate not implemented");

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
            if (typeof v == "undefined") continue;
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
        var obj = this._docData;
        if (obj) {
          // adding the command to the channel objects
          if (!this.isObject(value)) {
            var old_value = obj.data[name];
            if (old_value != value) {
              this._chData.execCmd([4, name, value, old_value, obj.__id]);
            }
          } else {
            var data,
                newData = value;

            if (newData._wrapToData) {
              newData = newData.getData();
            }

            // TODO: namespace transformation, if needed       
            data = this._wrapToData(newData);

            var cmds = this._objectCreateCmds(data);
            for (var i = 0; i < cmds.length; i++) {
              this._chData.execCmd(cmds[i]);
            }

            this._chData.execCmd([5, name, data.__id, null, obj.__id]);
          }
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
       * @param String name  - Variable to unset
       */
      _myTrait_.unset = function (name) {

        var obj = this._docData;

        if (obj && obj.data) {
          var ns_id = obj.__id;
          if (this.isObject(obj.data[name])) {
            this._chData.execCmd([10, name, obj.data[name].__id, null, ns_id]);
          } else {
            if (obj.data && typeof obj.data[name] != "undefined") {
              this._chData.execCmd([10, name, obj.data[name], "value", ns_id]);
            }
          }
        }
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

      if (_myTrait_.__traitInit && !_myTrait_.hasOwnProperty("__traitInit")) _myTrait_.__traitInit = _myTrait_.__traitInit.slice();
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
       * @param Object dataObj
       */
      _myTrait_.diff = function (dataObj) {
        var diff = diffEngine();

        var res = diff.compareFiles(this.getData(true), dataObj.getData(true));

        return res.cmds;
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
            var myD = _data(req.protocol + "://" + req.ip + ":" + req.port + "/" + newChannelId, me._initOptions);
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

      if (_myTrait_.__traitInit && !_myTrait_.hasOwnProperty("__traitInit")) _myTrait_.__traitInit = _myTrait_.__traitInit.slice();
      if (!_myTrait_.__traitInit) _myTrait_.__traitInit = [];
      _myTrait_.__traitInit.push(function (objData, chData) {

        // or are you using the docData directly as the source of the data ?

        if (!chData) {
          if (objData && objData.getData) {
            chData = objData;
            objData = chData.getData();
          }
        }

        this._docData = objData;
        this._chData = chData;
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
       * @param float cmds
       */
      _myTrait_.patch = function (cmds) {
        var me = this;
        cmds.forEach(function (c, index) {
          me._chData.execCmd(tc, true);
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
        var parts = path.split("/"),
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
              if (val == "{path}") {
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

        if (!subPathName) subPathName = "items";
        if (!titleName) titleName = "title";
        var find_or_insert_item = function find_or_insert_item(_x3, _x4) {
          var _again2 = true;

          _function2: while (_again2) {
            var index = _x3,
                from = _x4;
            name = did_find = newObj = undefined;
            _again2 = false;

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
              _x3 = index + 1;
              _x4 = did_find;
              _again2 = true;
              continue _function2;
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

  var _agent = function _agent(a, b, c, d, e, f, g, h) {
    var m = this,
        res;
    if (m instanceof _agent) {
      var args = [a, b, c, d, e, f, g, h];
      if (m.__factoryClass) {
        m.__factoryClass.forEach(function (initF) {
          res = initF.apply(m, args);
        });
        if (typeof res == "function") {
          if (res._classInfo.name != _agent._classInfo.name) return new res(a, b, c, d, e, f, g, h);
        } else {
          if (res) return res;
        }
      }
      if (m.__traitInit) {
        m.__traitInit.forEach(function (initF) {
          initF.apply(m, args);
        });
      } else {
        if (typeof m.init == "function") m.init.apply(m, args);
      }
    } else return new _agent(a, b, c, d, e, f, g, h);
  };

  _agent._classInfo = {
    name: "_agent"
  };
  _agent.prototype = new _agent_prototype();

  (function () {
    if (typeof define !== "undefined" && define !== null && define.amd != null) {
      __amdDefs__["_agent"] = _agent;
      this._agent = _agent;
    } else if (typeof module !== "undefined" && module !== null && module.exports != null) {
      module.exports["_agent"] = _agent;
    } else {
      this._agent = _agent;
    }
  }).call(new Function("return this")());

  var moshModule_prototype = function moshModule_prototype() {

    (function (_myTrait_) {

      // Initialize static variables here...

      if (_myTrait_.__traitInit && !_myTrait_.hasOwnProperty("__traitInit")) _myTrait_.__traitInit = _myTrait_.__traitInit.slice();
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
        if (typeof res == "function") {
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
        if (typeof m.init == "function") m.init.apply(m, args);
      }
    } else return new moshModule(a, b, c, d, e, f, g, h);
  };

  moshModule._classInfo = {
    name: "moshModule"
  };
  moshModule.prototype = new moshModule_prototype();

  if (typeof define !== "undefined" && define !== null && define.amd != null) {
    define(__amdDefs__);
  }
}).call(new Function("return this")());

// OK.

// result( { result : false,  text : "Login failed"} );

// skip, if next should be taken instead

// this.writeCommand(a, newObj);

// this.writeCommand(a, newObj);

// this.writeCommand(a);

// this.writeCommand(a);

//    this.writeCommand(a);
/*
this._channelId = channelId;
this._commands = sequenceStepper(channelId);
this._chManager = chManager;
*/

// console.log("Strange... no emit value in ", this._parent);

// objectCache[data.__id] = this;

// console.log("Row ",i," written succesfully");

/*
serverState.model.writeToJournal( goodList ).then( function() {
// done(result);
});
*/

// console.log("The socket was not connected");

// TODO: not implemented yet

// var socket = io('http://localhost');

// console.log("Strange... no emit value in ", this._parent);