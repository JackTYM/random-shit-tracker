export interface UploadedPhoto {
  key: string;
  publicUrl: string;
}

export function useUploadPhoto() {
  const client = useNeonClient();

  async function uploadPhoto(file: File): Promise<UploadedPhoto> {
    const { data } = await client.auth.getSession();
    // data.session.token is undocumented internal wiring in @neondatabase/neon-js (beta) —
    // re-verify this still works after any package version bump.
    const jwt = data?.session?.token;
    if (!jwt) throw new Error('Not signed in');

    const presign = await $fetch<{ uploadUrl: string; publicUrl: string; key: string; contentType: string }>(
      '/api/uploads/presign',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${jwt}` },
        body: { filename: file.name, contentType: file.type },
      },
    );

    // content-type is part of the presigned signature, so send back exactly what the server
    // signed — anything else is rejected by R2 with SignatureDoesNotMatch.
    await $fetch(presign.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': presign.contentType },
      body: file,
    });

    return { key: presign.key, publicUrl: presign.publicUrl };
  }

  return { uploadPhoto };
}
