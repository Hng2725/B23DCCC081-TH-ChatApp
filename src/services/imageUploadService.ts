export type PickedImage = { uri?: string; type?: string; fileName?: string };
export type CloudinaryConfig = { cloudName: string; preset: string };

export async function uploadImage(asset: PickedImage, config: CloudinaryConfig): Promise<string> {
  if (!config.cloudName || !config.preset) throw new Error('Chưa cấu hình Cloudinary');
  if (!asset.uri) throw new Error('Không đọc được ảnh đã chọn');
  const body = new FormData();
  body.append('upload_preset', config.preset);
  body.append('file', { uri: asset.uri, type: asset.type || 'image/jpeg', name: asset.fileName || 'chat.jpg' } as any);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/image/upload`, {
    method: 'POST', body,
  });
  if (!response.ok) throw new Error('Tải ảnh lên Cloudinary thất bại');
  const result = await response.json() as { secure_url?: unknown };
  if (typeof result.secure_url !== 'string' || !result.secure_url.startsWith('https://')) throw new Error('Cloudinary không trả về URL ảnh hợp lệ');
  return result.secure_url;
}
