import { LegalShell } from "@/components/LegalShell";

export const metadata = {
  title: "Terms of Service — Biztriach",
  description: "The terms that govern your use of Biztriach.",
};

export default function TermsPage() {
  return (
    <LegalShell title="Terms of Service">
      <p>
        These Terms of Service (&quot;Terms&quot;) govern your use of Biztriach, operated by Philip Opeyemi
        (the &quot;Service&quot;). By creating an account or using the Service, you agree to these Terms.
      </p>

      <div>
        <h2>1. The Service</h2>
        <p>
          Biztriach provides AI agents that reply to your customers on WhatsApp and your website,
          trained on content you provide, along with related business tools (lead capture, sales and
          expense logging, reports). The Service connects to the WhatsApp Business Platform operated
          by Meta; you must also comply with Meta&apos;s and WhatsApp&apos;s terms and policies for your
          connected numbers.
        </p>
      </div>

      <div>
        <h2>2. Your account</h2>
        <ul>
          <li>You must provide accurate information and keep your credentials secure.</li>
          <li>You are responsible for the content you upload and the messages sent through your connected numbers.</li>
          <li>Accounts are approved or suspended at our discretion where necessary to prevent abuse.</li>
        </ul>
      </div>

      <div>
        <h2>3. Acceptable use</h2>
        <p>You agree not to use the Service to:</p>
        <ul>
          <li>send spam, unsolicited marketing, or content that violates applicable law;</li>
          <li>harass, defraud, or deceive anyone;</li>
          <li>infringe intellectual-property or privacy rights;</li>
          <li>attempt to disrupt, overload, or reverse-engineer the Service.</li>
        </ul>
      </div>

      <div>
        <h2>4. AI disclaimer</h2>
        <p>
          AI-generated replies are produced automatically and may occasionally be inaccurate or
          incomplete. The Service is a tool to assist your business; it does not provide legal,
          financial, or professional advice, and you remain responsible for reviewing and correcting
          its output where it matters to your business.
        </p>
      </div>

      <div>
        <h2>5. Fees</h2>
        <p>
          The Service may offer free and paid tiers. Where a paid tier applies, fees and billing terms
          will be shown before you are charged. Your own WhatsApp messaging charges (if any) are billed
          to you by Meta separately.
        </p>
      </div>

      <div>
        <h2>6. Availability &amp; liability</h2>
        <p>
          The Service is provided &quot;as is&quot; without warranties of any kind. We aim for high availability
          but do not guarantee uninterrupted service. To the maximum extent permitted by law, our
          liability for any claim relating to the Service is limited to the amount you paid us in the
          12 months before the claim.
        </p>
      </div>

      <div>
        <h2>7. Termination &amp; changes</h2>
        <p>
          You may stop using the Service and delete your account at any time. We may suspend or
          terminate accounts that violate these Terms. We may update these Terms; material changes
          will be communicated through the Service. Continued use after changes means acceptance.
        </p>
      </div>

      <div>
        <h2>8. Contact</h2>
        <p>
          Questions? Email{" "}
          <a href="mailto:ogungboyeopeyemiphilip@gmail.com">ogungboyeopeyemiphilip@gmail.com</a>.
        </p>
      </div>
    </LegalShell>
  );
}
