import { createClient } from "@/lib/supabase/server";
import { dayLabel, dayOrder, levelLabel, formatTimeRange } from "@/lib/format";

// Plain-HTML fallback for browsers too old to render the modern site
// (Tailwind v4 needs Safari 16.4+ / Chrome 111+ for @property + OKLCH).
//
// Implemented as a route handler instead of a page so the root layout's
// Tailwind v4 styles never load — the whole point is to avoid them.
// Static HTML, system fonts, classic CSS only. Should render on any
// browser back to ~2010.

const escape = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("classes")
    .select(
      "id,name,level,location,day_of_week,start_time,end_time,description",
    )
    .eq("active", true)
    .eq("is_one_off", false)
    .order("display_order", { ascending: true });

  type Row = {
    id: string;
    name: string;
    level: string;
    location: string;
    day_of_week: string;
    start_time: string;
    end_time: string;
  };
  const classes = (data ?? []) as Row[];

  const byDay: Record<string, Row[]> = {};
  for (const r of classes) (byDay[r.day_of_week] ||= []).push(r);
  const days = Object.keys(byDay).sort((a, b) => dayOrder(a) - dayOrder(b));

  const scheduleHtml =
    days.length === 0
      ? `<p>Schedule is being updated. Please email
           <a href="mailto:info@woodlandstaichi.com">info@woodlandstaichi.com</a>
           for current class times.</p>`
      : days
          .map(
            (d) => `
        <div class="day">
          <h3>${escape(dayLabel(d))}</h3>
          <table>
            <thead>
              <tr><th>Class</th><th>Time</th><th>Level</th><th>Location</th></tr>
            </thead>
            <tbody>
              ${byDay[d]
                .map(
                  (r) => `
                <tr>
                  <td>${escape(r.name)}</td>
                  <td>${escape(formatTimeRange(r.start_time, r.end_time))}</td>
                  <td>${escape(levelLabel(r.level))}</td>
                  <td>${escape(r.location)}</td>
                </tr>`,
                )
                .join("")}
            </tbody>
          </table>
        </div>`,
          )
          .join("");

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Woodlands Tai Chi</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="Woodlands Tai Chi — a non-profit community Tai Chi school in The Woodlands, Texas. Simplified page for older browsers.">
<style>
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  font-family: Georgia, "Times New Roman", serif;
  font-size: 17px;
  line-height: 1.65;
  color: #15110d;
  background: #f8f5f0;
}
a { color: #a91d1d; }
a:hover { text-decoration: underline; }
.wrap { max-width: 760px; margin: 0 auto; padding: 0 24px; }

.skip {
  position: absolute; left: -9999px; top: 0;
  background: #15110d; color: #f8f5f0;
  padding: 14px 20px; z-index: 100;
}
.skip:focus { left: 0; }

.banner {
  background: #fff7e8;
  border-bottom: 1px solid #e6dcc4;
  padding: 12px 0;
  font-size: 14px;
  line-height: 1.5;
}

.hdr { padding: 40px 0 24px; }
.hdr h1 {
  margin: 0; font-size: 36px; line-height: 1.15;
  font-weight: 500; letter-spacing: -0.01em;
}
.hdr .eyebrow {
  margin: 0 0 8px;
  font-size: 11px; letter-spacing: 0.4em; text-transform: uppercase;
  color: #7a6e5e;
  font-family: Helvetica, Arial, sans-serif;
}
.hdr .sub { margin: 14px 0 0; max-width: 56ch; color: #3a342c; }

.content { padding: 24px 0 48px; }
.content section { border-top: 1px solid #e6dcc4; padding: 28px 0 12px; }
.content section:first-child { border-top: 0; padding-top: 0; }
.content h2 {
  margin: 0 0 14px; font-size: 22px; font-weight: 500; letter-spacing: -0.005em;
}
.content h3 {
  margin: 18px 0 8px;
  font-size: 16px; font-weight: 600;
  letter-spacing: 0.08em; text-transform: uppercase;
  color: #7a6e5e;
  font-family: Helvetica, Arial, sans-serif;
}
.content p { margin: 0 0 14px; }
.content ul { margin: 0 0 16px; padding-left: 20px; }
.content ul.contact { list-style: none; padding-left: 0; }
.content ul.contact li { margin-bottom: 6px; }

.day { margin-bottom: 18px; }
table {
  width: 100%; border-collapse: collapse;
  font-family: Helvetica, Arial, sans-serif; font-size: 15px;
}
th, td {
  text-align: left; padding: 8px 10px;
  border-bottom: 1px solid #e6dcc4; vertical-align: top;
}
th {
  font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase;
  color: #7a6e5e; font-weight: 600; background: #f0eadd;
}

.ftr {
  border-top: 1px solid #e6dcc4; padding: 24px 0 36px;
  font-size: 14px; color: #3a342c; background: #efe9df;
}
.ftr .small { margin-top: 10px; font-size: 12px; color: #7a6e5e; }

@media (max-width: 600px) {
  .hdr h1 { font-size: 28px; }
  th, td { padding: 6px 8px; }
}
</style>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>

<div class="banner">
  <div class="wrap">
    <strong>Simplified page</strong> — your browser is too old to display the
    full site. To see everything, please install a recent version of
    <a href="https://www.mozilla.org/firefox/all/">Firefox</a> or
    <a href="https://www.google.com/chrome/">Chrome</a>.
  </div>
</div>

<header class="hdr">
  <div class="wrap">
    <p class="eyebrow">Founded 2009 &middot; The Woodlands, Texas</p>
    <h1>Woodlands Tai Chi</h1>
    <p class="sub">
      A non-profit community Tai Chi school. Practice teachings derive from
      Master George Ling Hu. Chief instructor: Sifu Sesco Saegusa.
    </p>
  </div>
</header>

<main id="main" class="wrap content">

  <section>
    <h2>Get in touch</h2>
    <ul class="contact">
      <li><strong>Email:</strong>
        <a href="mailto:info@woodlandstaichi.com">info@woodlandstaichi.com</a>
      </li>
      <li><strong>Text (English only):</strong>
        <a href="sms:8323816078">(832) 381-6078</a>
      </li>
      <li><em>Phone is not always answered &mdash; email or text reaches us fastest.</em></li>
    </ul>
  </section>

  <section>
    <h2>Weekly schedule</h2>
    ${scheduleHtml}
  </section>

  <section>
    <h2>Beginners classes</h2>
    <p>
      New classes for beginners open in <strong>June 2026</strong> and
      <strong>October 2026</strong>. To register, please email
      <a href="mailto:info@woodlandstaichi.com">info@woodlandstaichi.com</a>
      and we will reply with the registration form and class details.
    </p>
  </section>

  <section>
    <h2>Where we meet</h2>
    <ul>
      <li>
        <strong>The Woodlands Methodist Church (TWMC)</strong><br>
        Adventures in Wellness program. Wednesday morning &amp; evening classes.
      </li>
      <li>
        <strong>Kevin Brady Community Center (KBCC)</strong><br>
        Thursday morning class.
      </li>
      <li>
        <strong>Lone Star College &mdash; Academy for Lifelong Learning</strong><br>
        Continuing class for current members.
      </li>
    </ul>
  </section>

  <section>
    <h2>About</h2>
    <p>
      Woodlands Tai Chi has been teaching the gentle, balance-restoring
      practice of Tai Chi to The Woodlands community since 2009.
      Roughly 73 active members. Classes are sponsored by The Woodlands
      Methodist Church (Adventures in Wellness), Lone Star College System
      (Academy for Lifelong Learning), and Interfaith of the Woodlands
      (Senior Activities).
    </p>
  </section>
</main>

<footer class="ftr">
  <div class="wrap">
    <p>
      &copy; Woodlands Tai Chi &middot; A non-profit community school &middot;
      <a href="mailto:info@woodlandstaichi.com">info@woodlandstaichi.com</a>
    </p>
    <p class="small">
      You are seeing this simplified page because your browser is older than
      what the full site supports. For the full experience, install a recent
      version of Firefox or Chrome on a newer operating system.
    </p>
  </div>
</footer>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      // Short cache so the schedule stays fresh-ish on the legacy page.
      "cache-control": "public, max-age=60, s-maxage=600",
    },
  });
}
