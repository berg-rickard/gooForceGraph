define([

], /** @lends */ function(

) {
	'use strict';
	
	function ForceGraphLink(data) {
		for (var key in ForceGraphLink.defaults) {
			this[key] = (data[key] !== undefined) ? data[key] : ForceGraphLink.defaults[key];
		}
		if(!this.nodeA || !this.nodeB) {
			throw {
				name: 'MissingNodesException',
				message: 'Missing nodes'	
			}
		}
	}

	ForceGraphLink.defaults = {
		length: 30,
		strength: 4e-4,
		nodeA: null,
		nodeB: null
	};
	
	return ForceGraphLink;
});