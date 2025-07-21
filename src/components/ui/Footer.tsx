"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
// import { Switch } from "@/components/ui/switch"; // Commented out for now
import { useBuildInfo } from "@/hooks/useBuildInfo";

type FooterProps = {
  className?: string;
};

export const Footer: React.FC<FooterProps> = ({ className }) => {
  // const [isDark, setIsDark] = React.useState(false); // Commented out for now
  const { buildInfo } = useBuildInfo();

  // React.useEffect(() => {
  //   if (isDark) {
  //     document.body.classList.add("dark");
  //   } else {
  //     document.body.classList.remove("dark");
  //   }
  // }, [isDark]);

  // Function to get the last updated date
  const getLastUpdatedDate = (): string => {
    // Try Vercel environment variable first
    if (process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_DATE) {
      return new Date(process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_DATE).toLocaleDateString();
    }

    // Fallback to build info
    if (buildInfo?.gitCommitDate) {
      return new Date(buildInfo.gitCommitDate).toLocaleDateString();
    }

    // Final fallback to build date
    if (buildInfo?.buildDate) {
      return new Date(buildInfo.buildDate).toLocaleDateString();
    }

    return 'Unknown';
  };

  return (
    <footer
      className={cn(
        "w-full py-6 px-4 flex flex-col md:flex-row md:items-center spacing-2 justify-between border-t border-gray-200 bg-white dark:bg-gray-900 gap-8",
        className
      )}
      role="contentinfo"
    ><div>
      <span className="text-sm text-gray-500 dark:text-gray-400 ">
        &copy; {new Date().getFullYear()} PolishedDex. All rights reserved.
      </span>
      {" "}
      <span className="text-sm text-gray-500 dark:text-gray-400">
      Made by{" "}
        <a
          href="https://caomi.cc"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-gray-600 dark:text-gray-300"
        >
          {" "}Cammy
        </a>.
      </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 dark:text-gray-500">
          Last updated: {getLastUpdatedDate()}
        </span>
      </div>
    </footer>
  );
};
