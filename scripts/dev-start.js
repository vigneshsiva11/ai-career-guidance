const { execSync, spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = process.cwd();
const port = 3000;

function killPortWindows(targetPort) {
  try {
    const out = execSync(`netstat -ano | findstr :${targetPort}`, {
      stdio: ["ignore", "pipe", "ignore"],
    }).toString();
    const pids = new Set();
    for (const line of out.split(/\r?\n/)) {
      if (!line.includes("LISTENING")) continue;
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && /^\d+$/.test(pid)) pids.add(pid);
    }
    for (const pid of pids) {
      try {
        execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
        console.log(`[dev] killed stale PID ${pid} on port ${targetPort}`);
      } catch {}
    }
  } catch {}
}

function cleanCaches() {
  const targets = [
    path.join(root, ".next"),
    path.join(root, "node_modules", ".cache"),
  ];
  for (const target of targets) {
    try {
      if (fs.existsSync(target)) {
        fs.rmSync(target, { recursive: true, force: true });
        console.log(`[dev] removed ${path.relative(root, target)}`);
      }
    } catch (error) {
      console.warn(`[dev] could not remove ${target}: ${error.message}`);
    }
  }
}

if (process.platform === "win32") {
  killPortWindows(port);
}
cleanCaches();

const nextBin = path.join(
  root,
  "node_modules",
  "next",
  "dist",
  "bin",
  "next"
);

function startNextDev() {
  if (!fs.existsSync(nextBin)) {
    console.error("[dev] next binary not found. Run `npm install` first.");
    process.exit(1);
  }

  const primary = spawn(process.execPath, [nextBin, "dev", "-p", String(port)], {
    cwd: root,
    stdio: "inherit",
    shell: false,
  });

  primary.on("error", (error) => {
    console.warn(
      `[dev] primary spawn failed (${error.code || "unknown"}). Falling back to shell launcher.`
    );

    const fallback = spawn("npx", ["next", "dev", "-p", String(port)], {
      cwd: root,
      stdio: "inherit",
      shell: true,
    });

    fallback.on("exit", (code) => process.exit(code ?? 0));
  });

  primary.on("exit", (code) => process.exit(code ?? 0));
}

startNextDev();
