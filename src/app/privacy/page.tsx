import { LegalShell } from "@/components/LegalShell";

export const metadata = {
  title: "Privacy Policy — Biztriach",
  description: "How Biztriach collects, uses, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy">
      <p>
        This Privacy Policy explains how Biztriach (&quot;we&quot;, &quot;us&quot;), operated by Philip Opeyemi,
        collects, uses, and protects information when you use our platform at biztriach.vercel.app
        (the &quot;Service&quot;). By using the Service, you agree to the practices described here.
      </p>

      <div>
        <h2>1. Data we collect</h2>
        <ul>
          <li><strong>Account data:</strong> your name, email address, organization name, and authentication credentials (managed by Firebase Authentication).</li>
          <li><strong>Business content:</strong> documents, prices, and knowledge-base content you upload to train your AI agent, plus business records you create (sales, expenses, customers, products).</li>
          <li><strong>Conversation data:</strong> messages sent to and from your connected WhatsApp Business number and website chat widget, including customer phone numbers and message content.</li>
          <li><strong>Usage data:</strong> message counts, feature usage, and technical logs needed to operate and secure the Service.</li>
        </ul>
      </div>

      <div>
        <h2>2. How we use your data</h2>
        <ul>
          <li>To operate the Service: connecting your WhatsApp number, generating AI replies, and displaying your dashboard.</li>
          <li>To generate AI responses, your conversation content and trained documents are processed by AI providers (such as OpenAI or Hugging Face) strictly to produce replies for your business.</li>
          <li>To communicate with you about your account, service updates, and support.</li>
        </ul>
      </div>

      <div>
        <h2>3. WhatsApp and Meta</h2>
        <p>
          The Service integrates with the WhatsApp Business Platform operated by Meta. When you connect
          a WhatsApp number, Meta shares your WhatsApp Business Account details and message events with
          the Service so it can reply on your behalf. This use is subject to{" "}
          <a href="https://www.whatsapp.com/legal/terms-of-service" target="_blank" rel="noreferrer">WhatsApp&apos;s Terms</a> and{" "}
          <a href="https://www.facebook.com/privacy/policy" target="_blank" rel="noreferrer">Meta&apos;s Privacy Policy</a>.
          We do not sell your data or your customers&apos; data to anyone.
        </p>
      </div>

      <div>
        <h2>4. Data storage &amp; security</h2>
        <p>
          Data is stored in Google Firebase (Firestore) with access controls, and API credentials you
          provide are stored encrypted. We apply industry-standard practices to protect your data, but
          no system is perfectly secure, and we cannot guarantee absolute security.
        </p>
      </div>

      <div>
        <h2>5. Data retention</h2>
        <p>
          We retain your data while your account is active. If you delete your account or request data
          deletion (see our <a href="/data-deletion">Data Deletion</a> page), your data is removed
          within 30 days, except where retention is required by law.
        </p>
      </div>

      <div>
        <h2>6. Your rights</h2>
        <p>
          You may request access to, correction of, or deletion of your personal data at any time by
          contacting us. If you are in the EU/EEA or other jurisdictions with data-protection law,
          you may also have rights to object to processing, restrict processing, and lodge a complaint
          with a supervisory authority.
        </p>
      </div>

      <div>
        <h2>7. Contact</h2>
        <p>
          Questions about this policy? Email us at{" "}
          <a href="mailto:ogungboyeopeyemiphilip@gmail.com">ogungboyeopeyemiphilip@gmail.com</a>.
        </p>
      </div>
    </LegalShell>
  );
}
