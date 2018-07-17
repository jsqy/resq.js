angular.module('resq', [])
	.service('resq', function ($q) {
		return function (config) {
			return {
				get: function (id, type, relation) {
					return id instanceof Array ?
						config.get(id, type, relation)
							.then(function (object) {
								return id.map(
									object instanceof Array ?
										function (id, i) { return object[i]; } :
										function (id) { return object[id]; }
								);
							}) :
						config.get(id, type, relation);
				},
				join: function (schema) {
					return function (object) {
						var queue = [];
						object = { $: object };
						schema = { $: schema };
						collect(object, schema);
						return flush().finally(function () {
							object = object.$;
							schema = schema.$;
						}).then(function () {
							return object;
						});
						function collect(object, schema) {
							if (angular.isArray(schema)) {
								if (typeof schema[0] != 'object')
									schema[0] = [schema[0], {}];
								var schema = schema[0];
								if (schema instanceof Array && schema.length == 2)
									schema = schema[0];
								object.forEach(
									typeof schema == 'string' ?
										function (element, i) {
											enqueue(element, schema, undefined, object, i);
										} :
										angular.isFunction(schema) ?
											function (element, i) {
												var reference = schema(element);
												enqueue(reference.id, reference.type, undefined, object, i);
											} :
											function (element) {
												collect(element, schema);
											}
								);
							} else if (angular.isObject(schema)) {
								var reference = schema["reference"];
								if (reference && angular.isFunction(reference))
									var reference = reference(object);
								angular.forEach(schema, function (value, key) {
									if (key == "reference" && angular.isFunction(value)) return;
									if (typeof value != 'object')
										schema[key] = value = [value, {}];
									if (value instanceof Array && value.length == 2)
										value = value[0];
									if (typeof value == 'string')
										if (value[0] == '/') {
											var relation = value.substr(1);
											enqueue(reference.id, reference.type, relation, object, key);
										} else
											enqueue(object[key], value, undefined, object, key);
									else if (angular.isFunction(value)) (function (reference) {
										enqueue(reference.id, reference.type, undefined, object, key);
									})(value(object[key]));
									else
										collect(object[key], value);
								});
							}
						}
						function flush() {
							var request = group.call(queue, [
								function (request) { return request.relation || ""; }, [
									function (request) { return request.type; }, []
								]
							]);
							var promise = {};
							for (var relation in request) {
								promise[relation] = {};
								for (var type in request[relation])
									promise[relation][type] =
										config.get(request[relation][type].map(function (request) { return request.id; }), type, relation);
							}
							return all(promise)
								.then(function (object) {
									angular.forEach(object, function (object, relation) {
										angular.forEach(object, function (object, type) {
											request[relation][type].forEach(
												object instanceof Array ?
													function (request, i) {
														request.object[request.i] = object[i];
													} :
													function (request) {
														request.object[request.i] = object[request.id];
													}
											);
										});
									});
								});
						}
						function enqueue(id, type, relation, object, i) {
							var request = {
								id: id,
								type: type,
								relation: relation,
								object: object,
								i: i
							};
							queue.push(request);
						}
					};
				}
			};
		};
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
			if (promise.then && angular.isFunction(promise.then))
				return promise;
			if (promise instanceof Array)
				return $q.all(promise.map(all));
			else {
				var o = {};
				for (var i in promise)
					o[i] = all(promise[i]);
				return $q.all(o);
			}
		}
	});
