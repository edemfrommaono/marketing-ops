import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export const s3 = new S3Client({
  region: process.env.S3_REGION || "us-east-1",
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
  },
  forcePathStyle: true, // Required for MinIO
});

export async function uploadFile(fileName: string, body: Buffer) {
  const bucket = process.env.S3_BUCKET_NAME || "mops";
  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: fileName,
    Body: body,
  }));
  return `${process.env.S3_ENDPOINT}/${bucket}/${fileName}`;
}
