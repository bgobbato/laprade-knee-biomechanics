/**
 * Real-Time Kinematic Graphs (HTML5 Canvas Engine)
 * 1. External Rotation (deg) vs Flexion Angle (0°-90°)
 * 2. Lateral Compartment Opening (mm) vs Flexion Angle (with 2.7 mm & 4.0 mm LaPrade thresholds)
 * 3. In-Situ Tension on ACL Graft vs PLC Integrity (The Markolf & LaPrade failure cascade)
 */

window.KneeCharts = (function() {
  var erCanvas, erCtx;
  var varusCanvas, varusCtx;
  var aclCanvas, aclCtx;

  function init(erId, varusId, aclId) {
    erCanvas = document.getElementById(erId);
    varusCanvas = document.getElementById(varusId);
    aclCanvas = document.getElementById(aclId);

    if (erCanvas) erCtx = erCanvas.getContext("2d");
    if (varusCanvas) varusCtx = varusCanvas.getContext("2d");
    if (aclCanvas) aclCtx = aclCanvas.getContext("2d");

    resizeAll();
    window.addEventListener("resize", function() {
      resizeAll();
      if (window._lastChartData) {
        update(window._lastChartData.kinematics, window._lastChartData.structures, window._lastChartData.flexionDeg, window._lastChartData.forces);
      }
    });
  }

  function resizeAll() {
    [erCanvas, varusCanvas, aclCanvas].forEach(function(canvas) {
      if (!canvas) return;
      var rect = canvas.getBoundingClientRect();
      var dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      var ctx = canvas.getContext("2d");
      ctx.scale(dpr, dpr);
    });
  }

  function update(kinematics, structures, flexionDeg, forces) {
    window._lastChartData = {
      kinematics: kinematics,
      structures: structures,
      flexionDeg: flexionDeg,
      forces: forces
    };

    if (erCtx && erCanvas) drawERChart(erCtx, erCanvas, kinematics, structures, flexionDeg, forces);
    if (varusCtx && varusCanvas) drawVarusChart(varusCtx, varusCanvas, kinematics, structures, flexionDeg, forces);
    if (aclCtx && aclCanvas) drawACLStressChart(aclCtx, aclCanvas, kinematics, structures, forces);
  }

  // --- CHART 1: EXTERNAL ROTATION VS FLEXION ---

  function drawERChart(ctx, canvas, currentKinematics, structures, currentFlexion, forces) {
    var w = canvas.getBoundingClientRect().width;
    var h = canvas.getBoundingClientRect().height;
    ctx.clearRect(0, 0, w, h);

    var padding = { top: 35, right: 30, bottom: 35, left: 45 };
    var plotW = w - padding.left - padding.right;
    var plotH = h - padding.top - padding.bottom;

    // Header Title
    ctx.fillStyle = "#fff";
    ctx.font = "700 12px sans-serif";
    ctx.fillText("TIBIAL EXTERNAL ROTATION (5 N·m Torque)", padding.left, 18);

    ctx.fillStyle = "#64748b";
    ctx.font = "10px sans-serif";
    ctx.fillText("Flexion Arc: 0° to 90° (LaPrade AJSM 2004 & 2010)", padding.left, 30);

    var maxER = 32; // degrees max Y
    var minER = 0;

    // Draw Axes & Grid
    drawGridLines(ctx, padding, plotW, plotH, [0, 10, 20, 30], "°", [0, 30, 60, 90], "°");

    // 1. Intact Baseline Curve (Cyan / Gray)
    var intactAngles = [0, 20, 30, 60, 90];
    var intactValues = [8.3, 10.5, 12.6, 9.8, 7.8];
    drawLineCurve(ctx, padding, plotW, plotH, intactAngles, intactValues, 90, maxER, "rgba(148, 163, 184, 0.6)", 2, [4, 4]);

    // 2. Current State Simulated Curve across 0°-90°
    var sampleAngles = [0, 10, 20, 30, 45, 60, 75, 90];
    var stateValues = sampleAngles.map(function(ang) {
      var k = window.KneeBiomechanicsData.calculateKinematics(structures, ang, forces);
      return k.externalRotationDeg;
    });

    var stateColor = (!structures.popliteusTendon && !structures.fibularCollateralLigament) ? "#f43f5e" : (!structures.popliteusTendon ? "#f59e0b" : "#38bdf8");
    drawLineCurve(ctx, padding, plotW, plotH, sampleAngles, stateValues, 90, maxER, stateColor, 3, []);

    // 3. Current Flexion Indicator Point
    var curX = padding.left + (Math.min(90, currentFlexion) / 90) * plotW;
    var curY = padding.top + plotH - (currentKinematics.externalRotationDeg / maxER) * plotH;

    ctx.fillStyle = "#fff";
    ctx.strokeStyle = stateColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(curX, curY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Value tooltip callout
    ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
    ctx.strokeStyle = stateColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(curX - 25, curY - 26, 50, 18, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.font = "700 10px monospace";
    ctx.textAlign = "center";
    ctx.fillText(currentKinematics.externalRotationDeg.toFixed(1) + "°", curX, curY - 14);
    ctx.textAlign = "start";

    // Legend
    drawLegendItem(ctx, w - 170, 18, "Intact Native", "rgba(148, 163, 184, 0.8)", true);
    drawLegendItem(ctx, w - 85, 18, "Current State", stateColor, false);
  }

  // --- CHART 2: LATERAL COMPARTMENT OPENING (VARUS) & LAPRADE THRESHOLDS ---

  function drawVarusChart(ctx, canvas, currentKinematics, structures, currentFlexion, forces) {
    var w = canvas.getBoundingClientRect().width;
    var h = canvas.getBoundingClientRect().height;
    ctx.clearRect(0, 0, w, h);

    var padding = { top: 35, right: 30, bottom: 35, left: 45 };
    var plotW = w - padding.left - padding.right;
    var plotH = h - padding.top - padding.bottom;

    ctx.fillStyle = "#fff";
    ctx.font = "700 12px sans-serif";
    ctx.fillText("LATERAL COMPARTMENT GAPPING / VARUS (mm)", padding.left, 18);

    ctx.fillStyle = "#64748b";
    ctx.font = "10px sans-serif";
    ctx.fillText("Stress Radiography Thresholds (LaPrade Criteria: 2.7mm & 4.0mm)", padding.left, 30);

    var maxMm = 28; // mm max Y
    drawGridLines(ctx, padding, plotW, plotH, [0, 5, 10, 15, 20, 25], "mm", [0, 30, 60, 90], "°");

    // Diagnostic Threshold Lines (LaPrade criteria)
    // 2.7 mm threshold (Isolated FCL)
    drawThresholdLine(ctx, padding, plotW, plotH, 2.7, maxMm, "rgba(245, 158, 11, 0.7)", "2.7 mm: Isolated FCL Rupture");

    // 4.0 mm threshold (Complete Grade III PLC)
    drawThresholdLine(ctx, padding, plotW, plotH, 4.0, maxMm, "rgba(244, 63, 94, 0.7)", "4.0 mm: Complete Grade III PLC");

    // 1. Intact Baseline Curve
    var intactAngles = [0, 20, 30, 60, 90];
    var intactValues = [3.2, 5.8, 8.2, 8.9, 7.1];
    drawLineCurve(ctx, padding, plotW, plotH, intactAngles, intactValues, 90, maxMm, "rgba(148, 163, 184, 0.6)", 2, [4, 4]);

    // 2. Current State Curve
    var sampleAngles = [0, 10, 20, 30, 45, 60, 75, 90];
    var stateValues = sampleAngles.map(function(ang) {
      var k = window.KneeBiomechanicsData.calculateKinematics(structures, ang, forces);
      return k.varusOpeningMm;
    });

    var stateColor = (!structures.fibularCollateralLigament && !structures.popliteusTendon) ? "#f43f5e" : (!structures.fibularCollateralLigament ? "#f59e0b" : "#38bdf8");
    drawLineCurve(ctx, padding, plotW, plotH, sampleAngles, stateValues, 90, maxMm, stateColor, 3, []);

    // 3. Current Flexion Marker
    var curX = padding.left + (Math.min(90, currentFlexion) / 90) * plotW;
    var curY = padding.top + plotH - (currentKinematics.varusOpeningMm / maxMm) * plotH;

    ctx.fillStyle = "#fff";
    ctx.strokeStyle = stateColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(curX, curY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Callout box
    ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
    ctx.strokeStyle = stateColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(curX - 28, curY - 26, 56, 18, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.font = "700 10px monospace";
    ctx.textAlign = "center";
    ctx.fillText(currentKinematics.varusOpeningMm.toFixed(1) + " mm", curX, curY - 14);
    ctx.textAlign = "start";
  }

  // --- CHART 3: ACL GRAFT IN-SITU TENSILE FORCE VS PLC DEFICIENCY ---

  function drawACLStressChart(ctx, canvas, kinematics, structures, forces) {
    var w = canvas.getBoundingClientRect().width;
    var h = canvas.getBoundingClientRect().height;
    ctx.clearRect(0, 0, w, h);

    var padding = { top: 35, right: 30, bottom: 45, left: 55 };
    var plotW = w - padding.left - padding.right;
    var plotH = h - padding.top - padding.bottom;

    ctx.fillStyle = "#fff";
    ctx.font = "700 12px sans-serif";
    ctx.fillText("IN-SITU FORCE ON ACL GRAFT UNDER COMBINED VARUS & ROTATION", padding.left, 18);

    ctx.fillStyle = "#64748b";
    ctx.font = "10px sans-serif";
    ctx.fillText("Markolf JBJS 2007 & LaPrade AJSM 1999: Unaddressed PLC causes graft failure", padding.left, 30);

    // Bar Chart of 4 Clinical Scenarios:
    // 1. Intact PLC (100% baseline)
    // 2. Isolated Popliteus Tear (125% load)
    // 3. Isolated FCL Tear (160% load)
    // 4. Complete PLC Tear (240% load - Catastrophic Failure Risk!)
    var scenarios = [
      { name: "Intact PLC", multiplier: 1.0, color: "#10b981", active: (structures.popliteusTendon && structures.fibularCollateralLigament) },
      { name: "Isolated Popliteus", multiplier: 1.25, color: "#38bdf8", active: (!structures.popliteusTendon && structures.fibularCollateralLigament) },
      { name: "Isolated FCL", multiplier: 1.60, color: "#f59e0b", active: (structures.popliteusTendon && !structures.fibularCollateralLigament) },
      { name: "Complete PLC", multiplier: 2.45, color: "#f43f5e", active: (!structures.popliteusTendon && !structures.fibularCollateralLigament) }
    ];

    var barWidth = plotW / (scenarios.length * 1.8);
    var slotW = plotW / scenarios.length;

    // Y Axis (0% to 300%)
    drawGridLines(ctx, padding, plotW, plotH, [0, 100, 200, 300], "%", [], "");

    // 100% Baseline Line
    var y100 = padding.top + plotH - (100 / 300) * plotH;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padding.left, y100);
    ctx.lineTo(padding.left + plotW, y100);
    ctx.stroke();
    ctx.setLineDash([]);

    // 150% Danger Zone Line
    var yDanger = padding.top + plotH - (150 / 300) * plotH;
    ctx.strokeStyle = "rgba(244, 63, 94, 0.45)";
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(padding.left, yDanger);
    ctx.lineTo(padding.left + plotW, yDanger);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#fb7185";
    ctx.font = "9px sans-serif";
    ctx.fillText("Graft Fatigue & Failure Threshold (>150%)", padding.left + 8, yDanger - 4);

    // Draw Bars
    scenarios.forEach(function(scen, i) {
      var bx = padding.left + i * slotW + (slotW - barWidth) * 0.5;
      var percent = scen.multiplier * 100;
      var bh = (percent / 300) * plotH;
      var by = padding.top + plotH - bh;

      // Highlight active scenario
      if (scen.active) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
        ctx.fillRect(padding.left + i * slotW + 4, padding.top, slotW - 8, plotH);
        ctx.strokeStyle = scen.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(padding.left + i * slotW + 4, padding.top, slotW - 8, plotH);
      }

      ctx.fillStyle = scen.color;
      ctx.beginPath();
      ctx.roundRect(bx, by, barWidth, bh, [6, 6, 0, 0]);
      ctx.fill();

      // Value label on top
      ctx.fillStyle = "#fff";
      ctx.font = "700 11px monospace";
      ctx.textAlign = "center";
      ctx.fillText(percent.toFixed(0) + "%", bx + barWidth * 0.5, by - 6);

      // Scenario name below
      ctx.fillStyle = scen.active ? "#fff" : "#94a3b8";
      ctx.font = scen.active ? "700 10px sans-serif" : "500 9px sans-serif";
      ctx.fillText(scen.name, bx + barWidth * 0.5, padding.top + plotH + 18);
      ctx.textAlign = "start";
    });
  }

  // --- HELPER DRAWING UTILITIES ---

  function drawGridLines(ctx, padding, plotW, plotH, yValues, yUnit, xValues, xUnit) {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
    ctx.lineWidth = 1;

    // Y Grid lines
    var maxY = yValues[yValues.length - 1];
    yValues.forEach(function(val) {
      var y = padding.top + plotH - (val / maxY) * plotH;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + plotW, y);
      ctx.stroke();

      ctx.fillStyle = "#64748b";
      ctx.font = "9px monospace";
      ctx.textAlign = "right";
      ctx.fillText(val + yUnit, padding.left - 6, y + 3);
      ctx.textAlign = "start";
    });

    // X Grid lines
    if (xValues.length > 0) {
      var maxX = xValues[xValues.length - 1];
      xValues.forEach(function(val) {
        var x = padding.left + (val / maxX) * plotW;
        ctx.beginPath();
        ctx.moveTo(x, padding.top);
        ctx.lineTo(x, padding.top + plotH);
        ctx.stroke();

        ctx.fillStyle = "#64748b";
        ctx.font = "9px monospace";
        ctx.textAlign = "center";
        ctx.fillText(val + xUnit, x, padding.top + plotH + 16);
        ctx.textAlign = "start";
      });
    }
  }

  function drawLineCurve(ctx, padding, plotW, plotH, xPoints, yPoints, maxX, maxY, color, lineWidth, lineDash) {
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.setLineDash(lineDash || []);
    ctx.beginPath();

    for (var i = 0; i < xPoints.length; i++) {
      var px = padding.left + (xPoints[i] / maxX) * plotW;
      var py = padding.top + plotH - (yPoints[i] / maxY) * plotH;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawThresholdLine(ctx, padding, plotW, plotH, thresholdVal, maxY, color, label) {
    var y = padding.top + plotH - (thresholdVal / maxY) * plotH;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(padding.left + plotW, y);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = color;
    ctx.font = "600 8.5px sans-serif";
    ctx.fillText(label, padding.left + plotW - 160, y - 4);
  }

  function drawLegendItem(ctx, x, y, label, color, isDashed) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    if (isDashed) ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(x, y - 3);
    ctx.lineTo(x + 16, y - 3);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "9px sans-serif";
    ctx.fillText(label, x + 22, y);
  }

  return {
    init: init,
    update: update
  };
})();
