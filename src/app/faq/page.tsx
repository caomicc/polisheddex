'use client';

import { useEffect, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ExternalLink, RefreshCw, HelpCircle, Github } from 'lucide-react';
import { Hero } from '@/components/ui/Hero';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Table, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import EmulatorRecommendations from '@/components/ui/emulator-recomendations';

interface FAQData {
  content: string;
  source: string;
  lastFetched: string;
}

export default function FAQPage() {
  const [faqData, setFaqData] = useState<FAQData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFAQ = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/faq');

      if (!response.ok) {
        if (response.status === 404) {
          setError('FAQ.md not found in repository');
        } else {
          throw new Error('Failed to fetch FAQ');
        }
        return;
      }

      const data = await response.json();
      setFaqData(data);
    } catch (err) {
      setError('Failed to load FAQ');
      console.error('Error fetching FAQ:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFAQ();
  }, [fetchFAQ]);

  if (loading) {
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
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          Loading FAQ...
        </div>
      </>
    );
  }

  if (error) {
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
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">{error}</div>
          <Button onClick={fetchFAQ} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </>
    );
  }

  if (!faqData) {
    return <div>No FAQ data available</div>;
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
            <Button onClick={fetchFAQ} variant="default" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Link href={faqData.source} target="_blank" rel="noopener noreferrer">
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
              This FAQ is automatically synchronized from the official Polished Crystal repository.
              It contains frequently asked questions and answers about the ROM hack, installation,
              gameplay, and troubleshooting.
            </p>
            <p className="mt-2">
              <strong>Source:</strong>{' '}
              <Link
                href={faqData.source}
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

        {/* FAQ Content */}
        <div className="prose prose-slate dark:prose-invert max-w-none space-y-4">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ href, children, ...props }) => {
                // Handle relative links to point to the repository
                if (href?.startsWith('./') || href?.startsWith('../')) {
                  const cleanedHref = href.replace(/^\.{1,2}\//, '');
                  const fullUrl = `https://github.com/Rangi42/polishedcrystal/blob/master/${cleanedHref}`;
                  return (
                    <Link
                      href={fullUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      {...props}
                    >
                      {children}
                      <ExternalLink className="h-3 w-3 text-gray-400 flex-shrink-0 ml-1" />
                    </Link>
                  );
                }

                // Handle absolute links normally
                if (href?.startsWith('http')) {
                  return (
                    <Link
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      {...props}
                    >
                      {children}
                      <ExternalLink className="inline h-3 w-3 ml-1" />
                    </Link>
                  );
                }

                return (
                  <Link
                    href={href ?? '#'}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    {...props}
                  >
                    {children}
                  </Link>
                );
              },
              ul: ({ children }) => <ul className="list-disc pl-5 mb-4">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-5 mb-4">{children}</ol>,
              li: ({ children }) => <li className="mb-1">{children}</li>,
              p: ({ children }) => <p className="mb-4">{children}</p>,
              h1: ({ children }) => (
                <h1 className="text-3xl font-bold mb-6 mt-8 first:mt-0">{children}</h1>
              ),
              h2: ({ children }) => (
                <h2
                  id={
                    children
                      ?.toString?.()
                      .toLowerCase()
                      .replace(/\s+/g, '-')
                      .replace(/[^\w-]/g, '') ?? undefined
                  }
                  className="text-2xl font-semibold mb-4 mt-8 first:mt-0"
                >
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3
                  id={
                    children
                      ?.toString?.()
                      .toLowerCase()
                      .replace(/\s+/g, '-')
                      .replace(/[^\w-]/g, '') ?? undefined
                  }
                  className="text-xl font-semibold mb-3 mt-6"
                >
                  {children}
                </h3>
              ),
              h4: ({ children }) => (
                <h4
                  id={
                    children
                      ?.toString?.()
                      .toLowerCase()
                      .replace(/\s+/g, '-')
                      .replace(/[^\w-]/g, '') ?? undefined
                  }
                  className="text-lg font-semibold mb-2 mt-4"
                >
                  {children}
                </h4>
              ),
              h5: ({ children }) => (
                <h5
                  id={
                    children
                      ?.toString?.()
                      .toLowerCase()
                      .replace(/\s+/g, '-')
                      .replace(/[^\w-]/g, '') ?? undefined
                  }
                  className="text-base font-semibold mb-2 mt-4"
                >
                  {children}
                </h5>
              ),
              h6: ({ children }) => (
                <h6
                  id={
                    children
                      ?.toString?.()
                      .toLowerCase()
                      .replace(/\s+/g, '-')
                      .replace(/[^\w-]/g, '') ?? undefined
                  }
                  className="text-sm font-semibold mb-2 mt-4"
                >
                  {children}
                </h6>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-blue-300 dark:border-blue-600 pl-4 italic text-gray-600 dark:text-gray-400 mb-4 bg-blue-50 dark:bg-blue-950 py-2">
                  {children}
                </blockquote>
              ),
              code: ({ children }) => (
                <code className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-1 py-0.5 rounded text-sm">
                  {children}
                </code>
              ),
              pre: ({ children }) => (
                <pre className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-4 rounded mb-4 overflow-x-auto">
                  <code>{children}</code>
                </pre>
              ),
              table: ({ children }) => (
                <div className="overflow-x-auto mb-4 bg-white dark:bg-gray-900 border border-border rounded-md">
                  <Table className="min-w-full">{children}</Table>
                </div>
              ),
              thead: ({ children }) => (
                <TableHeader className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                  {children}
                </TableHeader>
              ),
              th: ({ children }) => (
                <TableHead className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-left">
                  {children}
                </TableHead>
              ),
              td: ({ children }) => (
                <TableCell className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                  {children}
                </TableCell>
              ),
              tr: ({ children }) => (
                <TableRow className="hover:bg-gray-50 dark:hover:bg-gray-800">{children}</TableRow>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold text-gray-900 dark:text-gray-100">
                  {children}
                </strong>
              ),
              em: ({ children }) => (
                <em className="italic text-gray-700 dark:text-gray-300">{children}</em>
              ),
            }}
          >
            {faqData.content}
          </ReactMarkdown>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t text-sm text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Last updated: {new Date(faqData.lastFetched).toLocaleString()}</span>
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
