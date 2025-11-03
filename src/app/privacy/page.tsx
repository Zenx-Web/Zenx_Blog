export const metadata = {
  title: 'Zenx Blog Privacy Policy',
  description: 'Understand how Zenx Blog collects, uses, and protects your data.'
}

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">Privacy Policy</h1>
        <p className="mt-4 text-sm text-slate-500">Updated: October 17, 2025</p>
        <div className="mt-8 space-y-8 text-slate-700">
          <section>
            <h2 className="text-2xl font-semibold text-slate-900">1. Information we collect</h2>
            <p className="mt-3">
              When you create a Zenx account, we store your email address, display name, and any
              preferences you choose to share. We also collect analytics about how you interact with
              the site so we can continuously improve the experience.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-slate-900">2. How we use your data</h2>
            <p className="mt-3">
              Your information helps us personalise recommendations, deliver newsletters you opt into,
              and surface the stories most relevant to you. We never sell your personal data.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-slate-900">3. Third-party services</h2>
            <p className="mt-3">
              Zenx integrates with Supabase for authentication, Google Analytics for anonymous usage
              stats, and advertising partners such as Google AdSense. These providers may set cookies
              to deliver their services. You can adjust cookie preferences within your browser.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-slate-900">4. Your choices</h2>
            <p className="mt-3">
              You can update or delete your profile data from the dashboard at any time. If you would
              like to export or erase your account, email <a href="mailto:privacy@imzenx.in" className="text-blue-600">privacy@imzenx.in</a> and we will assist you within 30 days.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-slate-900">5. Contact</h2>
            <p className="mt-3">
              Questions about this policy? Reach out to <a href="mailto:privacy@imzenx.in" className="text-blue-600">privacy@imzenx.in</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
