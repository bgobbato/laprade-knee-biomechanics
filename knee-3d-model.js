/**
 * 3D Knee Anatomical & Kinematic Engine (Three.js)
 * Implements 3D bones, ligaments, dynamic tension rendering, and 6-DOF kinematics
 * Based on Dr. Robert F. LaPrade & Dr. Jorge Chahla cadaveric data.
 */

window.Knee3DViewer = (function() {
  var container, scene, camera, renderer, controls;
  var femurGroup, tibiaGroup, fibulaGroup, jointSystem;
  var ligamentMeshes = {};
  var caliperGroup, rotationArcGroup, landmarkGroup;
  var isInitialized = false;

  // Material Library
  var boneMaterial, cartilageMaterial, meniscusMaterial;
  var ligamentMaterialIntact, ligamentMaterialStrained, ligamentMaterialTorn;

  // Current kinematic parameters
  var currentFlexion = 0; // degrees
  var currentKinematics = null;

  function init(containerId) {
    container = document.getElementById(containerId);
    if (!container) return;

    var width = container.clientWidth || 800;
    var height = container.clientHeight || 600;

    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e17);
    scene.fog = new THREE.FogExp2(0x0a0e17, 0.002);

    // Camera
    camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
    camera.position.set(-85, 20, 110); // Anterolateral perspective

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI * 0.85;
    controls.minDistance = 40;
    controls.maxDistance = 350;
    controls.target.set(0, 0, 0);

    // Lighting
    setupLighting();

    // Create Materials
    setupMaterials();

    // Build Anatomical Structures
    buildAnatomy();

    // Setup Visual Measurement Aids (Calipers, Rotation arcs)
    setupMeasurementAids();

    // Window Resize Handler
    window.addEventListener("resize", onWindowResize);

    isInitialized = true;
    animate();
  }

  function setupLighting() {
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambientLight);

    // Key Light
    var dirLight1 = new THREE.DirectionalLight(0xe0f2fe, 0.85);
    dirLight1.position.set(-80, 100, 90);
    dirLight1.castShadow = true;
    dirLight1.shadow.mapSize.width = 1024;
    dirLight1.shadow.mapSize.height = 1024;
    scene.add(dirLight1);

    // Rim / Backlight for posterolateral corner highlight
    var dirLight2 = new THREE.DirectionalLight(0x38bdf8, 0.6);
    dirLight2.position.set(70, -40, -80);
    scene.add(dirLight2);

    // Fill Light
    var pointLight = new THREE.PointLight(0x0284c7, 0.6, 200);
    pointLight.position.set(-40, 10, -50);
    scene.add(pointLight);

    // Grid plane
    var gridHelper = new THREE.GridHelper(300, 30, 0x1e293b, 0x0f172a);
    gridHelper.position.y = -75;
    scene.add(gridHelper);
  }

  function setupMaterials() {
    // Bone material (organic ivory with soft specular sheen)
    boneMaterial = new THREE.MeshStandardMaterial({
      color: 0xedebe4,
      roughness: 0.42,
      metalness: 0.08,
      flatShading: false
    });

    // Articular Cartilage (smooth pearlescent white/cyan)
    cartilageMaterial = new THREE.MeshStandardMaterial({
      color: 0xe2f3f5,
      roughness: 0.15,
      metalness: 0.05,
      transparent: true,
      opacity: 0.95
    });

    // Meniscus (fibrocartilage dark ivory)
    meniscusMaterial = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.5,
      metalness: 0.02
    });

    // Ligament default materials
    ligamentMaterialIntact = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.35,
      metalness: 0.15
    });

    ligamentMaterialStrained = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.3,
      metalness: 0.2
    });

    ligamentMaterialTorn = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      roughness: 0.5,
      transparent: true,
      opacity: 0.35,
      wireframe: true
    });
  }

  function buildAnatomy() {
    jointSystem = new THREE.Group();
    scene.add(jointSystem);

    femurGroup = new THREE.Group();
    tibiaGroup = new THREE.Group();
    fibulaGroup = new THREE.Group();

    jointSystem.add(femurGroup);
    jointSystem.add(tibiaGroup);
    tibiaGroup.add(fibulaGroup); // Fibula articulates rigidly with proximal tibia

    // 1. FEMUR
    createFemurMesh(femurGroup);

    // 2. TIBIA
    createTibiaMesh(tibiaGroup);

    // 3. FIBULA
    createFibulaMesh(fibulaGroup);

    // 4. MENISCI
    createMenisci(tibiaGroup);

    // 5. LIGAMENTS & TENDONS
    createLigamentBundles();
  }

  // --- PARAMETRIC BONE GEOMETRIES ---

  function createFemurMesh(parent) {
    // Distal Femoral Shaft
    var shaftGeo = new THREE.CylinderGeometry(8.5, 11.5, 75, 24);
    var shaft = new THREE.Mesh(shaftGeo, boneMaterial);
    shaft.position.set(0, 48, 0);
    shaft.castShadow = true;
    parent.add(shaft);

    // Medial & Lateral Femoral Condyles
    var condyleGroup = new THREE.Group();
    condyleGroup.position.set(0, 15, 0);

    // Lateral Condyle (smaller, flatter AP radius)
    var latCondyleGeo = new THREE.SphereGeometry(15, 32, 24);
    latCondyleGeo.scale(0.85, 1.0, 1.35);
    var latCondyle = new THREE.Mesh(latCondyleGeo, boneMaterial);
    latCondyle.position.set(-14, -2, -2);
    latCondyle.castShadow = true;
    condyleGroup.add(latCondyle);

    // Medial Condyle (larger, curved, projects more distally)
    var medCondyleGeo = new THREE.SphereGeometry(16.5, 32, 24);
    medCondyleGeo.scale(0.9, 1.08, 1.48);
    var medCondyle = new THREE.Mesh(medCondyleGeo, boneMaterial);
    medCondyle.position.set(14, -3, 0);
    medCondyle.castShadow = true;
    condyleGroup.add(medCondyle);

    // Lateral Epicondyle Prominence
    var latEpiGeo = new THREE.SphereGeometry(3.5, 16, 16);
    var latEpi = new THREE.Mesh(latEpiGeo, boneMaterial);
    latEpi.position.set(-22.5, 2, -1);
    condyleGroup.add(latEpi);

    // Popliteal Sulcus (groove on lateral femoral condyle)
    var sulcusCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-21, -3, 4),
      new THREE.Vector3(-22, -6, -2),
      new THREE.Vector3(-20, -8, -8)
    ]);
    var sulcusGeo = new THREE.TubeGeometry(sulcusCurve, 16, 2.2, 12, false);
    var sulcusMesh = new THREE.Mesh(sulcusGeo, new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.6,
      transparent: true,
      opacity: 0.4
    }));
    condyleGroup.add(sulcusMesh);

    // Articular Cartilage caps on condyles
    var cartLatGeo = new THREE.SphereGeometry(15.2, 24, 16, 0, Math.PI * 2, Math.PI * 0.45, Math.PI * 0.55);
    cartLatGeo.scale(0.85, 1.0, 1.35);
    var cartLat = new THREE.Mesh(cartLatGeo, cartilageMaterial);
    cartLat.position.copy(latCondyle.position);
    condyleGroup.add(cartLat);

    var cartMedGeo = new THREE.SphereGeometry(16.7, 24, 16, 0, Math.PI * 2, Math.PI * 0.45, Math.PI * 0.55);
    cartMedGeo.scale(0.9, 1.08, 1.48);
    var cartMed = new THREE.Mesh(cartMedGeo, cartilageMaterial);
    cartMed.position.copy(medCondyle.position);
    condyleGroup.add(cartMed);

    parent.add(condyleGroup);
  }

  function createTibiaMesh(parent) {
    // Proximal Tibial Plateau
    var plateauGeo = new THREE.CylinderGeometry(23, 20, 14, 32);
    plateauGeo.scale(1.15, 1.0, 0.95);
    var plateau = new THREE.Mesh(plateauGeo, boneMaterial);
    plateau.position.set(0, -18, 0);
    plateau.castShadow = true;
    parent.add(plateau);

    // Intercondylar Eminence (Tibial Spines)
    var spineGeo = new THREE.ConeGeometry(4, 7, 16);
    var spineLat = new THREE.Mesh(spineGeo, boneMaterial);
    spineLat.position.set(-3.5, -9.5, -1);
    parent.add(spineLat);

    var spineMed = new THREE.Mesh(spineGeo, boneMaterial);
    spineMed.position.set(3.5, -9, 0);
    parent.add(spineMed);

    // Tibial Tuberosity (Anterior)
    var tuberoGeo = new THREE.BoxGeometry(10, 16, 7);
    var tubero = new THREE.Mesh(tuberoGeo, boneMaterial);
    tubero.position.set(0, -26, 17);
    tubero.rotation.x = 0.2;
    parent.add(tubero);

    // Tibial Shaft
    var shaftGeo = new THREE.CylinderGeometry(14, 9, 85, 24);
    var shaft = new THREE.Mesh(shaftGeo, boneMaterial);
    shaft.position.set(0, -65, 0);
    shaft.castShadow = true;
    parent.add(shaft);

    // Posteromedial Popliteus Muscle Insertion Footprint (textured indicator)
    var popInsGeo = new THREE.PlaneGeometry(16, 24);
    var popInsMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide
    });
    var popInsMesh = new THREE.Mesh(popInsGeo, popInsMat);
    popInsMesh.position.set(6, -42, -10.5);
    popInsMesh.rotation.y = Math.PI * 0.95;
    popInsMesh.rotation.z = -0.3;
    parent.add(popInsMesh);
  }

  function createFibulaMesh(parent) {
    // Fibular Head & Styloid Process (posterolateral to tibia)
    var headGeo = new THREE.SphereGeometry(7, 24, 20);
    headGeo.scale(0.9, 1.25, 1.0);
    var head = new THREE.Mesh(headGeo, boneMaterial);
    head.position.set(-27, -22, -10);
    head.castShadow = true;
    parent.add(head);

    // Fibular Styloid Process (posterosuperior apex)
    var styloidGeo = new THREE.ConeGeometry(2.5, 6, 16);
    var styloid = new THREE.Mesh(styloidGeo, boneMaterial);
    styloid.position.set(-26.5, -15.5, -12);
    styloid.rotation.x = -0.2;
    parent.add(styloid);

    // Fibular Shaft
    var fibShaftGeo = new THREE.CylinderGeometry(4.2, 3.2, 80, 16);
    var fibShaft = new THREE.Mesh(fibShaftGeo, boneMaterial);
    fibShaft.position.set(-28, -65, -11);
    fibShaft.castShadow = true;
    parent.add(fibShaft);
  }

  function createMenisci(parent) {
    // Lateral Meniscus (O-shaped, with popliteal hiatus aperture)
    var latMeniscusCurve = new THREE.EllipseCurve(-13, -1, 10, 11, 0, Math.PI * 1.65, false, 0);
    var points = latMeniscusCurve.getPoints(24);
    var lat3DPoints = points.map(function(p) { return new THREE.Vector3(p.x, -10.5, p.y); });
    var latMenGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(lat3DPoints), 24, 2.4, 8, false);
    var latMenMesh = new THREE.Mesh(latMenGeo, meniscusMaterial);
    parent.add(latMenMesh);

    // Medial Meniscus (C-shaped)
    var medMeniscusCurve = new THREE.EllipseCurve(13, 0, 12, 13, -Math.PI * 0.7, Math.PI * 0.7, false, 0);
    var medPoints = medMeniscusCurve.getPoints(24);
    var med3DPoints = medPoints.map(function(p) { return new THREE.Vector3(p.x, -10.5, p.y); });
    var medMenGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(med3DPoints), 24, 2.5, 8, false);
    var medMenMesh = new THREE.Mesh(medMenGeo, meniscusMaterial);
    parent.add(medMenMesh);
  }

  // --- DYNAMIC LIGAMENT BUNDLES ---

  function createLigamentBundles() {
    // 1. Popliteus Tendon (Anterior-inferior sulcus -> Popliteal hiatus -> MTJ)
    ligamentMeshes.popliteusTendon = createTubeMesh([
      new THREE.Vector3(-21, 6, 2),    // Femoral attachment (anterior popliteal sulcus)
      new THREE.Vector3(-23, 0, -5),    // Traverses sulcus deep to FCL
      new THREE.Vector3(-22, -8, -12),  // Exits popliteal hiatus
      new THREE.Vector3(-18, -18, -15)  // Musculotendinous junction
    ], 2.4, 0x38bdf8);
    scene.add(ligamentMeshes.popliteusTendon);

    // 2. Popliteofibular Ligament (PFL: Inverted 'Y' connection MTJ -> Fibular Styloid)
    ligamentMeshes.popliteofibularLigament = createTubeMesh([
      new THREE.Vector3(-18, -18, -15), // MTJ origin
      new THREE.Vector3(-22, -17, -13.5),
      new THREE.Vector3(-26.5, -16, -12) // Fibular styloid apex
    ], 1.8, 0x06b6d4);
    scene.add(ligamentMeshes.popliteofibularLigament);

    // 3. Popliteus Muscle Belly (MTJ -> posteromedial proximal tibia)
    ligamentMeshes.popliteusMuscle = createTubeMesh([
      new THREE.Vector3(-18, -18, -15),
      new THREE.Vector3(-8, -26, -13),
      new THREE.Vector3(2, -34, -11.5),
      new THREE.Vector3(8, -42, -10.5)
    ], 3.8, 0xef4444);
    scene.add(ligamentMeshes.popliteusMuscle);

    // 4. Fibular Collateral Ligament (FCL / LCL: 1.4mm post & 3.1mm prox to epicondyle -> fibular head)
    // Exactly 18.5 mm proximal/posterior to Popliteus origin!
    ligamentMeshes.fibularCollateralLigament = createTubeMesh([
      new THREE.Vector3(-23, 14, -2),  // Femoral origin
      new THREE.Vector3(-26, 0, -5),   // Midsubstance
      new THREE.Vector3(-28, -20, -9)  // Fibular head insertion
    ], 2.6, 0x3b82f6);
    scene.add(ligamentMeshes.fibularCollateralLigament);

    // 5. Anterior Cruciate Ligament (ACL: Postero-medial lat condyle -> anterior tibial spine)
    ligamentMeshes.anteriorCruciateLigament = createTubeMesh([
      new THREE.Vector3(-8, 12, -7),
      new THREE.Vector3(-3, 0, -2),
      new THREE.Vector3(1, -11, 6)
    ], 3.2, 0x10b981);
    scene.add(ligamentMeshes.anteriorCruciateLigament);

    // 6. Posterior Cruciate Ligament (PCL: Anterolateral med condyle -> posterior tibial depression)
    ligamentMeshes.posteriorCruciateLigament = createTubeMesh([
      new THREE.Vector3(7, 10, 4),
      new THREE.Vector3(2, 2, -2),
      new THREE.Vector3(-2, -13, -12)
    ], 3.8, 0x8b5cf6);
    scene.add(ligamentMeshes.posteriorCruciateLigament);

    // 7. Medial Collateral Ligament (sMCL)
    ligamentMeshes.medialCollateralLigament = createTubeMesh([
      new THREE.Vector3(23, 13, 0),
      new THREE.Vector3(24, 0, 1),
      new THREE.Vector3(20, -25, 2)
    ], 2.8, 0x64748b);
    scene.add(ligamentMeshes.medialCollateralLigament);
  }

  function createTubeMesh(controlPoints, radius, colorHex) {
    var curve = new THREE.CatmullRomCurve3(controlPoints);
    var geo = new THREE.TubeGeometry(curve, 20, radius, 12, false);
    var mat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.35,
      metalness: 0.12
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.userData = {
      defaultPoints: controlPoints,
      radius: radius,
      defaultColor: colorHex
    };
    return mesh;
  }

  function setupMeasurementAids() {
    // Lateral Compartment Opening Caliper
    caliperGroup = new THREE.Group();
    var lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-22, 6, 0),
      new THREE.Vector3(-22, -11, 0)
    ]);
    var lineMat = new THREE.LineDashedMaterial({
      color: 0xf59e0b,
      dashSize: 2,
      gapSize: 1,
      linewidth: 2
    });
    var caliperLine = new THREE.Line(lineGeo, lineMat);
    caliperLine.computeLineDistances();
    caliperGroup.add(caliperLine);

    // Caliper end ticks
    var tickGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-25, 6, 0),
      new THREE.Vector3(-19, 6, 0)
    ]);
    var tick1 = new THREE.Line(tickGeo, new THREE.LineBasicMaterial({ color: 0xf59e0b }));
    var tick2 = tick1.clone();
    tick2.position.y = -17;
    caliperGroup.add(tick1);
    caliperGroup.add(tick2);

    caliperGroup.visible = false;
    scene.add(caliperGroup);

    // Tibial External Rotation Compass Arc
    rotationArcGroup = new THREE.Group();
    var arcCurve = new THREE.EllipseCurve(0, 0, 28, 28, 0, Math.PI * 0.4, false, 0);
    var arcPoints = arcCurve.getPoints(32).map(function(p) { return new THREE.Vector3(p.x, -16, p.y); });
    var arcGeo = new THREE.BufferGeometry().setFromPoints(arcPoints);
    var arcLine = new THREE.Line(arcGeo, new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 2 }));
    rotationArcGroup.add(arcLine);
    rotationArcGroup.visible = false;
    tibiaGroup.add(rotationArcGroup);

    // Anatomical Landmarks (18.5 mm marker between Popliteus and FCL)
    landmarkGroup = new THREE.Group();
    var distLineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-23, 14, -2), // FCL
      new THREE.Vector3(-21, 6, 2)    // Popliteus
    ]);
    var distLine = new THREE.Line(distLineGeo, new THREE.LineBasicMaterial({ color: 0x38bdf8 }));
    landmarkGroup.add(distLine);

    var sphereGeo = new THREE.SphereGeometry(1.2, 12, 12);
    var pin1 = new THREE.Mesh(sphereGeo, new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    pin1.position.set(-23, 14, -2);
    var pin2 = new THREE.Mesh(sphereGeo, new THREE.MeshBasicMaterial({ color: 0x06b6d4 }));
    pin2.position.set(-21, 6, 2);
    landmarkGroup.add(pin1);
    landmarkGroup.add(pin2);

    landmarkGroup.visible = true;
    femurGroup.add(landmarkGroup);
  }

  // --- KINEMATIC UPDATE ENGINE ---

  function updateKinematics(kinematics, flexionDeg, structures) {
    if (!isInitialized) return;
    currentFlexion = flexionDeg;
    currentKinematics = kinematics;

    var rad = THREE.MathUtils.degToRad(flexionDeg);

    // 1. Tibial Articulation (Roll and Glide + Screw-Home + Applied ER/Varus/Translations)
    var rollGlideZ = -Math.sin(rad) * 12.0; // femoral condyle roll-glide posterior migration
    var rollGlideY = -Math.cos(rad) * 3.0 + 3.0;

    // Obligatory Terminal Extension "Screw-Home" (15° -> 0° = +6.5° external rotation)
    var screwHomeER = 0;
    if (flexionDeg <= 15) {
      screwHomeER = (1 - flexionDeg / 15) * 6.5; // degrees
    }

    // Applied External Rotation (kinematics.externalRotationDeg)
    var totalERDeg = kinematics.externalRotationDeg + screwHomeER;
    var totalERRad = THREE.MathUtils.degToRad(totalERDeg);

    // Varus Angulation & Lateral Gapping
    var varusRad = THREE.MathUtils.degToRad(kinematics.varusAngleDeg);
    var lateralGappingMm = kinematics.varusOpeningMm;

    // Anterior / Posterior Translation
    var netTransZ = kinematics.anteriorTranslationMm - kinematics.posteriorTranslationMm;

    // Apply Transformations to Tibia Group
    tibiaGroup.position.set(0, rollGlideY - (lateralGappingMm * 0.4), rollGlideZ + netTransZ);
    tibiaGroup.rotation.set(
      -rad,               // Flexion (transverse axis)
      -totalERRad,        // External Rotation (longitudinal axis)
      -varusRad           // Varus tilt (sagittal/coronal axis)
    );

    // 2. Dynamic Update of Ligaments (Attachment coordinates transform with bones)
    updateLigamentPaths(structures, kinematics, rad, totalERRad, varusRad, netTransZ);

    // 3. Update Visual Measurement Aids
    updateMeasurementAids(kinematics);
  }

  function updateLigamentPaths(structures, kinematics, flexionRad, erRad, varusRad, transZ) {
    // Popliteus Tendon status
    updateSingleLigament("popliteusTendon", structures.popliteusTendon, kinematics.deltaExternalRotationDeg > 4.0, [
      new THREE.Vector3(-21, 6, 2),
      new THREE.Vector3(-23, 0 - Math.sin(flexionRad) * 4, -5 - Math.sin(flexionRad) * 6),
      getTransformedTibialPoint(new THREE.Vector3(-22, -8, -12)),
      getTransformedTibialPoint(new THREE.Vector3(-18, -18, -15))
    ]);

    // Popliteofibular Ligament (PFL)
    updateSingleLigament("popliteofibularLigament", structures.popliteofibularLigament, kinematics.deltaExternalRotationDeg > 4.0, [
      getTransformedTibialPoint(new THREE.Vector3(-18, -18, -15)),
      getTransformedTibialPoint(new THREE.Vector3(-22, -17, -13.5)),
      getTransformedTibialPoint(new THREE.Vector3(-26.5, -16, -12))
    ]);

    // Popliteus Muscle Belly
    updateSingleLigament("popliteusMuscle", true, false, [
      getTransformedTibialPoint(new THREE.Vector3(-18, -18, -15)),
      getTransformedTibialPoint(new THREE.Vector3(-8, -26, -13)),
      getTransformedTibialPoint(new THREE.Vector3(2, -34, -11.5)),
      getTransformedTibialPoint(new THREE.Vector3(8, -42, -10.5))
    ]);

    // Fibular Collateral Ligament (FCL / LCL)
    updateSingleLigament("fibularCollateralLigament", structures.fibularCollateralLigament, kinematics.varusAngleDeg > 7.0, [
      new THREE.Vector3(-23, 14, -2),
      new THREE.Vector3(-26, 0 - Math.sin(flexionRad) * 2, -5 - Math.sin(flexionRad) * 4),
      getTransformedTibialPoint(new THREE.Vector3(-28, -20, -9))
    ]);

    // Anterior Cruciate Ligament (ACL)
    var aclStrained = kinematics.aclGraftStressMultiplier > 1.5;
    updateSingleLigament("anteriorCruciateLigament", structures.anteriorCruciateLigament, aclStrained, [
      new THREE.Vector3(-8, 12, -7),
      new THREE.Vector3(-3, 0, -2 + transZ * 0.5),
      getTransformedTibialPoint(new THREE.Vector3(1, -11, 6))
    ]);

    // Posterior Cruciate Ligament (PCL)
    updateSingleLigament("posteriorCruciateLigament", structures.posteriorCruciateLigament, kinematics.posteriorTranslationMm > 8.0, [
      new THREE.Vector3(7, 10, 4),
      new THREE.Vector3(2, 2, -2),
      getTransformedTibialPoint(new THREE.Vector3(-2, -13, -12))
    ]);

    // MCL
    updateSingleLigament("medialCollateralLigament", true, false, [
      new THREE.Vector3(23, 13, 0),
      new THREE.Vector3(24, 0, 1),
      getTransformedTibialPoint(new THREE.Vector3(20, -25, 2))
    ]);
  }

  function getTransformedTibialPoint(localPoint) {
    var v = localPoint.clone();
    tibiaGroup.localToWorld(v);
    return v;
  }

  function updateSingleLigament(key, isIntact, isStrained, worldPoints) {
    var mesh = ligamentMeshes[key];
    if (!mesh) return;

    if (!isIntact) {
      // Torn State: retracted, wireframe / ghost appearance with frayed red styling
      mesh.material = ligamentMaterialTorn;
      mesh.scale.set(0.65, 0.65, 0.65);
      return;
    }

    mesh.scale.set(1.0, 1.0, 1.0);

    // Strained vs Intact Color
    if (isStrained) {
      mesh.material = ligamentMaterialStrained;
    } else {
      mesh.material = ligamentMaterialIntact;
    }

    // Rebuild Tube Geometry along updated curve points
    try {
      var newCurve = new THREE.CatmullRomCurve3(worldPoints);
      mesh.geometry.dispose();
      mesh.geometry = new THREE.TubeGeometry(newCurve, 20, mesh.userData.radius, 10, false);
    } catch(e) {}
  }

  function updateMeasurementAids(kinematics) {
    // Show caliper if varus load or opening is significant
    if (kinematics.varusOpeningMm > 5.0 || kinematics.deltaVarusOpeningMm > 1.0) {
      caliperGroup.visible = true;
      var latFemurWorld = new THREE.Vector3(-22, 6, 0);
      var latTibiaWorld = getTransformedTibialPoint(new THREE.Vector3(-22, -11, 0));
      caliperGroup.children[0].geometry.setFromPoints([latFemurWorld, latTibiaWorld]);
      caliperGroup.children[0].computeLineDistances();
    } else {
      caliperGroup.visible = false;
    }

    // Show rotation arc if external rotation is prominent
    if (kinematics.externalRotationDeg > 10.0) {
      rotationArcGroup.visible = true;
    } else {
      rotationArcGroup.visible = false;
    }
  }

  // Camera Presets
  function setCameraView(presetName) {
    if (!camera || !controls) return;
    switch(presetName) {
      case "anterolateral":
        camera.position.set(-85, 20, 110);
        controls.target.set(0, 0, 0);
        break;
      case "posterolateral": // "The Dark Side of the Knee"
        camera.position.set(-95, -5, -95);
        controls.target.set(-15, -15, -10);
        break;
      case "lateral":
        camera.position.set(-130, 0, 0);
        controls.target.set(0, -10, 0);
        break;
      case "anterior":
        camera.position.set(0, 5, 130);
        controls.target.set(0, -5, 0);
        break;
      case "axial": // Top down onto tibial plateau
        camera.position.set(0, 125, 10);
        controls.target.set(0, -15, 0);
        break;
    }
    controls.update();
  }

  function toggleLandmarks(visible) {
    if (landmarkGroup) landmarkGroup.visible = visible;
  }

  function onWindowResize() {
    if (!container || !renderer || !camera) return;
    var width = container.clientWidth;
    var height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  function animate() {
    requestAnimationFrame(animate);
    if (controls) controls.update();
    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }
  }

  return {
    init: init,
    updateKinematics: updateKinematics,
    setCameraView: setCameraView,
    toggleLandmarks: toggleLandmarks
  };
})();
