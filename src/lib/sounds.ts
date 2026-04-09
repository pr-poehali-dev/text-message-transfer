const ctx = () => new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

function play(setup: (ac: AudioContext) => void) {
  try { const ac = ctx(); setup(ac); } catch { /* ignore */ }
}

export const sounds = {
  click() {
    play((ac) => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.connect(g); g.connect(ac.destination);
      o.type = "sine";
      o.frequency.setValueAtTime(880, ac.currentTime);
      o.frequency.exponentialRampToValueAtTime(660, ac.currentTime + 0.07);
      g.gain.setValueAtTime(0.08, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.07);
      o.start(); o.stop(ac.currentTime + 0.07);
    });
  },

  nav() {
    play((ac) => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.connect(g); g.connect(ac.destination);
      o.type = "sine";
      o.frequency.setValueAtTime(440, ac.currentTime);
      o.frequency.exponentialRampToValueAtTime(520, ac.currentTime + 0.08);
      g.gain.setValueAtTime(0.06, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.1);
      o.start(); o.stop(ac.currentTime + 0.1);
    });
  },

  send() {
    play((ac) => {
      const o1 = ac.createOscillator();
      const o2 = ac.createOscillator();
      const g = ac.createGain();
      o1.connect(g); o2.connect(g); g.connect(ac.destination);
      o1.type = "sine"; o2.type = "sine";
      o1.frequency.setValueAtTime(660, ac.currentTime);
      o2.frequency.setValueAtTime(880, ac.currentTime + 0.06);
      g.gain.setValueAtTime(0.07, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.18);
      o1.start(); o1.stop(ac.currentTime + 0.1);
      o2.start(ac.currentTime + 0.06); o2.stop(ac.currentTime + 0.18);
    });
  },

  success() {
    play((ac) => {
      [523, 659, 784].forEach((freq, i) => {
        const o = ac.createOscillator();
        const g = ac.createGain();
        o.connect(g); g.connect(ac.destination);
        o.type = "sine";
        o.frequency.value = freq;
        const t = ac.currentTime + i * 0.1;
        g.gain.setValueAtTime(0.07, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        o.start(t); o.stop(t + 0.15);
      });
    });
  },

  error() {
    play((ac) => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.connect(g); g.connect(ac.destination);
      o.type = "sawtooth";
      o.frequency.setValueAtTime(220, ac.currentTime);
      o.frequency.exponentialRampToValueAtTime(180, ac.currentTime + 0.15);
      g.gain.setValueAtTime(0.06, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.15);
      o.start(); o.stop(ac.currentTime + 0.15);
    });
  },
};
