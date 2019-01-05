var q = require('q');
var resq = require('.');
module.exports = data => resq({
	get: (id, type, relation) =>
		relation ?
			id instanceof Array ?
				q.resolve(id.map((v, i) => `/${type}/${v}/${relation}`)) :
				q.resolve(`/${type}/${id}/${relation}`) :
			id instanceof Array ?
				q.resolve((() => {
					var object = {};
					for (var i in id)
						object[id[i]] = data[type][id[i]];
					return object;
				})()) :
				q.resolve(data[type][id]),
	parseReference: object => (component => ({ id: component[1], type: component[0] }))(object.split('.'))
});
