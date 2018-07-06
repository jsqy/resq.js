angular.module('resq', [])
	.service('resq', function () {
		return function (config) {
			return {
				get: function (id, type) {
					return config.get(id, type);
				}
			};
		};
	});
