const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");
const electronBinary = require("electron");

const rootDir = path.resolve(__dirname, "..");
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "tinker-electron-smoke-"));
const userDataDir = path.join(tempRoot, "user-data");
fs.mkdirSync(userDataDir, { recursive: true });

function runElectronSmoke() {
  return new Promise((resolve, reject) => {
    const child = spawn(electronBinary, ["."], {
      cwd: rootDir,
      env: {
        ...process.env,
        TINKER_USER_DATA_DIR: userDataDir,
        TINKER_DISABLE_DEVTOOLS: "1",
        TINKER_SMOKE_EXIT_AFTER_MS: "2500",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Electron smoke test exited with code ${code}\n${stdout}\n${stderr}`));
        return;
      }

      resolve({ stdout, stderr });
    });
  });
}

async function main() {
  await runElectronSmoke();

  const dbPath = path.join(userDataDir, "data", "tinker.db");
  const healthPath = path.join(userDataDir, "data", "runtime-health.json");
  if (!fs.existsSync(dbPath)) {
    throw new Error(`Smoke test database was not created at ${dbPath}`);
  }

  if (!fs.existsSync(healthPath)) {
    throw new Error(`Runtime health snapshot was not written at ${healthPath}`);
  }

  const health = JSON.parse(fs.readFileSync(healthPath, "utf8"));
  if (typeof health.lastLaunchAt !== "string" || typeof health.lastVersion !== "string") {
    throw new Error("Runtime health snapshot is missing persisted launch metadata.");
  }

  console.log(`Electron smoke passed with DB at ${dbPath}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
