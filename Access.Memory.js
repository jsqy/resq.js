var q = require('q');
var group = require('./group');
module.exports = (data, option = {}) => (({ map, transform, relate }) => ({
	get: ({ id, type, relation }) =>
		relation ?
			q.resolve(map.call(id, id => relate(id, type, relation))) :
			q.resolve(map.call(id, id => transform(data[type][id]))),
	batch: function* (queue) {
		var request = group.call(queue, [
			request => request.relation || "", [
				request => request.type, []
			]
		]);
		for (var relation in request)
			for (var type in request[relation])
				yield [
					{
						id: request[relation][type].map(request => request.id),
						type,
						relation
					},
					request[relation][type]
				];
	}
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
