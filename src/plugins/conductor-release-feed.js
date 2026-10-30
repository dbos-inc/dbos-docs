// Generates an RSS feed from the self-hosted Conductor release notes page.
// Each "## vX.Y.Z" section becomes a feed item. A section must contain an
// italic date line (e.g. "*October 29, 2026*") and at least one bullet point.

const fs = require('fs');
const path = require('path');

const DOC_FILE = 'docs/conductor/self-hosting/release-notes.md';
const PAGE_PATH = '/conductor/self-hosting/release-notes';
const FEED_PATH = 'conductor/self-hosting/release-notes.xml';

function escapeXml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Matches the heading IDs Docusaurus generates for ASCII headings.
function slugify(heading) {
  return heading
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9 _-]/g, '')
    .replace(/ /g, '-');
}

// Resolve a link from the release notes page to an absolute URL.
function resolveLink(href, siteUrl) {
  if (/^[a-z]+:/i.test(href)) {
    return href;
  }
  const [file, anchor] = href.split('#');
  const resolved = file
    ? path.posix.resolve(path.posix.dirname(PAGE_PATH), file).replace(/\.mdx?$/, '')
    : PAGE_PATH;
  return `${siteUrl}${resolved}${anchor ? `#${anchor}` : ''}`;
}

// Convert emphasis in already-escaped text to HTML.
function emphasisToHtml(s) {
  return s
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*\w])[*_]([^*_]+)[*_](?![*\w])/g, '$1<em>$2</em>');
}

// Convert code spans and emphasis to HTML. Code span contents stay literal.
function textToHtml(text) {
  return text
    .split(/(`[^`]+`)/)
    .map((part) =>
      /^`[^`]+`$/.test(part)
        ? `<code>${escapeXml(part.slice(1, -1))}</code>`
        : emphasisToHtml(escapeXml(part)),
    )
    .join('');
}

// Convert the inline Markdown used in release notes (links, code spans, and
// emphasis) to HTML. Code spans and links are matched in a single left-to-right
// pass, so a link label may contain code and link syntax inside code stays literal.
// Internal link URLs are collected in `links` for validation.
function inlineToHtml(text, siteUrl, links) {
  return text
    .split(/(`[^`]+`|\[[^\]]+\]\([^)\s]+\))/)
    .map((piece) => {
      const link = piece.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
      if (!link) {
        return textToHtml(piece);
      }
      const href = resolveLink(link[2], siteUrl);
      links.push(href);
      return `<a href="${escapeXml(href)}">${textToHtml(link[1])}</a>`;
    })
    .join('');
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Parse a "Month D, YYYY" date, rejecting typos and impossible days.
function parseDate(text) {
  const m = text.match(/^([A-Z][a-z]+) (\d{1,2}), (\d{4})$/);
  const month = m ? MONTHS.indexOf(m[1]) : -1;
  if (month < 0) {
    return null;
  }
  const date = new Date(Date.UTC(Number(m[3]), month, Number(m[2])));
  return date.getUTCDate() === Number(m[2]) ? date : null;
}

function parseReleases(markdown) {
  const body = markdown.replace(/\r\n/g, '\n').replace(/^---\n[\s\S]*?\n---\n/, '');
  const sections = body.split(/^## /m).slice(1);
  if (!sections.length) {
    throw new Error(`${DOC_FILE} has no "## <version>" release sections`);
  }
  const releases = sections.map((section) => {
    const lines = section.split('\n');
    const version = lines[0].trim();
    const dateLine = lines.find((l) => /^\*[^*]+\*$/.test(l.trim()));
    const date = dateLine && parseDate(dateLine.trim().slice(1, -1));
    if (!date) {
      throw new Error(`Release ${version} in ${DOC_FILE} is missing a valid "*Month D, YYYY*" date line`);
    }
    // A bullet starts with "- " or "* "; indented lines that follow continue it.
    const items = [];
    for (const line of lines.slice(1)) {
      if (/^[-*] /.test(line)) {
        items.push(line.slice(2).trim());
      } else if (items.length && /^\s+\S/.test(line)) {
        items[items.length - 1] += ` ${line.trim()}`;
      }
    }
    if (!items.length) {
      throw new Error(`Release ${version} in ${DOC_FILE} has no bullet points`);
    }
    return { version, date, items };
  });
  // Feed items are identified by version and the newest release dates the feed.
  releases.forEach(({ version, date }, i) => {
    if (releases.findIndex((r) => slugify(r.version) === slugify(version)) !== i) {
      throw new Error(`Release ${version} appears more than once in ${DOC_FILE}`);
    }
    if (i > 0 && date > releases[i - 1].date) {
      throw new Error(`Release ${version} in ${DOC_FILE} is newer than the release above it; list releases newest first`);
    }
  });
  return releases;
}

module.exports = function conductorReleaseFeed(context) {
  return {
    name: 'conductor-release-feed',

    async postBuild({ siteConfig, outDir, routesPaths }) {
      const siteUrl = siteConfig.url.replace(/\/$/, '');
      const pageUrl = `${siteUrl}${PAGE_PATH}`;
      const markdown = fs.readFileSync(path.join(context.siteDir, DOC_FILE), 'utf8');
      const releases = parseReleases(markdown);
      const links = [pageUrl];

      const items = releases.map(({ version, date, items }) => {
        const html = `<ul>${items.map((i) => `<li>${inlineToHtml(i, siteUrl, links)}</li>`).join('')}</ul>`;
        return [
          '    <item>',
          `      <title>DBOS Conductor ${escapeXml(version)}</title>`,
          `      <link>${escapeXml(`${pageUrl}#${slugify(version)}`)}</link>`,
          `      <guid isPermaLink="false">dbos-conductor-${escapeXml(slugify(version))}</guid>`,
          `      <pubDate>${date.toUTCString()}</pubDate>`,
          `      <description>${escapeXml(html)}</description>`,
          '    </item>',
        ].join('\n');
      });

      const feed = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
        '  <channel>',
        '    <title>DBOS Conductor Release Notes</title>',
        `    <link>${escapeXml(pageUrl)}</link>`,
        '    <description>Release notes for self-hosted DBOS Conductor.</description>',
        '    <language>en</language>',
        `    <atom:link href="${escapeXml(`${siteUrl}/${FEED_PATH}`)}" rel="self" type="application/rss+xml"/>`,
        `    <lastBuildDate>${releases[0].date.toUTCString()}</lastBuildDate>`,
        ...items,
        '  </channel>',
        '</rss>',
        '',
      ].join('\n');

      // Links are resolved from file paths, so make sure each one is a real page.
      for (const link of links) {
        const route = link.startsWith(`${siteUrl}/`) && link.slice(siteUrl.length).split('#')[0];
        if (route && !routesPaths.includes(route)) {
          throw new Error(`${DOC_FILE} links to ${link}, which is not a page on this site`);
        }
      }

      const feedFile = path.join(outDir, FEED_PATH);
      fs.mkdirSync(path.dirname(feedFile), { recursive: true });
      fs.writeFileSync(feedFile, feed);
    },
  };
};
