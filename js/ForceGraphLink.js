define([

], /** @lends */ function(

) {
	'use strict';
	
	var defaults = {
		length: 50,
		strength: 10,
		nodeA: null,
		nodeB: null
	}
	
	function ForceGraphLink(data, mapping) {
		for (var key in defaults) {
			this[key] = (data[mapping[key]] !== undefined) ? data[mapping[key]] : defaults[key];
		}
		if(!this.nodeA || !this.nodeB) {
			throw {
				name: 'MissingNodesException',
				message: 'Missing nodes'	
			}
		}
	}

	ForceGraphLink.defaultMapping = {
		nodeA: 'a',
		nodeB: 'b',
		length: 'length',
		strength: 'strength'
	};
	
	return ForceGraphLink;
});