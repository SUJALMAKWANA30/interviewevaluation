/**
 * Notification Service
 * Email notifications for interview scheduling and status updates.
 * Uses nodemailer — configure EMAIL_USER and EMAIL_APP_PASSWORD in .env
 * 
 * If nodemailer is not installed or email is not configured, 
 * notifications will be logged but not sent.
 */

let transporter = null;

async function getTransporter() {
  if (transporter) return transporter;

  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_APP_PASSWORD;

  if (!emailUser || !emailPass) {
    console.warn("⚠️  Email not configured. Notifications will be logged only.");
    return null;
  }

  try {
    const nodemailer = await import("nodemailer");
    transporter = nodemailer.default.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,         // use STARTTLS
      auth: {
        user: emailUser,
        pass: emailPass,
      },
      tls: {
        rejectUnauthorized: false,  // accept self-signed certs from receiving servers
      },
    });

    // Verify SMTP connection on first use
    await transporter.verify();
    console.log("✅ Email transporter ready:", emailUser);
    return transporter;
  } catch (err) {
    console.error("⚠️  Email setup failed:", err.message);
    transporter = null;
    return null;
  }
}

/**
 * Send interview schedule notification to candidate
 */
export async function sendInterviewSchedule(candidate, schedule, interviewer) {
  const html = `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #4f46e5; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">Interview Scheduled</h2>
        <p style="margin: 5px 0 0; opacity: 0.9;">Tecnoprism Walking Interview</p>
      </div>
      <div style="background: #ffffff; border: 1px solid #e5e7eb; border-top: 0; padding: 24px; border-radius: 0 0 8px 8px;">
        <p>Dear <strong>${candidate.firstName} ${candidate.lastName}</strong>,</p>
        <p>Your <strong>${schedule.round}</strong> interview has been scheduled:</p>
        <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #4f46e5;">
          <p style="margin: 4px 0;"><strong>Date:</strong> ${new Date(schedule.scheduledDate).toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
          <p style="margin: 4px 0;"><strong>Time:</strong> ${schedule.startTime} - ${schedule.endTime}</p>
          <p style="margin: 4px 0;"><strong>Interviewer:</strong> ${interviewer.name}</p>
          ${schedule.meetingLink ? `<p style="margin: 4px 0;"><strong>Meeting Link:</strong> <a href="${schedule.meetingLink}">${schedule.meetingLink}</a></p>` : ""}
          ${schedule.location ? `<p style="margin: 4px 0;"><strong>Location:</strong> ${schedule.location}</p>` : ""}
        </div>
        <p style="color: #6b7280; font-size: 14px;">Please be available 5 minutes before the scheduled time.</p>
        <p style="margin-top: 24px;">Best regards,<br/><strong>Tecnoprism HR Team</strong></p>
      </div>
    </div>
  `;

  return sendEmail(
    candidate.email,
    `Interview Scheduled: ${schedule.round} - ${new Date(schedule.scheduledDate).toLocaleDateString()}`,
    html
  );
}

/**
 * Send interview schedule to interviewer
 */
export async function sendInterviewerNotification(interviewer, schedules) {
  const scheduleRows = schedules
    .map(
      (s) =>
        `<tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${s.startTime} - ${s.endTime}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${s.candidateName || "TBD"}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${s.round}</td>
        </tr>`
    )
    .join("");

  const html = `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1f2937;">Your Interview Schedule</h2>
      <p>Dear ${interviewer.name},</p>
      <p>You have <strong>${schedules.length}</strong> interview(s) scheduled:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <thead>
          <tr style="background: #f3f4f6;">
            <th style="padding: 8px; text-align: left;">Time</th>
            <th style="padding: 8px; text-align: left;">Candidate</th>
            <th style="padding: 8px; text-align: left;">Round</th>
          </tr>
        </thead>
        <tbody>${scheduleRows}</tbody>
      </table>
      <p style="margin-top: 24px;">Best regards,<br/><strong>Tecnoprism System</strong></p>
    </div>
  `;

  return sendEmail(
    interviewer.email,
    `Interview Schedule Update - ${schedules.length} Interview(s)`,
    html
  );
}

/**
 * Send round status update to candidate
 */
export async function sendRoundStatusUpdate(candidate, round, status) {
  const statusMessages = {
    completed: `Congratulations! You have successfully completed <strong>${round}</strong>.`,
    drop: `We regret to inform you that your application has been dropped at <strong>${round}</strong>.`,
    hold: `Your application is currently on <strong>HOLD</strong> at ${round}. We will get back to you shortly.`,
    "in-progress": `Your <strong>${round}</strong> interview is currently in progress.`,
  };

  const html = `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1f2937;">Application Status Update</h2>
      <p>Dear ${candidate.firstName},</p>
      <p>${statusMessages[status] || `Your ${round} status has been updated to: ${status}`}</p>
      <p style="margin-top: 24px;">Best regards,<br/><strong>Tecnoprism HR Team</strong></p>
    </div>
  `;

  return sendEmail(
    candidate.email,
    `Application Update: ${round} - ${status.toUpperCase()}`,
    html
  );
}

/**
 * Send login credentials to a newly created HR/Admin user
 */
export async function sendUserCredentials(user, plainPassword, roleName) {
  const loginUrl = process.env.FRONTEND_URL
    ? `${process.env.FRONTEND_URL}/hr-login`
    : "http://localhost:5173/hr-login";

  const html = `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #4f46e5; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">Welcome to Tecnoprism HR Portal</h2>
        <p style="margin: 5px 0 0; opacity: 0.9;">Your account has been created</p>
      </div>
      <div style="background: #ffffff; border: 1px solid #e5e7eb; border-top: 0; padding: 24px; border-radius: 0 0 8px 8px;">
        <p>Hello <strong>${user.name}</strong>,</p>
        <p>An account has been created for you on the Tecnoprism Interview Evaluation platform. Below are your login credentials:</p>
        <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #4f46e5;">
          <p style="margin: 4px 0;"><strong>Email:</strong> ${user.email}</p>
          <p style="margin: 4px 0;"><strong>Password:</strong> ${plainPassword}</p>
          <p style="margin: 4px 0;"><strong>Role:</strong> ${roleName}</p>
        </div>
        <p style="margin: 16px 0;">
          <a href="${loginUrl}" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Login to Dashboard
          </a>
        </p>
        <p style="color: #ef4444; font-size: 13px; margin-top: 16px;">
          ⚠️ For security, please change your password after your first login.
        </p>
        <p style="margin-top: 24px;">Best regards,<br/><strong>Tecnoprism HR Team</strong></p>
      </div>
    </div>
  `;

  return sendEmail(
    user.email,
    "Your Tecnoprism HR Portal Login Credentials",
    html
  );
}

/**
 * Core email sending function
 */
async function sendEmail(to, subject, html) {
  const mailer = await getTransporter();

  if (!mailer) {
    console.log(`[EMAIL LOG] To: ${to} | Subject: ${subject}`);
    return { success: true, logged: true };
  }

  try {
    const info = await mailer.sendMail({
      from: `"Tecnoprism HR" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      headers: {
        "X-Priority": "1",
        "X-Mailer": "Tecnoprism HR Portal",
        "Reply-To": process.env.EMAIL_USER,
      },
      // Plain-text fallback for strict mail servers (Outlook/Exchange)
      text: html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim(),
    });
    console.log(`✅ Email sent to ${to} | MessageId: ${info.messageId}`);
    return { success: true, sent: true };
  } catch (error) {
    console.error(`❌ Email send failed to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
}
