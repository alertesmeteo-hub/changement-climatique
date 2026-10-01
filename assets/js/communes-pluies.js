/*
 * Explorateur communal des pluies — horizons TRACC 2050 / 2100.
 * Calculé à partir des données brutes Météo-France DRIAS (modèle ALADIN63,
 * le modèle climatique régional de Météo-France), moyennées sur les ~20 ans
 * de chaque horizon puis affectées à chaque commune par le point de grille
 * le plus proche (résolution ~8 km). Voir la page Méthode.
 */
(function () {
  const DATA_URL = "assets/data/communes_pluies.json";
  const GEOM_URL = "assets/data/communes.geojson";

  const VARIABLES = [
    { key: "cumulAn", label: "Cumul annuel", unit: "mm/an", palette: "blues" },
    { key: "cumulHiver", label: "Cumul hivernal (DJF)", unit: "mm", palette: "purples" },
    { key: "cumulEte", label: "Cumul estival (JJA)", unit: "mm", palette: "oranges" },
    { key: "intensitePct", label: "Intensité des pluies extrêmes — évolution", unit: "%", palette: "reds" },
    { key: "freqJours", label: "Jours de pluie remarquable (> 99e percentile)", unit: "j/an", palette: "yellows" },
  ];

  const PALETTES = {
    blues: ["#dce9f5", "#9dc4e0", "#5b9ec9", "#2476b5", "#084594"],
    purples: ["#eee5f4", "#c5aede", "#9970c1", "#7441b5", "#49006a"],
    oranges: ["#feedde", "#fdbe85", "#fd8d3c", "#e6550d", "#a63603"],
    reds: ["#fee5d9", "#fc9272", "#fb6a4a", "#de2d26", "#a50f15"],
    yellows: ["#ffffd4", "#fed98e", "#fe9929", "#d95f0e", "#993404"],
  };

  // Grille bivariée 3x3 (intensité x fréquence), palette inspirée Joshua Stevens.
  const BIVAR_COLORS = [
    ["#e8e8e8", "#b8d6d6", "#5ac8c8"],
    ["#dcb6d6", "#a8abc9", "#5c93b8"],
    ["#be64ac", "#8c62aa", "#3b4994"],
  ];

  let currentYear = 2050;
  let currentVarKey = "intensitePct";
  let currentMode = "univar"; // "univar" | "bivar"
  let byInsee = {};
  let allRows = [];
  let statsCache = {}; // statsCache[year][varKey]
  let geoLayer = null;
  let selectedLayer = null;

  const mapEl = document.getElementById("map");
  const legendEl = document.getElementById("legend");
  const panelEl = document.getElementById("panel-content");
  const statsEl = document.getElementById("commune-stats");
  const varPickerEl = document.getElementById("var-picker");
  const modeToggleEl = document.getElementById("mode-toggle");
  const horizonToggleEl = document.getElementById("horizon-toggle");
  const searchInput = document.getElementById("commune-search");
  const searchResults = document.getElementById("commune-search-results");
  const loadingEl = document.getElementById("map-loading");

  const map = L.map(mapEl, {
    center: [46.6, 2.2],
    zoom: 5.4,
    minZoom: 4.5,
    maxZoom: 13,
    zoomControl: true,
    preferCanvas: true,
  });

  const CARTO_API_KEY = "cb1_44pv_1_061e7c9f2a11f7b414858440";
  L.tileLayer(`https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png?key=${CARTO_API_KEY}`, {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 19,
  }).addTo(map);

  function fmt(v, decimals) {
    if (v === null || v === undefined || Number.isNaN(v)) return "n.d.";
    const sign = v > 0 && decimals === "pct" ? "+" : "";
    return sign + v.toLocaleString("fr-FR", { maximumFractionDigits: 1 });
  }

  function val(row, key) {
    return row && row[key] ? row[key][currentYear] : null;
  }

  function computeQuantileBreaks(sortedVals, nClasses) {
    const breaks = [];
    for (let i = 1; i < nClasses; i++) {
      breaks.push(sortedVals[Math.floor((sortedVals.length * i) / nClasses)]);
    }
    return breaks;
  }

  function computeStatsFor(year) {
    const out = {};
    VARIABLES.forEach((v) => {
      const vals = allRows.map((r) => r[v.key] && r[v.key][year]).filter((x) => typeof x === "number");
      vals.sort((a, b) => a - b);
      const n = vals.length;
      out[v.key] = {
        min: vals[0],
        max: vals[n - 1],
        mean: vals.reduce((s, x) => s + x, 0) / n,
        breaks5: computeQuantileBreaks(vals, 5),
        breaks3: computeQuantileBreaks(vals, 3),
      };
    });
    return out;
  }

  function classify(value, breaks) {
    let cls = 0;
    for (let i = 0; i < breaks.length; i++) if (value >= breaks[i]) cls = i + 1;
    return cls;
  }

  function colorForValue(value, varKey) {
    if (typeof value !== "number") return "#d8dee7";
    const varDef = VARIABLES.find((v) => v.key === varKey);
    const st = statsCache[currentYear][varKey];
    return PALETTES[varDef.palette][classify(value, st.breaks5)];
  }

  function colorForBivar(row) {
    const st = statsCache[currentYear];
    const iv = val(row, "intensitePct");
    const fv = val(row, "freqJours");
    if (typeof iv !== "number" || typeof fv !== "number") return "#d8dee7";
    const ci = classify(iv, st.intensitePct.breaks3);
    const cf = classify(fv, st.freqJours.breaks3);
    return BIVAR_COLORS[cf][ci];
  }

  function colorForRow(row) {
    return currentMode === "bivar" ? colorForBivar(row) : colorForValue(val(row, currentVarKey), currentVarKey);
  }

  function getInsee(feature) {
    return feature.properties.code || feature.properties.insee || "";
  }

  function buildTooltip(row) {
    if (currentMode === "bivar") {
      return `<div class="tt-name">${row.nom}</div>
        <div>Intensité : <b>${fmt(val(row, "intensitePct"))}</b> %</div>
        <div>Jours remarquables : <b>${fmt(val(row, "freqJours"))}</b> j/an</div>`;
    }
    const varDef = VARIABLES.find((v) => v.key === currentVarKey);
    return `<div class="tt-name">${row.nom}</div><div><b>${fmt(val(row, currentVarKey))}</b> ${varDef.unit}</div>`;
  }

  function renderVarPicker() {
    varPickerEl.innerHTML = VARIABLES.map(
      (v) => `<button type="button" class="var-card${v.key === currentVarKey && currentMode === "univar" ? " active" : ""}" data-key="${v.key}">${v.label}</button>`
    ).join("");
    varPickerEl.querySelectorAll(".var-card").forEach((btn) => {
      btn.addEventListener("click", () => {
        currentVarKey = btn.getAttribute("data-key");
        currentMode = "univar";
        syncToggles();
        refresh();
      });
    });
  }

  function syncToggles() {
    modeToggleEl.querySelectorAll("button").forEach((b) => b.classList.toggle("active", b.getAttribute("data-mode") === currentMode));
    horizonToggleEl.querySelectorAll("button").forEach((b) => b.classList.toggle("active", parseInt(b.getAttribute("data-year"), 10) === currentYear));
    varPickerEl.querySelectorAll(".var-card").forEach((b) => b.classList.toggle("active", currentMode === "univar" && b.getAttribute("data-key") === currentVarKey));
  }

  function renderLegend() {
    if (currentMode === "bivar") {
      legendEl.innerHTML = `
        <div class="bivar-legend">
          <div class="bivar-grid">
            ${BIVAR_COLORS.map((row) => row.map((c) => `<span style="background:${c}"></span>`).join("")).join("")}
          </div>
          <div class="bivar-axes">
            <span class="bivar-axis-x">Intensité →</span>
            <span class="bivar-axis-y">Jours remarquables →</span>
          </div>
        </div>
        <span style="margin-left:auto">${allRows.length.toLocaleString("fr-FR")} communes · horizon ${currentYear}</span>
      `;
      return;
    }
    const varDef = VARIABLES.find((v) => v.key === currentVarKey);
    const st = statsCache[currentYear][currentVarKey];
    const swatches = PALETTES[varDef.palette].map((c) => `<span style="background:${c}"></span>`).join("");
    legendEl.innerHTML = `
      <div class="legend-scale">${swatches}</div>
      <span>${fmt(st.min)} ${varDef.unit}</span>
      <span>→</span>
      <span>${fmt(st.max)} ${varDef.unit}</span>
      <span style="margin-left:auto">${allRows.length.toLocaleString("fr-FR")} communes · horizon ${currentYear}</span>
    `;
  }

  function renderStats() {
    if (currentMode === "bivar") {
      const si = statsCache[currentYear].intensitePct;
      const sf = statsCache[currentYear].freqJours;
      statsEl.innerHTML = `
        <div class="metric-row"><span>Intensité moyenne</span><span class="v">${fmt(si.mean)} %</span></div>
        <div class="metric-row"><span>Jours remarquables moyens</span><span class="v">${fmt(sf.mean)} j/an</span></div>
      `;
      return;
    }
    const varDef = VARIABLES.find((v) => v.key === currentVarKey);
    const st = statsCache[currentYear][currentVarKey];
    statsEl.innerHTML = `
      <div class="metric-row"><span>Minimum national</span><span class="v">${fmt(st.min)} ${varDef.unit}</span></div>
      <div class="metric-row"><span>Moyenne nationale</span><span class="v">${fmt(st.mean)} ${varDef.unit}</span></div>
      <div class="metric-row"><span>Maximum national</span><span class="v">${fmt(st.max)} ${varDef.unit}</span></div>
    `;
  }

  function renderPanel(row) {
    if (!row) {
      panelEl.innerHTML = '<p class="placeholder">Survolez ou cliquez une commune sur la carte, ou utilisez la recherche.</p>';
      return;
    }
    const rows = VARIABLES.map((v) => {
      const highlight = currentMode === "bivar" && (v.key === "intensitePct" || v.key === "freqJours");
      return `<div class="metric-row"><span>${v.label}</span><span class="v${highlight ? " highlight-bivar" : ""}">${fmt(val(row, v.key))} ${v.unit}</span></div>`;
    }).join("");
    panelEl.innerHTML = `
      <div class="region-name">${row.nom}</div>
      <div class="region-sub">Code INSEE ${row.code_insee} · horizon ${currentYear}</div>
      <div class="metric-list">${rows}</div>
    `;
  }

  let lastPanelRow = null;

  function refresh() {
    if (!geoLayer) return;
    geoLayer.eachLayer((layer) => {
      const row = byInsee[getInsee(layer.feature)];
      layer.setStyle({ fillColor: row ? colorForRow(row) : "#d8dee7" });
      if (row) layer.setTooltipContent ? layer.setTooltipContent(buildTooltip(row)) : null;
    });
    renderLegend();
    renderStats();
    syncToggles();
    if (lastPanelRow) renderPanel(lastPanelRow);
  }

  modeToggleEl.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentMode = btn.getAttribute("data-mode");
      refresh();
    });
  });

  horizonToggleEl.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentYear = parseInt(btn.getAttribute("data-year"), 10);
      refresh();
    });
  });

  function setupSearch() {
    searchInput.addEventListener("input", () => {
      const q = searchInput.value.trim().toLowerCase();
      if (q.length < 2) {
        searchResults.style.display = "none";
        return;
      }
      const matches = allRows
        .filter((r) => r.nom.toLowerCase().includes(q) || r.code_insee.startsWith(q))
        .slice(0, 8);
      if (!matches.length) {
        searchResults.style.display = "none";
        return;
      }
      searchResults.style.display = "block";
      searchResults.innerHTML = matches
        .map((r) => `<div class="search-item" data-insee="${r.code_insee}">${r.nom} <span class="dept">· ${r.code_insee.slice(0, 2)}</span></div>`)
        .join("");
      searchResults.querySelectorAll(".search-item").forEach((el) => {
        el.addEventListener("click", () => {
          searchInput.value = "";
          searchResults.style.display = "none";
          zoomToCommune(el.getAttribute("data-insee"));
        });
      });
    });
    document.addEventListener("click", (e) => {
      if (!searchResults.contains(e.target) && e.target !== searchInput) searchResults.style.display = "none";
    });
  }

  function zoomToCommune(insee) {
    if (!geoLayer) return;
    geoLayer.eachLayer((layer) => {
      if (getInsee(layer.feature) !== insee) return;
      const row = byInsee[insee];
      if (layer.getBounds) map.fitBounds(layer.getBounds(), { maxZoom: 11, padding: [60, 60] });
      highlightLayer(layer);
      lastPanelRow = row || null;
      renderPanel(row || null);
    });
  }

  function highlightLayer(layer) {
    if (selectedLayer) geoLayer.resetStyle(selectedLayer);
    selectedLayer = layer;
    layer.setStyle({ weight: 2, color: "#10233f" });
    layer.bringToFront();
  }

  async function init() {
    const [rows, geomData] = await Promise.all([
      fetch(DATA_URL).then((r) => r.json()),
      fetch(GEOM_URL).then((r) => r.json()),
    ]);

    allRows = rows;
    byInsee = {};
    rows.forEach((r) => (byInsee[r.code_insee] = r));
    statsCache[2050] = computeStatsFor(2050);
    statsCache[2100] = computeStatsFor(2100);

    const renderer = L.canvas({ padding: 0.5 });
    geoLayer = L.geoJSON(geomData, {
      renderer,
      style: (feature) => {
        const row = byInsee[getInsee(feature)];
        return { weight: 0.25, color: "#ffffff", opacity: 0.6, fillOpacity: 0.9, fillColor: row ? colorForRow(row) : "#d8dee7" };
      },
      onEachFeature: (feature, layer) => {
        const row = byInsee[getInsee(feature)];
        if (row) layer.bindTooltip(buildTooltip(row), { className: "region-tooltip", sticky: true });
        layer.on("mouseover", () => layer.setStyle({ weight: 1.2, color: "#10233f" }));
        layer.on("mouseout", () => {
          if (layer !== selectedLayer) geoLayer.resetStyle(layer);
        });
        layer.on("click", () => {
          highlightLayer(layer);
          lastPanelRow = row || null;
          renderPanel(row || null);
        });
      },
    }).addTo(map);

    renderVarPicker();
    renderLegend();
    renderStats();
    setupSearch();
    if (loadingEl) loadingEl.remove();
  }

  init().catch((err) => {
    console.error("[pluies-communes] échec du chargement", err);
    if (loadingEl) loadingEl.innerHTML = '<p class="placeholder">Impossible de charger les données communales. Réessayez plus tard.</p>';
  });
})();
