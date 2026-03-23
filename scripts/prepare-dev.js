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
  const cacheDirs = [".next", ".next-dev"];
  for (const dirName of cacheDirs) {
    const dirPath = path.join(root, dirName);
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        if (!fs.existsSync(dirPath)) break;
        fs.rmSync(dirPath, { recursive: true, force: true, maxRetries: 3, retryDelay: 150 });
        console.log(`[prepare-dev] removed ${dirName} cache`);
        break;
      } catch (error) {
        if (attempt === 3) {
          console.warn(`[prepare-dev] failed to remove ${dirName}: ${error.message}`);
        }
      }
    }
  }
}

if (process.platform === "win32") {
  killPortWindows(port);
}
cleanNextCache();
