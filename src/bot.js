var Slack = require('slack-client');
var rx = require('rx');
var Response = require('./response');

/**
 * Ferd
 *
 * @constructor
 * @description A modular Slack Bot. Returns nothing.
 * @param {String} apiToken Slack's Bot Integration API Token
 */
var Ferd = function(apiToken) {
  this.slack = new Slack(apiToken, true, true);
  this.messages = null;
  this.name = null;
  this.id = null;
  this.disposablesCounter = 0;
  this.disposables = {};
};

/**
 * Ferd.prototype.login
 *
 * @description Opens WebSocket with Slack's Real-time Messaging API. Returns
 *   nothing.
 */
Ferd.prototype.login = function() {
  var self = this;
  this.slack.on('open', () => self._setUp() );
  this.slack.on('error', (reason, code) => console.log('socket error: reason ' + reason + ', code ' + code) );
  this.slack.login();
  this.messages = this._createMessageStream();
};

/**
 * Ferd.prototype.logout
 *
 * @description Closes WebSocket with Slack's Real-time Messaging API. Disposese all the disposables created
 *   from listeners. Returns nothing.
 */
Ferd.prototype.logout = function() {

  // destroy all observables created from this.messages
  for(var key in this.disposables) {
    this.disposables[key].dispose();
  }

  this.slack.disconnect();

};

/**
 * Ferd.prototype.addModule
 *
 * @description Injects a module into Ferd. Returns nothing.
 * @param {module} ferdModule A module to inject into Ferd. Example:
 *   `ferd.addModule(require('./ferd_modules/yo.js'))`
 */
Ferd.prototype.addModule = function(ferdModule) {
  ferdModule(this);
};

/**
 * Ferd.prototype.addModules
 *
 * @description Injects modules into Ferd. Returns nothing.
 * @param {module[]} ferdModules An array of modules to inject into Ferd.
 *   Example: `ferd.addModules([require('ferd-bart'), require('./ferd_modules/yo.js'), ...])`
 */
Ferd.prototype.addModules = function(ferdModules) {
  var self = this;
  ferdModules.forEach(function(module) {
    module(self);
  });
};

/**
 * Ferd.prototype.listen
 *
 * @description Listen to message stream for `capture` to trigger, then calls
 *   a `callback` function.
 * @param {String} capture A regular expression to trigger the callback on
 * @param {Function} callback A callback with a response object passed in
 * @return {observable} - WHAT IS AN OBSERVABLE?
 */
Ferd.prototype.listen = function(capture, callback) {
  return this.hear(function(message) {
    return true;
  }, capture, callback);
};

/**
 * Ferd.prototype.respond
 *
 * @description  Listens to message stream for ferd's name and `capture` to
 *   trigger, then calls `callback`
 * @param {String} capture A regular expression to trigger the callback on
 * @param {Function} callback A callback with a response object passed in
 * @return {observable} - PUPPIES?
 */
Ferd.prototype.respond = function(capture, callback) {
  var self = this;
  return this.hear(function(message) {
    return message.text.match(new RegExp(self.name, 'i')) ||
      message.text.match(new RegExp('<' + self.id + '>', 'i'));
  }, capture, callback);
};

/**
 * Allows multi-user sessions
 * @param  {regex}   summon   RegEx triggered to register user in session
 * @param  {regex}   dismiss  RegEx triggered to terminate a session
 * @param  {object}  handlers callbacks for interacting with messages
 * @return {disposable}       garbage can
 */
Ferd.prototype.session = function(summonRE, dismissRE, handlers) {
  var self = this;
  var users = {};
  var defaults = {
    salute: function(res, phrase) {
      var name = res.getMessageSender().name || 'Buddy';
      res.send(phrase + ', ' + name + '!');
    },
    hello: function(res) {
      this.salute(res, 'Hello');
    },
    chat: function(res) {
      this.salute(res, 'Whatever');
    },
    bye: function(res) {
      this.salute(res, 'Bye');
    }
  };

  handlers = handlers || {};
  handlers.greeting = handlers.greeting || defaults.hello;
  handlers.converse = handlers.converse || defaults.chat;
  handlers.farewell = handlers.farewell || defaults.bye;

  var cycle = {
    birth: null,
    life: null,
    death: null
  };
  
  cycle.death = self.listen(dismissRE, function(res) {
    var userId = res.incomingMessage.user;
    users[userId] = null;
    handlers.farewell(res);
  });

  cycle.life = this.hear(function(message) {
    return !!users[message.user];
  }, /.*/, handlers.converse);

  cycle.birth = this.listen(summonRE, function(res) {
    var userId = res.incomingMessage.user,
        username = res.getMessageSender().name;
    users[userId] = username;
    handlers.greeting(res);
  });

  var disposable = rx.Disposable.create(function() {
    cycle.birth.dispose();
    cycle.life.dispose();
    cycle.death.dispose();
  });

  return disposable;

};

/**
 * Ferd.prototype.hear
 *
 * @description Listens to message stream for `filter` to return true and
 *   `capture` to trigger, then calls `callback`
 * @param {Function} filter A function that returns true or false. Takes in message.
 * @param {String} capture A regular expression to trigger the callback on
 * @param {Function} callback A callback with a response object passed in
 * @return {disposable} trashcan.
 */
Ferd.prototype.hear = function(filter, capture, callback) {
  var self = this;
  var slack = this.slack;
  var messages = this.messages
    .filter(m => filter(m) && m.text && m.text.match(capture));

  var disposable = messages
    .subscribe(function(message) {
      var response = Response(capture, message, slack)
      callback(response);
    }, function(err) {
      console.error(err);
    }, function() {
      console.log('Completed!');
    });

  self.disposables[self.disposablesCounter++] = disposable;
  return disposable;
  };

/**
 * Ferd.prototype.ignore
 *
 * @description Stops listening on the stream, or more abstractly, disposes the disposable
 * @param  {disposable} disposable The disposable to dispose
 */
Ferd.prototype.ignore = function(disposable) {
  return disposable.dispose();
}

/**
 * Ferd.prototype._createMessageStream
 *
 * @private
 * @description Sets up a message stream.
 * @return {observable} Message Stream
 */
Ferd.prototype._createMessageStream = function() {
  var messages = rx.Observable.fromEvent(this.slack, 'message')
    .where(e => e.type === 'message');
  return messages;
};

/**
 * Ferd.prototype._setUp
 *
 * @private
 * @description Bootstraps Ferd identity. Returns nothing.
 */
Ferd.prototype._setUp = function() {
  this.name = this.slack.self.name;
  this.id = this.slack.self.id;
};

module.exports = Ferd;
