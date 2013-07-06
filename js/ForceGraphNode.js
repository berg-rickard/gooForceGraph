define([
	'goo/math/Vector3',
	'goo/math/Transform'
], /** @lends */ function(
	Vector3,
	Transform
) {
	'use strict';
	
	var defaults = {
		size: 1.1,
		charge: 5e-1,
		mass: 1e-3,
		friction: 0.07,
		fixed: false,
		color: [1, 1, 1]
	};
		
	var vec = new Vector3();
	/**
	 * @class A node in the Force graph
	 * @param {object} data the data to build properties from
	 * @param {object} [mapping] How to map the data object to the forcegraph item properties
	 * @param {string} [mapping.id='id']
	 * @param {string} [mapping.size='size']
	 * @param {string} [mapping.charg='charge']
	 * @param {string} [mapping.mass='mass']
	 */
	function ForceGraphNode(data, mapping) {
		mapping = mapping || ForceGraphNode.defaultMapping;
		for (var key in defaults) {
			this[key] = (data[mapping[key]] !== undefined) ? data[mapping[key]] : defaults[key];
		}
		this._acceleration = new Vector3();
		this._velocity = new Vector3();
		this.transform = new Transform();
		this.transform.translation.setd(rnd(), rnd(), rnd());
	}
	function rnd() {
		return (Math.random()-0.5)*50;
	}


	
	ForceGraphNode.defaultMapping = {
		id: 'id',
		size: 'size',
		charge: 'charge',
		mass: 'mass',
		friction: 'friction',
		fixed: 'fixed',
		color: 'color'
	};

	ForceGraphNode.prototype.process = function(tpf) {
		this._updateVelocity(tpf);
		this._updatePosition(tpf);
	};
	
	ForceGraphNode.prototype._updateVelocity = function(tpf) {
		vec.setv(this._acceleration).scale(tpf);
		this._velocity.addv(vec).scale(1 - this.friction);
	};
	
	ForceGraphNode.prototype._updatePosition = function(tpf) {
		var pos = this.transform.translation;
		if(!this.fixed) {
			if(this._velocity.lengthSquared() > 0.04 * 0.04) {
				vec.setv(this._velocity).scale(tpf);
				pos.addv(vec);
				this.update();
			}
		}
	};
	
	ForceGraphNode.prototype.update = function() {
		this.transform.scale.setd(this.size, this.size, this.size);
		this.transform.update();
	}
	
	return ForceGraphNode;
});