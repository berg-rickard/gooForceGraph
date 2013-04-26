define(
[
	'goo/entities/systems/System',
	'goo/math/Vector3'
], function(
	System,
	Vector3
) {
	"use strict";
	
	var _defaults = {
		gravity: 1,
	}
	
	function ForceTreeSystem(properties) {
		System.call(this, 'ForceTreeSystem', ['ForceNodeComponent']);

		properties || (properties = {});
		for (var key in _defaults) {
			this[key] = (properties[key] !== undefined) ? properties[key] : _defaults[key];
		}
		
		this.center = properties.center || new Vector3();
		
		this._middleStorage = new Vector3();
	}
	ForceTreeSystem.prototype = Object.create(System.prototype);
	ForceTreeSystem.prototype.constructor = ForceTreeSystem;
	
	/*
	ForceTreeSystem.prototype.inserted = function(entity) {}
	ForceTreeSystem.prototype.deleted = function(entity) {}
	*/
	
	ForceTreeSystem.prototype.process = function(entities, tpf) {
		for (var i = entities.length - 1; i >= 0; i--) {
			this._updateAcceleration(entities[i]);
			this._updateVelocity(entities[i], tpf);
			this._updatePosition(entities[i], tpf);
		}
	}
	
	ForceTreeSystem.prototype._updateAcceleration = function(entity, entities) {
		var mid = this._updateGravity(entity);
		var acc = entity.forceNodeComponent._acceleration;
		acc.setv(mid);
		
		
	}
	
	ForceTreeSystem.prototype._updateVelocity = function(entity, tpf) {
		var mid = this._middleStorage;
		var acc = entity.forceNodeComponent._acceleration;
		
		var vel = entity.forceNodeComponent._velocity;
		var fric = (1-entity.forceNodeComponent.friction);
		/* Performance test *
		vel.data[0] += acc.data[0]*this.gravity;
		vel.data[1] += acc.data[1]*this.gravity;
		vel.data[2] += acc.data[2]*this.gravity;
		/**/

		mid.setv(acc);
		mid.muld(tpf, tpf, tpf);
		vel.addv(mid)
		vel.muld(fric, fric, fric)
	}
	
	ForceTreeSystem.prototype._updatePosition = function(entity, tpf) {
		var mid = this._middleStorage;
		var vel = entity.forceNodeComponent._velocity;
		if(mid.length() > 1e-4) {
			var pos = entity.transformComponent.transform.translation;
			
			mid.setv(vel);
			mid.muld(tpf, tpf, tpf);
			
			pos.addv(mid);
			entity.transformComponent.setUpdated();
		}
	}
	
	ForceTreeSystem.prototype._updateGravity = function(entity) {
		var pos = entity.transformComponent.worldTransform.translation;
		var mid = this._middleStorage;
		
		// Gravity
		mid.setd(0,0,0)
		mid.subv(pos);
		if(mid.length() > 0.4) {
			mid.normalize();
		}
		mid.muld(this.gravity, this.gravity, this.gravity);
		
		return mid;
	}
	
	ForceTreeSystem.prototype._updateRepulsion = function(entity, entities) {
		
	}
	
	return ForceTreeSystem;
});