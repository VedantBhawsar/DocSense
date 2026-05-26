import * as minio from "minio";

const client = new minio.Client({
  endPoint: process.env["MINIO_ENDPOINT"] ?? "localhost",
  port: Number(process.env["MINIO_PORT"]) || 9000,
  useSSL: process.env["MINIO_USE_SSL"] === "true",
  accessKey: process.env["MINIO_ACCESS_KEY"] ?? "minioadmin",
  secretKey: process.env["MINIO_SECRET_KEY"] ?? "minioadmin",
});

const BUCKET = process.env["MINIO_BUCKET"] ?? "docs";

export async function ensureBucket(): Promise<void> {
  const exists = await client.bucketExists(BUCKET);
  if (!exists) {
    await client.makeBucket(BUCKET);
  }
}

export async function uploadFile(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<string> {
  const unique = `${Date.now()}-${filename}`;
  await client.putObject(BUCKET, unique, buffer, undefined, {
    "Content-Type": mimeType,
  });
  return unique;
}

export async function downloadFile(filename: string): Promise<Buffer> {
  const stream = await client.getObject(BUCKET, filename);
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export async function deleteFile(filename: string): Promise<void> {
  await client.removeObject(BUCKET, filename);
}

export function getFileUrl(filename: string): string {
  const protocol = process.env["MINIO_USE_SSL"] === "true" ? "https" : "http";
  const endpoint = process.env["MINIO_ENDPOINT"] ?? "localhost";
  const port = process.env["MINIO_PORT"] || 9000;
  return `${protocol}://${endpoint}:${port}/${BUCKET}/${filename}`;
}

export { client, BUCKET };