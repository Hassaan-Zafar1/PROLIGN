const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export const uploadService = {
  uploadImage: async (file) => {
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      throw new Error('Cloudinary environment variables not configured.');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('folder', 'mentormentee/profiles');

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      { method: 'POST', body: formData }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Upload failed');
    }

    const data = await response.json();
    return data.secure_url; // ← HTTPS URL to store in DB
  },

  uploadCV: async (file) => {
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      throw new Error('Cloudinary environment variables not configured.');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('folder', 'mentormentee/cvs');

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/raw/upload`, // raw for PDFs/docs
      { method: 'POST', body: formData }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'CV upload failed');
    }

    const data = await response.json();
    return {
      url: data.secure_url,
      filename: file.name,
    };
  },
};