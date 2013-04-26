define([
	'goo/entities/GooRunner',
	'goo/renderer/Camera',
	'goo/entities/components/CameraComponent',
	'goo/entities/components/ScriptComponent',
	'goo/scripts/OrbitCamControlScript',
	'goo/math/MathUtils',
	'goo/math/Vector3',
	'goo/loaders/Loader',
	'goo/loaders/ScriptLoader',
	'goo/entities/components/LightComponent',
	'goo/renderer/light/PointLight'
],
function(
	GooRunner,
	Camera,
	CameraComponent,
	ScriptComponent,
	OrbitCamControlScript,
	MathUtils,
	Vector3,
	Loader,
	ScriptLoader,
	LightComponent,
	PointLight
) {
	SimpleWorld = {};
	SimpleWorld.createTypicalRunner = function() {
		var goo = new GooRunner({
			showStats: true,
			manuallyStartGameLoop: true
		});

		// DOM
		goo.renderer.domElement.id = "goo";
		document.body.appendChild(goo.renderer.domElement);
		goo.renderer.setClearColor(0.0,0.0,0.0,1.0);

		// Light
		var lightEntity = goo.world.createEntity('LightEntity');
		lightEntity.setComponent(new LightComponent(new PointLight()));
		lightEntity.transformComponent.transform.translation.setd(-100,200,400);
		lightEntity.addToWorld();

		// Camera
		var cameraEntity = goo.world.createEntity("CameraEntity");
		cameraEntity.setComponent(new CameraComponent(new Camera(45, 1, 1e-4, 10000)));
		cameraEntity.addToWorld();

		// Camera control
		var scriptComponent = new ScriptComponent();

		/* Use orbitcam */
		scriptComponent.scripts.push(new OrbitCamControlScript({
			spherical: new Vector3(150, 70*MathUtils.DEG_TO_RAD, 20*MathUtils.DEG_TO_RAD),
			baseDistance: 150 / 4,
			domElement: goo.renderer.domElement
		}));
		cameraEntity.setComponent(scriptComponent);

		return goo;
	};

	return SimpleWorld;

});