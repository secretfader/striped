/**
 * Setup
 */
var key      = process.env.STRIPE_KEY
,   assert   = require('assert')
,   striped = require('../');

if (!key) throw new Error('Stripe API key required.');

striped.configure(key);

describe('Stripe JSON', function () {
  describe('Token', function () {
    before(function () {
      this.token = null;
    });

    it('should create a token', function () {
      var self = this;

      return striped.post('/tokens', {
        card: {
          number: 4242424242424242,
          exp_month: 12,
          exp_year: 2014,
          cvc: 123
        }
      }).then(function (token) {
        assert(token.id);
        self.token = token;
      });
    });

    it('should not require a request body', function () {
      var self = this;

      return striped.get('/tokens/:token', {
        params: { token: self.token.id }
      }).then(function (token) {
        assert.equal(token.id, self.token.id);
      });
    });

    it('should prepend / to routes', function () {
      var self = this;

      return striped.get('tokens/:id', {
        params: { id: this.token.id }
      }).then(function (token) {
        assert.equal(token.id, self.token.id);
      });
    });

    it('should support callbacks', function (done) {
      var self = this;

      striped.get('/tokens/:id', {
        params: { id: this.token.id }
      }, function (err, token) {
        if (err) return done(err);

        assert.equal(token.id, self.token.id)
        done();
      });
    });

    it('should return a card number error', function () {
      return striped.post('/tokens', {
        card: {
          number: 123,
          exp_month: 12,
          exp_year: 2014,
          cvc: 123
        }
      }).then(function () {
        throw new Error('WTF?');
      }).catch(function (err) {
        assert(err);
        assert.equal(err.type, 'card_error');
        assert.equal(err.name, 'card_error');
        assert.equal(err.code, 'invalid_number');
        assert.equal(err.param, 'number');
        assert.equal(err.status, 402);
      });
    });
  });
});
