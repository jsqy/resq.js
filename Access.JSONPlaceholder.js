var q = require('q');
var request = require('request-promise-any');
var request = request.defaults({ json: true });
module.exports = endpoint => ({
	get: (id, type, relation) =>
		relation ?
			id instanceof Array ?
				q.resolve(id.map((v, i) => `/${type}/${v}/${relation}`)) :
				q.resolve(`/${type}/${id}/${relation}`) :
			id instanceof Array ?
				request.get(`${endpoint}/${type}s?${id.map(id => `id=${id}`).join('&')}`).promise() :
				request.get(`${endpoint}/${type}s/${id}`).promise()
});
