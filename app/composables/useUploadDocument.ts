export interface UploadedDocument {
  key: string;
  publicUrl: string;
}

export function useUploadDocument() {
  const client = useNeonClient();

  async function uploadDocument(file: File): Promise<UploadedDocument> {
    const { data } = await client.auth.getSession();
    const jwt = data?.session?.token;
    if (!jwt) throw new Error('Not signed in');

    const presign = await $fetch<{ uploadUrl: string; publicUrl: string; key: string }>(
      '/api/uploads/presign-document',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${jwt}` },
        body: { filename: file.name, contentType: file.type || 'application/octet-stream' },
      },
    );

    await $fetch(presign.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
      body: file,
    });

    return { key: presign.key, publicUrl: presign.publicUrl };
  }

  return { uploadDocument };
}
