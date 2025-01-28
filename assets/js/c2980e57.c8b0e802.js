"use strict";(self.webpackChunkdbos_docs=self.webpackChunkdbos_docs||[]).push([[2602],{5069:(e,n,s)=>{s.r(n),s.d(n,{assets:()=>a,contentTitle:()=>o,default:()=>p,frontMatter:()=>c,metadata:()=>t,toc:()=>l});const t=JSON.parse('{"id":"cloud-tutorials/secrets","title":"Secrets and Environment Variables","description":"We recommend using secrets to securely manage your application\'s secrets and environment variables in DBOS Cloud.","source":"@site/docs/cloud-tutorials/secrets.md","sourceDirName":"cloud-tutorials","slug":"/cloud-tutorials/secrets","permalink":"/cloud-tutorials/secrets","draft":false,"unlisted":false,"tags":[],"version":"current","sidebarPosition":9,"frontMatter":{"sidebar_position":9,"title":"Secrets and Environment Variables"},"sidebar":"tutorialSidebar","previous":{"title":"Time Travel Debugging","permalink":"/cloud-tutorials/timetravel-debugging"},"next":{"title":"CI/CD Best Practices","permalink":"/cloud-tutorials/cicd"}}');var r=s(4848),i=s(8453);const c={sidebar_position:9,title:"Secrets and Environment Variables"},o=void 0,a={},l=[{value:"Managing and Using Secrets",id:"managing-and-using-secrets",level:2},{value:"Importing Secrets",id:"importing-secrets",level:2},{value:"Listing Secrets",id:"listing-secrets",level:2}];function d(e){const n={a:"a",code:"code",em:"em",h2:"h2",p:"p",pre:"pre",...(0,i.R)(),...e.components},{TabItem:t,Tabs:c}=n;return t||u("TabItem",!0),c||u("Tabs",!0),(0,r.jsxs)(r.Fragment,{children:[(0,r.jsxs)(n.p,{children:["We recommend using ",(0,r.jsx)(n.em,{children:"secrets"})," to securely manage your application's secrets and environment variables in DBOS Cloud.\nSecrets are key-value pairs that are securely stored in DBOS Cloud and made available to your application as environment variables."]}),"\n",(0,r.jsx)(n.h2,{id:"managing-and-using-secrets",children:"Managing and Using Secrets"}),"\n",(0,r.jsx)(n.p,{children:"You can create or update a secret using the Cloud CLI:"}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{children:"dbos-cloud app secrets create -s <secret-name> -v <secret-value>\n"})}),"\n",(0,r.jsxs)(n.p,{children:["For example, to create a secret named ",(0,r.jsx)(n.code,{children:"API_KEY"})," with value ",(0,r.jsx)(n.code,{children:"abc123"}),", run:"]}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{children:"dbos-cloud app secrets create -s API_KEY -v abc123\n"})}),"\n",(0,r.jsxs)(n.p,{children:["When you next redeploy your application, its environment will be updated to contain the ",(0,r.jsx)(n.code,{children:"API_KEY"})," environment variable with value ",(0,r.jsx)(n.code,{children:"abc123"}),".\nYou can access it like any other environment variable:"]}),"\n",(0,r.jsxs)(c,{groupId:"language",children:[(0,r.jsx)(t,{value:"python",label:"Python",children:(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-python",children:"key = os.environ['API_KEY'] # Value is abc123\n"})})}),(0,r.jsx)(t,{value:"typescript",label:"Typescript",children:(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-typescript",children:"const key = process.env.API_KEY; // Value is abc123\n"})})})]}),"\n",(0,r.jsxs)(n.p,{children:["Additionally, you can manage your application's secrets from the secrets page of the ",(0,r.jsx)(n.a,{href:"https://console.dbos.dev",children:"cloud console"}),"."]}),"\n",(0,r.jsx)("img",{src:s(3191).A,alt:"Secrets Page",width:"1000",className:"custom-img"}),"\n",(0,r.jsx)(n.h2,{id:"importing-secrets",children:"Importing Secrets"}),"\n",(0,r.jsxs)(n.p,{children:["You can import the contents of a ",(0,r.jsx)(n.code,{children:".env"})," file as secrets.\nAllowed syntax for the ",(0,r.jsx)(n.code,{children:".env"})," file is described ",(0,r.jsx)(n.a,{href:"https://dotenvx.com/docs/env-file",children:"here"}),". Note that interpolation is supported but command substitution and encryption are currently not.\nImport a ",(0,r.jsx)(n.code,{children:".env"})," file with the following command:"]}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-shell",children:"dbos-cloud app secrets import -d <path-to-dotenv-file>\n"})}),"\n",(0,r.jsx)(n.p,{children:"For example:"}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-shell",children:"dbos-cloud app secrets import -d .env\n"})}),"\n",(0,r.jsx)(n.h2,{id:"listing-secrets",children:"Listing Secrets"}),"\n",(0,r.jsx)(n.p,{children:"You can list the names of your application's secrets with:"}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{children:"dbos-cloud app secrets list\n"})})]})}function p(e={}){const{wrapper:n}={...(0,i.R)(),...e.components};return n?(0,r.jsx)(n,{...e,children:(0,r.jsx)(d,{...e})}):d(e)}function u(e,n){throw new Error("Expected "+(n?"component":"object")+" `"+e+"` to be defined: you likely forgot to import, pass, or provide it.")}},3191:(e,n,s)=>{s.d(n,{A:()=>t});const t=s.p+"assets/images/secrets-page-1337f68770aabd0449ffc56a77d4ec43.png"},8453:(e,n,s)=>{s.d(n,{R:()=>c,x:()=>o});var t=s(6540);const r={},i=t.createContext(r);function c(e){const n=t.useContext(i);return t.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function o(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(r):e.components||r:c(e.components),t.createElement(i.Provider,{value:n},e.children)}}}]);