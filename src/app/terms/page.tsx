export const metadata = {
  title: 'Zenx Blog Terms of Service',
  description: 'Review the rules that govern your use of Zenx Blog.'
}

export default function TermsPage() {
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">Terms of Service</h1>
        <p className="mt-4 text-sm text-slate-500">Updated: October 17, 2025</p>
        <div className="mt-8 space-y-8 text-slate-700">
          <section>
            <h2 className="text-2xl font-semibold text-slate-900">1. Acceptance of terms</h2>
            <p className="mt-3">
              By using Zenx Blog, you agree to these terms and our privacy policy. If you do not agree,
              please discontinue using the service.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-slate-900">2. Use of content</h2>
            <p className="mt-3">
              All articles, graphics, and data are provided for personal use. Do not copy, resell, or
              redistribute Zenx content without written permission.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-slate-900">3. Accounts & security</h2>
            <p className="mt-3">
              You are responsible for maintaining the confidentiality of your login credentials. Notify
              us immediately if you suspect unauthorised access to your account.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-slate-900">4. Limitations</h2>
            <p className="mt-3">
              Zenx Blog is provided &ldquo;as is&rdquo; without warranties. We are not liable for any damages
              arising from your use of the site. Some jurisdictions do not allow limitations of
              liability, so these limitations may not apply to you.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-slate-900">5. Changes</h2>
            <p className="mt-3">
              We may update these terms from time to time. Significant changes will be announced on the
              site. Continued use after changes constitutes acceptance of the updated terms.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-slate-900">6. Contact</h2>
            <p className="mt-3">
              Questions about these terms? Email <a href="mailto:legal@imzenx.in" className="text-blue-600">legal@imzenx.in</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
