export interface UploadedDocument {
  key: string;
  publicUrl: string;
}

export function useUploadDocument() {
  const client = useNeonClient();

  async function uploadDocument(file: File): Promise<UploadedDocument> {
    const { data } = await client.auth.getSession();
    // data.session.token is undocumented internal wiring in @neondatabase/neon-js (beta) —
    // re-verify this still works after any package version bump.
    const jwt = data?.session?.token;
    if (!jwt) throw new Error('Not signed in');

    const presign = await $fetch<{ uploadUrl: string; publicUrl: string; key: string; contentType: string }>(
      '/api/uploads/presign-document',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${jwt}` },
        body: { filename: file.name, contentType: file.type || 'application/octet-stream' },
      },
    );

    // content-type is part of the presigned signature, and the server normalizes it (strips
    // parameters, lowercases), so send back exactly what it signed — anything else is rejected
    // by R2 with SignatureDoesNotMatch.
    await $fetch(presign.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': presign.contentType },
      body: file,
    });

    return { key: presign.key, publicUrl: presign.publicUrl };
  }

  return { uploadDocument };
}
