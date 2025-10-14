import Link from 'next/link';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export default function ItemNotFound() {
  return (
    <div className="max-w-4xl mx-auto p-4">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/items">Items</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Item Not Found</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="text-center py-16">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Item Not Found
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            The item you&apos;re looking for doesn&apos;t exist in our database.
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/items"
            className="inline-block bg-blue-600 hover:bg-blue-700  font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Browse All Items
          </Link>
          <div>
            <Link
              href="/"
              className="inline-block text-blue-600 dark:text-blue-400 hover:underline"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
