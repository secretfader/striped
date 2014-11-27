var methods = require('methods')
,   request = require('request')
,   Promise = require('bluebird')
,   Striped;

Striped = function () {};

Striped.prototype.configure = function (options) {
  options = options || {};

  if ('string' === typeof options) options = { key: options };

  if (!options.key) {
    throw new Error('Please supply your Stripe API key.');
  }

  this.host    = 'api.stripe.com';
  this.key     = options.key;
  this.version = options.version || 'v1';
};

Striped.prototype.request = function (method, route, data, done) {
  if ('/' !== route[0]) route = '/' + route;

  if (data && data.params) {
    route = Object.keys(data.params).reduce(function (output, key) {
      return output.replace(new RegExp(':' + key, 'g'), data.params[key]);
    }, route);

    delete data.params;
  }

  var self = this
  ,   uri  = ['https://', self.host, '/' + self.version + route].join('');

  var deferred = new Promise(function (resolve, reject) {
    request({
      uri: uri,
      method: method,
      form: data,
      json: true,
      auth: {
        user: self.key
      }
    }, function (err, res, body) {
      if (err || res.statusCode !== 200) {
        var output = body.error
        ,   error  = new Error(output.message);

        error.type   = error.name = output.type;
        error.code   = output.code;
        error.param  = output.param;
        error.status = res.statusCode;

        return reject(error);
      }

      resolve(body);
    })
  });

  if (done) {
    deferred.then(function (result) {
      done(null, result);
    }, done);
  }

  return deferred;
};

methods.forEach(function (method) {
  Striped.prototype[method] = function (route, data, done) {
    if ('function' === typeof data) {
      done = data;
      data = null;
    }

    return this.request(method.toUpperCase(), route, data, done);
  };
});

module.exports = new Striped();
