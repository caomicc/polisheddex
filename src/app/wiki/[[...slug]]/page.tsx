'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkWikiLink from 'remark-wiki-link';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ExternalLink, RefreshCw, BookOpen, Users, Settings, Bug } from 'lucide-react';
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

interface WikiData {
  content: string;
  page: string;
  lastFetched: string;
}

const commonWikiPages = [
  {
    name: 'Home',
    slug: '',
    description: 'Welcome page and project overview',
    icon: BookOpen,
  },
  {
    name: 'Modifications',
    slug: 'Modifications',
    description: 'List of changes and improvements in Polished Crystal',
    icon: Settings,
  },
  {
    name: 'Storage',
    slug: 'Storage',
    description: 'Information about storage and save management',
    icon: BookOpen,
  },
  {
    name: 'Contributing',
    slug: 'Contributing',
    description: 'How to contribute to the project',
    icon: Users,
  },
];

function WikiHomePage() {
  const [sidebarContent, setSidebarContent] = useState<string>('');
  const [sidebarLoading, setSidebarLoading] = useState(true);

  useEffect(() => {
    const fetchSidebar = async () => {
      try {
        const response = await fetch('/api/wiki/_Sidebar');
        if (response.ok) {
          const data = await response.json();
          setSidebarContent(data.content);
        }
      } catch (error) {
        console.error('Failed to fetch sidebar:', error);
      } finally {
        setSidebarLoading(false);
      }
    };

    fetchSidebar();
  }, []);

  return (
    <>
      <Hero
        className="text-white lg:min-h-[200px]"
        headline="Polished Crystal Wiki"
        breadcrumbs={
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/" className="hover:underline text-white hover:text-slate-200">
                    Home
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-white">Wiki</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        }
      />
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Quick Navigation
              </CardTitle>
              <CardDescription>Common wiki pages for Polished Crystal</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 grid grid-cols-1 md:grid-cols-2 gap-1">
              {commonWikiPages.map((page) => (
                <Link key={page.slug} href={`/wiki/${page.slug}`}>
                  <Button variant="ghost" className="w-full justify-start h-auto p-3">
                    <page.icon className="h-4 w-4 mr-3 flex-shrink-0" />
                    <div className="text-left">
                      <div className="font-medium">{page.name}</div>
                      <div className="text-xs text-muted-foreground">{page.description}</div>
                    </div>
                  </Button>
                </Link>
              ))}

              <Link
                href="https://github.com/Rangi42/polishedcrystal"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="ghost" className="w-full justify-start h-auto p-3">
                  <ExternalLink className="h-4 w-4 mr-3 flex-shrink-0" />
                  <div className="text-left">
                    <div className="font-medium">Github Repository</div>
                    <div className="text-xs text-muted-foreground">
                      Explore the source code and contribute to the project
                    </div>
                  </div>
                </Button>
              </Link>
              <Link
                href="https://github.com/Rangi42/polishedcrystal/wiki"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="ghost" className="w-full justify-start h-auto p-3">
                  <BookOpen className="h-4 w-4 mr-2" />
                  <div className="text-left">
                    <div className="font-medium">Official Wiki</div>
                    <div className="text-xs text-muted-foreground">
                      Browse the official Polished Crystal wiki on GitHub
                    </div>
                  </div>
                </Button>
              </Link>
              <Link
                href="https://github.com/Rangi42/polishedcrystal/releases"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="ghost" className="w-full justify-start h-auto p-3">
                  <Settings className="h-4 w-4 mr-2" />
                  <div className="text-left">
                    <div className="font-medium">Releases</div>
                    <div className="text-xs text-muted-foreground">
                      Download the latest game versions and changelogs
                    </div>
                  </div>
                </Button>
              </Link>
              <Link
                href="https://github.com/Rangi42/polishedcrystal/issues"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="ghost" className="w-full justify-start h-auto p-3">
                  <Bug className="h-4 w-4 mr-2" />
                  <div className="text-left">
                    <div className="font-medium">Issues & Bug Reports</div>
                    <div className="text-xs text-muted-foreground">
                      Report bugs or request features for Polished Crystal
                    </div>
                  </div>
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Table of Contents
            </CardTitle>
            <CardDescription>Browse the various sections of the wiki</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {!sidebarLoading && sidebarContent && (
              <>
                <div className="h-full overflow-y-auto">
                  <ReactMarkdown
                    remarkPlugins={[
                      remarkGfm,
                      [
                        remarkWikiLink,
                        {
                          pageResolver: (name: string) => [name.replace(/ /g, '-')],
                          hrefTemplate: (permalink: string) => `/wiki/${permalink}`,
                        },
                      ],
                    ]}
                    components={{
                      ul: ({ children }) => (
                        <div className="grid grid-cols-3 gap-4">{children}</div>
                      ),
                      li: ({ children }) => <div className="text-[0px]">{children}</div>,
                      a: ({ href, children, ...props }) => {
                        if (href?.startsWith('/wiki/')) {
                          // if the link is a wiki link, capitalize the first letter of the page name
                          // e.g. /wiki/utilities -> /wiki/Utilities
                          const pageName = href.replace('/wiki/', '').replace(/-/g, ' ');
                          const capitalizedPageName =
                            pageName.charAt(0).toUpperCase() + pageName.slice(1);
                          const cleanedHref = `/wiki/${capitalizedPageName.replace(/ /g, '-')}`;
                          return (
                            <Link href={cleanedHref} className="w-full">
                              <Button variant="ghost" size="sm" className="w-full justify-start ">
                                {/* <BookOpen className="h-3 w-3 mr-2 flex-shrink-0" /> */}
                                <span className="text-left truncate">{children}</span>
                              </Button>
                            </Link>
                          );
                        }
                        return (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            {...props}
                          >
                            {children}
                          </a>
                        );
                      },
                      span: () => null,
                      p: () => null, // Skip paragraph tags to avoid extra spacing
                    }}
                  >
                    {sidebarContent}
                  </ReactMarkdown>
                </div>
              </>
            )}

            {sidebarLoading && (
              <div className="flex items-center justify-center py-4">
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">Loading wiki pages...</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>About the Wiki Integration</CardTitle>
            <CardDescription>
              This wiki is dynamically fetched from the official Polished Crystal GitHub wiki
            </CardDescription>
          </CardHeader>
          <CardContent className="prose prose-slate dark:prose-invert max-w-none space-y-4">
            <p className="text-sm">
              This wiki integration allows you to browse the official Polished Crystal wiki content
              directly within the Pokédex application. The content is fetched in real-time from the
              GitHub wiki, ensuring you always have access to the latest information.
            </p>
            <p className="text-sm">
              <strong>Features:</strong>
            </p>
            <ul className="list-disc pl-5">
              <li className="text-sm">Real-time content fetching from GitHub wiki</li>
              <li className="text-sm">Support for wiki-style links between pages</li>
              <li className="text-sm">GitHub-flavored markdown rendering</li>
              <li className="text-sm">Responsive design that matches the app theme</li>
              <li className="text-sm">Direct links to edit pages on GitHub</li>
            </ul>
            <p className="text-sm">
              To navigate to any wiki page, you can use the URL pattern: <code>/wiki/PageName</code>
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default function WikiPage() {
  const params = useParams();
  const [wikiData, setWikiData] = useState<WikiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const slug = useMemo(
    () => (Array.isArray(params.slug) ? params.slug : params.slug ? [params.slug] : []),
    [params.slug],
  );
  const pageName = slug.length > 0 ? slug.join('/') : 'Home';
  const isHomePage = slug.length === 0;

  const fetchWikiPage = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/wiki/${slug.join('/')}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError('Wiki page not found');
        } else {
          throw new Error('Failed to fetch wiki page');
        }
        return;
      }

      const data = await response.json();
      setWikiData(data);
    } catch (err) {
      setError('Failed to load wiki page');
      console.error('Error fetching wiki:', err);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (!isHomePage) {
      fetchWikiPage();
    } else {
      setLoading(false);
    }
  }, [pageName, isHomePage, fetchWikiPage]);

  if (isHomePage) {
    return <WikiHomePage />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        Loading wiki page...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">{error}</div>
        <Button onClick={fetchWikiPage} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  if (!wikiData) {
    return <div>No wiki data available</div>;
  }

  return (
    <>
      <Hero
        className="text-white lg:min-h-[200px]"
        headline={pageName.replace(/([A-Z])/g, ' $1').trim()}
        breadcrumbs={
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/" className="hover:underline text-white hover:text-slate-200">
                    Home
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/wiki" className="hover:underline text-white hover:text-slate-200">
                    Wiki
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-white">
                  {pageName.replace(/([A-Z])/g, ' $1').trim()}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        }
      />
      <div className="max-w-4xl mx-auto">
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
            <Button onClick={fetchWikiPage} variant="default" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Link
              href={`https://github.com/Rangi42/polishedcrystal/wiki/${pageName}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="default" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                View on GitHub
              </Button>
            </Link>
          </div>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-4">
          <ReactMarkdown
            remarkPlugins={[
              remarkGfm,
              [
                remarkWikiLink,
                {
                  pageResolver: (name: string) => [name.replace(/ /g, '-')],
                  hrefTemplate: (permalink: string) => `/wiki/${permalink}`,
                },
              ],
            ]}
            components={{
              a: ({ href, children, ...props }) => {
                if (href?.startsWith('/wiki/')) {
                  const pageName = href.replace('/wiki/', '').replace(/-/g, ' ');
                  const capitalizedPageName = pageName.charAt(0).toUpperCase() + pageName.slice(1);
                  const cleanedHref = `/wiki/${capitalizedPageName.replace(/ /g, '-')}`;
                  return (
                    <Link
                      href={cleanedHref}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      {children}
                    </Link>
                  );
                }
                return (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    {...props}
                  >
                    {children}
                  </a>
                );
              },
              ul: ({ children }) => <ul className="list-disc pl-5">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-5">{children}</ol>,
              li: ({ children }) => <li className="mb-1">{children}</li>,
              p: ({ children }) => <p className="mb-4">{children}</p>,
              h1: ({ children }) => <h1 className="text-3xl font-bold mb-4">{children}</h1>,
              h2: ({ children }) => <h2 className="text-2xl font-semibold mb-3">{children}</h2>,
              h3: ({ children }) => <h3 className="text-xl font-semibold mb-2">{children}</h3>,
              h4: ({ children }) => <h4 className="text-lg font-semibold mb-1">{children}</h4>,
              h5: ({ children }) => <h5 className="text-base font-semibold mb-1">{children}</h5>,
              h6: ({ children }) => <h6 className="text-sm font-semibold mb-1">{children}</h6>,
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600 mb-4">
                  {children}
                </blockquote>
              ),
              code: ({ children }) => (
                <code className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-1 py-0.5 rounded">
                  {children}
                </code>
              ),
              pre: ({ children }) => (
                <pre className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-4 rounded mb-4">
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
            }}
          >
            {wikiData.content}
          </ReactMarkdown>
        </div>

        <div className="mt-8 pt-4 border-t text-sm text-muted-foreground">
          Last updated: {new Date(wikiData.lastFetched).toLocaleString()}
        </div>
      </div>
    </>
  );
}
