import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withAuth } from "../_lib/respond.js";
import { v2 as cloudinary } from "cloudinary";
import formidable from "formidable";
import fs from "fs";

export const config = {
  api: { bodyParser: false },
};

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await withAuth(req, res, ["POST"], async (_user, _cols) => {
    const form = formidable({ maxFileSize: 10 * 1024 * 1024 });

    const [_fields, files] = await form.parse(req);
    const fileEntry = files.file?.[0];

    if (!fileEntry) {
      res.status(400).json({ error: "No file uploaded" }); return;
    }

    if (!fileEntry.mimetype?.startsWith("image/")) {
      res.status(400).json({ error: "File must be an image" }); return;
    }

    const result = await cloudinary.uploader.upload(fileEntry.filepath, {
      folder: "world-builder",
      resource_type: "image",
      transformation: [{ quality: "auto" }, { fetch_format: "auto" }],
    });

    fs.unlinkSync(fileEntry.filepath);

    res.status(200).json({
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
    });
  });
}
