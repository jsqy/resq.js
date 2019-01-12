var q = require('q');
module.exports = (data, option = {}) => (({ map, transform, relate }) => ({
	get: (id, type, relation) =>
		relation ?
			id instanceof Array ?
				q.resolve(map.call(id, id => relate(id, type, relation))) :
				q.resolve(relate(id, type, relation)) :
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
		option.clone ? clone : identity,
	relate:
		(id, type, relation) =>
			relation in data ?
				filterObject.call(
					data[relation],
					object => object[`${type}Id`] == id
				) :
				`/${type}/${id}/${relation}`
});
function mapToObject(f) {
	var object = {};
	for (var i in this)
		object[this[i]] = f(this[i]);
	return object;
}
function filterObject(f) {
	var array = [];
	for (var i in this)
		if (f(this[i]))
			array.push(i);
	return array;
}
function clone(object) {
	return JSON.parse(JSON.stringify(object));
}
function identity(object) {
	return object;
}
