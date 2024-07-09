"use strict";(self.webpackChunkdbos_docs=self.webpackChunkdbos_docs||[]).push([[6800],{7386:(e,n,s)=>{s.r(n),s.d(n,{assets:()=>d,contentTitle:()=>c,default:()=>p,frontMatter:()=>o,metadata:()=>a,toc:()=>u});var t=s(5893),i=s(1151),r=s(4866),l=s(5162);const o={sidebar_position:8,title:"Static Analysis",description:"API, tool, and rule documentation for DBOS static code analysis"},c="Static Code Analysis",a={id:"api-reference/static-analysis",title:"Static Analysis",description:"API, tool, and rule documentation for DBOS static code analysis",source:"@site/docs/api-reference/static-analysis.md",sourceDirName:"api-reference",slug:"/api-reference/static-analysis",permalink:"/api-reference/static-analysis",draft:!1,unlisted:!1,tags:[],version:"current",sidebarPosition:8,frontMatter:{sidebar_position:8,title:"Static Analysis",description:"API, tool, and rule documentation for DBOS static code analysis"},sidebar:"tutorialSidebar",previous:{title:"Communicator Library",permalink:"/api-reference/communicatorlib"},next:{title:"Time Travel Debugger",permalink:"/api-reference/time-travel-debugger"}},d={},u=[{value:"Introduction",id:"introduction",level:2},{value:"<code>eslint</code> and <code>@dbos-inc/eslint-plugin</code>",id:"eslint-and-dbos-inceslint-plugin",level:2},{value:"Installing and configuring <code>eslint</code>",id:"installing-and-configuring-eslint",level:3},{value:"Recommended rules/plugins",id:"recommended-rulesplugins",level:3},{value:"DBOS custom rules",id:"dbos-custom-rules",level:3}];function h(e){const n={a:"a",admonition:"admonition",code:"code",em:"em",h1:"h1",h2:"h2",h3:"h3",hr:"hr",li:"li",ol:"ol",p:"p",pre:"pre",ul:"ul",...(0,i.a)(),...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(n.h1,{id:"static-code-analysis",children:"Static Code Analysis"}),"\n",(0,t.jsx)(n.hr,{}),"\n",(0,t.jsx)(n.h2,{id:"introduction",children:"Introduction"}),"\n",(0,t.jsxs)(n.ul,{children:["\n",(0,t.jsxs)(n.li,{children:["\n",(0,t.jsx)(n.p,{children:'Poor coding practices are responsible for many kinds of bugs, including several common classes of security vulnerabilities.\nUnsafe use of user input, hardcoded/exposed security credentials, improper format strings, construction of SQL statements via string concatenation, and slow regular expressions, are all examples of tactical mistakes that have been exploited "in the wild" to compromise or disable systems.'}),"\n"]}),"\n",(0,t.jsxs)(n.li,{children:["\n",(0,t.jsx)(n.p,{children:'While the list of "gotchas" is long and easily neglected, the good news is that many of these anti-patterns can be detected quickly and automatically by modern static code analysis tools.'}),"\n"]}),"\n",(0,t.jsxs)(n.li,{children:["\n",(0,t.jsxs)(n.p,{children:["DBOS recommends using static analysis as an ingredient in a comprehensive security strategy.  As adding rule enforcement to a large, established codebase can be a hassle, DBOS recommends using tools from the beginning of a project, and therefore includes tool configuration in its ",(0,t.jsx)(n.a,{href:"https://github.com/dbos-inc/dbos-demo-apps",children:"demo applications"})," and ",(0,t.jsx)(n.a,{href:"/getting-started/quickstart",children:"quickstart templates"}),"."]}),"\n"]}),"\n"]}),"\n",(0,t.jsx)(n.p,{children:"DBOS uses several techniques to ensure that static analysis is as productive as possible, with minimal hassle:"}),"\n",(0,t.jsxs)(n.ul,{children:["\n",(0,t.jsx)(n.li,{children:"DBOS Transact builds on popular frameworks, thereby leveraging community best-practices and tools integration."}),"\n",(0,t.jsx)(n.li,{children:"DBOS focuses on analysis rules that detect incorrect API usage and potential security vulnerabilities, rather than nitpicking on coding style."}),"\n"]}),"\n",(0,t.jsx)(n.hr,{}),"\n",(0,t.jsxs)(n.h2,{id:"eslint-and-dbos-inceslint-plugin",children:[(0,t.jsx)(n.code,{children:"eslint"})," and ",(0,t.jsx)(n.code,{children:"@dbos-inc/eslint-plugin"})]}),"\n",(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.a,{href:"https://eslint.org/",children:(0,t.jsx)(n.code,{children:"eslint"})})," is a popular tool for checking JavaScript and TypeScript code.  ",(0,t.jsx)(n.code,{children:"eslint"})," is flexible, extensible, and comes with many standard and optional plugins.  Many editors and development tools provide integration with ",(0,t.jsx)(n.code,{children:"eslint"}),", allowing bugs to be detected early in the development cycle."]}),"\n",(0,t.jsxs)(n.p,{children:["Many DBOS-suggested coding practices can be enforced by a combination of ",(0,t.jsx)(n.code,{children:"eslint"})," plugins and rule configurations."]}),"\n",(0,t.jsxs)(n.h3,{id:"installing-and-configuring-eslint",children:["Installing and configuring ",(0,t.jsx)(n.code,{children:"eslint"})]}),"\n",(0,t.jsx)(n.admonition,{type:"tip",children:(0,t.jsxs)(n.p,{children:["If you got started with the ",(0,t.jsx)(n.a,{href:"/getting-started/quickstart",children:"quickstart"}),", ",(0,t.jsx)(n.code,{children:"eslint"})," and required plugins are already installed.\nPlugins to support TypeScript and detect common vulnerabilities are automatically installed with ",(0,t.jsx)(n.code,{children:"@dbos-inc/eslint-plugin"})," as dependencies and do not need to be installed separately."]})}),"\n",(0,t.jsxs)(n.p,{children:["To install the ",(0,t.jsx)(n.code,{children:"eslint"})," package and the DBOS plugin:"]}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-bash",children:"npm install --save-dev typescript-eslint\nnpm install --save-dev @dbos-inc/eslint-plugin\n"})}),"\n",(0,t.jsxs)(n.p,{children:["Configuring ",(0,t.jsx)(n.code,{children:"eslint"})," can be quite involved, as there are ",(0,t.jsx)(n.a,{href:"https://eslint.org/docs/latest/use/configure/configuration-files#configuration-file-formats",children:"several complete configuration schemes"}),".\nBoth of these options require you to set up a ",(0,t.jsx)(n.code,{children:"tsconfig.json"})," file beforehand."]}),"\n",(0,t.jsxs)(r.Z,{groupId:"config-types",children:[(0,t.jsxs)(l.Z,{value:"flat-config",label:"Flat config",children:[(0,t.jsxs)(n.p,{children:[(0,t.jsx)("h4",{children:" This config style will work with ESLint 8 and above. "}),"\nPlace an ",(0,t.jsx)(n.code,{children:"eslint.config.js"})," file similar to the following in your project directory."]}),(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-js",children:'const { FlatCompat } = require("@eslint/eslintrc");\nconst dbosIncEslintPlugin = require("@dbos-inc/eslint-plugin");\nconst typescriptEslint = require("typescript-eslint");\nconst typescriptEslintParser = require("@typescript-eslint/parser");\nconst globals = require("globals");\nconst js = require("@eslint/js");\n\nconst compat = new FlatCompat({\n    baseDirectory: __dirname,\n    recommendedConfig: js.configs.recommended\n});\n\nmodule.exports = typescriptEslint.config(\n  {\n    extends: compat.extends("plugin:@dbos-inc/dbosRecommendedConfig"),\n    plugins: { "@dbos-inc": dbosIncEslintPlugin },\n\n    languageOptions: {\n        parser: typescriptEslintParser,\n        parserOptions: { project: "./tsconfig.json" },\n        globals: { ...globals.node, ...globals.es6 }\n    },\n\n    rules: { }\n  }\n);\n'})})]}),(0,t.jsxs)(l.Z,{value:"legacy-config",label:"Legacy config",children:[(0,t.jsxs)(n.p,{children:[(0,t.jsx)("h4",{children:" This config style will work with ESLint 8 and below. "}),"\nPlace an ",(0,t.jsx)(n.code,{children:".eslintrc"})," file similar to the following in your project directory:"]}),(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-json",children:'{\n  "root": true,\n  "extends": [\n    "plugin:@dbos-inc/dbosRecommendedConfig"\n  ],\n  "plugins": [\n    "@dbos-inc"\n  ],\n  "env": {\n    "node": true,\n    "es6": true\n  },\n  "rules": {\n  },\n  "parser": "@typescript-eslint/parser",\n  "parserOptions": {\n    "project": "./tsconfig.json"\n  }\n}\n'})})]})]}),"\n",(0,t.jsxs)(n.p,{children:["The example above configures the project for the recommended ",(0,t.jsx)(n.code,{children:"eslint"})," configuration.  Adjust the ",(0,t.jsx)(n.code,{children:"extends"}),", ",(0,t.jsx)(n.code,{children:"rules"}),", ",(0,t.jsx)(n.code,{children:"plugins"}),", ",(0,t.jsx)(n.code,{children:"env"}),", and other sections as desired, consulting the configurations and rules below."]}),"\n",(0,t.jsxs)(n.p,{children:["Finally, to make ",(0,t.jsx)(n.code,{children:"eslint"})," easy to run, it is suggested to place commands in ",(0,t.jsx)(n.code,{children:"package.json"}),".  For example:"]}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-json",children:'"scripts": {\n  "build": "tsc",\n  "test": "...",\n  "lint": "eslint src",\n  "lint-fix": "eslint --fix src"\n}\n'})}),"\n",(0,t.jsx)(n.hr,{}),"\n",(0,t.jsx)(n.h3,{id:"recommended-rulesplugins",children:"Recommended rules/plugins"}),"\n",(0,t.jsx)(n.p,{children:"These rules are enabled by default:"}),"\n",(0,t.jsxs)(n.ul,{children:["\n",(0,t.jsxs)(n.li,{children:["\n",(0,t.jsx)(n.p,{children:(0,t.jsx)(n.a,{href:"https://eslint.org/docs/latest/rules/no-eval",children:(0,t.jsx)(n.code,{children:"no-eval"})})}),"\n"]}),"\n",(0,t.jsxs)(n.li,{children:["\n",(0,t.jsx)(n.p,{children:(0,t.jsx)(n.a,{href:"https://eslint.org/docs/latest/rules/no-implied-eval",children:(0,t.jsx)(n.code,{children:"@typescript-eslint/no-implied-eval"})})}),"\n"]}),"\n",(0,t.jsxs)(n.li,{children:["\n",(0,t.jsx)(n.p,{children:(0,t.jsx)(n.a,{href:"https://github.com/eslint-community/eslint-plugin-security/blob/HEAD/docs/rules/detect-unsafe-regex.md",children:(0,t.jsx)(n.code,{children:"security/detect-unsafe-regex"})})}),"\n"]}),"\n",(0,t.jsxs)(n.li,{children:["\n",(0,t.jsx)(n.p,{children:(0,t.jsx)(n.a,{href:"https://www.npmjs.com/package/eslint-plugin-no-secrets/v/0.1.2",children:(0,t.jsx)(n.code,{children:"no-secrets/no-secrets"})})}),"\n"]}),"\n",(0,t.jsxs)(n.li,{children:["\n",(0,t.jsx)(n.p,{children:(0,t.jsx)(n.a,{href:"https://eslint.org/docs/latest/rules/eqeqeq",children:(0,t.jsx)(n.code,{children:"eqeqeq"})})}),"\n"]}),"\n",(0,t.jsxs)(n.li,{children:["\n",(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.a,{href:"https://typescript-eslint.io/rules/no-unused-vars/",children:(0,t.jsx)(n.code,{children:"@typescript-eslint/no-unused-vars"})})," (silence this rule with leading underscores)"]}),"\n"]}),"\n",(0,t.jsxs)(n.li,{children:["\n",(0,t.jsx)(n.p,{children:(0,t.jsx)(n.a,{href:"https://typescript-eslint.io/rules/no-for-in-array/",children:(0,t.jsx)(n.code,{children:"@typescript-eslint/no-for-in-array"})})}),"\n"]}),"\n",(0,t.jsxs)(n.li,{children:["\n",(0,t.jsx)(n.p,{children:(0,t.jsx)(n.a,{href:"https://typescript-eslint.io/rules/no-misused-promises/",children:(0,t.jsx)(n.code,{children:"@typescript-eslint/no-misused-promises"})})}),"\n"]}),"\n",(0,t.jsxs)(n.li,{children:["\n",(0,t.jsx)(n.p,{children:(0,t.jsx)(n.a,{href:"https://typescript-eslint.io/rules/no-floating-promises/",children:(0,t.jsx)(n.code,{children:"@typescript-eslint/no-floating-promises"})})}),"\n"]}),"\n"]}),"\n",(0,t.jsx)(n.p,{children:"These rules are disabled by default:"}),"\n",(0,t.jsxs)(n.ul,{children:["\n",(0,t.jsx)(n.li,{children:(0,t.jsx)(n.a,{href:"https://eslint.org/docs/latest/rules/semi",children:(0,t.jsx)(n.code,{children:"semi"})})}),"\n",(0,t.jsx)(n.li,{children:(0,t.jsx)(n.a,{href:"https://eslint.org/docs/latest/rules/no-empty",children:(0,t.jsx)(n.code,{children:"no-empty"})})}),"\n",(0,t.jsx)(n.li,{children:(0,t.jsx)(n.a,{href:"https://eslint.org/docs/latest/rules/no-constant-condition",children:(0,t.jsx)(n.code,{children:"no-constant-condition"})})}),"\n",(0,t.jsx)(n.li,{children:(0,t.jsx)(n.a,{href:"https://typescript-eslint.io/rules/no-unnecessary-type-assertion/",children:(0,t.jsx)(n.code,{children:"@typescript-eslint/no-unnecessary-type-assertion"})})}),"\n"]}),"\n",(0,t.jsx)(n.p,{children:"These plugins are enabled by default:"}),"\n",(0,t.jsxs)(n.ul,{children:["\n",(0,t.jsx)(n.li,{children:(0,t.jsx)(n.a,{href:"https://github.com/eslint/eslint/blob/main/packages/js/src/configs/eslint-recommended.js",children:(0,t.jsx)(n.code,{children:"eslint:recommended"})})}),"\n",(0,t.jsx)(n.li,{children:(0,t.jsx)(n.a,{href:"https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/eslint-plugin/src/configs/recommended.ts",children:(0,t.jsx)(n.code,{children:"@typescript-eslint/recommended"})})}),"\n",(0,t.jsx)(n.li,{children:(0,t.jsx)(n.a,{href:"https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/eslint-plugin/src/configs/recommended-type-checked.ts",children:(0,t.jsx)(n.code,{children:"@typescript-eslint/recommended-type-checked"})})}),"\n"]}),"\n",(0,t.jsx)(n.hr,{}),"\n",(0,t.jsx)(n.h3,{id:"dbos-custom-rules",children:"DBOS custom rules"}),"\n",(0,t.jsxs)(n.p,{children:["One custom rule from DBOS, ",(0,t.jsx)(n.code,{children:"@dbos-inc/dbos-static-analysis"}),", is provided in the ",(0,t.jsx)(n.a,{href:"https://github.com/dbos-inc/eslint-plugin",children:(0,t.jsx)(n.code,{children:"@dbos-inc/eslint-plugin"})})," package.  This rule is enabled by default."]}),"\n",(0,t.jsxs)(n.p,{children:["These function calls are currently flagged as ",(0,t.jsx)(n.a,{href:"https://docs.dbos.dev/tutorials/workflow-tutorial#determinism",children:"nondeterministic"})," (they may interfere with consistent workflow results or the debugger):"]}),"\n",(0,t.jsxs)(n.ul,{children:["\n",(0,t.jsx)(n.li,{children:(0,t.jsx)(n.code,{children:"Math.random()"})}),"\n",(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:"Date()"}),", ",(0,t.jsx)(n.code,{children:"new Date()"}),", ",(0,t.jsx)(n.code,{children:"Date.now()"})]}),"\n",(0,t.jsx)(n.li,{children:(0,t.jsx)(n.code,{children:"setTimeout(...)"})}),"\n"]}),"\n",(0,t.jsx)(n.p,{children:(0,t.jsxs)(n.em,{children:["All such operations should use functions provided by DBOS Transact, or at a minimum, be encapsulated in a ",(0,t.jsx)(n.a,{href:"../tutorials/communicator-tutorial",children:"communicator"}),"."]})}),"\n",(0,t.jsx)(n.p,{children:"These function calls are not necessarily nondeterministic, but are still warned about:"}),"\n",(0,t.jsxs)(n.ul,{children:["\n",(0,t.jsx)(n.li,{children:(0,t.jsx)(n.code,{children:"console.log(...)"})}),"\n",(0,t.jsx)(n.li,{children:(0,t.jsx)(n.code,{children:"bcrypt.hash(...)"})}),"\n",(0,t.jsx)(n.li,{children:(0,t.jsx)(n.code,{children:"bcrypt.compare(...)"})}),"\n"]}),"\n",(0,t.jsx)(n.p,{children:(0,t.jsx)(n.em,{children:"Emitted warning messages will provide alternatives to each function call."})}),"\n",(0,t.jsx)(n.p,{children:"These behaviors result in warnings as well:"}),"\n",(0,t.jsxs)(n.ol,{children:["\n",(0,t.jsxs)(n.li,{children:["Awaiting in a workflow on a non-",(0,t.jsx)(n.code,{children:"WorkflowContext"})," object (this implies I/O, which is often nondeterministic):"]}),"\n"]}),"\n",(0,t.jsx)(n.p,{children:"Not allowed:"}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-ts",children:'@Workflow()\nstatic async myWorkflow(ctxt: WorkflowContext) {\n  // Calling an external API in a workflow is not allowed.\n  const result = await fetch("https://www.google.com");\n}\n'})}),"\n",(0,t.jsx)(n.p,{children:"Allowed:"}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-ts",children:'@Communicator()\nstatic async myCommunicator(ctxt: CommunicatorContext) {\n  // Calling an external API in a communicator is allowed.\n  const result = await fetch("https://www.google.com");\n}\n'})}),"\n",(0,t.jsxs)(n.p,{children:["(code below adapted from ",(0,t.jsx)(n.a,{href:"https://github.com/dbos-inc/dbos-demo-apps/blob/43c656e0cf50d8f85ca8bd8cba9087af2cea8038/shop-guide/src/operations.ts#L23",children:"here"}),")"]}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-ts",children:'@Workflow()\nstatic async checkoutWorkflow(ctxt: WorkflowContext) {\n  // All awaits start with a leftmost `WorkflowContext`.\n\n  try {\n    await ctxt.invoke(ShopUtilities).reserveInventory();\n  }\n  catch (error) {\n    ctxt.logger.error("Failed to update inventory");\n    await ctxt.setEvent(session_topic, null);\n    return;\n  }\n\n  // ...\n}\n\n'})}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-ts",children:"@Workflow()\nstatic async checkoutWorkflow(ctxt: WorkflowContext) {\n  /* Sometimes, you might await on a non-`WorkflowContext` object,\n  but the function you're calling is a helper function that uses the\n  underlying context. So if you pass in a `WorkflowContext` as a parameter,\n  the warning will be supressed. */\n  await doCheckout(ctxt);\n}\n"})}),"\n",(0,t.jsxs)(n.ol,{start:"2",children:["\n",(0,t.jsx)(n.li,{children:"Global modification in a workflow (this often leads to nondeterministic behavior):"}),"\n"]}),"\n",(0,t.jsxs)(n.p,{children:["(code below adapted from ",(0,t.jsx)(n.a,{href:"https://github.com/dbos-inc/dbos-demo-apps/blob/43c656e0cf50d8f85ca8bd8cba9087af2cea8038/bank/bank-backend/src/workflows/txnhistory.workflows.ts#L192",children:"here"}),")"]}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-ts",children:"let globalResult = undefined;\n\n@Workflow()\nstatic async depositWorkflow(ctxt: WorkflowContext, data: TransactionHistory) {\n  globalResult = await ctxt.invoke(BankTransactionHistory).updateAcctTransactionFunc(data.toAccountId, data, true);\n  // ...\n}\n"})}),"\n",(0,t.jsx)(n.p,{children:(0,t.jsx)(n.em,{children:"Any global variable defined outside the scope of the workflow which is directly modified will result in a warning."})})]})}function p(e={}){const{wrapper:n}={...(0,i.a)(),...e.components};return n?(0,t.jsx)(n,{...e,children:(0,t.jsx)(h,{...e})}):h(e)}},5162:(e,n,s)=>{s.d(n,{Z:()=>l});s(7294);var t=s(6905);const i={tabItem:"tabItem_Ymn6"};var r=s(5893);function l(e){let{children:n,hidden:s,className:l}=e;return(0,r.jsx)("div",{role:"tabpanel",className:(0,t.Z)(i.tabItem,l),hidden:s,children:n})}},4866:(e,n,s)=>{s.d(n,{Z:()=>v});var t=s(7294),i=s(6905),r=s(2466),l=s(6550),o=s(469),c=s(1980),a=s(7392),d=s(812);function u(e){return t.Children.toArray(e).filter((e=>"\n"!==e)).map((e=>{if(!e||(0,t.isValidElement)(e)&&function(e){const{props:n}=e;return!!n&&"object"==typeof n&&"value"in n}(e))return e;throw new Error(`Docusaurus error: Bad <Tabs> child <${"string"==typeof e.type?e.type:e.type.name}>: all children of the <Tabs> component should be <TabItem>, and every <TabItem> should have a unique "value" prop.`)}))?.filter(Boolean)??[]}function h(e){const{values:n,children:s}=e;return(0,t.useMemo)((()=>{const e=n??function(e){return u(e).map((e=>{let{props:{value:n,label:s,attributes:t,default:i}}=e;return{value:n,label:s,attributes:t,default:i}}))}(s);return function(e){const n=(0,a.l)(e,((e,n)=>e.value===n.value));if(n.length>0)throw new Error(`Docusaurus error: Duplicate values "${n.map((e=>e.value)).join(", ")}" found in <Tabs>. Every value needs to be unique.`)}(e),e}),[n,s])}function p(e){let{value:n,tabValues:s}=e;return s.some((e=>e.value===n))}function m(e){let{queryString:n=!1,groupId:s}=e;const i=(0,l.k6)(),r=function(e){let{queryString:n=!1,groupId:s}=e;if("string"==typeof n)return n;if(!1===n)return null;if(!0===n&&!s)throw new Error('Docusaurus error: The <Tabs> component groupId prop is required if queryString=true, because this value is used as the search param name. You can also provide an explicit value such as queryString="my-search-param".');return s??null}({queryString:n,groupId:s});return[(0,c._X)(r),(0,t.useCallback)((e=>{if(!r)return;const n=new URLSearchParams(i.location.search);n.set(r,e),i.replace({...i.location,search:n.toString()})}),[r,i])]}function x(e){const{defaultValue:n,queryString:s=!1,groupId:i}=e,r=h(e),[l,c]=(0,t.useState)((()=>function(e){let{defaultValue:n,tabValues:s}=e;if(0===s.length)throw new Error("Docusaurus error: the <Tabs> component requires at least one <TabItem> children component");if(n){if(!p({value:n,tabValues:s}))throw new Error(`Docusaurus error: The <Tabs> has a defaultValue "${n}" but none of its children has the corresponding value. Available values are: ${s.map((e=>e.value)).join(", ")}. If you intend to show no default tab, use defaultValue={null} instead.`);return n}const t=s.find((e=>e.default))??s[0];if(!t)throw new Error("Unexpected error: 0 tabValues");return t.value}({defaultValue:n,tabValues:r}))),[a,u]=m({queryString:s,groupId:i}),[x,f]=function(e){let{groupId:n}=e;const s=function(e){return e?`docusaurus.tab.${e}`:null}(n),[i,r]=(0,d.Nk)(s);return[i,(0,t.useCallback)((e=>{s&&r.set(e)}),[s,r])]}({groupId:i}),g=(()=>{const e=a??x;return p({value:e,tabValues:r})?e:null})();(0,o.Z)((()=>{g&&c(g)}),[g]);return{selectedValue:l,selectValue:(0,t.useCallback)((e=>{if(!p({value:e,tabValues:r}))throw new Error(`Can't select invalid tab value=${e}`);c(e),u(e),f(e)}),[u,f,r]),tabValues:r}}var f=s(2389);const g={tabList:"tabList__CuJ",tabItem:"tabItem_LNqP"};var j=s(5893);function b(e){let{className:n,block:s,selectedValue:t,selectValue:l,tabValues:o}=e;const c=[],{blockElementScrollPositionUntilNextRender:a}=(0,r.o5)(),d=e=>{const n=e.currentTarget,s=c.indexOf(n),i=o[s].value;i!==t&&(a(n),l(i))},u=e=>{let n=null;switch(e.key){case"Enter":d(e);break;case"ArrowRight":{const s=c.indexOf(e.currentTarget)+1;n=c[s]??c[0];break}case"ArrowLeft":{const s=c.indexOf(e.currentTarget)-1;n=c[s]??c[c.length-1];break}}n?.focus()};return(0,j.jsx)("ul",{role:"tablist","aria-orientation":"horizontal",className:(0,i.Z)("tabs",{"tabs--block":s},n),children:o.map((e=>{let{value:n,label:s,attributes:r}=e;return(0,j.jsx)("li",{role:"tab",tabIndex:t===n?0:-1,"aria-selected":t===n,ref:e=>c.push(e),onKeyDown:u,onClick:d,...r,className:(0,i.Z)("tabs__item",g.tabItem,r?.className,{"tabs__item--active":t===n}),children:s??n},n)}))})}function y(e){let{lazy:n,children:s,selectedValue:i}=e;const r=(Array.isArray(s)?s:[s]).filter(Boolean);if(n){const e=r.find((e=>e.props.value===i));return e?(0,t.cloneElement)(e,{className:"margin-top--md"}):null}return(0,j.jsx)("div",{className:"margin-top--md",children:r.map(((e,n)=>(0,t.cloneElement)(e,{key:n,hidden:e.props.value!==i})))})}function w(e){const n=x(e);return(0,j.jsxs)("div",{className:(0,i.Z)("tabs-container",g.tabList),children:[(0,j.jsx)(b,{...n,...e}),(0,j.jsx)(y,{...n,...e})]})}function v(e){const n=(0,f.Z)();return(0,j.jsx)(w,{...e,children:u(e.children)},String(n))}},1151:(e,n,s)=>{s.d(n,{Z:()=>o,a:()=>l});var t=s(7294);const i={},r=t.createContext(i);function l(e){const n=t.useContext(r);return t.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function o(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(i):e.components||i:l(e.components),t.createElement(r.Provider,{value:n},e.children)}}}]);