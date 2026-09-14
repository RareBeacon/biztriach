/**
 * Firestore data-access layer — Prisma-shaped helpers so route code stays concise.
 *
 * Conventions:
 *  - Every model maps 1:1 to a Firestore collection (see COL below).
 *  - Document IDs are UUIDs (crypto.randomUUID), matching the old Prisma ids.
 *  - Dates are stored as ISO-8601 UTC strings: JSON responses are identical to
 *    the Prisma era, and lexicographic ordering == chronological ordering, so
 *    range filters on ISO strings behave like Postgres date filters.
 *  - create/update maintain createdAt/updatedAt automatically.
 */
import { randomUUID } from "crypto";
import {
  Firestore,
  Query,
  CollectionReference,
  DocumentData,
  WhereFilterOp,
} from "firebase-admin/firestore";
import { firestore } from "./firebase";

export type { DocumentData };

/** Collection names (mirrors the old Prisma models). */
export const COL = {
  users: "users",
  organizations: "organizations",
  businessProfiles: "businessProfiles",
  chatbots: "chatbots",
  documents: "documents",
  documentChunks: "documentChunks",
  websiteSources: "websiteSources",
  knowledgeGaps: "knowledgeGaps",
  conversations: "conversations",
  messages: "messages",
  analytics: "analytics",
  products: "products",
  productCategories: "productCategories",
  customers: "customers",
  sales: "sales",
  saleItems: "saleItems",
  expenseCategories: "expenseCategories",
  expenses: "expenses",
  leads: "leads",
  landingPages: "landingPages",
  funnels: "funnels",
  funnelSteps: "funnelSteps",
  emailCampaigns: "emailCampaigns",
  emailLogs: "emailLogs",
  whatsappAccounts: "whatsappAccounts",
  whatsappConversations: "whatsappConversations",
  whatsappMessages: "whatsappMessages",
  apiKeys: "apiKeys",
  platformSettings: "platformSettings",
  announcements: "announcements",
} as const;

export interface QueryOpts {
  where?: Array<[string, WhereFilterOp, any]>;
  orderBy?: Array<[string, "asc" | "desc"]>;
  limit?: number;
  skip?: number;
}

function db(): Firestore {
  return firestore();
}

export function col(name: string): CollectionReference {
  return db().collection(name);
}

/** Generate a fresh UUID (same format Prisma used). */
export function newId(): string {
  return randomUUID();
}

function nowISO(): string {
  return new Date().toISOString();
}

/** Strip server-only fields we never want persisted accidentally. */
function withMeta(data: DocumentData): DocumentData {
  return { ...data, updatedAt: nowISO() };
}

/** Convert a Firestore QuerySnapshot into plain objects. */
function snapToArray<T>(snap: FirebaseFirestore.QuerySnapshot<DocumentData>): T[] {
  return snap.docs.map((d) => ({ ...(d.data() as T), id: d.id }));
}

function applyOpts<T extends DocumentData>(base: CollectionReference, opts?: QueryOpts): Query<T> {
  let q: Query<T> = base as unknown as Query<T>;
  if (opts?.where) {
    for (const [field, op, value] of opts.where) {
      q = q.where(field, op as WhereFilterOp, value);
    }
  }
  if (opts?.orderBy) {
    for (const [field, dir] of opts.orderBy) {
      q = q.orderBy(field, dir);
    }
  }
  if (opts?.limit != null) {
    q = q.limit(opts.limit);
  }
  return q;
}

/** Detect Firestore's "composite index required" precondition errors. */
function isIndexRequiredError(e: any): boolean {
  return (
    e?.code === 5 || // FAILED_PRECONDITION
    e?.codePrefix === "FAILED_PRECONDITION" ||
    /requires an index|FAILED_PRECONDITION/i.test(e?.message || "")
  );
}

/** JS-side predicate matching for a single [field, op, value] filter. */
function matchesFilter(row: any, field: string, op: string, value: any): boolean {
  const v = row[field];
  switch (op) {
    case "==": return v === value;
    case "!=": return v !== value;
    case "in": return Array.isArray(value) && value.includes(v);
    case "array-contains": return Array.isArray(v) && v.includes(value);
    case ">": return v > value;
    case ">=": return v >= value;
    case "<": return v < value;
    case "<=": return v <= value;
    default: return true;
  }
}

function compareValues(a: any, b: any): number {
  if (a === b) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a) < String(b) ? -1 : 1;
}

/** Direct server-side query (composite indexes may be required). */
async function queryDirect<T>(collection: string, opts?: QueryOpts): Promise<T[]> {
  let q: Query<DocumentData> = applyOpts<DocumentData>(col(collection), opts);
  const skip = opts?.skip ?? 0;
  if (skip > 0) {
    q = q.limit((opts?.limit ?? 0) + skip);
  }
  const snap = await q.get();
  const rows = snapToArray<T>(snap);
  return skip > 0 ? rows.slice(skip) : rows;
}

/**
 * Fallback query when Firestore requires a composite index that doesn't exist.
 * Strategy: serve the most selective SINGLE-field equality filter server-side
 * (single-field indexes always exist), then apply any remaining filters,
 * ordering, skip and limit in JavaScript. Safe at SME data scale.
 */
async function queryFallback<T>(collection: string, opts?: QueryOpts): Promise<T[]> {
  const where = opts?.where || [];
  const SCAN_CAP = 5000;

  // Pick one server-side filter: first '==', else first 'in'.
  const eqIdx = where.findIndex(([op]) => op === "==");
  const inIdx = where.findIndex(([op]) => op === "in");
  const primaryIdx = eqIdx >= 0 ? eqIdx : inIdx;

  let rows: any[] | null = null;
  if (primaryIdx >= 0) {
    try {
      const [f, op, v] = where[primaryIdx];
      const q = col(collection).where(f, op as WhereFilterOp, v).limit(SCAN_CAP);
      rows = snapToArray<any>(await q.get());
    } catch {
      rows = null; // single-field filter failed unexpectedly — fall through to scan
    }
  }
  if (rows === null) {
    rows = snapToArray<any>(await col(collection).limit(SCAN_CAP).get());
  }

  // Apply ALL filters in JS (including the primary one — idempotent for ==).
  let filtered = rows.filter((row) => where.every(([f, op, v]) => matchesFilter(row, f, op, v)));

  // Emulate orderBy.
  if (opts?.orderBy?.length) {
    for (const [field, dir] of [...opts.orderBy].reverse()) {
      filtered.sort((a, b) => (dir === "desc" ? -compareValues(a[field], b[field]) : compareValues(a[field], b[field])));
    }
  }

  // Emulate skip/limit.
  const skip = opts?.skip ?? 0;
  if (skip > 0) filtered = filtered.slice(skip);
  if (opts?.limit != null) filtered = filtered.slice(0, opts.limit);

  return filtered as T[];
}

/** SELECT many — like prisma.<model>.findMany({...}) (index-requirement resilient) */
export async function findDocs<T = DocumentData>(
  collection: string,
  opts?: QueryOpts
): Promise<T[]> {
  try {
    return await queryDirect<T>(collection, opts);
  } catch (e) {
    if (isIndexRequiredError(e)) {
      console.warn(
        `[Firestore] Composite index missing for ${collection} — using resilient fallback. ` +
        `Consider creating the index for large datasets.`
      );
      return await queryFallback<T>(collection, opts);
    }
    throw e;
  }
}

/** SELECT one by id — like prisma.<model>.findUnique({ where: { id } }) */
export async function getDoc<T = DocumentData>(
  collection: string,
  id: string
): Promise<T | null> {
  if (!id) return null;
  const snap = await col(collection).doc(id).get();
  if (!snap.exists) return null;
  return { ...(snap.data() as T), id: snap.id };
}

/** SELECT one by field — like findUnique({ where: { <field>: value } }) */
export async function findUniqueBy<T = DocumentData>(
  collection: string,
  field: string,
  value: any
): Promise<T | null> {
  if (value == null) return null;
  const snap = await col(collection).where(field, "==", value).limit(1).get();
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { ...(d.data() as T), id: d.id };
}

/** SELECT one by composite key — like findUnique({ where: { a_x_b } }) (index-resilient) */
export async function findUniqueByComposite<T = DocumentData>(
  collection: string,
  fields: Record<string, any>
): Promise<T | null> {
  const entries = Object.entries(fields).filter(([, v]) => v != null);
  if (!entries.length) return null;
  try {
    let q: Query<DocumentData> = col(collection);
    for (const [f, v] of entries) {
      q = q.where(f, "==", v);
    }
    const snap = await q.limit(1).get();
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { ...(d.data() as T), id: d.id };
  } catch (e) {
    if (isIndexRequiredError(e) && entries.length >= 2) {
      // Serve the first field server-side, match the rest in JS.
      const [f0, v0] = entries[0];
      const rest = entries.slice(1);
      const snap = await col(collection).where(f0, "==", v0).limit(5000).get();
      const hit = snap.docs.find((d) => rest.every(([f, v]) => (d.data() as any)[f] === v));
      return hit ? { ...(hit.data() as T), id: hit.id } : null;
    }
    throw e;
  }
}

/** INSERT — like prisma.<model>.create({ data }) */
export async function createDoc<T = DocumentData>(
  collection: string,
  data: DocumentData,
  id?: string
): Promise<T> {
  const docId = id || (data.id as string) || newId();
  const payload = withMeta({ ...data, id: docId, createdAt: data.createdAt || nowISO() });
  await col(collection).doc(docId).set(payload);
  return payload as T;
}

/** UPDATE — like prisma.<model>.update({ where: { id }, data }) */
export async function updateDocData<T = DocumentData>(
  collection: string,
  id: string,
  patch: DocumentData
): Promise<T | null> {
  const ref = col(collection).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return null;
  // Strip undefined values (Firestore rejects them; Prisma treated them as "no change")
  const clean: DocumentData = {};
  for (const [k, v] of Object.entries(patch)) {
    if (v !== undefined) clean[k] = v;
  }
  const payload = withMeta({ ...clean, id });
  await ref.update(payload);
  const updated = await ref.get();
  return { ...(updated.data() as T), id: updated.id };
}

/** UPSERT-ish — insertMany — like prisma.<model>.createMany({ data }) (batched 500) */
export async function createManyDocs(
  collection: string,
  items: DocumentData[]
): Promise<number> {
  if (!items.length) return 0;
  let written = 0;
  for (let i = 0; i < items.length; i += 450) {
    const batch = db().batch();
    const now = nowISO();
    for (const item of items.slice(i, i + 450)) {
      const docId = (item.id as string) || newId();
      batch.set(col(collection).doc(docId), {
        ...item,
        id: docId,
        createdAt: item.createdAt || now,
        updatedAt: now,
      });
      written++;
    }
    await batch.commit();
  }
  return written;
}

/** DELETE by id — like prisma.<model>.delete({ where: { id } }) */
export async function deleteDocById(collection: string, id: string): Promise<void> {
  await col(collection).doc(id).delete();
}

/** DELETE many by filter — like prisma.<model>.deleteMany({ where }) (batched) */
export async function deleteManyDocs(
  collection: string,
  opts?: QueryOpts
): Promise<number> {
  const rows = await findDocs<{ id: string }>(collection, opts);
  for (let i = 0; i < rows.length; i += 450) {
    const batch = db().batch();
    for (const row of rows.slice(i, i + 450)) {
      batch.delete(col(collection).doc(row.id));
    }
    await batch.commit();
  }
  return rows.length;
}

/** COUNT — like prisma.<model>.count({ where }) (index-requirement resilient) */
export async function countDocs(collection: string, opts?: QueryOpts): Promise<number> {
  try {
    let q: Query<DocumentData> = applyOpts<DocumentData>(col(collection), opts);
    const snap = await q.count().get();
    return snap.data().count;
  } catch (e) {
    if (isIndexRequiredError(e)) {
      const rows = await findDocs(collection, { where: opts?.where, limit: 5000 });
      return rows.length;
    }
    throw e;
  }
}

/**
 * Cascade delete: removes a parent doc plus all child docs that reference it.
 * Replaces Prisma's onDelete: Cascade behaviour.
 * childSpecs: [{ collection, field }] — children are matched where field == parentId.
 */
export async function deleteDocCascade(
  parentCollection: string,
  parentId: string,
  childSpecs: Array<{ collection: string; field: string }>
): Promise<void> {
  // Depth-first: delete grandchildren by recursing on matching child specs is
  // handled by callers passing full specs for every descendant collection.
  for (const spec of childSpecs) {
    await deleteManyDocs(spec.collection, { where: [[spec.field, "==", parentId]] });
  }
  await deleteDocById(parentCollection, parentId);
}

/** Atomic multi-step write — like prisma.$transaction (operations run in a Firestore transaction). */
export async function runTransaction<T>(
  fn: (tx: FirebaseFirestore.Transaction) => Promise<T>
): Promise<T> {
  return db().runTransaction(fn);
}

/** Transaction helpers usable inside runTransaction. */
export const txHelpers = {
  async create(
    tx: FirebaseFirestore.Transaction,
    collection: string,
    data: DocumentData,
    id?: string
  ): Promise<string> {
    const docId = id || (data.id as string) || newId();
    const now = nowISO();
    tx.set(col(collection).doc(docId), {
      ...data,
      id: docId,
      createdAt: data.createdAt || now,
      updatedAt: now,
    });
    return docId;
  },
  get(collection: string, id: string): FirebaseFirestore.DocumentReference {
    return col(collection).doc(id);
  },
};

/** Firestore FieldValue helpers (e.g. FieldValue.increment(1)) for update patches. */
export { FieldValue } from "firebase-admin/firestore";
