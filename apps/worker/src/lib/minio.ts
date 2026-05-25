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

export async function downloadToFile(storageKey: string, localPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tmpDir = path.dirname(localPath);
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    client.getObject(BUCKET, storageKey, (err, stream) => {
      if (err) return reject(err);
      const writer = fs.createWriteStream(localPath);
      stream.pipe(writer);
      writer.on("finish", () => resolve());
      writer.on("error", reject);
    });
  });
}

export async function deleteFile(filename: string): Promise<void> {
  await client.removeObject(BUCKET, filename);
}

export { client, BUCKET };