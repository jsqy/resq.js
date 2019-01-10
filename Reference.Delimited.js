module.exports = delimiter => ({
	parse: object =>
		(component => ({ id: component[1], type: component[0] }))
			(object.split(delimiter))
});
