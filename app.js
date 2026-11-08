/**
 * Main Application Controller
 * Coordinates 3D View, 2D Axial & Dial View, Kinematic Charts, Controls, and Clinical Exams.
 */

(function() {
  // Global Application State
  var state = {
    flexionDeg: 0,
    forces: {
      externalRotationTorque: 5.0, // Nm
      varusTorque: 10.0, // Nm
      anteriorLoad: 0, // N
      posteriorLoad: 0 // N
    },
    structures: {
      popliteusTendon: true,
      popliteofibularLigament: true,
      fibularCollateralLigament: true,
      anteriorCruciateLigament: true,
      posteriorCruciateLigament: true,
      meniscopoplitealFascicles: true
    },
    currentPreset: "intact",
    activeTab: "view-3d",
    dialFlexion: 30
  };

  // DOM Elements cache
  var elements = {};

  document.addEventListener("DOMContentLoaded", function() {
    cacheDOMElements();
    setupEventListeners();
    initModules();
    renderReferencesTab();
    applyPreset("intact");
  });

  function cacheDOMElements() {
    elements.presetSelect = document.getElementById("presetSelect");
    elements.presetSubtitle = document.getElementById("presetSubtitle");
    elements.presetDesc = document.getElementById("presetDesc");

    // Sliders
    elements.sliderFlexion = document.getElementById("sliderFlexion");
    elements.valFlexion = document.getElementById("valFlexion");

    elements.sliderERTorque = document.getElementById("sliderERTorque");
    elements.valERTorque = document.getElementById("valERTorque");

    elements.sliderVarusTorque = document.getElementById("sliderVarusTorque");
    elements.valVarusTorque = document.getElementById("valVarusTorque");

    elements.sliderAntLoad = document.getElementById("sliderAntLoad");
    elements.valAntLoad = document.getElementById("valAntLoad");

    elements.sliderPostLoad = document.getElementById("sliderPostLoad");
    elements.valPostLoad = document.getElementById("valPostLoad");

    // Telemetry HUD
    elements.hudER = document.getElementById("hudER");
    elements.hudERDelta = document.getElementById("hudERDelta");
    elements.hudVarusMm = document.getElementById("hudVarusMm");
    elements.hudVarusDeltaMm = document.getElementById("hudVarusDeltaMm");
    elements.hudVarusDeg = document.getElementById("hudVarusDeg");
    elements.hudAntTrans = document.getElementById("hudAntTrans");
    elements.hudPostTrans = document.getElementById("hudPostTrans");
    elements.hudAclStressText = document.getElementById("hudAclStressText");
    elements.hudAclStressBar = document.getElementById("hudAclStressBar");
    elements.hudCalloutText = document.getElementById("hudCalloutText");

    // Dial test flexion toggle buttons
    elements.dialBtn30 = document.getElementById("dialBtn30");
    elements.dialBtn90 = document.getElementById("dialBtn90");

    // Tabs
    elements.tabs = document.querySelectorAll(".view-tab");
    elements.viewContainers = document.querySelectorAll(".view-container");
  }

  function initModules() {
    // Initialize 3D Engine
    window.Knee3DViewer.init("viewport3d");

    // Initialize 2D Engine
    window.Knee2DViewer.init("axialCanvas", "dialCanvas");

    // Initialize Kinematic Charts Engine
    window.KneeCharts.init("erChartCanvas", "varusChartCanvas", "aclChartCanvas");
  }

  function setupEventListeners() {
    // Preset change
    if (elements.presetSelect) {
      elements.presetSelect.addEventListener("change", function(e) {
        applyPreset(e.target.value);
      });
    }

    // Structure checkboxes / toggles
    var structKeys = ["popliteusTendon", "popliteofibularLigament", "fibularCollateralLigament", "anteriorCruciateLigament", "posteriorCruciateLigament", "meniscopoplitealFascicles"];
    structKeys.forEach(function(key) {
      var row = document.getElementById("toggle_" + key);
      if (row) {
        row.addEventListener("click", function() {
          state.structures[key] = !state.structures[key];
          updateStructureRowUI(key, state.structures[key]);
          state.currentPreset = "custom";
          if (elements.presetSelect) elements.presetSelect.value = "custom";
          if (elements.presetSubtitle) elements.presetSubtitle.textContent = "Custom Ligament Configuration";
          if (elements.presetDesc) elements.presetDesc.textContent = "Individually toggled structures to test specific biomechanical hypotheses.";
          recalculateAndRender();
        });
      }
    });

    // Slider inputs
    setupSlider(elements.sliderFlexion, elements.valFlexion, "°", function(val) {
      state.flexionDeg = parseFloat(val);
      recalculateAndRender();
    });

    setupSlider(elements.sliderERTorque, elements.valERTorque, " N·m", function(val) {
      state.forces.externalRotationTorque = parseFloat(val);
      recalculateAndRender();
    });

    setupSlider(elements.sliderVarusTorque, elements.valVarusTorque, " N·m", function(val) {
      state.forces.varusTorque = parseFloat(val);
      recalculateAndRender();
    });

    setupSlider(elements.sliderAntLoad, elements.valAntLoad, " N", function(val) {
      state.forces.anteriorLoad = parseFloat(val);
      recalculateAndRender();
    });

    setupSlider(elements.sliderPostLoad, elements.valPostLoad, " N", function(val) {
      state.forces.posteriorLoad = parseFloat(val);
      recalculateAndRender();
    });

    // Quick force buttons
    setupQuickButtons();

    // 3D Visualizer Toggles
    var btnToggleRecon = document.getElementById("btnToggleRecon");
    if (btnToggleRecon) {
      btnToggleRecon.addEventListener("click", function() {
        var active = window.Knee3DViewer.toggleSurgicalReconstruction();
        var badge = document.getElementById("badgeRecon");
        if (badge) {
          badge.textContent = active ? "ON" : "OFF";
          badge.style.color = active ? "#10b981" : "#64748b";
        }
      });
    }

    var btnTogglePatella = document.getElementById("btnTogglePatella");
    if (btnTogglePatella) {
      btnTogglePatella.addEventListener("click", function() {
        var active = window.Knee3DViewer.togglePatella();
        var badge = document.getElementById("badgePatella");
        if (badge) {
          badge.textContent = active ? "ON" : "OFF";
          badge.style.color = active ? "#38bdf8" : "#64748b";
        }
      });
    }

    var btnToggleXray = document.getElementById("btnToggleXray");
    if (btnToggleXray) {
      btnToggleXray.addEventListener("click", function() {
        var active = window.Knee3DViewer.toggleXrayMode();
        var badge = document.getElementById("badgeXray");
        if (badge) {
          badge.textContent = active ? "ON" : "OFF";
          badge.style.color = active ? "#38bdf8" : "#64748b";
        }
      });
    }

    var btnToggleLandmarks = document.getElementById("btnToggleLandmarks");
    if (btnToggleLandmarks) {
      btnToggleLandmarks.addEventListener("click", function() {
        var active = window.Knee3DViewer.toggleLandmarks();
        var badge = document.getElementById("badgeLandmarks");
        if (badge) {
          badge.textContent = active ? "ON" : "OFF";
          badge.style.color = active ? "#38bdf8" : "#64748b";
        }
      });
    }

    // Camera view buttons
    var camBtns = document.querySelectorAll(".cam-btn");
    camBtns.forEach(function(btn) {
      btn.addEventListener("click", function() {
        camBtns.forEach(function(b) { b.classList.remove("active"); });
        btn.classList.add("active");
        var view = btn.getAttribute("data-view");
        window.Knee3DViewer.setCameraView(view);
      });
    });

    // View tab switching
    elements.tabs.forEach(function(tab) {
      tab.addEventListener("click", function() {
        var target = tab.getAttribute("data-target");
        switchTab(target);
      });
    });

    // Dial test 30° vs 90° toggle
    if (elements.dialBtn30 && elements.dialBtn90) {
      elements.dialBtn30.addEventListener("click", function() {
        state.dialFlexion = 30;
        elements.dialBtn30.classList.add("active");
        elements.dialBtn90.classList.remove("active");
        window.Knee2DViewer.setDialFlexion(30);
      });
      elements.dialBtn90.addEventListener("click", function() {
        state.dialFlexion = 90;
        elements.dialBtn90.classList.add("active");
        elements.dialBtn30.classList.remove("active");
        window.Knee2DViewer.setDialFlexion(90);
      });
    }

    // Clinical examination action buttons
    setupClinicalExamButtons();
  }

  function setupSlider(slider, display, unit, onChange) {
    if (!slider || !display) return;
    slider.addEventListener("input", function() {
      display.textContent = slider.value + unit;
      onChange(slider.value);
    });
  }

  function setupQuickButtons() {
    var quickBtns = document.querySelectorAll(".quick-btn");
    quickBtns.forEach(function(btn) {
      btn.addEventListener("click", function() {
        var target = btn.getAttribute("data-slider");
        var val = btn.getAttribute("data-val");
        var slider = elements[target];
        if (slider) {
          slider.value = val;
          slider.dispatchEvent(new Event("input"));
        }
      });
    });
  }

  function switchTab(targetId) {
    elements.tabs.forEach(function(t) {
      if (t.getAttribute("data-target") === targetId) t.classList.add("active");
      else t.classList.remove("active");
    });

    elements.viewContainers.forEach(function(vc) {
      if (vc.id === targetId) vc.classList.add("active");
      else vc.classList.remove("active");
    });

    state.activeTab = targetId;

    // Trigger redraw for 2D or Charts if switched
    setTimeout(function() {
      window.dispatchEvent(new Event("resize"));
    }, 50);
  }

  function applyPreset(presetId) {
    var preset = window.KneeBiomechanicsData.presets[presetId];
    if (!preset) return;

    state.currentPreset = presetId;
    state.structures = Object.assign({}, preset.structures);

    if (elements.presetSelect) elements.presetSelect.value = presetId;
    if (elements.presetSubtitle) elements.presetSubtitle.textContent = preset.subtitle;
    if (elements.presetDesc) elements.presetDesc.textContent = preset.statusText;

    // Update structure toggle rows
    for (var key in state.structures) {
      updateStructureRowUI(key, state.structures[key]);
    }

    recalculateAndRender();
  }

  function updateStructureRowUI(key, isIntact) {
    var row = document.getElementById("toggle_" + key);
    if (!row) return;

    var dot = row.querySelector(".struct-dot");
    var pill = row.querySelector(".switch-pill");

    if (dot) {
      dot.className = "struct-dot " + (isIntact ? "intact" : "torn");
    }
    if (pill) {
      pill.className = "switch-pill " + (isIntact ? "intact" : "torn");
      pill.textContent = isIntact ? "Intact" : "Torn";
    }
  }

  function recalculateAndRender() {
    // 1. Calculate Kinematics from dataset engine
    var k = window.KneeBiomechanicsData.calculateKinematics(state.structures, state.flexionDeg, state.forces);

    // 2. Update HUD Telemetry
    updateHUD(k);

    // 3. Update 3D Engine
    window.Knee3DViewer.updateKinematics(k, state.flexionDeg, state.structures);

    // 4. Update 2D Engine
    window.Knee2DViewer.update(k, state.structures, state.flexionDeg);

    // 5. Update Kinematic Charts
    window.KneeCharts.update(k, state.structures, state.flexionDeg, state.forces);
  }

  function updateHUD(k) {
    if (elements.hudER) elements.hudER.textContent = k.externalRotationDeg.toFixed(1) + "°";
    if (elements.hudERDelta) {
      elements.hudERDelta.textContent = (k.deltaExternalRotationDeg > 0.3) ? "(Δ +" + k.deltaExternalRotationDeg.toFixed(1) + "°)" : "(Normal)";
      elements.hudERDelta.className = "telem-delta-val " + (k.deltaExternalRotationDeg > 3.0 ? "increased" : "normal");
    }

    if (elements.hudVarusMm) elements.hudVarusMm.textContent = k.varusOpeningMm.toFixed(1) + " mm";
    if (elements.hudVarusDeltaMm) {
      elements.hudVarusDeltaMm.textContent = (k.deltaVarusOpeningMm > 0.3) ? "(Δ +" + k.deltaVarusOpeningMm.toFixed(1) + " mm)" : "(Normal)";
      elements.hudVarusDeltaMm.className = "telem-delta-val " + (k.deltaVarusOpeningMm >= 2.7 ? "increased" : "normal");
    }

    if (elements.hudVarusDeg) elements.hudVarusDeg.textContent = k.varusAngleDeg.toFixed(1) + "°";
    if (elements.hudAntTrans) elements.hudAntTrans.textContent = k.anteriorTranslationMm.toFixed(1) + " mm";
    if (elements.hudPostTrans) elements.hudPostTrans.textContent = k.posteriorTranslationMm.toFixed(1) + " mm";

    // ACL Graft In-Situ Stress
    if (elements.hudAclStressText && elements.hudAclStressBar) {
      if (!state.structures.anteriorCruciateLigament) {
        elements.hudAclStressText.textContent = "NATIVE ACL TORN";
        elements.hudAclStressText.style.color = "#fb7185";
        elements.hudAclStressBar.style.width = "100%";
        elements.hudAclStressBar.className = "stress-bar-fill critical";
      } else {
        var multiplier = k.aclGraftStressMultiplier;
        var percent = Math.min(100, (multiplier / 2.5) * 100);
        elements.hudAclStressText.textContent = (multiplier * 100).toFixed(0) + "% (" + (multiplier > 1.5 ? "DANGER" : "SAFE") + ")";
        elements.hudAclStressBar.style.width = percent + "%";

        if (multiplier > 1.8) {
          elements.hudAclStressBar.className = "stress-bar-fill critical";
          elements.hudAclStressText.style.color = "#fb7185";
        } else if (multiplier > 1.25) {
          elements.hudAclStressBar.className = "stress-bar-fill warning";
          elements.hudAclStressText.style.color = "#fbbf24";
        } else {
          elements.hudAclStressBar.className = "stress-bar-fill";
          elements.hudAclStressText.style.color = "#34d399";
        }
      }
    }

    // Dynamic Clinical Interpretation Banner
    if (elements.hudCalloutText) {
      var callout = "";
      if (!state.structures.popliteusTendon && !state.structures.fibularCollateralLigament && !state.structures.posteriorCruciateLigament) {
        callout = "CRITICAL: Combined PCL + PLC injury. Severe posterior sag and persistent external rotation laxity (>15°) at both 30° and 90° flexion.";
      } else if (!state.structures.popliteusTendon && !state.structures.fibularCollateralLigament && !state.structures.anteriorCruciateLigament) {
        callout = "FATAL COMBINATION: Combined ACL + PLC tear. Unaddressed PLC laxity elevates ACL graft forces by up to 230%, causing rapid graft failure.";
      } else if (!state.structures.fibularCollateralLigament && !state.structures.popliteusTendon) {
        callout = "GRADE III PLC DISRUPTION: Lateral gapping exceeds 4.0 mm on stress radiograph. Tripled varus laxity at 30° and prominent positive dial test.";
      } else if (!state.structures.fibularCollateralLigament) {
        callout = "ISOLATED FCL TEAR: Primary varus restraint lost (+2.7 mm on stress radiograph). Rotational stability remains checked by the intact popliteus complex.";
      } else if (!state.structures.popliteusTendon) {
        callout = "ISOLATED POPLITEUS TEAR ('Fifth Ligament'): External rotation increases (+3° to +6°), most pronounced at 30°-90° flexion. Minimal varus laxity.";
      } else if (!state.structures.anteriorCruciateLigament) {
        callout = "ISOLATED ACL TEAR: Pathologic anterior translation (+8-12 mm). Lateral compartment stable due to intact FCL and popliteus complex.";
      } else {
        callout = "PHYSIOLOGIC BASELINE: Primary static restraints intact. Normal screw-home unlocking and rotational symmetry (<5°).";
      }
      elements.hudCalloutText.textContent = callout;
    }
  }

  // --- CLINICAL EXAMINATION SIMULATION PROCEDURES ---

  function setupClinicalExamButtons() {
    // Dial Test Simulation
    var btnSimDial = document.getElementById("btnSimDial");
    if (btnSimDial) {
      btnSimDial.addEventListener("click", function() {
        switchTab("view-dial");
        state.flexionDeg = 30;
        state.forces.externalRotationTorque = 5.0;
        updateSliderDisplays();
        recalculateAndRender();
      });
    }

    // Varus Stress Test Simulation
    var btnSimVarus = document.getElementById("btnSimVarus");
    if (btnSimVarus) {
      btnSimVarus.addEventListener("click", function() {
        switchTab("view-charts");
        state.flexionDeg = 30;
        state.forces.varusTorque = 10.0;
        updateSliderDisplays();
        recalculateAndRender();
      });
    }

    // Reverse Pivot Shift Simulation (Jakob / LaPrade)
    var btnSimReversePivot = document.getElementById("btnSimReversePivot");
    if (btnSimReversePivot) {
      btnSimReversePivot.addEventListener("click", function() {
        switchTab("view-3d");
        window.Knee3DViewer.setCameraView("lateral");
        runReversePivotShiftAnimation();
      });
    }

    // Lachman / Pivot Shift Simulation
    var btnSimLachman = document.getElementById("btnSimLachman");
    if (btnSimLachman) {
      btnSimLachman.addEventListener("click", function() {
        switchTab("view-3d");
        state.flexionDeg = 30;
        state.forces.anteriorLoad = 134.0;
        state.forces.externalRotationTorque = 3.0;
        updateSliderDisplays();
        recalculateAndRender();
      });
    }

    // External Rotation Recurvatum Test Simulation
    var btnSimRecurvatum = document.getElementById("btnSimRecurvatum");
    if (btnSimRecurvatum) {
      btnSimRecurvatum.addEventListener("click", function() {
        switchTab("view-3d");
        state.flexionDeg = 0;
        state.forces.varusTorque = 8.0;
        state.forces.externalRotationTorque = 6.0;
        updateSliderDisplays();
        recalculateAndRender();
      });
    }
  }

  function updateSliderDisplays() {
    if (elements.sliderFlexion) {
      elements.sliderFlexion.value = state.flexionDeg;
      elements.valFlexion.textContent = state.flexionDeg + "°";
    }
    if (elements.sliderERTorque) {
      elements.sliderERTorque.value = state.forces.externalRotationTorque;
      elements.valERTorque.textContent = state.forces.externalRotationTorque + " N·m";
    }
    if (elements.sliderVarusTorque) {
      elements.sliderVarusTorque.value = state.forces.varusTorque;
      elements.valVarusTorque.textContent = state.forces.varusTorque + " N·m";
    }
    if (elements.sliderAntLoad) {
      elements.sliderAntLoad.value = state.forces.anteriorLoad;
      elements.valAntLoad.textContent = state.forces.anteriorLoad + " N";
    }
    if (elements.sliderPostLoad) {
      elements.sliderPostLoad.value = state.forces.posteriorLoad;
      elements.valPostLoad.textContent = state.forces.posteriorLoad + " N";
    }
  }

  function runReversePivotShiftAnimation() {
    // Reverse pivot shift: Start at 80° flexion (posterolaterally subluxated) and extend to 15°
    var startAngle = 80;
    var targetAngle = 15;
    var current = startAngle;

    state.forces.externalRotationTorque = 6.0;
    state.forces.varusTorque = 8.0;

    var step = function() {
      current -= 1.5;
      if (current >= targetAngle) {
        state.flexionDeg = Math.round(current);
        updateSliderDisplays();
        recalculateAndRender();

        // Clunk triggered at 25-30° flexion
        if (Math.abs(current - 28) < 1.0) {
          if (elements.hudCalloutText) {
            elements.hudCalloutText.textContent = "CLUNK! Lateral tibial plateau snaps anteriorly from posterolateral subluxation at 28° flexion as IT band switches from flexor to extensor!";
          }
        }
        requestAnimationFrame(step);
      }
    };
    step();
  }

  // --- POPULATE REFERENCES TAB ---

  function renderReferencesTab() {
    var container = document.getElementById("referencesListContainer");
    if (!container) return;

    var refs = window.KneeBiomechanicsData.references;
    var html = "";

    refs.forEach(function(ref) {
      html += '<div class="paper-card">' +
        '<div class="paper-title">' + ref.title + '</div>' +
        '<div class="paper-authors">' + ref.authors + '</div>' +
        '<div class="paper-journal">' + ref.journal + ' (' + ref.year + '); ' + ref.volume + ': ' + ref.pages + '</div>' +
        '<div class="paper-desc">' + ref.description + '</div>' +
        '<div class="paper-links-row">';

      if (ref.pmid) {
        html += '<a class="paper-link" href="https://pubmed.ncbi.nlm.nih.gov/' + ref.pmid + '/" target="_blank">' +
          '<svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>' +
          'PMID: ' + ref.pmid + '</a>';
      }
      if (ref.doi) {
        html += '<a class="paper-link" href="https://doi.org/' + ref.doi + '" target="_blank">' +
          '<svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>' +
          'DOI: ' + ref.doi + '</a>';
      }

      html += '</div></div>';
    });

    container.innerHTML = html;
  }

})();
