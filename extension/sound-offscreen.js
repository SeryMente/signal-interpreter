(function () {
  "use strict";

  async function tone(context, frequency, start, duration, peak) {
    var oscillator = context.createOscillator();
    var gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak), start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration - 0.02);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + duration);
  }

  async function playTone(volume, cue) {
    var context = new AudioContext();
    if (context.state === "suspended") await context.resume();

    var start = context.currentTime;
    var peak = Math.max(0.0001, volume * 0.32);

    if (cue === "mute-on") {
      await tone(context, 880, start, 0.11, peak);
      await tone(context, 622.25, start + 0.12, 0.13, peak);
    } else if (cue === "mute-off") {
      await tone(context, 622.25, start, 0.11, peak);
      await tone(context, 880, start + 0.12, 0.13, peak);
    } else {
      await tone(context, 880, start, 0.11, peak);
      await tone(context, 1174.66, start + 0.12, 0.13, peak);
    }

    await new Promise(function (resolve) { setTimeout(resolve, 300); });
    await context.close();
    return true;
  }

  chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (!message || message.target !== "offscreen" || message.type !== "EFFECTIF_PLAY_SOUND") return false;
    playTone(
      Math.max(0, Math.min(1, Number(message.volume) || 0)),
      String(message.cue || "")
    ).then(function () {
      sendResponse({ ok: true, cue: message.cue || "default" });
    }).catch(function (error) {
      sendResponse({ ok: false, error: String(error) });
    });
    return true;
  });
})();
