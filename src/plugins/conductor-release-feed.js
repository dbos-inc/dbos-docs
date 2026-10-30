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
    ? path.posix.join(path.posix.dirname(PAGE_PATH), file).replace(/\.mdx?$/, '')
    : PAGE_PATH;
  return `${siteUrl}${resolved}${anchor ? `#${anchor}` : ''}`;
}

// Convert emphasis in already-escaped text to HTML.
function emphasisToHtml(s) {
  return s
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*\w])[*_]([^*_]+)[*_](?![*\w])/g, '$1<em>$2</em>');
}

// Convert the inline Markdown used in release notes (code spans, links, and
// emphasis) to HTML. Code spans are handled first so their contents stay literal.
function inlineToHtml(text, siteUrl) {
  return text
    .split(/(`[^`]+`)/)
    .map((part) => {
      if (/^`[^`]+`$/.test(part)) {
        return `<code>${escapeXml(part.slice(1, -1))}</code>`;
      }
      return part
        .split(/(\[[^\]]+\]\([^)\s]+\))/)
        .map((piece) => {
          const link = piece.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
          if (link) {
            const href = escapeXml(resolveLink(link[2], siteUrl));
            return `<a href="${href}">${emphasisToHtml(escapeXml(link[1]))}</a>`;
          }
          return emphasisToHtml(escapeXml(piece));
        })
        .join('');
    })
    .join('');
}

function parseReleases(markdown) {
  const body = markdown.replace(/\r\n/g, '\n').replace(/^---\n[\s\S]*?\n---\n/, '');
  const sections = body.split(/^## /m).slice(1);
  if (!sections.length) {
    throw new Error(`${DOC_FILE} has no "## <version>" release sections`);
  }
  return sections.map((section) => {
    const lines = section.split('\n');
    const version = lines[0].trim();
    const dateLine = lines.find((l) => /^\*[^*]+\*$/.test(l.trim()));
    const date = dateLine && new Date(`${dateLine.trim().slice(1, -1)} UTC`);
    if (!date || Number.isNaN(date.getTime())) {
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
}

module.exports = function conductorReleaseFeed(context) {
  return {
    name: 'conductor-release-feed',

    async postBuild({ siteConfig, outDir }) {
      const siteUrl = siteConfig.url.replace(/\/$/, '');
      const pageUrl = `${siteUrl}${PAGE_PATH}`;
      const markdown = fs.readFileSync(path.join(context.siteDir, DOC_FILE), 'utf8');
      const releases = parseReleases(markdown);

      const items = releases.map(({ version, date, items }) => {
        const html = `<ul>${items.map((i) => `<li>${inlineToHtml(i, siteUrl)}</li>`).join('')}</ul>`;
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

      const feedFile = path.join(outDir, FEED_PATH);
      fs.mkdirSync(path.dirname(feedFile), { recursive: true });
      fs.writeFileSync(feedFile, feed);
    },
  };
};
