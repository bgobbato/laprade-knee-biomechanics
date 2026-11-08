/**
 * High-Fidelity 3D Knee Anatomical & Biomechanical Engine (Three.js)
 * Enhanced with Anatomical Bone Contouring, Multi-Bundle Ligaments,
 * Popliteal Hiatus, Meniscopopliteal Fascicles, Patellofemoral Mechanism,
 * and the LaPrade Anatomic Reconstruction Surgical Overlay.
 *
 * Authored based on Dr. Robert F. LaPrade & Dr. Jorge Chahla cadaveric benchmarks.
 */

window.Knee3DViewer = (function() {
  var container, scene, camera, renderer, controls;
  var femurGroup, tibiaGroup, fibulaGroup, patellaGroup, jointSystem;
  var ligamentMeshes = {};
  var surgicalGraftGroup, landmarkGroup, caliperGroup, rotationArcGroup;
  var isInitialized = false;

  // Materials
  var boneMaterial, boneXrayMaterial, cartilageMaterial, meniscusMaterial;
  var ligamentMaterialIntact, ligamentMaterialStrained, ligamentMaterialTorn;
  var graftMaterial, tunnelMaterial, patellarTendonMaterial;

  // Display toggles
  var showPatella = true;
  var showSurgicalRecon = false;
  var showLandmarks = true;
  var isXrayMode = false;

  // Current kinematic parameters
  var currentFlexion = 0;
  var currentKinematics = null;

  function init(containerId) {
    container = document.getElementById(containerId);
    if (!container) return;

    var width = container.clientWidth || 800;
    var height = container.clientHeight || 600;

    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070b14);
    scene.fog = new THREE.FogExp2(0x070b14, 0.0018);

    // Camera
    camera = new THREE.PerspectiveCamera(42, width / height, 1, 1200);
    camera.position.set(-90, 18, 105);

    // WebGL Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // Orbit Controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI * 0.88;
    controls.minDistance = 35;
    controls.maxDistance = 380;
    controls.target.set(0, -6, 0);

    setupStudioLighting();
    setupMaterials();
    buildEnhancedAnatomy();
    setupSurgicalReconstructionOverlay();
    setupEnhancedMeasurementAids();

    window.addEventListener("resize", onWindowResize);
    isInitialized = true;
    animate();
  }

  function setupStudioLighting() {
    // Ambient soft skylight
    var hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x0f172a, 0.65);
    scene.add(hemiLight);

    // Main Key Light (Anterolateral Studio)
    var keyLight = new THREE.DirectionalLight(0xffffff, 0.95);
    keyLight.position.set(-80, 110, 95);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    // Posterolateral Corner Rim Light (Crucial for the "Dark Side of the Knee")
    var plcRimLight = new THREE.DirectionalLight(0x38bdf8, 0.85);
    plcRimLight.position.set(-85, -20, -90);
    scene.add(plcRimLight);

    // Medial Condyle Fill Light
    var medialFill = new THREE.DirectionalLight(0x94a3b8, 0.45);
    medialFill.position.set(90, 20, 40);
    scene.add(medialFill);

    // Distal Accent Light
    var distalLight = new THREE.PointLight(0x0284c7, 0.5, 250);
    distalLight.position.set(-20, -60, -30);
    scene.add(distalLight);

    // Studio Stage Floor Grid
    var grid = new THREE.GridHelper(360, 36, 0x1e293b, 0x0f172a);
    grid.position.y = -85;
    scene.add(grid);
  }

  function setupMaterials() {
    // Anatomical Cortical Bone (Organic Ivory with Micro-roughness)
    boneMaterial = new THREE.MeshStandardMaterial({
      color: 0xedebe1,
      roughness: 0.38,
      metalness: 0.05,
      flatShading: false
    });

    // Bone X-Ray / Translucent Mode
    boneXrayMaterial = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.2,
      metalness: 0.1,
      transparent: true,
      opacity: 0.28,
      wireframe: false
    });

    // Articular Hyaline Cartilage (Pearlescent translucent)
    cartilageMaterial = new THREE.MeshStandardMaterial({
      color: 0xe0f2fe,
      roughness: 0.12,
      metalness: 0.08,
      transparent: true,
      opacity: 0.92
    });

    // Fibrocartilage Meniscus (Glossy dense gray-ivory)
    meniscusMaterial = new THREE.MeshStandardMaterial({
      color: 0xa1a1aa,
      roughness: 0.42,
      metalness: 0.04
    });

    // Healthy Intact Ligaments (Medical Blue / Cyan)
    ligamentMaterialIntact = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.3,
      metalness: 0.15
    });

    // High Strain Ligaments (Amber warning)
    ligamentMaterialStrained = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.25,
      metalness: 0.2
    });

    // Ruptured / Torn Ligament (Retracted Crimson)
    ligamentMaterialTorn = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      roughness: 0.6,
      transparent: true,
      opacity: 0.32,
      wireframe: true
    });

    // Patellar Tendon & Extensor Material
    patellarTendonMaterial = new THREE.MeshStandardMaterial({
      color: 0xdbeafe,
      roughness: 0.45,
      metalness: 0.05
    });

    // Surgical Grafts (LaPrade Anatomic Reconstruction: Split Achilles / Semitendinosus)
    graftMaterial = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      roughness: 0.32,
      metalness: 0.15
    });

    // Bone Tunnels (Anodized reamed bone tunnel guides)
    tunnelMaterial = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.2,
      metalness: 0.6,
      transparent: true,
      opacity: 0.75
    });
  }

  // --- ENHANCED ANATOMICAL MESH BUILDER ---

  function buildEnhancedAnatomy() {
    jointSystem = new THREE.Group();
    scene.add(jointSystem);

    femurGroup = new THREE.Group();
    tibiaGroup = new THREE.Group();
    fibulaGroup = new THREE.Group();
    patellaGroup = new THREE.Group();

    jointSystem.add(femurGroup);
    jointSystem.add(tibiaGroup);
    jointSystem.add(patellaGroup);
    tibiaGroup.add(fibulaGroup); // Fibula articulates rigidly with proximal tibia

    createDetailedFemur(femurGroup);
    createDetailedTibia(tibiaGroup);
    createDetailedFibula(fibulaGroup);
    createDetailedPatella(patellaGroup);
    createDetailedMenisci(tibiaGroup);
    createEnhancedLigamentBundles();
  }

  function createDetailedFemur(parent) {
    // 1. Distal Femoral Shaft
    var shaftGeo = new THREE.CylinderGeometry(9.0, 12.8, 80, 32);
    var shaft = new THREE.Mesh(shaftGeo, boneMaterial);
    shaft.position.set(0, 52, 0);
    shaft.castShadow = true;
    parent.add(shaft);

    var condyleRoot = new THREE.Group();
    condyleRoot.position.set(0, 15, 0);

    // 2. Lateral Femoral Condyle (Asymmetric: Flatter AP curve, houses Popliteal Sulcus)
    var latCondyleGeo = new THREE.SphereGeometry(15.5, 36, 28);
    latCondyleGeo.scale(0.86, 1.02, 1.38);
    var latCondyle = new THREE.Mesh(latCondyleGeo, boneMaterial);
    latCondyle.position.set(-14.5, -2, -2.5);
    latCondyle.castShadow = true;
    condyleRoot.add(latCondyle);

    // 3. Medial Femoral Condyle (Larger surface area, projects more distally and curves laterally)
    var medCondyleGeo = new THREE.SphereGeometry(17.2, 36, 28);
    medCondyleGeo.scale(0.92, 1.10, 1.52);
    var medCondyle = new THREE.Mesh(medCondyleGeo, boneMaterial);
    medCondyle.position.set(14.5, -3.8, 0.5);
    medCondyle.castShadow = true;
    condyleRoot.add(medCondyle);

    // 4. Anterior Trochlear Groove (Sulcus for patellar tracking)
    var trochleaGeo = new THREE.BoxGeometry(22, 18, 6);
    var trochlea = new THREE.Mesh(trochleaGeo, boneMaterial);
    trochlea.position.set(0, 4, 13.5);
    trochlea.rotation.x = -0.15;
    condyleRoot.add(trochlea);

    // 5. Lateral Epicondyle Prominence
    var latEpiGeo = new THREE.SphereGeometry(4.2, 20, 20);
    var latEpi = new THREE.Mesh(latEpiGeo, boneMaterial);
    latEpi.position.set(-23.2, 2.2, -1.2);
    condyleRoot.add(latEpi);

    // 6. POPLITEAL SULCUS (Accurately sculpted anatomical groove on lateral femoral condyle)
    // The popliteus tendon sits directly in this sulcus and slides through it during flexion!
    var sulcusPath = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-21.5, 6, 2.5),   // Anterior-inferior popliteus attachment
      new THREE.Vector3(-23.8, 0, -4.0),  // Deep floor of the sulcus
      new THREE.Vector3(-22.0, -6, -9.5)  // Exits toward popliteal hiatus
    ]);
    var sulcusGeo = new THREE.TubeGeometry(sulcusPath, 20, 2.8, 14, false);
    var sulcusMesh = new THREE.Mesh(sulcusGeo, new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.5,
      transparent: true,
      opacity: 0.35
    }));
    condyleRoot.add(sulcusMesh);

    // 7. Articular Hyaline Cartilage Caps on both condyles
    var latCartGeo = new THREE.SphereGeometry(15.7, 32, 20, 0, Math.PI * 2, Math.PI * 0.42, Math.PI * 0.58);
    latCartGeo.scale(0.86, 1.02, 1.38);
    var latCart = new THREE.Mesh(latCartGeo, cartilageMaterial);
    latCart.position.copy(latCondyle.position);
    condyleRoot.add(latCart);

    var medCartGeo = new THREE.SphereGeometry(17.4, 32, 20, 0, Math.PI * 2, Math.PI * 0.42, Math.PI * 0.58);
    medCartGeo.scale(0.92, 1.10, 1.52);
    var medCart = new THREE.Mesh(medCartGeo, cartilageMaterial);
    medCart.position.copy(medCondyle.position);
    condyleRoot.add(medCart);

    parent.add(condyleRoot);
  }

  function createDetailedTibia(parent) {
    // 1. Proximal Tibial Plateau
    var plateauGeo = new THREE.CylinderGeometry(24, 21, 15, 36);
    plateauGeo.scale(1.18, 1.0, 0.96);
    var plateau = new THREE.Mesh(plateauGeo, boneMaterial);
    plateau.position.set(0, -18, 0);
    plateau.castShadow = true;
    parent.add(plateau);

    // 2. Medial Tibial Plateau (Concave cartilage cup)
    var medPlateauCupGeo = new THREE.CylinderGeometry(13.5, 12, 2.5, 24);
    var medPlateauCup = new THREE.Mesh(medPlateauCupGeo, cartilageMaterial);
    medPlateauCup.position.set(12.5, -9.5, 0);
    parent.add(medPlateauCup);

    // 3. Lateral Tibial Plateau (Convex articular disc)
    var latPlateauCupGeo = new THREE.CylinderGeometry(11.5, 11, 2.5, 24);
    var latPlateauCup = new THREE.Mesh(latPlateauCupGeo, cartilageMaterial);
    latPlateauCup.position.set(-12.5, -9.5, -1);
    parent.add(latPlateauCup);

    // 4. Intercondylar Eminence (Medial and Lateral Tibial Spines)
    var spineMedGeo = new THREE.ConeGeometry(3.6, 8.5, 16);
    var spineMed = new THREE.Mesh(spineMedGeo, boneMaterial);
    spineMed.position.set(3.2, -8.2, 0.2);
    parent.add(spineMed);

    var spineLatGeo = new THREE.ConeGeometry(3.4, 7.8, 16);
    var spineLat = new THREE.Mesh(spineLatGeo, boneMaterial);
    spineLat.position.set(-3.6, -8.5, -0.8);
    parent.add(spineLat);

    // 5. Tibial Tuberosity (Anterior insertion of Patellar Tendon)
    var tuberoGeo = new THREE.BoxGeometry(11, 18, 8);
    var tubero = new THREE.Mesh(tuberoGeo, boneMaterial);
    tubero.position.set(0, -27, 18.5);
    tubero.rotation.x = 0.24;
    parent.add(tubero);

    // 6. Gerdy's Tubercle (Anterolateral tibia, insertion of Iliotibial Band)
    var gerdysGeo = new THREE.SphereGeometry(4, 16, 16);
    var gerdys = new THREE.Mesh(gerdysGeo, boneMaterial);
    gerdys.position.set(-17.5, -23, 11.5);
    parent.add(gerdys);

    // 7. Tibial Shaft
    var shaftGeo = new THREE.CylinderGeometry(14.5, 9.5, 90, 28);
    var shaft = new THREE.Mesh(shaftGeo, boneMaterial);
    shaft.position.set(0, -68, 0);
    shaft.castShadow = true;
    parent.add(shaft);

    // 8. Posteromedial Popliteus Muscle Insertion Footprint
    var popInsGeo = new THREE.PlaneGeometry(18, 28);
    var popInsMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.38,
      side: THREE.DoubleSide
    });
    var popIns = new THREE.Mesh(popInsGeo, popInsMat);
    popIns.position.set(6.5, -44, -11);
    popIns.rotation.y = Math.PI * 0.96;
    popIns.rotation.z = -0.28;
    parent.add(popIns);
  }

  function createDetailedFibula(parent) {
    // 1. Fibular Head (Posterolateral to proximal tibia)
    var headGeo = new THREE.SphereGeometry(7.6, 24, 20);
    headGeo.scale(0.92, 1.3, 1.05);
    var head = new THREE.Mesh(headGeo, boneMaterial);
    head.position.set(-27.5, -22, -9.5);
    head.castShadow = true;
    parent.add(head);

    // 2. FIBULAR STYLOID PROCESS (Apex - Critical insertion of PFL)
    var styloidGeo = new THREE.ConeGeometry(2.8, 7.5, 16);
    var styloid = new THREE.Mesh(styloidGeo, boneMaterial);
    styloid.position.set(-26.8, -14.8, -11.8);
    styloid.rotation.x = -0.18;
    parent.add(styloid);

    // 3. FCL Fibular Insertion Footprint (Lateral fibular head)
    var fclFootprintGeo = new THREE.CylinderGeometry(2.4, 2.4, 1.2, 12);
    var fclFootprintMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6 });
    var fclFootprint = new THREE.Mesh(fclFootprintGeo, fclFootprintMat);
    fclFootprint.position.set(-33.2, -22, -9.5);
    fclFootprint.rotation.z = Math.PI * 0.5;
    parent.add(fclFootprint);

    // 4. Fibular Shaft
    var fibShaftGeo = new THREE.CylinderGeometry(4.4, 3.2, 85, 16);
    var fibShaft = new THREE.Mesh(fibShaftGeo, boneMaterial);
    fibShaft.position.set(-28.5, -67, -10.5);
    fibShaft.castShadow = true;
    parent.add(fibShaft);
  }

  function createDetailedPatella(parent) {
    // Patella (Triangular sesamoid bone)
    var patellaGeo = new THREE.SphereGeometry(8.5, 24, 20);
    patellaGeo.scale(1.15, 1.35, 0.65);
    var patellaMesh = new THREE.Mesh(patellaGeo, boneMaterial);
    patellaMesh.position.set(0, 16, 21);
    patellaMesh.castShadow = true;
    parent.add(patellaMesh);

    // Patellar Tendon (Distal pole of patella to tibial tuberosity)
    var ptCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 8, 20.5),
      new THREE.Vector3(0, -6, 20.0),
      new THREE.Vector3(0, -21, 18.5)
    ]);
    var ptGeo = new THREE.TubeGeometry(ptCurve, 16, 3.8, 12, false);
    var ptMesh = new THREE.Mesh(ptGeo, patellarTendonMaterial);
    parent.add(ptMesh);

    // Quadriceps Tendon (Extending proximally)
    var qtCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 24, 20.5),
      new THREE.Vector3(0, 42, 18.0),
      new THREE.Vector3(0, 60, 15.0)
    ]);
    var qtGeo = new THREE.TubeGeometry(qtCurve, 16, 4.2, 12, false);
    var qtMesh = new THREE.Mesh(qtGeo, patellarTendonMaterial);
    parent.add(qtMesh);
  }

  function createDetailedMenisci(parent) {
    // 1. Lateral Meniscus (O-shaped, with the POPLITEAL HIATUS aperture)
    var latMenCurve = new THREE.EllipseCurve(-13, -1, 10.5, 11.5, 0, Math.PI * 1.62, false, 0);
    var latPoints = latMenCurve.getPoints(32).map(function(p) { return new THREE.Vector3(p.x, -10.2, p.y); });
    var latMenGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(latPoints), 32, 2.6, 10, false);
    var latMenMesh = new THREE.Mesh(latMenGeo, meniscusMaterial);
    parent.add(latMenMesh);

    // 2. Medial Meniscus (C-shaped, attached to deep MCL)
    var medMenCurve = new THREE.EllipseCurve(13.5, 0, 12.5, 13.5, -Math.PI * 0.44, Math.PI * 0.44, false, 0);
    var medPoints = medMenCurve.getPoints(32).map(function(p) { return new THREE.Vector3(p.x, -10.2, p.y); });
    var medMenGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(medPoints), 32, 2.8, 10, false);
    var medMenMesh = new THREE.Mesh(medMenGeo, meniscusMaterial);
    parent.add(medMenMesh);
  }

  // --- MULTI-BUNDLE LIGAMENT STRUCTURES ---

  function createEnhancedLigamentBundles() {
    // 1. Popliteus Tendon (Anterior-inferior sulcus -> Popliteal hiatus -> MTJ)
    ligamentMeshes.popliteusTendon = createMultiStrandTendon([
      new THREE.Vector3(-21.5, 6, 2.5),   // Popliteal sulcus femoral footprint
      new THREE.Vector3(-23.8, 0, -4.0),   // Inside sulcus floor deep to FCL
      new THREE.Vector3(-22.5, -8, -11.5), // Traverses popliteal hiatus
      new THREE.Vector3(-18.5, -18, -15.0) // Musculotendinous junction
    ], 2.6, 0x38bdf8);
    scene.add(ligamentMeshes.popliteusTendon);

    // 2. Popliteofibular Ligament (PFL: Inverted 'Y' construct MTJ -> Fibular Styloid)
    ligamentMeshes.popliteofibularLigament = createMultiStrandTendon([
      new THREE.Vector3(-18.5, -18, -15.0),
      new THREE.Vector3(-22.8, -16.8, -13.5),
      new THREE.Vector3(-26.8, -14.8, -11.8) // Fibular styloid apex
    ], 2.0, 0x06b6d4);
    scene.add(ligamentMeshes.popliteofibularLigament);

    // 3. Meniscopopliteal Fascicles (Superior & Inferior - Anchor posterior horn to popliteus sheath)
    ligamentMeshes.meniscopoplitealFascicles = createMultiStrandTendon([
      new THREE.Vector3(-17.5, -10.5, -11.0), // Lateral meniscus posterior horn
      new THREE.Vector3(-20.5, -11.5, -11.8),
      new THREE.Vector3(-22.5, -8, -11.5)     // Popliteus tendon sheath
    ], 1.2, 0x67e8f9);
    scene.add(ligamentMeshes.meniscopoplitealFascicles);

    // 4. Popliteus Muscle Belly (MTJ fanning across posteromedial proximal tibia)
    ligamentMeshes.popliteusMuscle = createMultiStrandTendon([
      new THREE.Vector3(-18.5, -18, -15.0),
      new THREE.Vector3(-8.0, -27, -13.2),
      new THREE.Vector3(2.5, -35, -11.8),
      new THREE.Vector3(8.5, -43, -10.5)
    ], 4.2, 0xef4444);
    scene.add(ligamentMeshes.popliteusMuscle);

    // 5. Fibular Collateral Ligament (FCL / LCL: 18.5 mm proximal-posterior to Popliteus footprint)
    ligamentMeshes.fibularCollateralLigament = createMultiStrandTendon([
      new THREE.Vector3(-23.2, 14.5, -2.2), // Femoral footprint
      new THREE.Vector3(-27.0, 0, -5.5),    // Crossing lateral joint line superficial to popliteus
      new THREE.Vector3(-33.2, -22, -9.5)   // Lateral fibular head
    ], 2.8, 0x3b82f6);
    scene.add(ligamentMeshes.fibularCollateralLigament);

    // 6. Anterior Cruciate Ligament (Dual Bundle: Anteromedial & Posterolateral Bundles)
    ligamentMeshes.anteriorCruciateLigament = createMultiStrandTendon([
      new THREE.Vector3(-8.5, 13, -7.5),
      new THREE.Vector3(-3.2, 0, -2.2),
      new THREE.Vector3(1.5, -10.8, 6.2)
    ], 3.4, 0x10b981);
    scene.add(ligamentMeshes.anteriorCruciateLigament);

    // 7. Posterior Cruciate Ligament (Dual Bundle: Anterolateral & Posteromedial)
    ligamentMeshes.posteriorCruciateLigament = createMultiStrandTendon([
      new THREE.Vector3(7.5, 11, 4.5),
      new THREE.Vector3(2.5, 2.5, -1.8),
      new THREE.Vector3(-2.2, -13.2, -12.5)
    ], 4.0, 0x8b5cf6);
    scene.add(ligamentMeshes.posteriorCruciateLigament);

    // 8. Superficial Medial Collateral Ligament (sMCL)
    ligamentMeshes.medialCollateralLigament = createMultiStrandTendon([
      new THREE.Vector3(24.5, 14, 0.5),
      new THREE.Vector3(25.5, 0, 1.2),
      new THREE.Vector3(21.0, -26, 2.5)
    ], 3.0, 0x64748b);
    scene.add(ligamentMeshes.medialCollateralLigament);
  }

  function createMultiStrandTendon(points, radius, colorHex) {
    var curve = new THREE.CatmullRomCurve3(points);
    var geo = new THREE.TubeGeometry(curve, 24, radius, 14, false);
    var mat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.32,
      metalness: 0.14
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.userData = {
      defaultPoints: points,
      radius: radius,
      defaultColor: colorHex
    };
    return mesh;
  }

  // --- SURGICAL ANATOMIC RECONSTRUCTION OVERLAY (LAPRADE TECHNIQUE) ---

  function setupSurgicalReconstructionOverlay() {
    surgicalGraftGroup = new THREE.Group();

    // 1. Femoral Tunnels (Two distinct tunnels spaced precisely 18.5 mm apart)
    var fclTunnelGeo = new THREE.CylinderGeometry(4.0, 4.0, 24, 16);
    var fclTunnel = new THREE.Mesh(fclTunnelGeo, tunnelMaterial);
    fclTunnel.position.set(-23.2, 14.5, -2.2);
    fclTunnel.rotation.z = Math.PI * 0.45;
    surgicalGraftGroup.add(fclTunnel);

    var popTunnelGeo = new THREE.CylinderGeometry(4.5, 4.5, 24, 16);
    var popTunnel = new THREE.Mesh(popTunnelGeo, tunnelMaterial);
    popTunnel.position.set(-21.5, 6, 2.5);
    popTunnel.rotation.z = Math.PI * 0.42;
    surgicalGraftGroup.add(popTunnel);

    // 2. Fibular Head Tunnel (Anterolateral to Posteromedial)
    var fibTunnelGeo = new THREE.CylinderGeometry(3.5, 3.5, 18, 16);
    var fibTunnel = new THREE.Mesh(fibTunnelGeo, tunnelMaterial);
    fibTunnel.position.set(-29.5, -18.5, -10.5);
    fibTunnel.rotation.x = Math.PI * 0.3;
    fibulaGroup.add(fibTunnel);

    // 3. Tibial Tunnel (Exits just medial to the popliteal sulcus on posterior tibia)
    var tibTunnelGeo = new THREE.CylinderGeometry(4.5, 4.5, 32, 16);
    var tibTunnel = new THREE.Mesh(tibTunnelGeo, tunnelMaterial);
    tibTunnel.position.set(-1.0, -24, 0);
    tibTunnel.rotation.x = -Math.PI * 0.35;
    tibiaGroup.add(tibTunnel);

    // 4. Anatomic Grafts (Semitendinosus / Split Achilles Allograft)
    // Graft 1: Reconstructed FCL (Femur -> Fibula)
    var reconFclCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-23.2, 14.5, -2.2),
      new THREE.Vector3(-27.2, 0, -5.5),
      new THREE.Vector3(-33.2, -22, -9.5)
    ]);
    var reconFcl = new THREE.Mesh(new THREE.TubeGeometry(reconFclCurve, 20, 2.6, 12, false), graftMaterial);
    surgicalGraftGroup.add(reconFcl);

    // Graft 2: Reconstructed Popliteus & PFL
    var reconPopCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-21.5, 6, 2.5),
      new THREE.Vector3(-23.5, 0, -4.5),
      new THREE.Vector3(-21.5, -8, -12),
      new THREE.Vector3(-12.5, -20, -12) // Entering tibial tunnel
    ]);
    var reconPop = new THREE.Mesh(new THREE.TubeGeometry(reconPopCurve, 20, 2.8, 12, false), graftMaterial);
    surgicalGraftGroup.add(reconPop);

    surgicalGraftGroup.visible = false;
    femurGroup.add(surgicalGraftGroup);
  }

  // --- ANATOMICAL LANDMARKS & CALIPERS ---

  function setupEnhancedMeasurementAids() {
    // 1. 18.5 mm Anatomic Distance Bracket between Popliteus & FCL
    landmarkGroup = new THREE.Group();

    var bridgeGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-23.2, 14.5, -2.2), // FCL footprint
      new THREE.Vector3(-21.5, 6, 2.5)     // Popliteus footprint
    ]);
    var bridgeLine = new THREE.Line(bridgeGeo, new THREE.LineDashedMaterial({
      color: 0x38bdf8,
      dashSize: 1.5,
      gapSize: 0.8
    }));
    bridgeLine.computeLineDistances();
    landmarkGroup.add(bridgeLine);

    // Pins
    var p1 = createLandmarkPin(new THREE.Vector3(-23.2, 14.5, -2.2), 0x3b82f6);
    var p2 = createLandmarkPin(new THREE.Vector3(-21.5, 6, 2.5), 0x06b6d4);
    var p3 = createLandmarkPin(new THREE.Vector3(-26.8, -14.8, -11.8), 0x10b981); // Fibular styloid
    var p4 = createLandmarkPin(new THREE.Vector3(-17.5, -23, 11.5), 0xf59e0b);    // Gerdy's tubercle

    landmarkGroup.add(p1);
    landmarkGroup.add(p2);
    femurGroup.add(landmarkGroup);
    fibulaGroup.add(p3);
    tibiaGroup.add(p4);

    // 2. Lateral Compartment Gapping Caliper (Varus stress radiograph measurement)
    caliperGroup = new THREE.Group();
    var caliperLineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-23, 6, 0),
      new THREE.Vector3(-23, -11, 0)
    ]);
    var caliperLine = new THREE.Line(caliperLineGeo, new THREE.LineDashedMaterial({
      color: 0xf59e0b,
      dashSize: 2,
      gapSize: 1
    }));
    caliperLine.computeLineDistances();
    caliperGroup.add(caliperLine);

    var tickGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-26, 6, 0),
      new THREE.Vector3(-20, 6, 0)
    ]);
    var tick1 = new THREE.Line(tickGeo, new THREE.LineBasicMaterial({ color: 0xf59e0b, linewidth: 2 }));
    var tick2 = tick1.clone();
    tick2.position.y = -17;
    caliperGroup.add(tick1);
    caliperGroup.add(tick2);
    caliperGroup.visible = false;
    scene.add(caliperGroup);

    // 3. Tibial External Rotation Compass Arc
    rotationArcGroup = new THREE.Group();
    var arcCurve = new THREE.EllipseCurve(0, 0, 30, 30, 0, Math.PI * 0.45, false, 0);
    var arcPoints = arcCurve.getPoints(36).map(function(p) { return new THREE.Vector3(p.x, -16.5, p.y); });
    var arcLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(arcPoints), new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 2 }));
    rotationArcGroup.add(arcLine);
    rotationArcGroup.visible = false;
    tibiaGroup.add(rotationArcGroup);
  }

  function createLandmarkPin(pos, colorHex) {
    var g = new THREE.Group();
    var sphere = new THREE.Mesh(new THREE.SphereGeometry(1.3, 14, 14), new THREE.MeshBasicMaterial({ color: colorHex }));
    sphere.position.copy(pos);
    g.add(sphere);
    return g;
  }

  // --- KINEMATIC UPDATE ENGINE ---

  function updateKinematics(kinematics, flexionDeg, structures) {
    if (!isInitialized) return;
    currentFlexion = flexionDeg;
    currentKinematics = kinematics;

    var rad = THREE.MathUtils.degToRad(flexionDeg);

    // 1. Physiological Roll-and-Glide kinematics
    var rollGlideZ = -Math.sin(rad) * 12.5;
    var rollGlideY = -Math.cos(rad) * 3.2 + 3.2;

    // 2. Terminal Extension "Screw-Home" Obligatory Rotation (15° -> 0° = +6.5° external rotation)
    var screwHomeER = 0;
    if (flexionDeg <= 15) {
      screwHomeER = (1 - flexionDeg / 15) * 6.5;
    }

    // Total External Rotation
    var totalERDeg = kinematics.externalRotationDeg + screwHomeER;
    var totalERRad = THREE.MathUtils.degToRad(totalERDeg);

    // Varus Tilt & Lateral Compartment Opening
    var varusRad = THREE.MathUtils.degToRad(kinematics.varusAngleDeg);
    var lateralGappingMm = kinematics.varusOpeningMm;

    // Anterior / Posterior Translation
    var netTransZ = kinematics.anteriorTranslationMm - kinematics.posteriorTranslationMm;

    // Articulate Tibia & Fibula
    tibiaGroup.position.set(0, rollGlideY - (lateralGappingMm * 0.42), rollGlideZ + netTransZ);
    tibiaGroup.rotation.set(-rad, -totalERRad, -varusRad);

    // Articulate Patellofemoral tracking (Patella glides in femoral trochlea)
    if (patellaGroup) {
      var patellaZ = 21.0 - Math.sin(rad * 0.8) * 11.0;
      var patellaY = 16.0 - (flexionDeg / 120) * 24.0;
      patellaGroup.position.set(0, patellaY, patellaZ - 21.0);
      patellaGroup.rotation.x = -rad * 0.65;
      patellaGroup.visible = showPatella;
    }

    // 3. Dynamic Ligament Bundles deformation
    updateLigamentPaths(structures, kinematics, rad);

    // 4. Update Measurement Calipers & Arcs
    updateMeasurementAids(kinematics);
  }

  function updateLigamentPaths(structures, kinematics, flexionRad) {
    // Popliteus Tendon
    updateSingleLigament("popliteusTendon", structures.popliteusTendon, kinematics.deltaExternalRotationDeg > 3.5, [
      new THREE.Vector3(-21.5, 6, 2.5),
      new THREE.Vector3(-23.8, 0 - Math.sin(flexionRad) * 4.5, -4.0 - Math.sin(flexionRad) * 6.5),
      getTransformedTibialPoint(new THREE.Vector3(-22.5, -8, -11.5)),
      getTransformedTibialPoint(new THREE.Vector3(-18.5, -18, -15.0))
    ]);

    // Popliteofibular Ligament (PFL)
    updateSingleLigament("popliteofibularLigament", structures.popliteofibularLigament, kinematics.deltaExternalRotationDeg > 3.5, [
      getTransformedTibialPoint(new THREE.Vector3(-18.5, -18, -15.0)),
      getTransformedTibialPoint(new THREE.Vector3(-22.8, -16.8, -13.5)),
      getTransformedTibialPoint(new THREE.Vector3(-26.8, -14.8, -11.8))
    ]);

    // Meniscopopliteal Fascicles (MPF)
    updateSingleLigament("meniscopoplitealFascicles", structures.meniscopoplitealFascicles, kinematics.deltaExternalRotationDeg > 4.0, [
      getTransformedTibialPoint(new THREE.Vector3(-17.5, -10.5, -11.0)),
      getTransformedTibialPoint(new THREE.Vector3(-20.5, -11.5, -11.8)),
      getTransformedTibialPoint(new THREE.Vector3(-22.5, -8, -11.5))
    ]);

    // Popliteus Muscle Belly
    updateSingleLigament("popliteusMuscle", true, false, [
      getTransformedTibialPoint(new THREE.Vector3(-18.5, -18, -15.0)),
      getTransformedTibialPoint(new THREE.Vector3(-8.0, -27, -13.2)),
      getTransformedTibialPoint(new THREE.Vector3(2.5, -35, -11.8)),
      getTransformedTibialPoint(new THREE.Vector3(8.5, -43, -10.5))
    ]);

    // Fibular Collateral Ligament (FCL / LCL)
    updateSingleLigament("fibularCollateralLigament", structures.fibularCollateralLigament, kinematics.varusAngleDeg > 7.0, [
      new THREE.Vector3(-23.2, 14.5, -2.2),
      new THREE.Vector3(-27.0, 0 - Math.sin(flexionRad) * 2.5, -5.5 - Math.sin(flexionRad) * 4.5),
      getTransformedTibialPoint(new THREE.Vector3(-33.2, -22, -9.5))
    ]);

    // Anterior Cruciate Ligament (ACL)
    var aclStrained = kinematics.aclGraftStressMultiplier > 1.5;
    updateSingleLigament("anteriorCruciateLigament", structures.anteriorCruciateLigament, aclStrained, [
      new THREE.Vector3(-8.5, 13, -7.5),
      new THREE.Vector3(-3.2, 0, -2.2),
      getTransformedTibialPoint(new THREE.Vector3(1.5, -10.8, 6.2))
    ]);

    // Posterior Cruciate Ligament (PCL)
    updateSingleLigament("posteriorCruciateLigament", structures.posteriorCruciateLigament, kinematics.posteriorTranslationMm > 7.5, [
      new THREE.Vector3(7.5, 11, 4.5),
      new THREE.Vector3(2.5, 2.5, -1.8),
      getTransformedTibialPoint(new THREE.Vector3(-2.2, -13.2, -12.5))
    ]);

    // Superficial MCL
    updateSingleLigament("medialCollateralLigament", true, false, [
      new THREE.Vector3(24.5, 14, 0.5),
      new THREE.Vector3(25.5, 0, 1.2),
      getTransformedTibialPoint(new THREE.Vector3(21.0, -26, 2.5))
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
      mesh.material = ligamentMaterialTorn;
      mesh.scale.set(0.65, 0.65, 0.65);
      return;
    }

    mesh.scale.set(1.0, 1.0, 1.0);
    mesh.material = isStrained ? ligamentMaterialStrained : ligamentMaterialIntact;

    try {
      var newCurve = new THREE.CatmullRomCurve3(worldPoints);
      mesh.geometry.dispose();
      mesh.geometry = new THREE.TubeGeometry(newCurve, 24, mesh.userData.radius, 12, false);
    } catch(e) {}
  }

  function updateMeasurementAids(kinematics) {
    if (kinematics.varusOpeningMm > 5.0 || kinematics.deltaVarusOpeningMm > 1.0) {
      caliperGroup.visible = true;
      var latFemur = new THREE.Vector3(-23, 6, 0);
      var latTibia = getTransformedTibialPoint(new THREE.Vector3(-23, -11, 0));
      caliperGroup.children[0].geometry.setFromPoints([latFemur, latTibia]);
      caliperGroup.children[0].computeLineDistances();
    } else {
      caliperGroup.visible = false;
    }

    if (kinematics.externalRotationDeg > 11.0) {
      rotationArcGroup.visible = true;
    } else {
      rotationArcGroup.visible = false;
    }
  }

  // --- CAMERA AND DISPLAY TOGGLE CONTROLS ---

  function setCameraView(presetName) {
    if (!camera || !controls) return;
    switch(presetName) {
      case "anterolateral":
        camera.position.set(-90, 18, 105);
        controls.target.set(0, -6, 0);
        break;
      case "posterolateral": // "The Dark Side of the Knee"
        camera.position.set(-100, -8, -100);
        controls.target.set(-16, -16, -10);
        break;
      case "lateral":
        camera.position.set(-135, -4, 0);
        controls.target.set(0, -10, 0);
        break;
      case "anterior":
        camera.position.set(0, 4, 135);
        controls.target.set(0, -6, 0);
        break;
      case "axial":
        camera.position.set(0, 130, 8);
        controls.target.set(0, -16, 0);
        break;
    }
    controls.update();
  }

  function togglePatella(visible) {
    showPatella = (visible !== undefined) ? visible : !showPatella;
    if (patellaGroup) patellaGroup.visible = showPatella;
    return showPatella;
  }

  function toggleSurgicalReconstruction(visible) {
    showSurgicalRecon = (visible !== undefined) ? visible : !showSurgicalRecon;
    if (surgicalGraftGroup) surgicalGraftGroup.visible = showSurgicalRecon;
    return showSurgicalRecon;
  }

  function toggleLandmarks(visible) {
    showLandmarks = (visible !== undefined) ? visible : !showLandmarks;
    if (landmarkGroup) landmarkGroup.visible = showLandmarks;
    return showLandmarks;
  }

  function toggleXrayMode() {
    isXrayMode = !isXrayMode;
    var targetMat = isXrayMode ? boneXrayMaterial : boneMaterial;

    femurGroup.traverse(function(child) {
      if (child.isMesh && child.material === (isXrayMode ? boneMaterial : boneXrayMaterial)) {
        child.material = targetMat;
      }
    });
    tibiaGroup.traverse(function(child) {
      if (child.isMesh && child.material === (isXrayMode ? boneMaterial : boneXrayMaterial)) {
        child.material = targetMat;
      }
    });
    fibulaGroup.traverse(function(child) {
      if (child.isMesh && child.material === (isXrayMode ? boneMaterial : boneXrayMaterial)) {
        child.material = targetMat;
      }
    });
    return isXrayMode;
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
    togglePatella: togglePatella,
    toggleSurgicalReconstruction: toggleSurgicalReconstruction,
    toggleLandmarks: toggleLandmarks,
    toggleXrayMode: toggleXrayMode
  };
})();
