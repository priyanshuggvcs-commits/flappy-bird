(() => {
  'use strict';

  // ---------- Config ----------
  const W = 400, H = 600, GROUND_H = 80;
  const GRAVITY = 1500, FLAP_VEL = -430, PIPE_SPEED = 140;
  const GAP = 150, PIPE_W = 64, PIPE_SPACING = 210, BIRD_R = 14, BIRD_X = 110;
  const STORAGE_KEY = 'flappy-best';

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  canvas.width = W;
  canvas.height = H;

  // ---------- State ----------
  let state = 'ready';            // ready | playing | paused | over
  let bird, pipes, clouds, score, best = 0, groundX = 0, muted = false, lastTime = 0, flash = 0;
  try { best = Number(localStorage.getItem(STORAGE_KEY)) || 0; } catch (e) { /* storage blocked */ }

  function reset() {
    bird = { y: H / 2 - 40, vy: 0, angle: 0, t: 0 };
    pipes = [];
    score = 0;
    clouds = Array.from({ length: 5 }, (_, i) => ({
      x: i * 90 + Math.random() * 40, y: 40 + Math.random() * 220, s: 0.6 + Math.random() * 0.8,
    }));
    spawnPipe(W + 120);
  }

  function spawnPipe(x) {
    const min = 80, max = H - GROUND_H - GAP - 80;
    pipes.push({ x, top: min + Math.random() * (max - min), scored: false });
  }

  // ---------- Sound (WebAudio beeps, no asset files) ----------
  let audio;
  function beep(freq, dur, type = 'square', vol = 0.06) {
    if (muted) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const o = audio.createOscillator(), g = audio.createGain();
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(vol, audio.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + dur);
      o.connect(g); g.connect(audio.destination);
      o.start(); o.stop(audio.currentTime + dur);
    } catch (e) { /* audio unavailable */ }
  }

  // ---------- Input ----------
  function flap() {
    if (state === 'ready') state = 'playing';
    if (state === 'playing') { bird.vy = FLAP_VEL; beep(520, 0.09); }
    else if (state === 'over' && flash <= 0) { reset(); state = 'ready'; }
  }
  window.addEventListener('keydown', e => {
    if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); if (!e.repeat) flap(); }
    else if (e.code === 'KeyP') { if (state === 'playing') state = 'paused'; else if (state === 'paused') state = 'playing'; }
    else if (e.code === 'KeyM') muted = !muted;
  });
  canvas.addEventListener('pointerdown', e => { e.preventDefault(); flap(); });

  // ---------- Update ----------
  function update(dt) {
    groundX = (groundX - PIPE_SPEED * dt) % 24;
    clouds.forEach(c => { c.x -= 12 * c.s * dt; if (c.x < -60) { c.x = W + 40; c.y = 40 + Math.random() * 220; } });
    if (flash > 0) flash -= dt;

    if (state === 'ready') { bird.t += dt; bird.y = H / 2 - 40 + Math.sin(bird.t * 4) * 8; return; }
    if (state !== 'playing') return;

    bird.vy += GRAVITY * dt;
    bird.y += bird.vy * dt;
    bird.angle = Math.max(-0.45, Math.min(1.2, bird.vy / 520));

    pipes.forEach(p => p.x -= PIPE_SPEED * dt);
    if (pipes[0].x + PIPE_W < 0) pipes.shift();
    if (pipes[pipes.length - 1].x < W - PIPE_SPACING) spawnPipe(W + 20);

    for (const p of pipes) {
      if (!p.scored && p.x + PIPE_W < BIRD_X - BIRD_R) {
        p.scored = true; score++; beep(880, 0.08, 'triangle', 0.08);
      }
      const hitX = BIRD_X + BIRD_R > p.x && BIRD_X - BIRD_R < p.x + PIPE_W;
      const hitY = bird.y - BIRD_R < p.top || bird.y + BIRD_R > p.top + GAP;
      if (hitX && hitY) return gameOver();
    }
    if (bird.y + BIRD_R > H - GROUND_H || bird.y - BIRD_R < -40) gameOver();
  }

  function gameOver() {
    state = 'over'; flash = 0.35; beep(160, 0.35, 'sawtooth', 0.09);
    if (score > best) {
      best = score;
      try { localStorage.setItem(STORAGE_KEY, String(best)); } catch (e) { /* ignore */ }
    }
  }

  // ---------- Drawing ----------
  function drawCloud(c) {
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    ctx.beginPath();
    ctx.arc(c.x, c.y, 18 * c.s, 0, 7); ctx.arc(c.x + 20 * c.s, c.y + 4, 22 * c.s, 0, 7); ctx.arc(c.x + 42 * c.s, c.y, 16 * c.s, 0, 7);
    ctx.fill();
  }

  function drawPipe(p) {
    const bottomY = p.top + GAP;
    ctx.fillStyle = '#5cb85c'; ctx.strokeStyle = '#2f6b2f'; ctx.lineWidth = 3;
    ctx.fillRect(p.x, 0, PIPE_W, p.top); ctx.strokeRect(p.x, -2, PIPE_W, p.top + 2);
    ctx.fillRect(p.x, bottomY, PIPE_W, H - GROUND_H - bottomY); ctx.strokeRect(p.x, bottomY, PIPE_W, H - GROUND_H - bottomY);
    ctx.fillRect(p.x - 5, p.top - 24, PIPE_W + 10, 24); ctx.strokeRect(p.x - 5, p.top - 24, PIPE_W + 10, 24);
    ctx.fillRect(p.x - 5, bottomY, PIPE_W + 10, 24); ctx.strokeRect(p.x - 5, bottomY, PIPE_W + 10, 24);
    ctx.fillStyle = 'rgba(255,255,255,.25)';
    ctx.fillRect(p.x + 8, 0, 8, p.top - 24); ctx.fillRect(p.x + 8, bottomY + 24, 8, H - GROUND_H - bottomY - 24);
  }

  function drawBird() {
    ctx.save();
    ctx.translate(BIRD_X, bird.y); ctx.rotate(bird.angle);
    ctx.fillStyle = '#f7d046'; ctx.strokeStyle = '#7a5a00'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, BIRD_R + 2, 0, 7); ctx.fill(); ctx.stroke();
    const flapUp = state === 'playing' ? bird.vy < 0 : Math.sin(bird.t * 12) > 0;
    ctx.fillStyle = '#e8a317';
    ctx.beginPath(); ctx.ellipse(-5, flapUp ? -3 : 3, 9, 5, flapUp ? -0.5 : 0.5, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(7, -5, 5, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(9, -5, 2, 0, 7); ctx.fill();
    ctx.fillStyle = '#ef5b2a'; ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(23, 3); ctx.lineTo(12, 8); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  function drawGround() {
    ctx.fillStyle = '#ded895'; ctx.fillRect(0, H - GROUND_H, W, GROUND_H);
    ctx.fillStyle = '#73bf2e'; ctx.fillRect(0, H - GROUND_H, W, 14);
    ctx.fillStyle = '#5a9a22';
    for (let x = groundX - 24; x < W + 24; x += 24) {
      ctx.beginPath(); ctx.moveTo(x, H - GROUND_H); ctx.lineTo(x + 12, H - GROUND_H + 14); ctx.lineTo(x + 24, H - GROUND_H); ctx.fill();
    }
  }

  function text(str, x, y, size, color = '#fff') {
    ctx.font = `bold ${size}px system-ui, sans-serif`; ctx.textAlign = 'center';
    ctx.lineWidth = size / 6; ctx.strokeStyle = '#000'; ctx.strokeText(str, x, y);
    ctx.fillStyle = color; ctx.fillText(str, x, y);
  }

  function draw() {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#4ec0ca'); sky.addColorStop(1, '#a8e6ef');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    clouds.forEach(drawCloud);
    pipes.forEach(drawPipe);
    drawGround();
    drawBird();

    if (state === 'ready') {
      text('Flappy Bird', W / 2, 150, 44, '#f7d046');
      text('Tap or press Space to start', W / 2, 200, 18);
    } else {
      text(String(score), W / 2, 80, 52);
    }
    if (state === 'paused') text('Paused', W / 2, H / 2, 44);
    if (state === 'over') {
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(40, 190, W - 80, 190);
      text('Game Over', W / 2, 245, 40, '#ef5b2a');
      text('Score: ' + score, W / 2, 298, 26);
      text('Best: ' + best, W / 2, 335, 26, '#f7d046');
      text('Tap or press Space to retry', W / 2, 368, 15);
    }
    if (flash > 0) { ctx.fillStyle = `rgba(255,255,255,${flash * 2})`; ctx.fillRect(0, 0, W, H); }
    if (muted) text('Muted', 40, H - 20, 14);
  }

  // ---------- Main loop ----------
  function frame(now) {
    const dt = Math.min((now - lastTime) / 1000 || 0, 0.033);
    lastTime = now;
    update(dt);
    draw();
    requestAnimationFrame(frame);
  }

  reset();
  requestAnimationFrame(frame);
})();
