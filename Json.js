var q = require('q');
var resq = require('.');
module.exports = data => resq({
	get: (id, type, relation) =>
		relation ?
			id instanceof Array ?
				q.resolve(id.map((v, i) => `/${type}/${v}/${relation}`)) :
				q.resolve(`/${type}/${id}/${relation}`) :
			id instanceof Array ?
				q.resolve(id.map(id => data[type][id]).map(clone)) :
				q.resolve(data[type][id]).then(clone),
	parseReference: object => (component => ({ id: component[1], type: component[0] }))(object.split('.'))
});
function clone(object) {
	return JSON.parse(JSON.stringify(object));
}
