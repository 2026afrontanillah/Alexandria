// =========================================================================
// AVATAR PARLANTE DEL CHAT (gratis, programado por nosotros)
// Deforma el retrato en tiempo real con WebGL usando puntos faciales
// precalculados (js/avatar-landmarks.js): abre la boca al hablar, parpadea,
// mueve un poco la cabeza y respira. Solo se mueve la persona (silueta), no el fondo.
// Si la página se abre como archivo (file://) o no hay WebGL, queda la foto fija.
// =========================================================================
(function () {
  const GRID_X = 96;
  const GRID_Y = 128;
  const EXTRA_ZOOM = 1.04; // evita que se vean los bordes al deformar
  const POS_Y = 0.14;      // igual que object-position: center 14%

  const VS = `
    attribute vec2 aPos;
    attribute vec2 aUv;
    varying vec2 vUv;
    void main() { gl_Position = vec4(aPos, 0.0, 1.0); vUv = aUv; }
  `;
  const FS = `
    precision mediump float;
    varying vec2 vUv;
    uniform sampler2D uTex;
    void main() { gl_FragColor = texture2D(uTex, vUv); }
  `;

  const clamp01 = (x) => Math.min(1, Math.max(0, x));
  function smoothstep(e0, e1, x) {
    const t = clamp01((x - e0) / (e1 - e0));
    return t * t * (3 - 2 * t);
  }
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

  function loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }

  function compileShader(gl, type, src) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
    return sh;
  }

  class TalkingAvatar {
    constructor(container, imageUrl, landmarks) {
      this.container = container;
      this.imageUrl = imageUrl;
      this.lm = landmarks;
      this.destroyed = false;
      this.speaking = false;
      this.volumeFn = null;
      this.open = 0;
      this.openTarget = 0;
      this.syllablePhase = 0;
      this.syllableAmp = 0.8;
      this.pauseUntil = 0;
      this.nextPauseAt = 0;
      this.blink = 0;
      this.nextBlinkAt = performance.now() / 1000 + 1.5 + Math.random() * 2;
      this.blinkStart = -1;
      this.lastT = 0;
      this.raf = null;
    }

    async init() {
      if (!this.lm) throw new Error('Sin puntos faciales');
      const img = await loadImage(this.imageUrl);
      if (this.destroyed) return false;
      this.iw = img.naturalWidth;
      this.ih = img.naturalHeight;
      this.prepareFeatures();

      // Capa WebGL (retrato deformado) + capa 2D (interior de la boca)
      this.canvas = document.createElement('canvas');
      this.overlay = document.createElement('canvas');
      for (const c of [this.canvas, this.overlay]) {
        c.className = 'avatar-layer';
        c.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:5;';
        this.container.appendChild(c);
      }

      const gl = this.canvas.getContext('webgl', { premultipliedAlpha: false, antialias: true });
      if (!gl) throw new Error('WebGL no disponible');
      this.gl = gl;
      this.ctx2d = this.overlay.getContext('2d');

      const prog = gl.createProgram();
      gl.attachShader(prog, compileShader(gl, gl.VERTEX_SHADER, VS));
      gl.attachShader(prog, compileShader(gl, gl.FRAGMENT_SHADER, FS));
      gl.linkProgram(prog);
      gl.useProgram(prog);

      // Textura (falla si la página se abre como archivo local: file://)
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      // Malla
      const nx = GRID_X + 1, ny = GRID_Y + 1;
      this.count = nx * ny;
      this.base = new Float32Array(this.count * 2);
      this.pos = new Float32Array(this.count * 2);
      const uvs = new Float32Array(this.count * 2);
      for (let j = 0; j < ny; j++) {
        for (let i = 0; i < nx; i++) {
          const k = (j * nx + i) * 2;
          uvs[k] = i / GRID_X;
          uvs[k + 1] = j / GRID_Y;
          this.base[k] = uvs[k] * this.iw;
          this.base[k + 1] = uvs[k + 1] * this.ih;
        }
      }
      const idx = new Uint16Array(GRID_X * GRID_Y * 6);
      let p = 0;
      for (let j = 0; j < GRID_Y; j++) {
        for (let i = 0; i < GRID_X; i++) {
          const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1;
          idx[p++] = a; idx[p++] = b; idx[p++] = c;
          idx[p++] = b; idx[p++] = d; idx[p++] = c;
        }
      }
      this.indexCount = idx.length;

      const uvBuf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
      gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);
      const aUv = gl.getAttribLocation(prog, 'aUv');
      gl.enableVertexAttribArray(aUv);
      gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 0, 0);

      this.posBuf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuf);
      gl.bufferData(gl.ARRAY_BUFFER, this.pos, gl.DYNAMIC_DRAW);
      const aPos = gl.getAttribLocation(prog, 'aPos');
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

      const ib = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);

      this.resize();
      this.resizeObs = new ResizeObserver(() => this.resize());
      this.resizeObs.observe(this.container);

      // Primer cuadro: si la textura no es legible, lanza error aquí
      this.frame(performance.now());
      if (gl.getError() !== gl.NO_ERROR) throw new Error('Textura no disponible');
      return true;
    }

    // ---------------------------------------------------------------------
    // Geometría facial en píxeles de la imagen
    // ---------------------------------------------------------------------
    prepareFeatures() {
      const W = this.iw, H = this.ih;
      const px = (pt) => [pt[0] * W, pt[1] * H];
      const L = this.lm;

      this.mouthL = px(L.mouthL);
      this.mouthR = px(L.mouthR);
      this.mouthC = [(this.mouthL[0] + this.mouthR[0]) / 2, (this.mouthL[1] + this.mouthR[1]) / 2];
      this.mouthW = dist(this.mouthL, this.mouthR);
      this.mouthHalf = this.mouthW / 2;
      this.upperInner = L.upperInner.map(px).sort((a, b) => a[0] - b[0]);
      this.lowerInner = L.lowerInner.map(px).sort((a, b) => a[0] - b[0]);
      this.chin = px(L.chin);
      this.jawHalf = Math.abs(px(L.jawR)[0] - px(L.jawL)[0]) / 2;
      this.forehead = px(L.forehead);
      this.faceH = this.chin[1] - this.forehead[1];
      this.faceC = [(this.forehead[0] + this.chin[0]) / 2, (this.forehead[1] + this.chin[1]) / 2];
      this.pivot = [this.mouthC[0], this.chin[1] + 0.35 * this.faceH];
      this.shoulderY = this.chin[1] + 0.6 * this.faceH;
      this.maxOpen = 0.3 * this.mouthW;
      this.lipBand = 0.07 * this.mouthW;

      // Silueta de la persona (para no mover el fondo)
      this.mask = null;
      if (L.mask && L.mask.data) {
        const { cols, rows, data } = L.mask;
        const vals = new Float32Array(cols * rows);
        for (let i = 0; i < vals.length; i++) vals[i] = (data.charCodeAt(i) - 48) / 9;
        this.mask = { cols, rows, vals };
      }

      this.eyes = L.eyes.map((e) => {
        const outer = px(e.outer), inner = px(e.inner), upper = px(e.upper), lower = px(e.lower);
        const w = dist(outer, inner);
        const openH = Math.max(lower[1] - upper[1], 0.18 * w);
        return {
          cx: (outer[0] + inner[0]) / 2,
          w,
          upperY: upper[1],
          lowerY: lower[1],
          openH,
          lineY: lower[1] - 0.2 * openH
        };
      });
    }

    // 1 = persona, 0 = fondo (interpolado de la silueta)
    maskAt(x, y) {
      const m = this.mask;
      if (!m) return 1;
      const fx = clamp01(x / this.iw) * (m.cols - 1);
      const fy = clamp01(y / this.ih) * (m.rows - 1);
      const x0 = Math.floor(fx), y0 = Math.floor(fy);
      const x1 = Math.min(m.cols - 1, x0 + 1), y1 = Math.min(m.rows - 1, y0 + 1);
      const tx = fx - x0, ty = fy - y0;
      const v = m.vals;
      const a = v[y0 * m.cols + x0] * (1 - tx) + v[y0 * m.cols + x1] * tx;
      const b = v[y1 * m.cols + x0] * (1 - tx) + v[y1 * m.cols + x1] * tx;
      return a * (1 - ty) + b * ty;
    }

    // Altura del labio superior interior en una x (interpolación lineal)
    upperLipY(x) {
      const pts = this.upperInner;
      if (x <= pts[0][0]) return pts[0][1];
      for (let i = 1; i < pts.length; i++) {
        if (x <= pts[i][0]) {
          const a = pts[i - 1], b = pts[i];
          const t = (x - a[0]) / (b[0] - a[0] || 1);
          return a[1] + (b[1] - a[1]) * t;
        }
      }
      return pts[pts.length - 1][1];
    }

    // Desplazamiento de un punto de la imagen según el estado actual
    displace(x, y, s, out) {
      let dx = 0, dy = 0;
      const mc = this.mouthC;
      const ox = x, oy = y;
      let mkCache = -1;
      const mk = () => (mkCache < 0 ? (mkCache = this.maskAt(ox, oy)) : mkCache);

      // --- Mandíbula / boca ---
      if (s.open > 0.001) {
        const hx = Math.abs(x - mc[0]);
        const wH = 1 - smoothstep(this.jawHalf * 0.7, this.jawHalf * 1.25, hx);
        if (wH > 0) {
          const D = s.open * this.maxOpen;
          const lipY = this.upperLipY(x);
          if (y < lipY) {
            // El labio superior sube un poco
            const near = 1 - smoothstep(0, this.mouthW * 0.35, lipY - y);
            const lens = 1 - smoothstep(this.mouthHalf * 0.6, this.mouthHalf * 1.1, hx);
            dy -= D * 0.12 * near * lens * wH;
          } else {
            const r = smoothstep(lipY, lipY + this.lipBand, y);
            // Junto a los labios la apertura tiene forma de lente; más abajo la mandíbula baja entera
            const lens = hx < this.mouthHalf * 1.05 ? Math.sqrt(1 - Math.pow(hx / (this.mouthHalf * 1.05), 2)) : 0;
            const deep = smoothstep(lipY, lipY + this.mouthW * 0.55, y);
            const profile = lens + (1 - lens) * deep;
            const below = 1 - smoothstep(this.chin[1], this.chin[1] + (this.chin[1] - lipY) * 1.8, y);
            dy += D * r * profile * below * wH;
            // Las comisuras se juntan un poco al abrir
            dx -= (x - mc[0]) * 0.06 * s.open * r * lens * wH;
          }
        }
      }

      // --- Parpadeo ---
      if (s.blink > 0.001) {
        for (const e of this.eyes) {
          const hx = Math.abs(x - e.cx);
          const wx = 1 - smoothstep(e.w * 0.55, e.w * 0.85, hx);
          if (wx <= 0) continue;
          const lidTravel = e.lineY - e.upperY;
          if (y <= e.upperY) {
            const fade = 1 - smoothstep(0, e.openH * 1.3, e.upperY - y);
            dy += lidTravel * s.blink * fade * wx;
          } else if (y < e.lineY) {
            dy += (e.lineY - y) * s.blink * wx;
          } else {
            const fade = 1 - smoothstep(0, e.openH * 0.8, y - e.lineY);
            dy -= (y - e.lineY) * 0.25 * s.blink * fade * wx;
          }
        }
      }

      x += dx; y += dy;

      // --- Cabeza: giro e inclinación suaves (solo la persona) ---
      const dC = Math.hypot(x - this.faceC[0], y - this.faceC[1]);
      let wHead = 1 - smoothstep(this.faceH * 0.75, this.faceH * 1.5, dC);
      if (wHead > 0) wHead *= mk();
      if (wHead > 0) {
        const a = s.angle * wHead;
        const cos = Math.cos(a), sin = Math.sin(a);
        const rx = x - this.pivot[0], ry = y - this.pivot[1];
        x = this.pivot[0] + rx * cos - ry * sin + s.tx * wHead;
        y = this.pivot[1] + rx * sin + ry * cos + s.ty * wHead;
      }

      // --- Respiración: suben hombros, pecho y cabeza; el fondo queda quieto ---
      if (s.breath) {
        const body = mk();
        if (body > 0.01) {
          // El cuerpo continúa fuera del cuadro: la parte baja se mueve un poco menos
          const wy = y < this.shoulderY ? 1 : 1 - 0.5 * smoothstep(this.shoulderY, this.ih, y);
          const w = body * wy;
          y -= s.breath * this.faceH * 3 * w;
          x += (x - this.faceC[0]) * s.breath * 0.6 * w * smoothstep(this.chin[1], this.shoulderY + this.faceH, y);
        }
      }

      out[0] = x; out[1] = y;
    }

    // ---------------------------------------------------------------------
    // Control desde la app
    // ---------------------------------------------------------------------
    setSpeaking(on, volumeFn = null) {
      this.speaking = on;
      this.volumeFn = on ? volumeFn : null;
      if (!on) this.openTarget = 0;
    }

    // Llamar en cada palabra (voz del navegador) para variar la boca
    pulse() {
      this.syllableAmp = 0.6 + Math.random() * 0.4;
      this.syllablePhase = 0;
    }

    resize() {
      if (!this.canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = this.container.getBoundingClientRect();
      const W = Math.max(1, Math.round(r.width * dpr));
      const H = Math.max(1, Math.round(r.height * dpr));
      for (const c of [this.canvas, this.overlay]) { c.width = W; c.height = H; }
      this.gl.viewport(0, 0, W, H);
      // Igual que object-fit: cover + object-position: center 14%
      const scale = Math.max(W / this.iw, H / this.ih) * EXTRA_ZOOM;
      this.map = {
        W, H, scale,
        offX: (W - this.iw * scale) * 0.5,
        offY: (H - this.ih * scale) * POS_Y
      };
    }

    start() {
      const loop = (now) => {
        if (this.destroyed) return;
        if (!document.hidden) this.frame(now);
        this.raf = requestAnimationFrame(loop);
      };
      this.raf = requestAnimationFrame(loop);
    }

    updateState(t, dt) {
      // Objetivo de apertura de boca
      if (this.speaking) {
        if (this.volumeFn) {
          let v = 0;
          try { v = Number(this.volumeFn()) || 0; } catch (e) {}
          this.openTarget = Math.pow(clamp01((v - 0.015) * 5), 0.7);
        } else {
          // Voz del navegador: sílabas simuladas (~5 por segundo) con pausas cortas
          if (t > this.nextPauseAt) {
            this.pauseUntil = t + 0.12 + Math.random() * 0.15;
            this.nextPauseAt = t + 1.2 + Math.random() * 1.6;
          }
          this.syllablePhase += dt * Math.PI * 2 * (4.6 + Math.random() * 1.2);
          if (this.syllablePhase > Math.PI) {
            this.syllablePhase -= Math.PI;
            this.syllableAmp = 0.45 + Math.random() * 0.55;
          }
          const v = Math.sin(this.syllablePhase) * this.syllableAmp;
          this.openTarget = t < this.pauseUntil ? 0 : 0.15 + 0.85 * v;
        }
      } else {
        this.openTarget = 0;
      }
      const k = this.openTarget > this.open ? 22 : 14;
      this.open += (this.openTarget - this.open) * Math.min(1, dt * k);

      // Parpadeo
      if (this.blinkStart < 0 && t >= this.nextBlinkAt) this.blinkStart = t;
      if (this.blinkStart >= 0) {
        const u = (t - this.blinkStart) / 0.18;
        if (u >= 1) {
          this.blink = 0;
          this.blinkStart = -1;
          this.nextBlinkAt = t + 2.2 + Math.random() * 3.8;
          if (Math.random() < 0.15) this.nextBlinkAt = t + 0.25; // doble parpadeo ocasional
        } else {
          this.blink = u < 0.45 ? u / 0.45 : 1 - (u - 0.45) / 0.55;
        }
      }

      const talk = this.open;
      return {
        open: this.open,
        blink: this.blink,
        angle: 0.012 * Math.sin(t * 0.55) + 0.005 * Math.sin(t * 1.7 + 1) + 0.008 * talk * Math.sin(t * 3.1),
        tx: this.faceH * (0.006 * Math.sin(t * 0.37)),
        ty: this.faceH * (0.004 * Math.sin(t * 0.8 + 2) - 0.01 * talk),
        breath: 0.004 * Math.sin(t * 1.35)
      };
    }

    toScreen(x, y) {
      const m = this.map;
      return [m.offX + x * m.scale, m.offY + y * m.scale];
    }

    frame(now) {
      const t = now / 1000;
      const dt = this.lastT ? Math.min(0.05, t - this.lastT) : 0.016;
      this.lastT = t;
      const s = this.updateState(t, dt);
      const m = this.map;
      const out = [0, 0];

      for (let k = 0; k < this.count * 2; k += 2) {
        this.displace(this.base[k], this.base[k + 1], s, out);
        this.pos[k] = ((m.offX + out[0] * m.scale) / m.W) * 2 - 1;
        this.pos[k + 1] = 1 - ((m.offY + out[1] * m.scale) / m.H) * 2;
      }

      const gl = this.gl;
      gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuf);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.pos);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);

      this.drawMouthInterior(s);
    }

    // Interior oscuro de la boca entre los labios desplazados
    drawMouthInterior(s) {
      const ctx = this.ctx2d;
      ctx.clearRect(0, 0, this.overlay.width, this.overlay.height);
      if (s.open < 0.03) return;

      const out = [0, 0];
      const top = this.upperInner.map(([x, y]) => {
        this.displace(x, y - 0.5, s, out);
        return this.toScreen(out[0], out[1]);
      });
      // Borde inferior: mismo contorno, empujado por la mandíbula
      const bottom = this.lowerInner.map(([x, y]) => {
        this.displace(x, Math.max(y, this.upperLipY(x)) + this.lipBand, s, out);
        return this.toScreen(out[0], out[1]);
      }).reverse();

      ctx.save();
      ctx.globalAlpha = smoothstep(0.03, 0.2, s.open) * 0.92;
      ctx.filter = 'blur(' + Math.max(0.6, this.map.scale * 1.2).toFixed(1) + 'px)';
      ctx.beginPath();
      ctx.moveTo(top[0][0], top[0][1]);
      for (const p of top) ctx.lineTo(p[0], p[1]);
      for (const p of bottom) ctx.lineTo(p[0], p[1]);
      ctx.closePath();
      const yTop = Math.min(...top.map((p) => p[1]));
      const yBot = Math.max(...bottom.map((p) => p[1]));
      const g = ctx.createLinearGradient(0, yTop, 0, yBot);
      g.addColorStop(0, 'rgb(48, 22, 16)');
      g.addColorStop(0.5, 'rgb(22, 8, 6)');
      g.addColorStop(1, 'rgb(40, 16, 12)');
      ctx.fillStyle = g;
      ctx.fill();
      ctx.restore();
    }

    destroy() {
      this.destroyed = true;
      if (this.raf) cancelAnimationFrame(this.raf);
      if (this.resizeObs) this.resizeObs.disconnect();
      if (this.gl) {
        const ext = this.gl.getExtension('WEBGL_lose_context');
        if (ext) ext.loseContext();
      }
      this.canvas?.remove();
      this.overlay?.remove();
    }
  }

  // Crea el avatar dentro de un contenedor; si algo falla, queda la foto fija
  window.createTalkingAvatar = async function (container, imageUrl, philId) {
    const landmarks = (window.AVATAR_LANDMARKS || {})[philId];
    const avatar = new TalkingAvatar(container, imageUrl, landmarks);
    try {
      const ok = await avatar.init();
      if (!ok) return null;
      container.querySelectorAll('img').forEach((img) => img.classList.add('invisible'));
      avatar.start();
      return avatar;
    } catch (err) {
      console.warn('Avatar animado no disponible, se muestra la foto fija:', err.message || err);
      avatar.destroy();
      return null;
    }
  };
})();
