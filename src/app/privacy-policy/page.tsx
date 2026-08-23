import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Read the Privacy Policy for Flight School Finder.",
  alternates: { canonical: "/privacy-policy" },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="pb-20">
      <PageHero size="prose" title="Privacy Policy" eyebrow="Last updated: March 3, 2026" />

      <Container size="prose" className="space-y-10 py-14 leading-relaxed text-muted">
        <div className="space-y-4">
          <h2 className="font-display text-2xl font-bold tracking-tight text-ink">1. Information We Collect</h2>
          <p>
            When you create an account we collect your name, email address, and phone number. When you submit a flight school listing or review, we collect the content of that submission along with metadata such as the date and time of submission.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="font-display text-2xl font-bold tracking-tight text-ink">2. How We Use Your Information</h2>
          <p>
            We use the information we collect to operate and improve the Service, communicate with you about your account and submissions, and send you occasional updates about Flight School Finder. We do not sell your personal information to third parties.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="font-display text-2xl font-bold tracking-tight text-ink">3. Cookies and Tracking</h2>
          <p>
            We use cookies and similar tracking technologies to maintain your session, remember your preferences, and analyze how the Service is used. You can control cookies through your browser settings.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="font-display text-2xl font-bold tracking-tight text-ink">4. Data Sharing</h2>
          <p>
            We may share your information with trusted service providers who assist us in operating the Service (such as hosting and analytics providers), subject to confidentiality agreements. We may also disclose your information when required by law.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="font-display text-2xl font-bold tracking-tight text-ink">5. Data Retention</h2>
          <p>
            We retain your personal information for as long as your account is active or as needed to provide the Service. You may request deletion of your account and associated data by contacting us.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="font-display text-2xl font-bold tracking-tight text-ink">6. Security</h2>
          <p>
            We take reasonable measures to protect your personal information from unauthorized access, disclosure, or destruction. However, no internet transmission is completely secure and we cannot guarantee absolute security.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="font-display text-2xl font-bold tracking-tight text-ink">7. Children&apos;s Privacy</h2>
          <p>
            The Service is not directed to children under 13. We do not knowingly collect personal information from children under 13. If you believe we have inadvertently collected such information, please contact us so we can delete it.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="font-display text-2xl font-bold tracking-tight text-ink">8. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new policy on this page with an updated effective date.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="font-display text-2xl font-bold tracking-tight text-ink">9. Contact</h2>
          <p>
            If you have questions about this Privacy Policy, please contact us at{" "}
            <a href="mailto:info@rightruddermarketing.com" className="font-semibold text-accent-ink hover:underline">
              info@rightruddermarketing.com
            </a>
            .
          </p>
        </div>
      </Container>
    </div>
  );
}
