"use strict";(self.webpackChunkdbos_docs=self.webpackChunkdbos_docs||[]).push([[9082],{455:(e,t,s)=>{s.r(t),s.d(t,{assets:()=>p,contentTitle:()=>i,default:()=>u,frontMatter:()=>n,metadata:()=>c,toc:()=>l});var o=s(4848),a=s(8453);const n={sidebar_position:5,title:"Supabase"},i="Use DBOS With Supabase",c={id:"integrations/supabase",title:"Supabase",description:"This guide shows you how to deploy a DBOS application with Supabase.",source:"@site/docs/integrations/supabase.md",sourceDirName:"integrations",slug:"/integrations/supabase",permalink:"/integrations/supabase",draft:!1,unlisted:!1,tags:[],version:"current",sidebarPosition:5,frontMatter:{sidebar_position:5,title:"Supabase"},sidebar:"tutorialSidebar",previous:{title:"Cloud CLI Reference",permalink:"/cloud-tutorials/cloud-cli"},next:{title:"How Workflows Work",permalink:"/explanations/how-workflows-work"}},p={},l=[{value:"1. Connect to Supabase",id:"1-connect-to-supabase",level:3},{value:"2. Select a Template",id:"2-select-a-template",level:3},{value:"3. Connect to GitHub",id:"3-connect-to-github",level:3},{value:"4. Deploy to DBOS Cloud",id:"4-deploy-to-dbos-cloud",level:3},{value:"5. View Your Application",id:"5-view-your-application",level:3},{value:"Next Steps",id:"next-steps",level:3}];function r(e){const t={a:"a",code:"code",h1:"h1",h3:"h3",header:"header",p:"p",...(0,a.R)(),...e.components};return(0,o.jsxs)(o.Fragment,{children:[(0,o.jsx)(t.header,{children:(0,o.jsx)(t.h1,{id:"use-dbos-with-supabase",children:"Use DBOS With Supabase"})}),"\n",(0,o.jsxs)(t.p,{children:["This guide shows you how to deploy a DBOS application with ",(0,o.jsx)(t.a,{href:"https://supabase.com/",children:"Supabase"}),".\nYour application is hosted in DBOS Cloud, but stores its data in Supabase."]}),"\n",(0,o.jsx)(t.h3,{id:"1-connect-to-supabase",children:"1. Connect to Supabase"}),"\n",(0,o.jsxs)(t.p,{children:["Visit ",(0,o.jsx)(t.a,{href:"https://console.dbos.dev/provision",children:"https://console.dbos.dev/provision"}),' and click "Connect Supabase" to connect your DBOS and Supabase accounts.']}),"\n",(0,o.jsx)("img",{src:s(6740).A,alt:"Cloud Console Templates",width:"800",className:"custom-img"}),"\n",(0,o.jsx)(t.p,{children:"After connecting your Supabase account, you should see a list of your Supabase projects.\nChoose one to use with DBOS.\nWhen prompted, enter your Supabase database password (you set this when you created your Supabase project, if you forgot it you can reset it from your Supabase dashboard)."}),"\n",(0,o.jsx)("img",{src:s(2274).A,alt:"Cloud Console Templates",width:"800",className:"custom-img"}),"\n",(0,o.jsx)(t.p,{children:"Congratulations! You've linked your Supabase project to DBOS. Now, let's deploy a DBOS app to your Supabase database."}),"\n",(0,o.jsx)(t.h3,{id:"2-select-a-template",children:"2. Select a Template"}),"\n",(0,o.jsxs)(t.p,{children:["Visit ",(0,o.jsx)(t.a,{href:"https://console.dbos.dev/launch",children:"https://console.dbos.dev/launch"}),". At the top of the page, make sure your Supabase database instance is selected."]}),"\n",(0,o.jsx)("img",{src:s(299).A,alt:"Cloud Console Templates",width:"800",className:"custom-img"}),"\n",(0,o.jsx)(t.p,{children:"Then, choose a template you'd like to deploy."}),"\n",(0,o.jsx)(t.p,{children:"Not sure which template to use? We recommend the DBOS + FastAPI starter."}),"\n",(0,o.jsx)("img",{src:s(5526).A,alt:"Cloud Console Templates",width:"800",className:"custom-img"}),"\n",(0,o.jsx)(t.h3,{id:"3-connect-to-github",children:"3. Connect to GitHub"}),"\n",(0,o.jsx)(t.p,{children:"To ensure you can easily update your project after deploying it, DBOS will create a GitHub repository for it.\nYou can deploy directly from that GitHub repository to DBOS Cloud."}),"\n",(0,o.jsx)(t.p,{children:"First, sign in to your GitHub account.\nThen, set your repository name and whether it should be public or private."}),"\n",(0,o.jsx)("img",{src:s(9825).A,alt:"Deploy with GitHub",width:"800",className:"custom-img"}),"\n",(0,o.jsx)(t.h3,{id:"4-deploy-to-dbos-cloud",children:"4. Deploy to DBOS Cloud"}),"\n",(0,o.jsx)(t.p,{children:'Click "Create GitHub Repo and Deploy" and DBOS will clone a copy of the source code into your GitHub account, then deploy your project to DBOS Cloud.\nIn less than a minute, your app should deploy successfully.'}),"\n",(0,o.jsx)(t.p,{children:"Congratulations, you've successfully deployed an app to DBOS Cloud and Supabase!"}),"\n",(0,o.jsx)("img",{src:s(9942).A,alt:"Deploy Success",width:"800",className:"custom-img"}),"\n",(0,o.jsx)(t.h3,{id:"5-view-your-application",children:"5. View Your Application"}),"\n",(0,o.jsxs)(t.p,{children:["At this point, your app is deployed, with its very own URL assigned.\nIf you continue to your ",(0,o.jsx)(t.a,{href:"https://console.dbos.dev/applications",children:"application page"}),", you can click on the URL to see your application live on the Internet."]}),"\n",(0,o.jsx)("img",{src:s(1345).A,alt:"Application page",width:"800",className:"custom-img"}),"\n",(0,o.jsxs)(t.p,{children:["To start building, edit your application on GitHub (for the DBOS + FastAPI starter, source code is in ",(0,o.jsx)(t.code,{children:"app/main.py"}),'), commit your changes, then press "Deploy From GitHub" to see your changes reflected in the live application.']}),"\n",(0,o.jsx)(t.h3,{id:"next-steps",children:"Next Steps"}),"\n",(0,o.jsxs)(t.p,{children:["To learn more about building reliable applications with DBOS, check out the programming guide (",(0,o.jsx)(t.a,{href:"/python/programming-guide",children:"Python"}),", ",(0,o.jsx)(t.a,{href:"/typescript/programming-guide",children:"TypeScript"}),")."]})]})}function u(e={}){const{wrapper:t}={...(0,a.R)(),...e.components};return t?(0,o.jsx)(t,{...e,children:(0,o.jsx)(r,{...e})}):r(e)}},5526:(e,t,s)=>{s.d(t,{A:()=>o});const o=s.p+"assets/images/1-pick-template-1881b2907a4dece0d05d91813ac17af4.png"},9825:(e,t,s)=>{s.d(t,{A:()=>o});const o=s.p+"assets/images/3-deploy-github-05e22ac4da12ae03880dc437bc6a22eb.png"},9942:(e,t,s)=>{s.d(t,{A:()=>o});const o=s.p+"assets/images/4-deploy-success-696d2d81fef12ae201787737bac86780.png"},1345:(e,t,s)=>{s.d(t,{A:()=>o});const o=s.p+"assets/images/5-app-page-704ef36a518ac905c0a99766515ce55a.png"},6740:(e,t,s)=>{s.d(t,{A:()=>o});const o=s.p+"assets/images/1-supabase-list-7442239f16f10032a7ac5a2631e2242f.png"},2274:(e,t,s)=>{s.d(t,{A:()=>o});const o=s.p+"assets/images/2-supabase-starter-eaccd01f1dbe541657843c1994f6999e.png"},299:(e,t,s)=>{s.d(t,{A:()=>o});const o=s.p+"assets/images/3-choose-supabase-35b1570a660b99cb8f6ad6933e3c613e.png"},8453:(e,t,s)=>{s.d(t,{R:()=>i,x:()=>c});var o=s(6540);const a={},n=o.createContext(a);function i(e){const t=o.useContext(n);return o.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function c(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(a):e.components||a:i(e.components),o.createElement(n.Provider,{value:t},e.children)}}}]);