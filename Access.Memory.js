var q = require('q');
module.exports = (data, option = {}) => (({ map, transform }) => ({
	get: (id, type, relation) =>
		relation ?
			id instanceof Array ?
				q.resolve(map.call(id, id => `/${type}/${id}/${relation}`)) :
				q.resolve(`/${type}/${id}/${relation}`) :
			id instanceof Array ?
				q.resolve(map.call(id, id => transform(data[type][id]))) :
				q.resolve(transform(data[type][id]))
}))({
	map:
		option.collection ?
			option.collection == 'array' ?
				Array.prototype.map :
				option.collection == 'object' ?
					mapToObject :
					undefined :
			Array.prototype.map,
	transform:
		option.clone ? clone : identity
});
function mapToObject(f) {
	var object = {};
	for (var i in this)
		object[this[i]] = f(this[i]);
	return object;
}
function clone(object) {
	return JSON.parse(JSON.stringify(object));
}
function identity(object) {
	return object;
}
