import { v2 as cloudinary } from "cloudinary";

const connectCloudinary = async () => {
    const cloudinaryUrl = process.env.CLOUDINARY_URL?.trim();
    let cloudName = (process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_NAME || "").trim().toLowerCase();
    let apiKey = process.env.CLOUDINARY_API_KEY?.trim();
    let apiSecret = process.env.CLOUDINARY_SECRET_KEY?.trim();

    if (cloudinaryUrl) {
        const match = cloudinaryUrl.match(/^cloudinary:\/\/([^:]+):([^@]+)@([^/?#]+)/i);
        if (match) {
            apiKey = match[1];
            apiSecret = match[2];
            cloudName = match[3].trim().toLowerCase();
        }
    }

    if (!cloudName || !apiKey || !apiSecret) {
        throw new Error("Cloudinary configuration is incomplete. Set CLOUDINARY_URL or provide CLOUDINARY_CLOUD_NAME/CLOUDINARY_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_SECRET_KEY.");
    }

    cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
    });
};

export default connectCloudinary;