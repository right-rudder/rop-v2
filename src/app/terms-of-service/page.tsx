import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service – Flight School Finder",
  description: "Read the Terms of Service for Flight School Finder.",
};

export default function TermsOfServicePage() {
  return (
    <div className="pb-20">
      <section className="bg-linear-to-br from-slate-950 via-blue-950 to-indigo-900 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Terms of Service
          </h1>
          <p className="text-xl opacity-90">Last updated: March 3, 2026</p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-10 text-slate-700 dark:text-slate-300">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">1. Acceptance of Terms</h2>
          <p>
            By accessing or using Flight School Finder (&ldquo;the Service&rdquo;), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">2. Use of the Service</h2>
          <p>
            Flight School Finder is a directory of USA-based flight schools intended to help prospective students find pilot training programs. You agree to use the Service only for lawful purposes and in a manner that does not infringe the rights of others.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">3. User Accounts</h2>
          <p>
            When you create an account, you are responsible for maintaining the confidentiality of your credentials and for all activity that occurs under your account. You agree to provide accurate and complete information when registering.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">4. Listings and Reviews</h2>
          <p>
            Users may submit flight school listings and reviews. All submissions are subject to review and approval by our team. We reserve the right to remove or modify any listing or review that violates these terms or that we deem inappropriate.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">5. Intellectual Property</h2>
          <p>
            All content on Flight School Finder, including text, graphics, and code, is the property of Flight School Finder or its content suppliers and is protected by applicable intellectual property laws.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">6. Disclaimer of Warranties</h2>
          <p>
            The Service is provided &ldquo;as is&rdquo; without warranties of any kind, either express or implied. We do not warrant that the Service will be uninterrupted, error-free, or free of viruses or other harmful components.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">7. Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by law, Flight School Finder shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">8. Changes to Terms</h2>
          <p>
            We reserve the right to update these Terms of Service at any time. Continued use of the Service after changes are posted constitutes your acceptance of the revised terms.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">9. Contact</h2>
          <p>
            If you have questions about these Terms of Service, please contact us at{" "}
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
