var q = require('q');
var resq = require('.');
var user = {};
for (var i = 1; i <= 2; i++)
	user[i] = { id: i, type: 'user' };
var post = {};
post[1] = { id: 1, type: 'post' };
post[1].userId = 1;
var data = { user, post };
module.exports = resq({
	get: (id, type, relation) =>
		relation ?
			id instanceof Array ?
				q.resolve(id.map((v, i) => `/${type}/${v}/${relation}`)) :
				q.resolve(`/${type}/${id}/${relation}`) :
			id instanceof Array ?
				q.resolve(id.map(id => data[type][id])) :
				q.resolve(data[type][id]),
	parseReference: object => (component => ({ id: component[1], type: component[0] }))(object.split('.'))
});
