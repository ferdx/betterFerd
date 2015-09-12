var Slack = require('slack-client');
var rx = require('rx');
var Response = require('./response');

/**
 * TODO: FIGURE OUT HOW TO DESTROY OBSERVABLES
 * BUG: OBSERVABLES MUST BE EXPLICITLY DESTROYED. MEMORY LEAK!
 */

/**
 * A modular Slack Bot.
 * @constructor
 * @param {string} apiToken Slack's Bot Integration API Token
 */
var Ferd = function(apiToken) {
  this.slack = new Slack(apiToken, true, true);
  this.messages = null;
  this.name = null;
  this.id = null;
};

/**
 * Opens WebSocket with Slack's Real-time Messaging API
 */
Ferd.prototype.login = function() {
  var self = this;
  this.slack.on('open', () => self.setUp() );
  this.slack.on('error', (reason, code) => console.log('socket error: reason ' + reason + ', code ' + code) );
  this.slack.login();
  this.messages = this.createMessageStream();
};

/**
 * Closes WebSocket with Slack's Real-time Messaging API
 */
Ferd.prototype.logout = function() {
  this.slack.disconnect();
  // destroy all observables created from this.messages
};

/**
 * Inject a module into Ferd
 * @param {module} ferdModule A module to inject into Ferd
 * `ferd.addModule(require('./ferd_modules/yo.js'))`
 */
Ferd.prototype.addModule = function(ferdModule) {
  ferdModule(this);
};

/**
 * Inject modules into Ferd
 * @param {module[]} ferdModules An array of modules to inject into Ferd
 * i.e. `ferd.addModules([require('ferd-bart'), require('./ferd_modules/yo.js'), ...])`
 */
Ferd.prototype.addModules = function(ferdModules) {
  var self = this;
  ferdModules.forEach(function(module) {
    module(self);
  });
};

/**
 * Listen to message stream for `capture` to trigger, then calls `callback`.
 * @param  {regex}   capture - regex to trigger callback on
 * @param  {function} callback - callback with response object passed in
 * @return {observable} - WHAT IS AN OBSERVABLE?
 */
Ferd.prototype.listen = function(capture, callback) {
  return this.hear(function(message) {
    return true;
  }, capture, callback);
};

/**
 * Listens to message stream for ferd's name and `capture` to trigger, then calls `callback`
 * @param  {regex}   capture - regex to trigger callback on
 * @param  {function} callback - callback with response object passed in
 * @return {observable} - Are observables puppies?
 */
Ferd.prototype.respond = function(capture, callback) {
  var self = this;
  return this.hear(function(message) {
    return message.text.match(new RegExp(self.name, 'i')) ||
      message.text.match(new RegExp('<' + self.id + '>', 'i'));
  }, capture, callback);
};

/**
 * Listens to message stream for `filter` to return true and `capture` to trigger, then calls `callback`
 * @param {function} filter - A function that returns true or false. Takes in message.
 * @param  {regex}   capture - regex to trigger callback on
 * @param  {function} callback - callback with response object passed in
 * @return {disposable} - More reactive shenanigans.
 */
Ferd.prototype.hear = function(filter, capture, callback) {
  var self = this;
  var slack = this.slack;
  var messages = this.messages
    .filter(m => filter(m) && m.text.match(capture))

  var disposable = messages
    .subscribe(function(message) {
      // console.log(message.text);
      var response = Response(capture, message, slack)
      callback(response);
    });

  return disposable;
};

/**
 * Sets up a message stream
 * @private
 * @return {observable} - Message Stream
 */
Ferd.prototype.createMessageStream = function() {
  var messages = rx.Observable.fromEvent(this.slack, 'message')
    .where(e => e.type === 'message')
    // .map(e => new Message(e));
  return messages;
};

/**
 * Bootstraps Ferd identity
 * @private
 */
Ferd.prototype.setUp = function() {
  this.name = this.slack.self.name;
  this.id = this.slack.self.id;
};

module.exports = Ferd;
