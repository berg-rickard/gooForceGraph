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
		friction: 0.02,
		charge: 1e-1,
		mass: 1
	};
	
	var _edgeDefaults = {
		strength: 50,
		length: 10,
	};
	
	function ForceTreeComponent(properties) {
		Component.call(this);
		this.type = 'ForceTreeComponent';

		properties || (properties = {});
		
		for (var key in _defaults) {
			this[key] = (properties[key] !== undefined) ? properties[key] : _defaults[key];
		}
		
		this._acceleration = new Vector3();
		this._velocity = new Vector3();
		this._callbacks = [];
		this._connections = [];
		if (properties.gravity) {
			this.gravity = properties.gravity;
		}
	}
	
	ForceTreeComponent.prototype = Object.create(Component.prototype);
	ForceTreeComponent.prototype.constructor = ForceTreeComponent;
	
	ForceTreeComponent.prototype.connect = function(ftc, length, strength) {
		if(ftc === this) {
			console.error('You cant be your own sibling');
			return;
		}
		for (var i = 0; i < this._connections.length; i++) {
			if(this._connections[i].node === ftc) {
				console.error('The connection already exists');
				return;
			}
		}
		this._connections.push({
			length: length || _edgeDefaults.length,
			strength: strength || _edgeDefaults.length,
			node: ftc
		});
		ftc._connections.push({
			length: length || _edgeDefaults.length,
			strength: strength || _edgeDefaults.length,
			node: this
		});
	};
	ForceTreeComponent.prototype.addCallback = function(callback) {
		this._callbacks.push(callback);
	}
	
	
	return ForceTreeComponent;
});