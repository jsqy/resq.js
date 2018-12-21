var q = require('q');
var request = require('request-promise-any');
var request = request.defaults({ json: true });
var resq = require('.');
module.exports = resq({
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
