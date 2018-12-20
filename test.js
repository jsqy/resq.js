var q = require('q');
require('any-promise/register/q');
var request = require('request-promise-any');
var request = request.defaults({ json: true });
var resq = require('.');
var r = R();
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
function R() {
	return resq({
		get: (id, type, relation) =>
			relation ?
				id instanceof Array ?
					q.resolve(id.map((v, i) => `/${type}/${v}/${relation}`)) :
					q.resolve(`/${type}/${id}/${relation}`) :
				id instanceof Array ?
					request.get(`http://jsonplaceholder.typicode.com/${type}s?${id.map(id => `id=${id}`).join('&')}`).promise() :
					request.get(`http://jsonplaceholder.typicode.com/${type}s/${id}`).promise(),
		parseReference: object => (component => ({ id: component[1], type: component[0] }))(object.split('.'))
	});
}
