const bridgeStatus = document.querySelector("#bridgeStatus");
const captionStatus = document.querySelector("#captionStatus");
const bridgeDot = document.querySelector("#bridgeDot");
const client = document.querySelector("#client");
const connect = document.querySelector("#connect");
const clear = document.querySelector("#clear");
const yo = document.querySelector("#yo");

function render(state) {
  const bridgeConnected = state?.bridge === "connected";

  bridgeDot.classList.toggle("online", bridgeConnected);
  bridgeStatus.textContent = bridgeConnected
    ? "Bridge conectado"
    : state?.bridge === "connecting"
      ? "Conectando…"
      : "Bridge desconectado";

  captionStatus.textContent =
    state?.caption === "capturing" ? "CLIENTE activo" : "Caption inactivo";

  const segments = state?.clientSegments ?? [];
  client.replaceChildren();

  if (!segments.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "Esperando señal externa…";
    client.appendChild(empty);
    return;
  }

  for (const segment of segments.slice(-25)) {
    const el = document.createElement("div");
    el.className = "segment";
    el.textContent = segment.text;
    client.appendChild(el);
  }

  client.scrollTop = client.scrollHeight;
}

async function load() {
  try {
    const state = await chrome.runtime.sendMessage({ type: "GET_STATE" });
    render(state);
  } catch {}
}

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === "STATE_UPDATED") {
    render(message.state);
  }
});

connect.addEventListener("click", async () => {
  await chrome.runtime.sendMessage({ type: "CONNECT" });
  await load();
});

clear.addEventListener("click", async () => {
  await chrome.runtime.sendMessage({ type: "CLEAR_CLIENTE" });
  await load();
});

yo.addEventListener("input", () => {
  chrome.runtime.sendMessage({
    type: "SET_YO",
    value: yo.value
  }).catch(() => {});
});

chrome.runtime.sendMessage({ type: "GET_YO" }).then((result) => {
  yo.value = result?.value ?? "";
}).catch(() => {});

load();
