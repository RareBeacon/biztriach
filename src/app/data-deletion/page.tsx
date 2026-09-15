import { LegalShell } from "@/components/LegalShell";

export const metadata = {
  title: "Data Deletion — Biztriach",
  description: "How to request deletion of your Biztriach data.",
};

export default function DataDeletionPage() {
  return (
    <LegalShell title="Data Deletion Instructions">
      <p>
        You can request deletion of some or all of your Biztriach data at any time. Here is exactly
        what happens and how to do it.
      </p>

      <div>
        <h2>What gets deleted</h2>
        <ul>
          <li><strong>Account data:</strong> your profile, organization, and login credentials.</li>
          <li><strong>Conversation data:</strong> WhatsApp and website chat messages stored by the Service.</li>
          <li><strong>Business content:</strong> uploaded documents, knowledge-base chunks, and embeddings; sales, expense, customer, and product records.</li>
          <li><strong>Credentials:</strong> your stored WhatsApp/Meta access tokens and API keys (deleted or revoked).</li>
        </ul>
      </div>

      <div>
        <h2>How to request deletion</h2>
        <p>
          Email <strong>ogungboyeopeyemiphilip@gmail.com</strong> from the email address on your account
          with the subject <strong>&quot;Data Deletion Request&quot;</strong>. Include the name of your organization.
          You will receive confirmation within 48 hours, and the data will be deleted within
          <strong> 30 days</strong>.
        </p>
        <p>
          You may also request deletion of your WhatsApp connection only (keeping your account) —
          just say so in the email.
        </p>
      </div>

      <div>
        <h2>What we keep</h2>
        <p>
          We keep minimal transactional records (e.g., billing receipts) where required by law, and
          we keep abuse-prevention records (e.g., blocked emails) for security purposes. Data already
          processed by AI providers to generate past replies cannot be un-sent, but no ongoing access
          to your content remains after deletion.
        </p>
      </div>

      <div>
        <h2>Meta / WhatsApp users</h2>
        <p>
          If you interacted with a business powered by Biztriach as a customer (for example, you
          chatted with their WhatsApp AI agent) and want your conversation data deleted, email us at
          the address above and we will forward the request to the business, or delete it from our
          systems where we are the processor.
        </p>
      </div>
    </LegalShell>
  );
}
