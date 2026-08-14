import { describe, expect, test } from "bun:test";
import {
  chmodSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const KINGDOM = join(ROOT, "kingdom");
const GUARD = join(ROOT, "bin/guard.py");
const CONTRACT = join(ROOT, "skills/guard-information-flow/references/information-control-contract.md");
const EXAMPLE = join(ROOT, "skills/guard-information-flow/references/information-control-envelope.example.json");
const VALIDATOR = join(ROOT, "skills/guard-information-flow/scripts/validate_envelope.py");
const configuredPython = process.env.INFORMATION_CONTROL_SCHEMA_PYTHON || "python3";
const PYTHON = configuredPython.includes("/") ? configuredPython : Bun.which(configuredPython) || configuredPython;
const probe = Bun.spawnSync({ cmd: [PYTHON, "-c", "import jsonschema"], stdout: "pipe", stderr: "pipe" });
const validatorTest = probe.exitCode === 0 ? test : test.skip;

type Result = { exitCode: number; stdout: string; stderr: string };

function runGuard(args: string[], options: { cwd?: string; env?: Record<string, string> } = {}): Result {
  const result = Bun.spawnSync({
    cmd: ["/bin/bash", KINGDOM, "guard", ...args],
    cwd: options.cwd || ROOT,
    stdout: "pipe",
    stderr: "pipe",
    env: {
      ...process.env,
      LC_ALL: "C",
      LANG: "C",
      INFORMATION_CONTROL_SCHEMA_PYTHON: PYTHON,
      ...options.env,
    },
  });
  return {
    exitCode: result.exitCode,
    stdout: result.stdout.toString(),
    stderr: result.stderr.toString(),
  };
}

function runDirect(args: string[]): Result {
  const result = Bun.spawnSync({ cmd: [PYTHON, VALIDATOR, ...args], cwd: ROOT, stdout: "pipe", stderr: "pipe" });
  return {
    exitCode: result.exitCode,
    stdout: result.stdout.toString(),
    stderr: result.stderr.toString(),
  };
}

function citizenLaw(contract: string): string {
  const start = contract.indexOf("## Citizen law\n");
  const end = contract.indexOf("\n## ", start + 1);
  if (start < 0 || end < 0) throw new Error("Citizen Law fixture is unavailable");
  return contract.slice(start, end).trimEnd() + "\n";
}

describe("kingdom guard", () => {
  test("reads the exact canonical law, contract, and inert example from any working directory", () => {
    const temporary = mkdtempSync(join(tmpdir(), "kingdom-guard-read."));
    try {
      const contract = readFileSync(CONTRACT, "utf8");
      const law = citizenLaw(contract);
      for (const args of [[], ["law"]]) {
        expect(runGuard(args, { cwd: temporary })).toEqual({ exitCode: 0, stdout: law, stderr: "" });
      }
      expect(runGuard(["protocol"], { cwd: temporary }))
        .toEqual({ exitCode: 0, stdout: contract, stderr: "" });
      expect(runGuard(["example"], { cwd: temporary }))
        .toEqual({ exitCode: 0, stdout: readFileSync(EXAMPLE, "utf8"), stderr: "" });
    } finally {
      rmSync(temporary, { recursive: true, force: true });
    }
  });

  test("keeps help and usage strict without reflecting rejected arguments", () => {
    const help = runGuard(["help"]);
    expect(help.exitCode).toBe(0);
    expect(help.stderr).toBe("");
    expect(help.stdout).toContain("internal consistency only");
    expect(help.stdout).toContain("never installs it");

    for (const args of [
      ["unknown-command"],
      ["law", "surplus"],
      ["validate", "--json", "--json"],
      ["validate", "one.json", "two.json"],
      ["validate", "--fix", "one.json"],
    ]) {
      const result = runGuard(args);
      expect(result.exitCode, args.join(" ")).toBe(64);
      expect(result.stdout, args.join(" ")).toBe("");
      expect(result.stderr, args.join(" ")).toStartWith("Usage: ./kingdom guard");
      for (const argument of args.filter((item) => item.includes("unknown") || item.includes("surplus") || item.includes("fix"))) {
        expect(result.stderr).not.toContain(argument);
      }
    }
  });

  validatorTest("delegates valid and invalid envelopes byte-for-byte and preserves exit status", () => {
    for (const [guardArgs, directArgs] of [
      [["validate", "--json"], ["--json", EXAMPLE]],
      [["validate", "--json", EXAMPLE], ["--json", EXAMPLE]],
    ] as const) {
      expect(runGuard([...guardArgs])).toEqual(runDirect([...directArgs]));
    }

    const temporary = mkdtempSync(join(tmpdir(), "kingdom-guard-invalid."));
    try {
      const sentinel = "DO-NOT-ECHO-CLI-CREDENTIAL-MATERIAL";
      const hostile = join(temporary, "hostile.json");
      writeFileSync(hostile, JSON.stringify({ raw_secret: `${sentinel}; $(touch PWNED); <script>alert(1)</script>\u001b[31m` }));
      const result = runGuard(["validate", "--json", hostile], { cwd: temporary });
      expect(result).toEqual(runDirect(["--json", hostile]));
      expect(result.exitCode).toBe(1);
      expect(result.stdout).not.toContain(sentinel);
      expect(result.stderr).not.toContain(sentinel);
      expect(existsSync(join(temporary, "PWNED"))).toBe(false);
      expect(Object.values(JSON.parse(result.stdout).effects).every((effect) => effect === false)).toBe(true);
    } finally {
      rmSync(temporary, { recursive: true, force: true });
    }
  });

  validatorTest("passes hostile filenames literally or rejects them without printing them", () => {
    const temporary = mkdtempSync(join(tmpdir(), "kingdom-guard-filenames."));
    try {
      const hostileName = "envelope $(touch PWNED) `false`\n.json";
      const hostilePath = join(temporary, hostileName);
      writeFileSync(hostilePath, readFileSync(EXAMPLE));
      expect(runGuard(["validate", "--json", hostilePath], { cwd: temporary }).exitCode).toBe(0);
      expect(existsSync(join(temporary, "PWNED"))).toBe(false);

      const leadingFlag = join(temporary, "--json");
      writeFileSync(leadingFlag, readFileSync(EXAMPLE));
      const relative = runGuard(["validate", "--json", "--", basename(leadingFlag)], { cwd: temporary });
      expect(relative.exitCode).toBe(0);
      expect(relative.stderr).toBe("");
    } finally {
      rmSync(temporary, { recursive: true, force: true });
    }
  });

  validatorTest("retains the validator's symlink refusal through the front door", () => {
    const temporary = mkdtempSync(join(tmpdir(), "kingdom-guard-symlink."));
    try {
      const link = join(temporary, "envelope.json");
      symlinkSync(EXAMPLE, link);
      const result = runGuard(["validate", "--json", link]);
      expect(result.exitCode).toBe(1);
      expect(JSON.parse(result.stdout).issues[0].code).toBe("symlink");
    } finally {
      rmSync(temporary, { recursive: true, force: true });
    }
  });

  test("fails closed when the pinned dependency or trusted interpreter is unavailable", () => {
    const temporary = mkdtempSync(join(tmpdir(), "kingdom-guard-dependency."));
    try {
      const noSite = join(temporary, "python-no-site");
      writeFileSync(noSite, '#!/bin/sh\nexec "$GUARD_TEST_PYTHON" -S "$@"\n');
      chmodSync(noSite, 0o700);
      const missingDependency = runGuard(["validate", "--json"], {
        env: { INFORMATION_CONTROL_SCHEMA_PYTHON: noSite, GUARD_TEST_PYTHON: PYTHON },
      });
      expect(missingDependency.exitCode).toBe(1);
      expect(missingDependency.stderr).toBe("");
      expect(JSON.parse(missingDependency.stdout)).toMatchObject({
        ok: false,
        issues: [{ code: "dependency-missing", path: "/" }],
        effects: { scan: false, lookup: false, network: false, mutation: false, enforcement: false, authority: false, karma: false },
      });

      const missingInterpreter = runGuard(["validate", "--json"], {
        env: { INFORMATION_CONTROL_SCHEMA_PYTHON: join(temporary, "absent-python") },
      });
      expect(missingInterpreter).toEqual({
        exitCode: 127,
        stdout: "",
        stderr: "guard: trusted validator interpreter is unavailable\n",
      });
    } finally {
      rmSync(temporary, { recursive: true, force: true });
    }
  });

  test("contains no network, install, shell-evaluation, or write surface", () => {
    const source = readFileSync(GUARD, "utf8");
    for (const forbidden of [
      "subprocess", "socket", "urllib", "requests", "http://", "https://",
      "pip install", "os.system", "shell=True", "eval(", "exec(",
      "write_text", "write_bytes", "stdin",
    ]) expect(source).not.toContain(forbidden);
    expect(source).toContain("os.execve(interpreter, arguments");
    expect(source).toContain("INFORMATION_CONTROL_SCHEMA_PYTHON");
  });
});
