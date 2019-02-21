module.exports = group;
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
