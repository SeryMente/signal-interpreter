const BRIDGE_URL = "ws://127.0.0.1:8787/";
const STORAGE_KEY = "signalInterpreterState";
const YO_KEY = "signalInterpreterYo";
const MAX_SEGMENTS = 200;

let socket = null;
let reconnectTimer = null;
let reconnectDelay = 500;
let state = {
  bridge: "disconnected",
  caption: "idle",
  clientSegments: [],
  lastEvent: null,
  connectedAt: null,
  lastHeartbeat: null
};

restoreState();

function restoreState() {
  chrome.storage.local.get([STORAGE_KEY]).then((saved) => {
    if (saved[STORAGE_KEY]) {
      state = { ...state, ...saved[STORAGE_KEY] };
    }
    connect();
  }).catch(connect);
}

function connect() {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return;
  }

  clearTimeout(reconnectTimer);
  state.bridge = "connecting";
  publishState();

  try {
    socket = new WebSocket(BRIDGE_URL);
  } catch {
    scheduleReconnect();
    return;
  }

  socket.addEventListener("open", () => {
    reconnectDelay = 500;
    state.bridge = "connected";
    state.connectedAt = new Date().toISOString();
    publishState();
  });

  socket.addEventListener("message", (event) => {
    try {
      handleEvent(JSON.parse(event.data));
    } catch {
      state.lastEvent = {
        type: "bridge.error",
        error: "Invalid JSON from local bridge",
        timestamp: new Date().toISOString()
      };
      publishState();
    }
  });

  socket.addEventListener("close", () => {
    state.bridge = "disconnected";
    socket = null;
    publishState();
    scheduleReconnect();
  });

  socket.addEventListener("error", () => {
    state.bridge = "error";
    publishState();
  });
}

function scheduleReconnect() {
  clearTimeout(reconnectTimer);
  reconnectTimer = setTimeout(connect, reconnectDelay);
  reconnectDelay = Math.min(reconnectDelay * 2, 15000);
}

function handleEvent(event) {
  if (event.type === "caption.delta" || event.type === "caption.revision") {
    // Diagnóstico bruto: no persiste ni actualiza la UI.
    state.lastEvent = event;
    return;
  }

  state.lastEvent = event;

  if (event.type === "bridge.connected" || event.type === "bridge.heartbeat") {
    state.bridge = "connected";
    if (event.type === "bridge.heartbeat") {
      state.lastHeartbeat = event.timestamp || new Date().toISOString();
    }
  } else if (event.type === "caption.status") {
    state.caption = event.status === "found" ? "capturing" : "idle";
  } else if (event.type === "caption.segment" && typeof event.text === "string") {
    const text = event.text.trim();
    if (text) {
      state.clientSegments.push({
        id: `${event.sequence ?? Date.now()}-${Date.now()}`,
        text,
        timestamp: event.timestamp || new Date().toISOString(),
        reason: event.reason || "stable"
      });

      if (state.clientSegments.length > MAX_SEGMENTS) {
        state.clientSegments = state.clientSegments.slice(-MAX_SEGMENTS);
      }
    }
  }

  publishState();
}

async function publishState() {
  try {
    await chrome.storage.local.set({ [STORAGE_KEY]: state });
  } catch {}

  try {
    await chrome.runtime.sendMessage({ type: "STATE_UPDATED", state });
  } catch {}
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "GET_STATE") {
    sendResponse(state);
    return true;
  }

  if (message?.type === "CLEAR_CLIENTE") {
    state.clientSegments = [];
    publishState().then(() => sendResponse({ ok: true }));
    return true;
  }

  if (message?.type === "CONNECT") {
    connect();
    sendResponse({ ok: true });
    return true;
  }

  if (message?.type === "GET_YO") {
    chrome.storage.local.get(YO_KEY).then((saved) => sendResponse({ value: saved[YO_KEY] ?? "" }));
    return true;
  }

  if (message?.type === "SET_YO") {
    chrome.storage.local.set({ [YO_KEY]: String(message.value ?? "") }).then(() => sendResponse({ ok: true }));
    return true;
  }

  return false;
});

chrome.runtime.onStartup.addListener(connect);
