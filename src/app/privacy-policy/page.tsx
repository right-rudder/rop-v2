import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy – Flight School Finder",
  description: "Read the Privacy Policy for Flight School Finder.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="pb-20">
      <section className="bg-linear-to-br from-slate-950 via-blue-950 to-indigo-900 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Privacy Policy
          </h1>
          <p className="text-xl opacity-90">Last updated: March 3, 2026</p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-10 text-slate-700 dark:text-slate-300">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">1. Information We Collect</h2>
          <p>
            When you create an account we collect your name, email address, and phone number. When you submit a flight school listing or review, we collect the content of that submission along with metadata such as the date and time of submission.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">2. How We Use Your Information</h2>
          <p>
            We use the information we collect to operate and improve the Service, communicate with you about your account and submissions, and send you occasional updates about Flight School Finder. We do not sell your personal information to third parties.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">3. Cookies and Tracking</h2>
          <p>
            We use cookies and similar tracking technologies to maintain your session, remember your preferences, and analyze how the Service is used. You can control cookies through your browser settings.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">4. Data Sharing</h2>
          <p>
            We may share your information with trusted service providers who assist us in operating the Service (such as hosting and analytics providers), subject to confidentiality agreements. We may also disclose your information when required by law.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">5. Data Retention</h2>
          <p>
            We retain your personal information for as long as your account is active or as needed to provide the Service. You may request deletion of your account and associated data by contacting us.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">6. Security</h2>
          <p>
            We take reasonable measures to protect your personal information from unauthorized access, disclosure, or destruction. However, no internet transmission is completely secure and we cannot guarantee absolute security.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">7. Children&apos;s Privacy</h2>
          <p>
            The Service is not directed to children under 13. We do not knowingly collect personal information from children under 13. If you believe we have inadvertently collected such information, please contact us so we can delete it.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">8. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new policy on this page with an updated effective date.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">9. Contact</h2>
          <p>
            If you have questions about this Privacy Policy, please contact us at{" "}
            <a href="mailto:info@rightruddermarketing.com" className="text-blue-700 dark:text-blue-400 hover:underline">
              info@rightruddermarketing.com
            </a>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
