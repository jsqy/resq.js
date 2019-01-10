var q = require('q');
module.exports = (data, option = { collection: 'array' }) => (({ map }) => ({
	get: (id, type, relation) =>
		relation ?
			id instanceof Array ?
				q.resolve(map.call(id, id => `/${type}/${id}/${relation}`)) :
				q.resolve(`/${type}/${id}/${relation}`) :
			id instanceof Array ?
				q.resolve(map.call(id, id => data[type][id])) :
				q.resolve(data[type][id])
}))({
	map:
		option.collection == 'array' ?
			Array.prototype.map :
			option.collection == 'object' ?
				mapToObject :
				undefined
});
function mapToObject(f) {
	var object = {};
	for (var i in this)
		object[this[i]] = f(this[i]);
	return object;
}
