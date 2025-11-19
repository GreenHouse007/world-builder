import type { FastifyPluginAsync } from "fastify";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadRoutes: FastifyPluginAsync = async (app) => {
  // Upload image to Cloudinary
  app.post("/upload/image", async (req, reply) => {
    try {
      const data = await req.file();

      if (!data) {
        return reply.code(400).send({ error: "No file uploaded" });
      }

      // Check if file is an image
      const mimeType = data.mimetype;
      if (!mimeType.startsWith("image/")) {
        return reply.code(400).send({ error: "File must be an image" });
      }

      // Convert file buffer to base64
      const buffer = await data.toBuffer();
      const base64Image = `data:${mimeType};base64,${buffer.toString("base64")}`;

      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(base64Image, {
        folder: "world-builder",
        resource_type: "image",
        transformation: [
          { quality: "auto" },
          { fetch_format: "auto" },
        ],
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
      };
    } catch (error) {
      req.log.error(error);
      return reply.code(500).send({ error: "Failed to upload image" });
    }
  });
};
