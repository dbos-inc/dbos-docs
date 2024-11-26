"use strict";(self.webpackChunkdbos_docs=self.webpackChunkdbos_docs||[]).push([[6200],{1056:(e,n,o)=>{o.r(n),o.d(n,{assets:()=>a,contentTitle:()=>s,default:()=>g,frontMatter:()=>i,metadata:()=>l,toc:()=>c});var t=o(4848),r=o(8453);const i={sidebar_position:7,title:"Logging",description:"Learn to use logging in DBOS"},s=void 0,l={id:"typescript/tutorials/logging",title:"Logging",description:"Learn to use logging in DBOS",source:"@site/docs/typescript/tutorials/logging.md",sourceDirName:"typescript/tutorials",slug:"/typescript/tutorials/logging",permalink:"/typescript/tutorials/logging",draft:!1,unlisted:!1,tags:[],version:"current",sidebarPosition:7,frontMatter:{sidebar_position:7,title:"Logging",description:"Learn to use logging in DBOS"},sidebar:"tutorialSidebar",previous:{title:"Workflow Communication",permalink:"/typescript/tutorials/workflow-communication-tutorial"},next:{title:"Testing and Debugging",permalink:"/typescript/tutorials/testing-tutorial"}},a={},c=[{value:"Usage",id:"usage",level:3},{value:"Viewing Logs in DBOS Cloud",id:"viewing-logs-in-dbos-cloud",level:3},{value:"Configuration",id:"configuration",level:3},{value:"Global Logger",id:"global-logger",level:3}];function d(e){const n={a:"a",code:"code",h3:"h3",p:"p",pre:"pre",...(0,r.R)(),...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsxs)(n.p,{children:["In this section we will learn to use DBOS's built-in logging system.\nThe DBOS runtime comes with a global logger you can access through any operation's ",(0,t.jsx)(n.a,{href:"/typescript/reference/contexts",children:"context"}),"."]}),"\n",(0,t.jsx)(n.h3,{id:"usage",children:"Usage"}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-javascript",children:"@GetApi('/greeting/:name')\nstatic async greetingEndpoint(ctx: HandlerContext, @ArgSource(ArgSources.URL) name: string) {\n    ctx.logger.info(\"Logging from the greeting handler\");\n    return `Greeting, ${name}`;\n}\n"})}),"\n",(0,t.jsxs)(n.p,{children:["The logger provides four logging levels: ",(0,t.jsx)(n.code,{children:"info()"}),", ",(0,t.jsx)(n.code,{children:"debug()"}),", ",(0,t.jsx)(n.code,{children:"warn()"})," and ",(0,t.jsx)(n.code,{children:"error()"}),".\nEach accepts and logs any output that can be serialized to JSON.\n",(0,t.jsx)(n.code,{children:"error()"})," additionally logs a stack trace."]}),"\n",(0,t.jsx)(n.h3,{id:"viewing-logs-in-dbos-cloud",children:"Viewing Logs in DBOS Cloud"}),"\n",(0,t.jsxs)(n.p,{children:["You can view your applications' logs in DBOS Cloud through our ",(0,t.jsx)(n.a,{href:"/cloud-tutorials/monitoring-dashboard",children:"monitoring dashboard"}),". It allows you to filter for particular applications or time ranges."]}),"\n",(0,t.jsxs)(n.p,{children:["You can also retrieve logs through the ",(0,t.jsx)(n.a,{href:"/cloud-tutorials/cloud-cli#dbos-cloud-app-logs",children:(0,t.jsx)(n.code,{children:"dbos-cloud app logs"})})," command.\nIn your package root directory, run:"]}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-shell",children:"dbos-cloud app logs\n"})}),"\n",(0,t.jsx)(n.h3,{id:"configuration",children:"Configuration"}),"\n",(0,t.jsxs)(n.p,{children:["In the ",(0,t.jsx)(n.a,{href:"../reference/configuration",children:"configuration file"}),", you can configure the logging level, silence the logger, and request to add context metadata to log entries:"]}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-yaml",children:"...\ntelemetry:\n  logs:\n    logLevel: 'info' # info (default) | debug | warn | emerg | alert | crit | error\n    addContextMetadata: 'true' #\xa0true (default) | false\n    silent: 'false' # false (default) | true\n"})}),"\n",(0,t.jsx)(n.p,{children:"Context metadata includes the workflow identity UUID and the name of the user running the workflow."}),"\n",(0,t.jsx)(n.p,{children:"You can also configure the logging level as a CLI argument to the runtime:"}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-shell",children:"npx dbos start --loglevel debug\n"})}),"\n",(0,t.jsx)(n.h3,{id:"global-logger",children:"Global Logger"}),"\n",(0,t.jsxs)(n.p,{children:["Wherever possible, the logger should be taken from the DBOS Context, as the context logger may have information about the current operation being performed.  ",(0,t.jsx)(n.code,{children:"InitContext"}),", ",(0,t.jsx)(n.code,{children:"MiddlewareContext"}),", and all subtypes of ",(0,t.jsx)(n.code,{children:"DBOSContext"})," provide ",(0,t.jsx)(n.code,{children:"logger"}),"s."]}),"\n",(0,t.jsxs)(n.p,{children:["However, there are exceptional cases where logging is desired outside of the scope of a context, such as in a Koa middleware, or a background task.  For that, it is possible to use ",(0,t.jsx)(n.a,{href:"/typescript/reference/contexts#information-available-outside-of-contexts",children:(0,t.jsx)(n.code,{children:"DBOS.logger"})}),":"]}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-typescript",children:'  DBOS.logger.info("There is no context here, but I need to log something anyway!");\n'})})]})}function g(e={}){const{wrapper:n}={...(0,r.R)(),...e.components};return n?(0,t.jsx)(n,{...e,children:(0,t.jsx)(d,{...e})}):d(e)}},8453:(e,n,o)=>{o.d(n,{R:()=>s,x:()=>l});var t=o(6540);const r={},i=t.createContext(r);function s(e){const n=t.useContext(i);return t.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function l(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(r):e.components||r:s(e.components),t.createElement(i.Provider,{value:n},e.children)}}}]);