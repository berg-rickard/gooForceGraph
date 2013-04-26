define(
[
	'goo/entities/components/Component',
	'goo/math/Vector3'
], function(
	Component,
	Vector3
) {
	"use strict";
	
	var _nodeDefaults = {
		friction: 0.02,
		charge: 1e-3,
		mass: 0.1
	};
	
	var _edgeDefaults = {
		strength: 10,
		length: 0.3,
	};
	
	function ForceTreeComponent(properties) {
		Component.call(this);
		this.type = 'ForceTreeComponent';

		properties || (properties = {});
		var _defaults;
		if(properties.type == 'edge') {
			this.isEdge = true;
			this.nodes = properties.nodes;
			
			_defaults = _edgeDefaults;
		} else {
			this.isEdge = false;
			_defaults = _nodeDefaults;
		}
		
		for (var key in _defaults) {
			this[key] = (properties[key] !== undefined) ? properties[key] : _defaults[key];
		}
		
		this._acceleration = new Vector3();
		this._velocity = new Vector3();
	}
	
	ForceTreeComponent.prototype = Object.create(Component.prototype);
	ForceTreeComponent.prototype.constructor = ForceTreeComponent;
	
	ForceTreeComponent.prototype.connect = function(ftc, length, strength) {
		if(ftc === this) {
			console.warn('You cant be your own sibling');
			return;
		}
		this.sibling = ftc;
		ftc.sibling = this;
		
		this.edgeLength = ftc.edgeLength = length || _edgeDefaults.length;
		this.edgeStrength = ftc.edgeStrength = strength || _edgeDefaults.strength;
	};
	
	
	return ForceTreeComponent;
});