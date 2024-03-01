"use strict";(self.webpackChunkdbos_docs=self.webpackChunkdbos_docs||[]).push([[3202],{1690:(e,n,t)=>{t.r(n),t.d(n,{assets:()=>d,contentTitle:()=>a,default:()=>u,frontMatter:()=>o,metadata:()=>r,toc:()=>c});var i=t(5893),s=t(1151);const o={sidebar_position:5},a="DBOS Cloud Quickstart",r={id:"getting-started/quickstart-cloud",title:"DBOS Cloud Quickstart",description:"Here's how to deploy a DBOS application to the cloud in a few minutes!",source:"@site/docs/getting-started/quickstart-cloud.md",sourceDirName:"getting-started",slug:"/getting-started/quickstart-cloud",permalink:"/getting-started/quickstart-cloud",draft:!1,unlisted:!1,tags:[],version:"current",sidebarPosition:5,frontMatter:{sidebar_position:5},sidebar:"tutorialSidebar",previous:{title:"Programming Quickstart",permalink:"/getting-started/quickstart-programming"},next:{title:"DBOS SDK Tutorials",permalink:"/category/dbos-sdk-tutorials"}},d={},c=[{value:"Preliminaries",id:"preliminaries",level:3},{value:"Registration",id:"registration",level:3},{value:"Provisioning a Database Instance",id:"provisioning-a-database-instance",level:3},{value:"Registering and Deploying an Application",id:"registering-and-deploying-an-application",level:3}];function l(e){const n={a:"a",admonition:"admonition",code:"code",h1:"h1",h3:"h3",p:"p",pre:"pre",...(0,s.a)(),...e.components};return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(n.h1,{id:"dbos-cloud-quickstart",children:"DBOS Cloud Quickstart"}),"\n",(0,i.jsx)(n.p,{children:"Here's how to deploy a DBOS application to the cloud in a few minutes!"}),"\n",(0,i.jsx)(n.h3,{id:"preliminaries",children:"Preliminaries"}),"\n",(0,i.jsxs)(n.p,{children:["We assume you've already completed the ",(0,i.jsx)(n.a,{href:"/getting-started/quickstart",children:"quickstart"}),".\nBefore starting this tutorial, instantiate a new DBOS application and ",(0,i.jsx)(n.code,{children:"cd"})," into it by running the following commands:"]}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-bash",children:"npx -y @dbos-inc/dbos-sdk init -n <project-name>\ncd <project-name>\n"})}),"\n",(0,i.jsx)(n.h3,{id:"registration",children:"Registration"}),"\n",(0,i.jsx)(n.p,{children:"Let's start by creating a DBOS Cloud account.\nFrom your DBOS application directory, run the following command:"}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{children:"npx dbos-cloud register -u <username>\n"})}),"\n",(0,i.jsxs)(n.p,{children:["When you run the command, it will ask you for some information, then redirect you to a secure login portal.\nOpen the login portal in your browser and click ",(0,i.jsx)(n.code,{children:"Confirm"}),", then create a new account.\nAfter you're done, go back to the terminal.\nIf everything's working, the command should succeed and print ",(0,i.jsx)(n.code,{children:"<username> successfully registered!"}),"."]}),"\n",(0,i.jsx)(n.admonition,{type:"tip",children:(0,i.jsx)(n.p,{children:"If you register with an email and password, you'll also need to verify your email through a link we email you."})}),"\n",(0,i.jsx)(n.h3,{id:"provisioning-a-database-instance",children:"Provisioning a Database Instance"}),"\n",(0,i.jsxs)(n.p,{children:["Next, let's provision a Postgres database instance your applications can connect to!\nYou should choose a database name and an administrator username and password for your database instance.\nBoth the database instance name and the administrator username must contain only lowercase letters and numbers, dashes (",(0,i.jsx)(n.code,{children:"-"}),"), and underscores (",(0,i.jsx)(n.code,{children:"_"}),").\nRun this command (it should take ~5 minutes to provision):"]}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{children:"npx dbos-cloud database provision <database-name> -a <admin-username> -W <admin-password>\n"})}),"\n",(0,i.jsxs)(n.p,{children:["If successful, the command should print ",(0,i.jsx)(n.code,{children:"Database successfully provisioned!"}),"."]}),"\n",(0,i.jsx)(n.h3,{id:"registering-and-deploying-an-application",children:"Registering and Deploying an Application"}),"\n",(0,i.jsx)(n.p,{children:"Now, we're ready to register and deploy your application to DBOS Cloud!\nFirst, register your application by running this command, using your database instance name from the last step:"}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{children:"npx dbos-cloud application register -d <database-name>\n"})}),"\n",(0,i.jsxs)(n.p,{children:["If successful, the command should print ",(0,i.jsx)(n.code,{children:"Successfully registered <app-name>!"})]}),"\n",(0,i.jsx)(n.p,{children:"Now, deploy your application to run it in the cloud!"}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{children:"npx dbos-cloud application deploy\n"})}),"\n",(0,i.jsxs)(n.p,{children:["If successful, the command will print ",(0,i.jsx)(n.code,{children:"Successfully deployed <app-name>! Access your application at <URL>"}),"\nThe URL should look like ",(0,i.jsx)(n.code,{children:"https://cloud.dbos.dev/apps/<username>/<app-name>"}),"\nYour application is now live at that URL!\nIf you ever forget the URL, you can retrieve it (and some other information) by running ",(0,i.jsx)(n.code,{children:"npx dbos-cloud application status"}),"."]}),"\n",(0,i.jsxs)(n.p,{children:["To see that your app is working, visit ",(0,i.jsx)(n.code,{children:"<URL>/greeting/dbos"})," in your browser.\nFor example, if your username is ",(0,i.jsx)(n.code,{children:"mike"})," and your app name is ",(0,i.jsx)(n.code,{children:"hello"}),", visit ",(0,i.jsx)(n.code,{children:"https://cloud.dbos.dev/apps/mike/hello/greeting/dbos"}),".\nJust like in the ",(0,i.jsx)(n.a,{href:"/getting-started/quickstart",children:"quickstart"}),", you should get this message: ",(0,i.jsx)(n.code,{children:"Hello, dbos! You have been greeted 1 times."})," Each time you refresh the page, the counter should go up by one!"]}),"\n",(0,i.jsx)(n.p,{children:"Congratulations, you've successfully deployed your first application to DBOS Cloud!"})]})}function u(e={}){const{wrapper:n}={...(0,s.a)(),...e.components};return n?(0,i.jsx)(n,{...e,children:(0,i.jsx)(l,{...e})}):l(e)}},1151:(e,n,t)=>{t.d(n,{Z:()=>r,a:()=>a});var i=t(7294);const s={},o=i.createContext(s);function a(e){const n=i.useContext(o);return i.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function r(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(s):e.components||s:a(e.components),i.createElement(o.Provider,{value:n},e.children)}}}]);