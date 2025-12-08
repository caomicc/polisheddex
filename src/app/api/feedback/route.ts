import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

// Initialize Resend with API key from environment
const resend = new Resend(process.env.RESEND_API_KEY);

// Feedback types for type safety
type FeedbackType = 'bug' | 'data-error' | 'suggestion' | 'other';

interface FeedbackRequest {
  type: FeedbackType;
  email?: string;
  message: string;
  pageUrl: string;
}

const feedbackTypeLabels: Record<FeedbackType, string> = {
  bug: 'Bug Report',
  'data-error': 'Incorrect Data',
  suggestion: 'Suggestion',
  other: 'Other',
};

export async function POST(request: NextRequest) {
  try {
    const body: FeedbackRequest = await request.json();

    // Validate required fields
    if (!body.message || !body.type) {
      return NextResponse.json(
        { error: 'Message and type are required' },
        { status: 400 }
      );
    }

    // Build email content
    const typeLabel = feedbackTypeLabels[body.type] || 'Unknown';
    const timestamp = new Date().toISOString();
    const replyTo = body.email || undefined;

    const emailHtml = `
      <h2>New Feedback Submission</h2>
      <p><strong>Type:</strong> ${typeLabel}</p>
      <p><strong>Page:</strong> <a href="${body.pageUrl}">${body.pageUrl}</a></p>
      <p><strong>Submitted:</strong> ${timestamp}</p>
      ${body.email ? `<p><strong>Reply To:</strong> <a href="mailto:${body.email}">${body.email}</a></p>` : '<p><em>No email provided</em></p>'}
      <hr />
      <h3>Message:</h3>
      <p style="white-space: pre-wrap;">${body.message}</p>
    `;

    const emailText = `
New Feedback Submission
=======================
Type: ${typeLabel}
Page: ${body.pageUrl}
Submitted: ${timestamp}
${body.email ? `Reply To: ${body.email}` : 'No email provided'}

Message:
${body.message}
    `.trim();

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: 'PolishedDex Feedback <feedback@polisheddex.app>',
      to: ['caomicc@gmail.com'],
      replyTo: replyTo,
      subject: `[${typeLabel}] New Feedback from PolishedDex`,
      html: emailHtml,
      text: emailText,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json(
        { error: 'Failed to send feedback email' },
        { status: 500 }
      );
    }

    console.log('Feedback email sent:', data?.id);

    return NextResponse.json(
      { success: true, message: 'Feedback submitted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Feedback API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
