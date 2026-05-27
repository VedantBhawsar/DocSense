import * as minio from "minio";
import fs from "fs";
import path from "path";

const client = new minio.Client({
  endPoint: process.env["MINIO_ENDPOINT"] ?? "localhost",
  port: Number(process.env["MINIO_PORT"]) || 9000,
  useSSL: process.env["MINIO_USE_SSL"] === "true",
  accessKey: process.env["MINIO_ACCESS_KEY"] ?? "minioadmin",
  secretKey: process.env["MINIO_SECRET_KEY"] ?? "minioadmin",
});

const BUCKET = process.env["MINIO_BUCKET"] ?? "docs";

export async function ensureConnection(): Promise<void> {
  try {
    await client.listBuckets();
  } catch (err) {
    throw new Error(
      `MinIO connection failed: ${err instanceof Error ? err.message : err}`,
    );
  }
}

export async function downloadToFile(storageKey: string, localPath: string): Promise<void> {
  const tmpDir = path.dirname(localPath);
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }
  const stream = await client.getObject(BUCKET, storageKey);
  const writer = fs.createWriteStream(localPath);
  stream.pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on("finish", () => resolve());
    writer.on("error", reject);
  });
}

export async function deleteFile(filename: string): Promise<void> {
  await client.removeObject(BUCKET, filename);
}

export { client, BUCKET };