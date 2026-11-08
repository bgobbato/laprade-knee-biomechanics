/**
 * High-Fidelity 3D Knee Anatomical & Biomechanical Engine (Three.js)
 * Powered by CT-Segmented Bone Geometries (BodyParts3D) and Cadaveric
 * Kinematics from Dr. Robert F. LaPrade & Dr. Jorge Chahla.
 *
 * Real anatomical bones:
 * - Distal Femur with Popliteal Sulcus & Lateral Epicondyle
 * - Proximal Tibia with Medial/Lateral Plateaus & Tuberosity
 * - Proximal Fibula with Styloid Process Apex
 * - Patella with Trochlear Articulation
 * - Popliteus Muscle Belly & Dynamic Inverted 'Y' Tendon Complex
 *
 * Plus LaPrade Anatomic Reconstruction Overlay (Two 18.5mm Femoral Tunnels,
 * Fibular Tunnel, Tibial Tunnel, and Dual Anatomic Grafts).
 */

window.Knee3DViewer = (function() {
  var container, scene, camera, renderer, controls;
  var femurGroup, tibiaGroup, fibulaGroup, patellaGroup, jointSystem;
  var ligamentMeshes = {};
  var surgicalGraftGroup, landmarkGroup, caliperGroup, rotationArcGroup;
  var isInitialized = false;

  // Real CT Meshes vs Fallback
  var ctMeshesLoaded = false;
  var loadedMeshCount = 0;
  var totalMeshesToLoad = 5;
  var meshMeshes = {};

  // Materials
  var boneMaterial, boneXrayMaterial, cartilageMaterial, meniscusMaterial;
  var ligamentMaterialIntact, ligamentMaterialStrained, ligamentMaterialTorn;
  var graftMaterial, tunnelMaterial, patellarTendonMaterial, popliteusMuscleMaterial;

  // Display toggles
  var showPatella = true;
  var showSurgicalRecon = false;
  var showLandmarks = true;
  var isXrayMode = false;

  // Current kinematic parameters
  var currentFlexion = 0;
  var currentKinematics = null;
  var currentStructures = null;

  // Exact Anatomical Landmarks (Millimeters, calibrated from BodyParts3D CT + LaPrade Cadaveric Metrics)
  var LANDMARKS = {
    // Distal Femur (Femur Local / World at 0° flexion)
    femurCenter: new THREE.Vector3(0, 15, 0),
    popliteusFemurSulcus: new THREE.Vector3(-33.4, 33.0, -16.7),    // Anterior-inferior popliteal sulcus
    fclFemurEpicondyle: new THREE.Vector3(-41.2, 34.0, 0.0),       // 1.4mm posterior & 3.1mm proximal to lateral epicondyle (18.5mm to popliteus)
    latEpicondyleProminence: new THREE.Vector3(-39.1, 28.2, -1.6),
    aclFemurNotch: new THREE.Vector3(-12.0, 18.0, -12.0),          // Medial wall lateral condyle
    pclFemurNotch: new THREE.Vector3(8.0, 16.0, 4.0),              // Lateral wall medial condyle
    mclFemurEpicondyle: new THREE.Vector3(25.0, 24.0, -2.0),

    // Proximal Tibia (Tibia Local)
    tibiaCenter: new THREE.Vector3(0, -15, 0),
    latTibialPlateauCenter: new THREE.Vector3(-21.0, -3.9, 4.3),
    medTibialPlateauCenter: new THREE.Vector3(15.7, -4.4, 4.2),
    tibialTuberosity: new THREE.Vector3(-8.96, -31.38, 34.88),
    gerdysTubercle: new THREE.Vector3(-22.0, -22.0, 16.0),
    popliteusTendonHiatus: new THREE.Vector3(-35.0, 5.0, -18.0),   // Popliteal hiatus at lateral joint line
    popliteusMTJ: new THREE.Vector3(-28.0, -14.0, -20.0),          // Musculotendinous junction
    popliteusTibialInsertion: new THREE.Vector3(10.0, -65.0, -5.0),// Posteromedial tibia
    aclTibiaFootprint: new THREE.Vector3(2.0, 1.5, 10.0),          // Anterior to intercondylar spine
    pclTibiaFootprint: new THREE.Vector3(0.0, -6.0, -22.0),        // Posterior intercondylar fossa / PCL facet
    mclTibiaInsertion: new THREE.Vector3(22.0, -35.0, 2.0),

    // Fibula (Rigidly coupled to Tibia Local)
    fibularStyloidApex: new THREE.Vector3(-37.35, -12.63, -15.22), // Insertion of PFL
    fclFibularHead: new THREE.Vector3(-50.55, -29.35, -8.4),       // Anterolateral fibular head

    // Patella
    patellaDistalPole: new THREE.Vector3(-8.0, -6.0, 32.0),
    patellaSuperiorPole: new THREE.Vector3(-8.0, 32.0, 32.0)
  };

  function init(containerId) {
    container = document.getElementById(containerId);
    if (!container) return;

    var width = container.clientWidth || 800;
    var height = container.clientHeight || 600;

    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070b14);
    scene.fog = new THREE.FogExp2(0x070b14, 0.0016);

    // Perspective Camera calibrated for millimeter-scale knee joint
    camera = new THREE.PerspectiveCamera(40, width / height, 1, 1500);
    camera.position.set(-110, 25, 125);

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
    controls.maxPolarAngle = Math.PI * 0.90;
    controls.minDistance = 40;
    controls.maxDistance = 450;
    controls.target.set(-12, -8, 0);

    setupStudioLighting();
    setupMaterials();
    setupJointHierarchy();

    // Load Real CT Meshes with Fallback
    loadAnatomicalCTMeshes();

    // Build soft tissue structures
    createDetailedMenisci(tibiaGroup);
    createEnhancedLigamentBundles();
    setupSurgicalReconstructionOverlay();
    setupEnhancedMeasurementAids();

    window.addEventListener("resize", onWindowResize);
    isInitialized = true;
    animate();
  }

  function setupStudioLighting() {
    // Ambient soft skylight
    var hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x0f172a, 0.70);
    scene.add(hemiLight);

    // Main Key Light (Anterolateral Studio)
    var keyLight = new THREE.DirectionalLight(0xffffff, 1.05);
    keyLight.position.set(-100, 130, 110);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    // Posterolateral Corner Rim Light (Crucial for the "Dark Side of the Knee")
    var plcRimLight = new THREE.DirectionalLight(0x38bdf8, 0.95);
    plcRimLight.position.set(-110, -20, -110);
    scene.add(plcRimLight);

    // Medial Condyle Soft Fill Light
    var medialFill = new THREE.DirectionalLight(0x94a3b8, 0.55);
    medialFill.position.set(110, 30, 50);
    scene.add(medialFill);

    // Distal Accent Light
    var distalLight = new THREE.PointLight(0x0284c7, 0.6, 300);
    distalLight.position.set(-30, -80, -40);
    scene.add(distalLight);

    // Studio Stage Floor Grid
    var grid = new THREE.GridHelper(450, 45, 0x1e293b, 0x0f172a);
    grid.position.y = -110;
    scene.add(grid);
  }

  function setupMaterials() {
    // Anatomical Cortical Bone (Organic Ivory with Micro-roughness)
    boneMaterial = new THREE.MeshStandardMaterial({
      color: 0xedebe1,
      roughness: 0.35,
      metalness: 0.05,
      flatShading: false
    });

    // Bone X-Ray / Translucent Mode
    boneXrayMaterial = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.20,
      metalness: 0.10,
      transparent: true,
      opacity: 0.25,
      wireframe: false
    });

    // Articular Hyaline Cartilage (Pearlescent translucent)
    cartilageMaterial = new THREE.MeshStandardMaterial({
      color: 0xe0f2fe,
      roughness: 0.12,
      metalness: 0.08,
      transparent: true,
      opacity: 0.88
    });

    // Fibrocartilage Meniscus (Dense gray-ivory)
    meniscusMaterial = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.45,
      metalness: 0.04
    });

    // Healthy Intact Ligaments (Medical Cyan)
    ligamentMaterialIntact = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.30,
      metalness: 0.15
    });

    // High Strain Ligaments (Amber warning)
    ligamentMaterialStrained = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.25,
      metalness: 0.20
    });

    // Ruptured / Torn Ligament (Retracted Crimson)
    ligamentMaterialTorn = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      roughness: 0.60,
      transparent: true,
      opacity: 0.32,
      wireframe: true
    });

    // Patellar Tendon & Extensor Material
    patellarTendonMaterial = new THREE.MeshStandardMaterial({
      color: 0xdbeafe,
      roughness: 0.42,
      metalness: 0.05
    });

    // Popliteus Muscle Belly Material
    popliteusMuscleMaterial = new THREE.MeshStandardMaterial({
      color: 0xd9534f,
      roughness: 0.55,
      metalness: 0.05,
      side: THREE.DoubleSide
    });

    // Surgical Grafts (LaPrade Anatomic Reconstruction: Split Achilles / Semitendinosus)
    graftMaterial = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      roughness: 0.30,
      metalness: 0.15
    });

    // Bone Tunnels (Anodized reamed bone tunnel guides)
    tunnelMaterial = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.20,
      metalness: 0.65,
      transparent: true,
      opacity: 0.75
    });
  }

  function setupJointHierarchy() {
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
  }

  // --- ANATOMICAL CT MESH LOADER (BodyParts3D Segmented Anatomy) ---

  function loadAnatomicalCTMeshes() {
    updateFidelityBadge("loading", "Loading High-Fidelity CT Anatomical Meshes (BodyParts3D)...");

    if (typeof THREE.STLLoader === "undefined") {
      console.warn("THREE.STLLoader not available, falling back to procedural anatomy.");
      buildFallbackProceduralBones();
      updateFidelityBadge("fallback", "Procedural Bone Model Active (STLLoader Offline)");
      return;
    }

    var loader = new THREE.STLLoader();
    var meshConfigs = [
      { key: "femur", path: "models/femur_anatomic.stl", targetGroup: femurGroup, mat: boneMaterial },
      { key: "tibia", path: "models/tibia_anatomic.stl", targetGroup: tibiaGroup, mat: boneMaterial },
      { key: "fibula", path: "models/fibula_anatomic.stl", targetGroup: fibulaGroup, mat: boneMaterial },
      { key: "patella", path: "models/patella_anatomic.stl", targetGroup: patellaGroup, mat: boneMaterial },
      { key: "popliteus", path: "models/popliteus_anatomic.stl", targetGroup: tibiaGroup, mat: popliteusMuscleMaterial }
    ];

    loadedMeshCount = 0;
    var loadErrors = 0;

    meshConfigs.forEach(function(config) {
      loader.load(
        config.path,
        function(geometry) {
          geometry.computeVertexNormals();
          var mesh = new THREE.Mesh(geometry, config.mat);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          config.targetGroup.add(mesh);
          meshMeshes[config.key] = mesh;

          loadedMeshCount++;
          if (loadedMeshCount === totalMeshesToLoad) {
            ctMeshesLoaded = true;
            updateFidelityBadge("loaded", "🦴 Real Anatomical CT Meshes: Active (BodyParts3D / 1:1 Scale)");
          }
        },
        undefined,
        function(error) {
          console.warn("Could not load mesh: " + config.path, error);
          loadErrors++;
          if (loadErrors > 0 && !ctMeshesLoaded) {
            buildFallbackProceduralBones();
            updateFidelityBadge("fallback", "Procedural Bone Model Active (Mesh fetch error)");
          }
        }
      );
    });
  }

  function updateFidelityBadge(status, text) {
    var badge = document.getElementById("meshFidelityBadge");
    var label = document.getElementById("meshFidelityText");
    if (!badge || !label) return;

    label.textContent = text;
    badge.className = "mesh-fidelity-badge " + status;
  }

  // --- FALLBACK PROCEDURAL BONES (Used only if STL fetch is blocked) ---

  function buildFallbackProceduralBones() {
    // 1. Procedural Femur
    var shaftGeo = new THREE.CylinderGeometry(11, 14, 90, 32);
    var shaft = new THREE.Mesh(shaftGeo, boneMaterial);
    shaft.position.set(0, 55, 0);
    shaft.castShadow = true;
    femurGroup.add(shaft);

    var latCondyleGeo = new THREE.SphereGeometry(17, 36, 28);
    latCondyleGeo.scale(0.85, 1.05, 1.45);
    var latCondyle = new THREE.Mesh(latCondyleGeo, boneMaterial);
    latCondyle.position.set(-22, 12, -2);
    femurGroup.add(latCondyle);

    var medCondyleGeo = new THREE.SphereGeometry(18, 36, 28);
    medCondyleGeo.scale(0.90, 1.12, 1.55);
    var medCondyle = new THREE.Mesh(medCondyleGeo, boneMaterial);
    medCondyle.position.set(22, 10, 0);
    femurGroup.add(medCondyle);

    // 2. Procedural Tibia
    var plateauGeo = new THREE.CylinderGeometry(28, 24, 18, 36);
    plateauGeo.scale(1.15, 1.0, 0.95);
    var plateau = new THREE.Mesh(plateauGeo, boneMaterial);
    plateau.position.set(0, -18, 0);
    tibiaGroup.add(plateau);

    var tibShaftGeo = new THREE.CylinderGeometry(16, 11, 100, 28);
    var tibShaft = new THREE.Mesh(tibShaftGeo, boneMaterial);
    tibShaft.position.set(0, -75, 0);
    tibiaGroup.add(tibShaft);

    // 3. Procedural Fibula
    var fibHeadGeo = new THREE.SphereGeometry(8.5, 24, 20);
    fibHeadGeo.scale(0.9, 1.3, 1.05);
    var fibHead = new THREE.Mesh(fibHeadGeo, boneMaterial);
    fibHead.position.set(-42, -22, -10);
    fibulaGroup.add(fibHead);

    var fibShaftGeo = new THREE.CylinderGeometry(4.8, 3.5, 95, 16);
    var fibShaft = new THREE.Mesh(fibShaftGeo, boneMaterial);
    fibShaft.position.set(-42, -75, -10);
    fibulaGroup.add(fibShaft);

    // 4. Procedural Patella
    var patGeo = new THREE.SphereGeometry(11, 24, 20);
    patGeo.scale(1.15, 1.35, 0.65);
    var patMesh = new THREE.Mesh(patGeo, boneMaterial);
    patMesh.position.set(-8, 14, 34);
    patellaGroup.add(patMesh);
  }

  // --- MENISCI & SOFT TISSUES ---

  function createDetailedMenisci(parent) {
    // 1. Lateral Meniscus (O-shaped, with the POPLITEAL HIATUS aperture)
    var latMenCurve = new THREE.EllipseCurve(-21.0, 4.0, 13.5, 14.5, 0, Math.PI * 1.62, false, 0);
    var latPoints = latMenCurve.getPoints(32).map(function(p) { return new THREE.Vector3(p.x, -1.8, p.y); });
    var latMenGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(latPoints), 32, 2.8, 10, false);
    var latMenMesh = new THREE.Mesh(latMenGeo, meniscusMaterial);
    parent.add(latMenMesh);

    // 2. Medial Meniscus (C-shaped, attached to deep MCL)
    var medMenCurve = new THREE.EllipseCurve(16.0, 4.0, 14.5, 16.0, -Math.PI * 0.44, Math.PI * 0.44, false, 0);
    var medPoints = medMenCurve.getPoints(32).map(function(p) { return new THREE.Vector3(p.x, -1.8, p.y); });
    var medMenGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(medPoints), 32, 3.0, 10, false);
    var medMenMesh = new THREE.Mesh(medMenGeo, meniscusMaterial);
    parent.add(medMenMesh);
  }

  // --- MULTI-BUNDLE LIGAMENT STRUCTURES ---

  function createEnhancedLigamentBundles() {
    // 1. Popliteus Tendon (Anterior-inferior popliteal sulcus -> Popliteal hiatus -> MTJ)
    ligamentMeshes.popliteusTendon = createMultiStrandTendon([
      LANDMARKS.popliteusFemurSulcus,
      new THREE.Vector3(-34.5, 20.0, -17.5),
      LANDMARKS.popliteusTendonHiatus,
      LANDMARKS.popliteusMTJ
    ], 2.8, 0x38bdf8);
    scene.add(ligamentMeshes.popliteusTendon);

    // 2. Popliteofibular Ligament (PFL: Inverted 'Y' construct MTJ -> Fibular Styloid)
    ligamentMeshes.popliteofibularLigament = createMultiStrandTendon([
      LANDMARKS.popliteusMTJ,
      new THREE.Vector3(-32.5, -13.5, -17.5),
      LANDMARKS.fibularStyloidApex
    ], 2.2, 0x06b6d4);
    scene.add(ligamentMeshes.popliteofibularLigament);

    // 3. Meniscopopliteal Fascicles (MPF: Anchors lateral meniscus posterior horn to popliteus sheath)
    ligamentMeshes.meniscopoplitealFascicles = createMultiStrandTendon([
      new THREE.Vector3(-22.0, -5.0, -16.0),
      new THREE.Vector3(-28.0, -2.0, -17.0),
      LANDMARKS.popliteusTendonHiatus
    ], 1.4, 0x67e8f9);
    scene.add(ligamentMeshes.meniscopoplitealFascicles);

    // 4. Popliteus Dynamic Musculotendinous Band (MTJ fanning across posteromedial proximal tibia)
    ligamentMeshes.popliteusMuscle = createMultiStrandTendon([
      LANDMARKS.popliteusMTJ,
      new THREE.Vector3(-18.0, -28.0, -17.0),
      new THREE.Vector3(-2.0, -45.0, -12.0),
      LANDMARKS.popliteusTibialInsertion
    ], 4.2, 0xd9534f);
    scene.add(ligamentMeshes.popliteusMuscle);

    // 5. Fibular Collateral Ligament (FCL / LCL: 18.5 mm proximal-posterior to Popliteus footprint)
    ligamentMeshes.fibularCollateralLigament = createMultiStrandTendon([
      LANDMARKS.fclFemurEpicondyle,
      new THREE.Vector3(-46.0, 2.0, -4.0),
      LANDMARKS.fclFibularHead
    ], 3.0, 0x3b82f6);
    scene.add(ligamentMeshes.fibularCollateralLigament);

    // 6. Anterior Cruciate Ligament (ACL: Notch -> Anterior Tibial Spine)
    ligamentMeshes.anteriorCruciateLigament = createMultiStrandTendon([
      LANDMARKS.aclFemurNotch,
      new THREE.Vector3(-5.0, 10.0, -1.0),
      LANDMARKS.aclTibiaFootprint
    ], 3.8, 0x38bdf8);
    scene.add(ligamentMeshes.anteriorCruciateLigament);

    // 7. Posterior Cruciate Ligament (PCL: Notch -> Posterior PCL Facet)
    ligamentMeshes.posteriorCruciateLigament = createMultiStrandTendon([
      LANDMARKS.pclFemurNotch,
      new THREE.Vector3(4.0, 5.0, -9.0),
      LANDMARKS.pclTibiaFootprint
    ], 4.2, 0x38bdf8);
    scene.add(ligamentMeshes.posteriorCruciateLigament);

    // 8. Superficial Medial Collateral Ligament (sMCL)
    ligamentMeshes.medialCollateralLigament = createMultiStrandTendon([
      LANDMARKS.mclFemurEpicondyle,
      new THREE.Vector3(25.0, 0.0, 0.0),
      LANDMARKS.mclTibiaInsertion
    ], 3.2, 0x38bdf8);
    scene.add(ligamentMeshes.medialCollateralLigament);

    // 9. Patellar Tendon (Distal pole of patella to tibial tuberosity)
    ligamentMeshes.patellarTendon = createMultiStrandTendon([
      LANDMARKS.patellaDistalPole,
      new THREE.Vector3(-8.5, -18.0, 33.5),
      LANDMARKS.tibialTuberosity
    ], 4.2, 0xdbeafe);
    scene.add(ligamentMeshes.patellarTendon);

    // 10. Quadriceps Tendon
    ligamentMeshes.quadricepsTendon = createMultiStrandTendon([
      LANDMARKS.patellaSuperiorPole,
      new THREE.Vector3(-8.0, 55.0, 28.0),
      new THREE.Vector3(-8.0, 80.0, 24.0)
    ], 4.8, 0xdbeafe);
    scene.add(ligamentMeshes.quadricepsTendon);
  }

  function createMultiStrandTendon(controlPoints, radius, colorHex) {
    var curve = new THREE.CatmullRomCurve3(controlPoints);
    var geo = new THREE.TubeGeometry(curve, 24, radius, 12, false);
    var mat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.32,
      metalness: 0.12
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.userData = { radius: radius, initialPoints: controlPoints };
    return mesh;
  }

  // --- LAPRADE ANATOMIC RECONSTRUCTION SURGICAL OVERLAY ---

  function setupSurgicalReconstructionOverlay() {
    surgicalGraftGroup = new THREE.Group();

    // 1. Femoral Tunnels (Two 9mm Tunnels Spaced Precisely 18.5 mm Apart)
    // Tunnel A: Popliteus Tunnel in Popliteal Sulcus
    var popTunnelCurve = new THREE.LineCurve3(
      LANDMARKS.popliteusFemurSulcus,
      new THREE.Vector3(-15.0, 48.0, 5.0)
    );
    var popTunnel = new THREE.Mesh(new THREE.TubeGeometry(popTunnelCurve, 12, 4.5, 16, false), tunnelMaterial);
    surgicalGraftGroup.add(popTunnel);

    // Tunnel B: FCL Tunnel (1.4mm post & 3.1mm prox to lateral epicondyle)
    var fclTunnelCurve = new THREE.LineCurve3(
      LANDMARKS.fclFemurEpicondyle,
      new THREE.Vector3(-22.0, 50.0, 18.0)
    );
    var fclTunnel = new THREE.Mesh(new THREE.TubeGeometry(fclTunnelCurve, 12, 4.5, 16, false), tunnelMaterial);
    surgicalGraftGroup.add(fclTunnel);

    // 2. Fibular Tunnel (7mm Reamed Tunnel from Anterolateral Head to Posteromedial Styloid)
    var fibTunnelCurve = new THREE.LineCurve3(
      LANDMARKS.fclFibularHead,
      LANDMARKS.fibularStyloidApex
    );
    var fibTunnel = new THREE.Mesh(new THREE.TubeGeometry(fibTunnelCurve, 12, 3.5, 16, false), tunnelMaterial);
    fibulaGroup.add(fibTunnel);

    // 3. Tibial Tunnel (9mm Tunnel from Anteromedial Proximal Flat Spot to Popliteus Fossa)
    var tibTunnelCurve = new THREE.LineCurve3(
      new THREE.Vector3(-5.0, -30.0, 30.0),
      new THREE.Vector3(-20.0, -16.0, -22.0)
    );
    var tibTunnel = new THREE.Mesh(new THREE.TubeGeometry(tibTunnelCurve, 16, 4.5, 16, false), tunnelMaterial);
    tibiaGroup.add(tibTunnel);

    // 4. Anatomic Grafts (Split Achilles / Semitendinosus Allografts)
    // Graft 1: Reconstructed FCL (Femoral Tunnel -> Fibular Head)
    var reconFclCurve = new THREE.CatmullRomCurve3([
      LANDMARKS.fclFemurEpicondyle,
      new THREE.Vector3(-46.0, 2.0, -4.0),
      LANDMARKS.fclFibularHead
    ]);
    var reconFcl = new THREE.Mesh(new THREE.TubeGeometry(reconFclCurve, 20, 3.0, 12, false), graftMaterial);
    surgicalGraftGroup.add(reconFcl);

    // Graft 2: Reconstructed Popliteus & PFL (Inverted 'Y' construct)
    var reconPopCurve = new THREE.CatmullRomCurve3([
      LANDMARKS.popliteusFemurSulcus,
      LANDMARKS.popliteusTendonHiatus,
      new THREE.Vector3(-20.0, -16.0, -22.0) // Entering posterior tibial tunnel
    ]);
    var reconPop = new THREE.Mesh(new THREE.TubeGeometry(reconPopCurve, 20, 3.2, 12, false), graftMaterial);
    surgicalGraftGroup.add(reconPop);

    surgicalGraftGroup.visible = false;
    femurGroup.add(surgicalGraftGroup);
  }

  // --- ANATOMICAL MEASUREMENT AIDS & CALIPERS ---

  function setupEnhancedMeasurementAids() {
    landmarkGroup = new THREE.Group();

    // 1. 18.5 mm Anatomic Distance Bracket between Popliteus & FCL
    var bridgeGeo = new THREE.BufferGeometry().setFromPoints([
      LANDMARKS.fclFemurEpicondyle,
      LANDMARKS.popliteusFemurSulcus
    ]);
    var bridgeLine = new THREE.Line(bridgeGeo, new THREE.LineDashedMaterial({
      color: 0x38bdf8,
      dashSize: 1.5,
      gapSize: 0.8
    }));
    bridgeLine.computeLineDistances();
    landmarkGroup.add(bridgeLine);

    // Anatomical Pins
    var pFCL = createLandmarkPin(LANDMARKS.fclFemurEpicondyle, 0x3b82f6);
    var pPop = createLandmarkPin(LANDMARKS.popliteusFemurSulcus, 0x06b6d4);
    var pStyloid = createLandmarkPin(LANDMARKS.fibularStyloidApex, 0x10b981);
    var pGerdys = createLandmarkPin(LANDMARKS.gerdysTubercle, 0xf59e0b);

    landmarkGroup.add(pFCL);
    landmarkGroup.add(pPop);
    femurGroup.add(landmarkGroup);
    fibulaGroup.add(pStyloid);
    tibiaGroup.add(pGerdys);

    // 2. Lateral Compartment Gapping Caliper (Varus stress radiograph measurement)
    caliperGroup = new THREE.Group();
    var caliperLineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-39.0, 10.0, 0.0),
      new THREE.Vector3(-39.0, -5.0, 0.0)
    ]);
    var caliperLine = new THREE.Line(caliperLineGeo, new THREE.LineDashedMaterial({
      color: 0xf59e0b,
      dashSize: 2,
      gapSize: 1
    }));
    caliperLine.computeLineDistances();
    caliperGroup.add(caliperLine);

    var tickGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-43, 10, 0),
      new THREE.Vector3(-35, 10, 0)
    ]);
    var tick1 = new THREE.Line(tickGeo, new THREE.LineBasicMaterial({ color: 0xf59e0b, linewidth: 2 }));
    var tick2 = tick1.clone();
    tick2.position.y = -15;
    caliperGroup.add(tick1);
    caliperGroup.add(tick2);
    caliperGroup.visible = false;
    scene.add(caliperGroup);

    // 3. Tibial External Rotation Compass Arc
    rotationArcGroup = new THREE.Group();
    var arcCurve = new THREE.EllipseCurve(0, 0, 32, 32, 0, Math.PI * 0.45, false, 0);
    var arcPoints = arcCurve.getPoints(36).map(function(p) { return new THREE.Vector3(p.x, -12.0, p.y); });
    var arcLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(arcPoints), new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 2 }));
    rotationArcGroup.add(arcLine);
    rotationArcGroup.visible = false;
    tibiaGroup.add(rotationArcGroup);
  }

  function createLandmarkPin(pos, colorHex) {
    var g = new THREE.Group();
    var sphere = new THREE.Mesh(new THREE.SphereGeometry(1.6, 16, 16), new THREE.MeshBasicMaterial({ color: colorHex }));
    sphere.position.copy(pos);
    g.add(sphere);
    return g;
  }

  // --- KINEMATIC UPDATE ENGINE (6-DOF Cadaveric Kinematics) ---

  function updateKinematics(kinematics, flexionDeg, structures) {
    if (!isInitialized) return;
    currentFlexion = flexionDeg;
    currentKinematics = kinematics;
    currentStructures = structures;

    var rad = THREE.MathUtils.degToRad(flexionDeg);

    // 1. Physiological Roll-and-Glide kinematics (Femoral condyle rollback)
    var rollGlideZ = -Math.sin(rad) * 14.0;
    var rollGlideY = -Math.cos(rad) * 3.5 + 3.5;

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

    // Articulate Tibia & Fibula relative to Distal Femur
    tibiaGroup.position.set(0, rollGlideY - (lateralGappingMm * 0.45), rollGlideZ + netTransZ);
    tibiaGroup.rotation.set(-rad, -totalERRad, -varusRad);

    // Articulate Patellofemoral tracking (Patella tracks femoral trochlea)
    if (patellaGroup) {
      var patellaZ = -Math.sin(rad * 0.8) * 12.0;
      var patellaY = -(flexionDeg / 120) * 26.0;
      patellaGroup.position.set(0, patellaY, patellaZ);
      patellaGroup.rotation.x = -rad * 0.65;
      patellaGroup.visible = showPatella;
    }

    // 3. Dynamic Ligament Bundles deformation & strain coloring
    updateLigamentPaths(structures, kinematics, rad);

    // 4. Update Measurement Calipers & Arcs
    updateMeasurementAids(kinematics);
  }

  function getTransformedTibialPoint(localPoint) {
    var v = localPoint.clone();
    tibiaGroup.localToWorld(v);
    return v;
  }

  function updateLigamentPaths(structures, kinematics, flexionRad) {
    if (!structures) return;

    // Popliteus Tendon (Sulcus -> Hiatus -> MTJ)
    updateSingleLigament("popliteusTendon", structures.popliteusTendon, kinematics.deltaExternalRotationDeg > 3.5, [
      LANDMARKS.popliteusFemurSulcus,
      new THREE.Vector3(-34.5, 20.0 - Math.sin(flexionRad) * 4.5, -17.5 - Math.sin(flexionRad) * 7.0),
      getTransformedTibialPoint(LANDMARKS.popliteusTendonHiatus),
      getTransformedTibialPoint(LANDMARKS.popliteusMTJ)
    ]);

    // Popliteofibular Ligament (PFL)
    updateSingleLigament("popliteofibularLigament", structures.popliteofibularLigament, kinematics.deltaExternalRotationDeg > 3.5, [
      getTransformedTibialPoint(LANDMARKS.popliteusMTJ),
      getTransformedTibialPoint(new THREE.Vector3(-32.5, -13.5, -17.5)),
      getTransformedTibialPoint(LANDMARKS.fibularStyloidApex)
    ]);

    // Meniscopopliteal Fascicles (MPF)
    updateSingleLigament("meniscopoplitealFascicles", structures.meniscopoplitealFascicles, kinematics.deltaExternalRotationDeg > 4.0, [
      getTransformedTibialPoint(new THREE.Vector3(-22.0, -5.0, -16.0)),
      getTransformedTibialPoint(new THREE.Vector3(-28.0, -2.0, -17.0)),
      getTransformedTibialPoint(LANDMARKS.popliteusTendonHiatus)
    ]);

    // Popliteus Dynamic Musculotendinous Band
    updateSingleLigament("popliteusMuscle", true, false, [
      getTransformedTibialPoint(LANDMARKS.popliteusMTJ),
      getTransformedTibialPoint(new THREE.Vector3(-18.0, -28.0, -17.0)),
      getTransformedTibialPoint(new THREE.Vector3(-2.0, -45.0, -12.0)),
      getTransformedTibialPoint(LANDMARKS.popliteusTibialInsertion)
    ]);

    // Fibular Collateral Ligament (FCL / LCL)
    updateSingleLigament("fibularCollateralLigament", structures.fibularCollateralLigament, kinematics.varusAngleDeg > 7.0, [
      LANDMARKS.fclFemurEpicondyle,
      new THREE.Vector3(-46.0, 2.0 - Math.sin(flexionRad) * 2.5, -4.0 - Math.sin(flexionRad) * 5.0),
      getTransformedTibialPoint(LANDMARKS.fclFibularHead)
    ]);

    // Anterior Cruciate Ligament (ACL)
    var aclStrained = kinematics.aclGraftStressMultiplier > 1.5;
    updateSingleLigament("anteriorCruciateLigament", structures.anteriorCruciateLigament, aclStrained, [
      LANDMARKS.aclFemurNotch,
      new THREE.Vector3(-5.0, 10.0, -1.0),
      getTransformedTibialPoint(LANDMARKS.aclTibiaFootprint)
    ]);

    // Posterior Cruciate Ligament (PCL)
    updateSingleLigament("posteriorCruciateLigament", structures.posteriorCruciateLigament, kinematics.posteriorTranslationMm > 7.5, [
      LANDMARKS.pclFemurNotch,
      new THREE.Vector3(4.0, 5.0, -9.0),
      getTransformedTibialPoint(LANDMARKS.pclTibiaFootprint)
    ]);

    // Superficial Medial Collateral Ligament (sMCL)
    updateSingleLigament("medialCollateralLigament", true, false, [
      LANDMARKS.mclFemurEpicondyle,
      new THREE.Vector3(25.0, 0.0, 0.0),
      getTransformedTibialPoint(LANDMARKS.mclTibiaInsertion)
    ]);

    // Patellar Tendon
    if (showPatella) {
      updateSingleLigament("patellarTendon", true, false, [
        patellaGroup.localToWorld(LANDMARKS.patellaDistalPole.clone()),
        getTransformedTibialPoint(new THREE.Vector3(-8.5, -18.0, 33.5)),
        getTransformedTibialPoint(LANDMARKS.tibialTuberosity)
      ]);

      // Quadriceps Tendon
      updateSingleLigament("quadricepsTendon", true, false, [
        patellaGroup.localToWorld(LANDMARKS.patellaSuperiorPole.clone()),
        new THREE.Vector3(-8.0, 55.0, 28.0),
        new THREE.Vector3(-8.0, 80.0, 24.0)
      ]);
    }
  }

  function updateSingleLigament(key, isIntact, isStrained, worldPoints) {
    var mesh = ligamentMeshes[key];
    if (!mesh) return;

    if (!isIntact) {
      mesh.material = ligamentMaterialTorn;
      mesh.scale.set(0.60, 0.60, 0.60);
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
      var latFemur = new THREE.Vector3(-39.0, 10.0, 0.0);
      var latTibia = getTransformedTibialPoint(new THREE.Vector3(-39.0, -5.0, 0.0));
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
        camera.position.set(-110, 25, 125);
        controls.target.set(-12, -8, 0);
        break;
      case "posterolateral": // "The Dark Side of the Knee"
        camera.position.set(-120, -5, -120);
        controls.target.set(-20, -15, -10);
        break;
      case "lateral":
        camera.position.set(-160, -5, 0);
        controls.target.set(-20, -15, 0);
        break;
      case "anterior":
        camera.position.set(0, 10, 160);
        controls.target.set(0, -10, 0);
        break;
      case "axial":
        camera.position.set(0, 160, 5);
        controls.target.set(0, -10, 0);
        break;
    }
    controls.update();
  }

  function togglePatella(visible) {
    showPatella = (visible !== undefined) ? visible : !showPatella;
    if (patellaGroup) patellaGroup.visible = showPatella;
    if (ligamentMeshes.patellarTendon) ligamentMeshes.patellarTendon.visible = showPatella;
    if (ligamentMeshes.quadricepsTendon) ligamentMeshes.quadricepsTendon.visible = showPatella;
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

    [femurGroup, tibiaGroup, fibulaGroup, patellaGroup].forEach(function(grp) {
      grp.traverse(function(child) {
        if (child.isMesh && (child.material === boneMaterial || child.material === boneXrayMaterial)) {
          child.material = targetMat;
        }
      });
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
