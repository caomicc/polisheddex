import { Metadata } from 'next';
import Link from 'next/link';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Hero } from '@/components/ui/Hero';

export const metadata: Metadata = {
  title: 'Privacy Policy | PolishedDex',
  description: 'Privacy policy for PolishedDex - Your Pokémon Polished Crystal companion.',
};

export default function PrivacyPolicy() {
  return (
    <>
      <Hero
        headline="Privacy Policy"
        breadcrumbs={
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/" className="hover:underline">
                    Home
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Privacy Policy</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        }
      />

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Introduction</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              PolishedDex (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy.
              This Privacy Policy explains how we collect, use, and safeguard your information when you visit
              our website at polisheddex.app.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Information We Collect</h2>

            <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">Automatically Collected Information</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              When you visit PolishedDex, we may automatically collect certain information about your device and usage, including:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
              <li>Browser type and version</li>
              <li>Operating system</li>
              <li>Pages visited and time spent on pages</li>
              <li>Referring website addresses</li>
              <li>Anonymous usage statistics</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6 text-gray-800 dark:text-gray-200">Local Storage</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We use browser local storage to save your preferences, such as your Faithful/Polished mode preference.
              This data is stored only on your device and is not transmitted to our servers.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Cookies</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              PolishedDex may use cookies and similar tracking technologies to enhance your browsing experience.
              These cookies help us understand how you use our website and remember your preferences.
              You can control cookie settings through your browser preferences.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Third-Party Services</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              We may use third-party services that collect information for analytics and performance purposes:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
              <li>
                <strong>Vercel Analytics:</strong> We use Vercel&apos;s analytics services to understand website
                performance and usage patterns. Vercel&apos;s privacy practices can be found at{' '}
                <a
                  href="https://vercel.com/legal/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  vercel.com/legal/privacy-policy
                </a>.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">How We Use Your Information</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              The information we collect is used to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
              <li>Improve and optimize our website</li>
              <li>Understand how users interact with our content</li>
              <li>Remember your preferences and settings</li>
              <li>Identify and fix technical issues</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Data Security</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We implement appropriate technical and organizational measures to protect your information.
              However, no method of transmission over the Internet or electronic storage is 100% secure,
              and we cannot guarantee absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Children&apos;s Privacy</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              PolishedDex does not knowingly collect personal information from children under 13.
              If you believe we have inadvertently collected such information, please contact us
              so we can promptly remove it.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Changes to This Policy</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We may update this Privacy Policy from time to time. Any changes will be posted on this page
              with an updated revision date. We encourage you to review this policy periodically.
            </p>
          </section>

          <span id="ezoic-privacy-policy-embed"></span>

          <section className="mt-12 p-6 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <h2 className="text-xl font-bold mb-3 text-gray-900 dark:text-gray-100">Disclaimer</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              PolishedDex is an independent fan project and is not affiliated with, endorsed by, or
              connected to the Polished Crystal development team, Nintendo, Game Freak, or The Pokémon Company.
              Pokémon and all related names, characters, and imagery are trademarks and copyrights of their respective owners.
            </p>
          </section>
        </div>
      </main>
    </>
  );
}
