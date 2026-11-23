// Tiny stack VM for make.fun's tiny-stack-vm-01 ISA v1, written from the kit's
// generator/subject/ISA.md. Runs every instance under /input/<id>/ (program.bin +
// input.bin) and writes /output/<id>/stdout.bin and /output/<id>/exit.txt.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const IN_DIR = process.env.MAKEFUN_INPUT_DIR ?? '/input';
const OUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const MAX_STEPS = 1000000;
const MAX_OUT = 65536;

function run(prog, input) {
  const st = [];
  const cs = [];
  const mem = new Int32Array(256);
  const out = [];
  let pc = 0, steps = 0, ip = 0;
  const fail = (code) => { throw code; };
  const need = (n) => { if (st.length < n) fail(2); };
  const push = (v) => { if (st.length >= 256) fail(3); st.push(v | 0); };
  try {
    for (;;) {
      if (steps >= MAX_STEPS) fail(10);
      if (pc < 0 || pc >= prog.length) fail(9);
      const op = prog[pc];
      // Immediate must fit before the program ends (trap 9); unknown opcode traps 5.
      const immLen = op === 0x01 ? 1 : op === 0x02 ? 4 : (op >= 0x30 && op <= 0x33) ? 2 : 0;
      const known = op <= 0x07 || (op >= 0x10 && op <= 0x22) || (op >= 0x30 && op <= 0x34) || (op >= 0x40 && op <= 0x41) || (op >= 0x50 && op <= 0x53);
      if (!known) fail(5);
      if (pc + 1 + immLen > prog.length) fail(9);
      steps++;
      let npc = pc + 1 + immLen;
      switch (op) {
        case 0x00: return [out, 0]; // HALT
        case 0x01: { const b = prog[pc + 1]; push(b < 128 ? b : b - 256); break; } // PUSH8
        case 0x02: push(prog.readInt32LE(pc + 1)); break; // PUSH32
        case 0x03: need(1); st.pop(); break; // POP
        case 0x04: need(1); push(st[st.length - 1]); break; // DUP
        case 0x05: need(2); { const t = st[st.length - 1]; st[st.length - 1] = st[st.length - 2]; st[st.length - 2] = t; break; } // SWAP
        case 0x06: need(2); push(st[st.length - 2]); break; // OVER
        case 0x07: need(3); { const c = st.pop(), b = st.pop(), a = st.pop(); st.push(b, c, a); break; } // ROT
        case 0x10: need(2); { const b = st.pop(), a = st.pop(); push(a + b); break; } // ADD
        case 0x11: need(2); { const b = st.pop(), a = st.pop(); push(a - b); break; } // SUB
        case 0x12: need(2); { const b = st.pop(), a = st.pop(); push(Math.imul(a, b)); break; } // MUL
        case 0x13: need(2); { const b = st.pop(), a = st.pop(); if (b === 0) fail(4); push(a === -2147483648 && b === -1 ? -2147483648 : Math.trunc(a / b)); break; } // DIV
        case 0x14: need(2); { const b = st.pop(), a = st.pop(); if (b === 0) fail(4); push(b === -1 ? 0 : a % b); break; } // MOD
        case 0x15: need(2); { const b = st.pop(), a = st.pop(); if (b === 0) fail(4); push(Math.floor((a >>> 0) / (b >>> 0))); break; } // DIVU
        case 0x16: need(2); { const b = st.pop(), a = st.pop(); if (b === 0) fail(4); push((a >>> 0) % (b >>> 0)); break; } // MODU
        case 0x17: need(1); push(-st.pop()); break; // NEG
        case 0x18: need(2); { const b = st.pop(), a = st.pop(); push(a & b); break; } // AND
        case 0x19: need(2); { const b = st.pop(), a = st.pop(); push(a | b); break; } // OR
        case 0x1a: need(2); { const b = st.pop(), a = st.pop(); push(a ^ b); break; } // XOR
        case 0x1b: need(1); push(~st.pop()); break; // NOT
        case 0x1c: need(2); { const b = st.pop(), a = st.pop(); push(a << (b & 31)); break; } // SHL
        case 0x1d: need(2); { const b = st.pop(), a = st.pop(); push(a >> (b & 31)); break; } // SHR
        case 0x1e: need(2); { const b = st.pop(), a = st.pop(); push(a >>> (b & 31)); break; } // SHRU
        case 0x20: need(2); { const b = st.pop(), a = st.pop(); push(a === b ? 1 : 0); break; } // EQ
        case 0x21: need(2); { const b = st.pop(), a = st.pop(); push(a < b ? 1 : 0); break; } // LT
        case 0x22: need(2); { const b = st.pop(), a = st.pop(); push((a >>> 0) < (b >>> 0) ? 1 : 0); break; } // LTU
        case 0x30: { let o = prog[pc + 1] | (prog[pc + 2] << 8); if (o >= 32768) o -= 65536; npc = pc + 3 + o; break; } // JMP
        case 0x31: { need(1); const v = st.pop(); let o = prog[pc + 1] | (prog[pc + 2] << 8); if (o >= 32768) o -= 65536; if (v === 0) npc = pc + 3 + o; break; } // JZ
        case 0x32: { need(1); const v = st.pop(); let o = prog[pc + 1] | (prog[pc + 2] << 8); if (o >= 32768) o -= 65536; if (v !== 0) npc = pc + 3 + o; break; } // JNZ
        case 0x33: { if (cs.length >= 64) fail(7); const t = prog[pc + 1] | (prog[pc + 2] << 8); cs.push(pc + 3); npc = t; break; } // CALL
        case 0x34: if (cs.length === 0) fail(8); npc = cs.pop(); break; // RET
        case 0x40: need(1); { const a = st.pop(); if (a < 0 || a > 255) fail(6); push(mem[a]); break; } // LOAD
        case 0x41: need(2); { const a = st.pop(), v = st.pop(); if (a < 0 || a > 255) fail(6); mem[a] = v | 0; break; } // STORE
        case 0x50: { need(1); const s = String(st.pop()); if (out.length + s.length > MAX_OUT) fail(11); for (let i = 0; i < s.length; i++) out.push(s.charCodeAt(i)); break; } // PRINT
        case 0x51: need(1); if (out.length + 1 > MAX_OUT) fail(11); out.push(st.pop() & 255); break; // PUTC
        case 0x52: push(ip < input.length ? input[ip++] : -1); break; // IN
        case 0x53: need(1); return [out, st.pop() & 255]; // EXIT
      }
      pc = npc;
    }
  } catch (code) {
    return [out, code];
  }
}

for (const ent of readdirSync(IN_DIR, { withFileTypes: true }).sort((a, b) => a.name < b.name ? -1 : 1)) {
  if (!ent.isDirectory()) continue;
  const id = ent.name;
  let out = [], code = 0;
  try {
    const prog = readFileSync(join(IN_DIR, id, 'program.bin'));
    const input = readFileSync(join(IN_DIR, id, 'input.bin'));
    [out, code] = run(prog, input);
  } catch { out = []; code = 0; }
  mkdirSync(join(OUT_DIR, id), { recursive: true });
  writeFileSync(join(OUT_DIR, id, 'stdout.bin'), Buffer.from(out));
  writeFileSync(join(OUT_DIR, id, 'exit.txt'), String(code) + '\n');
}
