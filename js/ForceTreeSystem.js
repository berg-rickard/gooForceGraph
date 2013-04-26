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
	
	ForceTreeSystem.prototype.process = function (entities, tpf) {
		this._updateAcceleration(entities);
		for (var i = entities.length - 1; i >= 0; i--) {
			this._updateVelocity(entities[i], tpf);
			this._updatePosition(entities[i], tpf);
		}
	};
	
	ForceTreeSystem.prototype._updateAcceleration = function (entities) {
		for (var i = entities.length -1; i >= 0; i--) {
			entities[i].forceNodeComponent._acceleration.setd(0,0,0);
		}
		this._updateGravity(entities);
		this._updateRepulsion(entities);
		//this._updateAttraction(entities);
	};
	
	ForceTreeSystem.prototype._updateVelocity = function (entity, tpf) {
		var mid = this._middleStorage;
		var acc = entity.forceNodeComponent._acceleration;
		
		var vel = entity.forceNodeComponent._velocity;
		var fric = (1-entity.forceNodeComponent.friction);

		mid.setv(acc).muld(tpf, tpf, tpf);
		vel.addv(mid)
		vel.muld(fric, fric, fric);
	};
	
	ForceTreeSystem.prototype._updatePosition = function (entity, tpf) {
		var mid = this._middleStorage;
		var vel = entity.forceNodeComponent._velocity;
		if (mid.length() > 1e-4) {
			var pos = entity.transformComponent.transform.translation;
			
			mid.setv(vel);
			mid.muld(tpf, tpf, tpf);
			
			pos.addv(mid);
			entity.transformComponent.setUpdated();
		}
	};
	
	
	ForceTreeSystem.prototype._updateGravity = function (entities) {
		var acc, pos, entity, mid = this._middleStorage;
		for (var i = entities.length - 1; i >= 0; i--) {
			entity = entities[i];
			acc = entity.forceNodeComponent._acceleration;
			pos = entity.transformComponent.worldTransform.translation;
			
			mid.setv(pos).invert();
			if (mid.length() > 0.4) {
				mid.normalize();
			}
			mid.muld(this.gravity, this.gravity, this.gravity);
			
			acc.addv(mid);
		}
	};
	
	ForceTreeSystem.prototype._updateRepulsion = function (entities) {
		var acc1, acc2, pos1, pos2, q1, q2, m1, m2, scale, mid = this._middleStorage;
		for (var i = entities.length - 1; i >= 0; i--) {
			for (var j = i - 1; j >= 0; j--) {
				acc1 = entities[i].forceNodeComponent._acceleration;
				acc2 = entities[j].forceNodeComponent._acceleration;
				q1 = entities[i].forceNodeComponent.charge;
				q2 = entities[j].forceNodeComponent.charge;
				m1 = entities[i].forceNodeComponent.mass;
				m2 = entities[j].forceNodeComponent.mass;
				pos1 = entities[i].transformComponent.worldTransform.translation;
				pos2 = entities[j].transformComponent.worldTransform.translation;
				
				mid.setv(pos2).subv(pos1);
				scale = q2*q1 / (m2 * mid.lengthSquared());
				scale *= 1e6 // Apparently a nice stable number
				mid.normalize();
				mid.muld(scale, scale, scale);
				acc2.addv(mid);
				mid.invert().muld(m2/m1, m2/m1, m2/m1);
				acc1.addv(mid);
			}
		}
	};
	
	ForceTreeSystem.prototype._updateAttraction = function (entities) {};
	
	return ForceTreeSystem;
});