import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { checklistType, completedTasks, totalTasks, completedBy, restaurantName, ownerEmail } = body

    // TODO: Replace with actual email service (SendGrid, Resend, AWS SES)
    const emailContent = generateEmailHTML({
      checklistType,
      completedTasks,
      totalTasks,
      completedBy,
      restaurantName,
      completionRate: Math.round((completedTasks / totalTasks) * 100),
    })

    // Simulate email send
    console.log('📧 Sending email to:', ownerEmail)
    console.log('Email content:', emailContent)

    // TODO: Actual email integration
    // await sendEmail({
    //   to: ownerEmail,
    //   from: 'noreply@wireach.tools',
    //   subject: `${restaurantName} - ${checklistType} Shift Summary`,
    //   html: emailContent,
    // })

    return NextResponse.json({ 
      success: true,
      message: 'Summary email sent successfully' 
    })
  } catch (error) {
    console.error('Error sending summary:', error)
    return NextResponse.json(
      { error: 'Failed to send summary email' },
      { status: 500 }
    )
  }
}

function generateEmailHTML(data: {
  checklistType: string
  completedTasks: number
  totalTasks: number
  completedBy: string
  restaurantName: string
  completionRate: number
}) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Shift Summary</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="background-color: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <h1 style="margin: 0 0 8px; font-size: 24px; color: #111827;">
        ${data.restaurantName}
      </h1>
      <p style="margin: 0; color: #6b7280; font-size: 14px;">
        ${data.checklistType.charAt(0).toUpperCase() + data.checklistType.slice(1)} Shift Summary
      </p>
    </div>

    <!-- Stats -->
    <div style="margin-top: 24px; background-color: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="font-size: 48px; font-weight: bold; color: ${data.completionRate === 100 ? '#10b981' : '#f59e0b'}; margin-bottom: 8px;">
          ${data.completionRate}%
        </div>
        <div style="color: #6b7280; font-size: 14px;">
          ${data.completedTasks} of ${data.totalTasks} tasks completed
        </div>
      </div>

      <div style="background-color: #f3f4f6; border-radius: 8px; padding: 16px;">
        <div style="color: #374151; font-size: 14px; margin-bottom: 4px;">
          <strong>Completed by:</strong> ${data.completedBy}
        </div>
        <div style="color: #374151; font-size: 14px;">
          <strong>Time:</strong> ${new Date().toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          })}
        </div>
      </div>
    </div>

    <!-- CTA -->
    <div style="margin-top: 24px; text-align: center;">
      <a href="https://ops.wireach.tools/dashboard" 
         style="display: inline-block; padding: 12px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
        View Full Report
      </a>
    </div>

    <!-- Footer -->
    <div style="margin-top: 32px; text-align: center; color: #9ca3af; font-size: 12px;">
      <p style="margin: 0;">
        Daily Ops Checklist by <a href="https://ops.wireach.tools" style="color: #2563eb; text-decoration: none;">wireach.tools</a>
      </p>
      <p style="margin: 8px 0 0;">
        Questions? Email <a href="mailto:ops@wireach.tools" style="color: #2563eb; text-decoration: none;">ops@wireach.tools</a>
      </p>
    </div>
  </div>
</body>
</html>
  `
}
