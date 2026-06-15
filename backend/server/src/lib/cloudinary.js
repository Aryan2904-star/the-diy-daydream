import { v2 as cloudinary } from "cloudinary";

// Configured from env (the "image processing tool" — handles upload, resize,
// optimization and CDN delivery). Keys live in backend/server/.env.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

// Upload a buffer (from multer memory storage) to Cloudinary, with sensible
// processing: cap at 1000px and auto quality/format.
export function uploadImage(buffer, folder = "ddd/products") {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        transformation: [
          { width: 1000, height: 1000, crop: "limit" },
          { quality: "auto", fetch_format: "auto" },
        ],
      },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });
}

export async function deleteImage(publicId) {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (e) {
    console.error("Cloudinary delete failed:", e.message);
  }
}
