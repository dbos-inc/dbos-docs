/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */

// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  tutorialSidebar: [
    {
      type: 'doc',
      id: 'index',
      label: 'Home',
    },
    {
      type: 'doc',
      id: 'quickstart',
      label: 'Get Started',
    },
    {
      type: 'category',
      label: 'Develop with Python',
      items: [
        {
          type: 'autogenerated',
          dirName: 'python',
        }
      ],
    },
    {
      type: 'category',
      label: 'Develop with TypeScript',
      items: [
        {
          type: 'autogenerated',
          dirName: 'typescript',
        }
      ],
    },
    {
      type: 'category',
      label: 'Cloud Tutorials',
      items: [
        {
          type: 'autogenerated',
          dirName: 'cloud-tutorials',
        }
      ],
    },
    {
      type: 'category',
      label: 'Concepts and Explanations',
      items: [
        {
          type: 'autogenerated',
          dirName: 'explanations',
        }
      ],
    },
  ],

  examplesSidebar: [
    {
      type: 'doc',
      id: 'examples/index',
      label: 'Overview',
    },
    {
      type: 'category',
      label: 'Python Examples',
      items: [
        {
          type: 'autogenerated',
          dirName: 'python/examples',
        }
      ],
      collapsed: false,
    },
    {
      type: 'category',
      label: 'TypeScript Examples',
      items: [
        {
          type: 'autogenerated',
          dirName: 'typescript/examples',
        }
      ],
      collapsed: false,
    }
  ],
};

module.exports = sidebars;
