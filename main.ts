import * as fs from "node:fs";
import * as path from "node:path";
const I = process.env.MAKEFUN_INPUT_DIR || "/input";
const O = process.env.MAKEFUN_OUTPUT_DIR || "/output";
function run(p, inp) {
  const s = new Int32Array(256);
  let sp = 0;
  const c = new Int32Array(64);
  let cp = 0;
  const m = new Int32Array(256);
  const o = new Uint8Array(65536);
  let ol = 0, pc = 0, st = 0, ip = 0;
  const n = p.length;
  const f = (e) => ({ o: o.subarray(0, ol), e });
  for (;;) {
    if (st >= 1000000) return f(10);
    if (pc < 0 || pc >= n) return f(9);
    const q = pc, op = p[q];
    let l = 0;
    if (op === 0x01) l = 1;
    else if (op === 0x02) l = 4;
    else if (op === 0x30 || op === 0x31 || op === 0x32 || op === 0x33) l = 2;
    else if (op === 0x00 || (op >= 0x03 && op <= 0x07) || (op >= 0x10 && op <= 0x22) || op === 0x34 || op === 0x40 || op === 0x41 || (op >= 0x50 && op <= 0x53)) l = 0;
    else return f(5);
    if (q + 1 + l > n) return f(9);
    st++;
    const nx = q + 1 + l;
    pc = nx;
    switch (op) {
      case 0x00: return f(0);
      case 0x01:
        if (sp >= 256) return f(3);
        s[sp++] = (p[q + 1] << 24) >> 24;
        break;
      case 0x02:
        if (sp >= 256) return f(3);
        s[sp++] = p[q + 1] | (p[q + 2] << 8) | (p[q + 3] << 16) | (p[q + 4] << 24);
        break;
      case 0x03:
        if (sp < 1) return f(2);
        sp--;
        break;
      case 0x04:
        if (sp < 1) return f(2);
        if (sp >= 256) return f(3);
        s[sp] = s[sp - 1];
        sp++;
        break;
      case 0x05:
        if (sp < 2) return f(2);
        { const t = s[sp - 1]; s[sp - 1] = s[sp - 2]; s[sp - 2] = t; }
        break;
      case 0x06:
        if (sp < 2) return f(2);
        if (sp >= 256) return f(3);
        s[sp] = s[sp - 2];
        sp++;
        break;
      case 0x07:
        if (sp < 3) return f(2);
        { const a = s[sp - 3], b = s[sp - 2], d = s[sp - 1]; s[sp - 3] = b; s[sp - 2] = d; s[sp - 1] = a; }
        break;
      case 0x10: {
        if (sp < 2) return f(2);
        const b = s[--sp];
        s[sp - 1] = (s[sp - 1] + b) | 0;
        break;
      }
      case 0x11: {
        if (sp < 2) return f(2);
        const b = s[--sp];
        s[sp - 1] = (s[sp - 1] - b) | 0;
        break;
      }
      case 0x12: {
        if (sp < 2) return f(2);
        const b = s[--sp];
        s[sp - 1] = Math.imul(s[sp - 1], b);
        break;
      }
      case 0x13: {
        if (sp < 2) return f(2);
        const b = s[--sp];
        if (b === 0) return f(4);
        s[sp - 1] = (s[sp - 1] / b) | 0;
        break;
      }
      case 0x14: {
        if (sp < 2) return f(2);
        const b = s[--sp];
        if (b === 0) return f(4);
        s[sp - 1] = s[sp - 1] % b;
        break;
      }
      case 0x15: {
        if (sp < 2) return f(2);
        const b = s[--sp];
        if (b === 0) return f(4);
        s[sp - 1] = Math.floor((s[sp - 1] >>> 0) / (b >>> 0)) | 0;
        break;
      }
      case 0x16: {
        if (sp < 2) return f(2);
        const b = s[--sp];
        if (b === 0) return f(4);
        s[sp - 1] = ((s[sp - 1] >>> 0) % (b >>> 0)) | 0;
        break;
      }
      case 0x17:
        if (sp < 1) return f(2);
        s[sp - 1] = (-s[sp - 1]) | 0;
        break;
      case 0x18: {
        if (sp < 2) return f(2);
        const b = s[--sp];
        s[sp - 1] = s[sp - 1] & b;
        break;
      }
      case 0x19: {
        if (sp < 2) return f(2);
        const b = s[--sp];
        s[sp - 1] = s[sp - 1] | b;
        break;
      }
      case 0x1a: {
        if (sp < 2) return f(2);
        const b = s[--sp];
        s[sp - 1] = s[sp - 1] ^ b;
        break;
      }
      case 0x1b:
        if (sp < 1) return f(2);
        s[sp - 1] = ~s[sp - 1];
        break;
      case 0x1c: {
        if (sp < 2) return f(2);
        const b = s[--sp];
        s[sp - 1] = s[sp - 1] << (b & 31);
        break;
      }
      case 0x1d: {
        if (sp < 2) return f(2);
        const b = s[--sp];
        s[sp - 1] = s[sp - 1] >> (b & 31);
        break;
      }
      case 0x1e: {
        if (sp < 2) return f(2);
        const b = s[--sp];
        s[sp - 1] = (s[sp - 1] >>> (b & 31)) | 0;
        break;
      }
      case 0x20: {
        if (sp < 2) return f(2);
        const b = s[--sp];
        s[sp - 1] = s[sp - 1] === b ? 1 : 0;
        break;
      }
      case 0x21: {
        if (sp < 2) return f(2);
        const b = s[--sp];
        s[sp - 1] = s[sp - 1] < b ? 1 : 0;
        break;
      }
      case 0x22: {
        if (sp < 2) return f(2);
        const b = s[--sp];
        s[sp - 1] = (s[sp - 1] >>> 0) < (b >>> 0) ? 1 : 0;
        break;
      }
      case 0x30: {
        const off = (p[q + 1] | (p[q + 2] << 8)) << 16 >> 16;
        pc = nx + off;
        break;
      }
      case 0x31: {
        if (sp < 1) return f(2);
        const v = s[--sp];
        if (v === 0) pc = nx + ((p[q + 1] | (p[q + 2] << 8)) << 16 >> 16);
        break;
      }
      case 0x32: {
        if (sp < 1) return f(2);
        const v = s[--sp];
        if (v !== 0) pc = nx + ((p[q + 1] | (p[q + 2] << 8)) << 16 >> 16);
        break;
      }
      case 0x33:
        if (cp >= 64) return f(7);
        c[cp++] = nx;
        pc = p[q + 1] | (p[q + 2] << 8);
        break;
      case 0x34:
        if (cp < 1) return f(8);
        pc = c[--cp];
        break;
      case 0x40:
        if (sp < 1) return f(2);
        {
          const a = s[sp - 1];
          if (a < 0 || a > 255) return f(6);
          s[sp - 1] = m[a];
        }
        break;
      case 0x41: {
        if (sp < 2) return f(2);
        const a = s[--sp];
        const v = s[--sp];
        if (a < 0 || a > 255) return f(6);
        m[a] = v;
        break;
      }
      case 0x50: {
        if (sp < 1) return f(2);
        const v = s[--sp];
        const t = String(v);
        if (ol + t.length > 65536) return f(11);
        for (let i = 0; i < t.length; i++) o[ol++] = t.charCodeAt(i);
        break;
      }
      case 0x51: {
        if (sp < 1) return f(2);
        const v = s[--sp];
        if (ol + 1 > 65536) return f(11);
        o[ol++] = v & 255;
        break;
      }
      case 0x52:
        if (sp >= 256) return f(3);
        s[sp++] = ip < inp.length ? inp[ip++] : -1;
        break;
      case 0x53: {
        if (sp < 1) return f(2);
        const v = s[--sp];
        return f(v & 255);
      }
      default:
        return f(5);
    }
  }
}
for (const id of fs.readdirSync(I, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort()) {
  const d = path.join(I, id);
  const p = fs.readFileSync(path.join(d, "program.bin"));
  let inp;
  try {
    inp = fs.readFileSync(path.join(d, "input.bin"));
  } catch {
    inp = Buffer.alloc(0);
  }
  const r = run(p, inp);
  const od = path.join(O, id);
  fs.mkdirSync(od, { recursive: true });
  fs.writeFileSync(path.join(od, "stdout.bin"), Buffer.from(r.o));
  fs.writeFileSync(path.join(od, "exit.txt"), String(r.e));
}
