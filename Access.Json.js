var q = require('q');
module.exports = data => ({
	get: (id, type, relation) =>
		relation ?
			id instanceof Array ?
				q.resolve(id.map((v, i) => `/${type}/${v}/${relation}`)) :
				q.resolve(`/${type}/${id}/${relation}`) :
			id instanceof Array ?
				q.resolve(id.map(id => data[type][id]).map(clone)) :
				q.resolve(data[type][id]).then(clone)
});
function clone(object) {
	return JSON.parse(JSON.stringify(object));
}
