"use strict";(self.webpackChunkoperon_docs=self.webpackChunkoperon_docs||[]).push([[340],{3905:(e,t,n)=>{n.d(t,{Zo:()=>c,kt:()=>g});var a=n(7294);function r(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function i(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);t&&(a=a.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,a)}return n}function o(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?i(Object(n),!0).forEach((function(t){r(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):i(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function s(e,t){if(null==e)return{};var n,a,r=function(e,t){if(null==e)return{};var n,a,r={},i=Object.keys(e);for(a=0;a<i.length;a++)n=i[a],t.indexOf(n)>=0||(r[n]=e[n]);return r}(e,t);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);for(a=0;a<i.length;a++)n=i[a],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(r[n]=e[n])}return r}var l=a.createContext({}),p=function(e){var t=a.useContext(l),n=t;return e&&(n="function"==typeof e?e(t):o(o({},t),e)),n},c=function(e){var t=p(e.components);return a.createElement(l.Provider,{value:t},e.children)},u="mdxType",d={inlineCode:"code",wrapper:function(e){var t=e.children;return a.createElement(a.Fragment,{},t)}},m=a.forwardRef((function(e,t){var n=e.components,r=e.mdxType,i=e.originalType,l=e.parentName,c=s(e,["components","mdxType","originalType","parentName"]),u=p(n),m=r,g=u["".concat(l,".").concat(m)]||u[m]||d[m]||i;return n?a.createElement(g,o(o({ref:t},c),{},{components:n})):a.createElement(g,o({ref:t},c))}));function g(e,t){var n=arguments,r=t&&t.mdxType;if("string"==typeof e||r){var i=n.length,o=new Array(i);o[0]=m;var s={};for(var l in t)hasOwnProperty.call(t,l)&&(s[l]=t[l]);s.originalType=e,s[u]="string"==typeof e?e:r,o[1]=s;for(var p=2;p<i;p++)o[p]=n[p];return a.createElement.apply(null,o)}return a.createElement.apply(null,n)}m.displayName="MDXCreateElement"},764:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>l,contentTitle:()=>o,default:()=>d,frontMatter:()=>i,metadata:()=>s,toc:()=>p});var a=n(7462),r=(n(7294),n(3905));const i={sidebar_position:9,title:"Using Prisma",description:"Learn how to create and register Prisma entities and perform transactional updates"},o=void 0,s={unversionedId:"tutorials/using-prisma",id:"tutorials/using-prisma",title:"Using Prisma",description:"Learn how to create and register Prisma entities and perform transactional updates",source:"@site/docs/tutorials/using-prisma.md",sourceDirName:"tutorials",slug:"/tutorials/using-prisma",permalink:"/operon-docs/tutorials/using-prisma",draft:!1,tags:[],version:"current",sidebarPosition:9,frontMatter:{sidebar_position:9,title:"Using Prisma",description:"Learn how to create and register Prisma entities and perform transactional updates"},sidebar:"tutorialSidebar",previous:{title:"Testing",permalink:"/operon-docs/tutorials/testing-tutorial"},next:{title:"Communication Example",permalink:"/operon-docs/tutorials/ping-pong-tutorial"}},l={},p=[{value:"Prisma Overview",id:"prisma-overview",level:2},{value:"Usage overview",id:"usage-overview",level:2},{value:"Prisma setup",id:"prisma-setup",level:2},{value:"Coding a transactional function",id:"coding-a-transactional-function",level:2},{value:"Invoking a transactional function",id:"invoking-a-transactional-function",level:2}],c={toc:p},u="wrapper";function d(e){let{components:t,...n}=e;return(0,r.kt)(u,(0,a.Z)({},c,n,{components:t,mdxType:"MDXLayout"}),(0,r.kt)("p",null,(0,r.kt)("a",{parentName:"p",href:"https://www.prisma.io/"},"Prisma")," is an opensource ORM. This tutorial shows how to build a transactional application using PRISMA as the ORM."),(0,r.kt)("h2",{id:"prisma-overview"},"Prisma Overview"),(0,r.kt)("p",null,"Prisma is an opensource ORM. It consists of the following parts:"),(0,r.kt)("p",null,"PrismaClient, which is an auto generated and typesafe query client.\nPrisma Migrate, which is the migration system."),(0,r.kt)("h2",{id:"usage-overview"},"Usage overview"),(0,r.kt)("p",null,"First setup prisma and the database by: "),(0,r.kt)("ol",null,(0,r.kt)("li",{parentName:"ol"},"Defining a model in schema.prisma."),(0,r.kt)("li",{parentName:"ol"},"install and generate a prisma client."),(0,r.kt)("li",{parentName:"ol"},"run migration to create the tables.")),(0,r.kt)("p",null,"For additional details see the ",(0,r.kt)("a",{parentName:"p",href:"https://www.prisma.io/docs/getting-started"},"Prisma Getting Started")),(0,r.kt)("p",null,"Write the operon application.\n4. Code the transactional function\n5. Code the http handler"),(0,r.kt)("h2",{id:"prisma-setup"},"Prisma setup"),(0,r.kt)("p",null,"This information is from the ",(0,r.kt)("a",{parentName:"p",href:"https://www.prisma.io/docs/getting-started"},"Prisma Getting Started")),(0,r.kt)("p",null,"Create a directory"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre"},"mkdir hello-prisma\n")),(0,r.kt)("p",null,"Install prisma"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre"},"npm init -y\nnpm install prisma typescript ts-node @types/node --save-dev\nnpx prisma init\n")),(0,r.kt)("p",null,'In the .env file, update the database URL if necessary\nDATABASE_URL="postgresql://postgres:${PGPASSWORD}@localhost:5432/helloprisma?schema=public"'),(0,r.kt)("p",null,"In the file prisma/schema.prisma, Add a model"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-tsx"},'model OperonHello {\n  @@map("operonhello")\n  greeting_id Int @id @default(autoincrement())\n  greeting String\n}\n')),(0,r.kt)("p",null,"Run this command in the database to create table:"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre"},"npx prisma migrate dev --name init\n")),(0,r.kt)("h2",{id:"coding-a-transactional-function"},"Coding a transactional function"),(0,r.kt)("p",null,"The following code show a function that uses PrismaClient to perform a database operation.\nThe operon framework has already created an instance of the PrismaClient and made it available as part of the transaction context. The code below insert a row into the table based on the model we defined above. The decorator @OperonTransaction wraps a database transaction around this function."),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-tsx"},"@OperonTransaction()\n  static async helloTransaction(txnCtxt: TransactionContext<PrismaClient>, name: string)  {\n    const greeting = `Hello, ${name}!`;\n    console.log(greeting);\n    const p: PrismaClient = txnCtxt.client as PrismaClient;\n    const res = await p.operonHello.create({\n        data: {\n        greeting: greeting,\n        },\n    });\n    return `Greeting ${res.greeting_id}: ${greeting}`;\n  };\n\n\n")),(0,r.kt)("h2",{id:"invoking-a-transactional-function"},"Invoking a transactional function"),(0,r.kt)("p",null,"The code below shows how the function helloTransaction is involved.\nhelloHandler is invoked when the runtime receives a httpRequest '/greeting/:name'.\nhelloTransaction is invoked by calling the invoke method."),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-tsx"}," @GetApi('/greeting/:name')\n  static async helloHandler(handlerCtxt: HandlerContext, name: string) {\n    return handlerCtxt.invoke(Hello).helloTransaction(name);\n  }\n\n")),(0,r.kt)("p",null,"The complete source code for this tutorial can be found in our demo-apps repository."))}d.isMDXComponent=!0}}]);