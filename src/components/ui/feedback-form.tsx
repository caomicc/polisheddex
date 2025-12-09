'use client';

import * as React from 'react';
import { useState } from 'react';
import { AlertCircle, ChevronDown, Send, CheckCircle } from 'lucide-react';
import * as Accordion from '@radix-ui/react-accordion';
import { cn } from '@/lib/utils';

type FeedbackType = 'bug' | 'data-error' | 'suggestion' | 'other';

export function FeedbackForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    type: 'data-error' as FeedbackType,
    email: '',
    message: '',
    pageUrl: typeof window !== 'undefined' ? window.location.href : '',
    screenSize: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          pageUrl: window.location.href,
          screenSize: `${window.innerWidth}x${window.innerHeight}`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      setIsSubmitted(true);
      setFormData({ type: 'data-error', email: '', message: '', pageUrl: '', screenSize: '' });
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const feedbackTypes: { value: FeedbackType; label: string }[] = [
    { value: 'data-error', label: 'Incorrect Data' },
    { value: 'bug', label: 'Bug Report' },
    { value: 'suggestion', label: 'Suggestion' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <div className="w-full px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Accordion.Root type="single" collapsible>
          <Accordion.Item
            value="feedback"
            className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 overflow-hidden shadow-md"
          >
            <Accordion.Header>
              <Accordion.Trigger className="group flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50 transition-colors">
                <span className="flex items-center gap-2">
                  <AlertCircle className="size-4 text-amber-500" />
                  Found an error or have feedback?
                </span>
                <ChevronDown className="size-4 text-neutral-500 transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
              <div className="px-4 py-4 border-t border-neutral-200 dark:border-neutral-800">
                {isSubmitted ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <CheckCircle className="size-12 text-green-500 mb-3" />
                    <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-2">
                      Thank you for your feedback!
                    </h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                      We appreciate you helping us improve PolishedDex.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsSubmitted(false)}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Submit another report
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                      PolishedDex data is extracted from the Polished Crystal repository source code.
                      Because this process is mostly automated, sometimes errors can occur or data may be
                      missing. If you find any issues or have suggestions, please let us know by filling
                      out the form below.
                    </p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
                      I am a one-woman show & have spent over 200 hours developing this site so your support means a lot to me! 😊
                    </p>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {/* Feedback Type */}
                      <div>
                        <label
                          htmlFor="feedback-type"
                          className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
                        >
                          Type of Feedback
                        </label>
                        <select
                          id="feedback-type"
                          value={formData.type}
                          onChange={(e) =>
                            setFormData({ ...formData, type: e.target.value as FeedbackType })
                          }
                          className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {feedbackTypes.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Email (Optional) */}
                      <div>
                        <label
                          htmlFor="feedback-email"
                          className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
                        >
                          Email <span className="text-neutral-500">(encouraged)</span>
                        </label>
                        <input
                          type="email"
                          id="feedback-email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="your-email-so-i-can-say-thanks@email.com"
                          className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* Message */}
                      <div>
                        <label
                          htmlFor="feedback-message"
                          className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
                        >
                          Description
                        </label>
                        <textarea
                          id="feedback-message"
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          placeholder="Please describe the issue or suggestion..."
                          rows={4}
                          required
                          className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                      </div>

                      {/* Page URL (auto-filled, shown for context) */}
                      <p className="text-xs text-neutral-500 dark:text-neutral-500">
                        Current page will be included: <span className="font-mono">{typeof window !== 'undefined' ? window.location.pathname : ''}</span>
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-500">
                        Screen size will be included: <span className="font-mono">{typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : ''}</span>
                      </p>

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={isSubmitting || !formData.message.trim()}
                        className={cn(
                          'flex items-center justify-center gap-2 w-full px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                          'bg-blue-600 text-white hover:bg-blue-700',
                          'disabled:opacity-50 disabled:cursor-not-allowed',
                        )}
                      >
                        {isSubmitting ? (
                          <>
                            <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Send className="size-4" />
                            Submit Feedback
                          </>
                        )}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </Accordion.Content>
          </Accordion.Item>
        </Accordion.Root>
      </div>
    </div>
  );
}
