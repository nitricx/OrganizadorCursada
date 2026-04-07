// Archivo JS extraído de correlatividades_tecnicatura_edicion_audiovisual.html
console.log("[LOG] Script JS cargado");
// ─── Datos ───────────────────────────────────────────────────────────────────
const materias = [
  {
    id: "PA1",
    name: "Producción Audiovisual 1",
    year: 1,
    q: 1,
    status: "pending",
    cursarReq: [],
    aprobarReq: [],
  },
  {
    id: "EA1",
    name: "Escritura Audiovisual 1",
    year: 1,
    q: 1,
    status: "pending",
    cursarReq: [],
    aprobarReq: [],
  },
  {
    id: "SEA",
    name: "Software en Edición Audiovisual",
    year: 1,
    q: 1,
    status: "pending",
    cursarReq: [],
    aprobarReq: [],
  },
  {
    id: "IyC1",
    name: "Iluminación y Cámara 1",
    year: 1,
    q: 2,
    status: "pending",
    cursarReq: [],
    aprobarReq: [],
  },
  {
    id: "HA1",
    name: "Historia del Arte 1",
    year: 1,
    q: 2,
    status: "pending",
    cursarReq: [],
    aprobarReq: [],
  },
  {
    id: "S1",
    name: "Sonido 1",
    year: 1,
    q: 2,
    status: "pending",
    cursarReq: [],
    aprobarReq: [],
  },
  {
    id: "M1",
    name: "Montaje 1",
    year: 1,
    q: 2,
    status: "pending",
    cursarReq: [],
    aprobarReq: [],
  },
  {
    id: "PROY1",
    name: "Proyecto Audiovisual 1",
    year: 1,
    q: 3,
    status: "pending",
    cursarReq: [],
    aprobarReq: [],
  },
  {
    id: "IyC2",
    name: "Iluminación y Cámara 2",
    year: 2,
    q: 1,
    status: "pending",
    cursarReq: ["Iluminación y Cámara 1"],
    aprobarReq: ["Iluminación y Cámara 1"],
  },
  {
    id: "S2",
    name: "Sonido 2",
    year: 2,
    q: 1,
    status: "pending",
    cursarReq: ["Sonido 1"],
    aprobarReq: ["Sonido 1"],
  },
  {
    id: "M2",
    name: "Montaje 2",
    year: 2,
    q: 1,
    status: "pending",
    cursarReq: ["Montaje 1", "Software en Edición Audiovisual"],
    aprobarReq: ["Montaje 1", "Software en Edición Audiovisual"],
  },
  {
    id: "PA2",
    name: "Producción Audiovisual 2",
    year: 2,
    q: 1,
    status: "pending",
    cursarReq: ["Producción Audiovisual 1"],
    aprobarReq: ["Producción Audiovisual 1"],
  },
  {
    id: "SC",
    name: "Software de Composición",
    year: 2,
    q: 2,
    status: "pending",
    cursarReq: [],
    aprobarReq: [],
  },
  {
    id: "IT",
    name: "Inglés Técnico",
    year: 2,
    q: 2,
    status: "pending",
    cursarReq: [],
    aprobarReq: [],
  },
  {
    id: "HA2",
    name: "Historia del Arte 2",
    year: 2,
    q: 2,
    status: "pending",
    cursarReq: ["Historia del Arte 1"],
    aprobarReq: ["Historia del Arte 1"],
  },
  {
    id: "EA2",
    name: "Escritura Audiovisual 2",
    year: 2,
    q: 2,
    status: "pending",
    cursarReq: ["Escritura Audiovisual 1"],
    aprobarReq: ["Escritura Audiovisual 1"],
  },
  {
    id: "PROY2",
    name: "Proyecto Audiovisual 2",
    year: 2,
    q: 3,
    status: "pending",
    cursarReq: ["Proyecto Audiovisual 1"],
    aprobarReq: ["Proyecto Audiovisual 1"],
  },
  {
    id: "DS",
    name: "Diseño Sonoro",
    year: 3,
    q: 1,
    status: "pending",
    cursarReq: [
      "Montaje 2",
      "Sonido 2",
      "Montaje 1",
      "Sonido 1",
      "Software en Edición Audiovisual",
    ],
    aprobarReq: [
      "Montaje 1",
      "Sonido 1",
      "Montaje 2",
      "Sonido 2",
      "Software en Edición Audiovisual",
    ],
  },
  {
    id: "HM",
    name: "Historia de los Medios",
    year: 3,
    q: 1,
    status: "pending",
    cursarReq: [],
    aprobarReq: [],
  },
  {
    id: "PProd1",
    name: "Postproducción Audiovisual 1",
    year: 3,
    q: 1,
    status: "pending",
    cursarReq: [
      "Montaje 1",
      "Sonido 1",
      "Montaje 2",
      "Sonido 2",
      "Software en Edición Audiovisual",
      "Software de Composición",
    ],
    aprobarReq: [
      "Montaje 1",
      "Sonido 1",
      "Montaje 2",
      "Sonido 2",
      "Software en Edición Audiovisual",
      "Software de Composición",
    ],
  },
  {
    id: "NC",
    name: "Nociones de Colorimetría",
    year: 3,
    q: 1,
    status: "pending",
    cursarReq: ["Iluminación y Cámara 1", "Iluminación y Cámara 2"],
    aprobarReq: ["Iluminación y Cámara 1", "Iluminación y Cámara 2"],
  },
  {
    id: "MD",
    name: "Montaje Documental",
    year: 3,
    q: 2,
    status: "pending",
    cursarReq: [
      "Montaje 1",
      "Sonido 1",
      "Montaje 2",
      "Sonido 2",
      "Software en Edición Audiovisual",
    ],
    aprobarReq: [
      "Montaje 1",
      "Sonido 1",
      "Montaje 2",
      "Sonido 2",
      "Software en Edición Audiovisual",
    ],
  },
  {
    id: "PProd2",
    name: "Postproducción Audiovisual 2",
    year: 3,
    q: 2,
    status: "pending",
    cursarReq: [
      "Montaje 1",
      "Sonido 1",
      "Montaje 2",
      "Sonido 2",
      "Software en Edición Audiovisual",
      "Software de Composición",
    ],
    aprobarReq: [
      "Montaje 1",
      "Sonido 1",
      "Montaje 2",
      "Sonido 2",
      "Software en Edición Audiovisual",
      "Software de Composición",
    ],
  },
  {
    id: "PP",
    name: "Práctica Profesional",
    year: 3,
    q: 2,
    status: "pending",
    cursarReq: [
      "Escritura Audiovisual 1",
      "Producción Audiovisual 1",
      "Iluminación y Cámara 1",
      "Montaje 1",
      "Sonido 1",
      "Proyecto Audiovisual 1",
      "Producción Audiovisual 2",
      "Montaje 2",
      "Sonido 2",
      "Iluminación y Cámara 2",
      "Escritura Audiovisual 2",
      "Proyecto Audiovisual 2",
      "Software en Edición Audiovisual",
      "Software de Composición",
      "Postproducción Audiovisual 1",
    ],
    aprobarReq: [
      "Escritura Audiovisual 1",
      "Producción Audiovisual 1",
      "Iluminación y Cámara 1",
      "Montaje 1",
      "Sonido 1",
      "Proyecto Audiovisual 1",
      "Producción Audiovisual 2",
      "Montaje 2",
      "Sonido 2",
      "Iluminación y Cámara 2",
      "Escritura Audiovisual 2",
      "Proyecto Audiovisual 2",
      "Software en Edición Audiovisual",
      "Software de Composición",
      "Postproducción Audiovisual 1",
    ],
  },
  {
    id: "PROY3",
    name: "Proyecto Audiovisual 3",
    year: 3,
    q: 3,
    status: "pending",
    cursarReq: [
      "Proyecto Audiovisual 1",
      "Producción Audiovisual 2",
      "Proyecto Audiovisual 2",
      "Producción Audiovisual 1",
    ],
    aprobarReq: [
      "Proyecto Audiovisual 1",
      "Producción Audiovisual 2",
      "Proyecto Audiovisual 2",
      "Producción Audiovisual 1",
    ],
  },
];

const nameToId = {};
materias.forEach((m) => {
  nameToId[m.name] = m.id;
});
function buildUnlockMap() {
  const map = {};
  materias.forEach((m) => {
    map[m.id] = new Set();
  });
  materias.forEach((target) => {
    const allReqs = [...new Set([...target.cursarReq, ...target.aprobarReq])];
    allReqs.forEach((reqName) => {
      const srcId = nameToId[reqName];
      if (srcId && map[srcId]) map[srcId].add(target.id);
    });
  });
  return map;
}
const unlockMap = buildUnlockMap();
function needsIds(m) {
  const all = [...new Set([...m.cursarReq, ...m.aprobarReq])];
  return all.map((n) => nameToId[n]).filter(Boolean);
}
function loadState() {
  try {
    const saved = localStorage.getItem("materiasStatus_tea");
    if (!saved) return;
    const obj = JSON.parse(saved);
    materias.forEach((m) => {
      if (obj[m.id]) m.status = obj[m.id];
    });
  } catch (e) {}
}
function saveState() {
  const obj = {};
  materias.forEach((m) => {
    obj[m.id] = m.status;
  });
  localStorage.setItem("materiasStatus_tea", JSON.stringify(obj));
}
function canCursar(m) {
  if (m.status !== "pending") return false;
  const aprobadas = new Set(
    materias.filter((x) => x.status === "approved").map((x) => x.name),
  );
  const enCursoOAprobadas = new Set(
    materias
      .filter((x) => x.status === "encurso" || x.status === "approved")
      .map((x) => x.name),
  );
  const cursarOk = m.cursarReq.every((r) => enCursoOAprobadas.has(r));
  const aprobarOk = m.aprobarReq.every((r) => aprobadas.has(r));
  return cursarOk && aprobarOk;
}
const grid = document.getElementById("grid");
const infoBar = document.getElementById("info");
const years = [1, 2, 3];
const qlabels = { 1: "1er cuatrimestre", 2: "2do cuatrimestre", 3: "Anual" };
let selectedId = null;
function render() {
  console.log("[LOG] render() llamada");
  grid.innerHTML = "";
  years.forEach((y) => {
    const col = document.createElement("div");
    col.className = "year-col";
    col.innerHTML = `<div class="year-label">${y}° Año</div>`;
    [1, 2, 3].forEach((q) => {
      const ms = materias.filter((m) => m.year === y && m.q === q);
      if (!ms.length) return;
      const sec = document.createElement("div");
      sec.className = "q-section";
      sec.innerHTML = `<div class="q-label">${qlabels[q]}</div>`;
      ms.forEach((m) => {
        const div = document.createElement("div");
        div.id = "mat-" + m.id;
        const classes = ["materia", m.status];
        if (canCursar(m)) classes.push("can-cursar");
        div.className = classes.join(" ");
        if (selectedId) {
          if (m.id === selectedId) {
            div.classList.add("selected");
          } else {
            const sel = materias.find((x) => x.id === selectedId);
            const needs = new Set(needsIds(sel));
            const unlocks = unlockMap[selectedId] || new Set();
            if (needs.has(m.id)) {
              div.classList.add("req-highlight");
            } else if (unlocks.has(m.id)) {
              div.classList.add("unlocks-highlight");
            }
            // No agregar la clase 'dim' para evitar el efecto de ocultar
          }
        }
        const tag =
          m.status === "approved"
            ? '<span class="tag">✓ aprobada</span>'
            : m.status === "encurso"
              ? '<span class="tag">● en curso</span>'
              : "";
        let ttBody = "";
        if (m.cursarReq.length) {
          ttBody += `<div class="tt-section">Para cursar:</div>`;
          m.cursarReq.forEach((r) => {
            ttBody += `<div class="tt-item">· ${r}</div>`;
          });
        }
        if (m.aprobarReq.length) {
          ttBody += `<div class="tt-section">Para aprobar:</div>`;
          m.aprobarReq.forEach((r) => {
            ttBody += `<div class="tt-item">· ${r}</div>`;
          });
        }
        const unlocksList = [...(unlockMap[m.id] || [])]
          .map((id) => materias.find((x) => x.id === id)?.name)
          .filter(Boolean);
        if (unlocksList.length) {
          ttBody += `<div class="tt-section">Habilita:</div>`;
          unlocksList.forEach((n) => {
            ttBody += `<div class="tt-item">· ${n}</div>`;
          });
        }
        if (!ttBody) ttBody = '<div class="tt-section">Sin correlativas</div>';
        div.innerHTML = `${m.name}${tag}
          <div class="tooltip">
            <div class="tt-title">${m.name}</div>
            ${ttBody}
          </div>`;
        console.log(`[LOG] Listener click agregado a: ${m.name} (${m.id})`);
        div.addEventListener("click", (e) => {
          console.log(`[LOG] Click en: ${m.name} (${m.id})`);
          e.stopPropagation();
          if (m.status === "pending") m.status = "encurso";
          else if (m.status === "encurso") m.status = "approved";
          else m.status = "pending";
          saveState();
          render();
        });
        div.addEventListener("mouseenter", () => {
          selectedId = m.id;
          // No llamar a render() aquí para evitar bucle de renderizados
          const needs = needsIds(m)
            .map((id) => materias.find((x) => x.id === id)?.name)
            .filter(Boolean);
          const unlocks = [...(unlockMap[m.id] || [])]
            .map((id) => materias.find((x) => x.id === id)?.name)
            .filter(Boolean);
          let msg = `<strong>${m.name}</strong>`;
          if (needs.length)
            msg += ` &nbsp;·&nbsp; <span style="color:#8a4a00">Requiere: ${needs.join(", ")}</span>`;
          if (unlocks.length)
            msg += ` &nbsp;·&nbsp; <span style="color:#0a5c3f">Habilita: ${unlocks.join(", ")}</span>`;
          if (!needs.length && !unlocks.length)
            msg += " &nbsp;·&nbsp; Sin correlativas";
          infoBar.innerHTML = msg;
        });
        sec.appendChild(div);
      });
      col.appendChild(sec);
    });
    grid.appendChild(col);
  });
}
document.addEventListener("click", () => {
  if (selectedId) {
    selectedId = null;
    render();
    infoBar.innerHTML =
      "Pasá el cursor sobre una materia para ver qué requiere y qué habilita.";
  }
});
document.getElementById("resetBtn").addEventListener("click", () => {
  if (!confirm("¿Reiniciar todas las materias a Pendiente?")) return;
  materias.forEach((m) => {
    m.status = "pending";
  });
  selectedId = null;
  saveState();
  render();
});
console.log("[LOG] Antes de loadState()");
loadState();
console.log("[LOG] Antes de render() inicial");
render();
console.log("[LOG] Después de render() inicial");
