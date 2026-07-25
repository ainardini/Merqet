import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getCurrentUser } from "@/lib/auth";

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Only JPG, PNG, WEBP, or GIF images are allowed" }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "Image must be under 5MB" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() || "jpg";
  const filename = `listings/${user.id}-${Date.now()}.${ext}`;

  try {
    const blob = await put(filename, file, { access: "public" });
    return NextResponse.json({ url: blob.url });
  } catch (err) {
    console.error("Upload failed:", err);
    return NextResponse.json({ error: "Upload failed. Is BLOB_READ_WRITE_TOKEN set?" }, { status: 500 });
  }
}
