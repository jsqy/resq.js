var q = require('q');
var Processor = require('./Processor');
module.exports = ({ access, batch, reference }) => ({
	get access() { return access; },
	set access(value) { access = value; },
	get batch() { return batch; },
	set batch(value) { batch = value; },
	get reference() { return reference; },
	set reference(value) { reference = value; },
	join: schema =>
		object => {
			var processor = new Processor({ access, batch });
			var objectrequest = new Map();
			object = { $: object };
			schema = { $: schema };
			q.resolve().then(() => {
				collect(object, schema);
				flush();
				if (!processor.pending.size) deferred.resolve();
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
					if (typeof schema == 'function')
						value = value(schema);
					object.forEach(
						typeof schema == 'string' ?
							schema.startsWith('/') ?
								(element, i) => {
									var [, type, id, relation] = element.split('/');
									processor.enqueue(id, type, relation, object, i, then);
								} : schema.startsWith('./') ?
									(element, i) => {
										var relation = element.substr(2);
										processor.enqueue(objectrequest[object].id, objectrequest[object].type, relation, object, i, then);
									} :
									(element, i) => {
										processor.enqueue(element, schema, undefined, object, i, then);
									} :
							!schema ?
								(element, i) => {
									var r = reference.parse(element);
									processor.enqueue(r.id, r.type, undefined, object, i, then);
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
								processor.enqueue(id, type, relation, object, key, then);
							} else if (value.startsWith('./')) {
								var relation = value.substr(2);
								processor.enqueue(objectrequest[object].id, objectrequest[object].type, relation, object, key, then);
							} else
								processor.enqueue(object[key], value, undefined, object, key, then);
						else if (!value) (reference => {
							processor.enqueue(reference.id, reference.type, undefined, object, key, then);
						})(reference.parse(object[key]));
						else
							collect(object[key], value);
					});
				}
			}
			function flush() {
				var promise = processor.flush();
				promise.forEach(promise => {
					promise.request.forEach(
						request => {
							request.object[request.i] = promise;
						}
					);
					promise.then(object => {
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
						if (!processor.pending.size) deferred.resolve();
					}, e => {
						deferred.reject(e);
					});
				});
				deferred.notify();
			}
		}
});
function forEach(object, callback) {
	for (var key in object)
		callback(object[key], key);
}
