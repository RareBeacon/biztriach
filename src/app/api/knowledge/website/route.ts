export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { crawlWebsite } from "@/lib/knowledgeImporters";
import { splitTextIntoChunks, generateEmbeddingsBatch } from "@/lib/rag";
import { COL, findDocs, createDoc, updateDocData, getDoc, createManyDocs } from "@/lib/firestore";

export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sources = await findDocs(COL.websiteSources, {
    where: [["organizationId", "==", user.organizationId]],
    orderBy: [["createdAt", "desc"]],
  });
  return NextResponse.json(sources);
}

export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { url, chatbotId, autoSync } = await req.json();
    if (!url) return NextResponse.json({ error: "URL required" }, { status: 400 });

    // Validate URL
    try { new URL(url); } catch { return NextResponse.json({ error: "Invalid URL" }, { status: 400 }); }

    const source = await createDoc(COL.websiteSources, {
      organizationId: user.organizationId,
      url,
      status: "CRAWLING",
      autoSync: autoSync || false,
      pagesCrawled: 0,
      lastSyncedAt: null,
      syncInterval: null,
    });

    // Background crawl (MVP: synchronous for simplicity)
    try {
      const pages = await crawlWebsite(url, 10);

      // Find chatbot for org
      let targetChatbotId = chatbotId;
      if (!targetChatbotId) {
        const chatbots = await findDocs(COL.chatbots, {
          where: [["organizationId", "==", user.organizationId]],
          limit: 1,
        });
        targetChatbotId = chatbots[0]?.id;
      }

      if (targetChatbotId && pages.length > 0) {
        for (const page of pages) {
          const doc = await createDoc(COL.documents, {
            title: page.title || `Website: ${page.url}`,
            organizationId: user.organizationId,
            chatbotId: targetChatbotId,
            fileType: "url",
            sourceType: "website",
            sourceUrl: page.url,
            status: "PROCESSING",
            size: page.content.length,
            chunkCount: 0,
          });

          const chunks = splitTextIntoChunks(page.content);
          const embeddings = await generateEmbeddingsBatch(chunks.map(c => c.content));

          const chunksData = chunks.map((chunk, i) => ({
            documentId: doc.id,
            content: chunk.content,
            pageNumber: chunk.pageNumber,
            embedding: JSON.stringify(embeddings[i] || []),
            tokenCount: chunk.content.length
          }));

          if (chunksData.length > 0) {
            await createManyDocs(COL.documentChunks, chunksData);
          }

          await updateDocData(COL.documents, doc.id, { status: "TRAINED", chunkCount: chunks.length });
        }

        await updateDocData(COL.websiteSources, source.id, {
          status: "TRAINED",
          pagesCrawled: pages.length,
          lastSyncedAt: new Date().toISOString(),
        });
      } else {
        await updateDocData(COL.websiteSources, source.id, { status: "TRAINED", pagesCrawled: pages.length });
      }

      const updated = await getDoc(COL.websiteSources, source.id);
      return NextResponse.json(updated);

    } catch (crawlError) {
      console.error("Crawl failed", crawlError);
      await updateDocData(COL.websiteSources, source.id, { status: "FAILED" });
      return NextResponse.json({ error: (crawlError as Error).message }, { status: 500 });
    }

  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to add website source" }, { status: 500 });
  }
}
