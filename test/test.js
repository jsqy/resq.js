var assert = require('assert');
var q = require('q');
var resq = require('..');
var Memory = require('../Access.Memory');
var batch = require('../batch.RelationType');
var Delimited = require('../Reference.Delimited');
var data = require('./data');
var r = resq({ access: Memory(data), batch, reference: Delimited('.') });
it('should join singular', function () {
	return q.resolve(1).then(r.join('post')).then(post => {
		assert.equal(post, data.post[1]);
	});
});
it('should join complex', function () {
	return q.resolve({ a: 1, b: [1, 2] })
		.then(r.join({
			a: ['post', {
				user: $this => `/user/${$this.userId}`,
				x: "./x",
				y: "./y"
			}],
			b: [['user', {
				x: "./x",
				post: ["./post", ['post']]
			}]]
		})).then(object => {
			assert.equal(object.a, data.post[1]);
			assert.equal(object.a.user, data.user[object.a.userId]);
			assert.equal(object.a.x, `/post/1/x`);
			assert.equal(object.a.y, `/post/1/y`);
			assert.equal(object.b[0], data.user[1]);
			assert.equal(object.b[0].x, `/user/1/x`);
			assert.equal(object.b[0].post.length, 1);
			assert.equal(object.b[0].post[0], data.post[1]);
			assert.equal(object.b[1], data.user[2]);
			assert.equal(object.b[1].x, `/user/2/x`);
			assert.equal(object.b[1].post.length, 0);
		});
});
it('should parse reference', function () {
	return q.resolve(["post.1", "user.1"]).then(r.join([])).then(array => {
		assert.equal(array[0], data.post[1]);
		assert.equal(array[1], data.user[1]);
	});
});
