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
	'ForceNodeComponent',
	'ForceTreeSystem',
	'goo/entities/components/MeshRendererComponent',
	'goo/entities/components/MeshDataComponent'
], function(
	SimpleWorld,
	Loader,
	SceneLoader,
	ShapeCreator,
	EntityUtils,
	ShaderLib,
	Material,
	MathUtils,
	ForceNodeComponent,
	ForceTreeSystem,
	MeshRendererComponent,
	MeshDataComponent
) {
	"use strict";

	// Setting up the goo engine and with a camera and camera controls
	var goo = SimpleWorld.createTypicalRunner();


	// A plane
	var plane = ShapeCreator.createQuad(50, 50, 1, 1);
	var planeEntity = EntityUtils.createTypicalEntity(goo.world, plane);
	
	var planeMat = Material.createMaterial(ShaderLib.simpleColored);
	planeMat.uniforms.color = [0, 0.3, 0.3];
	planeEntity.meshRendererComponent.materials.push(planeMat);
	planeEntity.transformComponent.transform.translation.y = -5;
	planeEntity.transformComponent.transform.rotation.rotateX(-90*MathUtils.DEG_TO_RAD);
	
	planeEntity.addToWorld();
	
	// Force directed tree system
	var fts = new ForceTreeSystem({
		gravity: 350
	});
	goo.world.setSystem(fts);
	
	
	// Sphere setup
	var sphere = ShapeCreator.createSphere(12, 12, 1);
	var mdc = new MeshDataComponent(sphere);
	
	var sphereMat = Material.createMaterial(ShaderLib.simpleLit)
	var mrc = new MeshRendererComponent();
	mrc.materials.push(sphereMat);
	
	// Bunch of spheres
	for (var i = 0; i < 10; i++) {
		var entity = goo.world.createEntity();
		entity.setComponent(mrc);
		entity.setComponent(mdc);
		entity.setComponent(new ForceNodeComponent({
			mass: 1.2,
			friction: 0.1
		}));
		entity.transformComponent.transform.translation.setd(Math.random()*10, Math.random()*10, Math.random()*10);
		entity.addToWorld();
	}
	console.log(fts);
	
	
	/*
	var clonedSphere = EntityUtils.clone(goo.world, sphereEntity);
	clonedSphere.transformComponent.transform.translation.setd(-5, -5, 5);
	clonedSphere.addToWorld();
	*/
	var otherSphere = EntityUtils.createTypicalEntity(goo.world, sphere);
	otherSphere.meshRendererComponent.materials.push(sphereMat);
	otherSphere.transformComponent.transform.translation.setd(-5,5,5);
	otherSphere.setComponent(new ForceNodeComponent({
		mass: 1.2,
		friction: 0.1
	}));
	otherSphere.addToWorld();
	
	
});
});