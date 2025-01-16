"use strict";(self.webpackChunkdbos_docs=self.webpackChunkdbos_docs||[]).push([[6607],{5687:(e,n,t)=>{t.r(n),t.d(n,{assets:()=>a,contentTitle:()=>o,default:()=>h,frontMatter:()=>r,metadata:()=>c,toc:()=>d});var s=t(4848),i=t(8453);const r={sidebar_position:10,title:"Project Structure",description:"Learn about the structure of a DBOS project",pagination_next:null},o=void 0,c={id:"typescript/tutorials/development/application-structure-explanation",title:"Project Structure",description:"Learn about the structure of a DBOS project",source:"@site/docs/typescript/tutorials/development/application-structure-explanation.md",sourceDirName:"typescript/tutorials/development",slug:"/typescript/tutorials/development/application-structure-explanation",permalink:"/typescript/tutorials/development/application-structure-explanation",draft:!1,unlisted:!1,tags:[],version:"current",sidebarPosition:10,frontMatter:{sidebar_position:10,title:"Project Structure",description:"Learn about the structure of a DBOS project",pagination_next:null},sidebar:"tutorialSidebar",previous:{title:"Creating Custom Event Receivers",permalink:"/typescript/tutorials/requestsandevents/custom-event-receiver"}},a={},d=[{value:"Projects With Start Commands",id:"projects-with-start-commands",level:3},{value:"Projects With Entrypoints",id:"projects-with-entrypoints",level:3},{value:"Other Files",id:"other-files",level:3}];function l(e){const n={a:"a",code:"code",em:"em",h3:"h3",li:"li",p:"p",pre:"pre",ul:"ul",...(0,i.R)(),...e.components};return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsxs)(n.p,{children:["When you initialize a DBOS project with ",(0,s.jsx)(n.code,{children:"npx @dbos-inc/create"})," (such as the ",(0,s.jsx)(n.code,{children:"dbos-knex"})," starter here), it typically has the following structure:"]}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-bash",children:"dbos-knex/\n\u251c\u2500\u2500 README.md\n\u251c\u2500\u2500 dbos-config.yaml\n\u251c\u2500\u2500 eslint.config.js\n\u251c\u2500\u2500 jest.config.js\n\u251c\u2500\u2500 knexfile.js\n\u251c\u2500\u2500 migrations/\n\u251c\u2500\u2500 node_modules/\n\u251c\u2500\u2500 package.json\n\u251c\u2500\u2500 package-lock.json\n\u251c\u2500\u2500 src/\n\u2502   |\u2500\u2500 main.ts\n\u2502   \u2514\u2500\u2500 main.test.ts\n\u251c\u2500\u2500 start_postgres_docker.js\n\u2514\u2500\u2500 tsconfig.json\n"})}),"\n",(0,s.jsxs)(n.p,{children:["As most of these files are common to any TypeScript / NodeJS project, the most interesting files are ",(0,s.jsx)(n.code,{children:"main.ts"})," and ",(0,s.jsx)(n.code,{children:"dbos-config.yaml"}),"."]}),"\n",(0,s.jsxs)(n.p,{children:[(0,s.jsx)(n.code,{children:"src/main.ts"})," contains the application's source code."]}),"\n",(0,s.jsxs)(n.p,{children:[(0,s.jsx)(n.code,{children:"dbos-config.yaml"})," tells DBOS how to run the program.  Application execution begins in ",(0,s.jsx)(n.code,{children:"main.ts"})," because the ",(0,s.jsx)(n.a,{href:"#projects-with-start-commands",children:(0,s.jsx)(n.em,{children:"start command"})})," defined in ",(0,s.jsx)(n.code,{children:"dbos-config.yaml"})," is ",(0,s.jsx)(n.code,{children:"node dist/main.js"}),", which tells Node to execute the compiled JavaScript file for ",(0,s.jsx)(n.code,{children:"src/main.ts"}),".\n",(0,s.jsx)(n.code,{children:"dbos-config.yaml"})," also defines the configuration of a DBOS project, including database connection information, migration configuration, and global logging configuration.\nAll options are documented in our ",(0,s.jsx)(n.a,{href:"../../reference/configuration",children:"configuration reference"}),"."]}),"\n",(0,s.jsx)(n.h3,{id:"projects-with-start-commands",children:"Projects With Start Commands"}),"\n",(0,s.jsxs)(n.p,{children:[(0,s.jsx)(n.code,{children:"dbos-config.yaml"})," may contain a ",(0,s.jsx)(n.code,{children:"start"})," command.  If so, this command will be used to start the application."]}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-yaml",children:"runtimeConfig:\n  start:\n    - node dist/main.js\n"})}),"\n",(0,s.jsxs)(n.p,{children:["Note that this start command references a ",(0,s.jsx)(n.code,{children:".js"})," file, which gets created from ",(0,s.jsx)(n.code,{children:"main.ts"})," as part of the ",(0,s.jsx)(n.code,{children:"build"})," command in ",(0,s.jsx)(n.code,{children:"package.json"}),".  The code in ",(0,s.jsx)(n.code,{children:"main.ts"})," will ",(0,s.jsx)(n.a,{href:"/typescript/reference/transactapi/dbos-class#application-lifecycle",children:"do setup and launch DBOS"}),"."]}),"\n",(0,s.jsx)(n.h3,{id:"projects-with-entrypoints",children:"Projects With Entrypoints"}),"\n",(0,s.jsxs)(n.p,{children:["Other templates will be similar, but may have additional files under ",(0,s.jsx)(n.code,{children:"src/"}),":"]}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{children:"\u251c\u2500\u2500 src/\n\u2502   |\u2500\u2500 main.ts\n\u2502   \u2514\u2500\u2500 operations.ts\n"})}),"\n",(0,s.jsxs)(n.p,{children:["In this structure, ",(0,s.jsx)(n.code,{children:"src/operations.ts"})," is an ",(0,s.jsx)(n.em,{children:"entrypoint"})," file, where DBOS looks for event handlers, such as ",(0,s.jsx)(n.a,{href:"../scheduled-workflows",children:"scheduled workflows"}),", ",(0,s.jsx)(n.a,{href:"../requestsandevents/kafka-integration",children:"kafka consumers"}),", or, if you are using DBOS's built in Koa server, ",(0,s.jsx)(n.a,{href:"../requestsandevents/http-serving-tutorial",children:"request handlers"}),".\nAt startup, the DBOS runtime automatically loads all classes that are exported or (directly and indirectly) referenced from these files, registering their decorated functions and serving any endpoints."]}),"\n",(0,s.jsxs)(n.p,{children:["The entrypoints are listed in the ",(0,s.jsxs)(n.a,{href:"../../reference/configuration#runtime",children:[(0,s.jsx)(n.code,{children:"runtimeConfig"})," section of ",(0,s.jsx)(n.code,{children:"dbos-config.yaml"})]}),":"]}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-yaml",children:"runtimeConfig:\n  entrypoints:\n    - dist/operations.js\n"})}),"\n",(0,s.jsxs)(n.p,{children:["Note that, as with the ",(0,s.jsx)(n.a,{href:"#projects-with-start-commands",children:"start command"}),", the ",(0,s.jsx)(n.code,{children:"entrypoints"})," are compiled JavaScript files, rather than the original source ",(0,s.jsx)(n.code,{children:".ts"})," files.  These files are produced by the ",(0,s.jsx)(n.code,{children:"build"})," command in ",(0,s.jsx)(n.code,{children:"package.json"}),"."]}),"\n",(0,s.jsx)(n.p,{children:"It is not necessary to add entrypoints for files that are already referenced by the start command or other entrypoint file(s), as these will be loaded and decorated methods will be registered automatically."}),"\n",(0,s.jsx)(n.h3,{id:"other-files",children:"Other Files"}),"\n",(0,s.jsx)(n.p,{children:"As for the rest of the directory:"}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.code,{children:"src/main.test.ts"})," contains example unit tests written with ",(0,s.jsx)(n.a,{href:"https://jestjs.io/",children:"Jest"}),". ",(0,s.jsx)(n.code,{children:"jest.config.js"})," contains Jest configuration."]}),"\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.code,{children:"knexfile.js"})," is a configuration file for ",(0,s.jsx)(n.a,{href:"https://knexjs.org",children:"Knex"}),", which this app uses as a query builder and migration tool."]}),"\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.code,{children:"migrations"})," is initialized with a Knex database migration."]}),"\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.code,{children:"node_modules"}),", ",(0,s.jsx)(n.code,{children:"package.json"}),", ",(0,s.jsx)(n.code,{children:"package-lock.json"}),", and ",(0,s.jsx)(n.code,{children:"tsconfig.json"})," are needed by all Node/TypeScript projects. ",(0,s.jsx)(n.code,{children:"eslint.config.js"})," is used by the JavaScript/TypeScript linter, ",(0,s.jsx)(n.a,{href:"https://eslint.org/",children:"ESLint"}),"."]}),"\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.code,{children:"start_postgres_docker.js"})," is a convenience script that initializes a Docker Postgres container."]}),"\n"]})]})}function h(e={}){const{wrapper:n}={...(0,i.R)(),...e.components};return n?(0,s.jsx)(n,{...e,children:(0,s.jsx)(l,{...e})}):l(e)}},8453:(e,n,t)=>{t.d(n,{R:()=>o,x:()=>c});var s=t(6540);const i={},r=s.createContext(i);function o(e){const n=s.useContext(r);return s.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function c(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(i):e.components||i:o(e.components),s.createElement(r.Provider,{value:n},e.children)}}}]);