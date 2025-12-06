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
  title: 'Terms & Conditions | PolishedDex',
  description:
    'Terms and conditions for using PolishedDex - Your Pokémon Polished Crystal companion.',
};

export default function TermsAndConditions() {
  return (
    <>
      <Hero
        headline="Terms & Conditions"
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
                <BreadcrumbPage>Terms & Conditions</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        }
      />

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
            Last updated:{' '}
            {new Date().toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              Agreement to Terms
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              By accessing and using PolishedDex (polisheddex.app), you agree to be bound by these
              Terms and Conditions. If you do not agree with any part of these terms, please do not
              use our website.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              Description of Service
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              PolishedDex is a free, fan-made companion website for Pokémon Polished Crystal. We
              provide information about Pokémon, moves, abilities, locations, and other game data to
              help players enjoy the game. This service is provided &quot;as is&quot; and &quot;as
              available&quot; without warranties of any kind.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              Intellectual Property
            </h2>

            <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">
              Pokémon Trademarks
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              All Intellectual Property (IP) related to Pokémon in any way is owned by © The
              Pokémon Company, Game Freak, Nintendo, and/or Creatures Inc. This includes the
              character designs, portrayal of any IP, and all Pokémon-related trademarks across
              Japan and other countries around the world.
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              This website publishes content related to Pokémon Polished Crystal, which is not
              officially endorsed or related to Nintendo, Game Freak, or anything related to The
              Pokémon Company. This website is not related to, affiliated with, or supported by
              anyone at Nintendo, Game Freak, or at The Pokémon Company.
            </p>

            <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">
              Polished Crystal
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              Polished Crystal is a fan made game created by Rangi42 and many contributors.
              PolishedDex is an independent fan project and is not affiliated with or endorsed by
              anyone from the Polished Crystal team.
            </p>

            <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">
              Informational Use
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              All screenshots, sprites, and data presented on this website are only provided for
              informational and educational purposes.
            </p>

            <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">
              Website Content
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              The original code, design, and non-Pokémon content of PolishedDex are the property of
              the site creator. Game data, sprites, and Pokémon-related content are used for
              informational and educational purposes under fair use principles.
            </p>

            <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">
              Copyright Concerns
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              If you see any copyrighted material that clearly does not fall under fair use, please{' '}
              <a
                href="mailto:support@polisheddex.app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                contact us
              </a>{' '}
              and let us know. We publish content with the sole purpose of providing educational
              materials for fans, with this being our only intent for any content shared on the
              website.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              Acceptable Use
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              When using PolishedDex, you agree not to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
              <li>Use the website for any unlawful purpose</li>
              <li>Attempt to gain unauthorized access to our systems or servers</li>
              <li>Interfere with or disrupt the website&apos;s operation</li>
              <li>Scrape, copy, or redistribute our content without permission</li>
              <li>
                Use automated systems to access the website in a manner that exceeds reasonable use
              </li>
              <li>Misrepresent your affiliation with PolishedDex or its creators</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              Accuracy of Information
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We strive to provide accurate and up-to-date information about Pokémon Polished
              Crystal. However, we cannot guarantee the accuracy, completeness, or timeliness of all
              content. Game data is extracted from source files and may contain errors or become
              outdated as the game is updated. Use the information at your own discretion. You are
              able to see the date last updated at the bottom of each page.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              Third-Party Links
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              PolishedDex may contain links to third-party websites or services. We are not
              responsible for the content, privacy policies, or practices of any third-party sites.
              Accessing third-party links is at your own risk.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              Limitation of Liability
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              To the fullest extent permitted by law, PolishedDex and its creator shall not be
              liable for any indirect, incidental, special, consequential, or punitive damages
              arising from your use of the website. This includes, but is not limited to, damages
              for loss of profits, data, or other intangible losses.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              Disclaimer of Warranties
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              PolishedDex is provided on an &quot;as is&quot; and &quot;as available&quot; basis. We
              make no warranties, expressed or implied, regarding the website&apos;s operation,
              availability, or the accuracy of its content. We do not warrant that the website will
              be uninterrupted, error-free, or free of viruses or other harmful components.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              Indemnification
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              You agree to indemnify and hold harmless PolishedDex and its creator from any claims,
              damages, losses, or expenses arising from your use of the website or violation of
              these Terms and Conditions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              Changes to Terms
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We reserve the right to modify these Terms and Conditions at any time. Changes will be
              effective immediately upon posting to the website. Your continued use of PolishedDex
              after any changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              Termination
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We reserve the right to terminate or restrict access to PolishedDex at any time,
              without notice, for any reason, including violation of these Terms and Conditions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              Governing Law
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              These Terms and Conditions shall be governed by and construed in accordance with
              applicable laws, without regard to conflict of law principles.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Contact</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              If you have any questions about these Terms and Conditions, please contact us through
              our{' '}
              <a
                href="https://www.notion.so/Polished-Dex-Roadmap-24662146b03a805e88f3c6db6b800837"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                feedback page
              </a>
              .
            </p>
          </section>

          <section className="mt-12 p-6 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <h2 className="text-xl font-bold mb-3 text-gray-900 dark:text-gray-100">
              Fan Project Disclaimer
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              PolishedDex is an independent fan project created for the Pokémon Polished Crystal
              community. It is not affiliated with, endorsed by, or connected to the Polished
              Crystal development team, Nintendo, Game Freak, or The Pokémon Company. All Pokémon
              names, characters, and related imagery are trademarks and copyrights of their
              respective owners. This website is intended for informational and educational purposes
              only.
            </p>
          </section>
        </div>
      </main>
    </>
  );
}
