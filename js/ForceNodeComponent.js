define(
[
	'goo/entities/components/Component',
	'goo/math/Vector3'
], function(
	Component,
	Vector3
) {
	"use strict";
	
	var _defaults = {
		friction: 0.05,
		charge: 0.0001,
		mass: 0.1
	};
	
	function ForceNodeComponent(properties) {
		Component.call(this);
		this.type = 'ForceNodeComponent';

		properties || (properties = {});
		for (var key in _defaults) {
			this[key] = (properties[key] !== undefined) ? properties[key] : _defaults[key];
		}
		
		this._acceleration = new Vector3();
		this._velocity = new Vector3();
	}
	
	ForceNodeComponent.prototype = Object.create(Component.prototype);
	ForceNodeComponent.prototype.constructor = ForceNodeComponent;
	
	
	
	return ForceNodeComponent;
});