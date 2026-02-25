let ctx: AudioContext | null = null;

function getCtx() {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

function playTone(freq: number, duration: number, type: OscillatorType = "sine", vol = 0.12, delay = 0) {
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, c.currentTime + delay);
    gain.gain.linearRampToValueAtTime(vol, c.currentTime + delay + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + duration);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(c.currentTime + delay);
    osc.stop(c.currentTime + delay + duration);
  } catch (e) { void e; }
}

export function sfxQuestClick() {
  playTone(523, 0.12, "triangle", 0.1);
  playTone(659, 0.15, "triangle", 0.08, 0.06);
}

export function sfxBranchSwitch() {
  playTone(392, 0.1, "sine", 0.08);
  playTone(523, 0.12, "sine", 0.06, 0.08);
}

export function sfxModalOpen() {
  playTone(330, 0.15, "sine", 0.07);
  playTone(440, 0.18, "sine", 0.09, 0.08);
  playTone(554, 0.22, "sine", 0.07, 0.16);
}

export function sfxModalClose() {
  playTone(440, 0.1, "triangle", 0.06);
  playTone(330, 0.15, "triangle", 0.04, 0.06);
}

export function sfxLogin() {
  playTone(262, 0.15, "sine", 0.08);
  playTone(330, 0.15, "sine", 0.08, 0.12);
  playTone(392, 0.18, "sine", 0.1, 0.24);
  playTone(523, 0.3, "sine", 0.1, 0.36);
}

export function sfxError() {
  playTone(200, 0.15, "square", 0.06);
  playTone(160, 0.2, "square", 0.05, 0.1);
}

export function sfxHover() {
  playTone(880, 0.05, "sine", 0.03);
}