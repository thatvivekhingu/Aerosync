/* ═══════════════════════════════════════════════════════════════════════════
   AeroSync — Interactive Cadastral Web & Dashboard Engine
   ═══════════════════════════════════════════════════════════════════════════ */

// Sample Cadastral Parcels Data for Interactive GIS Viewer
const CADASTRAL_PARCELS = [
  {
    id: "P1",
    ulpin: "ULPIN-26012-0042",
    owner: "Shri Rajesh Kumar Patel",
    category: "Residential Building (Class 1)",
    area_sqm: 145.5,
    area_sqft: 1566.15,
    perimeter_m: 48.2,
    confidence: 0.96,
    verificationNeeded: false,
    color: "#ff9800",
    fillColor: "rgba(255, 152, 0, 0.45)",
    points: [[120, 140], [240, 140], [240, 260], [120, 260]],
    centroid: [180, 200],
    village: "Kashi Rural",
    district: "Varanasi",
    khasra: "142/1"
  },
  {
    id: "P2",
    ulpin: "ULPIN-26012-0043",
    owner: "Smt. Sunita Devi",
    category: "Commercial / Shop (Class 1)",
    area_sqm: 88.0,
    area_sqft: 947.22,
    perimeter_m: 37.6,
    confidence: 0.92,
    verificationNeeded: false,
    color: "#ff9800",
    fillColor: "rgba(255, 152, 0, 0.45)",
    points: [[270, 140], [360, 140], [360, 230], [270, 230]],
    centroid: [315, 185],
    village: "Kashi Rural",
    district: "Varanasi",
    khasra: "142/2"
  },
  {
    id: "P3",
    ulpin: "ULPIN-26012-0044",
    owner: "Gram Sabha Community",
    category: "Village Water Body / Talab (Class 3)",
    area_sqm: 420.0,
    area_sqft: 4520.84,
    perimeter_m: 86.4,
    confidence: 0.99,
    verificationNeeded: false,
    color: "#00a6fb",
    fillColor: "rgba(0, 166, 251, 0.4)",
    points: [[410, 100], [560, 100], [580, 220], [440, 240]],
    centroid: [495, 165],
    village: "Kashi Rural",
    district: "Varanasi",
    khasra: "145 (Pond)"
  },
  {
    id: "P4",
    ulpin: "ULPIN-26012-0045",
    owner: "Shri Mahendra Pratap Singh",
    category: "Abutting Structure (Class 1)",
    area_sqm: 110.4,
    area_sqft: 1188.33,
    perimeter_m: 42.0,
    confidence: 0.64,
    verificationNeeded: true,
    color: "#e63946",
    fillColor: "rgba(230, 57, 70, 0.45)",
    points: [[420, 250], [510, 250], [510, 340], [420, 340]],
    centroid: [465, 295],
    village: "Kashi Rural",
    district: "Varanasi",
    khasra: "146/A"
  },
  {
    id: "P5",
    ulpin: "ULPIN-26012-0046",
    owner: "Public Works Department",
    category: "Main Village Road (Class 2)",
    area_sqm: 350.0,
    area_sqft: 3767.37,
    perimeter_m: 140.0,
    confidence: 0.97,
    verificationNeeded: false,
    color: "#ffeb3b",
    fillColor: "rgba(255, 235, 59, 0.4)",
    points: [[50, 390], [600, 390], [600, 440], [50, 440]],
    centroid: [325, 415],
    village: "Kashi Rural",
    district: "Varanasi",
    khasra: "Road Right-of-Way"
  }
];

// State variables
let activeLayers = {
  drone: true,
  segmentation: true,
  polygons: true,
  ulpins: true,
  uncertainty: false
};

let selectedParcel = CADASTRAL_PARCELS[0];
let hoveredParcel = null;

// Initialize on DOM Ready
document.addEventListener("DOMContentLoaded", () => {
  initNavbarScroll();
  initDashboardTabs();
  initGISCanvas();
  initChatbot();
  updateParcelDetailsPanel(selectedParcel);
  updatePropertyCardDraft(selectedParcel);
});

// ─────────────────────────────────────────────────────────────────────────────
// Navbar & Navigation
// ─────────────────────────────────────────────────────────────────────────────

function initNavbarScroll() {
  const navbar = document.querySelector(".navbar");
  window.addEventListener("scroll", () => {
    if (window.scrollY > 40) {
      navbar.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)";
    } else {
      navbar.style.boxShadow = "none";
    }
  });
}

function scrollToSection(sectionId) {
  const elem = document.getElementById(sectionId);
  if (elem) {
    elem.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard Tabs Switching
// ─────────────────────────────────────────────────────────────────────────────

function initDashboardTabs() {
  const tabBtns = document.querySelectorAll(".dash-tab-btn");
  const tabContents = document.querySelectorAll(".dash-view-content");

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabBtns.forEach((b) => b.classList.remove("active"));
      tabContents.forEach((c) => c.classList.remove("active"));

      btn.classList.add("active");
      const targetId = btn.getAttribute("data-tab");
      const targetView = document.getElementById(targetId);
      if (targetView) {
        targetView.classList.add("active");
        if (targetId === "view-gis") {
          renderGISCanvas();
        }
      }
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Interactive Canvas GIS Map Renderer
// ─────────────────────────────────────────────────────────────────────────────

let canvas, ctx;
const CANVAS_WIDTH = 700;
const CANVAS_HEIGHT = 500;

function initGISCanvas() {
  canvas = document.getElementById("gisCanvas");
  if (!canvas) return;
  ctx = canvas.getContext("2d");

  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;

  // Layer toggle listeners
  const layerChips = document.querySelectorAll(".layer-chip");
  layerChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const layerKey = chip.getAttribute("data-layer");
      activeLayers[layerKey] = !activeLayers[layerKey];
      chip.classList.toggle("active", activeLayers[layerKey]);
      renderGISCanvas();
    });
  });

  // Mouse interactivity
  canvas.addEventListener("mousemove", handleCanvasMouseMove);
  canvas.addEventListener("click", handleCanvasClick);

  renderGISCanvas();
}

function renderGISCanvas() {
  if (!ctx) return;
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // 1. Draw Base Drone Imagery Background
  if (activeLayers.drone) {
    drawDroneTerrainBackground(ctx);
  } else {
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  // 2. Draw Parcels
  CADASTRAL_PARCELS.forEach((parcel) => {
    const isSelected = selectedParcel && selectedParcel.id === parcel.id;
    const isHovered = hoveredParcel && hoveredParcel.id === parcel.id;

    ctx.beginPath();
    parcel.points.forEach((pt, idx) => {
      if (idx === 0) ctx.moveTo(pt[0], pt[1]);
      else ctx.lineTo(pt[0], pt[1]);
    });
    ctx.closePath();

    // Segmentation mask layer
    if (activeLayers.segmentation) {
      if (activeLayers.uncertainty && parcel.verificationNeeded) {
        ctx.fillStyle = "rgba(230, 57, 70, 0.65)";
      } else {
        ctx.fillStyle = parcel.fillColor;
      }
      ctx.fill();
    }

    // 90° Polygon boundary stroke
    if (activeLayers.polygons) {
      ctx.strokeStyle = isSelected ? "#ffffff" : isHovered ? "#00f2fe" : parcel.color;
      ctx.lineWidth = isSelected ? 3.5 : isHovered ? 2.5 : 1.8;
      ctx.stroke();

      // Draw vertex corner nodes
      parcel.points.forEach((pt) => {
        ctx.beginPath();
        ctx.arc(pt[0], pt[1], isSelected ? 4.5 : 3, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? "#02c39a" : "#ffffff";
        ctx.fill();
        ctx.strokeStyle = "#0b1b2b";
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    }

    // ULPIN Text Labels
    if (activeLayers.ulpins) {
      ctx.font = isSelected ? "bold 11px Inter, sans-serif" : "10px Inter, sans-serif";
      ctx.fillStyle = isSelected ? "#ffffff" : "#f1f5f9";
      ctx.shadowColor = "rgba(0,0,0,0.85)";
      ctx.shadowBlur = 4;
      ctx.textAlign = "center";
      ctx.fillText(parcel.ulpin, parcel.centroid[0], parcel.centroid[1]);
      ctx.shadowBlur = 0; // reset
    }
  });
}

function drawDroneTerrainBackground(context) {
  // Rich simulated drone orthomosaic pattern with farmland, grass, field boundaries
  const grad = context.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  grad.addColorStop(0, "#2d4a22");
  grad.addColorStop(0.35, "#3b5e2b");
  grad.addColorStop(0.7, "#243e1d");
  grad.addColorStop(1, "#1c3217");
  context.fillStyle = grad;
  context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Field patches
  context.fillStyle = "rgba(46, 125, 50, 0.4)";
  context.fillRect(40, 40, 200, 180);
  context.fillRect(280, 50, 320, 220);

  // Meandering river
  context.beginPath();
  context.moveTo(380, 0);
  context.bezierCurveTo(460, 150, 360, 300, 480, 500);
  context.lineWidth = 32;
  context.strokeStyle = "#0077b6";
  context.stroke();

  // Soil paths
  context.beginPath();
  context.moveTo(0, 415);
  context.lineTo(CANVAS_WIDTH, 415);
  context.lineWidth = 45;
  context.strokeStyle = "#8d6e63";
  context.stroke();
}

function isPointInPolygon(point, vs) {
  const x = point[0], y = point[1];
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i][0], yi = vs[i][1];
    const xj = vs[j][0], yj = vs[j][1];
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function getCanvasCoords(event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return [
    (event.clientX - rect.left) * scaleX,
    (event.clientY - rect.top) * scaleY
  ];
}

function handleCanvasMouseMove(event) {
  const pt = getCanvasCoords(event);
  let found = null;
  for (let p of CADASTRAL_PARCELS) {
    if (isPointInPolygon(pt, p.points)) {
      found = p;
      break;
    }
  }
  if (found !== hoveredParcel) {
    hoveredParcel = found;
    canvas.style.cursor = found ? "pointer" : "default";
    renderGISCanvas();
  }
}

function handleCanvasClick(event) {
  const pt = getCanvasCoords(event);
  for (let p of CADASTRAL_PARCELS) {
    if (isPointInPolygon(pt, p.points)) {
      selectedParcel = p;
      updateParcelDetailsPanel(p);
      updatePropertyCardDraft(p);
      renderGISCanvas();
      break;
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar Parcel Details View
// ─────────────────────────────────────────────────────────────────────────────

function updateParcelDetailsPanel(parcel) {
  if (!parcel) return;

  document.getElementById("detail-ulpin").textContent = parcel.ulpin;
  document.getElementById("detail-owner").textContent = parcel.owner;
  document.getElementById("detail-category").textContent = parcel.category;
  document.getElementById("detail-area").textContent = `${parcel.area_sqm} sq.m (${parcel.area_sqft} sq.ft)`;
  document.getElementById("detail-perimeter").textContent = `${parcel.perimeter_m} meters`;
  document.getElementById("detail-khasra").textContent = parcel.khasra;

  const confBadge = document.getElementById("detail-confidence");
  if (parcel.confidence >= 0.85) {
    confBadge.className = "badge-confidence-high";
    confBadge.textContent = `${(parcel.confidence * 100).toFixed(1)}% (High)`;
  } else {
    confBadge.className = "badge-confidence-alert";
    confBadge.textContent = `${(parcel.confidence * 100).toFixed(1)}% (Low - Flagged)`;
  }

  const verifElem = document.getElementById("detail-verification");
  verifElem.innerHTML = parcel.verificationNeeded
    ? "<span style='color: #dc2626; font-weight: bold;'>⚠️ Yes (Surveyor Ground Truthing Required)</span>"
    : "<span style='color: #16a34a; font-weight: bold;'>✅ No (AI Confidence Verified)</span>";
}

// ─────────────────────────────────────────────────────────────────────────────
// SVAMITVA Property Card Generator View
// ─────────────────────────────────────────────────────────────────────────────

function updatePropertyCardDraft(parcel) {
  if (!parcel) return;

  const ulpinElem = document.getElementById("card-ulpin-val");
  const ownerElem = document.getElementById("card-owner-val");
  const areaElem = document.getElementById("card-area-val");
  const khasraElem = document.getElementById("card-khasra-val");
  const verifElem = document.getElementById("card-verif-val");

  if (ulpinElem) ulpinElem.textContent = parcel.ulpin;
  if (ownerElem) ownerElem.textContent = parcel.owner;
  if (areaElem) areaElem.textContent = `${parcel.area_sqm} sq.m (${parcel.area_sqft} sq.ft)`;
  if (khasraElem) khasraElem.textContent = parcel.khasra;
  if (verifElem) {
    verifElem.textContent = parcel.verificationNeeded
      ? "⚠️ Subject to Physical Ground Truthing"
      : "✅ Digitally Verified via AeroSync Drone AI";
  }
}

function printPropertyCard() {
  window.print();
}

// ─────────────────────────────────────────────────────────────────────────────
// RAG & Cadastral LLM Chatbot
// ─────────────────────────────────────────────────────────────────────────────

const KNOWLEDGE_RESPONSES = {
  "default": "AeroSync Cadastral AI can assist you with SVAMITVA Scheme Guidelines, ULPIN generation, buffer zone violation audits, and Property Card drafting. How can I help you?",
  "ulpin": "The **Unique Land Parcel Identification Number (ULPIN)**, also called **'Bhu-Aadhaar'**, is a 14-digit unique alphanumeric identification number for each land parcel in India, derived from its international standard centroid coordinates (latitude and longitude).",
  "buffer": "Under rural cadastral revenue norms and environmental guidelines:\n1. **Water Bodies**: No permanent structure is permitted within **15 to 30 meters** of water bodies (Class 3).\n2. **Road Right-of-Way**: Minimum **3 to 6 meters** setback is mandatory from public roads.",
  "uncertainty": "When the AI model detects uncertainty (confidence < 0.70 or high Monte Carlo Dropout variance), the parcel is automatically flagged with **'Surveyor Verification Needed = True'**. A ground surveyor with GNSS/CORS rovers physically audits the site during the 30-day Gram Sabha public review window.",
  "card": "A standard **SVAMITVA Property Card (Gharoni / Sampatti Patra)** contains: ULPIN ID, State/District/Village LGD code, Khasra Number, Owner details, exact built-up area in sq.m and sq.ft, boundary dimensions, and the Surveyor verification seal.",
  "hindi_gaon": "AeroSync drone survey me **2 Residential Buildings**, **1 Water Body (Talab)**, aur **1 Road** detect hue hain. Total built-up area **233.5 sq.m** hai aur Parcel `ULPIN-26012-0045` par surveyor verification flag laga hai."
};

function initChatbot() {
  const sendBtn = document.getElementById("sendChatBtn");
  const chatInput = document.getElementById("chatInputField");

  if (!sendBtn || !chatInput) return;

  sendBtn.addEventListener("click", () => handleSendMessage());
  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleSendMessage();
  });

  // Quick prompt buttons
  const promptBtns = document.querySelectorAll(".quick-prompt-btn");
  promptBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      chatInput.value = btn.textContent.trim();
      handleSendMessage();
    });
  });
}

function handleSendMessage() {
  const chatInput = document.getElementById("chatInputField");
  const messagesContainer = document.getElementById("chatMessages");
  const userText = chatInput.value.trim();
  if (!userText) return;

  // Append user message
  appendChatBubble("user", userText);
  chatInput.value = "";

  // Bot response with simulated thinking delay
  setTimeout(() => {
    const qLower = userText.toLowerCase();
    let botReply = KNOWLEDGE_RESPONSES["default"];

    if (qLower.includes("ulpin") || qLower.includes("aadhaar")) {
      botReply = KNOWLEDGE_RESPONSES["ulpin"];
    } else if (qLower.includes("buffer") || qLower.includes("encroachment") || qLower.includes("talab") || qLower.includes("setback")) {
      botReply = KNOWLEDGE_RESPONSES["buffer"];
    } else if (qLower.includes("uncertainty") || qLower.includes("doubt") || qLower.includes("confidence")) {
      botReply = KNOWLEDGE_RESPONSES["uncertainty"];
    } else if (qLower.includes("property card") || qLower.includes("gharoni") || qLower.includes("kagaz")) {
      botReply = KNOWLEDGE_RESPONSES["card"];
    } else if (qLower.includes("kitne") || qLower.includes("area") || qLower.includes("gaon")) {
      botReply = KNOWLEDGE_RESPONSES["hindi_gaon"];
    }

    appendChatBubble("bot", botReply);
  }, 400);
}

function appendChatBubble(sender, text) {
  const messagesContainer = document.getElementById("chatMessages");
  const bubble = document.createElement("div");
  bubble.className = `chat-bubble ${sender}`;
  bubble.innerHTML = text.replace(/\n/g, "<br>");
  messagesContainer.appendChild(bubble);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}
