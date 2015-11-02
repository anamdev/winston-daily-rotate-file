'use strict';

var assert = require('assert'),
    winston = require('winston'),
    DailyRotateFile = require('../');

var helpers = exports;

helpers.assertDailyRotateFile = function (transport) {
  assert.instanceOf(transport, DailyRotateFile);
  assert.isFunction(transport.log);
};

helpers.assertFailedTransport = function (transport) {
  return {
    topic: function () {
      var self = this;
      transport.on('error', function(emitErr){
        transport.log('error', 'test message 2', {}, function(logErr, logged){
          self.callback(emitErr, logErr);
        });
      });
      transport.log('error', 'test message');
    },
    "should emit an error": function (emitErr, logErr) {
      assert.instanceOf(emitErr, Error);
      assert.equal(emitErr.code, 'ENOENT');
    },
    "should enter noop failed state": function (emitErr, logErr) {
      assert.instanceOf(logErr, Error);
      assert.equal(transport._failures, transport.maxRetries);
    }
  };
};

helpers.testNpmLevels = function (transport, assertMsg, assertFn) {
  return helpers.testLevels(winston.config.npm.levels, transport, assertMsg, assertFn);
};

helpers.testSyslogLevels = function (transport, assertMsg, assertFn) {
  return helpers.testLevels(winston.config.syslog.levels, transport, assertMsg, assertFn);
};

helpers.testLevels = function (levels, transport, assertMsg, assertFn) {
  var tests = {};

  Object.keys(levels).forEach(function (level) {
    var test = {
      topic: function () {
        transport.log(level, 'test message', {}, this.callback.bind(this, null));
      }
    };

    test[assertMsg] = assertFn;
    tests['with the ' + level + ' level'] = test;
  });

  var metadatatest = {
    topic: function () {
      transport.log('info', 'test message', { metadata: true }, this.callback.bind(this, null));
    }
  };

  metadatatest[assertMsg] = assertFn;
  tests['when passed metadata'] = metadatatest;

  var primmetadatatest = {
    topic: function () {
      transport.log('info', 'test message', 'metadata', this.callback.bind(this, null));
    }
  };

  primmetadatatest[assertMsg] = assertFn;
  tests['when passed primitive metadata'] = primmetadatatest;

  var circmetadata = { };
  circmetadata['metadata'] = circmetadata;

  var circmetadatatest = {
    topic: function () {
      transport.log('info', 'test message', circmetadata, this.callback.bind(this, null));
    }
  };

  circmetadatatest[assertMsg] = assertFn;
  tests['when passed circular metadata'] = circmetadatatest;

  return tests;
};
