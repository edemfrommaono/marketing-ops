import { s3, uploadFile as s3Upload } from './s3';
import fs from 'fs';
import path from 'path';

export async function uploadFile(fileName: string, body: Buffer): Promise<string> {
  const type = process.env.STORAGE_TYPE || "local";
  
  if (type === "s3") {
    return await s3Upload(fileName, body);
  }
  
  // Local mode (FS -> Nginx FileStorage Container)
  const localDir = process.env.STORAGE_LOCAL_PATH || "/mnt/storage";
  const publicUrl = process.env.STORAGE_PUBLIC_URL || "http://localhost:8080/uploads";
  
  const fullPath = path.join(localDir, fileName);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, body);
  
  return `${publicUrl}/${fileName}`;
}
