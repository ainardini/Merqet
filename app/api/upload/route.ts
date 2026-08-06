import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getCurrentUser } from "@/lib/auth";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_AUDIO_BYTES = 10 * 1024 * 1024; // 10MB — voice notes can run a bit longer
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_AUDIO_TYPES = ["audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg", "audio/wav", "audio/mp3"];

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
  const isAudio = ALLOWED_AUDIO_TYPES.includes(file.type);

  if (!isImage && !isAudio) {
    return NextResponse.json({ error: "Only JPG, PNG, WEBP, GIF images or common audio formats are allowed" }, { status: 400 });
  }

  const maxSize = isImage ? MAX_IMAGE_BYTES : MAX_AUDIO_BYTES;
  if (file.size > maxSize) {
    return NextResponse.json({ error: `File must be under ${maxSize / (1024 * 1024)}MB` }, { status: 400 });
  }

  const folder = isImage ? "listings" : "voice-notes";
  const ext = file.name.split(".").pop() || (isImage ? "jpg" : "webm");
  const filename = `${folder}/${user.id}-${Date.now()}.${ext}`;

  try {
    const blob = await put(filename, file, { access: "public" });
    return NextResponse.json({ url: blob.url, kind: isImage ? "image" : "audio" });
  } catch (err) {
    console.error("Upload failed:", err);
    return NextResponse.json({ error: "Upload failed. Is BLOB_READ_WRITE_TOKEN set?" }, { status: 500 });
  }
}
