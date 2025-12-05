'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { Table, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface FAQContentProps {
  content: string;
}

export function FAQContent({ content }: FAQContentProps) {
  return (
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
            <strong className="font-semibold text-gray-900 dark:text-gray-100">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-gray-700 dark:text-gray-300">{children}</em>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
