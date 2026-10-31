// ── Event coordinator guide ────────────────────────────────────────────────
// Public, unauthenticated help page at /coordinator-guide for the volunteer who runs one Serve
// event (an account with the Volunteer role, assigned under "Event coordinators"). Public on
// purpose: it is read before signing in, and it holds no church data. Linked from the event
// screen. Keep it in step with src/frontend/js-volunteers.js when those controls change.
const STYLE = `<style>
:root{--navy:#1E2D4A;--teal:#2E7EA6;--gold:#C9973A;--cream:#F8F4EE;--muted:#6B7280;--ink:#1A1A2A;--line:rgba(30,45,74,.12);}
*{box-sizing:border-box;}
body{font-family:'DM Sans',sans-serif;background:var(--cream);color:var(--ink);margin:0;line-height:1.6;}
.wrap{max-width:760px;margin:0 auto;padding:2.5rem 1.25rem 4rem;}
h1{font-family:'Cormorant Garamond',serif;font-style:italic;font-weight:300;font-size:2.5rem;color:var(--navy);margin:0 0 .25rem;}
.lead{color:var(--muted);margin:0 0 1.75rem;}
nav.toc{background:#fff;border:1px solid var(--line);border-radius:12px;padding:1rem 1.25rem;margin-bottom:2rem;}
nav.toc ol{margin:.25rem 0 0;padding-left:1.25rem;columns:2;column-gap:2rem;}
nav.toc li{font-size:.9rem;break-inside:avoid;}
h2{font-size:1.15rem;color:var(--navy);margin:2.25rem 0 .6rem;padding-top:.5rem;border-top:1px solid var(--line);}
h3{font-size:.98rem;color:var(--navy);margin:1.25rem 0 .4rem;}
p,li{font-size:.95rem;}
ol,ul{padding-left:1.3rem;}
li{margin:.2rem 0;}
a{color:var(--teal);}
.btn{display:inline-block;font-size:.82rem;font-weight:600;border:1.5px solid var(--navy);border-radius:7px;padding:0 .45rem;color:var(--navy);background:#fff;white-space:nowrap;}
.tip{background:#fff;border-left:4px solid var(--gold);border-radius:8px;padding:.75rem 1rem;margin:1rem 0;font-size:.92rem;}
.badge{display:inline-block;font-size:.75rem;font-weight:600;border-radius:99px;padding:0 .55rem;}
table{border-collapse:collapse;width:100%;font-size:.88rem;background:#fff;border-radius:8px;overflow:hidden;}
th,td{border:1px solid var(--line);padding:.4rem .6rem;text-align:left;}
th{background:rgba(30,45,74,.05);}
code{background:rgba(30,45,74,.07);padding:0 .3rem;border-radius:4px;font-size:.88em;}
.foot{margin-top:2.5rem;padding-top:1rem;border-top:1px solid var(--line);font-size:.82rem;color:var(--muted);}
@media (max-width:600px){nav.toc ol{columns:1;}h1{font-size:2rem;}}
@media print{body{background:#fff;}nav.toc{display:none;}h2{break-after:avoid;}}
</style>`;

const HEAD = `<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">`
  + `<link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32.png">`
  + `<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,300&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">`
  + STYLE;

export const COORDINATOR_GUIDE_HTML = `<!DOCTYPE html><html lang="en"><head>${HEAD}<title>Event Coordinator Guide — Connect</title></head><body><div class="wrap">
<h1>Event Coordinator Guide</h1>
<p class="lead">For volunteers who run the sign-ups for a Timothy Lutheran event, such as the Christmas Market. This guide shows how to sign in, set up shifts, see who's coming, invite last year's volunteers, and send reminders.</p>

<nav class="toc"><strong>In this guide</strong><ol>
<li><a href="#signin">Signing in</a></li>
<li><a href="#event">Finding your event</a></li>
<li><a href="#shifts">Setting up shifts</a></li>
<li><a href="#link">Sharing the sign-up link</a></li>
<li><a href="#who">Seeing who's coming</a></li>
<li><a href="#assign">Adding or removing people yourself</a></li>
<li><a href="#report">Printing or downloading the roster</a></li>
<li><a href="#past">Importing last year's volunteers</a></li>
<li><a href="#invite">Inviting them back</a></li>
<li><a href="#remind">Sending reminders</a></li>
<li><a href="#close">Closing sign-ups</a></li>
<li><a href="#care">Caring for volunteers' information</a></li>
<li><a href="#help">Getting help</a></li>
</ol></nav>

<h2 id="signin">1. Signing in</h2>
<ol>
<li>Go to <a href="https://connect.timothystl.org">connect.timothystl.org</a> on a computer or phone.</li>
<li>Enter the username and password the church office gave you.</li>
<li>Connect opens on the <strong>Volunteers</strong> page. That is the only part of Connect your login uses.</li>
</ol>
<p>Forgot your password? Tap <strong>Forgot password?</strong> on the sign-in page and a reset link is emailed to you.</p>
<div class="tip"><strong>On a phone:</strong> open Connect in your browser, then choose <em>Share → Add to Home Screen</em> (iPhone) or <em>⋮ → Add to Home screen</em> (Android) to get an app-style icon.</div>

<h2 id="event">2. Finding your event</h2>
<ol>
<li>On the Volunteers page, tap <span class="btn">Events</span> at the top.</li>
<li>Choose your event from the list (for example, <strong>Christmas Market</strong>).</li>
</ol>
<p>Your event shows buttons along the top: <span class="btn">Email volunteers</span>, <span class="btn">Past volunteers</span>, <span class="btn">Hide event</span> and <span class="btn">Save changes</span>. Other church events also appear in the list but say <strong>View only</strong> — that's expected; your login is for your event.</p>
<p>You can change the event's name, date and description in the boxes at the top. Tap <span class="btn">Save changes</span> afterward.</p>

<h2 id="shifts">3. Setting up shifts</h2>
<p>Each job at the event is a <strong>shift</strong> with a day, a start and end time, and a number of spots. Shifts are grouped by day, for example "Shifts — Friday, December 4".</p>
<h3>Add a shift</h3>
<ol>
<li>Tap <span class="btn">+ Add shift</span> beside the day you want, or <span class="btn">+ Add shift on a new day</span> at the bottom.</li>
<li>Fill in the <strong>shift name</strong> ("Set up tents"), a short <strong>description</strong> if helpful, the <strong>date</strong>, <strong>start</strong> and <strong>end</strong> times, and how many <strong>spots</strong> you need.</li>
<li>Optionally type a <strong>Job lead</strong> — the person running that job on the day. This is for your planning; it does not need to be someone who signed up.</li>
<li>Tap <span class="btn">Save shift</span>.</li>
</ol>
<h3>Change or delete a shift</h3>
<p>Tap the shift (or its <strong>Edit</strong> link). Change anything and tap <span class="btn">Save shift</span>, or tap <strong>Delete shift</strong>. You can safely raise or lower the number of spots at any time.</p>
<div class="tip">Deleting a shift also removes everyone's sign-up for that shift. If people are already signed up, consider emailing them first (see <a href="#remind">Sending reminders</a>).</div>

<h3>Put shifts in order</h3>
<p>Tap <span class="btn">Sort by time</span> beside a day to line its shifts up by start time. To move one shift, use the <span class="btn">&#9650;</span> and <span class="btn">&#9660;</span> arrows on its left. Editing a shift never moves it.</p>

<h2 id="link">4. Sharing the sign-up link</h2>
<p>The <strong>Short link</strong> box shows your event's public sign-up page, for example <code>serve.timothystl.org/christmasmarket</code>. Tap <span class="btn">Copy link</span> and paste it into emails, the bulletin, or social media. Volunteers pick their shifts there — they don't need a login.</p>

<h2 id="who">5. Seeing who's coming</h2>
<p>Each shift shows how many spots are filled, such as <strong>3 / 18</strong>, and lists the people signed up underneath with their phone and email. On a phone, tap a number to call or an email address to write.</p>
<p>For a list by person instead of by shift, tap <span class="btn">Signups</span> at the top of the Volunteers page. Each person shows the shifts they chose, their contact details, and any note they left. A 🔔 means they asked for a reminder.</p>
<h3>Tracking who you've reached</h3>
<p>Each sign-up has a status you can change from its drop-down:</p>
<table><tr><th>Status</th><th>Use it when…</th></tr>
<tr><td>New</td><td>They just signed up.</td></tr>
<tr><td>Contacted</td><td>You've emailed or called them. (Sending an email from Connect sets this for you.)</td></tr>
<tr><td>Confirmed</td><td>They've told you they're definitely coming.</td></tr>
<tr><td>Declined</td><td>They can't come after all. Declined people are left out of reminder emails.</td></tr></table>

<h2 id="assign">Adding or removing people yourself</h2>
<p>For the person who called you, or the one who can't come after all:</p>
<ol>
<li>Tap the shift to open it. <strong>People on this shift</strong> is near the bottom.</li>
<li>To add someone, start typing their name. Pick them from the church directory and their email and phone fill in. If they aren't in the directory, choose <strong>Add "<em>name</em>"</strong> and type an email or phone if you have one.</li>
<li>To take someone off, tap the <span class="btn">&times;</span> beside their name.</li>
</ol>
<p>These save right away, even when a shift is full or sign-ups are closed. Nobody is emailed, so let them know yourself.</p>

<h2 id="report">Printing or downloading the roster</h2>
<p>At the top of your event, tap <span class="btn">Print roster</span> for a printable list of every shift, in your order, with who is on it and the open spots. Tap <span class="btn">Download roster</span> for the same list as a spreadsheet file you can open in Excel or Google Sheets.</p>

<h2 id="past">6. Importing last year's volunteers</h2>
<p>Bring in last year's list so you can invite everyone back in one step.</p>
<h3>Get the list ready</h3>
<p>Use a spreadsheet whose first row has headings. Connect looks for:</p>
<ul>
<li><strong>Name</strong> — or two columns, <strong>First Name</strong> and <strong>Last Name</strong></li>
<li><strong>Email</strong></li>
<li><strong>Phone</strong> (optional, but it helps match people)</li>
</ul>
<p>Other columns are ignored. Rows with neither an email nor a phone number are skipped.</p>
<h3>Import it</h3>
<ol>
<li>Open your event and tap <span class="btn">Past volunteers</span>.</li>
<li>Under <strong>Import a list</strong>, either:
  <ul><li>choose a <strong>CSV file</strong> (in Excel or Google Sheets use <em>File → Save as / Download → CSV</em>), or</li>
  <li>select the rows in your spreadsheet — <em>including the heading row</em> — copy them, and paste into the box.</li></ul></li>
<li>Check the <strong>Year / label</strong> (it fills in last year), then tap <span class="btn">Import</span>.</li>
</ol>
<p>Connect tells you how many people it read and added. Importing the same list again is safe — nobody is added twice.</p>
<h3>What "In Connect" means</h3>
<p>Many past volunteers are already in the church's directory. When someone's email or phone number matches a person in Connect, they're marked <span class="badge" style="background:rgba(46,126,166,.12);color:#2E7EA6;">In Connect</span> and the church office will see them tagged as a volunteer for your event (for example, "Christmas Market volunteer"). People who aren't in the directory stay on your list and can still be invited. Matching never relies on a name alone, so two people named John Smith won't be mixed up.</p>
<p>To take someone off your list, tap the <strong>×</strong> beside their name. This doesn't change anything in the church directory.</p>

<h2 id="invite">7. Inviting them back</h2>
<ol>
<li>In <span class="btn">Past volunteers</span>, tap <span class="btn">Invite to sign up</span>.</li>
<li>Read the message and edit it if you'd like. <code>{name}</code> becomes each person's first name and <code>{link}</code> becomes your sign-up page — leave those in.</li>
<li>Connect shows how many people will get it. People who have <strong>already signed up</strong> this year, or were <strong>already invited</strong>, are skipped automatically.</li>
<li>Tap <span class="btn">Send invitations</span> and confirm.</li>
</ol>
<p>Each person gets their own email; nobody sees anyone else's address. Replies come to your email. On the list, people show <span class="badge" style="background:rgba(201,151,58,.15);color:#8a6420;">Invited</span> with the date, and <span class="badge" style="background:rgba(39,174,96,.12);color:#27ae60;">Signed up</span> once they've chosen a shift. For a second nudge later, tick <strong>Also re-send to people already invited</strong>.</p>

<h2 id="remind">8. Sending reminders</h2>
<ol>
<li>Open your event and tap <span class="btn">Email volunteers</span>.</li>
<li>Under <strong>Send to</strong>, choose everyone signed up, or just one shift.</li>
<li>Edit the subject and message. <code>{name}</code> becomes each person's first name and <code>{shifts}</code> becomes the list of shifts and times they signed up for.</li>
<li>Check the count, tap <span class="btn">Send</span>, and confirm.</li>
</ol>
<p>Each person gets one email listing all their own shifts, even if they took several. People marked Declined are skipped. Replies come to you.</p>
<div class="tip"><strong>A good rhythm:</strong> a thank-you when people sign up, a reminder about a week before, and a short "see you tomorrow" the day before with where to park and whom to find. The first time, try a single small shift so you can see what an email looks like.</div>

<h2 id="close">9. Closing sign-ups</h2>
<p>Tap <span class="btn">Hide event</span> to stop new sign-ups — the public sign-up page will no longer take them. Everyone already signed up stays on your list. Tap <span class="btn">Show event</span> to open sign-ups again.</p>

<h2 id="care">10. Caring for volunteers' information</h2>
<ul>
<li>Use volunteers' phone numbers and emails only for your event.</li>
<li>Don't forward the list or post it where others can see it.</li>
<li>Sign out on shared computers (<strong>Sign out</strong>, top right).</li>
<li>If someone asks to be removed, set their sign-up to Declined or let the church office know.</li>
</ul>

<h2 id="help">11. Getting help</h2>
<p>If something doesn't look right, or you need another event added to your login, contact the church office at <a href="mailto:office@timothystl.org">office@timothystl.org</a>. Thank you for serving!</p>

<div class="foot">Timothy Lutheran Church · Connect · Event Coordinator Guide</div>
</div></body></html>`;
