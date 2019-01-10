var q = require('q');
module.exports = data => ({
	get: (id, type, relation) =>
		relation ?
			id instanceof Array ?
				q.resolve(id.map((v, i) => `/${type}/${v}/${relation}`)) :
				q.resolve(`/${type}/${id}/${relation}`) :
			id instanceof Array ?
				q.resolve(id.map(id => data[type][id])) :
				q.resolve(data[type][id])
});
