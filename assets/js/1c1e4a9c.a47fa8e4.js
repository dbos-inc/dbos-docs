"use strict";(self.webpackChunkdbos_docs=self.webpackChunkdbos_docs||[]).push([[76],{3100:(e,n,i)=>{i.r(n),i.d(n,{assets:()=>l,contentTitle:()=>r,default:()=>h,frontMatter:()=>t,metadata:()=>a,toc:()=>c});var s=i(4848),o=i(8453);const t={sidebar_position:7,title:"Configuration",description:"DBOS configuration reference",pagination_next:null},r=void 0,a={id:"python/reference/configuration",title:"Configuration",description:"DBOS configuration reference",source:"@site/docs/python/reference/configuration.md",sourceDirName:"python/reference",slug:"/python/reference/configuration",permalink:"/python/reference/configuration",draft:!1,unlisted:!1,tags:[],version:"current",sidebarPosition:7,frontMatter:{sidebar_position:7,title:"Configuration",description:"DBOS configuration reference",pagination_next:null},sidebar:"tutorialSidebar",previous:{title:"DBOS CLI",permalink:"/python/reference/cli"}},l={},c=[{value:"Fields",id:"fields",level:3},{value:"Database",id:"database",level:3},{value:"Runtime",id:"runtime",level:3},{value:"Environment Variables",id:"environment-variables",level:3},{value:"Application",id:"application",level:3},{value:"Telemetry",id:"telemetry",level:3},{value:"Logs",id:"logs",level:4},{value:"OTLPExporter",id:"otlpexporter",level:4},{value:"Configuration Schema File",id:"configuration-schema-file",level:3},{value:"Accessing Configuration From Code",id:"accessing-configuration-from-code",level:3}];function d(e){const n={a:"a",admonition:"admonition",code:"code",h3:"h3",h4:"h4",hr:"hr",li:"li",p:"p",pre:"pre",strong:"strong",ul:"ul",...(0,o.R)(),...e.components};return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(n.p,{children:"You can configure DBOS with a configuration file.\nValid configuration files must be:"}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsxs)(n.li,{children:["Named ",(0,s.jsx)(n.code,{children:"dbos-config.yaml"})]}),"\n",(0,s.jsx)(n.li,{children:"Located at the application package root."}),"\n",(0,s.jsxs)(n.li,{children:["Valid ",(0,s.jsx)(n.a,{href:"https://yaml.org/",children:"YAML"})," conforming to the schema described below."]}),"\n"]}),"\n",(0,s.jsx)(n.admonition,{type:"info",children:(0,s.jsxs)(n.p,{children:["You can use environment variables for configuration values through the syntax ",(0,s.jsx)(n.code,{children:"key: ${VALUE}"}),". They are expanded during ",(0,s.jsx)(n.code,{children:"dbos start"})," or ",(0,s.jsx)(n.code,{children:"dbos-cloud app deploy"})," and passed to the app securely. We strongly recommend using environment variables for secrets like the database password, as demonstrated below."]})}),"\n",(0,s.jsx)(n.hr,{}),"\n",(0,s.jsx)(n.h3,{id:"fields",children:"Fields"}),"\n",(0,s.jsxs)(n.p,{children:["Each ",(0,s.jsx)(n.code,{children:"dbos-config.yaml"})," file has the following fields and sections:"]}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.strong,{children:"language"}),": The application language field. Must be set to ",(0,s.jsx)(n.code,{children:"python"})," for Python applications."]}),"\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.strong,{children:"database"}),": The ",(0,s.jsx)(n.a,{href:"#database",children:"database"})," section."]}),"\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.strong,{children:"runtimeConfig"}),": The ",(0,s.jsx)(n.a,{href:"#runtime",children:"runtime"})," section."]}),"\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.strong,{children:"env"}),": The ",(0,s.jsx)(n.a,{href:"#environment-variables",children:"environment variables"})," section."]}),"\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.strong,{children:"telemetry"}),": The ",(0,s.jsx)(n.a,{href:"#telemetry",children:"telemetry"})," section."]}),"\n"]}),"\n",(0,s.jsx)(n.hr,{}),"\n",(0,s.jsx)(n.h3,{id:"database",children:"Database"}),"\n",(0,s.jsx)(n.p,{children:"The database section is used to set up the connection to the database.\nDBOS currently only supports Postgres-compatible databases.\nEvery field is required unless otherwise specified."}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.strong,{children:"hostname"}),": Database server hostname. For local deployment only, not used in DBOS Cloud."]}),"\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.strong,{children:"port"}),": Database server port. For local deployment only, not used in DBOS Cloud."]}),"\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.strong,{children:"username"}),": Username with which to connect to the database server. For local deployment only, not used in DBOS Cloud."]}),"\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.strong,{children:"password"}),": Password with which to connect to the database server.  We recommend using an environment variable for this field, instead of plain text. For local deployment only, not used in DBOS Cloud."]}),"\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.strong,{children:"app_db_name"}),": (optional): Name of the application database. If not supplied, the application name (with dashes replaced with underscores for compatibility) is used instead."]}),"\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.strong,{children:"sys_db_name"})," (optional): Name of the system database in which DBOS stores internal state. Defaults to ",(0,s.jsx)(n.code,{children:"{app_db_name}_dbos_sys"}),".  For local deployment only, not used in DBOS Cloud."]}),"\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.strong,{children:"ssl_ca"})," (optional): If using SSL/TLS to securely connect to a database, path to an SSL root certificate file.  Equivalent to the ",(0,s.jsx)(n.a,{href:"https://www.postgresql.org/docs/current/libpq-ssl.html",children:(0,s.jsx)(n.code,{children:"sslrootcert"})})," connection parameter in ",(0,s.jsx)(n.code,{children:"psql"}),"."]}),"\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.strong,{children:"local_suffix"})," (optional): Whether to suffix ",(0,s.jsx)(n.code,{children:"app_db_name"})," with '_local'. Set to true when doing local development using a DBOS Cloud database. For local development only, not used in DBOS Cloud."]}),"\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.strong,{children:"migrate"})," (optional): A list of commands to run to apply your application's schema to the database."]}),"\n"]}),"\n",(0,s.jsxs)(n.p,{children:[(0,s.jsx)(n.strong,{children:"Example"}),":"]}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-yaml",children:"database:\n  hostname: 'localhost'\n  port: 5432\n  username: 'postgres'\n  password: ${PGPASSWORD}\n  migrate:\n    - alembic upgrade head\n"})}),"\n",(0,s.jsx)(n.admonition,{type:"info",children:(0,s.jsxs)(n.p,{children:["The role with which DBOS connects to Postgres must have ",(0,s.jsx)(n.a,{href:"https://www.postgresql.org/docs/current/ddl-priv.html#DDL-PRIV-CREATE",children:(0,s.jsx)(n.code,{children:"CREATE"})})," privileges on both the application database and system database if they already exist.\nIf either does not exist, the Postgres role must have the ",(0,s.jsx)(n.a,{href:"https://www.postgresql.org/docs/current/sql-createdatabase.html",children:(0,s.jsx)(n.code,{children:"CREATEDB"})})," privilege to create them."]})}),"\n",(0,s.jsx)(n.hr,{}),"\n",(0,s.jsx)(n.h3,{id:"runtime",children:"Runtime"}),"\n",(0,s.jsx)(n.p,{children:"This section is used to specify DBOS runtime parameters."}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.strong,{children:"start"}),": The command(s) with which to start your app. Called from ",(0,s.jsx)(n.code,{children:"dbos start"}),"."]}),"\n"]}),"\n",(0,s.jsxs)(n.p,{children:[(0,s.jsx)(n.strong,{children:"Example"}),":"]}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-yaml",children:'runtimeConfig:\n  start:\n    - "fastapi run"\n'})}),"\n",(0,s.jsx)(n.hr,{}),"\n",(0,s.jsx)(n.h3,{id:"environment-variables",children:"Environment Variables"}),"\n",(0,s.jsxs)(n.p,{children:["Applications can optionally use the ",(0,s.jsx)(n.code,{children:"env"})," configuration to define environment variables.\nThese are set in your application before its code is initialized and can be retrieved from ",(0,s.jsx)(n.code,{children:"os.environ"})," like any other environment variables.\nFor example, the ",(0,s.jsx)(n.code,{children:"WEB_PORTAL"})," variable set below could be retrieved from an application as ",(0,s.jsx)(n.code,{children:'os.environ["WEB_PORTAL"]'}),".\nEnvironment variables configured here are automatically exported to and set in DBOS Cloud."]}),"\n",(0,s.jsxs)(n.p,{children:[(0,s.jsx)(n.strong,{children:"Example"}),":"]}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-yaml",children:"env:\n  WEB_PORTAL: 'https://example.com'\n"})}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-python",children:"  portal_url=os.environ.get('WEB_PORTAL', '')\n"})}),"\n",(0,s.jsx)(n.hr,{}),"\n",(0,s.jsx)(n.h3,{id:"application",children:"Application"}),"\n",(0,s.jsxs)(n.p,{children:["Applications can optionally keep a hierarchy of configuration information in the ",(0,s.jsx)(n.code,{children:"application"})," section of the configuration file.\nThe schema for this section is defined by the application.\nThe configuration is available to your application when its code is initialized."]}),"\n",(0,s.jsxs)(n.p,{children:[(0,s.jsx)(n.strong,{children:"Example"}),":"]}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-yaml",children:'application:\n  service_url: \'https://service.org\'\n  service_config:\n    user: "user"\n    password: "password"\n'})}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-python",children:'url = DBOS.config["application"]["service_url"]\npass = DBOS.config["application"]["service_config"]["password"]\n'})}),"\n",(0,s.jsx)(n.hr,{}),"\n",(0,s.jsx)(n.h3,{id:"telemetry",children:"Telemetry"}),"\n",(0,s.jsx)(n.p,{children:"You can use the configuration file to tune the behavior of DBOS logging facility.\nNote all options in this section are optional and will, if not specified, use the default values indicated in the example below."}),"\n",(0,s.jsx)(n.h4,{id:"logs",children:"Logs"}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.strong,{children:"logLevel"}),": Filters, by severity, what logs should be printed. Defaults to ",(0,s.jsx)(n.code,{children:"'INFO'"}),"."]}),"\n"]}),"\n",(0,s.jsxs)(n.p,{children:[(0,s.jsx)(n.strong,{children:"Example"}),":"]}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-yaml",children:"telemetry:\n  logs:\n    logLevel: 'INFO'\n"})}),"\n",(0,s.jsx)(n.hr,{}),"\n",(0,s.jsx)(n.h4,{id:"otlpexporter",children:"OTLPExporter"}),"\n",(0,s.jsx)(n.p,{children:"Configures the Transact OpenTelemetry exporter."}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.strong,{children:"logsEndpoint"}),": The endpoint to which logs are sent."]}),"\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.strong,{children:"tracesEndpoint"}),": The endpoint to which traces are sent."]}),"\n"]}),"\n",(0,s.jsxs)(n.p,{children:["The Transact exporter uses ",(0,s.jsx)(n.a,{href:"https://www.npmjs.com/package/@opentelemetry/exporter-trace-otlp-proto",children:"protobuf over HTTP"}),". An example configuration for a local Jaeger instance with default configuration is shown below."]}),"\n",(0,s.jsxs)(n.p,{children:[(0,s.jsx)(n.strong,{children:"Example"}),":"]}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-yaml",children:"telemetry:\n  OTLPExporter:\n    logsEndpoint: 'http://localhost:4318'\n    tracesEndpoint: 'http://localhost:4318'\n"})}),"\n",(0,s.jsx)(n.h3,{id:"configuration-schema-file",children:"Configuration Schema File"}),"\n",(0,s.jsxs)(n.p,{children:["There is a schema file available for the DBOS configuration file schema ",(0,s.jsx)(n.a,{href:"https://github.com/dbos-inc/dbos-transact-py/blob/main/dbos/dbos-config.schema.json",children:"in our GitHub repo"}),".\nThis schema file can be used to provide an improved YAML editing experience for developer tools that leverage it.\nFor example, the Visual Studio Code ",(0,s.jsx)(n.a,{href:"https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml",children:"RedHat YAML extension"})," provides tooltips, statement completion and real-time validation for editing DBOS config files.\nThis extension provides ",(0,s.jsx)(n.a,{href:"https://github.com/redhat-developer/vscode-yaml#associating-schemas",children:"multiple ways"})," to associate a YAML file with its schema.\nThe easiest is to simply add a comment with a link to the schema at the top of the config file:"]}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-yaml",children:"# yaml-language-server: $schema=https://github.com/dbos-inc/dbos-transact-py/blob/main/dbos/dbos-config.schema.json\n"})}),"\n",(0,s.jsx)(n.h3,{id:"accessing-configuration-from-code",children:"Accessing Configuration From Code"}),"\n",(0,s.jsxs)(n.p,{children:["The information in ",(0,s.jsx)(n.code,{children:"dbos-config.yaml"})," can be accessed from python code using ",(0,s.jsx)(n.code,{children:"DBOS.config"}),"."]}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-python",children:'lang = DBOS.config["language"]  # "python"\nurl = DBOS.config["application"]["service_url"]\n'})})]})}function h(e={}){const{wrapper:n}={...(0,o.R)(),...e.components};return n?(0,s.jsx)(n,{...e,children:(0,s.jsx)(d,{...e})}):d(e)}},8453:(e,n,i)=>{i.d(n,{R:()=>r,x:()=>a});var s=i(6540);const o={},t=s.createContext(o);function r(e){const n=s.useContext(t);return s.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function a(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(o):e.components||o:r(e.components),s.createElement(t.Provider,{value:n},e.children)}}}]);