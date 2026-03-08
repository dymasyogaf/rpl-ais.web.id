const http = require("http");
const path = require("path");
const fs = require("fs");
const fsp = require("fs/promises");
const { spawn } = require("child_process");
const { randomUUID } = require("crypto");

const PORT = Number(process.env.PORT || 8788);
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";
const ALLOWED_PART_MINUTES = new Set([1, 2, 3, 4, 5]);
const SOURCE_TYPES = new Set(["youtube", "upload"]);
const MAX_JSON_BYTES = 1024 * 1024;
const MAX_UPLOAD_BYTES = 1024 * 1024 * 1024;
const RESULT_TTL_MS = Number(process.env.RESULT_TTL_MS || 60 * 60 * 1000);
const UPLOAD_TTL_MS = Number(process.env.UPLOAD_TTL_MS || 60 * 60 * 1000);
const CLEANUP_INTERVAL_MS = Number(process.env.CLEANUP_INTERVAL_MS || 5 * 60 * 1000);

const CLIPER_ROOT = path.resolve(__dirname, "..", "..");
const STORAGE_DIR = path.join(CLIPER_ROOT, "storage");
const UPLOADS_DIR = path.join(STORAGE_DIR, "uploads");
const OUTPUTS_DIR = path.join(STORAGE_DIR, "outputs");

const jobs = new Map();
const uploads = new Map();
const binaryCache = new Map();

ensureStorageDirs();
startCleanupScheduler();

function ensureStorageDirs() {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  fs.mkdirSync(OUTPUTS_DIR, { recursive: true });
}

function startCleanupScheduler() {
  void cleanupExpiredStorage();
  const timer = setInterval(() => {
    void cleanupExpiredStorage();
  }, CLEANUP_INTERVAL_MS);

  // Biar process bisa exit normal saat dipakai di environment script.
  if (typeof timer.unref === "function") {
    timer.unref();
  }
}

function isExpired(timestampMs, ttlMs) {
  return Date.now() - timestampMs > ttlMs;
}

async function pathExists(absolutePath) {
  try {
    await fsp.access(absolutePath);
    return true;
  } catch {
    return false;
  }
}

function nowIso() {
  return new Date().toISOString();
}

function safeFileName(name) {
  const normalized = path.basename(String(name || "").trim());
  const withoutUnsafe = normalized.replace(/[^a-zA-Z0-9._-]/g, "_");
  return withoutUnsafe.length === 0 ? "upload.bin" : withoutUnsafe;
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": CORS_ORIGIN,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,x-file-name",
  });
  res.end(JSON.stringify(payload));
}

function removePartFromJob(jobId, fileName) {
  const job = jobs.get(jobId);
  if (!job || !Array.isArray(job.parts)) {
    return;
  }

  const nextParts = job.parts.filter((part) => part.fileName !== fileName);
  if (nextParts.length !== job.parts.length) {
    updateJob(job, { parts: nextParts });
  }
}

async function cleanupOutputDirectoryIfEmpty(jobId) {
  const targetDir = path.join(OUTPUTS_DIR, jobId);
  try {
    const files = await fsp.readdir(targetDir);
    if (files.length === 0) {
      await fsp.rm(targetDir, { recursive: true, force: true });
    }
  } catch {
    // ignore cleanup error
  }
}

function getJobSourcePath(job) {
  if (!job) {
    return null;
  }

  if (typeof job.sourceFilePath === "string" && job.sourceFilePath.length > 0) {
    return job.sourceFilePath;
  }

  if (job.sourceType === "upload" && job.source && job.source.uploadId) {
    const uploadMeta = uploads.get(job.source.uploadId);
    if (uploadMeta && uploadMeta.absolutePath) {
      return uploadMeta.absolutePath;
    }
  }

  return null;
}

function isSourcePathReferencedByOtherJobs(sourcePath, currentJobId) {
  for (const job of jobs.values()) {
    if (job.id === currentJobId) {
      continue;
    }

    if (job.status === "failed") {
      continue;
    }

    const otherSourcePath = getJobSourcePath(job);
    if (!otherSourcePath || path.resolve(otherSourcePath) !== path.resolve(sourcePath)) {
      continue;
    }

    if (["queued", "processing"].includes(job.status)) {
      return true;
    }

    if (job.status === "done" && Array.isArray(job.parts) && job.parts.length > 0) {
      return true;
    }
  }

  return false;
}

async function cleanupJobSourceIfPossible(jobId) {
  const job = jobs.get(jobId);
  if (!job || !Array.isArray(job.parts) || job.parts.length > 0) {
    return;
  }

  const sourcePath = getJobSourcePath(job);
  if (!sourcePath) {
    return;
  }

  const resolvedSourcePath = path.resolve(sourcePath);
  const resolvedUploadsDir = `${path.resolve(UPLOADS_DIR)}${path.sep}`;
  if (!resolvedSourcePath.startsWith(resolvedUploadsDir)) {
    return;
  }

  if (isSourcePathReferencedByOtherJobs(resolvedSourcePath, jobId)) {
    return;
  }

  await fsp.rm(resolvedSourcePath, { force: true });

  if (job.sourceType === "upload" && job.source && job.source.uploadId) {
    const uploadMeta = uploads.get(job.source.uploadId);
    if (uploadMeta && path.resolve(uploadMeta.absolutePath) === resolvedSourcePath) {
      uploads.delete(job.source.uploadId);
    }
  } else {
    for (const [uploadId, uploadMeta] of uploads.entries()) {
      if (path.resolve(uploadMeta.absolutePath) === resolvedSourcePath) {
        uploads.delete(uploadId);
      }
    }
  }

  updateJob(job, { sourceFilePath: null });
}

async function removeOutputFile(jobId, fileName, absolutePath) {
  await fsp.rm(absolutePath, { force: true });
  removePartFromJob(jobId, fileName);
  await cleanupOutputDirectoryIfEmpty(jobId);
  await cleanupJobSourceIfPossible(jobId);
}

function sendFile(res, absolutePath, downloadName, options = {}) {
  const { deleteAfterSuccess = false, onDeleted = null } = options;
  const stream = fs.createReadStream(absolutePath);
  let finished = false;

  res.writeHead(200, {
    "Content-Type": "video/mp4",
    "Content-Disposition": `attachment; filename="${downloadName}"`,
    "Access-Control-Allow-Origin": CORS_ORIGIN,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,x-file-name",
  });

  stream.on("error", () => {
    if (!res.headersSent) {
      sendJson(res, 500, { message: "Gagal membaca file output." });
    } else {
      res.destroy();
    }
  });

  res.on("finish", async () => {
    finished = true;
    if (!deleteAfterSuccess) {
      return;
    }

    try {
      await onDeleted?.();
    } catch {
      // ignore delete failure; file akan ikut cleanup TTL berikutnya
    }
  });

  res.on("close", () => {
    if (!finished) {
      stream.destroy();
    }
  });

  stream.pipe(res);
}

function isValidYoutubeUrl(url) {
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return false;
    }

    return parsed.hostname.includes("youtube.com") || parsed.hostname.includes("youtu.be");
  } catch {
    return false;
  }
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
      if (Buffer.byteLength(body, "utf8") > MAX_JSON_BYTES) {
        reject(new Error("Payload too large"));
        req.destroy();
      }
    });

    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });

    req.on("error", (error) => {
      reject(error);
    });
  });
}

function parseJobIdFromPath(pathname) {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length >= 2 && parts[0] === "jobs") {
    return parts[1];
  }
  return null;
}

function validateCreateJobPayload(payload) {
  const errors = [];

  if (!SOURCE_TYPES.has(payload.sourceType)) {
    errors.push("sourceType wajib: 'youtube' atau 'upload'.");
  }

  if (!Number.isInteger(payload.partMinutes) || !ALLOWED_PART_MINUTES.has(payload.partMinutes)) {
    errors.push("partMinutes wajib integer: 1, 2, 3, 4, atau 5.");
  }

  if (payload.sourceType === "youtube") {
    if (typeof payload.sourceUrl !== "string" || !isValidYoutubeUrl(payload.sourceUrl)) {
      errors.push("sourceUrl wajib URL YouTube valid saat sourceType='youtube'.");
    }
  }

  if (payload.sourceType === "upload") {
    if (typeof payload.uploadId !== "string" || payload.uploadId.trim().length === 0) {
      errors.push("uploadId wajib diisi saat sourceType='upload'.");
    } else if (!uploads.has(payload.uploadId)) {
      errors.push("uploadId tidak ditemukan. Upload dulu via POST /uploads.");
    }
  }

  return errors;
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { windowsHide: true });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      const message = stderr.trim() || stdout.trim() || `${command} exited with code ${code}`;
      reject(new Error(message));
    });
  });
}

function getBinaryVersionArgs(binaryName) {
  if (binaryName === "yt-dlp") {
    return ["--version"];
  }
  return ["-version"];
}

function getBinaryCandidates(binaryName) {
  const candidates = [binaryName];
  if (process.platform === "win32" && process.env.LOCALAPPDATA) {
    candidates.push(
      path.join(process.env.LOCALAPPDATA, "Microsoft", "WinGet", "Links", `${binaryName}.exe`),
    );
  }
  return candidates;
}

async function resolveBinaryCommand(binaryName) {
  if (binaryCache.has(binaryName)) {
    return binaryCache.get(binaryName);
  }

  const versionArgs = getBinaryVersionArgs(binaryName);
  const candidates = getBinaryCandidates(binaryName);

  for (const candidate of candidates) {
    try {
      await runCommand(candidate, versionArgs);
      binaryCache.set(binaryName, candidate);
      return candidate;
    } catch {
      // lanjut cek kandidat berikutnya
    }
  }

  throw new Error(`${binaryName} belum terpasang atau tidak ada di PATH.`);
}

async function getVideoDurationSeconds(filePath) {
  const ffprobeCommand = await resolveBinaryCommand("ffprobe");
  const result = await runCommand(ffprobeCommand, [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    filePath,
  ]);
  const duration = Number.parseFloat(result.stdout.trim());
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error("Tidak bisa membaca durasi video.");
  }
  return Math.ceil(duration);
}

async function splitVideoPart(sourcePath, outputPath, startSeconds, durationSeconds) {
  const ffmpegCommand = await resolveBinaryCommand("ffmpeg");
  await runCommand(ffmpegCommand, [
    "-y",
    "-ss",
    String(startSeconds),
    "-i",
    sourcePath,
    "-t",
    String(durationSeconds),
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "23",
    "-c:a",
    "aac",
    "-movflags",
    "+faststart",
    outputPath,
  ]);
}

async function resolveYoutubeSource(job) {
  const ytdlpCommand = await resolveBinaryCommand("yt-dlp");
  const templateBaseName = `${job.id}_youtube`;
  const outputTemplate = path.join(UPLOADS_DIR, `${templateBaseName}.%(ext)s`);

  await runCommand(ytdlpCommand, ["--no-playlist", "-o", outputTemplate, job.source.sourceUrl]);
  const allFiles = await fsp.readdir(UPLOADS_DIR);
  const candidate = allFiles.find((fileName) => fileName.startsWith(`${templateBaseName}.`));
  if (!candidate) {
    throw new Error("Download YouTube gagal: file hasil tidak ditemukan.");
  }
  return path.join(UPLOADS_DIR, candidate);
}

async function resolveUploadSource(job) {
  const upload = uploads.get(job.source.uploadId);
  if (!upload) {
    throw new Error("uploadId tidak ditemukan.");
  }
  return upload.absolutePath;
}

async function resolveSourcePath(job) {
  if (job.sourceType === "youtube") {
    return resolveYoutubeSource(job);
  }
  if (job.sourceType === "upload") {
    return resolveUploadSource(job);
  }
  throw new Error("sourceType tidak didukung.");
}

function updateJob(job, patch) {
  Object.assign(job, patch, { updatedAt: nowIso() });
}

function getActiveSourcePaths() {
  const activePaths = new Set();

  for (const job of jobs.values()) {
    if (!["queued", "processing"].includes(job.status)) {
      continue;
    }

    if (job.sourceFilePath) {
      activePaths.add(job.sourceFilePath);
      continue;
    }

    if (job.sourceType === "upload" && job.source && job.source.uploadId) {
      const uploadMeta = uploads.get(job.source.uploadId);
      if (uploadMeta && uploadMeta.absolutePath) {
        activePaths.add(uploadMeta.absolutePath);
      }
    }
  }

  return activePaths;
}

async function cleanupExpiredUploads() {
  const activePaths = getActiveSourcePaths();
  const files = await fsp.readdir(UPLOADS_DIR);

  for (const fileName of files) {
    const absolutePath = path.join(UPLOADS_DIR, fileName);
    let stat;

    try {
      stat = await fsp.stat(absolutePath);
    } catch {
      continue;
    }

    if (!stat.isFile()) {
      continue;
    }

    if (activePaths.has(absolutePath)) {
      continue;
    }

    if (!isExpired(stat.mtimeMs, UPLOAD_TTL_MS)) {
      continue;
    }

    await fsp.rm(absolutePath, { force: true });

    for (const [uploadId, meta] of uploads.entries()) {
      if (meta.absolutePath === absolutePath) {
        uploads.delete(uploadId);
      }
    }
  }
}

async function cleanupExpiredOutputs() {
  const directories = await fsp.readdir(OUTPUTS_DIR, { withFileTypes: true });

  for (const entry of directories) {
    if (!entry.isDirectory()) {
      continue;
    }

    const jobId = entry.name;
    const outputDir = path.join(OUTPUTS_DIR, jobId);
    let files = [];
    try {
      files = await fsp.readdir(outputDir);
    } catch {
      continue;
    }

    for (const fileName of files) {
      const absolutePath = path.join(outputDir, fileName);
      let stat;
      try {
        stat = await fsp.stat(absolutePath);
      } catch {
        continue;
      }

      if (!stat.isFile()) {
        continue;
      }

      if (!isExpired(stat.mtimeMs, RESULT_TTL_MS)) {
        continue;
      }

      await removeOutputFile(jobId, fileName, absolutePath);
    }

    await cleanupOutputDirectoryIfEmpty(jobId);
    await cleanupJobSourceIfPossible(jobId);
  }
}

async function cleanupExpiredStorage() {
  try {
    await cleanupExpiredUploads();
    await cleanupExpiredOutputs();
  } catch {
    // noop
  }
}

async function emptyDirectory(targetDir) {
  let entries = [];
  try {
    entries = await fsp.readdir(targetDir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    const absolutePath = path.join(targetDir, entry.name);
    try {
      await fsp.rm(absolutePath, { recursive: true, force: true });
    } catch {
      // ignore locked/busy file and continue
    }
  }
}

async function cleanupAllStorage() {
  await emptyDirectory(OUTPUTS_DIR);
  await emptyDirectory(UPLOADS_DIR);
  jobs.clear();
  uploads.clear();
}

function startJobProcessing(jobId) {
  setImmediate(async () => {
    const job = jobs.get(jobId);
    if (!job || job.status !== "queued") {
      return;
    }

    try {
      updateJob(job, { status: "processing", progress: 5, error: null });
      const sourcePath = await resolveSourcePath(job);
      updateJob(job, { sourceFilePath: sourcePath, progress: 20 });

      const durationSeconds = await getVideoDurationSeconds(sourcePath);
      const partDurationSeconds = job.partMinutes * 60;
      const totalParts = Math.ceil(durationSeconds / partDurationSeconds);
      const jobOutputDir = path.join(OUTPUTS_DIR, job.id);
      await fsp.mkdir(jobOutputDir, { recursive: true });

      updateJob(job, {
        durationSeconds,
        totalParts,
        outputDir: jobOutputDir,
        parts: [],
        progress: 30,
      });

      for (let i = 0; i < totalParts; i += 1) {
        const partNumber = i + 1;
        const startSeconds = i * partDurationSeconds;
        const currentDuration = Math.min(partDurationSeconds, durationSeconds - startSeconds);
        const fileName = `part${String(partNumber).padStart(2, "0")}.mp4`;
        const outputPath = path.join(jobOutputDir, fileName);

        await splitVideoPart(sourcePath, outputPath, startSeconds, currentDuration);

        job.parts.push({
          part: partNumber,
          fileName,
          startSeconds,
          durationSeconds: currentDuration,
          relativePath: path.join("storage", "outputs", job.id, fileName),
        });

        const progress = 30 + Math.round(((i + 1) / totalParts) * 70);
        updateJob(job, { progress });
      }

      updateJob(job, { status: "done", progress: 100 });
    } catch (error) {
      updateJob(job, { status: "failed", error: error.message });
    }
  });
}

function handleUpload(req, res) {
  return new Promise((resolve) => {
    const originalName = safeFileName(req.headers["x-file-name"] || "upload.bin");
    const uploadId = randomUUID();
    const ext = path.extname(originalName) || ".bin";
    const storedFileName = `${uploadId}${ext}`;
    const absolutePath = path.join(UPLOADS_DIR, storedFileName);
    const output = fs.createWriteStream(absolutePath);
    let totalBytes = 0;
    let aborted = false;
    let finalized = false;

    function finalize(handler) {
      if (finalized) {
        return;
      }
      finalized = true;
      handler();
      resolve();
    }

    req.on("data", (chunk) => {
      totalBytes += chunk.length;
      if (totalBytes > MAX_UPLOAD_BYTES && !aborted) {
        aborted = true;
        req.destroy(new Error("Upload too large"));
      }
    });

    req.pipe(output);

    req.on("error", async (error) => {
      output.destroy();
      await fsp.rm(absolutePath, { force: true });
      finalize(() => {
        if (error.message === "Upload too large") {
          sendJson(res, 413, { message: "Ukuran upload melebihi batas 1GB." });
        } else {
          sendJson(res, 500, { message: "Upload gagal.", detail: error.message });
        }
      });
    });

    output.on("finish", () => {
      const uploadedAt = nowIso();
      const uploadMeta = {
        id: uploadId,
        originalName,
        storedFileName,
        bytes: totalBytes,
        absolutePath,
        uploadedAt,
      };
      uploads.set(uploadId, uploadMeta);
      sendJson(res, 201, {
        message: "Upload berhasil.",
        upload: {
          id: uploadMeta.id,
          originalName: uploadMeta.originalName,
          storedFileName: uploadMeta.storedFileName,
          bytes: uploadMeta.bytes,
          uploadedAt: uploadMeta.uploadedAt,
        },
      });
      finalize(() => {});
    });

    output.on("error", async (error) => {
      await fsp.rm(absolutePath, { force: true });
      finalize(() => {
        sendJson(res, 500, { message: "Gagal menulis file upload.", detail: error.message });
      });
    });
  });
}

const server = http.createServer(async (req, res) => {
  const method = req.method || "GET";
  const requestUrl = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const pathname = requestUrl.pathname;

  if (method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": CORS_ORIGIN,
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type,x-file-name",
      "Access-Control-Max-Age": "86400",
    });
    res.end();
    return;
  }

  if (method === "GET" && pathname === "/health") {
    sendJson(res, 200, {
      ok: true,
      service: "cliper-api",
      timestamp: nowIso(),
      storage: {
        uploads: UPLOADS_DIR,
        outputs: OUTPUTS_DIR,
      },
      cleanup: {
        resultTtlMs: RESULT_TTL_MS,
        uploadTtlMs: UPLOAD_TTL_MS,
        intervalMs: CLEANUP_INTERVAL_MS,
      },
    });
    return;
  }

  if (method === "GET" && pathname === "/") {
    sendJson(res, 200, {
      message: "cliper-api aktif.",
      endpoints: [
        "GET /",
        "GET /health",
        "POST /uploads",
        "GET /uploads",
        "POST /jobs",
        "GET /jobs/:id",
        "GET /jobs/:id/results",
        "GET /download/:jobId/:fileName?autoDelete=1",
        "POST /cleanup/all",
      ],
    });
    return;
  }

  if (method === "POST" && pathname === "/uploads") {
    await handleUpload(req, res);
    return;
  }

  if (method === "GET" && pathname === "/uploads") {
    const list = Array.from(uploads.values()).map((item) => ({
      id: item.id,
      originalName: item.originalName,
      storedFileName: item.storedFileName,
      bytes: item.bytes,
      uploadedAt: item.uploadedAt,
    }));
    sendJson(res, 200, { uploads: list });
    return;
  }

  if (method === "POST" && pathname === "/cleanup/all") {
    try {
      await cleanupAllStorage();
      sendJson(res, 200, {
        message: "Semua file video berhasil dibersihkan.",
        cleanedAt: nowIso(),
      });
      return;
    } catch (error) {
      sendJson(res, 500, {
        message: "Gagal membersihkan storage video.",
        detail: error.message,
      });
      return;
    }
  }

  if (method === "POST" && pathname === "/jobs") {
    try {
      const payload = await parseBody(req);
      const errors = validateCreateJobPayload(payload);

      if (errors.length > 0) {
        sendJson(res, 400, { message: "Payload tidak valid.", errors });
        return;
      }

      const createdAt = nowIso();
      const jobId = randomUUID();
      const job = {
        id: jobId,
        status: "queued",
        progress: 0,
        sourceType: payload.sourceType,
        partMinutes: payload.partMinutes,
        source:
          payload.sourceType === "youtube"
            ? { sourceUrl: payload.sourceUrl }
            : { uploadId: payload.uploadId },
        durationSeconds: null,
        totalParts: null,
        parts: [],
        sourceFilePath: null,
        outputDir: null,
        error: null,
        createdAt,
        updatedAt: createdAt,
      };

      jobs.set(jobId, job);
      startJobProcessing(jobId);
      sendJson(res, 201, { message: "Job berhasil dibuat.", job });
      return;
    } catch (error) {
      if (error.message === "Invalid JSON body") {
        sendJson(res, 400, { message: "Body harus JSON valid." });
        return;
      }

      if (error.message === "Payload too large") {
        sendJson(res, 413, { message: "Payload terlalu besar (maks 1MB)." });
        return;
      }

      sendJson(res, 500, { message: "Terjadi kesalahan internal.", detail: error.message });
      return;
    }
  }

  if (method === "GET" && pathname.endsWith("/results")) {
    const jobId = parseJobIdFromPath(pathname);
    if (!jobId) {
      sendJson(res, 400, { message: "Format path tidak valid." });
      return;
    }
    const job = jobs.get(jobId);
    if (!job) {
      sendJson(res, 404, { message: "Job tidak ditemukan." });
      return;
    }
    sendJson(res, 200, {
      jobId: job.id,
      status: job.status,
      totalParts: job.totalParts,
      results: job.parts,
    });
    return;
  }

  if (method === "GET" && pathname.startsWith("/jobs/")) {
    const jobId = parseJobIdFromPath(pathname);
    if (!jobId) {
      sendJson(res, 400, { message: "Format path tidak valid." });
      return;
    }
    const job = jobs.get(jobId);

    if (!job) {
      sendJson(res, 404, { message: "Job tidak ditemukan." });
      return;
    }

    sendJson(res, 200, { job });
    return;
  }

  if (method === "GET" && pathname.startsWith("/download/")) {
    const pieces = pathname.split("/").filter(Boolean);
    if (pieces.length !== 3) {
      sendJson(res, 400, { message: "Gunakan format /download/:jobId/:fileName" });
      return;
    }

    const jobId = pieces[1];
    const fileName = safeFileName(pieces[2]);
    const absolutePath = path.join(OUTPUTS_DIR, jobId, fileName);
    const autoDeleteParam = requestUrl.searchParams.get("autoDelete");
    const shouldDeleteAfterSuccess = autoDeleteParam !== "0";

    if (!fs.existsSync(absolutePath)) {
      sendJson(res, 404, { message: "File hasil tidak ditemukan." });
      return;
    }

    sendFile(res, absolutePath, fileName, {
      deleteAfterSuccess: shouldDeleteAfterSuccess,
      onDeleted: async () => {
        await removeOutputFile(jobId, fileName, absolutePath);
      },
    });
    return;
  }

  sendJson(res, 404, { message: "Route tidak ditemukan." });
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`cliper-api aktif di http://localhost:${PORT}`);
});
