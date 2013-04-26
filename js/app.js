require({
	paths: {
		// Adjust depending of from where you serve goo
		'goo': '/js/goo'
	}
}, [/*goo*/], function() {
require(
[
	'SimpleWorld',
	'goo/loaders/Loader',
	'goo/loaders/SceneLoader',
	'goo/shapes/ShapeCreator',
	'goo/entities/EntityUtils',
	'goo/renderer/shaders/ShaderLib',
	'goo/renderer/Material',
	'goo/math/MathUtils',
	'ForceTreeComponent',
	'ForceTreeSystem',
	'goo/entities/components/MeshRendererComponent',
	'goo/entities/components/MeshDataComponent',
	'goo/math/Vector3'
], function(
	SimpleWorld,
	Loader,
	SceneLoader,
	ShapeCreator,
	EntityUtils,
	ShaderLib,
	Material,
	MathUtils,
	ForceTreeComponent,
	ForceTreeSystem,
	MeshRendererComponent,
	MeshDataComponent,
	Vector3
) {
	"use strict";

	// Setting up the goo engine and with a camera and camera controls
	var goo = SimpleWorld.createTypicalRunner();
	
	// Force directed tree system
	var fts = new ForceTreeSystem({
		gravity: 0
	});
	goo.world.setSystem(fts);
	
	
	// Sphere setup
	var sphere = ShapeCreator.createSphere(12, 12, 1);
	var mdc = new MeshDataComponent(sphere);
	
	var sphereShader = Material.createShader(ShaderLib.simpleLit, 'simplelit');
	var sphereMat = Material.createMaterial(ShaderLib.simpleLit)
	sphereMat.uniforms.materialAmbient = [0.2,0.2,0.2,1];
	sphereMat.uniforms.materialDiffuse = [1.0,0.2,1.0,1];
		
	
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
	var binderMrc = new MeshRendererComponent();
	var binderMdc = new MeshDataComponent(binder);
	var binderMaterial = Material.createMaterial(ShaderLib.simpleLit);
	binderMaterial.materialAmbient = [.6, .6, .6];
	binderMrc.materials.push(binderMaterial);
	binderMrc.cullMode = 'Never';

	function addConnection(ftc1, ftc2, length, strength) {
		ftc1.connect(ftc2, length, strength);

		// Edge visualizers
		var edgeEntity = goo.world.createEntity();
		edgeEntity.setComponent(binderMrc);
		edgeEntity.setComponent(binderMdc);
		edgeEntity.addToWorld();
	
		ftc1.addCallback(connectionCallback.bind(edgeEntity, ftc2));
	}
	

	// Bunch of spheres
	function rnd() {
		return (Math.random() - .5)*10;
	}
	var ftcs = [];

	var count = 120;
	for (var i = 0; i < count; i++) {
		var entity = goo.world.createEntity();

		var scale = Math.random()*3 + .7;
		entity.transformComponent.transform.translation.setd(rnd(), rnd(), rnd());

		var mrc = new MeshRendererComponent();
		var material = Material.createMaterial(ShaderLib.simpleLit);
		if(i < 1) {
			material.uniforms.materialAmbient = [0,1,0,1];
			entity.transformComponent.transform.scale.setd(5, 5, 5);	
		} else {
			entity.transformComponent.transform.scale.setd(scale, scale, scale);
			material.uniforms.materialAmbient = [ .2, .2, .2, 1];
		}
		material.uniforms.materialDiffuse = [.7*i/count, 0, .7*(1-i/count), 1];
		mrc.materials.push(material);
		entity.setComponent(mrc);
		entity.setComponent(mdc);
		

		// Force tree

		var ftc = new ForceTreeComponent({
			charge: scale * .5e-1,
		});
		entity.setComponent(ftc);
		ftcs.push(ftc);
		if (i === 0) {
			ftc.fixed = Vector3.ZERO;
			ftc.charge = .5;
		} else {
			var length = 10
			var strength = 50;
			if (i < 5) {
				strength = 200;
			}
			addConnection(ftcs[Math.floor(i/5)], ftc, length, strength);
			//material.uniforms.materialAmbient = [1,0,0,1];
		}
		
		// Adding sphere entity
		entity.addToWorld();
	}
	goo.startGameLoop();

	/*	
	document.body.addEventListener('click', function() {
		var entity = goo.world.createEntity();
		var mrc = new MeshRendererComponent();
		var material = Material.createMaterial(ShaderLib.simpleLit);
		material.uniforms.materialAmbient = [.7, .7, .7, 1];
		material.uniforms.materialDiffuse = [ .1, .1, .1, 1];
		mrc.materials.push(material);
		entity.setComponent(mrc);
		entity.setComponent(mdc);
		entity.setComponent(new ForceTreeComponent());
		entity.transformComponent.transform.translation.setd(8*rnd(), 8*rnd(), 8*rnd());
		entity.addToWorld();
	});
	*/
	
});
});