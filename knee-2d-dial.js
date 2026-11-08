/**
 * 2D Biomechanics & Dial Test Simulator
 * 1. Axial Plateau Inverted 'Y' Vector Mechanics
 * 2. Prone Bilateral Dial Test Simulator (30° vs 90° Flexion)
 * Validated against Dr. Robert F. LaPrade & Dr. Jorge Chahla clinical cadaveric criteria.
 */

window.Knee2DViewer = (function() {
  var axialCanvas, axialCtx;
  var dialCanvas, dialCtx;
  var dialFlexionAngle = 30; // Toggle 30° vs 90° for Dial Test

  function init(axialCanvasId, dialCanvasId) {
    axialCanvas = document.getElementById(axialCanvasId);
    dialCanvas = document.getElementById(dialCanvasId);

    if (axialCanvas) axialCtx = axialCanvas.getContext("2d");
    if (dialCanvas) dialCtx = dialCanvas.getContext("2d");

    // Handle high DPI
    resizeCanvas(axialCanvas, axialCtx);
    resizeCanvas(dialCanvas, dialCtx);

    window.addEventListener("resize", function() {
      resizeCanvas(axialCanvas, axialCtx);
      resizeCanvas(dialCanvas, dialCtx);
      if (window._lastKinematics) {
        update(window._lastKinematics, window._lastStructures, window._lastFlexion);
      }
    });
  }

  function resizeCanvas(canvas, ctx) {
    if (!canvas || !ctx) return;
    var rect = canvas.getBoundingClientRect();
    var dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
  }

  function update(kinematics, structures, flexionDeg) {
    window._lastKinematics = kinematics;
    window._lastStructures = structures;
    window._lastFlexion = flexionDeg;

    if (axialCtx && axialCanvas) {
      drawAxialBiomechanics(axialCtx, axialCanvas, kinematics, structures, flexionDeg);
    }
    if (dialCtx && dialCanvas) {
      drawDialTest(dialCtx, dialCanvas, kinematics, structures);
    }
  }

  function setDialFlexion(angle) {
    dialFlexionAngle = angle;
    if (window._lastKinematics) {
      update(window._lastKinematics, window._lastStructures, window._lastFlexion);
    }
  }

  // --- 1. AXIAL TIBIAL PLATEAU & INVERTED 'Y' VECTOR MECHANICS ---

  function drawAxialBiomechanics(ctx, canvas, kinematics, structures, flexionDeg) {
    var width = canvas.getBoundingClientRect().width;
    var height = canvas.getBoundingClientRect().height;
    ctx.clearRect(0, 0, width, height);

    var cx = width * 0.5;
    var cy = height * 0.52;
    var scale = Math.min(width, height) / 320;

    // Background Grid
    drawSubtleGrid(ctx, width, height);

    // Title & Legend
    ctx.fillStyle = "#94a3b8";
    ctx.font = "600 12px sans-serif";
    ctx.fillText("AXIAL VIEW: TIBIAL PLATEAU & POSTEROLATERAL CORNER", 14, 20);

    ctx.font = "10px sans-serif";
    ctx.fillStyle = "#64748b";
    ctx.fillText("Top-down transverse section showing Inverted 'Y' Vector & Popliteal Hiatus", 14, 34);

    // Current Tibial External Rotation Angle
    var erAngleRad = (kinematics.externalRotationDeg * Math.PI) / 180;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-erAngleRad); // Rotate tibial plateau with kinematics

    // 1. Tibial Plateau Outlines (Medial & Lateral Condyles)
    ctx.fillStyle = "rgba(237, 235, 228, 0.12)";
    ctx.strokeStyle = "rgba(237, 235, 228, 0.4)";
    ctx.lineWidth = 2;

    // Lateral Plateau (circular/convex)
    ctx.beginPath();
    ctx.ellipse(-55 * scale, 0, 42 * scale, 48 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Medial Plateau (oval/concave, larger)
    ctx.beginPath();
    ctx.ellipse(55 * scale, 0, 48 * scale, 56 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Intercondylar Eminence & Tibial Spine
    ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
    ctx.beginPath();
    ctx.ellipse(0, -6 * scale, 12 * scale, 22 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Lateral & Medial Menisci
    // Lateral Meniscus with POPLITEAL HIATUS (interruption postero-laterally)
    ctx.strokeStyle = structures.meniscopoplitealFascicles ? "#38bdf8" : "#f43f5e";
    ctx.lineWidth = 7 * scale;
    ctx.lineCap = "round";

    ctx.beginPath();
    // Arc leaving aperture at posterolateral corner (popliteal hiatus)
    ctx.arc(-55 * scale, 0, 32 * scale, Math.PI * 0.1, Math.PI * 1.55);
    ctx.stroke();

    // Popliteal Hiatus label
    ctx.fillStyle = structures.meniscopoplitealFascicles ? "#38bdf8" : "#fb7185";
    ctx.font = "600 9px monospace";
    ctx.fillText("POPLITEAL HIATUS", -110 * scale, 40 * scale);

    // Medial Meniscus (C-shaped)
    ctx.strokeStyle = "#64748b";
    ctx.beginPath();
    ctx.arc(55 * scale, 0, 38 * scale, -Math.PI * 0.42, Math.PI * 0.42);
    ctx.stroke();

    // Cruciate Ligament footprints
    ctx.fillStyle = structures.anteriorCruciateLigament ? "#10b981" : "#f43f5e";
    ctx.beginPath();
    ctx.arc(-6 * scale, -18 * scale, 6 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "700 8px sans-serif";
    ctx.fillText("ACL", -8 * scale, -26 * scale);

    ctx.fillStyle = structures.posteriorCruciateLigament ? "#8b5cf6" : "#f43f5e";
    ctx.beginPath();
    ctx.arc(4 * scale, 26 * scale, 7 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.fillText("PCL", 2 * scale, 40 * scale);

    // 3. Proximal Fibular Head & Styloid Process
    ctx.fillStyle = "rgba(237, 235, 228, 0.25)";
    ctx.strokeStyle = "rgba(237, 235, 228, 0.6)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(-102 * scale, 34 * scale, 15 * scale, 18 * scale, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Fibular Styloid Tip
    ctx.fillStyle = "#38bdf8";
    ctx.beginPath();
    ctx.arc(-96 * scale, 24 * scale, 3.5 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#94a3b8";
    ctx.font = "9px sans-serif";
    ctx.fillText("Fibular Styloid", -145 * scale, 20 * scale);

    // 4. Popliteus Musculotendinous Junction & PFL (The Inverted 'Y')
    var mtjX = -65 * scale;
    var mtjY = 46 * scale;

    // Musculotendinous Junction dot
    ctx.fillStyle = "#f59e0b";
    ctx.beginPath();
    ctx.arc(mtjX, mtjY, 4.5 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = "700 9px sans-serif";
    ctx.fillText("MTJ", mtjX - 8, mtjY + 16);

    // PFL Branch (MTJ -> Fibular Styloid)
    ctx.strokeStyle = structures.popliteofibularLigament ? "#06b6d4" : "#f43f5e";
    ctx.lineWidth = 4 * scale;
    if (!structures.popliteofibularLigament) ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(mtjX, mtjY);
    ctx.lineTo(-96 * scale, 24 * scale);
    ctx.stroke();
    ctx.setLineDash([]);

    // Popliteus Muscle Belly Vector (MTJ -> Posteromedial Tibia)
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 6 * scale;
    ctx.beginPath();
    ctx.moveTo(mtjX, mtjY);
    ctx.lineTo(25 * scale, 68 * scale);
    ctx.stroke();

    // Popliteus Tendon through Hiatus towards Femoral Sulcus
    ctx.strokeStyle = structures.popliteusTendon ? "#38bdf8" : "#f43f5e";
    ctx.lineWidth = 4.5 * scale;
    if (!structures.popliteusTendon) ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(mtjX, mtjY);
    ctx.quadraticCurveTo(-85 * scale, 8 * scale, -98 * scale, -20 * scale);
    ctx.stroke();
    ctx.setLineDash([]);

    // 5. Center of Rotation (ICR)
    // In intact knee: Near medial tibial spine (resisting pivot)
    // When PLC is cut: Shifts anteromedially, causing abnormal rotatory axis
    var icrX = (!structures.popliteusTendon && !structures.fibularCollateralLigament) ? 14 * scale : -2 * scale;
    var icrY = (!structures.popliteusTendon && !structures.fibularCollateralLigament) ? -14 * scale : 2 * scale;

    ctx.fillStyle = "#f43f5e";
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(icrX, icrY, 5 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.font = "700 9px monospace";
    ctx.fillText("ICR (Axis)", icrX + 8, icrY - 6);

    // Moment Arm Vector Line from ICR to Popliteus
    ctx.strokeStyle = "rgba(245, 158, 11, 0.6)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(icrX, icrY);
    ctx.lineTo(mtjX, mtjY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();

    // Floating Telemetry Box (bottom-right)
    ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
    ctx.strokeStyle = "rgba(56, 189, 248, 0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(width - 165, height - 75, 150, 65, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#94a3b8";
    ctx.font = "600 10px sans-serif";
    ctx.fillText("ROTATORY MOMENT ARM", width - 155, height - 58);
    ctx.font = "700 14px monospace";
    ctx.fillStyle = structures.popliteusTendon ? "#34d399" : "#fb7185";
    ctx.fillText(structures.popliteusTendon ? "r = 42.5 mm" : "DEFICIENT", width - 155, height - 38);
    ctx.font = "9px sans-serif";
    ctx.fillStyle = "#64748b";
    ctx.fillText(structures.popliteusTendon ? "Resisting Ext Torque" : "Rotatory Slip Present", width - 155, height - 22);
  }

  // --- 2. THE PRONE DIAL TEST SIMULATOR ---

  function drawDialTest(ctx, canvas, kinematics, structures) {
    var width = canvas.getBoundingClientRect().width;
    var height = canvas.getBoundingClientRect().height;
    ctx.clearRect(0, 0, width, height);

    var dAngle = dialFlexionAngle; // 30° or 90°

    // Calculate Dial Test Rotation for both knees
    // Left Knee (Normal Uninjured Contralateral Baseline)
    var normalER = (dAngle === 30) ? 12.0 : 8.0;

    // Right Knee (Injured Knee)
    var deltaER = (dAngle === 30) ? kinematics.dialTestDifference30 : kinematics.dialTestDifference90;
    var injuredER = normalER + deltaER;
    var sideToSideDiff = deltaER;

    // Header & Flexion Toggle Status
    ctx.fillStyle = "#94a3b8";
    ctx.font = "700 12px sans-serif";
    ctx.fillText("THE DIAL TEST (BILATERAL PRONE EVALUATION)", 14, 20);

    ctx.font = "10px sans-serif";
    ctx.fillStyle = "#38bdf8";
    ctx.fillText("Current Flexion Arc: " + dAngle + "°  |  Standard 5 N·m External Torque Applied", 14, 34);

    // Positions for Left and Right Foot Dials
    var leftDialCX = width * 0.28;
    var rightDialCX = width * 0.72;
    var dialCY = height * 0.52;
    var dialRadius = Math.min(width * 0.2, height * 0.32);

    // 1. Draw Left Compass Dial (Contralateral Normal)
    drawSingleFootDial(ctx, leftDialCX, dialCY, dialRadius, -normalER, "LEFT KNEE (NORMAL)", "Baseline ER: " + normalER.toFixed(1) + "°", false);

    // 2. Draw Right Compass Dial (Injured Knee)
    var isPositive = sideToSideDiff >= 10.0;
    drawSingleFootDial(ctx, rightDialCX, dialCY, dialRadius, -injuredER, "RIGHT KNEE (INJURED)", "ER: " + injuredER.toFixed(1) + "° (Δ +" + sideToSideDiff.toFixed(1) + "°)", isPositive);

    // 3. Central Diagnostic Banner
    drawDialDiagnosticBanner(ctx, width, height, dAngle, sideToSideDiff, structures);
  }

  function drawSingleFootDial(ctx, cx, cy, radius, rotationDeg, label, sublabel, isPositive) {
    // Outer Protractor Ring
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Degree Ticks (every 10°)
    for (var a = 0; a < 360; a += 10) {
      var rad = (a * Math.PI) / 180;
      var isMajor = (a % 30 === 0);
      var innerR = radius - (isMajor ? 8 : 4);
      var x1 = cx + Math.cos(rad) * radius;
      var y1 = cy + Math.sin(rad) * radius;
      var x2 = cx + Math.cos(rad) * innerR;
      var y2 = cy + Math.sin(rad) * innerR;

      ctx.strokeStyle = isMajor ? "rgba(255, 255, 255, 0.3)" : "rgba(255, 255, 255, 0.1)";
      ctx.lineWidth = isMajor ? 1.5 : 0.8;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Foot Plantar Silhouette rotated by external rotation angle
    // In prone position, neutral foot points straight UP (-90°)
    var footAngleRad = ((-90 + rotationDeg) * Math.PI) / 180;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(footAngleRad + Math.PI / 2);

    // Foot Sole Shape
    ctx.fillStyle = isPositive ? "rgba(244, 63, 94, 0.25)" : "rgba(56, 189, 248, 0.25)";
    ctx.strokeStyle = isPositive ? "#fb7185" : "#38bdf8";
    ctx.lineWidth = 2;

    ctx.beginPath();
    // Heel
    ctx.ellipse(0, 20, 14, 18, 0, 0, Math.PI);
    // Midfoot to forefoot
    ctx.lineTo(16, -25);
    // Toes curve
    ctx.ellipse(4, -38, 16, 20, 0, 0, Math.PI, true);
    ctx.lineTo(-14, 20);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Longitudinal Axis Pointer
    ctx.strokeStyle = isPositive ? "#f43f5e" : "#0284c7";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, 32);
    ctx.lineTo(0, -55);
    ctx.stroke();

    ctx.restore();

    // Labels below dial
    ctx.fillStyle = "#fff";
    ctx.font = "700 11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(label, cx, cy + radius + 22);

    ctx.font = "600 11px monospace";
    ctx.fillStyle = isPositive ? "#fb7185" : "#38bdf8";
    ctx.fillText(sublabel, cx, cy + radius + 38);
    ctx.textAlign = "start";
  }

  function drawDialDiagnosticBanner(ctx, width, height, angle, diff, structures) {
    var bannerY = height - 60;
    var bannerH = 50;

    var isPositive = diff >= 10.0;
    var statusTitle = "";
    var statusDesc = "";
    var statusColor = "";

    if (!structures.popliteusTendon && !structures.popliteofibularLigament && !structures.fibularCollateralLigament && !structures.posteriorCruciateLigament) {
      statusTitle = "COMBINED PCL + PLC INJURY (SEVERE ROTATORY & POSTERIOR DROP)";
      statusDesc = "External rotation asymmetry >= 15° at BOTH 30° AND 90° flexion. Massive posterior sag present.";
      statusColor = "#f43f5e";
    } else if (isPositive) {
      if (angle === 30) {
        statusTitle = "POSITIVE DIAL TEST AT 30° (>10° ASYMMETRY): ISOLATED PLC / POPLITEUS";
        statusDesc = "Pathognomonic for Posterolateral Corner injury. Test at 90° to evaluate PCL integrity.";
        statusColor = "#f59e0b";
      } else {
        statusTitle = "PERSISTENT POSITIVE DIAL TEST AT 90°: CONCOMITANT PCL INJURY SUSPECTED";
        statusDesc = "If ER does not reduce at 90°, the PCL is deficient or secondary capsular restraints are torn.";
        statusColor = "#f43f5e";
      }
    } else {
      if (diff >= 3.0) {
        statusTitle = "MILD / ISOLATED POPLITEUS TENDON TEAR (Δ ~3-6°)";
        statusDesc = "Increased ER without gross PLC dislocation. FCL intact prevents macro-varus laxity.";
        statusColor = "#38bdf8";
      } else {
        statusTitle = "NEGATIVE DIAL TEST (< 5° ASYMMETRY: PHYSIOLOGIC SYMMETRY)";
        statusDesc = "Normal bilateral external rotation. Intact popliteus complex, PFL, and FCL checkreins.";
        statusColor = "#10b981";
      }
    }

    ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
    ctx.strokeStyle = statusColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(14, bannerY, width - 28, bannerH, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = statusColor;
    ctx.font = "700 11px sans-serif";
    ctx.fillText(statusTitle, 26, bannerY + 18);

    ctx.fillStyle = "#cbd5e1";
    ctx.font = "10px sans-serif";
    ctx.fillText(statusDesc, 26, bannerY + 36);
  }

  function drawSubtleGrid(ctx, w, h) {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
    ctx.lineWidth = 1;
    for (var x = 0; x < w; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (var y = 0; y < h; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  }

  return {
    init: init,
    update: update,
    setDialFlexion: setDialFlexion
  };
})();
