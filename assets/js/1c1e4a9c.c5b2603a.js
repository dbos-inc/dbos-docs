"use strict";(self.webpackChunkdbos_docs=self.webpackChunkdbos_docs||[]).push([[76],{5102:(e,n,s)=>{s.r(n),s.d(n,{assets:()=>l,contentTitle:()=>r,default:()=>h,frontMatter:()=>a,metadata:()=>i,toc:()=>c});const i=JSON.parse('{"id":"python/reference/configuration","title":"Configuration","description":"Configuring DBOS","source":"@site/docs/python/reference/configuration.md","sourceDirName":"python/reference","slug":"/python/reference/configuration","permalink":"/python/reference/configuration","draft":false,"unlisted":false,"tags":[],"version":"current","sidebarPosition":12,"frontMatter":{"sidebar_position":12,"title":"Configuration"},"sidebar":"tutorialSidebar","previous":{"title":"DBOS Client","permalink":"/python/reference/client"},"next":{"title":"DBOS CLI","permalink":"/python/reference/cli"}}');var o=s(4848),t=s(8453);const a={sidebar_position:12,title:"Configuration"},r=void 0,l={},c=[{value:"Configuring DBOS",id:"configuring-dbos",level:2},{value:"DBOS Configuration File",id:"dbos-configuration-file",level:2},{value:"Configuration File Fields",id:"configuration-file-fields",level:3},{value:"Database Section",id:"database-section",level:4},{value:"Runtime Section",id:"runtime-section",level:4},{value:"Configuration Schema File",id:"configuration-schema-file",level:3}];function d(e){const n={a:"a",admonition:"admonition",code:"code",h2:"h2",h3:"h3",h4:"h4",li:"li",p:"p",pre:"pre",strong:"strong",ul:"ul",...(0,t.R)(),...e.components};return(0,o.jsxs)(o.Fragment,{children:[(0,o.jsx)(n.h2,{id:"configuring-dbos",children:"Configuring DBOS"}),"\n",(0,o.jsxs)(n.p,{children:["To configure DBOS, pass a ",(0,o.jsx)(n.code,{children:"DBOSConfig"})," object to its constructor.\nFor example:"]}),"\n",(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{className:"language-python",children:'config: DBOSConfig = {\n    "name": "dbos-example",\n    "database_url": os.environ["DBOS_DATABASE_URL"],\n}\nDBOS(config=config)\n'})}),"\n",(0,o.jsxs)(n.p,{children:["The ",(0,o.jsx)(n.code,{children:"DBOSConfig"})," object has the following fields.\nAll fields except ",(0,o.jsx)(n.code,{children:"name"})," are optional."]}),"\n",(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{className:"language-python",children:"class DBOSConfig(TypedDict):\n    name: str\n    database_url: Optional[str]\n    sys_db_name: Optional[str]\n    app_db_pool_size: Optional[int]\n    sys_db_pool_size: Optional[int]\n    log_level: Optional[str]\n    otlp_traces_endpoints: Optional[List[str]]\n    run_admin_server: Optional[bool]\n    admin_port: Optional[int]\n"})}),"\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.strong,{children:"name"}),": Your application's name."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.strong,{children:"database_url"}),": A connection string to a Postgres database. The supported format is"]}),"\n"]}),"\n",(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{children:"postgresql://[username]:[password]@[hostname]:[port]/[database name]\n"})}),"\n",(0,o.jsxs)(n.p,{children:["The ",(0,o.jsx)(n.code,{children:"sslmode=require"}),", ",(0,o.jsx)(n.code,{children:"sslrootcert"})," and ",(0,o.jsx)(n.code,{children:"connect_timeout"})," parameter keywords are also supported.\nDefaults to:"]}),"\n",(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{children:"postgresql://postgres:dbos@localhost:5432/[application name]\n"})}),"\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.strong,{children:"sys_db_name"}),": Name for the ",(0,o.jsx)(n.a,{href:"../../explanations/system-tables",children:"system database"})," in which DBOS stores internal state. Defaults to ",(0,o.jsx)(n.code,{children:"{database name}_dbos_sys"}),"."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.strong,{children:"app_db_pool_size"}),": The size of the connection pool used by ",(0,o.jsx)(n.a,{href:"/python/tutorials/transaction-tutorial",children:"transactions"})," to connect to your application database. Defaults to 20."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.strong,{children:"sys_db_pool_size"}),": The size of the connection pool used for the ",(0,o.jsx)(n.a,{href:"../../explanations/system-tables",children:"DBOS system database"}),". Defaults to 20."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.strong,{children:"log_level"}),": Configure the ",(0,o.jsx)(n.a,{href:"../tutorials/logging-and-tracing#logging",children:"DBOS logger"})," severity. Defaults to ",(0,o.jsx)(n.code,{children:"INFO"}),"."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.strong,{children:"otlp_traces_endpoints"}),": DBOS operations ",(0,o.jsx)(n.a,{href:"../tutorials/logging-and-tracing#tracing",children:"automatically generate OpenTelemetry Traces"}),". Use this field to declare a list of OTLP-compatible receivers."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.strong,{children:"run_admin_server"}),": Whether to run an ",(0,o.jsx)(n.a,{href:"/production/self-hosting/admin-api",children:"HTTP admin server"})," for workflow management operations. Defaults to True."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.strong,{children:"admin_port"}),": The port on which the admin server runs. Defaults to 3001."]}),"\n"]}),"\n",(0,o.jsx)(n.h2,{id:"dbos-configuration-file",children:"DBOS Configuration File"}),"\n",(0,o.jsxs)(n.p,{children:["Many tools in the DBOS ecosystem are configured by a ",(0,o.jsx)(n.code,{children:"dbos-config.yaml"})," file.\nTools that use ",(0,o.jsx)(n.code,{children:"dbos-config.yaml"})," include the ",(0,o.jsx)(n.a,{href:"/python/reference/cli",children:"DBOS CLI"}),", ",(0,o.jsx)(n.a,{href:"/python/tutorials/debugging",children:"DBOS debugger"}),", and ",(0,o.jsx)(n.a,{href:"/production/dbos-cloud/deploying-to-cloud",children:"DBOS Cloud"}),".\nAdditionally, the DBOS library will fall back to ",(0,o.jsx)(n.code,{children:"dbos-config.yaml"})," if no ",(0,o.jsx)(n.code,{children:"DBOSConfig"})," object is provided to the DBOS constructor."]}),"\n",(0,o.jsxs)(n.p,{children:["You can create a ",(0,o.jsx)(n.code,{children:"dbos-config.yaml"})," with default parameters with:"]}),"\n",(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{className:"language-shell",children:"dbos init <app-name> --config\n"})}),"\n",(0,o.jsx)(n.h3,{id:"configuration-file-fields",children:"Configuration File Fields"}),"\n",(0,o.jsx)(n.admonition,{type:"info",children:(0,o.jsxs)(n.p,{children:["You can use environment variables for configuration values through the syntax ",(0,o.jsx)(n.code,{children:"field: ${VALUE}"}),"."]})}),"\n",(0,o.jsxs)(n.p,{children:["Each ",(0,o.jsx)(n.code,{children:"dbos-config.yaml"})," file has the following fields and sections:"]}),"\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.strong,{children:"name"}),": Your application's name. Must match the name supplied to the DBOS constructor."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.strong,{children:"language"}),": The application language. Must be set to ",(0,o.jsx)(n.code,{children:"python"})," for Python applications."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.strong,{children:"database_url"}),": A connection string to a Postgres database. This connection string is used by tools such as the ",(0,o.jsx)(n.a,{href:"/python/reference/cli",children:"DBOS CLI"})," and ",(0,o.jsx)(n.a,{href:"/python/tutorials/debugging",children:"DBOS debugger"}),". It has the same format as (and should match) the connection string you pass to the DBOS constructor."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.strong,{children:"database"}),": The ",(0,o.jsx)(n.a,{href:"#database-section",children:"database section"}),"."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.strong,{children:"runtimeConfig"}),": The ",(0,o.jsx)(n.a,{href:"#runtime-section",children:"runtime section"}),"."]}),"\n"]}),"\n",(0,o.jsx)(n.h4,{id:"database-section",children:"Database Section"}),"\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.strong,{children:"migrate"}),": A list of commands to run to apply your application's schema to the database."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.strong,{children:"sys_db_name"}),": Name for the ",(0,o.jsx)(n.a,{href:"../../explanations/system-tables",children:"system database"})," in which DBOS stores internal state. Defaults to ",(0,o.jsx)(n.code,{children:"{database name}_dbos_sys"}),"."]}),"\n"]}),"\n",(0,o.jsxs)(n.p,{children:[(0,o.jsx)(n.strong,{children:"Example"}),":"]}),"\n",(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{className:"language-yaml",children:"database:\n  sys_db_name: 'my_dbos_system_db'\n  migrate:\n    - alembic upgrade head\n"})}),"\n",(0,o.jsx)(n.h4,{id:"runtime-section",children:"Runtime Section"}),"\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.strong,{children:"start"}),": The command(s) with which to start your app. Called from ",(0,o.jsx)(n.a,{href:"/python/reference/cli#dbos-start",children:(0,o.jsx)(n.code,{children:"dbos start"})}),", which is used to start your app in DBOS Cloud."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.strong,{children:"setup"}),": Setup commands to run before your application is built in DBOS Cloud. Used only in DBOS Cloud. Documentation ",(0,o.jsx)(n.a,{href:"/production/dbos-cloud/application-management#customizing-microvm-setup",children:"here"}),"."]}),"\n"]}),"\n",(0,o.jsxs)(n.p,{children:[(0,o.jsx)(n.strong,{children:"Example"}),":"]}),"\n",(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{className:"language-yaml",children:'runtimeConfig:\n  start:\n    - "fastapi run"\n'})}),"\n",(0,o.jsx)(n.h3,{id:"configuration-schema-file",children:"Configuration Schema File"}),"\n",(0,o.jsxs)(n.p,{children:["There is a schema file available for the DBOS configuration file schema ",(0,o.jsx)(n.a,{href:"https://github.com/dbos-inc/dbos-transact-py/blob/main/dbos/dbos-config.schema.json",children:"on GitHub"}),".\nThis schema file can be used to provide an improved YAML editing experience for developer tools that leverage it.\nFor example, the Visual Studio Code ",(0,o.jsx)(n.a,{href:"https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml",children:"RedHat YAML extension"})," provides tooltips, statement completion and real-time validation for editing DBOS config files.\nThis extension provides ",(0,o.jsx)(n.a,{href:"https://github.com/redhat-developer/vscode-yaml#associating-schemas",children:"multiple ways"})," to associate a YAML file with its schema.\nThe easiest is to simply add a comment with a link to the schema at the top of the config file:"]}),"\n",(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{className:"language-yaml",children:"# yaml-language-server: $schema=https://github.com/dbos-inc/dbos-transact-py/blob/main/dbos/dbos-config.schema.json\n"})})]})}function h(e={}){const{wrapper:n}={...(0,t.R)(),...e.components};return n?(0,o.jsx)(n,{...e,children:(0,o.jsx)(d,{...e})}):d(e)}},8453:(e,n,s)=>{s.d(n,{R:()=>a,x:()=>r});var i=s(6540);const o={},t=i.createContext(o);function a(e){const n=i.useContext(t);return i.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function r(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(o):e.components||o:a(e.components),i.createElement(t.Provider,{value:n},e.children)}}}]);