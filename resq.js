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
				},
				join: function (type) {
					var $this = this;
					return function (id) {
						var type0 = type;
						var id0 = id;
						while (typeof type != 'string') {
							for (var i in type) break;
							type = type[i];
							id = id[i];
						}
						return id instanceof Array ?
							$this.get(id, type)
								.then(function (object) {
									if (object instanceof Array)
										for (var i in id)
											id[i] = object[i];
									else
										for (var i in id)
											id[i] = object[id[i]];
									return id0;
								}) :
							$this.get(id, type)
								.then(function (object) {
									if (id == id0)
										return object;
									else {
										type = type0;
										id = id0;
										if (typeof type != 'string')
											for (; ;) {
												for (var i in type) break;
												type = type[i];
												if (typeof type == 'string')
													break;
												id = id[i];
											}
										id[i] = object;
										return id0;
									};
								});
					};
				}
			};
		};
	});
