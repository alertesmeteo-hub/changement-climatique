/* Rendu de la carte choroplèthe régionale — réutilisé par les 4 pages « module ». */
(function () {
  const hazard = HAZARDS[HAZARD_KEY];
  if (!hazard) return;

  let currentYear = 2050;
  let scaleMode = "relative"; // "relative" (contraste de l'horizon affiché) ou "absolute" (échelle fixe 2050-2100)
  let selectedCode = null;
  let regionLayers = {};
  let geoLayer = null;

  const mapEl = document.getElementById("map");
  const legendEl = document.getElementById("legend");
  const panelEl = document.getElementById("panel-content");
  const rankingEl = document.getElementById("ranking-list");
  const regionSelectEl = document.getElementById("region-select");

  document.documentElement.style.setProperty("--hazard", hazard.color);

  const FRANCE_CENTER = [46.6, 2.2];
  const FRANCE_ZOOM = 5.4;

  const map = L.map(mapEl, {
    zoomControl: true,
    scrollWheelZoom: true,
    minZoom: 4.5,
    maxZoom: 8,
  }).setView(FRANCE_CENTER, FRANCE_ZOOM);

  const CARTO_API_KEY = "cb1_44pv_1_061e7c9f2a11f7b414858440";
  L.tileLayer(`https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png?key=${CARTO_API_KEY}`, {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 19,
  }).addTo(map);

  const ResetControl = L.Control.extend({
    options: { position: "topright" },
    onAdd() {
      const btn = L.DomUtil.create("button", "map-reset-btn");
      btn.type = "button";
      btn.textContent = "Vue France";
      L.DomEvent.disableClickPropagation(btn);
      btn.addEventListener("click", () => map.setView(FRANCE_CENTER, FRANCE_ZOOM));
      return btn;
    },
  });
  map.addControl(new ResetControl());

  function getValue(code, year) {
    const region = REGIONS[code];
    if (!region) return null;
    const group = region[hazard.group];
    if (!group) return null;
    const series = group[hazard.metric];
    if (!series) return null;
    const v = series[year];
    return typeof v === "number" ? v : null;
  }

  function domainValues() {
    if (scaleMode === "absolute") {
      return Object.keys(REGIONS).flatMap((code) => [getValue(code, 2050), getValue(code, 2100)]);
    }
    return Object.keys(REGIONS).map((code) => getValue(code, currentYear));
  }

  function colorScale(values) {
    const nums = values.filter((v) => typeof v === "number");
    const min = Math.min(...nums);
    const max = Math.max(...nums);
    const steps = 5;
    const palette = shadeRamp(hazard.color, steps);
    return {
      min,
      max,
      color(v) {
        if (typeof v !== "number") return "#d8dee7";
        if (max === min) return palette[palette.length - 1];
        const t = (v - min) / (max - min);
        const idx = Math.min(steps - 1, Math.floor(t * steps));
        return palette[idx];
      },
    };
  }

  function shadeRamp(hex, steps) {
    const rgb = hexToRgb(hex);
    const ramp = [];
    for (let i = 0; i < steps; i++) {
      const t = (i + 1) / steps;
      const r = Math.round(255 - (255 - rgb.r) * t);
      const g = Math.round(255 - (255 - rgb.g) * t);
      const b = Math.round(255 - (255 - rgb.b) * t);
      ramp.push(`rgb(${r},${g},${b})`);
    }
    return ramp;
  }

  function hexToRgb(hex) {
    const m = hex.replace("#", "");
    return {
      r: parseInt(m.substring(0, 2), 16),
      g: parseInt(m.substring(2, 4), 16),
      b: parseInt(m.substring(4, 6), 16),
    };
  }

  function renderLegend(scale) {
    const swatches = shadeRamp(hazard.color, 5)
      .map((c) => `<span style="background:${c}"></span>`)
      .join("");
    const modeLabel = scaleMode === "absolute" ? "Échelle fixe 2050-2100" : "Échelle relative à l'horizon affiché";
    legendEl.innerHTML = `
      <div class="legend-scale">${swatches}</div>
      <span>${fmt(scale.min)} ${hazard.unit}</span>
      <span>→</span>
      <span>${fmt(scale.max)} ${hazard.unit}</span>
      <span style="margin-left:auto">${modeLabel} · Horizon ${currentYear}</span>
    `;
  }

  function fmt(v) {
    if (v === null || v === undefined) return "n.d.";
    const sign = hazard.unit === "%" && v > 0 ? "+" : "";
    return sign + (Math.round(v * 10) / 10).toString().replace(".", ",");
  }

  function renderRanking(scale) {
    const rows = Object.entries(REGIONS)
      .map(([code, r]) => ({ code, nom: r.nom, v: getValue(code, currentYear) }))
      .sort((a, b) => (b.v ?? -Infinity) - (a.v ?? -Infinity));

    rankingEl.innerHTML = rows
      .map((row) => {
        const pct = row.v === null ? 0 : Math.max(4, ((row.v - scale.min) / (scale.max - scale.min || 1)) * 100);
        return `
          <div class="rank-row" data-code="${row.code}">
            <span class="rn">${row.nom}</span>
            <span class="bar-track"><span class="bar-fill" style="width:${pct}%"></span></span>
            <span class="rv">${fmt(row.v)}</span>
          </div>
        `;
      })
      .join("");

    rankingEl.querySelectorAll(".rank-row").forEach((el) => {
      el.addEventListener("click", () => selectRegion(el.getAttribute("data-code")));
      el.addEventListener("mouseenter", () => highlightRegion(el.getAttribute("data-code"), true));
      el.addEventListener("mouseleave", () => highlightRegion(el.getAttribute("data-code"), false));
    });
  }

  function metricRow(label, value, unit) {
    const cls = value === null || value === undefined ? "v na" : "v";
    const sign = unit === "%" && typeof value === "number" && value > 0 ? "+" : "";
    const text = value === null || value === undefined ? "n.d." : `${sign}${fmt(value).replace(sign,"")} ${unit}`;
    return `<div class="metric-row"><span>${label}</span><span class="${cls}">${text}</span></div>`;
  }

  function renderPanel(code) {
    const region = REGIONS[code];
    if (!region) {
      panelEl.innerHTML = '<p class="placeholder">Survolez ou cliquez une région sur la carte pour afficher son profil détaillé.</p>';
      return;
    }
    const group = region[hazard.group];
    let metrics = "";
    if (hazard.group === "chaleur") {
      metrics =
        metricRow("Jours ≥ 35 °C — référence", group.joursGe35.ref, "j/an") +
        metricRow(`Jours ≥ 35 °C — ${currentYear}`, group.joursGe35[currentYear], "j/an") +
        metricRow(`Nuits chaudes (>20 °C) — ${currentYear}`, group.nuitsChaudes[currentYear], "n/an");
    } else if (hazard.group === "secheresse") {
      metrics =
        metricRow("Jours de sol sec — référence", group.joursSolSec.ref, "j/an") +
        metricRow(`Jours de sol sec — ${currentYear}`, group.joursSolSec[currentYear], "j/an") +
        metricRow(`Pluie d'été — ${currentYear}`, group.pluieEte[currentYear], "%");
    } else if (hazard.group === "feux") {
      metrics =
        metricRow("Danger élevé — référence", group.joursDanger.ref, "j/an") +
        metricRow(`Danger élevé — ${currentYear}`, group.joursDanger[currentYear], "j/an");
    } else if (hazard.group === "pluies") {
      metrics = metricRow(`Intensité pluies fortes — ${currentYear}`, group.intensite[currentYear], "%");
    }

    panelEl.innerHTML = `
      <div class="region-name">${region.nom}</div>
      <div class="region-sub">Réchauffement moyen ${currentYear} : +${region.tempAnnuelle[currentYear].toString().replace(".", ",")} °C</div>
      <div class="metric-list">${metrics}</div>
      <a class="tag-note" style="display:block;text-decoration:none" href="${region.source}" target="_blank" rel="noopener">Voir la fiche Météo-France de cette région →</a>
    `;
  }

  function highlightRegion(code, on) {
    const layer = regionLayers[code];
    if (!layer) return;
    layer.setStyle(on ? { weight: 3, color: "#10233f" } : { weight: 1, color: "#ffffff" });
    if (on) layer.bringToFront();
  }

  function selectRegion(code, opts) {
    selectedCode = code;
    renderPanel(code);
    Object.keys(regionLayers).forEach((c) => highlightRegion(c, c === code));
    if (regionSelectEl && regionSelectEl.value !== code) regionSelectEl.value = code || "";
    if (opts && opts.flyTo && regionLayers[code]) {
      map.flyToBounds(regionLayers[code].getBounds(), { maxZoom: 7.5, duration: 0.6 });
    }
  }

  function draw() {
    const scale = colorScale(domainValues());

    if (geoLayer) map.removeLayer(geoLayer);
    regionLayers = {};

    geoLayer = L.geoJSON(REGIONS_GEOJSON, {
      style: (feature) => {
        const v = getValue(feature.properties.code, currentYear);
        return {
          fillColor: scale.color(v),
          weight: 1,
          color: "#ffffff",
          fillOpacity: 0.9,
        };
      },
      onEachFeature: (feature, layer) => {
        const code = feature.properties.code;
        regionLayers[code] = layer;
        const v = getValue(code, currentYear);
        layer.bindTooltip(`${feature.properties.nom} · ${fmt(v)} ${hazard.unit}`, {
          className: "region-tooltip",
          sticky: true,
        });
        layer.on("mouseover", () => highlightRegion(code, true));
        layer.on("mouseout", () => highlightRegion(code, code === selectedCode));
        layer.on("click", () => selectRegion(code));
      },
    }).addTo(map);

    renderLegend(scale);
    renderRanking(scale);
    if (selectedCode) renderPanel(selectedCode);
  }

  document.querySelectorAll("#horizon-toggle button").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#horizon-toggle button").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentYear = parseInt(btn.getAttribute("data-year"), 10);
      draw();
    });
  });

  document.querySelectorAll("#scale-toggle button").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#scale-toggle button").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      scaleMode = btn.getAttribute("data-scale");
      draw();
    });
  });

  if (regionSelectEl) {
    const options = Object.entries(REGIONS)
      .map(([code, r]) => ({ code, nom: r.nom }))
      .sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
    regionSelectEl.innerHTML =
      '<option value="">Choisir une région…</option>' +
      options.map((o) => `<option value="${o.code}">${o.nom}</option>`).join("");
    regionSelectEl.addEventListener("change", () => {
      if (regionSelectEl.value) selectRegion(regionSelectEl.value, { flyTo: true });
    });
  }

  renderPanel(null);
  draw();
})();
