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
	var plane = ShapeCreator.createQuad(500, 500, 1, 1);
	var planeEntity = EntityUtils.createTypicalEntity(goo.world, plane);
	
	var planeMat = Material.createMaterial(ShaderLib.simpleColored);
	planeMat.uniforms.color = [0, 0.3, 0.3];
	planeEntity.meshRendererComponent.materials.push(planeMat);
	planeEntity.transformComponent.transform.translation.y = -5;
	planeEntity.transformComponent.transform.rotation.rotateX(-90*MathUtils.DEG_TO_RAD);
	
	//planeEntity.addToWorld();
	
	// Force directed tree system
	var fts = new ForceTreeSystem({
		gravity: 10
	});
	goo.world.setSystem(fts);
	
	
	// Sphere setup
	var sphere = ShapeCreator.createSphere(12, 12, 0.04);
	var mdc = new MeshDataComponent(sphere);
	
	var sphereMat = Material.createMaterial(ShaderLib.simpleLit)
	sphereMat.uniforms.materialAmbient = [0.2,0.2,0.2,1];
	sphereMat.uniforms.materialDiffuse = [1.0,0.2,1.0,1];
	var mrc = new MeshRendererComponent();
	mrc.materials.push(sphereMat);
	
	function rnd() {
		return (Math.random() - .5)*3
	}
	// Bunch of spheres
	for (var i = 0; i < 200; i++) {
		var entity = goo.world.createEntity();
		entity.setComponent(mrc);
		entity.setComponent(mdc);
		entity.setComponent(new ForceNodeComponent({
		}));
		entity.transformComponent.transform.translation.setd(rnd(), rnd(), rnd());
		entity.addToWorld();
	}
	
	
});
});