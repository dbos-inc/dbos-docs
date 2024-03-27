# DBOS Documentation

### Local Development

This site is built using [Docusaurus](https://docusaurus.io/).
All documentation is written in Markdown in the `/docs` folder.
Site-wide configuration (e.g., header, footer, favicon) is controlled from `docusaurus.config.js`.
For detailed information, see the [Docusaurus documentation](https://docusaurus.io/docs/docs-introduction).

### Local Deployment

```
npm install
npm run start
```

### Publish on Github

Publishing is done automatically by a commit hook. You should never need to run this yourself:

```
GIT_USER=<GITHUB_USERNAME> npx run deploy
```
