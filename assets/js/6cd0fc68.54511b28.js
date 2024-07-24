"use strict";(self.webpackChunkdbos_docs=self.webpackChunkdbos_docs||[]).push([[3543],{7540:(e,n,t)=>{t.r(n),t.d(n,{assets:()=>u,contentTitle:()=>c,default:()=>h,frontMatter:()=>o,metadata:()=>l,toc:()=>d});var a=t(5893),r=t(1151),s=t(4866),i=t(5162);const o={sidebar_position:2,title:"Transactions",description:"Learn how to perform database operations"},c=void 0,l={id:"tutorials/transaction-tutorial",title:"Transactions",description:"Learn how to perform database operations",source:"@site/docs/tutorials/transaction-tutorial.md",sourceDirName:"tutorials",slug:"/tutorials/transaction-tutorial",permalink:"/tutorials/transaction-tutorial",draft:!1,unlisted:!1,tags:[],version:"current",sidebarPosition:2,frontMatter:{sidebar_position:2,title:"Transactions",description:"Learn how to perform database operations"},sidebar:"tutorialSidebar",previous:{title:"HTTP Serving",permalink:"/tutorials/http-serving-tutorial"},next:{title:"Communicators",permalink:"/tutorials/communicator-tutorial"}},u={},d=[{value:"Transaction Functions",id:"transaction-functions",level:2},{value:"Schema Management",id:"schema-management",level:2}];function m(e){const n={a:"a",code:"code",em:"em",h2:"h2",li:"li",p:"p",pre:"pre",ul:"ul",...(0,r.a)(),...e.components};return(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(n.h2,{id:"transaction-functions",children:"Transaction Functions"}),"\n",(0,a.jsxs)(n.p,{children:["To perform operations on your application database in DBOS, you use ",(0,a.jsx)(n.em,{children:"transaction functions"}),".\nAs their name implies, these functions execute as ",(0,a.jsx)(n.a,{href:"https://en.wikipedia.org/wiki/Database_transaction",children:"database transactions"}),"."]}),"\n",(0,a.jsxs)(n.p,{children:["Transaction functions must be annotated with the ",(0,a.jsx)(n.a,{href:"../api-reference/decorators#transaction",children:(0,a.jsx)(n.code,{children:"@Transaction"})})," decorator and must have a ",(0,a.jsx)(n.a,{href:"../api-reference/contexts#transactioncontextt",children:(0,a.jsx)(n.code,{children:"TransactionContext"})})," as their first argument.\nAs with other DBOS functions, inputs and outputs must be serializable to JSON."]}),"\n",(0,a.jsxs)(n.p,{children:["The ",(0,a.jsx)(n.a,{href:"../api-reference/contexts#transactioncontextt",children:(0,a.jsx)(n.code,{children:"TransactionContext"})})," provides a ",(0,a.jsx)(n.code,{children:".client"})," field you can use to transactionally interact with the database, so you don't need to worry about managing database connections.\nDBOS supports ",(0,a.jsx)(n.a,{href:"/tutorials/using-knex",children:"Knex.js"}),", ",(0,a.jsx)(n.a,{href:"/tutorials/using-typeorm",children:"TypeORM"}),", and ",(0,a.jsx)(n.a,{href:"/tutorials/using-prisma",children:"Prisma"})," clients as well as raw SQL.\nYou can configure which client to use in your ",(0,a.jsx)(n.a,{href:"/api-reference/configuration",children:(0,a.jsx)(n.code,{children:"dbos-config.yaml"})})," file.\nKnex is used by default."]}),"\n",(0,a.jsx)(n.p,{children:"Here's an example of a transaction function:"}),"\n",(0,a.jsxs)(s.Z,{groupId:"database-clients",children:[(0,a.jsxs)(i.Z,{value:"knex",label:"Knex",children:[(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-javascript",children:"export class Greetings {\n  @Transaction()\n  static async insertGreeting(ctxt: TransactionContext<Knex>, friend: string, note: string) {\n    await ctxt.client('greetings').insert({\n      name: friend,\n      note: note\n    });\n  }\n}\n"})}),(0,a.jsxs)(n.p,{children:["See our ",(0,a.jsx)(n.a,{href:"/tutorials/using-knex",children:"Knex guide"})," for more information."]})]}),(0,a.jsxs)(i.Z,{value:"typeorm",label:"TypeORM",children:[(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-javascript",children:"@Entity()\nexport class Greetings {\n\n    @PrimaryGeneratedColumn()\n    id!: number;\n\n    @Column()\n    name!: string;\n\n    @Column()\n    note!: string;\n}\n\n@OrmEntities([Greetings])\nexport class DBOSGreetings {\n  @Transaction()\n  static async insertGreeting(ctxt: TransactionContext<EntityManager>, name: string, note: string) {\n    let entity = new Greetings();\n    entity.name = name;\n    entity.note = note;\n    await ctxt.client.save(entity);\n  }\n}\n"})}),(0,a.jsxs)(n.p,{children:["See our ",(0,a.jsx)(n.a,{href:"/tutorials/using-typeorm",children:"TypeORM guide"})," for more information."]})]}),(0,a.jsxs)(i.Z,{value:"prisma",label:"Prisma",children:[(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-javascript",children:'import { PrismaClient } from "@prisma/client"; // Use the generated Prisma client\n\nexport class Greetings {\n  @Transaction()\n  static async insertGreeting(ctxt: TransactionContext<PrismaClient>, name: string, note: string)  {\n    await ctxt.client.greetings.create({\n      data: {\n        name: name,\n        note: note,\n      },\n    });\n  }\n}\n'})}),(0,a.jsxs)(n.p,{children:["See our ",(0,a.jsx)(n.a,{href:"/tutorials/using-prisma",children:"Prisma guide"})," for more information."]})]}),(0,a.jsxs)(i.Z,{value:"raw",label:"Raw SQL",children:[(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-javascript",children:"export class Greetings {\n  @Transaction()\n  static async insertGreeting(ctxt: TransactionContext<Knex>, friend: string, note: string) {\n    await ctxt.client.raw('INSERT INTO greetings (name, note) VALUES (?, ?)', [friend, note]);\n  }\n}\n"})}),(0,a.jsxs)(n.p,{children:["We recommend using ",(0,a.jsx)(n.a,{href:"https://knexjs.org/guide/raw.html",children:"knex.raw"})," to execute raw SQL."]})]})]}),"\n",(0,a.jsx)(n.h2,{id:"schema-management",children:"Schema Management"}),"\n",(0,a.jsx)(n.p,{children:"We strongly recommend you manage your database schema using migrations.\nKnex, TypeORM, and Prisma all provide rich support for schema management through migrations.\nPlease see their guides for more detail:"}),"\n",(0,a.jsxs)(n.ul,{children:["\n",(0,a.jsx)(n.li,{children:(0,a.jsx)(n.a,{href:"/tutorials/using-knex#schema-management",children:"Knex schema management guide."})}),"\n",(0,a.jsx)(n.li,{children:(0,a.jsx)(n.a,{href:"/tutorials/using-typeorm#schema-management",children:"TypeORM schema management guide."})}),"\n",(0,a.jsx)(n.li,{children:(0,a.jsx)(n.a,{href:"/tutorials/using-prisma#schema-management",children:"Prisma schema management guide."})}),"\n"]}),"\n",(0,a.jsxs)(n.p,{children:["If you are not using database transactions, you may wish to disable database migrations.\nIn ",(0,a.jsx)(n.a,{href:"/api-reference/configuration",children:(0,a.jsx)(n.code,{children:"dbos-config.yaml"})}),", set your ",(0,a.jsx)(n.code,{children:"migrate"})," setting as such:"]}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-yaml",children:"migrate:\n    - echo 'No migrations'  \n"})})]})}function h(e={}){const{wrapper:n}={...(0,r.a)(),...e.components};return n?(0,a.jsx)(n,{...e,children:(0,a.jsx)(m,{...e})}):m(e)}},5162:(e,n,t)=>{t.d(n,{Z:()=>i});t(7294);var a=t(6905);const r={tabItem:"tabItem_Ymn6"};var s=t(5893);function i(e){let{children:n,hidden:t,className:i}=e;return(0,s.jsx)("div",{role:"tabpanel",className:(0,a.Z)(r.tabItem,i),hidden:t,children:n})}},4866:(e,n,t)=>{t.d(n,{Z:()=>w});var a=t(7294),r=t(6905),s=t(2466),i=t(6550),o=t(469),c=t(1980),l=t(7392),u=t(812);function d(e){return a.Children.toArray(e).filter((e=>"\n"!==e)).map((e=>{if(!e||(0,a.isValidElement)(e)&&function(e){const{props:n}=e;return!!n&&"object"==typeof n&&"value"in n}(e))return e;throw new Error(`Docusaurus error: Bad <Tabs> child <${"string"==typeof e.type?e.type:e.type.name}>: all children of the <Tabs> component should be <TabItem>, and every <TabItem> should have a unique "value" prop.`)}))?.filter(Boolean)??[]}function m(e){const{values:n,children:t}=e;return(0,a.useMemo)((()=>{const e=n??function(e){return d(e).map((e=>{let{props:{value:n,label:t,attributes:a,default:r}}=e;return{value:n,label:t,attributes:a,default:r}}))}(t);return function(e){const n=(0,l.l)(e,((e,n)=>e.value===n.value));if(n.length>0)throw new Error(`Docusaurus error: Duplicate values "${n.map((e=>e.value)).join(", ")}" found in <Tabs>. Every value needs to be unique.`)}(e),e}),[n,t])}function h(e){let{value:n,tabValues:t}=e;return t.some((e=>e.value===n))}function p(e){let{queryString:n=!1,groupId:t}=e;const r=(0,i.k6)(),s=function(e){let{queryString:n=!1,groupId:t}=e;if("string"==typeof n)return n;if(!1===n)return null;if(!0===n&&!t)throw new Error('Docusaurus error: The <Tabs> component groupId prop is required if queryString=true, because this value is used as the search param name. You can also provide an explicit value such as queryString="my-search-param".');return t??null}({queryString:n,groupId:t});return[(0,c._X)(s),(0,a.useCallback)((e=>{if(!s)return;const n=new URLSearchParams(r.location.search);n.set(s,e),r.replace({...r.location,search:n.toString()})}),[s,r])]}function f(e){const{defaultValue:n,queryString:t=!1,groupId:r}=e,s=m(e),[i,c]=(0,a.useState)((()=>function(e){let{defaultValue:n,tabValues:t}=e;if(0===t.length)throw new Error("Docusaurus error: the <Tabs> component requires at least one <TabItem> children component");if(n){if(!h({value:n,tabValues:t}))throw new Error(`Docusaurus error: The <Tabs> has a defaultValue "${n}" but none of its children has the corresponding value. Available values are: ${t.map((e=>e.value)).join(", ")}. If you intend to show no default tab, use defaultValue={null} instead.`);return n}const a=t.find((e=>e.default))??t[0];if(!a)throw new Error("Unexpected error: 0 tabValues");return a.value}({defaultValue:n,tabValues:s}))),[l,d]=p({queryString:t,groupId:r}),[f,g]=function(e){let{groupId:n}=e;const t=function(e){return e?`docusaurus.tab.${e}`:null}(n),[r,s]=(0,u.Nk)(t);return[r,(0,a.useCallback)((e=>{t&&s.set(e)}),[t,s])]}({groupId:r}),x=(()=>{const e=l??f;return h({value:e,tabValues:s})?e:null})();(0,o.Z)((()=>{x&&c(x)}),[x]);return{selectedValue:i,selectValue:(0,a.useCallback)((e=>{if(!h({value:e,tabValues:s}))throw new Error(`Can't select invalid tab value=${e}`);c(e),d(e),g(e)}),[d,g,s]),tabValues:s}}var g=t(2389);const x={tabList:"tabList__CuJ",tabItem:"tabItem_LNqP"};var b=t(5893);function j(e){let{className:n,block:t,selectedValue:a,selectValue:i,tabValues:o}=e;const c=[],{blockElementScrollPositionUntilNextRender:l}=(0,s.o5)(),u=e=>{const n=e.currentTarget,t=c.indexOf(n),r=o[t].value;r!==a&&(l(n),i(r))},d=e=>{let n=null;switch(e.key){case"Enter":u(e);break;case"ArrowRight":{const t=c.indexOf(e.currentTarget)+1;n=c[t]??c[0];break}case"ArrowLeft":{const t=c.indexOf(e.currentTarget)-1;n=c[t]??c[c.length-1];break}}n?.focus()};return(0,b.jsx)("ul",{role:"tablist","aria-orientation":"horizontal",className:(0,r.Z)("tabs",{"tabs--block":t},n),children:o.map((e=>{let{value:n,label:t,attributes:s}=e;return(0,b.jsx)("li",{role:"tab",tabIndex:a===n?0:-1,"aria-selected":a===n,ref:e=>c.push(e),onKeyDown:d,onClick:u,...s,className:(0,r.Z)("tabs__item",x.tabItem,s?.className,{"tabs__item--active":a===n}),children:t??n},n)}))})}function v(e){let{lazy:n,children:t,selectedValue:r}=e;const s=(Array.isArray(t)?t:[t]).filter(Boolean);if(n){const e=s.find((e=>e.props.value===r));return e?(0,a.cloneElement)(e,{className:"margin-top--md"}):null}return(0,b.jsx)("div",{className:"margin-top--md",children:s.map(((e,n)=>(0,a.cloneElement)(e,{key:n,hidden:e.props.value!==r})))})}function y(e){const n=f(e);return(0,b.jsxs)("div",{className:(0,r.Z)("tabs-container",x.tabList),children:[(0,b.jsx)(j,{...n,...e}),(0,b.jsx)(v,{...n,...e})]})}function w(e){const n=(0,g.Z)();return(0,b.jsx)(y,{...e,children:d(e.children)},String(n))}},1151:(e,n,t)=>{t.d(n,{Z:()=>o,a:()=>i});var a=t(7294);const r={},s=a.createContext(r);function i(e){const n=a.useContext(s);return a.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function o(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(r):e.components||r:i(e.components),a.createElement(s.Provider,{value:n},e.children)}}}]);