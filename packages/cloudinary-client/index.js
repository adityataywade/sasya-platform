/**
 * Cloudinary browser client.
 *
 * Upload signatures must be created by a trusted server. Never expose the
 * Cloudinary API secret or sign uploads in browser code.
 */
export function getCloudinaryConfig() {
  const cloudName = import.meta.env?.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env?.VITE_CLOUDINARY_UPLOAD_PRESET;
  const signingEndpoint = import.meta.env?.VITE_CLOUDINARY_SIGNING_ENDPOINT;

  if (!cloudName || (!uploadPreset && !signingEndpoint)) return null;
  return { cloudName, uploadPreset, signingEndpoint };
}

export async function uploadImage(file, { folder = 'sasya/uncategorized', signal } = {}) {
  if (!(file instanceof File)) throw new TypeError('Cloudinary upload requires a File object.');

  const config = getCloudinaryConfig();
  if (!config) {
    throw new Error('Cloudinary is not configured. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_SIGNING_ENDPOINT.');
  }

  const formData = new FormData();
  formData.append('file', file);
  if (config.signingEndpoint) {
    const signatureResponse = await fetch(config.signingEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ folder }),
      signal,
    });
    if (!signatureResponse.ok) throw new Error(`Cloudinary signing request failed (${signatureResponse.status}).`);

    const { timestamp, signature, apiKey } = await signatureResponse.json();
    if (!timestamp || !signature || !apiKey) throw new Error('Cloudinary signing response is incomplete.');
    formData.append('api_key', apiKey);
    formData.append('timestamp', String(timestamp));
    formData.append('signature', signature);
    formData.append('folder', folder);
  } else {
    formData.append('upload_preset', config.uploadPreset);
    formData.append('folder', folder);
  }

  const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/image/upload`, {
    method: 'POST',
    body: formData,
    signal,
  });
  if (!uploadResponse.ok) throw new Error(`Cloudinary upload failed (${uploadResponse.status}).`);

  const result = await uploadResponse.json();
  return {
    publicId: result.public_id,
    secureUrl: result.secure_url,
    width: result.width,
    height: result.height,
    bytes: result.bytes,
    format: result.format,
  };
}
