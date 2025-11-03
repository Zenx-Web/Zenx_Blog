export const metadata = {
  title: 'Contact Zenx Blog',
  description: 'Get in touch with the Zenx Blog team.'
}

export default function ContactPage() {
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">Contact us</h1>
        <p className="mt-4 text-lg text-slate-600">
          We love hearing from readers, creators, and partners. Choose the channel that best fits
          your request and we will follow up within two business days.
        </p>
        <div className="mt-10 grid gap-8 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-xl font-semibold text-slate-900">General enquiries</h2>
            <p className="mt-2 text-sm text-slate-600">
              Questions about the site, story tips, or feedback on coverage.
            </p>
            <p className="mt-4 text-sm text-slate-800">
              Email: <a href="mailto:hello@imzenx.in" className="text-blue-600">hello@imzenx.in</a>
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-xl font-semibold text-slate-900">Partnerships</h2>
            <p className="mt-2 text-sm text-slate-600">
              Collaborations, sponsored content, or advertising opportunities.
            </p>
            <p className="mt-4 text-sm text-slate-800">
              Email: <a href="mailto:partners@imzenx.in" className="text-blue-600">partners@imzenx.in</a>
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-xl font-semibold text-slate-900">Support</h2>
            <p className="mt-2 text-sm text-slate-600">
              Trouble signing in or managing your account? Our support team can help.
            </p>
            <p className="mt-4 text-sm text-slate-800">
              Email: <a href="mailto:support@imzenx.in" className="text-blue-600">support@imzenx.in</a>
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-xl font-semibold text-slate-900">Follow Zenx</h2>
            <ul className="mt-2 space-y-2 text-sm text-slate-600">
              <li><a href="https://x.com/imzenx" target="_blank" rel="noopener" className="text-blue-600">X (Twitter)</a></li>
              <li><a href="https://instagram.com/imzenx" target="_blank" rel="noopener" className="text-blue-600">Instagram</a></li>
              <li><a href="https://www.linkedin.com/company/imzenx" target="_blank" rel="noopener" className="text-blue-600">LinkedIn</a></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
