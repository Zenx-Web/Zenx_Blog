export const metadata = {
  title: 'Privacy Policy - Zenx Blog',
  description: 'Learn how Zenx Blog collects, uses, and protects your personal information. GDPR compliant privacy policy.',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">Privacy Policy</h1>
        <p className="mt-4 text-sm text-slate-500">Effective Date: November 3, 2025</p>
        <p className="mt-2 text-sm text-slate-500">Last Updated: November 3, 2025</p>

        <div className="mt-8 space-y-8 text-slate-700 leading-relaxed">
          {/* Introduction */}
          <section>
            <p className="text-base">
              Welcome to Zenx Blog (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We are committed to protecting your privacy 
              and ensuring the security of your personal information. This Privacy Policy explains how we collect, 
              use, disclose, and safeguard your information when you visit our website <strong>imzenx.in</strong> and 
              use our services.
            </p>
            <p className="mt-3 text-base">
              By accessing or using Zenx Blog, you agree to this Privacy Policy. If you do not agree with our 
              policies and practices, please do not use our services.
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-900">1. Information We Collect</h2>
            
            <h3 className="mt-4 text-xl font-semibold text-slate-800">1.1 Personal Information</h3>
            <p className="mt-3">
              When you create an account or subscribe to our newsletter, we collect:
            </p>
            <ul className="mt-2 ml-6 list-disc space-y-1">
              <li><strong>Email address</strong> - Required for account creation and communications</li>
              <li><strong>Name</strong> - Display name for your profile</li>
              <li><strong>Authentication data</strong> - Login credentials or OAuth tokens (Google)</li>
              <li><strong>Profile information</strong> - Bio, preferences, and settings you choose to provide</li>
            </ul>

            <h3 className="mt-4 text-xl font-semibold text-slate-800">1.2 Automatically Collected Information</h3>
            <p className="mt-3">
              When you visit our website, we automatically collect:
            </p>
            <ul className="mt-2 ml-6 list-disc space-y-1">
              <li><strong>Device information</strong> - IP address, browser type, operating system</li>
              <li><strong>Usage data</strong> - Pages viewed, time spent, links clicked, reading history</li>
              <li><strong>Cookies and tracking technologies</strong> - Session data, preferences, analytics</li>
              <li><strong>Referral information</strong> - How you found our website</li>
            </ul>

            <h3 className="mt-4 text-xl font-semibold text-slate-800">1.3 AI-Generated Content Information</h3>
            <p className="mt-3">
              Zenx Blog uses artificial intelligence (AI) technologies including ChatGPT and Google Gemini to 
              generate content. When you interact with our content, we may collect data about your engagement 
              to improve our AI content generation algorithms.
            </p>
          </section>

          {/* How We Use Your Information */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-900">2. How We Use Your Information</h2>
            <p className="mt-3">
              We use the collected information for the following purposes:
            </p>
            <ul className="mt-2 ml-6 list-disc space-y-2">
              <li><strong>Account Management</strong> - Create and manage your user account</li>
              <li><strong>Content Delivery</strong> - Provide personalized blog content and recommendations</li>
              <li><strong>Email Communications</strong> - Send newsletters, blog updates, and notifications (with your consent)</li>
              <li><strong>Analytics</strong> - Understand user behavior and improve our services</li>
              <li><strong>Security</strong> - Detect and prevent fraud, abuse, and security incidents</li>
              <li><strong>Legal Compliance</strong> - Comply with applicable laws and regulations</li>
              <li><strong>Advertising</strong> - Display relevant advertisements through Google AdSense</li>
            </ul>
          </section>

          {/* Third-Party Services and Disclosure */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-900">3. Third-Party Services and Disclosure</h2>
            
            <h3 className="mt-4 text-xl font-semibold text-slate-800">3.1 Service Providers</h3>
            <p className="mt-3">
              We share your information with trusted third-party service providers:
            </p>
            <ul className="mt-2 ml-6 list-disc space-y-2">
              <li><strong>Supabase</strong> - Database, authentication, and file storage services</li>
              <li><strong>Vercel</strong> - Website hosting and deployment</li>
              <li><strong>Resend</strong> - Email delivery service for newsletters and notifications</li>
              <li><strong>OpenAI (ChatGPT)</strong> - AI content generation</li>
              <li><strong>Google Gemini</strong> - AI content generation</li>
              <li><strong>Google AdSense</strong> - Advertising services</li>
              <li><strong>hCaptcha</strong> - Bot protection and security</li>
            </ul>

            <h3 className="mt-4 text-xl font-semibold text-slate-800">3.2 Google AdSense</h3>
            <p className="mt-3">
              We use Google AdSense to display advertisements on our website. Google uses cookies to serve ads 
              based on your prior visits to our website or other websites. You can opt out of personalized 
              advertising by visiting <a href="https://www.google.com/settings/ads" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Google Ads Settings</a>.
            </p>

            <h3 className="mt-4 text-xl font-semibold text-slate-800">3.3 Analytics</h3>
            <p className="mt-3">
              We may use analytics services to collect and analyze usage data. These services may use cookies 
              and similar technologies to track your activity across different websites.
            </p>

            <h3 className="mt-4 text-xl font-semibold text-slate-800">3.4 Legal Requirements</h3>
            <p className="mt-3">
              We may disclose your information if required by law, court order, or governmental request, or 
              to protect our rights, property, or safety, or that of our users or the public.
            </p>
          </section>

          {/* Cookies and Tracking Technologies */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-900">4. Cookies and Tracking Technologies</h2>
            <p className="mt-3">
              We use cookies and similar tracking technologies to:
            </p>
            <ul className="mt-2 ml-6 list-disc space-y-1">
              <li>Maintain your session and keep you logged in</li>
              <li>Remember your preferences and settings</li>
              <li>Analyze website traffic and user behavior</li>
              <li>Deliver personalized content and advertisements</li>
              <li>Prevent fraud and enhance security</li>
            </ul>
            <p className="mt-3">
              You can control cookies through your browser settings. However, disabling cookies may affect 
              the functionality of our website.
            </p>
          </section>

          {/* Data Security */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-900">5. Data Security</h2>
            <p className="mt-3">
              We implement appropriate technical and organizational security measures to protect your personal 
              information against unauthorized access, alteration, disclosure, or destruction. These measures include:
            </p>
            <ul className="mt-2 ml-6 list-disc space-y-1">
              <li>Encryption of data in transit and at rest</li>
              <li>Secure authentication protocols (OAuth 2.0)</li>
              <li>Regular security audits and updates</li>
              <li>Access controls and authentication requirements</li>
              <li>CAPTCHA protection against automated attacks</li>
            </ul>
            <p className="mt-3">
              However, no method of transmission over the internet or electronic storage is 100% secure. 
              While we strive to protect your personal information, we cannot guarantee absolute security.
            </p>
          </section>

          {/* Your Rights and Choices */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-900">6. Your Rights and Choices</h2>
            
            <h3 className="mt-4 text-xl font-semibold text-slate-800">6.1 Access and Update</h3>
            <p className="mt-3">
              You can access and update your personal information through your account dashboard at any time.
            </p>

            <h3 className="mt-4 text-xl font-semibold text-slate-800">6.2 Email Preferences</h3>
            <p className="mt-3">
              You can unsubscribe from marketing emails at any time by clicking the &quot;Unsubscribe&quot; link 
              in any email we send you, or by updating your preferences in your account settings.
            </p>

            <h3 className="mt-4 text-xl font-semibold text-slate-800">6.3 Data Deletion</h3>
            <p className="mt-3">
              You have the right to request deletion of your personal information. To delete your account 
              and data, please contact us at <a href="mailto:privacy@imzenx.in" className="text-blue-600 hover:underline">privacy@imzenx.in</a>. 
              We will process your request within 30 days.
            </p>

            <h3 className="mt-4 text-xl font-semibold text-slate-800">6.4 Data Portability (GDPR)</h3>
            <p className="mt-3">
              If you are located in the European Economic Area (EEA), you have the right to request a copy 
              of your personal data in a structured, commonly used, and machine-readable format.
            </p>

            <h3 className="mt-4 text-xl font-semibold text-slate-800">6.5 Right to Object</h3>
            <p className="mt-3">
              You have the right to object to certain processing of your personal information, including 
              processing for direct marketing purposes.
            </p>
          </section>

          {/* Children's Privacy */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-900">7. Children&apos;s Privacy</h2>
            <p className="mt-3">
              Our services are not directed to children under the age of 13. We do not knowingly collect 
              personal information from children under 13. If you are a parent or guardian and believe your 
              child has provided us with personal information, please contact us, and we will delete such 
              information from our systems.
            </p>
          </section>

          {/* International Data Transfers */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-900">8. International Data Transfers</h2>
            <p className="mt-3">
              Your information may be transferred to and maintained on servers located outside of your state, 
              province, country, or other governmental jurisdiction where data protection laws may differ. 
              By using our services, you consent to the transfer of your information to these locations.
            </p>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-900">9. Data Retention</h2>
            <p className="mt-3">
              We retain your personal information for as long as necessary to provide our services, comply 
              with legal obligations, resolve disputes, and enforce our agreements. When you delete your 
              account, we will delete or anonymize your personal information within 30 days, except where 
              we are required to retain it for legal purposes.
            </p>
          </section>

          {/* Changes to Privacy Policy */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-900">10. Changes to This Privacy Policy</h2>
            <p className="mt-3">
              We may update this Privacy Policy from time to time to reflect changes in our practices or 
              for legal, operational, or regulatory reasons. We will notify you of any material changes by 
              posting the new Privacy Policy on this page and updating the &quot;Last Updated&quot; date at the top.
            </p>
            <p className="mt-3">
              We encourage you to review this Privacy Policy periodically. Your continued use of our services 
              after changes are posted constitutes your acceptance of the updated policy.
            </p>
          </section>

          {/* Contact Information */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-900">11. Contact Us</h2>
            <p className="mt-3">
              If you have any questions, concerns, or requests regarding this Privacy Policy or our data 
              practices, please contact us:
            </p>
            <div className="mt-4 rounded-lg bg-slate-50 p-6">
              <p className="font-semibold text-slate-900">Zenx Blog</p>
              <p className="mt-2">Email: <a href="mailto:privacy@imzenx.in" className="text-blue-600 hover:underline">privacy@imzenx.in</a></p>
              <p className="mt-1">Website: <a href="https://imzenx.in" className="text-blue-600 hover:underline">https://imzenx.in</a></p>
              <p className="mt-1">Support: <a href="mailto:support@imzenx.in" className="text-blue-600 hover:underline">support@imzenx.in</a></p>
            </div>
          </section>

          {/* GDPR Compliance Statement */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-900">12. GDPR Compliance</h2>
            <p className="mt-3">
              For users in the European Economic Area (EEA), we comply with the General Data Protection 
              Regulation (GDPR). Your rights under GDPR include:
            </p>
            <ul className="mt-2 ml-6 list-disc space-y-1">
              <li>Right to access your personal data</li>
              <li>Right to rectification of inaccurate data</li>
              <li>Right to erasure (&quot;right to be forgotten&quot;)</li>
              <li>Right to restrict processing</li>
              <li>Right to data portability</li>
              <li>Right to object to processing</li>
              <li>Right to withdraw consent at any time</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, please contact us at <a href="mailto:privacy@imzenx.in" className="text-blue-600 hover:underline">privacy@imzenx.in</a>.
            </p>
          </section>

          {/* AI Content Disclosure */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-900">13. AI-Generated Content Disclosure</h2>
            <p className="mt-3">
              Zenx Blog uses artificial intelligence (AI) technologies, including OpenAI&apos;s ChatGPT and 
              Google&apos;s Gemini, to generate blog content. This AI-generated content is reviewed and edited 
              by our team to ensure quality and accuracy. By using our services, you acknowledge that:
            </p>
            <ul className="mt-2 ml-6 list-disc space-y-1">
              <li>Some content on our website may be AI-generated</li>
              <li>AI-generated content is provided for informational purposes only</li>
              <li>We strive for accuracy but cannot guarantee perfection in AI-generated content</li>
              <li>Your interactions with our content may be used to improve AI algorithms</li>
            </ul>
          </section>

          {/* Footer */}
          <section className="border-t border-slate-200 pt-6 mt-12">
            <p className="text-sm text-slate-500">
              This Privacy Policy is effective as of November 3, 2025. By using Zenx Blog, you acknowledge 
              that you have read, understood, and agree to be bound by this Privacy Policy.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
