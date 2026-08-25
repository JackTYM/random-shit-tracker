# Document Attachments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:subagent-driven-development (recommended) or superpowers-extended-cc:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users attach arbitrary files (manuals, receipts, catalogs, certificates) to an item, with Open/Download actions, addable both during item creation and afterward on the Item Detail page.

**Architecture:** A new `item_documents` table (parallel to `item_photos`, simpler — no primary/sort-order concept). A new presign endpoint with no content-type restriction, and a matching upload composable, both mirroring the existing photo-upload plumbing exactly. UI additions to Item Detail (a new "DOCUMENTS" box) and Add Item (a compact Documents section near the just-reorganized Photos strip).

**Tech Stack:** Nuxt 4, Vue 3 `<script setup>`, Drizzle ORM + drizzle-kit migrations, Cloudflare R2 (via `aws4fetch`, matching the existing photo-upload pattern), Neon Postgres RLS.

**User decisions (already made):**
- No file-type restriction on documents — any file can be uploaded.
- Each document has both an "Open" (renders in-browser if possible) and "Download" (forces save-as via client-side blob fetch) action.
- Documents attachable both on Add Item and Item Detail.
- No delete/remove UI in this version — matches the existing photo feature's own scope.

---

## Task 1: `item_documents` schema and migration

**Goal:** The `item_documents` table exists on the live database with correct RLS, and the Drizzle schema/TypeScript types reflect it.

**Files:**
- Modify: `drizzle/schema/links.ts`
- Create: `drizzle/migrations/0012_add_item_documents.sql` (auto-generated)

**Acceptance Criteria:**
- [ ] `item_documents` table exists with columns `id`, `item_id`, `owner_id`, `r2_key`, `url`, `filename`, `created_at`
- [ ] RLS policy matches `item_photos`'/`item_links`' pattern exactly (`isOwner` + `ownsItem`)
- [ ] An index exists on `item_id` (matching `item_photos_item_id_idx`'s pattern)
- [ ] Migration applies cleanly against the live Neon database
- [ ] `npm run typecheck` passes

**Verify:** `npm run typecheck`. Confirm the table and its RLS policy exist via a live, read-only query against the database (`information_schema.columns` and `pg_policies`).

**Steps:**

- [ ] **Step 1: Add the schema definition**

In `drizzle/schema/links.ts`, add `timestamp` to the existing import line and append the new table definition after `itemPhotos` (before `itemLinks`, or after — either position is fine since Drizzle doesn't care about declaration order within a file; place it right after `itemPhotos` for readability since it's the more closely related table):

```ts
import { pgTable, uuid, text, integer, boolean, index, timestamp } from 'drizzle-orm/pg-core';
import { crudPolicy, authenticatedRole } from 'drizzle-orm/neon';
import { sql } from 'drizzle-orm';
import { items } from './items';
import { ownerDefault, ownsItem, isOwner } from './_rls';

export const itemPhotos = pgTable('item_photos', {
  id: uuid('id').defaultRandom().primaryKey(),
  itemId: uuid('item_id').notNull().references(() => items.id, { onDelete: 'cascade' }),
  ownerId: uuid('owner_id').notNull().default(ownerDefault),
  r2Key: text('r2_key').notNull(),
  url: text('url').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  isPrimary: boolean('is_primary').notNull().default(false),
}, (table) => [
  index('item_photos_item_id_idx').on(table.itemId),
  crudPolicy({
    role: authenticatedRole,
    read: sql`${isOwner(table.ownerId)} AND ${ownsItem(table.itemId)}`,
    modify: sql`${isOwner(table.ownerId)} AND ${ownsItem(table.itemId)}`,
  }),
]);

export const itemDocuments = pgTable('item_documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  itemId: uuid('item_id').notNull().references(() => items.id, { onDelete: 'cascade' }),
  ownerId: uuid('owner_id').notNull().default(ownerDefault),
  r2Key: text('r2_key').notNull(),
  url: text('url').notNull(),
  filename: text('filename').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('item_documents_item_id_idx').on(table.itemId),
  crudPolicy({
    role: authenticatedRole,
    read: sql`${isOwner(table.ownerId)} AND ${ownsItem(table.itemId)}`,
    modify: sql`${isOwner(table.ownerId)} AND ${ownsItem(table.itemId)}`,
  }),
]);

export const itemLinks = pgTable('item_links', {
  // ... unchanged, existing code below this point stays exactly as-is
```

(Only the import line gains `timestamp`, and the new `itemDocuments` table is inserted between the existing `itemPhotos` and `itemLinks` definitions — nothing else in the file changes.)

- [ ] **Step 2: Generate and apply the migration**

```bash
npx drizzle-kit generate --name add_item_documents
```
Expected: creates `drizzle/migrations/0012_add_item_documents.sql` containing a `CREATE TABLE "item_documents"` statement, an index, and RLS policy statements — confirm it's the auto-generated output, don't hand-edit it.

```bash
npx drizzle-kit migrate
```

- [ ] **Step 3: Verify and commit**

```bash
npm run typecheck
```
Expected: `ok`.

Confirm live (read-only): query `information_schema.columns` for `item_documents` to confirm all 6 columns exist with correct types, and `pg_policies` to confirm the RLS policy matches `item_photos`'s shape.

```bash
git add drizzle/schema/links.ts drizzle/migrations/0012_add_item_documents.sql drizzle/migrations/meta
git commit -m "Add item_documents table"
```

---

## Task 2: Presign endpoint and upload composable

**Goal:** A document can be uploaded to R2 from the client, with no content-type restriction, returning a key/URL the app can persist.

**Files:**
- Create: `server/api/uploads/presign-document.post.ts`
- Create: `app/composables/useUploadDocument.ts`

**Acceptance Criteria:**
- [ ] The new presign endpoint requires auth (same `requireUserId` check as the photo endpoint) but has no content-type allowlist — any `contentType` value is accepted
- [ ] Uploaded documents are stored under `{userId}/documents/{uuid}-{filename}`, distinct from photos' `{userId}/{uuid}-{filename}` prefix
- [ ] The existing photo presign endpoint (`server/api/uploads/presign.post.ts`) is completely untouched
- [ ] `useUploadDocument` mirrors `useUploadPhoto`'s exact flow (JWT → presign → PUT → return `{key, publicUrl}`)
- [ ] `npm run typecheck` passes

**Verify:** `npm run typecheck`. A real upload test (see Step 3) confirming a file lands in R2 at the correct key and the returned `publicUrl` is fetchable.

**Steps:**

- [ ] **Step 1: Create the presign endpoint**

Create `server/api/uploads/presign-document.post.ts`:

```ts
import { createR2Client, r2ObjectUrl } from '../../utils/r2';
import { requireUserId } from '../../utils/verifyAuth';

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event);
  const body = await readBody<{ filename: string; contentType: string }>(event);
  if (!body?.filename || !body?.contentType) {
    throw createError({ statusCode: 400, statusMessage: 'filename and contentType are required' });
  }

  const config = useRuntimeConfig(event);
  const key = `${userId}/documents/${crypto.randomUUID()}-${body.filename}`;
  const objectUrl = r2ObjectUrl(config.r2AccountId, config.r2Bucket, key);

  const client = createR2Client(config.r2AccessKeyId, config.r2SecretAccessKey);
  const signed = await client.sign(
    new Request(objectUrl, { method: 'PUT', headers: { 'content-type': body.contentType } }),
    { aws: { signQuery: true } },
  );

  return {
    uploadUrl: signed.url,
    publicUrl: `${config.public.r2PublicBaseUrl}/${key}`,
    key,
  };
});
```

(This is `presign.post.ts` with the `ALLOWED_CONTENT_TYPES` check and its import removed, and the key prefix changed to include `/documents/`. Everything else — auth check, R2 signing, response shape — is identical.)

- [ ] **Step 2: Create the upload composable**

Create `app/composables/useUploadDocument.ts`:

```ts
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
```

- [ ] **Step 3: Verify and commit**

```bash
npm run typecheck
```
Expected: `ok`.

Real upload test: write a small throwaway script (or use the browser console against the running dev server while signed in) to call `useUploadDocument`'s flow end-to-end with a small test file (e.g. a `.txt` file) — confirm the response's `publicUrl` is fetchable (`fetch(publicUrl)` returns 200) and that a second upload with a `.pdf`-typed file also succeeds (confirming no content-type rejection). Confirm the photo upload flow (`/api/uploads/presign`) still works completely unaffected — e.g. via the existing Add Item photo upload UI.

```bash
git add server/api/uploads/presign-document.post.ts app/composables/useUploadDocument.ts
git commit -m "Add presign-document endpoint and useUploadDocument composable"
```

---

## Task 3: Item Detail — Documents box, upload, Open/Download

**Goal:** Item Detail shows a "DOCUMENTS" box listing attached files with working Open/Download actions, and an upload control to add more.

**Files:**
- Modify: `app/pages/items/[id].vue`

**Acceptance Criteria:**
- [ ] A new "DOCUMENTS" box (styled like the existing "NOTES" box) appears on the display-mode view, always visible (not conditional on having any yet)
- [ ] Each attached document shows its filename, upload date, an "Open" link (`target="_blank"`) and a "Download" link
- [ ] "Open" navigates to the file's URL in a new tab
- [ ] "Download" fetches the file client-side and forces a save-as with the original filename, regardless of content type
- [ ] An upload control lets the user add one or more documents to the item, matching the existing "Add photo" button's visual style
- [ ] Uploading a document does not require entering edit mode (matches how "Add photo" already works outside edit mode)
- [ ] `npm run typecheck` passes

**Verify:** `npm run typecheck`. Live browser check: attach a document to an existing item, confirm it appears in the Documents box, confirm Open and Download both work correctly for at least 2 different file types.

**Steps:**

- [ ] **Step 1: Add document loading**

In `app/pages/items/[id].vue`, add the composable import and state near the existing `photos` ref:

```ts
const { uploadDocument } = useUploadDocument();
```

Add a `documents` ref next to `photos`:
```ts
const documents = ref<{ id: string; r2_key: string; url: string; filename: string; created_at: string }[]>([]);
```

In `loadItem()`, add a document fetch alongside the existing photo fetch (after the photo query, before the closing of the `try` block):
```ts
    const { data: documentRows, error: documentError } = await client
      .from('item_documents')
      .select('id, r2_key, url, filename, created_at')
      .eq('item_id', itemId)
      .order('created_at', { ascending: true });
    if (documentError) throw documentError;
    documents.value = (documentRows ?? []) as typeof documents.value;
```

- [ ] **Step 2: Add the upload handler and download function**

Add near `handleAddPhoto`:
```ts
const addingDocument = ref(false);

async function handleAddDocument(e: Event) {
  const input = e.target as HTMLInputElement;
  const files = input.files ? Array.from(input.files) : [];
  if (!files.length || !item.value) return;
  addingDocument.value = true;
  saveError.value = '';
  try {
    const rows: { item_id: string; r2_key: string; url: string; filename: string }[] = [];
    for (const file of files) {
      const uploaded = await uploadDocument(file);
      rows.push({ item_id: itemId, r2_key: uploaded.key, url: uploaded.publicUrl, filename: file.name });
    }
    const { error: insertError } = await client.from('item_documents').insert(rows);
    if (insertError) throw insertError;
    await loadItem();
  } catch (e: any) {
    saveError.value = e?.message ?? 'Failed to add document.';
  } finally {
    addingDocument.value = false;
    input.value = '';
  }
}

async function downloadDocument(doc: { url: string; filename: string }) {
  const response = await fetch(doc.url);
  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = doc.filename;
  a.click();
  URL.revokeObjectURL(blobUrl);
}
```

- [ ] **Step 3: Add the template section**

Add a new "DOCUMENTS" box right after the existing NOTES box (which ends with `</div>` right before the enclosing `</template>` for the display-mode `v-if="!editing"` block — find the block starting `<div v-if="item.notes" ...>NOTES...</div>` and insert this immediately after it, still inside the same `<template v-if="!editing">`):

```html
          <div style="background: #fff; border: 1px solid var(--color-navy); margin-top: 14px; padding: 14px 16px">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 7px">
              <div style="font: 500 10px 'JetBrains Mono', monospace; letter-spacing: 0.12em; color: rgba(22,34,76,0.6)">DOCUMENTS</div>
              <label style="border: 1px solid var(--color-navy); cursor: pointer; background: transparent; color: var(--color-navy); padding: 6px 11px; font: 600 10px 'Archivo', sans-serif; letter-spacing: 0.06em; text-transform: uppercase">
                {{ addingDocument ? 'Uploading…' : '+ Add document' }}
                <input type="file" multiple :disabled="addingDocument" style="display: none" @change="handleAddDocument" />
              </label>
            </div>
            <div v-if="documents.length === 0" style="font-size: 12.5px; color: rgba(22,34,76,0.5)">No documents attached yet.</div>
            <div v-for="doc in documents" :key="doc.id" style="display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px dotted rgba(22,34,76,0.3)">
              <span style="flex: 1; font-size: 13px; color: var(--color-navy); overflow: hidden; text-overflow: ellipsis; white-space: nowrap">{{ doc.filename }}</span>
              <span style="font: 400 10px 'JetBrains Mono', monospace; color: rgba(22,34,76,0.5)">{{ doc.created_at.slice(0, 10) }}</span>
              <a :href="doc.url" target="_blank" rel="noopener" style="font: 600 10.5px 'Archivo', sans-serif; letter-spacing: 0.06em; text-transform: uppercase; color: var(--color-navy); text-decoration: underline">Open</a>
              <button type="button" style="border: 0; background: transparent; cursor: pointer; padding: 0; font: 600 10.5px 'Archivo', sans-serif; letter-spacing: 0.06em; text-transform: uppercase; color: var(--color-rust); text-decoration: underline" @click="downloadDocument(doc)">Download</button>
            </div>
          </div>
```

- [ ] **Step 4: Verify and commit**

```bash
npm run typecheck
```
Expected: `ok`.

Live browser check: on an existing item's detail page, click "+ Add document", upload 2 different file types (e.g. a `.pdf` and a `.txt`). Confirm both appear in the Documents box with correct filenames and dates. Click "Open" for each — confirm it opens in a new tab. Click "Download" for each — confirm a file saves with the original filename (check your downloads folder/browser download indicator), for both file types.

```bash
git add "app/pages/items/[id].vue"
git commit -m "Add Documents box, upload, and Open/Download actions to Item Detail"
```

---

## Task 4: Add Item — Documents section

**Goal:** Documents can be attached during item creation, linked to the item right after it's created.

**Files:**
- Modify: `app/pages/items/new.vue`

**Acceptance Criteria:**
- [ ] A compact "Documents" section appears near the Photos strip at the top of the form
- [ ] Selecting files uploads them immediately (matching how photos already work) and lists their filenames
- [ ] On successful item creation, all staged documents are linked to the new item via `item_documents` rows
- [ ] `resetForm()` (used by "Save & add another") clears staged documents
- [ ] `npm run typecheck` passes

**Verify:** `npm run typecheck && npm run build`. Live browser check: create a new item with 2 documents attached, confirm both appear correctly on the resulting Item Detail page's Documents box.

**Steps:**

- [ ] **Step 1: Add state and the upload handler**

In `app/pages/items/new.vue`, add the composable import and state near `stagedPhotos`:

```ts
const { uploadDocument } = useUploadDocument();

const stagedDocuments = ref<{ key: string; publicUrl: string; filename: string }[]>([]);
const uploadingDocument = ref(false);

async function handleDocumentInput(e: Event) {
  const input = e.target as HTMLInputElement;
  const files = input.files ? Array.from(input.files) : [];
  if (!files.length) return;
  uploadingDocument.value = true;
  error.value = '';
  try {
    for (const file of files) {
      const uploaded = await uploadDocument(file);
      stagedDocuments.value.push({ ...uploaded, filename: file.name });
    }
  } catch (e: any) {
    error.value = e?.message ?? 'Document upload failed.';
  } finally {
    uploadingDocument.value = false;
    input.value = '';
  }
}
```

- [ ] **Step 2: Link staged documents after item creation**

In `save()`, after the existing `createItem(...)` call succeeds (it returns the new item's id — check the current code: `createItem` is called but its return value isn't currently captured in `new.vue`; capture it now), insert the staged documents:

```ts
    const newItemId = await createItem(
      selectedCategory.value,
      {
        name: name.value.trim(),
        manufacturerOrClub: manufacturerOrClub.value || null,
        storageLocation: storageLocation.value || null,
        storageNote: storageNote.value || null,
        approxValueUsd: approxValueUsd.value ? Number(approxValueUsd.value) : null,
        valueEstimatedAt: valueEstimatedAt.value || null,
        notes: notes.value || null,
      },
      buildCategoryFieldPayload(CATEGORY_FORM_FIELDS[selectedCategory.value] ?? []),
      stagedPhotos.value,
    );

    if (stagedDocuments.value.length > 0) {
      const client = useNeonClient();
      const { error: docError } = await client.from('item_documents').insert(
        stagedDocuments.value.map((d) => ({
          item_id: newItemId,
          r2_key: d.key,
          url: d.publicUrl,
          filename: d.filename,
        })),
      );
      if (docError) throw docError;
    }
```

(`createItem`'s return type is already `Promise<string>` per `useCreateItem.ts` — capturing it here is new to this file but not a change to the composable itself. Add `const client = useNeonClient();` inside `save()` where shown, since this file doesn't already have a top-level `client` — or hoist it to the top of `<script setup>` alongside the other composable calls if you prefer that style; either is fine, just don't declare it twice.)

- [ ] **Step 3: Clear staged documents on reset**

In `resetForm()`, add:
```ts
  stagedDocuments.value = [];
```

- [ ] **Step 4: Add the template section**

Add a compact Documents strip right after the Photos section (the block you added in the earlier photo-reorganization work, ending in `</div>` before `<!-- Section 1: General -->`):

```html
    <!-- Documents -->
    <div style="background: #fff; border: 1px solid var(--color-navy); margin-bottom: 20px; padding: 16px">
      <div style="display: flex; gap: 10px; align-items: center">
        <span style="font: 500 10px 'JetBrains Mono', monospace; letter-spacing: 0.1em; color: rgba(22,34,76,0.7)">DOCUMENTS</span>
        <span style="flex: 1; font-size: 12.5px; color: rgba(22,34,76,0.65)">
          {{ uploadingDocument ? 'Uploading…' : stagedDocuments.length ? stagedDocuments.map((d) => d.filename).join(', ') : 'Manuals, receipts, certificates — optional.' }}
        </span>
        <label style="border: 1px solid var(--color-navy); background: transparent; cursor: pointer; padding: 7px 12px; font: 600 10.5px 'Archivo', sans-serif; letter-spacing: 0.08em; text-transform: uppercase">
          Browse files
          <input type="file" multiple :disabled="uploadingDocument" style="display: none" @change="handleDocumentInput" />
        </label>
      </div>
    </div>
```

- [ ] **Step 5: Verify and commit**

```bash
npm run typecheck && npm run build
```
Expected: both pass with 0 errors.

Live browser check: create a new item, attach 1-2 documents via the new Documents strip, submit. Confirm the resulting Item Detail page's Documents box shows both files correctly, and both Open/Download work.

```bash
git add app/pages/items/new.vue
git commit -m "Add Documents section to Add Item form"
```

---

## Task 5: End-to-end live verification

**USER-ORDERED GATE — NON-SKIPPABLE.** This project requires live verification of every shipped feature before merge, established across every prior phase without exception. Close only after an actual browser walkthrough has been run, with real captured output — not a code-only review.

**Goal:** Prove document attachments work correctly end-to-end against live infrastructure, with no regression to the existing photo-upload feature or any other page.

**Files:** none (verification only)

**Acceptance Criteria:**
- [ ] A document attached during Add Item creation appears correctly on the resulting Item Detail page
- [ ] A document attached directly on an existing item's detail page appears correctly
- [ ] Open works correctly for at least 2 different file types
- [ ] Download forces a correct save-as (original filename) for the same 2 file types
- [ ] RLS correctly scopes documents — an item with no documents shows the correct empty state
- [ ] The existing photo-upload feature (Add Item and Item Detail) is completely unaffected
- [ ] No regression to Browse, Dashboard, Storage, Search, Motors table
- [ ] `npm run typecheck && npm run build` both pass

**Verify:** manual UI walkthrough covering both attachment points, both actions, and a regression spot-check across the rest of the app; `npm run typecheck && npm run build`.

```json:metadata
{"files": [], "verifyCommand": "manual UI walkthrough; npm run typecheck && npm run build", "acceptanceCriteria": ["add-item attachment works", "item-detail attachment works", "open works for 2+ file types", "download forces correct save-as for 2+ file types", "RLS/empty-state correct", "photo upload unaffected", "no regression elsewhere", "typecheck and build pass"], "modelTier": "standard", "userGate": true, "tags": ["user-gate"]}
```
