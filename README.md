# Knee Posterolateral Corner (PLC) & Popliteus Complex Biomechanics Simulator
### 3D & 2D Interactive Kinematic Modeling of the Popliteus Tendon, LCL, ACL, and PCL
**Based on the Seminal Works of Dr. Robert F. LaPrade, MD, PhD & Dr. Jorge Chahla, MD, PhD**

---

## 📖 Overview

This interactive orthopaedic and biomechanical simulator models the multi-planar kinematic implications of an isolated or combined **Popliteus Tendon (PT)** tear, **Popliteofibular Ligament (PFL)** tear, **Fibular Collateral Ligament (FCL / LCL)** tear, **Anterior Cruciate Ligament (ACL)** tear, and **Posterior Cruciate Ligament (PCL)** tear.

The mathematical kinematic engine and 3D visual models are built directly from published cadaveric sectioning studies, 6-degrees-of-freedom robotic motion tracking data, and radiographic diagnostic thresholds pioneered by **Dr. Robert F. LaPrade** and expanded in clinical cadaveric demonstrations by **Dr. Jorge Chahla** (complex knee specialist, originally from Tucumán, Argentina).

---

## 🎯 Key Capabilities

### 1. 3D Anatomical & Biomechanical Knee Model (WebGL / Three.js)
- **High-Fidelity Parametric Anatomy:** Distal Femur (with lateral epicondyle and popliteal sulcus), Proximal Tibia (plateaus, intercondylar spines, and popliteus muscle insertion footprint), Proximal Fibula (fibular head and styloid process), and Menisci (with popliteal hiatus aperture).
- **The "Big Three" Posterolateral Static Stabilizers:**
  * **Popliteus Tendon:** Attaches in the anterior-inferior fifth of the popliteal sulcus on the lateral femoral condyle, passes through the popliteal hiatus, and unites with the PFL.
  * **Popliteofibular Ligament (PFL):** Connects the popliteus musculotendinous junction to the tip of the fibular styloid process, creating the biomechanical inverted 'Y' suspensory complex.
  * **Fibular Collateral Ligament (FCL):** Originates 1.4 mm posterior and 3.1 mm proximal to the lateral epicondyle and inserts on the lateral fibular head (precisely **18.5 mm** proximal-posterior to the popliteus femoral attachment).
- **Dynamic 6-DOF Kinematic Articulation:**
  * Knee flexion arc (0° to 120°) with physiological femoral roll-and-glide.
  * **Terminal Extension "Screw-Home" Mechanism:** Obligatory external rotation of the tibia (6°-8°) from 15° to 0° extension, unlocked by popliteus internal rotation.
  * Real-time ligament color coding based on calculated strain: Healthy (Cyan) $\to$ High Tension (Amber) $\to$ Danger/Rupture (Pulsing Red) $\to$ Torn (Retracted / Wireframe ghost line).
  * 3D measurement calipers showing lateral compartment joint space gapping (mm) and external rotation angle arcs.

### 2. 2D Axial Plateau & Prone Dial Test Simulator (HTML5 Canvas)
- **Axial Cross-Section:** Illustrates the transverse mechanics of the tibial plateau, lateral meniscus, popliteal hiatus, and the inverted 'Y' line of action ($\mathbf{F}_{\text{pop}}$) resisting external rotatory moments. Visualizes the migration of the Instantaneous Center of Rotation (ICR) when the PLC is deficient.
- **The Prone Dial Test Simulator:** Bilateral foot plantar evaluation comparing the normal contralateral knee to the injured knee under a standardized 5 N·m external rotation torque:
  * **Isolated PLC / Popliteus Injury:** $>10^\circ$ asymmetry at **30° flexion only** (dampens down at 90° because the intact PCL acts as a secondary rotational brake).
  * **Combined PCL + PLC Injury:** Asymmetry $\ge 15^\circ$ at **BOTH 30° AND 90° flexion** (loss of both primary and secondary stabilizers).

### 3. Real-Time Kinematic Graphs
- **Tibial External Rotation vs. Knee Flexion (0°-90°):** Plots native intact vs. sectioned/reconstructed curves.
- **Lateral Compartment Opening / Varus Gapping (mm):** Highlights the **LaPrade Varus Stress Radiography Thresholds**:
  * **2.7 mm delta:** Diagnostic of isolated complete FCL tear.
  * **$\ge$ 4.0 mm delta:** Diagnostic of complete Grade III PLC disruption (FCL + PT + PFL).
- **In-Situ Force on ACL Reconstruction Graft:** Illustrates the 150%–230% surge in tensile and shear forces on an ACL graft when concurrent posterolateral corner laxity is unaddressed, explaining premature ACL reconstruction failure.

### 4. Clinical Examination Simulator
Interactive one-click simulations with biomechanical rationales:
- **The Dial Test** (at 30° and 90°)
- **Varus Stress Test** (at 0° and 30°)
- **Reverse Pivot Shift (Jakob / LaPrade)**: Dynamic animation showing lateral tibial plateau posterolateral subluxation at 80° flexion and anterior reduction clunk at 25°-30° as the IT band transitions to an extensor.
- **Lachman & Pivot Shift Test** (134 N anterior shear force)
- **External Rotation Recurvatum Test** (Hughston / LaPrade)

---

## 🚀 Quick Start Instructions

To run the simulator locally on your Mac:

```bash
cd /Users/brunogobbato/.gemini/antigravity/scratch/laprade_knee_biomechanics_3d
./launch.sh
```

Or run Python's built-in web server directly on port 8088:

```bash
python3 -m http.server 8088
```

Then open your browser to: **[http://localhost:8088](http://localhost:8088)** (the `launch.sh` script also automatically detects any busy port and selects the next free port).

---

## 📚 Landmark Bibliography

1. **LaPrade RF, Ly TV, Wentorf FA, Engebretsen L.** *The posterolateral attachments of the knee: a qualitative and quantitative morphologic analysis of the fibular collateral ligament, popliteus tendon, popliteofibular ligament, and lateral gastrocnemius tendon.* **Am J Sports Med.** 2003;31(6):854–860. [PMID: 14623649](https://pubmed.ncbi.nlm.nih.gov/14623649/)
2. **LaPrade RF, Johansen S, Wentorf FA, Engebretsen L, Esterberg JL, Tso A.** *An analysis of an anatomical posterolateral knee reconstruction: an in vitro biomechanical study and development of a surgical technique.* **Am J Sports Med.** 2004;32(6):1405–1414. [PMID: 15310567](https://pubmed.ncbi.nlm.nih.gov/15310567/)
3. **LaPrade RF, Wozniczka JK, Stellmaker MP, Wijdicks CA.** *Analysis of the static function of the popliteus tendon and evaluation of an anatomic reconstruction: the "fifth ligament" of the knee.* **Am J Sports Med.** 2010;38(3):543–549. [PMID: 20042544](https://pubmed.ncbi.nlm.nih.gov/20042544/)
4. **Chahla J, Moatshe G, Dean CS, LaPrade RF.** *Posterolateral Corner of the Knee: Current Concepts.* **Arch Bone Jt Surg.** 2016;4(2):97–103. [PMID: 27200388](https://pubmed.ncbi.nlm.nih.gov/27200388/)
5. **Chahla J, Nitri M, Civitarese D, Dean CS, Moulton SG, LaPrade RF.** *Anatomic Posterolateral Corner Reconstruction.* **Arthrosc Tech.** 2016;5(3):e491–e496. [PMID: 27656367](https://pubmed.ncbi.nlm.nih.gov/27656367/)
6. **Markolf KL, Graves BR, Sigward SM, Jackson OP, McAllister RM.** *Effects of posterolateral corner deficiency on forces in an anterior cruciate ligament reconstruction: a biomechanical study.* **J Bone Joint Surg Am.** 2007;89(12):2648–2655. [PMID: 18056497](https://pubmed.ncbi.nlm.nih.gov/18056497/)
