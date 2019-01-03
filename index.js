var q = require('q');
module.exports = config => ({
	get config() { return config; },
	set config(value) { config = value; },
	get: (id, type, relation) =>
		id instanceof Array ?
			config.get(id, type, relation)
				.then(object => id.map(
					object instanceof Array ?
						(id, i) => object[i] :
						id => object[id]
				)) :
			config.get(id, type, relation),
	join: schema =>
		object => {
			var queue = [];
			var pending = 0;
			object = { $: object };
			schema = { $: schema };
			q.resolve().then(() => {
				collect(object, schema);
				flush();
			});
			var deferred = q.defer();
			return deferred.promise.finally(() => {
				object = object.$;
				schema = schema.$;
			}).then(
				() => object
			);
			function collect(object, schema) {
				if (schema instanceof Array) {
					var schema = schema[0];
					if (typeof schema != 'object')
						schema = [schema, {}];
					if (schema instanceof Array && schema.length == 2) {
						var then = schema[1];
						schema = schema[0];
					}
					object.forEach(
						typeof schema == 'string' ?
							(element, i) => {
								enqueue(element, schema, undefined, object, i, then);
							} :
							!schema ?
								(element, i) => {
									var reference = config.parseReference(element);
									enqueue(reference.id, reference.type, undefined, object, i, then);
								} :
								element => {
									collect(element, schema);
								}
					);
				} else if (typeof schema == 'object') {
					forEach(schema, (value, key) => {
						if (typeof value != 'object')
							value = [value, {}];
						if (value instanceof Array && value.length == 2) {
							var then = value[1];
							value = value[0];
						}
						if (typeof value == 'string')
							if (value[0] == '/') {
								var relation = value.substr(1);
								enqueue(object.$id, object.$type, relation, object, key, then);
							} else {
								var a = value.match(/\S+/g);
								if (a[1] == 'as') {
									value = a[0];
									var as = a[2];
								}
								enqueue(object[key], value, undefined, object, as ? as : key, then);
							}
						else if (!value) (reference => {
							enqueue(reference.id, reference.type, undefined, object, key, then);
						})(config.parseReference(object[key]));
						else
							collect(object[key], value);
					});
				}
			}
			function flush() {
				var request = group.call(queue, [
					request => request.relation || "", [
						request => request.type, []
					]
				]);
				var promise = {};
				for (var relation in request) {
					promise[relation] = {};
					for (var type in request[relation]) {
						promise[relation][type] =
							config.get(request[relation][type].map(request => request.id), type, relation);
						pending++;
					}
				}
				forEach(promise, (promise, relation) => {
					forEach(promise, (promise, type) => {
						promise.finally(() => {
							pending--;
						}).then(object => {
							request[relation][type].forEach(
								object instanceof Array ?
									(request, i) => {
										request.object[request.i] = object[i];
									} :
									request => {
										request.object[request.i] = object[request.id];
									}
							);
							request[relation][type].forEach(
								object instanceof Array ?
									(request, i) => {
										object[i].$id = request.id;
										object[i].$type = request.type;
										collect(object[i], request.then);
									} :
									request => {
										object[request.id].$id = request.id;
										object[request.id].$type = request.type;
										collect(object[request.id], request.then);
									}
							);
							flush();
							if (!pending) deferred.resolve();
						}, deferred.reject);
					});
				});
				queue.length = 0;
			}
			function enqueue(id, type, relation, object, i, then) {
				var request = {
					id: id,
					type: type,
					relation: relation,
					object: object,
					i: i,
					then: then
				};
				queue.push(request);
			}
		}
});
function forEach(object, callback) {
	for (var key in object)
		callback(object[key], key);
}
function group(key) {
	if (key instanceof Array) {
		if (!key.length) return this;
		var k = key[0];
		var g = group.call(this, k);
		for (var i in g)
			g[i] = group.call(g[i], key[1]);
		return g;
	} else {
		var object = {};
		for (var i in this) {
			var value = this[i];
			var k = key(value);
			if (!object[k])
				object[k] = [];
			object[k].push(value);
		}
		return object;
	}
}
function all(promise) {
	if (promise.then && typeof promise.then == 'function')
		return promise;
	if (promise instanceof Array)
		return q.all(promise.map(all));
	else {
		var o = {};
		for (var i in promise)
			o[i] = all(promise[i]);
		return q.all(o);
	}
}
