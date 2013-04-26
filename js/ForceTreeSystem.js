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
		System.call(this, 'ForceTreeSystem', ['ForceTreeComponent']);

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
		tpf /= 5;
		for (var j = 0; j < 5; j++) {
			this._updateAcceleration(entities);
			for (var i = entities.length - 1; i >= 0; i--) {
				if(!entities[i].forceTreeComponent.isEdge) {
					this._updateVelocity(entities[i], tpf);
				}
				this._updatePosition(entities[i], tpf);
			}
		}
	};
	
	ForceTreeSystem.prototype._updateAcceleration = function (entities) {
		for (var i = entities.length -1; i >= 0; i--) {
			entities[i].forceTreeComponent._acceleration.setd(0,0,0);
		}
		this._updateGravity(entities);
		this._updateRepulsion(entities);
		this._updateAttraction(entities);
	};
	
	ForceTreeSystem.prototype._updateVelocity = function (entity, tpf) {
		var mid = this._middleStorage;
		var acc = entity.forceTreeComponent._acceleration;
		
		var vel = entity.forceTreeComponent._velocity;
		var fric = (1-entity.forceTreeComponent.friction);

		mid.setv(acc).muld(tpf, tpf, tpf);
		vel.addv(mid)
		vel.muld(fric, fric, fric);
	};
	
	ForceTreeSystem.prototype._updatePosition = function (entity, tpf) {
		var mid = this._middleStorage;
		var vel = entity.forceTreeComponent._velocity;
		if (mid.length() > 1e-4) {
			var pos = entity.transformComponent.transform.translation;
			
			mid.setv(vel);
			mid.muld(tpf, tpf, tpf);
			
			pos.addv(mid);
			entity.transformComponent.updateTransform();
			entity.transformComponent.updateWorldTransform();
		}
	};
	
	
	ForceTreeSystem.prototype._updateGravity = function (entities) {
		var acc, pos, entity, mid = this._middleStorage;
		for (var i = entities.length - 1; i >= 0; i--) {
			if (entities[i].forceTreeComponent.isEdge) continue;
			
			entity = entities[i];
			acc = entity.forceTreeComponent._acceleration;
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
		var acc1, acc2, pos1, pos2, q1, q2, m1, m2, force, mid = this._middleStorage;
		for (var i = entities.length - 1; i >= 0; i--) {
			if (entities[i].forceTreeComponent.isEdge) continue;
			for (var j = i - 1; j >= 0; j--) {
				if (entities[j].forceTreeComponent.isEdge) continue;
				
				acc1 = entities[i].forceTreeComponent._acceleration;
				acc2 = entities[j].forceTreeComponent._acceleration;
				q1 = entities[i].forceTreeComponent.charge;
				q2 = entities[j].forceTreeComponent.charge;
				m1 = entities[i].forceTreeComponent.mass;
				m2 = entities[j].forceTreeComponent.mass;
				pos1 = entities[i].transformComponent.worldTransform.translation;
				pos2 = entities[j].transformComponent.worldTransform.translation;
				
				mid.setv(pos2).subv(pos1);
				force = q2*q1 / mid.lengthSquared();
				force *= 1e6 / m2 // Apparently a nice stable number

				mid.normalize();
				mid.muld(force, force, force);
				acc2.addv(mid);
				mid.invert().muld(m2/m1, m2/m1, m2/m1);
				acc1.addv(mid);
			}
		}
	};
	
	ForceTreeSystem.prototype._updateAttraction = function (entities) {
		var ftc;
		for(var i = entities.length - 1; i >= 0; i--) {
			ftc = entities[i].forceTreeComponent;
			if(ftc && ftc.sibling) {
				ftc.sibling.siblingPos = entities[i].transformComponent.transform.translation;
			}
		}
	
		var m1, m2, acc1, acc2, pos1, pos2, force, ftc, mid = this._middleStorage;
		for (var i = entities.length - 1; i >= 0; i--) {
			ftc = entities[i].forceTreeComponent;
			if (ftc.sibling) {
				m1 = entities[i].forceTreeComponent.mass;
				acc1 = ftc._acceleration;
				pos1 = entities[i].transformComponent.worldTransform.translation;
				pos2 = ftc.siblingPos;
				
				mid.setv(pos1).subv(pos2);
				force = (ftc.edgeLength - mid.length()) * ftc.edgeStrength;
				force /= m1;

				mid.normalize().muld(force, force, force);
				acc1.addv(mid);
			}
		}
	};
	
	return ForceTreeSystem;
});