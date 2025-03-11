// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion
import {themes as prismThemes} from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'DBOS Docs',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://docs.dbos.dev',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  trailingSlash: false,

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'dbos-inc', // Usually your GitHub org/user name.
  projectName: 'dbos-docs', // Usually your repo name.
  deploymentBranch: 'gh-pages',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  plugins: [
    'docusaurus-plugin-matomo',
    [
      '@docusaurus/plugin-client-redirects',
      {
        redirects: [
          {
            from: '/getting-started/quickstart',
            to: '/quickstart',
          },
          {
            from: '/explanations/core-concepts',
            to: '/',
          },
          {
            from: '/tutorials/scheduled-workflows',
            to: '/python/tutorials/scheduled-workflows',
          },
          {
            from: '/tutorials/idempotency-tutorial',
            to: '/python/tutorials/idempotency-tutorial',
          },
          {
            from: '/tutorials/authentication-authorization',
            to: '/typescript/tutorials/authentication-authorization',
          },
          {
            from: '/tutorials/testing-tutorial',
            to: '/typescript/tutorials/development/testing-tutorial',
          },
          {
            from: '/tutorials/workflow-tutorial',
            to: '/typescript/tutorials/workflow-tutorial',
          },
          {
            from: '/getting-started/quickstart-programming',
            to: '/',
          },
          {
            from: '/getting-started/quickstart-tt-debugger',
            to: '/',
          },
          {
            from: '/python/reference/task_queues',
            to: '/python/reference/queues',
          },
          {
            from: '/typescript/tutorials/checkout-tutorial',
            to: '/typescript/examples/checkout-tutorial',
          },
          {
            from: '/typescript/reference/communicatorlib',
            to: '/typescript/reference/libraries',
          },
          {
            from: '/typescript/reference/cli',
            to: '/typescript/reference/tools/cli',
          },
          {
            from: '/typescript/reference/dbos-compiler',
            to: '/typescript/reference/tools/dbos-compiler',
          },
          {
            from: '/typescript/reference/time-travel-debugger',
            to: '/typescript/reference/tools/dbos-debugger',
          },
          {
            from: '/typescript/reference/tools/time-travel-debugger',
            to: '/typescript/reference/tools/dbos-debugger',
          },
          {
            from: '/typescript/reference/dbos-class',
            to: '/typescript/reference/transactapi/dbos-class',
          },
          {
            from: '/typescript/reference/contexts',
            to: '/typescript/reference/transactapi/oldapi/contexts',
          },
          {
            from: '/typescript/reference/decorators',
            to: '/typescript/reference/transactapi/oldapi/decorators',
          },
          {
            from: '/typescript/reference/testing-runtime',
            to: '/typescript/reference/transactapi/oldapi/testing-runtime',
          },
          {
            from: '/typescript/reference/workflow-handles',
            to: '/typescript/reference/transactapi/workflow-handles',
          },
          {
            from: '/typescript/reference/workflow-queues',
            to: '/typescript/reference/transactapi/workflow-queues',
          },
          {
            from: '/typescript/tutorials/application-structure-explanation',
            to: '/typescript/tutorials/development/application-structure-explanation',
          },
          {
            from: '/typescript/tutorials/self-hosting',
            to: '/self-hosting',
          },
          {
            from: '/typescript/tutorials/development/self-hosting',
            to: '/self-hosting',
          },
          {
            from: '/typescript/tutorials/using-libraries',
            to: '/typescript/tutorials/development/using-libraries',
          },
          {
            from: '/typescript/reference/static-analysis',
            to: '/typescript/tutorials/development/static-analysis',
          },
          {
            from: '/typescript/tutorials/testing-tutorial',
            to: '/typescript/tutorials/development/testing-tutorial',
          },
          {
            from: '/typescript/tutorials/configured-instances',
            to: '/typescript/tutorials/instantiated-objects',
          },
          {
            from: '/typescript/tutorials/http-serving-tutorial',
            to: '/typescript/tutorials/requestsandevents/http-serving-tutorial',
          },
          {
            from: '/typescript/tutorials/using-drizzle',
            to: '/typescript/tutorials/orms/using-drizzle',
          },
          {
            from: '/typescript/tutorials/using-knex',
            to: '/typescript/tutorials/orms/using-knex',
          },
          {
            from: '/typescript/tutorials/using-prisma',
            to: '/typescript/tutorials/orms/using-prisma',
          },
          {
            from: '/typescript/tutorials/using-typeorm',
            to: '/typescript/tutorials/orms/using-typeorm',
          },
          {
            from: '/typescript/tutorials/workflow-communication-tutorial',
            to: '/typescript/tutorials/workflow-tutorial',
          },
          {
            from: '/typescript/tutorials/custom-event-receiver',
            to: '/typescript/tutorials/requestsandevents/custom-event-receiver',
          },
          {
            from: '/typescript/tutorials/kafka-integration',
            to: '/typescript/tutorials/requestsandevents/kafka-integration',
          },
          {
            from: '/python/examples/reliable-ai-agent',
            to: '/python/examples/customer-service',
          },
          {
            from: '/python/tutorials/integrating-dbos',
            to: '/python/integrating-dbos',
          },
          {
            from: '/typescript/tutorials/integrating-dbos',
            to: '/typescript/integrating-dbos',
          },
        ],
      },
    ],
    [
      "posthog-docusaurus",
      {
        apiKey: "phc_vKGgPmFevFB3QVyqZdIZeNqcWAPqk3i3mDhwGqwk6nP", // This is our "Production" project
        appUrl: "https://d2j9bas80r5yfz.cloudfront.net", // Using our CloudFront proxy
        enableInDevelopment: false,
      },
    ],
    [
      "@stackql/docusaurus-plugin-hubspot",
      {
        hubId: 45237820,
        async: true,
        defer: true,
      },
    ],
  ],

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: '/',
          sidebarPath: require.resolve('./sidebars.js'),
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: 'img/social-card.jpg',
      navbar: {
        title: '',
        logo: {
          alt: 'DBOS Logo',
          src: 'img/dbos-logo.png',
          srcDark: 'img/dbos-logo-dark.png',
          href: 'https://dbos.dev',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'tutorialSidebar',
            position: 'left',
            label: 'Docs',
          },
          {
            to: 'quickstart',
            position: 'left',
            label: 'Quickstart',
          },
          {
            type: 'docSidebar',
            label: 'Examples',
            position: 'left',
            sidebarId: 'examplesSidebar',
          },
          {
            type: 'search',
            position: 'right',
          },
          {
            to: 'https://console.dbos.dev/login-redirect',
            label: 'Cloud Console',
            position: 'right',
            className: 'dbos-button-blue',
          },
          {
            href: 'https://github.com/dbos-inc',
            position: 'right',
            className: 'header-github-link',
            'aria-label': 'GitHub repository',
          },
        ],
        hideOnScroll: false,
      },
      docs: {
        sidebar: {
          hideable: true,
          autoCollapseCategories: false,
        }
      },
      footer: {
        style: 'light',
        links: [
          {
            title: 'Follow Us',
            items: [
              {
                label: 'LinkedIn',
                href: 'https://www.linkedin.com/company/dbos-inc/',
              },
              {
                label: 'Bluesky',
                href: 'https://bsky.app/profile/dbos.dev',
              },
              {
                label: 'Twitter/X',
                href: 'https://x.com/DBOS_Inc',
              },
            ],
          },
          {
            title: 'Learn More',
            items: [
              {
                label: 'Blog',
                href: 'https://www.dbos.dev/blog',
              },
              {
                label: 'About',
                href: 'https://www.dbos.dev/about'
              }
            ]
          },
          {
            title: 'Questions or Comments?',
            items: [
              {
                label: 'Chat with us on Discord',
                href: 'https://discord.gg/fMwQjeW5zg',
              },
              {
                label: 'Write to us at contact@dbos.dev',
                href: 'mailto:contact@dbos.dev',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} DBOS, Inc. | <a href="https://www.dbos.dev/privacy" target=_blank>Privacy Policy</a>`,
        logo: {
          alt: 'DBOS Logo',
          src: 'img/dbos-logo.png',
          srcDark: 'img/dbos-logo-dark.png',
          href: 'https://dbos.dev',
          width: 100,
        },
      },
      prism: {
        theme: {
          ...prismThemes.okaidia,
          styles: [
            ...prismThemes.okaidia.styles,
            {
              types: ['punctuation'],
              languages: ['python'],
              style: {
                color: 'rgb(199, 146, 234)', // Change this to your desired color
              },
            },
          ],
        },
      },
      tableOfContents: {
        maxHeadingLevel:5,
      },
      algolia: {
        // The application ID provided by Algolia
        appId: 'UY2VKOMIL2',

        // Public API key: it is safe to commit it
        apiKey: '283b0ed33db1f1f2a1955ba0aa83671f',

        indexName: 'dbos',

        // Optional: see doc section below
        contextualSearch: true,

        // Optional: Specify domains where the navigation should occur through window.location instead on history.push. Useful when our Algolia config crawls multiple documentation sites and we want to navigate with window.location.href to them.
        // externalUrlRegex: 'docs\\.dbos\\.dev',

        // Optional: Replace parts of the item URLs from Algolia. Useful when using the same search index for multiple deployments using a different baseUrl. You can use regexp or string in the `from` param. For example: localhost:3000 vs myCompany.com/docs
        // replaceSearchResultPathname: {
        //   from: '/docs/', // or as RegExp: /\/docs\//
        //   to: '/',
        // },

        // Optional: Algolia search parameters
        searchParameters: {},

        // Optional: path for search page that enabled by default (`false` to disable it)
        searchPagePath: 'search',

        //... other Algolia params
      },
      matomo: {
        matomoUrl: 'https://dbosdev.matomo.cloud/',
        siteId: '1',
        phpLoader: 'matomo.php',
        jsLoader: 'matomo.js',
      },
    }),
};

module.exports = config;
