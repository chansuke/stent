'use strict';

var _handleAction = require('../handleAction');

var _handleAction2 = _interopRequireDefault(_handleAction);

var _constants = require('../constants');

var _helpers = require('../helpers');

var _ = require('../');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

describe('Given the handleAction function', function () {
  beforeEach(function () {
    _.Machine.flush();
  });

  describe('when we add a handler which is not expected', function () {
    it('should throw an error', function () {
      var machine = {
        state: { name: 'idle' },
        transitions: {
          idle: { run: 42 },
          running: { stop: 'foo' }
        }
      };

      expect(_handleAction2.default.bind(null, machine, 'run')).to.throw(_constants.ERROR_NOT_SUPPORTED_HANDLER_TYPE);
    });
  });

  describe('when dispatching an action which is missing in the current state', function () {
    it('should silently do nothing and NOT throw an error (handleAction returns false)', function () {
      var machine = {
        state: { name: 'idle' },
        transitions: {
          idle: { run: 'running' },
          running: { stop: 'foo' }
        }
      };

      expect((0, _handleAction2.default)(machine, 'stop', 'a', 'b')).to.equal(false);;
    });
  });

  describe('when there is nothing for the current state', function () {
    it('should return false', function () {
      var machine = {
        state: { name: 'idle' },
        transitions: {
          foo: {}
        }
      };

      expect((0, _handleAction2.default)(machine, 'something')).to.be.false;
    });
  });

  describe('when we transition to a state which has no actions or it is undefined', function () {
    it('should throw an error if there is no such a state defined', function () {
      var machine = {
        state: { name: 'idle' },
        transitions: {
          idle: {
            'run': 'running'
          }
        }
      };

      expect(_handleAction2.default.bind(null, machine, 'run')).to.throw((0, _constants.ERROR_UNCOVERED_STATE)('running'));
    });
    it('should throw an error if there the state has no actions inside', function () {
      var machine = {
        state: { name: 'idle' },
        transitions: {
          idle: {
            'run': 'running'
          },
          running: {}
        }
      };

      expect(_handleAction2.default.bind(null, machine, 'run')).to.throw((0, _constants.ERROR_UNCOVERED_STATE)('running'));
    });
  });

  describe('when the handler is a string', function () {
    it('should change the state of the machine to that string', function () {
      var machine = {
        state: { name: 'idle' },
        transitions: {
          idle: { run: 'running' },
          running: { stop: 'idle' }
        }
      };

      (0, _handleAction2.default)(machine, 'run');
      expect(machine.state.name).to.equal('running');
    });
  });

  describe('when the handler is an object', function () {
    it('should change the state of the machine to that object', function () {
      var newState = { name: 'running', answer: 42 };
      var machine = {
        state: { name: 'idle' },
        transitions: {
          idle: { run: newState },
          running: { stop: 'idle' }
        }
      };

      (0, _handleAction2.default)(machine, 'run');
      expect(machine.state).to.deep.equal(newState);
    });
  });

  describe('when the handler is a function', function () {
    it('should call the handler with the current state and the given payload', function () {
      var handler = sinon.spy();
      var payload = ['foo', 'bar', 'baz'];
      var machine = {
        state: { name: 'idle' },
        transitions: {
          idle: { run: handler },
          running: { stop: 'idle' }
        }
      };

      _handleAction2.default.apply(undefined, [machine, 'run'].concat(payload));
      expect(handler).to.be.calledOnce.and.to.be.calledWith({ name: 'idle' }, 'foo', 'bar', 'baz');
    });
    it('should update the state', function () {
      var handler = function handler(state, payload) {
        return { name: 'bar', data: payload };
      };
      var machine = {
        state: { name: 'idle' },
        transitions: {
          idle: { run: handler },
          bar: { a: 'b' }
        }
      };

      (0, _handleAction2.default)(machine, 'run', 42);
      expect(machine.state).to.deep.equal({ name: 'bar', data: 42 });
    });
    it('should update the state even if a string is returned', function () {
      var handler = function handler(state, payload) {
        return 'bar';
      };
      var machine = {
        state: { name: 'idle', data: 42 },
        transitions: {
          idle: { run: handler },
          bar: { a: 'b' }
        }
      };

      (0, _handleAction2.default)(machine, 'run');
      expect(machine.state).to.deep.equal({ name: 'bar' });
    });
    it('should run the handler with the machine as a context', function () {
      var handler = function handler() {
        expect(this.state).to.deep.equal({ name: 'idle', data: 42 });
        return 'foo';
      };
      var machine = {
        state: { name: 'idle', data: 42 },
        transitions: {
          idle: { run: handler },
          foo: { a: 'b' }
        }
      };

      (0, _handleAction2.default)(machine, 'run');
    });
  });

  describe('when the handler is a generator', function () {
    it('should change the state if we return a string', function () {
      var handler = /*#__PURE__*/regeneratorRuntime.mark(function handler() {
        return regeneratorRuntime.wrap(function handler$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return 'foo';

              case 2:
                _context.next = 4;
                return 'bar';

              case 4:
                return _context.abrupt('return', 'running');

              case 5:
              case 'end':
                return _context.stop();
            }
          }
        }, handler, this);
      });
      var machine = {
        state: { name: 'idle', data: 42 },
        transitions: {
          idle: { run: handler },
          foo: { a: 'b' },
          bar: { a: 'b' },
          running: { a: 'b' }
        }
      };

      (0, _handleAction2.default)(machine, 'run');
      expect(machine.state.name).to.equal('running');
    });
    it('should change the state if we yield a primitive', function () {
      var handler = /*#__PURE__*/regeneratorRuntime.mark(function handler() {
        return regeneratorRuntime.wrap(function handler$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return 100;

              case 2:
              case 'end':
                return _context2.stop();
            }
          }
        }, handler, this);
      });
      var machine = {
        state: { name: 'idle', data: 42 },
        transitions: {
          idle: { run: handler },
          '100': { a: 'b' }
        }
      };

      (0, _handleAction2.default)(machine, 'run');
      expect(machine.state.name).to.equal('100');
    });
    it('should change the state if we yield an object', function () {
      var handler = /*#__PURE__*/regeneratorRuntime.mark(function handler() {
        return regeneratorRuntime.wrap(function handler$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _context3.next = 2;
                return { name: 'running', data: 12 };

              case 2:
                _context3.next = 4;
                return { name: 'jumping', data: 1 };

              case 4:
              case 'end':
                return _context3.stop();
            }
          }
        }, handler, this);
      });
      var machine = {
        state: { name: 'idle', data: 42 },
        transitions: {
          idle: { run: handler },
          running: { a: 'b' },
          jumping: { a: 'b' }
        }
      };

      (0, _handleAction2.default)(machine, 'run');
      expect(machine.state).to.deep.equal({ name: 'jumping', data: 1 });
    });

    describe('and we use the call helper', function () {
      it('should execute the function and return the result', function () {
        var api = function api(name) {
          return 'hello ' + name;
        };
        var handler = /*#__PURE__*/regeneratorRuntime.mark(function handler() {
          var newState;
          return regeneratorRuntime.wrap(function handler$(_context4) {
            while (1) {
              switch (_context4.prev = _context4.next) {
                case 0:
                  _context4.next = 2;
                  return (0, _helpers.call)(api, 'stent');

                case 2:
                  newState = _context4.sent;
                  return _context4.abrupt('return', newState);

                case 4:
                case 'end':
                  return _context4.stop();
              }
            }
          }, handler, this);
        });
        var machine = {
          state: { name: 'idle', data: 42 },
          transitions: {
            idle: { run: handler },
            'hello stent': 'a'
          }
        };

        (0, _handleAction2.default)(machine, 'run');
        expect(machine.state).to.deep.equal({ name: 'hello stent' });
      });
      describe('and when the function returns a promise', function () {
        it('should return the value of the resolved promise', function () {
          var api = function api(name) {
            return Promise.resolve('hello ' + name);
          };
          var handler = /*#__PURE__*/regeneratorRuntime.mark(function handler() {
            var newState;
            return regeneratorRuntime.wrap(function handler$(_context5) {
              while (1) {
                switch (_context5.prev = _context5.next) {
                  case 0:
                    _context5.next = 2;
                    return (0, _helpers.call)(api, 'stent');

                  case 2:
                    newState = _context5.sent;
                    return _context5.abrupt('return', newState);

                  case 4:
                  case 'end':
                    return _context5.stop();
                }
              }
            }, handler, this);
          });
          var machine = {
            state: { name: 'idle', data: 42 },
            transitions: {
              idle: { run: handler },
              'hello stent': 'a'
            }
          };

          (0, _handleAction2.default)(machine, 'run');
          return Promise.resolve().then(function () {
            expect(machine.state).to.deep.equal({ name: 'hello stent' });
          });
        });
        it('should throw an error if the promise is rejected', function () {
          var api = function api(name) {
            return Promise.reject('error ' + name);
          };
          var handler = /*#__PURE__*/regeneratorRuntime.mark(function handler() {
            var _newState;

            return regeneratorRuntime.wrap(function handler$(_context6) {
              while (1) {
                switch (_context6.prev = _context6.next) {
                  case 0:
                    _context6.prev = 0;
                    _context6.next = 3;
                    return (0, _helpers.call)(api, 'stent');

                  case 3:
                    _newState = _context6.sent;
                    _context6.next = 9;
                    break;

                  case 6:
                    _context6.prev = 6;
                    _context6.t0 = _context6['catch'](0);
                    return _context6.abrupt('return', _context6.t0);

                  case 9:
                    return _context6.abrupt('return', newState);

                  case 10:
                  case 'end':
                    return _context6.stop();
                }
              }
            }, handler, this, [[0, 6]]);
          });
          var machine = {
            state: { name: 'idle', data: 42 },
            transitions: {
              idle: { run: handler },
              'error stent': 'a'
            }
          };

          (0, _handleAction2.default)(machine, 'run');
          return Promise.resolve().then(function () {
            expect(machine.state).to.deep.equal({ name: 'error stent' });
          });
        });
      });
      describe('when the function returns another generator', function () {
        it('should iterate through that inner generator', function () {
          var api = /*#__PURE__*/regeneratorRuntime.mark(function api(name) {
            return regeneratorRuntime.wrap(function api$(_context7) {
              while (1) {
                switch (_context7.prev = _context7.next) {
                  case 0:
                    _context7.next = 2;
                    return 42;

                  case 2:
                    _context7.next = 4;
                    return (0, _helpers.call)(function () {
                      return Promise.resolve(name + ': merry christmas');
                    });

                  case 4:
                    return _context7.abrupt('return', _context7.sent);

                  case 5:
                  case 'end':
                    return _context7.stop();
                }
              }
            }, api, this);
          });
          var handler = /*#__PURE__*/regeneratorRuntime.mark(function handler() {
            return regeneratorRuntime.wrap(function handler$(_context8) {
              while (1) {
                switch (_context8.prev = _context8.next) {
                  case 0:
                    _context8.next = 2;
                    return (0, _helpers.call)(api, 'stent');

                  case 2:
                    return _context8.abrupt('return', _context8.sent);

                  case 3:
                  case 'end':
                    return _context8.stop();
                }
              }
            }, handler, this);
          });
          var machine = {
            state: { name: 'idle', data: 42 },
            transitions: {
              idle: { run: handler },
              '42': 'a',
              'stent: merry christmas': 'b'
            }
          };

          (0, _handleAction2.default)(machine, 'run');
          return Promise.resolve().then(function () {
            expect(machine.state).to.deep.equal({ name: 'stent: merry christmas' });
          });
        });
        describe('and when that other generator is actually another handler', function () {
          it('should pass the correct context, i.e. the machine', function (done) {
            var handlerA = /*#__PURE__*/regeneratorRuntime.mark(function handlerA(state) {
              return regeneratorRuntime.wrap(function handlerA$(_context9) {
                while (1) {
                  switch (_context9.prev = _context9.next) {
                    case 0:
                      _context9.next = 2;
                      return (0, _helpers.call)(handlerB, state, 'world');

                    case 2:
                    case 'end':
                      return _context9.stop();
                  }
                }
              }, handlerA, this);
            });
            var handlerB = /*#__PURE__*/regeneratorRuntime.mark(function handlerB(state, params) {
              return regeneratorRuntime.wrap(function handlerB$(_context10) {
                while (1) {
                  switch (_context10.prev = _context10.next) {
                    case 0:
                      _context10.next = 2;
                      return {
                        name: 'foo',
                        message: state.name + ': merry christmas ' + params
                      };

                    case 2:
                      this.fin();

                    case 3:
                    case 'end':
                      return _context10.stop();
                  }
                }
              }, handlerB, this);
            });
            var machine = {
              state: { name: 'idle', data: 42 },
              fin: function fin() {
                expect(machine.state.message).to.equal('idle: merry christmas world');
                done();
              },
              transitions: {
                idle: {
                  run: handlerA
                },
                foo: {
                  bar: 'zzzz'
                }
              }
            };

            (0, _handleAction2.default)(machine, 'run');
            return Promise.resolve().then(function () {
              expect(machine.state).to.deep.equal({
                name: 'foo',
                message: 'idle: merry christmas world'
              });
            });
          });
        });
      });
    });

    describe('and we use the wait helper', function () {
      it('should wait till the other action is dispatched', function (done) {
        var handler = /*#__PURE__*/regeneratorRuntime.mark(function handler() {
          var _ref, a, b, answer;

          return regeneratorRuntime.wrap(function handler$(_context11) {
            while (1) {
              switch (_context11.prev = _context11.next) {
                case 0:
                  _context11.next = 2;
                  return (0, _helpers.wait)(['push the machine', 'pull the machine']);

                case 2:
                  _ref = _context11.sent;
                  a = _ref[0];
                  b = _ref[1];
                  _context11.next = 7;
                  return (0, _helpers.wait)('stop the machine');

                case 7:
                  answer = _context11.sent;
                  return _context11.abrupt('return', 'the answer is ' + answer + ': ' + a + ' + ' + b);

                case 9:
                case 'end':
                  return _context11.stop();
              }
            }
          }, handler, this);
        });
        var machine = {
          state: { name: 'idle' },
          transitions: {
            idle: {
              run: handler,
              'stop the machine': function stopTheMachine() {},
              'push the machine': function pushTheMachine() {},
              'pull the machine': function pullTheMachine() {},
              'destroy the machine': function destroyTheMachine() {}
            },
            'the answer is 42: 20 + 22': { a: 'b' }
          }
        };

        (0, _handleAction2.default)(machine, 'run');
        (0, _handleAction2.default)(machine, 'destroy the machine');
        (0, _handleAction2.default)(machine, 'pull the machine', 22);
        setTimeout(function () {
          return (0, _handleAction2.default)(machine, 'push the machine', 20);
        }, 5);
        setTimeout(function () {
          return (0, _handleAction2.default)(machine, 'stop the machine', 42);
        }, 10);
        setTimeout(function () {
          expect(machine[_constants.WAIT_LISTENERS_STORAGE]).to.be.undefined;
          expect(machine.state).to.deep.equal({ name: 'the answer is 42: 20 + 22' });
          done();
        }, 100);
      });
      describe('and we pass multiple actions but as args of wait', function () {
        it('should work the same way as we pass an array', function (done) {
          var handler = /*#__PURE__*/regeneratorRuntime.mark(function handler() {
            var _ref2, a, b, answer;

            return regeneratorRuntime.wrap(function handler$(_context12) {
              while (1) {
                switch (_context12.prev = _context12.next) {
                  case 0:
                    _context12.next = 2;
                    return (0, _helpers.wait)('push the machine', 'pull the machine');

                  case 2:
                    _ref2 = _context12.sent;
                    a = _ref2[0];
                    b = _ref2[1];
                    _context12.next = 7;
                    return (0, _helpers.wait)('stop the machine');

                  case 7:
                    answer = _context12.sent;
                    return _context12.abrupt('return', 'the answer is ' + answer + ': ' + a + ' + ' + b);

                  case 9:
                  case 'end':
                    return _context12.stop();
                }
              }
            }, handler, this);
          });
          var machine = {
            state: { name: 'idle' },
            transitions: {
              idle: {
                run: handler,
                'stop the machine': function stopTheMachine() {},
                'push the machine': function pushTheMachine() {},
                'pull the machine': function pullTheMachine() {},
                'destroy the machine': function destroyTheMachine() {}
              },
              'the answer is 42: 20 + 22': { a: 'b' }
            }
          };

          (0, _handleAction2.default)(machine, 'run');
          (0, _handleAction2.default)(machine, 'destroy the machine');
          (0, _handleAction2.default)(machine, 'pull the machine', 22);
          setTimeout(function () {
            return (0, _handleAction2.default)(machine, 'push the machine', 20);
          }, 5);
          setTimeout(function () {
            return (0, _handleAction2.default)(machine, 'stop the machine', 42);
          }, 10);
          setTimeout(function () {
            expect(machine[_constants.WAIT_LISTENERS_STORAGE]).to.be.undefined;
            expect(machine.state).to.deep.equal({ name: 'the answer is 42: 20 + 22' });
            done();
          }, 100);
        });
      });
    });
  });

  describe('when we have middlewares registered', function () {
    it('should fire the middleware/s if an action is dispatched', function (done) {
      _.Machine.addMiddleware([{
        onActionDispatched: function onActionDispatched(next, actionName) {
          expect(actionName).to.equal('run');

          for (var _len = arguments.length, args = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
            args[_key - 2] = arguments[_key];
          }

          expect(args).to.deep.equal([{ answer: 42 }]);
          next();
          expect(machine.state).to.deep.equal({ name: 'running' });
        }
      }, {
        onActionDispatched: function onActionDispatched(next, actionName) {
          expect(actionName).to.equal('run');

          for (var _len2 = arguments.length, args = Array(_len2 > 2 ? _len2 - 2 : 0), _key2 = 2; _key2 < _len2; _key2++) {
            args[_key2 - 2] = arguments[_key2];
          }

          expect(args).to.deep.equal([{ answer: 42 }]);
          next();
          expect(machine.state).to.deep.equal({ name: 'running' });
          done();
        }
      }]);
      var machine = {
        state: { name: 'idle' },
        transitions: {
          idle: { run: 'running' },
          running: { stop: 'idle' }
        }
      };

      (0, _handleAction2.default)(machine, 'run', { answer: 42 });
    });
    it('should pass the machine as context', function () {
      var spy = sinon.spy();
      var machineA = {
        state: { name: 'idle' },
        transitions: {
          idle: { run: 'running' },
          running: { stop: 'idle' }
        }
      };
      var machineB = {
        state: { name: 'nothing' },
        transitions: {
          nothing: { run: 'foobar' },
          foobar: { stop: 'nothing' }
        }
      };
      _.Machine.addMiddleware({
        onActionDispatched: function onActionDispatched(next, actionName) {
          next();
          spy(this.state.name);
        }
      });

      (0, _handleAction2.default)(machineA, 'run');
      (0, _handleAction2.default)(machineB, 'run');

      expect(spy).to.be.calledTwice;
      expect(spy.firstCall).to.be.calledWith('running');
      expect(spy.secondCall).to.be.calledWith('foobar');
    });
    it('should skip to the next middleware if there is no appropriate hook defined', function (done) {
      _.Machine.addMiddleware([{
        onStateChanged: function onStateChanged(next) {
          next();
        }
      }, {
        onActionDispatched: function onActionDispatched(next, actionName) {
          next();
          expect(this.state).to.deep.equal({ name: 'running' });
          done();
        }
      }]);
      var machine = {
        state: { name: 'idle' },
        transitions: {
          idle: { run: 'running' },
          running: { stop: 'idle' }
        }
      };

      (0, _handleAction2.default)(machine, 'run', { answer: 42 });
    });
    it('should fire the middleware/s when the state is changed', function (done) {
      _.Machine.addMiddleware([{
        onStateChanged: function onStateChanged(next) {
          expect(this.state).to.deep.equal({ name: 'idle' });
          next();
          expect(this.state).to.deep.equal({ name: 'running' });
        }
      }, {
        onStateChanged: function onStateChanged(next) {
          done();
        }
      }]);
      var machine = {
        state: { name: 'idle' },
        transitions: {
          idle: { run: 'running' },
          running: { stop: 'idle' }
        }
      };

      (0, _handleAction2.default)(machine, 'run', { answer: 42 });
    });
  });
});