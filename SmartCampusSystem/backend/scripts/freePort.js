/* eslint-disable no-console */
/**
 * Frees the backend PORT (default 5000) if another process is still listening.
 * Prevents EADDRINUSE when a previous `npm run dev` was left running.
 */
const { execSync } = require("child_process");
const path = require("path");

// Load .env only when run as a CLI script (npm run free-port / npm run dev)
if (require.main === module) {
  require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
}

const getListeningPids = (port) => {
  const portStr = String(port);
  try {
    const output = execSync("netstat -ano", { encoding: "utf8" });
    const pids = new Set();
    for (const line of output.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed.includes("LISTENING")) continue;
      const parts = trimmed.split(/\s+/);
      if (parts.length < 5) continue;
      const local = parts[1] || "";
      if (local.endsWith(`:${portStr}`) || local === `[::]:${portStr}`) {
        const pid = parts[parts.length - 1];
        if (/^\d+$/.test(pid) && pid !== "0") {
          // Do not kill our own process
          if (pid === String(process.pid)) continue;
          pids.add(pid);
        }
      }
    }
    return [...pids];
  } catch {
    return [];
  }
};

const freePort = (port = process.env.PORT || 5000) => {
  const pids = getListeningPids(port);
  if (!pids.length) {
    console.log(`Port ${port} is free`);
    return;
  }

  for (const pid of pids) {
    try {
      console.log(`Freeing port ${port} (stopping PID ${pid})...`);
      execSync(`taskkill /F /PID ${pid} /T`, { stdio: "ignore" });
    } catch {
      // Process may already have exited
    }
  }

  // Brief pause so Windows releases the socket
  try {
    execSync("ping -n 2 127.0.0.1 >nul", { stdio: "ignore", shell: true });
  } catch {
    /* ignore */
  }
};

module.exports = { freePort, getListeningPids };

if (require.main === module) {
  freePort(process.env.PORT || 5000);
}
