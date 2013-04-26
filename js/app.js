require({
	paths: {
		// Adjust depending of from where you serve goo
		'goo': '/js/goo'
	}
}, [/*goo*/], function() {
require(
[
	'SimpleWorld',
	'goo/shapes/ShapeCreator',
	'goo/entities/EntityUtils',
	'goo/renderer/shaders/ShaderLib',
	'goo/renderer/Material',
	'ForceTreeComponent',
	'ForceTreeSystem',
	'goo/entities/components/MeshRendererComponent',
	'goo/entities/components/MeshDataComponent',
	'goo/math/Vector3'
], function(
	SimpleWorld,
	ShapeCreator,
	EntityUtils,
	ShaderLib,
	Material,
	ForceTreeComponent,
	ForceTreeSystem,
	MeshRendererComponent,
	MeshDataComponent,
	Vector3
) {
	"use strict";

	// Setting up the goo engine and with a camera and camera controls
	var goo = SimpleWorld.createTypicalRunner();

	function init() {
		// Force directed tree system
		goo.world.setSystem(new ForceTreeSystem({
			//gravity: 10
		}));
		
		var count = 120;
		for(var i = 0; i < count; i++) {
			addSphere(Math.random(), count);
		}
		
		goo.startGameLoop();
	}
	
	var addSphere = (function() {
		// Sphere setup
		var sphere = ShapeCreator.createSphere(12, 12, 1);
		var mdc = new MeshDataComponent(sphere);
		
		var sphereShader = Material.createShader(ShaderLib.simpleLit, 'simplelit');
		var sphereMat = Material.createMaterial(ShaderLib.simpleLit)
		sphereMat.uniforms.materialAmbient = [0.2,0.2,0.2,1];
		sphereMat.uniforms.materialDiffuse = [1.0,0.2,1.0,1];
	
		// Bunch of spheres
		function rnd() {
			return (Math.random() - .5)*10;
		}

		var ftcs = [];
		function addSphere(val, count) {
			var scale = val*3 + .7;

			var entity = goo.world.createEntity();
			entity.transformComponent.transform.translation.setd(rnd(), rnd(), rnd());
	
			var mrc = new MeshRendererComponent();
			var material = Material.createMaterial(ShaderLib.simpleLit);
			material.uniforms.materialDiffuse = [.7*ftcs.length/count, 0, .7*(1-ftcs.length/count), 1];
			mrc.materials.push(material);

			entity.setComponent(mrc);
			entity.setComponent(mdc);

			// Force tree
			var ftc = new ForceTreeComponent({
				charge: scale * .5e-1,
			});
			entity.setComponent(ftc);

			if(ftcs.length === 0) {
				// Style root node
				material.uniforms.materialAmbient = [0,1,0,1];
				entity.transformComponent.transform.scale.setd(5, 5, 5);	

				//ftc.fixed = Vector3.ZERO;
				ftc.charge = .5;
			} else {
				// Style the rest
				entity.transformComponent.transform.scale.setd(scale, scale, scale);
				material.uniforms.materialAmbient = [ .2, .2, .2, 1];

				var length = 10
				var strength = (ftcs.length > 5) ? 50 : 200;
				addConnection(ftcs[Math.floor(ftcs.length/5)], ftc, length, strength);
			}
			
			ftcs.push(ftc);
			entity.addToWorld();
		}
		return addSphere;
	}());
	
	
	var addConnection = (function() {
		var mid = new Vector3();
		function connectionCallback(ftc1, ftc2) {
			if(ftc1 && ftc2) {
				mid.setv(ftc1._pos).addv(ftc2._pos).muld(.5,.5,.5);
				this.transformComponent.transform.translation.setv(mid);
				
				mid.setv(ftc1._pos).subv(ftc2._pos);
				this.transformComponent.transform.rotation.lookAt(mid, Vector3.UNIT_Y);
				this.transformComponent.transform.scale.setd(1, 1, mid.length());
				this.transformComponent.setUpdated();
			}
		}
	
		var binder = ShapeCreator.createBox(.3, .3, 1, 1, 1);
		var binderMdc = new MeshDataComponent(binder);

		var binderMaterial = Material.createMaterial(ShaderLib.simpleLit);
		binderMaterial.materialAmbient = [.6, .6, .6];

		var binderMrc = new MeshRendererComponent();
		binderMrc.materials.push(binderMaterial);
		binderMrc.cullMode = 'Never';
	
		function addConnection(ftc1, ftc2, length, strength) {
			ftc1.connect(ftc2, length, strength);
	
			// Edge visualizers
			var edgeEntity = goo.world.createEntity();
			edgeEntity.setComponent(binderMrc);
			edgeEntity.setComponent(binderMdc);
			edgeEntity.addToWorld();
		
			ftc1.addCallback(connectionCallback.bind(edgeEntity, ftc1, ftc2));
		}
		
		return addConnection;
	}());
	
	init();
});
});