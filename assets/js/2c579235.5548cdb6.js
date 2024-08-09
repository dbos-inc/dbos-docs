"use strict";(self.webpackChunkdbos_docs=self.webpackChunkdbos_docs||[]).push([[9033],{5375:(e,n,i)=>{i.r(n),i.d(n,{assets:()=>l,contentTitle:()=>o,default:()=>h,frontMatter:()=>s,metadata:()=>a,toc:()=>c});var t=i(5893),r=i(1151);const s={sidebar_position:11,title:"Using Drizzle",description:"Learn how to build applications with Drizzle and DBOS"},o=void 0,a={id:"tutorials/using-drizzle",title:"Using Drizzle",description:"Learn how to build applications with Drizzle and DBOS",source:"@site/docs/tutorials/using-drizzle.md",sourceDirName:"tutorials",slug:"/tutorials/using-drizzle",permalink:"/tutorials/using-drizzle",draft:!1,unlisted:!1,tags:[],version:"current",sidebarPosition:11,frontMatter:{sidebar_position:11,title:"Using Drizzle",description:"Learn how to build applications with Drizzle and DBOS"},sidebar:"tutorialSidebar",previous:{title:"Configuring Class Instances",permalink:"/tutorials/configured-instances"},next:{title:"Using Knex",permalink:"/tutorials/using-knex"}},l={},c=[{value:"Getting Started",id:"getting-started",level:3},{value:"Schema Management",id:"schema-management",level:3},{value:"Using Drizzle",id:"using-drizzle",level:3},{value:"Configuring Drizzle",id:"configuring-drizzle",level:3}];function d(e){const n={a:"a",admonition:"admonition",code:"code",h3:"h3",p:"p",pre:"pre",...(0,r.a)(),...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.a,{href:"https://orm.drizzle.team/",children:"Drizzle"})," is a lightweight TypeScript ORM.\nIt allows developers to construct SQL queries in native TypeScript.\nIt also supports querying the database with ",(0,t.jsx)(n.a,{href:"https://orm.drizzle.team/docs/sql",children:"raw SQL"}),"."]}),"\n",(0,t.jsx)(n.h3,{id:"getting-started",children:"Getting Started"}),"\n",(0,t.jsxs)(n.p,{children:["An easy way to get started with Drizzle is to bootstrap your application with our Drizzle template.\nThis is similar to the template used in the ",(0,t.jsx)(n.a,{href:"/getting-started/quickstart",children:"quickstart"}),", but built with Drizzle instead of Knex.\nTo download it, run:"]}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-bash",children:"npx -y @dbos-inc/create@latest -t hello-drizzle -n <app-name>\n"})}),"\n",(0,t.jsx)(n.p,{children:"Then, build it, run schema migrations, and start the sample app:"}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-bash",children:"npm run build\nnpx dbos migrate\nnpx dbos start\n"})}),"\n",(0,t.jsxs)(n.p,{children:["To see that it's working, visit this URL in your browser: ",(0,t.jsx)(n.a,{href:"http://localhost:3000/greeting/dbos",children:"http://localhost:3000/greeting/dbos"}),".  You should get this message: ",(0,t.jsx)(n.code,{children:"Hello, dbos! We have made 1 greetings."})," Each time you refresh the page, the counter should go up by one."]}),"\n",(0,t.jsx)(n.h3,{id:"schema-management",children:"Schema Management"}),"\n",(0,t.jsxs)(n.p,{children:["We strongly recommend you manage your database schema using migrations.\nDrizzle provides rich native migration support, with documentation ",(0,t.jsx)(n.a,{href:"https://orm.drizzle.team/docs/migrations",children:"here"}),"."]}),"\n",(0,t.jsxs)(n.p,{children:["Drizzle can automatically generate migrations from your schema.\nTo use this feature, update your schema file (by default ",(0,t.jsx)(n.code,{children:"src/schema.ts"}),", configurable in ",(0,t.jsx)(n.code,{children:"drizzle.config.ts"}),") then run:"]}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{children:"npx drizzle-kit generate --name <migration-name>\n"})}),"\n",(0,t.jsxs)(n.p,{children:["This will create a new migration file named ",(0,t.jsx)(n.code,{children:"drizzle/<sequence-number>_<migration-name>.sql"})," that contains SQL commands to update your database schema."]}),"\n",(0,t.jsx)(n.p,{children:"To apply your migrations to your database, run:"}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{children:"npx dbos migrate\n"})}),"\n",(0,t.jsx)(n.p,{children:"You can also write your own migration by running:"}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-bash",children:"npx drizzle-kit generate --custom --name <migration-name>\n"})}),"\n",(0,t.jsxs)(n.p,{children:["This will create a new empty migration file named ",(0,t.jsx)(n.code,{children:"drizzle/<sequence-number>_<migration-name>.sql"}),".\nYou can implement your migration in SQL in this file."]}),"\n",(0,t.jsx)(n.h3,{id:"using-drizzle",children:"Using Drizzle"}),"\n",(0,t.jsxs)(n.p,{children:["When using DBOS, database operations are performed in ",(0,t.jsx)(n.a,{href:"./transaction-tutorial",children:"transaction functions"}),". Transaction functions must be annotated with the ",(0,t.jsx)(n.a,{href:"../api-reference/decorators#transaction",children:(0,t.jsx)(n.code,{children:"@Transaction"})})," decorator and must have a ",(0,t.jsx)(n.a,{href:"../api-reference/contexts#transactioncontextt",children:(0,t.jsx)(n.code,{children:"TransactionContext<NodePgDatabase>"})})," as their first argument.\nNote that we specify ",(0,t.jsx)(n.code,{children:"NodePgDatabase"})," in angle brackets to use Drizzle."]}),"\n",(0,t.jsxs)(n.p,{children:["Within the transaction function, access your ",(0,t.jsx)(n.a,{href:"https://orm.drizzle.team/docs/overview",children:"Drizzle client"})," from the ",(0,t.jsx)(n.code,{children:".client"})," field of your transaction context.\nFor example, this function inserts a new row into the ",(0,t.jsx)(n.code,{children:"greetings"})," table:"]}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-javascript",children:"export const greetings = pgTable('greetings', {\n  name: text('name'),\n  note: text('note')\n});\n\nexport class DBOSGreetings {\n  @Transaction()\n  static async insertGreeting(ctxt: TransactionContext<NodePgDatabase>, name: string, note: string) {\n    await ctxt.client.insert(greetings).values({name: name, note: note});\n  }\n}\n"})}),"\n",(0,t.jsx)(n.h3,{id:"configuring-drizzle",children:"Configuring Drizzle"}),"\n",(0,t.jsx)(n.admonition,{type:"info",children:(0,t.jsxs)(n.p,{children:["If you are using the ",(0,t.jsx)(n.a,{href:"#getting-started",children:"Drizzle template"}),", this configuration is done for you."]})}),"\n",(0,t.jsxs)(n.p,{children:["To enable Drizzle, you must set the ",(0,t.jsx)(n.code,{children:"app_db_client"})," field in the ",(0,t.jsx)(n.a,{href:"/api-reference/configuration",children:"DBOS configuration file"})," to ",(0,t.jsx)(n.code,{children:"drizzle"}),".\nYou should also configure Drizzle migration commands.\nHere is an example of a configuration file set up for Drizzle:"]}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-yaml",children:"language: node\ndatabase:\n  hostname: localhost\n  port: 5432\n  username: postgres\n  password: ${PGPASSWORD}\n  app_db_name: dbos_hello_app\n  connectionTimeoutMillis: 3000\n  app_db_client: drizzle\n  migrate:\n    - npx drizzle-kit migrate\nruntimeConfig:\n  entrypoints:\n    - dist/operations.js\n"})}),"\n",(0,t.jsxs)(n.p,{children:["Many Drizzle commands, such as those for ",(0,t.jsx)(n.a,{href:"#schema-management",children:"schema migration"}),", require a ",(0,t.jsx)(n.a,{href:"https://orm.drizzle.team/kit-docs/conf",children:(0,t.jsx)(n.code,{children:"drizzle.config.ts"})})," configuration file.\nTo avoid managing your configuration in two places, we recommend ",(0,t.jsx)(n.code,{children:"drizzle.config.ts"})," load configuration information from your ",(0,t.jsx)(n.a,{href:"/api-reference/configuration",children:"DBOS configuration file"}),".\nHere is an example of a ",(0,t.jsx)(n.code,{children:"drizzle.config.ts"})," that does this:"]}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-typescript",children:"import { defineConfig } from 'drizzle-kit';\n\nconst { parseConfigFile } = require('@dbos-inc/dbos-sdk');\n\nconst [dbosConfig, ] = parseConfigFile();\n\nexport default defineConfig({\n  schema: './src/schema.ts',\n  out: './drizzle',\n  dialect: 'postgresql',\n  dbCredentials: {\n    host: dbosConfig.poolConfig.host,\n    port: dbosConfig.poolConfig.port,\n    user: dbosConfig.poolConfig.user,\n    password: dbosConfig.poolConfig.password,\n    database: dbosConfig.poolConfig.database,\n    ssl: dbosConfig.poolConfig.ssl,\n  },\n});\n"})})]})}function h(e={}){const{wrapper:n}={...(0,r.a)(),...e.components};return n?(0,t.jsx)(n,{...e,children:(0,t.jsx)(d,{...e})}):d(e)}},1151:(e,n,i)=>{i.d(n,{Z:()=>a,a:()=>o});var t=i(7294);const r={},s=t.createContext(r);function o(e){const n=t.useContext(s);return t.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function a(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(r):e.components||r:o(e.components),t.createElement(s.Provider,{value:n},e.children)}}}]);