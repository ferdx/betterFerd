var Attachment = require('./attachment');
var _ = require('underscore');

_.templateSettings = { interpolate: /\{\{(.+?)\}\}/g };

var Message = function(json) {
  this.json = null;
  this.render = null;
  this.attachments = [];
  this.defaults = {
    persona: {
      name: 'Ferd',
      icon: 'http://i.imgur.com/2rSS5KP.jpg'
    }
  };
};

Message.prototype.template = function(schema) {
  this.render = _.template(schema);
  return this;
};

Message.prototype.text = function(params) {
  this.json.text = this.render(params);
  return this;
};

Message.prototype.as = function(persona) {
  this.json.username = persona.name || this.defaults.persona.name;
  this.json.icon_url = persona.icon || this.defaults.persona.icon;
  return this;
};

Message.prototype.attachments = function() {
  return this.attachments;
};

Message.prototype.attach = function(attachment) {
  // appends an attachment to the message
};

Message.prototype.detach = function() {
  // removes all attachments
};

Message.prototype.user = function() {
  return this.json.user;
};

Message.prototype.channel = function() {
  return this.json.channel;
};
Message.prototype.team = function() {
  return this.json.team;
};
Message.prototype.ts = function() {
  return this.json.ts;
};

module.exports = Message;
