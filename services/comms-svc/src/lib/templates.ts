const BRAND_COLOR = "#7C3AED";
const BRAND_NAME = "AIVO Learning";

function baseLayout(content: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { margin: 0; padding: 0; background: #F5F3FF; font-family: 'Nunito', -apple-system, BlinkMacSystemFont, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 32px 16px; }
    .card { background: #fff; border-radius: 16px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
    .header { text-align: center; margin-bottom: 24px; }
    .logo { display: inline-block; width: 48px; height: 48px; border-radius: 24px; background: ${BRAND_COLOR}; color: #fff; font-size: 18px; font-weight: 800; line-height: 48px; text-align: center; letter-spacing: 1px; }
    .title { font-size: 22px; font-weight: 700; color: #1a1a2e; margin: 16px 0 8px; }
    .subtitle { font-size: 14px; color: #6b7280; }
    .body-text { font-size: 15px; line-height: 1.6; color: #374151; }
    .btn { display: inline-block; padding: 12px 32px; background: ${BRAND_COLOR}; color: #fff; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 15px; margin: 16px 0; }
    .footer { text-align: center; margin-top: 24px; font-size: 12px; color: #9ca3af; }
    .highlight { color: ${BRAND_COLOR}; font-weight: 700; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="logo">A</div>
      </div>
      ${content}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.</p>
      <p>AI-powered adaptive learning for every child.</p>
    </div>
  </div>
</body>
</html>`;
}

export interface TemplateData {
  [key: string]: unknown;
}

export function renderTemplate(templateId: string, data: TemplateData): { subject: string; html: string; text: string } {
  switch (templateId) {
    case "welcome":
      return renderWelcome(data);
    case "collaboration_invite":
      return renderCollaborationInvite(data);
    case "password_reset":
      return renderPasswordReset(data);
    case "progress_report":
      return renderProgressReport(data);
    case "milestone_achieved":
      return renderMilestone(data);
    case "session_reminder":
      return renderSessionReminder(data);
    case "iep_update":
      return renderIEPUpdate(data);
    default:
      return renderGeneric(data);
  }
}

function renderWelcome(data: TemplateData) {
  const name = (data.name as string) || "there";
  const html = baseLayout(`
    <h1 class="title">Welcome to ${BRAND_NAME}!</h1>
    <p class="body-text">Hi ${name},</p>
    <p class="body-text">We're thrilled to have you join the AIVO family. You've taken the first step toward personalized, adaptive learning for your child.</p>
    <p class="body-text"><strong>Here's what to do next:</strong></p>
    <ol class="body-text">
      <li>Add your child's profile</li>
      <li>Complete the parent assessment</li>
      <li>Watch as AIVO builds a personalized Brain Clone</li>
      <li>Start learning with 14 AI tutors</li>
    </ol>
    <p style="text-align:center"><a href="${data.dashboardUrl || '#'}" class="btn">Go to Dashboard</a></p>
    <p class="body-text">If you have any questions, we're here to help!</p>
  `);
  return {
    subject: `Welcome to ${BRAND_NAME}, ${name}!`,
    html,
    text: `Welcome to ${BRAND_NAME}!\n\nHi ${name}, we're thrilled to have you join. Add your child's profile and complete the parent assessment to get started.`,
  };
}

function renderCollaborationInvite(data: TemplateData) {
  const inviterName = (data.inviterName as string) || "A parent";
  const learnerName = (data.learnerName as string) || "their child";
  const role = (data.role as string) || "team member";
  const html = baseLayout(`
    <h1 class="title">You're Invited to Join a Learning Team</h1>
    <p class="body-text"><span class="highlight">${inviterName}</span> has invited you to join <span class="highlight">${learnerName}</span>'s learning team as a <strong>${role}</strong>.</p>
    <p class="body-text">As part of the team, you'll be able to view progress, contribute observations, and help support ${learnerName}'s learning journey.</p>
    <p style="text-align:center"><a href="${data.acceptUrl || '#'}" class="btn">Accept Invitation</a></p>
    <p class="body-text" style="font-size:13px;color:#6b7280">If you weren't expecting this invitation, you can safely ignore this email.</p>
  `);
  return {
    subject: `${inviterName} invited you to ${learnerName}'s learning team`,
    html,
    text: `${inviterName} invited you to join ${learnerName}'s learning team as a ${role}. Accept the invitation to get started.`,
  };
}

function renderPasswordReset(data: TemplateData) {
  const html = baseLayout(`
    <h1 class="title">Reset Your Password</h1>
    <p class="body-text">We received a request to reset your password. Click the button below to create a new one:</p>
    <p style="text-align:center"><a href="${data.resetUrl || '#'}" class="btn">Reset Password</a></p>
    <p class="body-text" style="font-size:13px;color:#6b7280">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
  `);
  return {
    subject: "Reset your AIVO password",
    html,
    text: `Reset your password by visiting: ${data.resetUrl || '#'}. This link expires in 1 hour.`,
  };
}

function renderProgressReport(data: TemplateData) {
  const learnerName = (data.learnerName as string) || "Your child";
  const period = (data.period as string) || "this week";
  const html = baseLayout(`
    <h1 class="title">Weekly Progress Report</h1>
    <p class="body-text">Here's how <span class="highlight">${learnerName}</span> did ${period}:</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb">Sessions completed</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:700">${data.sessions || 0}</td></tr>
      <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb">XP earned</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:700">${data.xp || 0}</td></tr>
      <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb">Streak</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:700">${data.streak || 0} days</td></tr>
      <tr><td style="padding:8px">Badges earned</td><td style="padding:8px;text-align:right;font-weight:700">${data.badges || 0}</td></tr>
    </table>
    <p style="text-align:center"><a href="${data.dashboardUrl || '#'}" class="btn">View Full Report</a></p>
  `);
  return {
    subject: `${learnerName}'s weekly progress report`,
    html,
    text: `${learnerName}'s progress ${period}: ${data.sessions || 0} sessions, ${data.xp || 0} XP, ${data.streak || 0} day streak.`,
  };
}

function renderMilestone(data: TemplateData) {
  const learnerName = (data.learnerName as string) || "Your child";
  const milestone = (data.milestone as string) || "a new milestone";
  const html = baseLayout(`
    <h1 class="title">Milestone Achieved!</h1>
    <p class="body-text"><span class="highlight">${learnerName}</span> just reached <strong>${milestone}</strong>!</p>
    <p class="body-text">${(data.description as string) || "Keep up the amazing work!"}</p>
    <p style="text-align:center"><a href="${data.dashboardUrl || '#'}" class="btn">View Achievement</a></p>
  `);
  return {
    subject: `${learnerName} achieved: ${milestone}`,
    html,
    text: `${learnerName} just reached ${milestone}! ${(data.description as string) || ""}`,
  };
}

function renderSessionReminder(data: TemplateData) {
  const learnerName = (data.learnerName as string) || "Your child";
  const tutorName = (data.tutorName as string) || "their tutor";
  const html = baseLayout(`
    <h1 class="title">Session Reminder</h1>
    <p class="body-text">Just a friendly reminder that <span class="highlight">${learnerName}</span> has a session with <strong>${tutorName}</strong> coming up!</p>
    <p class="body-text">Regular practice helps build strong learning habits.</p>
    <p style="text-align:center"><a href="${data.sessionUrl || '#'}" class="btn">Start Session</a></p>
  `);
  return {
    subject: `Reminder: ${learnerName}'s session with ${tutorName}`,
    html,
    text: `Reminder: ${learnerName} has a session with ${tutorName} coming up.`,
  };
}

function renderIEPUpdate(data: TemplateData) {
  const learnerName = (data.learnerName as string) || "Your child";
  const goalName = (data.goalName as string) || "an IEP goal";
  const html = baseLayout(`
    <h1 class="title">IEP Goal Update</h1>
    <p class="body-text">There's an update on <span class="highlight">${learnerName}</span>'s IEP goal: <strong>${goalName}</strong></p>
    <p class="body-text">${(data.update as string) || "Progress has been recorded."}</p>
    <p style="text-align:center"><a href="${data.iepUrl || '#'}" class="btn">View IEP Goals</a></p>
  `);
  return {
    subject: `IEP update for ${learnerName}: ${goalName}`,
    html,
    text: `IEP update for ${learnerName}: ${goalName}. ${(data.update as string) || ""}`,
  };
}

function renderGeneric(data: TemplateData) {
  const html = baseLayout(`
    <h1 class="title">${(data.title as string) || "Notification"}</h1>
    <p class="body-text">${(data.message as string) || ""}</p>
    ${data.actionUrl ? `<p style="text-align:center"><a href="${data.actionUrl}" class="btn">${(data.actionText as string) || "View"}</a></p>` : ""}
  `);
  return {
    subject: (data.subject as string) || (data.title as string) || "AIVO Notification",
    html,
    text: (data.message as string) || "",
  };
}

export const AVAILABLE_TEMPLATES = [
  { id: "welcome", name: "Welcome Email", channels: ["email"] },
  { id: "collaboration_invite", name: "Collaboration Invite", channels: ["email"] },
  { id: "password_reset", name: "Password Reset", channels: ["email"] },
  { id: "progress_report", name: "Weekly Progress Report", channels: ["email"] },
  { id: "milestone_achieved", name: "Milestone Achievement", channels: ["email", "push"] },
  { id: "session_reminder", name: "Session Reminder", channels: ["push", "email"] },
  { id: "iep_update", name: "IEP Goal Update", channels: ["email", "push"] },
];
