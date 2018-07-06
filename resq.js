angular.module('resq', [])
	.service('resq', function () {
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
				}
			};
		};
	});
