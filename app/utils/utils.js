/* jshint node:true */
'use strict';

var utils = {
    /**
     * Helper method that resolves an param value based on whether or not the param
     * is a generator. If the param is an array, each param will in turn be resolved
     * recursively.
     *
     * @module utils
     * @method resolve
     * @param {Object} param The parameter to resolve
     */
    resolve: function(param) {
        if(param instanceof Array) {
            var result = [];
            param.forEach(function(item) {
                result.push(utils.resolve(item));
            });

            return result;
        } else if(!param || typeof param.generate !== 'function') {
            return param;
        }
        return param.generate();
    }
};

module.exports = utils;
