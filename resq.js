angular.module('resq', [])
	.service('resq', function ($q) {
		return function (config) {
			return {
				get: function (id, type) {
					return id instanceof Array ?
						config.get(id, type)
							.then(function (object) {
								return id.map(
									object instanceof Array ?
										function (id, i) { return object[i]; } :
										function (id) { return object[id]; }
								);
							}) :
						config.get(id, type);
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
								var schema = schema[0];
								object.forEach(
									typeof schema == 'string' ?
										function (element, i) {
											enqueue(element, schema, object, i);
										} :
										angular.isFunction(schema) ?
											function (element, i) {
												var reference = schema(element);
												enqueue(reference.id, reference.type, object, i);
											} :
											function (element) {
												collect(element, schema);
											}
								);
							} else if (angular.isObject(schema))
								angular.forEach(schema, function (value, key) {
									if (typeof value == 'string')
										enqueue(object[key], value, object, key);
									else if (angular.isFunction(value)) {
										var reference = value(object[key]);
										enqueue(reference.id, reference.type, object, key);
									} else
										collect(object[key], value);
								});
						}
						function flush() {
							var request = group.call(queue, function (request) { return request.type; });
							var promise = {};
							for (var type in request)
								promise[type] = config.get(request[type].map(function (request) { return request.id; }), type);
							return $q.all(promise)
								.then(function (object) {
									angular.forEach(object, function (object, type) {
										request[type].forEach(
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
						};
						function enqueue(id, type, object, i) {
							var request = {
								id: id,
								type: type,
								object: object,
								i: i
							};
							queue.push(request);
						};
					};
				}
			};
		};
		function group(key) {
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
	});
