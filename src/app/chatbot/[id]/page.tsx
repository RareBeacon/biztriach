import { notFound } from "next/navigation";
import { COL, getDoc } from "@/lib/firestore";
import ChatbotWindow from "@/components/ChatbotWindow";

interface PageProps {
  params: {
    id: string;
  };
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps) {
  const chatbot = await getDoc<{ name: string }>(COL.chatbots, params.id);

  if (!chatbot) {
    return {
      title: "Chatbot Not Found - SupportIQ AI",
    };
  }

  return {
    title: `${chatbot.name} - SupportIQ AI`,
  };
}

export default async function ChatbotPage({ params }: PageProps) {
  const chatbot = await getDoc(COL.chatbots, params.id);

  if (!chatbot) {
    notFound();
  }

  return (
    <div className="w-full h-screen overflow-hidden">
      <ChatbotWindow chatbot={chatbot as any} />
    </div>
  );
}
