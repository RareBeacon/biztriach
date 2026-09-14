export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { COL, getDoc, deleteDocById, deleteManyDocs } from "@/lib/firestore";
import { storageBucket } from "@/lib/firebase";

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const user = await getUserFromRequest(req);
  if (!user || !user.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const documentId = params.id;

  try {
    // Verify document belongs to chatbot owned by user's organization
    const document = await getDoc<any>(COL.documents, documentId);
    if (!document) {
      return NextResponse.json({ error: "Document not found or access denied" }, { status: 404 });
    }

    // Two-hop ownership check: document -> chatbot -> organization
    if (document.chatbotId) {
      const chatbot = await getDoc<any>(COL.chatbots, document.chatbotId);
      if (!chatbot || chatbot.organizationId !== user.organizationId) {
        return NextResponse.json({ error: "Document not found or access denied" }, { status: 404 });
      }
    } else if (document.organizationId !== user.organizationId) {
      // Org-wide knowledge docs
      return NextResponse.json({ error: "Document not found or access denied" }, { status: 404 });
    }

    // Cascade delete chunks (replaces Prisma onDelete: Cascade)
    await deleteManyDocs(COL.documentChunks, { where: [["documentId", "==", documentId]] });

    // Remove the original file from Firebase Storage (best-effort)
    if (document.storagePath) {
      try {
        const bucket = storageBucket();
        if (bucket) await bucket.file(document.storagePath).delete({ ignoreNotFound: true });
      } catch (e) {
        console.warn("[STORAGE] Failed to delete original file:", e);
      }
    }

    await deleteDocById(COL.documents, documentId);

    return NextResponse.json({ success: true, message: "Document deleted successfully" });
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
