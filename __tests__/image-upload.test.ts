import { uploadImage } from '../src/services/imageUploadService';

test('sends the picked file to Cloudinary and returns only its secure URL', async () => {
  const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ secure_url: 'https://res.cloudinary.com/demo/image/upload/a.jpg' }) });
  globalThis.fetch = fetchMock as typeof fetch;
  await expect(uploadImage({ uri: 'file:///small.jpg', type: 'image/jpeg', fileName: 'small.jpg' }, { cloudName: 'demo', preset: 'chat_unsigned' }))
    .resolves.toBe('https://res.cloudinary.com/demo/image/upload/a.jpg');
  expect(fetchMock).toHaveBeenCalledWith('https://api.cloudinary.com/v1_1/demo/image/upload', expect.objectContaining({ method: 'POST' }));
});

test('rejects a missing Cloudinary configuration before uploading', async () => {
  await expect(uploadImage({ uri: 'file:///small.jpg' }, { cloudName: '', preset: '' })).rejects.toThrow('Cloudinary');
});
