const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const port = Number(process.env.PORT || 3000);
const root = process.cwd();

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
        console.log(`[prepare-dev] killed stale PID ${pid} on port ${targetPort}`);
      } catch {}
    }
  } catch {}
}

function cleanNextCache() {
  const nextDir = path.join(root, ".next");
  try {
    if (fs.existsSync(nextDir)) {
      fs.rmSync(nextDir, { recursive: true, force: true });
      console.log("[prepare-dev] removed .next cache");
    }
  } catch (error) {
    console.warn(`[prepare-dev] failed to remove .next: ${error.message}`);
  }
}

if (process.platform === "win32") {
  killPortWindows(port);
}
cleanNextCache();
