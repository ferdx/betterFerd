/**
 * ResponseFactory
 *
 * @description The factory that builds the response
 * @param {[type]} 
 * @param {[type]} 
 * @param {[type]} 
 * @return {[type]} [description]
 */
var ResponseFactory = function(trigger, incomingMessage, slack) {
  var match = incomingMessage.text.match(trigger);

  if (match) {
    return new Response(trigger, incomingMessage, slack, match);
  } else {
    return null;
  }
};

/**
 * Response
 * 
 * @constructor
 * @description The Response class. Returns nothing.
 * @param {regex} trigger [description]
 * @param {message} message [description]
 * @param {slack} slack [description]
 * @param {match} match [description]
 */
var Response = function(trigger, incomingMessage, slack, match) {
  this.incomingMessage = incomingMessage;
  this.trigger = trigger;
  this.slack = slack;
  this.match = match;
};

/**
 * Response.prototype.send
 *
 * @description Sends a message to same channel in which the incoming message
 *   was captured.
 * @param {Object} outgoingMessage The message to send back
 * @return {Object} The message object
 */
Response.prototype.send = function(outgoingMessage) {
  var channelId = this.incomingMessage.channel;
  var channel = this.getChannelGroupOrDMByID(channelId);
  var m = channel.send(outgoingMessage);
  return m;
};

/**
 * Response.prototype.updateMessage
 *
 * @description Updates a message with a new string. Returns nothing.
 * @param {Object} message The message object
 * @param {String} string The new message to replace the old
 */
Response.prototype.updateMessage = function(message, string) {
  if (message.ts) {
    message.updateMessage(string);
  } else {
    Object.observe(message, function(changes) {
      message.updateMessage(string);
      Object.unobserve(message);
    }, ['add']);
  }
};

/**
 * Response.prototype.postMessage
 * 
 * @description Posts message to same channel. Returns nothing.
 * @param {Object} outgoingMessage A message object
 */
Response.prototype.postMessage = function(outgoingMessage) {
  var channelId = this.incomingMessage.channel;
  var channel = this.getChannelGroupOrDMByID(channelId);
  channel.postMessage(outgoingMessage);
};

/**
 * Response.prototype.sendDirectMessage
 *
 * @description Sends a direct message to a user. Returns nothing.
 * @param {Object} outgoingMessage The message to send back.
 */
Response.prototype.sendDirectMessage = function(outgoingMessage) {
  var username = this.getMessageSender().name;
  var dmChannel = this.getDMByName(username);
  dmChannel.send(outgoingMessage);
};

/**
 * Response.prototype.getMessageSender
 * 
 * @description Returns Slack user object of sender. Visit the Slack API to see
 *   more about user types - https://api.slack.com/types/user
 * @return {Object} A slack user object
 */
Response.prototype.getMessageSender = function() {
  var userId = this.incomingMessage.user;
  var user = this.getUser(userId);
  return user;
};

/**
 * Response.prototype.getUser
 *
 * @description Returns Slack user object. Visit the Slack API to see more about
 *   user types - https://api.slack.com/types/user
 * @param {String} id The ID of the user
 * @return {Object} Slack user object
 */
Response.prototype.getUser = function(id) {
  return this.slack.getUserByID(id);
};

/**
 * Response.prototype.getDMByName
 *
 * @description Gets a direct message channel by username, and is used to send
 *   IM message types to the right direct message channel. Visit the Slack API
 *   to see more about message types - https://api.slack.com/types
 * @param {String} name The name (username) of the DM's owner
 * @return {Object} Slack message object
 */
Response.prototype.getDMByName = function(name) {
  return this.slack.getDMByName(name);
};

/**
 * Response.prototype.getChannelGroupOrDMByID
 * 
 * @description Returns Channel, Group, or IM slack object. Use to send
 *   appropriate message to right channel. Visit the Slack API to see more about
 *   message types - https://api.slack.com/types
 * @param  {String} id An ID of a message type
 * @return {Object} Slack message object
 */
Response.prototype.getChannelGroupOrDMByID = function(id) {
  return this.slack.getChannelGroupOrDMByID(id);
};

/***
 * BUG: UNTESTED
 * @param  {[type]} id [description]
 * @return {[type]}    [description]
 */
Response.prototype.getFile = function(id) {
  return this.slack.getFileByID(id);
};

module.exports = ResponseFactory;
