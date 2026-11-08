/**
 * Biomechanical Kinematics & Reference Dataset
 * Based on the seminal works of Dr. Robert F. LaPrade & Dr. Jorge Chahla
 *
 * Key Sources:
 * - LaPrade RF et al. AJSM 2003 (Qualitative & Quantitative Morphology of PLC)
 * - LaPrade RF et al. AJSM 2004 (Anatomical PLC Reconstruction & Sectioning Kinematics)
 * - LaPrade RF, Wozniczka JK et al. AJSM 2010 (Static Function of the Popliteus Tendon: The "Fifth Ligament")
 * - Chahla J, Moatshe G, Dean CS, LaPrade RF. Arch Bone Jt Surg 2016 (PLC Current Concepts)
 * - Chahla J, Nitri M, Civitarese D et al. Arthrosc Tech 2016 (Anatomic PLC Reconstruction)
 * - Markolf KL et al. JBJS Am 2007 (Effects of PLC Deficiency on ACL Reconstruction Forces)
 */

window.KneeBiomechanicsData = {
  // Standardized testing loads from LaPrade biomechanical cadaveric trials
  standardLoads: {
    externalRotationTorque: 5.0, // N*m
    varusTorque: 10.0, // N*m (or 5.0-12.0 N*m in various sectioning protocols)
    anteriorLoad: 134.0, // N (standard Lachman / KT-1000 load)
    posteriorLoad: 134.0 // N (standard posterior drawer load)
  },

  // Baseline Intact Knee Kinematics across flexion angles
  intactKinematics: {
    externalRotation_5Nm: {
      0: 8.3,
      20: 10.5,
      30: 12.6,
      60: 9.8,
      90: 7.8,
      120: 6.5
    },
    varusOpening_10Nm_mm: {
      0: 3.2,
      20: 5.8,
      30: 8.2,
      60: 8.9,
      90: 7.1,
      120: 6.0
    },
    varusAngle_10Nm_deg: {
      0: 2.1,
      20: 4.0,
      30: 5.5,
      60: 5.2,
      90: 4.1,
      120: 3.5
    },
    anteriorTranslation_134N_mm: {
      0: 3.5,
      20: 5.2,
      30: 5.8,
      60: 4.8,
      90: 3.9,
      120: 3.2
    },
    posteriorTranslation_134N_mm: {
      0: 2.8,
      20: 4.1,
      30: 4.5,
      60: 5.2,
      90: 5.9,
      120: 4.5
    }
  },

  // Injury Presets and their specific kinematic modifications
  presets: {
    intact: {
      id: "intact",
      name: "Intact Native Knee",
      subtitle: "Baseline Control State",
      statusText: "Normal physiological restraints intact. Screw-home mechanism functional.",
      structures: {
        popliteusTendon: true,
        popliteofibularLigament: true,
        fibularCollateralLigament: true,
        anteriorCruciateLigament: true,
        posteriorCruciateLigament: true,
        meniscopoplitealFascicles: true
      },
      colorBadge: "badge-success",
      aclGraftStressMultiplier: 1.0,
      clinicalPearls: [
        "Normal external rotation symmetry (<5° side-to-side difference).",
        "Popliteus tendon acts as the primary static and dynamic internal rotator / external rotation checkrein.",
        "Screw-home mechanism: Popliteus unlocks the extended knee by internally rotating the tibia."
      ]
    },

    isolated_popliteus: {
      id: "isolated_popliteus",
      name: "Isolated Popliteus Tendon Tear",
      subtitle: 'The "Fifth Ligament" Deficiency (LaPrade 2010)',
      statusText: "Moderate increase in external rotation (+3.0° at 30°, +5.9° at 90°); minimal isolated varus change.",
      structures: {
        popliteusTendon: false,
        popliteofibularLigament: true,
        fibularCollateralLigament: true,
        anteriorCruciateLigament: true,
        posteriorCruciateLigament: true,
        meniscopoplitealFascicles: true
      },
      colorBadge: "badge-warning",
      aclGraftStressMultiplier: 1.25,
      clinicalPearls: [
        "LaPrade et al. (AJSM 2010) demonstrated significant increases in tibial external rotation (+3.0° at 30°, +5.3° at 60°, +5.9° at 90°).",
        "Passive static restraint to external rotation increases progressively with knee flexion.",
        "Because FCL is intact, varus laxity is minimal (+0.4° to +0.9°), making isolated tears easily overlooked without high suspicion."
      ]
    },

    popliteus_and_pfl: {
      id: "popliteus_and_pfl",
      name: "Popliteus Tendon + PFL Tear",
      subtitle: "Posterolateral Rotatory Instability (PLRI)",
      statusText: "Significant increase in external rotation (+5.8° at 30°, +8.4° at 90°); popliteal hiatus compromised.",
      structures: {
        popliteusTendon: false,
        popliteofibularLigament: false,
        fibularCollateralLigament: true,
        anteriorCruciateLigament: true,
        posteriorCruciateLigament: true,
        meniscopoplitealFascicles: false
      },
      colorBadge: "badge-warning",
      aclGraftStressMultiplier: 1.45,
      clinicalPearls: [
        "Tearing the inverted 'Y' suspensory complex (popliteus + PFL) disables both dynamic and static posterolateral rotatory restraints.",
        "Positive Dial Test at 30° flexion (~8-10° side-to-side difference).",
        "Hypermobile lateral meniscus syndrome occurs if meniscopopliteal fascicles are torn, leading to lateral mechanical popping."
      ]
    },

    isolated_fcl: {
      id: "isolated_fcl",
      name: "Isolated FCL / LCL Tear",
      subtitle: "Loss of Primary Varus Restraint",
      statusText: "Isolated varus laxity (+2.7 mm on stress radiograph; +6° varus at 30°); ER only mildly affected.",
      structures: {
        popliteusTendon: true,
        popliteofibularLigament: true,
        fibularCollateralLigament: false,
        anteriorCruciateLigament: true,
        posteriorCruciateLigament: true,
        meniscopoplitealFascicles: true
      },
      colorBadge: "badge-warning",
      aclGraftStressMultiplier: 1.4,
      clinicalPearls: [
        "FCL is the primary static restraint to varus opening at all flexion angles.",
        "LaPrade quantified that an isolated FCL tear yields a 2.7 mm increase in lateral compartment gapping on varus stress radiographs.",
        "Tibial external rotation remains largely controlled by the intact popliteus complex at 30° and 90°."
      ]
    },

    complete_plc: {
      id: "complete_plc",
      name: "Complete Grade III Posterolateral Corner (PLC)",
      subtitle: "FCL + Popliteus Tendon + PFL (LaPrade 2004)",
      statusText: "Severe multidirectional instability: varus opening triples (+15.8 mm at 30°), external rotation surges >8.6°.",
      structures: {
        popliteusTendon: false,
        popliteofibularLigament: false,
        fibularCollateralLigament: false,
        anteriorCruciateLigament: true,
        posteriorCruciateLigament: true,
        meniscopoplitealFascicles: false
      },
      colorBadge: "badge-danger",
      aclGraftStressMultiplier: 2.1,
      clinicalPearls: [
        "LaPrade et al. (AJSM 2004): Lateral compartment opening explodes from 8.2 mm to 24.0 mm at 30° flexion under varus load.",
        "External rotation increases to 21.2° at 30° flexion (intact: 12.6°).",
        "Positive Reverse Pivot Shift (Jakob / LaPrade) clunk as lateral plateau reduces anteriorly near 20°-30° flexion.",
        "Varus stress radiograph demonstrates >= 4.0 mm side-to-side differential, diagnostic of complete Grade III PLC disruption."
      ]
    },

    isolated_acl: {
      id: "isolated_acl",
      name: "Isolated ACL Tear",
      subtitle: "Anterior & Rotatory Pivot Shift Instability",
      statusText: "Pathologic anterior translation (+8-10 mm Lachman); normal varus stability if PLC intact.",
      structures: {
        popliteusTendon: true,
        popliteofibularLigament: true,
        fibularCollateralLigament: true,
        anteriorCruciateLigament: false,
        posteriorCruciateLigament: true,
        meniscopoplitealFascicles: true
      },
      colorBadge: "badge-info",
      aclGraftStressMultiplier: 0.0,
      clinicalPearls: [
        "Positive Lachman and anterior drawer tests; positive pivot shift test.",
        "With an intact PLC and popliteus complex, secondary varus and external rotation restraints are preserved."
      ]
    },

    combined_acl_plc: {
      id: "combined_acl_plc",
      name: "Combined ACL + Complete PLC Tear",
      subtitle: 'The "Fatal Combination" for ACL Grafts (Markolf & LaPrade)',
      statusText: "Catastrophic coupled rotatory and varus instability. ACL graft forces increase by 150-200% under varus loads!",
      structures: {
        popliteusTendon: false,
        popliteofibularLigament: false,
        fibularCollateralLigament: false,
        anteriorCruciateLigament: false,
        posteriorCruciateLigament: true,
        meniscopoplitealFascicles: false
      },
      colorBadge: "badge-danger",
      aclGraftStressMultiplier: 2.7,
      clinicalPearls: [
        "Biomechanical studies (Markolf JBJS 2007; LaPrade & Chahla 2016): Unrecognized PLC tears double or triple in-situ forces on ACL reconstructions.",
        "Under walking varus thrust and coupled internal/external rotation, the ACL graft elongates, attenuates, and catastrophically fails.",
        "Simultaneous anatomic reconstruction of both ACL and PLC is mandatory to protect the cruciate graft."
      ]
    },

    combined_pcl_plc: {
      id: "combined_pcl_plc",
      name: "Combined PCL + Complete PLC Tear",
      subtitle: "Classic Dial Test Differential at 30° and 90°",
      statusText: "Severe posterior tibial dropoff (>15-20 mm) and external rotation asymmetry exceeding 15° at BOTH 30° and 90°.",
      structures: {
        popliteusTendon: false,
        popliteofibularLigament: false,
        fibularCollateralLigament: false,
        anteriorCruciateLigament: true,
        posteriorCruciateLigament: false,
        meniscopoplitealFascicles: false
      },
      colorBadge: "badge-danger",
      aclGraftStressMultiplier: 1.8,
      clinicalPearls: [
        "Pathognomonic Dial Test finding: >10-15° external rotation increase at 30° AND persisting/worsening at 90°.",
        "In contrast, an isolated PLC tear dampens external rotation at 90° because the intact PCL acts as a secondary checkrein.",
        "Profound posterior tibial sag and positive external rotation recurvatum test."
      ]
    }
  },

  // Compute real-time kinematics based on structure states, flexion, and applied forces
  calculateKinematics: function(structures, flexionDeg, forces) {
    var PT = structures.popliteusTendon;
    var PFL = structures.popliteofibularLigament;
    var FCL = structures.fibularCollateralLigament;
    var ACL = structures.anteriorCruciateLigament;
    var PCL = structures.posteriorCruciateLigament;

    var extTorque = forces.externalRotationTorque || 0; // Nm
    var varusTorq = forces.varusTorque || 0; // Nm
    var antLoad = forces.anteriorLoad || 0; // N
    var postLoad = forces.posteriorLoad || 0; // N

    // Baseline intact values interpolated at current flexion
    var baseER = this.interpolate(this.intactKinematics.externalRotation_5Nm, flexionDeg);
    var baseVarusMm = this.interpolate(this.intactKinematics.varusOpening_10Nm_mm, flexionDeg);
    var baseVarusDeg = this.interpolate(this.intactKinematics.varusAngle_10Nm_deg, flexionDeg);
    var baseAntMm = this.interpolate(this.intactKinematics.anteriorTranslation_134N_mm, flexionDeg);
    var basePostMm = this.interpolate(this.intactKinematics.posteriorTranslation_134N_mm, flexionDeg);

    // Delta calculations
    var deltaER = 0;
    var deltaVarusMm = 0;
    var deltaVarusDeg = 0;
    var deltaAntMm = 0;
    var deltaPostMm = 0;

    // External rotation contributions
    if (!PT && !PFL && !FCL) {
      // Complete PLC cut (LaPrade 2004 Table 2)
      // Delta ER: 0°: +8.0°, 30°: +8.6°, 60°: +7.3°, 90°: +6.6°
      var maxDelta = 8.6;
      if (flexionDeg <= 30) {
        deltaER = 8.0 + (flexionDeg / 30) * 0.6;
      } else if (flexionDeg <= 90) {
        deltaER = 8.6 - ((flexionDeg - 30) / 60) * 2.0;
      } else {
        deltaER = 6.6 - ((flexionDeg - 90) / 30) * 1.5;
      }

      // If PCL is also torn, ER at 90° does NOT dampen; it explodes!
      if (!PCL) {
        if (flexionDeg > 45) {
          deltaER += ((flexionDeg - 45) / 45) * 8.5; // up to +17° at 90°
        }
      }
    } else if (!PT && !PFL) {
      // Popliteus + PFL cut
      deltaER = 5.5 + (flexionDeg / 90) * 2.8;
      if (!PCL && flexionDeg > 45) deltaER += 5.0;
    } else if (!PT) {
      // Isolated Popliteus cut (LaPrade 2010)
      // 0°: +1.0°, 20°: +2.1°, 30°: +3.0°, 60°: +5.3°, 90°: +5.9°
      if (flexionDeg <= 20) {
        deltaER = 1.0 + (flexionDeg / 20) * 1.1;
      } else if (flexionDeg <= 30) {
        deltaER = 2.1 + ((flexionDeg - 20) / 10) * 0.9;
      } else if (flexionDeg <= 60) {
        deltaER = 3.0 + ((flexionDeg - 30) / 30) * 2.3;
      } else if (flexionDeg <= 90) {
        deltaER = 5.3 + ((flexionDeg - 60) / 30) * 0.6;
      } else {
        deltaER = 5.9;
      }
    } else if (!PFL) {
      deltaER = 2.0 + (flexionDeg / 90) * 2.5;
    } else if (!FCL) {
      deltaER = 1.5 + (flexionDeg / 90) * 1.0;
    }

    // Varus contributions
    if (!FCL && !PT && !PFL) {
      // Complete PLC cut (LaPrade 2004 Table 1)
      // Delta mm: 0°: +6.7mm, 30°: +15.8mm, 60°: +11.1mm, 90°: +4.9mm
      if (flexionDeg <= 30) {
        deltaVarusMm = 6.7 + (flexionDeg / 30) * 9.1;
        deltaVarusDeg = 4.5 + (flexionDeg / 30) * 6.5;
      } else if (flexionDeg <= 90) {
        deltaVarusMm = 15.8 - ((flexionDeg - 30) / 60) * 10.9;
        deltaVarusDeg = 11.0 - ((flexionDeg - 30) / 60) * 7.0;
      } else {
        deltaVarusMm = 4.9 - ((flexionDeg - 90) / 30) * 2.0;
        deltaVarusDeg = 4.0;
      }
    } else if (!FCL) {
      // Isolated FCL cut (LaPrade stress radiograph study: +2.7mm at 20-30°)
      if (flexionDeg <= 30) {
        deltaVarusMm = 1.8 + (flexionDeg / 30) * 2.2;
        deltaVarusDeg = 2.0 + (flexionDeg / 30) * 3.5;
      } else {
        deltaVarusMm = 4.0 - ((flexionDeg - 30) / 60) * 1.5;
        deltaVarusDeg = 5.5 - ((flexionDeg - 30) / 60) * 2.0;
      }
    } else if (!PT) {
      // Isolated Popliteus: minimal varus effect (+0.4° to +1.0°)
      deltaVarusMm = 0.6 + (flexionDeg / 90) * 0.5;
      deltaVarusDeg = 0.5 + (flexionDeg / 90) * 0.6;
    }

    // Anterior Translation contributions
    if (!ACL) {
      deltaAntMm += 8.5 + ((30 - Math.abs(flexionDeg - 30)) / 30) * 4.0; // peak at 30° Lachman
      if (!PT || !FCL) {
        deltaAntMm += 3.2; // PLC is secondary restraint to anterior translation
      }
    } else if (!PT) {
      // LaPrade 2010 noted small significant increase in anterior translation under rotatory load
      deltaAntMm += 0.8;
    }

    // Posterior Translation contributions
    if (!PCL) {
      deltaPostMm += 7.0 + (flexionDeg / 90) * 8.5; // peak at 90° posterior drawer
      if (!PT || !PFL) {
        deltaPostMm += 4.5; // PLC is crucial secondary stabilizer against posterior translation
      }
    } else if (!PT || !PFL) {
      deltaPostMm += 1.5 + (flexionDeg / 90) * 1.5;
    }

    // Scale by applied loads relative to baseline tested loads
    var torqueRatioER = extTorque / 5.0;
    var torqueRatioVarus = varusTorq / 10.0;
    var loadRatioAnt = antLoad / 134.0;
    var loadRatioPost = postLoad / 134.0;

    var finalER = (baseER + deltaER) * torqueRatioER;
    var finalVarusMm = (baseVarusMm + deltaVarusMm) * torqueRatioVarus;
    var finalVarusDeg = (baseVarusDeg + deltaVarusDeg) * torqueRatioVarus;
    var finalAntMm = (baseAntMm + deltaAntMm) * loadRatioAnt;
    var finalPostMm = (basePostMm + deltaPostMm) * loadRatioPost;

    // ACL Graft In-Situ Stress Multiplier (Markolf & LaPrade)
    var aclStressMultiplier = 1.0;
    if (!ACL) {
      aclStressMultiplier = 0.0; // native ACL torn
    } else {
      if (!FCL && !PT && !PFL) {
        aclStressMultiplier = 2.4 + (varusTorq / 10.0) * 0.6;
      } else if (!FCL) {
        aclStressMultiplier = 1.6 + (varusTorq / 10.0) * 0.4;
      } else if (!PT) {
        aclStressMultiplier = 1.25 + (extTorque / 5.0) * 0.2;
      }
    }

    // Dial test side-to-side difference estimation at 30° and 90°
    var dial30 = (!PT && !PFL && !FCL) ? 11.2 : (!PT ? 3.5 : (!FCL ? 2.5 : 0.5));
    var dial90 = (!PT && !PFL && !FCL) ? (PCL ? 6.6 : 16.5) : (!PT ? 5.9 : 0.5);

    return {
      externalRotationDeg: Math.max(0, finalER),
      deltaExternalRotationDeg: Math.max(0, deltaER * torqueRatioER),
      varusOpeningMm: Math.max(0, finalVarusMm),
      deltaVarusOpeningMm: Math.max(0, deltaVarusMm * torqueRatioVarus),
      varusAngleDeg: Math.max(0, finalVarusDeg),
      deltaVarusAngleDeg: Math.max(0, deltaVarusDeg * torqueRatioVarus),
      anteriorTranslationMm: Math.max(0, finalAntMm),
      posteriorTranslationMm: Math.max(0, finalPostMm),
      aclGraftStressMultiplier: aclStressMultiplier,
      dialTestDifference30: dial30,
      dialTestDifference90: dial90,
      isDialPositive30: dial30 >= 10.0,
      isDialPositive90: dial90 >= 10.0,
      isCompletePLC: (!FCL && !PT && !PFL),
      isVarusStressPositive: (!FCL && !PT && !PFL) ? (finalVarusMm - baseVarusMm >= 4.0) : (finalVarusMm - baseVarusMm >= 2.7)
    };
  },

  // Helper interpolation
  interpolate: function(table, angle) {
    var angles = [0, 20, 30, 60, 90, 120];
    if (table[angle] !== undefined) return table[angle];
    if (angle <= 0) return table[0];
    if (angle >= 120) return table[120] || table[90];

    for (var i = 0; i < angles.length - 1; i++) {
      var a0 = angles[i];
      var a1 = angles[i + 1];
      if (angle >= a0 && angle <= a1) {
        var v0 = table[a0];
        var v1 = table[a1];
        var t = (angle - a0) / (a1 - a0);
        return v0 + t * (v1 - v0);
      }
    }
    return table[30];
  },

  // Academic References and Landmark Papers
  references: [
    {
      authors: "LaPrade RF, Ly TV, Wentorf FA, Engebretsen L.",
      title: "The posterolateral attachments of the knee: a qualitative and quantitative morphologic analysis of the fibular collateral ligament, popliteus tendon, popliteofibular ligament, and lateral gastrocnemius tendon.",
      journal: "The American Journal of Sports Medicine",
      year: 2003,
      volume: "31(6)",
      pages: "854-860",
      pmid: "14623649",
      doi: "10.1177/03635465030310061701",
      description: "Landmark anatomical mapping establishing the exact footprint coordinates of the FCL, Popliteus Tendon (18.5 mm anterior-distal to FCL), and PFL, which became the international foundation for anatomic reconstruction."
    },
    {
      authors: "LaPrade RF, Johansen S, Wentorf FA, Engebretsen L, Esterberg JL, Tso A.",
      title: "An analysis of an anatomical posterolateral knee reconstruction: an in vitro biomechanical study and development of a surgical technique.",
      journal: "The American Journal of Sports Medicine",
      year: 2004,
      volume: "32(6)",
      pages: "1405-1414",
      pmid: "15310567",
      doi: "10.1177/0363546503262687",
      description: "Demonstrated that sectioning the FCL, Popliteus Tendon, and PFL significantly increases varus translation (tripling at 30°) and external rotation, and proved that an anatomic 2-graft reconstruction restores native kinematics."
    },
    {
      authors: "LaPrade RF, Wozniczka JK, Stellmaker MP, Wijdicks CA.",
      title: 'Analysis of the static function of the popliteus tendon and evaluation of an anatomic reconstruction: the "fifth ligament" of the knee.',
      journal: "The American Journal of Sports Medicine",
      year: 2010,
      volume: "38(3)",
      pages: "543-549",
      pmid: "20042544",
      doi: "10.1177/0363546509349493",
      description: "Proved that the popliteus tendon acts as a primary static restraint against external tibial rotation across 20° to 90° of flexion (+3.0° at 30°, +5.9° at 90°), establishing its clinical definition as the 'fifth ligament'."
    },
    {
      authors: "Chahla J, Moatshe G, Dean CS, LaPrade RF.",
      title: "Posterolateral Corner of the Knee: Current Concepts.",
      journal: "The Archives of Bone and Joint Surgery",
      year: 2016,
      volume: "4(2)",
      pages: "97-103",
      pmid: "27200388",
      pmcid: "PMC4852033",
      doi: "10.22038/ABJS.2016.6528",
      description: "Comprehensive synthesis of modern PLC biomechanics, clinical examination maneuvers (Dial test, varus stress, reverse pivot shift), stress radiography thresholds, and reconstructive pearls by Dr. Jorge Chahla."
    },
    {
      authors: "Chahla J, Nitri M, Civitarese D, Dean CS, Moulton SG, LaPrade RF.",
      title: "Anatomic Posterolateral Corner Reconstruction.",
      journal: "Arthroscopy Techniques",
      year: 2016,
      volume: "5(3)",
      pages: "e491-e496",
      pmid: "27656367",
      pmcid: "PMC5021528",
      doi: "10.1016/j.eats.2016.01.032",
      description: "Detailed surgical demonstration of the anatomic reconstruction using split Achilles tendon or hamstring allografts to anatomically restore the FCL, Popliteus Tendon, and Popliteofibular Ligament."
    },
    {
      authors: "Markolf KL, Graves BR, Sigward SM, Jackson OP, McAllister RM.",
      title: "Effects of posterolateral corner deficiency on forces in an anterior cruciate ligament reconstruction: a biomechanical study.",
      journal: "The Journal of Bone and Joint Surgery. American Volume",
      year: 2007,
      volume: "89(12)",
      pages: "2648-2655",
      pmid: "18056497",
      doi: "10.2106/JBJS.F.01257",
      description: "Biomechanical evidence showing that untreated posterolateral corner deficiency elevates in-situ forces on ACL reconstruction grafts by up to 150-200% under varus and rotatory loads, explaining premature ACL graft rupture."
    },
    {
      authors: "LaPrade RF, Heikes C, Fritts HM, Camey J, Surowiec R.",
      title: "The Popliteus Complex: Evaluation and Treatment.",
      journal: "Sports Medicine and Arthroscopy Review",
      year: 2006,
      volume: "14(4)",
      pages: "221-229",
      pmid: "17135973",
      doi: "10.1097/01.jsa.0000212330.14777.63",
      description: "In-depth review of popliteus complex anatomy, popliteal hiatus, meniscopopliteal fascicles, clinical presentation, and diagnostic algorithms."
    }
  ]
};
