"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

type FooterProps = {
  className?: string;
};

export const Footer: React.FC<FooterProps> = ({ className }) => {
  const [isDark, setIsDark] = React.useState(false);

  React.useEffect(() => {
    if (isDark) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  }, [isDark]);

  return (
    <footer
      className={cn(
        "w-full py-6 px-4 flex items-center justify-between border-t border-gray-200 bg-white dark:bg-gray-900",
        className
      )}
      role="contentinfo"
    >
      <span className="text-sm text-gray-500 dark:text-gray-400">
        &copy; {new Date().getFullYear()} PolishedDex. All rights reserved.
      </span>
      <div className="flex items-center gap-2">
        <Switch
          id="theme-toggle"
          checked={isDark}
          onCheckedChange={setIsDark}
          aria-label="Toggle dark mode"
        />
        <label htmlFor="theme-toggle" className="text-sm text-gray-600 dark:text-gray-300 cursor-pointer">
          Dark mode
        </label>
      </div>
    </footer>
  );
};
