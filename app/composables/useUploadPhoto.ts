export interface UploadedPhoto {
  key: string;
  publicUrl: string;
}

export function useUploadPhoto() {
  const client = useNeonClient();

  async function uploadPhoto(file: File): Promise<UploadedPhoto> {
    const { data } = await client.auth.getSession();
    const jwt = data?.session?.token;
    if (!jwt) throw new Error('Not signed in');

    const presign = await $fetch<{ uploadUrl: string; publicUrl: string; key: string }>(
      '/api/uploads/presign',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${jwt}` },
        body: { filename: file.name, contentType: file.type },
      },
    );

    await $fetch(presign.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });

    return { key: presign.key, publicUrl: presign.publicUrl };
  }

  return { uploadPhoto };
}
