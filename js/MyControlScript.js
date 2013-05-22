// REVIEW: consider renaming this file to MyCamControlScript

define(
[
	'goo/scripts/OrbitCamControlScript',
	'goo/math/Vector3'
], function(
	OrbitCamControlScript,
	Vector3,
	MathUtils
) {
	function MyControlScript(properties) {
		OrbitCamControlScript.call(this, properties);
		this.goingToLookAt = new Vector3().copy(this.lookAtPoint);
		this.middleStorage = new Vector3();
	}
	MyControlScript.prototype = Object.create(OrbitCamControlScript.prototype);
	MyControlScript.prototype.constuctor = MyControlScript;
	
	MyControlScript.prototype.run = function(entity) {
		if(!this.goingToLookAt.equals(this.lookAtPoint)) {
			var delta = entity._world.tpf * 3;
			var mid = this.middleStorage;
			// REVIEW: add and use a scale method instead.
			mid.setv(this.goingToLookAt).subv(this.lookAtPoint).muld(delta,delta,delta);
			this.lookAtPoint.addv(mid);
			this.dirty = true;
		}
		OrbitCamControlScript.prototype.run.call(this, entity);
	}
	
	
	return MyControlScript;
});