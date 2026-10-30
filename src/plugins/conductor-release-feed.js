// Generates an RSS feed from the self-hosted Conductor release notes page.
// Each "## vX.Y.Z" section becomes a feed item. A section must be followed by
// an italic date line (e.g. "*October 29, 2026*") and then bullet points.

const fs = require('fs');
const path = require('path');

const DOC_DIR = 'docs/conductor/self-hosting';
const DOC_FILE = 'release-notes.md';
const PAGE_PATH = '/conductor/self-hosting/release-notes';
const FEED_PATH = 'conductor/self-hosting/release-notes.xml';

function escapeXml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Resolve a link from the release notes page to an absolute URL.
function resolveLink(href, siteUrl) {
  if (/^[a-z]+:/i.test(href)) {
    return href;
  }
  const [file, anchor] = href.split('#');
  const resolved = path.posix.join(path.posix.dirname(PAGE_PATH), file).replace(/\.mdx?$/, '');
  return `${siteUrl}${resolved}${anchor ? `#${anchor}` : ''}`;
}

// Convert the inline Markdown used in release notes (code spans and links) to HTML.
function inlineToHtml(text, siteUrl) {
  return escapeXml(text)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      (_, label, href) => `<a href="${escapeXml(resolveLink(href, siteUrl))}">${label}</a>`,
    );
}

function parseReleases(markdown) {
  const body = markdown.replace(/^---\n[\s\S]*?\n---\n/, '');
  const sections = body.split(/^## /m).slice(1);
  return sections.map((section) => {
    const lines = section.split('\n');
    const version = lines[0].trim();
    const dateLine = lines.find((l) => /^\*[^*]+\*$/.test(l.trim()));
    const date = dateLine && new Date(`${dateLine.trim().slice(1, -1)} UTC`);
    if (!date || Number.isNaN(date.getTime())) {
      throw new Error(`Release ${version} in ${DOC_FILE} is missing a valid "*Month D, YYYY*" date line`);
    }
    const items = lines.filter((l) => l.startsWith('- ')).map((l) => l.slice(2).trim());
    return { version, date, items };
  });
}

module.exports = function conductorReleaseFeed(context) {
  return {
    name: 'conductor-release-feed',

    getPathsToWatch() {
      return [path.join(context.siteDir, DOC_DIR, DOC_FILE)];
    },

    async postBuild({ siteConfig, outDir }) {
      const siteUrl = siteConfig.url.replace(/\/$/, '');
      const pageUrl = `${siteUrl}${PAGE_PATH}`;
      const markdown = fs.readFileSync(path.join(context.siteDir, DOC_DIR, DOC_FILE), 'utf8');
      const releases = parseReleases(markdown);

      const items = releases.map(({ version, date, items }) => {
        const link = `${pageUrl}#${version.toLowerCase().replace(/[^a-z0-9_-]/g, '')}`;
        const html = `<ul>${items.map((i) => `<li>${inlineToHtml(i, siteUrl)}</li>`).join('')}</ul>`;
        return [
          '    <item>',
          `      <title>DBOS Conductor ${escapeXml(version)}</title>`,
          `      <link>${escapeXml(link)}</link>`,
          `      <guid isPermaLink="false">dbos-conductor-${escapeXml(version)}</guid>`,
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
        releases.length ? `    <lastBuildDate>${releases[0].date.toUTCString()}</lastBuildDate>` : null,
        ...items,
        '  </channel>',
        '</rss>',
        '',
      ]
        .filter((l) => l !== null)
        .join('\n');

      const feedFile = path.join(outDir, FEED_PATH);
      fs.mkdirSync(path.dirname(feedFile), { recursive: true });
      fs.writeFileSync(feedFile, feed);
    },
  };
};
