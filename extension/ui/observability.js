(function () {
  "use strict";

  // Documented inventory only. No fixture is represented as a live observation.
  var regions = [
    { id: "chatgpt.app-shell", title: "Estructura general", desc: "Contenedor principal, distribución, landmarks semánticos y cambios de layout." },
    { id: "chatgpt.sidebar", title: "Panel lateral", desc: "Visibilidad, colapso/expansión, navegación y controles del panel." },
    { id: "chatgpt.sidebar.projects", title: "Proyectos", desc: "Lista de proyectos y controles visibles para abrir o gestionar un proyecto." },
    { id: "chatgpt.sidebar.conversations", title: "Conversaciones", desc: "Historial, selección, creación, búsqueda y navegación entre conversaciones." },
    { id: "chatgpt.conversation.viewport", title: "Área de conversación", desc: "Orden de turnos, scroll, carga y cambios estructurales visibles." },
    { id: "chatgpt.composer", title: "Compositor de mensaje", desc: "Entrada, adjuntos, herramientas/modelo visibles y controles enviar/detener." },
    { id: "chatgpt.turn-actions", title: "Acciones de mensaje", desc: "Copiar, editar, regenerar, valorar y demás controles disponibles por turno." },
    { id: "chatgpt.conversation-actions", title: "Acciones de conversación", desc: "Compartir, menú de más opciones y controles a nivel de conversación." },
    { id: "chatgpt.transient-menus", title: "Menús contextuales", desc: "Menús y popovers que aparecen al activar controles de la aplicación." },
    { id: "chatgpt.dialogs-overlays", title: "Diálogos y overlays", desc: "Confirmaciones, selectores, paneles superpuestos y sus transiciones de apertura/cierre." },
    { id: "chatgpt.status-errors", title: "Estados y errores", desc: "Generación, streaming, cancelación, límites, avisos, fallos y reintentos visibles." }
  ];

  var list = document.getElementById("regionList");
  var count = document.getElementById("regionCount");
  if (!list || !count) return;
  count.textContent = String(regions.length);

  regions.forEach(function (region, index) {
    var article = document.createElement("article");
    article.className = "region";
    var main = document.createElement("div");
    main.className = "region-main";
    var number = document.createElement("span");
    number.className = "region-index";
    number.textContent = String(index + 1).padStart(2, "0");
    var copy = document.createElement("div");
    copy.className = "region-copy";
    var title = document.createElement("h3");
    title.className = "region-title";
    title.textContent = region.title;
    var desc = document.createElement("p");
    desc.className = "region-desc";
    desc.textContent = region.desc;
    var id = document.createElement("code");
    id.className = "region-id";
    id.textContent = region.id;
    copy.append(title, desc, id);
    main.append(number, copy);
    var state = document.createElement("span");
    state.className = "region-state";
    state.textContent = "Definida · sin verificar";
    article.append(main, state);
    list.appendChild(article);
  });

  // The current durable observation package covers Cloud Interpreter, not ChatGPT.
  // Do not infer live coverage from a different platform's data.
  document.getElementById("observedCount").textContent = "N/V";
  document.getElementById("excludedCount").textContent = "1";
})();
