var q = require('q');
require('any-promise/register/q');
var JSONPlaceholder = require('./JSONPlaceholder');
var r = JSONPlaceholder("http://jsonplaceholder.typicode.com");
r.get(1, 'post').then(console.log);
r.get([1, 2], 'user').then(console.log);
q.resolve(1).then(r.join('post')).then(console.log);
q.resolve({ a: 1, b: [1, 2] })
	.then(r.join({
		a: ['post', {
			userId: "user as user",
			x: "/x",
			y: "/y"
		}],
		b: [['user', {
			x: "/x"
		}]]
	}))
	.then(console.log);
q.resolve(["post.1", "user.1"]).then(r.join([])).then(console.log);
