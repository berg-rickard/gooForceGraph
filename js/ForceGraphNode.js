define([
	'goo/math/Vector3',
	'goo/math/Transform'
], /** @lends */ function(
	Vector3,
	Transform
) {
	'use strict';
	
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
	function ForceGraphNode(data) {
		for (var key in ForceGraphNode.defaults) {
			this[key] = (data[key] !== undefined) ? data[key] : ForceGraphNode.defaults[key];
		}
		this._acceleration = new Float32Array(3);
		this._velocity = new Float32Array(3);
		this.position = new Float32Array(3);
		this.position.set([rnd(), rnd(), rnd()]);
		//this.gridIndex = [0,0,0];
	}
	function rnd() {
		return (Math.random()-0.5)*250;
	}


	
	ForceGraphNode.defaults = {
		size: 1.1,
		charge: 5e-1,
		mass: 1e-6,
		friction: 0.03,
		fixed: false,
		color: [1, 1, 1]
	};

	ForceGraphNode.prototype.process = function(tpf) {
		this._updateVelocity(tpf);
		this._updatePosition(tpf);
	};
	
	ForceGraphNode.prototype._updateVelocity = function(tpf) {
		var v = this._velocity;
		var a = this._acceleration;

		v[0] += a[0] * tpf;
		v[1] += a[1] * tpf;
		v[2] += a[2] * tpf;
		
		v[0] *= 1 - this.friction;
		v[1] *= 1 - this.friction;
		v[2] *= 1 - this.friction;
	};
	
	ForceGraphNode.prototype._updatePosition = function(tpf) {
		var p = this.position;
		var v = this._velocity;
		if(!this.fixed) {
			var lenSq = v[0] * v[0] + v[1] * v[1] + v[2] * v[2];
			if(lenSq > 16e-4) {
				p[0] += v[0] * tpf;
				p[1] += v[1] * tpf;
				p[2] += v[2] * tpf;
			}
		}
	};
	
	return ForceGraphNode;
});