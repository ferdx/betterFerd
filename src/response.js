var ResponseFactory = function(trigger, message, slack) {
  var match = message.text.match(trigger);
  if (match) return new Response(trigger, message, slack, match);
  else return null;
};
/**
 * [Response description]
 * @constructor
 * @param {regex} trigger [description]
 * @param {message} message [description]
 * @param {slack} slack   [description]
 * @param {match} match   [description]
 */
var Response = function(trigger, message, slack, match) {
  this.message = message;
  this.trigger = trigger;
  this.slack = slack;
  this.match = match;
};

/**
 * Sends response to same channel
 * @param  {String} response - A response
 */
Response.prototype.send = function(response) {
  var channelId = this.message.channel;
  var channel = this.getChannelGroupOrDMByID(channelId);
  channel.send(response);
};

/**
 * Returns Slack User object of sender
 * https://api.slack.com/types/user
 * @return {object} A slack user object
 */
Response.prototype.getMessageSender = function() {
  var userId = this.message.user;
  var user = this.getUser(userId);
  return user;
};

/**
 * Returns User slack object
 * https://api.slack.com/types/user
 * @param  {String} id
 * @return {Object}
 */
Response.prototype.getUser = function(id) {
  return this.slack.getUserByID(id);
};

/**
 * Returns Channel, Group, or IM slack object
 * Use to send appropriate message to right channel
 * https://api.slack.com/types
 * @param  {String} id [description]
 * @return {Object}    [description]
 */
Response.prototype.getChannelGroupOrDMByID = function(id) {
  return this.slack.getChannelGroupOrDMByID(id);
}

/***
 * BUG: UNTESTED
 * @param  {[type]} id [description]
 * @return {[type]}    [description]
 */
Response.prototype.getFile = function(id) {
  return this.slack.getFileByID(id);
};

module.exports = ResponseFactory;
