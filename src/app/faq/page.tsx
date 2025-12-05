import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, HelpCircle, Github } from 'lucide-react';
import { Hero } from '@/components/ui/Hero';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import EmulatorRecommendations from '@/components/ui/emulator-recomendations';
import { FAQContent } from './faq-content';

const FAQ_SOURCE_URL = 'https://raw.githubusercontent.com/Rangi42/polishedcrystal/master/FAQ.md';
const FAQ_GITHUB_URL = 'https://github.com/Rangi42/polishedcrystal/blob/master/FAQ.md';

async function getFAQContent(): Promise<string | null> {
  try {
    const response = await fetch(FAQ_SOURCE_URL, {
      next: { revalidate: false }, // Static - only fetch at build time
    });

    if (!response.ok) {
      console.error('Failed to fetch FAQ:', response.status);
      return null;
    }

    return await response.text();
  } catch (error) {
    console.error('Error fetching FAQ:', error);
    return null;
  }
}

export default async function FAQPage() {
  const content = await getFAQContent();

  if (!content) {
    return (
      <>
        <Hero
          headline="Polished Crystal FAQ"
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
                  <BreadcrumbPage className="">FAQ</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          }
        />
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">Failed to load FAQ content</div>
          <Link href={FAQ_GITHUB_URL} target="_blank" rel="noopener noreferrer">
            <Button variant="outline">
              <Github className="h-4 w-4 mr-2" />
              View FAQ on GitHub
            </Button>
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Hero
        headline="Polished Crystal FAQ"
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
                <BreadcrumbLink asChild>
                  <Link href="/wiki" className="hover:underline">
                    Wiki
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="">FAQ</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        }
      />

      <div className="max-w-4xl mx-auto">
        {/* Header Actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/wiki">
              <Button variant="link" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Wiki Home
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Link href={FAQ_GITHUB_URL} target="_blank" rel="noopener noreferrer">
              <Button variant="default" size="sm">
                <Github className="h-4 w-4 mr-2" />
                View on GitHub
              </Button>
            </Link>
          </div>
        </div>

        {/* Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              About This FAQ
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>
              This FAQ is synchronized from the official Polished Crystal repository at build time.
              It contains frequently asked questions and answers about the ROM hack, installation,
              gameplay, and troubleshooting.
            </p>
            <p className="mt-2">
              <strong>Source:</strong>{' '}
              <Link
                href={FAQ_GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                FAQ.md in Polished Crystal repository
              </Link>
            </p>
          </CardContent>
        </Card>

        <EmulatorRecommendations />

        {/* FAQ Content - Client component for ReactMarkdown */}
        <FAQContent content={content} />

        {/* Footer */}
        <div className="mt-8 pt-4 border-t text-sm text-muted-foreground">
          <div className="flex items-center justify-end">
            <Link
              href="https://github.com/Rangi42/polishedcrystal/edit/master/FAQ.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Suggest an edit
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
