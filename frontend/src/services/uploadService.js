const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

// Cloudinary uploads go over raw `fetch` (no axios interceptor here), so they
// need their own timeout — otherwise a stalled upload hangs the calling UI
// forever with no error and no way to recover.
const UPLOAD_TIMEOUT_MS = 20000;

const uploadWithTimeout = async (url, formData) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);
  try {
    return await fetch(url, { method: 'POST', body: formData, signal: controller.signal });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Upload timed out. Please check your connection and try again.', { cause: err });
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
};

export const uploadService = {
  uploadImage: async (file) => {
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      throw new Error('Image upload is not configured yet — set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET.');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('folder', 'mentormentee/profiles');

    const response = await uploadWithTimeout(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, formData);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Upload failed');
    }

    const data = await response.json();
    return data.secure_url; // ← HTTPS URL to store in DB
  },

  uploadCV: async (file) => {
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      throw new Error('CV upload is not configured yet — set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET.');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('folder', 'mentormentee/cvs');

    const response = await uploadWithTimeout(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/raw/upload`, formData); // raw for PDFs/docs

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
