var q = require('q');
module.exports = ({ access, reference }) => ({
	get access() { return access; },
	set access(value) { access = value; },
	get reference() { return reference; },
	set reference(value) { reference = value; },
	join: schema =>
		object => {
			var queue = [];
			var objectrequest = new Map();
			var pending = new Set();
			object = { $: object };
			schema = { $: schema };
			q.resolve().then(() => {
				collect(object, schema);
				flush();
			});
			var deferred = q.defer();
			var promise = deferred.promise.then(() => object.$);
			Object.defineProperty(promise, '$', { get: () => object.$ });
			Object.defineProperty(promise, 'pending', { get: () => pending });
			return promise;
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
									var r = reference.parse(element);
									enqueue(r.id, r.type, undefined, object, i, then);
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
						if (typeof value == 'function')
							value = value(object);
						if (typeof value == 'string')
							if (value.startsWith('/')) {
								var [, type, id, relation] = value.split('/');
								enqueue(id, type, relation, object, key, then);
							} else if (value.startsWith('./')) {
								var relation = value.substr(2);
								enqueue(objectrequest[object].id, objectrequest[object].type, relation, object, key, then);
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
						})(reference.parse(object[key]));
						else
							collect(object[key], value);
					});
				}
			}
			function flush() {
				var promise = [];
				for (var [batch, request] of access.batch(queue)) {
					var p = access.get(batch);
					promise.push(p);
					p.batch = batch;
					p.request = request;
					pending.add(p);
				}
				promise.forEach(promise => {
					promise.request.forEach(
						request => {
							request.object[request.i] = promise;
						}
					);
					promise.then(object => {
						pending.delete(promise);
						promise.request.forEach(
							object instanceof Array ?
								(request, i) => {
									request.object[request.i] = object[i];
								} :
								request => {
									request.object[request.i] = object[request.id];
								}
						);
						promise.request.forEach(
							object instanceof Array ?
								(request, i) => {
									objectrequest[object[i]] = request;
									collect(object[i], request.then);
								} :
								request => {
									objectrequest[object[request.id]] = request;
									collect(object[request.id], request.then);
								}
						);
						flush();
						if (!pending.size) deferred.resolve();
					}, e => {
						pending.delete(promise);
						deferred.reject(e);
					});
				});
				queue.length = 0;
				deferred.notify();
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
