"use strict";(self.webpackChunkoperon_docs=self.webpackChunkoperon_docs||[]).push([[656],{3905:(e,t,n)=>{n.d(t,{Zo:()=>c,kt:()=>h});var a=n(7294);function r(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function i(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);t&&(a=a.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,a)}return n}function o(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?i(Object(n),!0).forEach((function(t){r(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):i(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function s(e,t){if(null==e)return{};var n,a,r=function(e,t){if(null==e)return{};var n,a,r={},i=Object.keys(e);for(a=0;a<i.length;a++)n=i[a],t.indexOf(n)>=0||(r[n]=e[n]);return r}(e,t);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);for(a=0;a<i.length;a++)n=i[a],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(r[n]=e[n])}return r}var p=a.createContext({}),l=function(e){var t=a.useContext(p),n=t;return e&&(n="function"==typeof e?e(t):o(o({},t),e)),n},c=function(e){var t=l(e.components);return a.createElement(p.Provider,{value:t},e.children)},d="mdxType",u={inlineCode:"code",wrapper:function(e){var t=e.children;return a.createElement(a.Fragment,{},t)}},m=a.forwardRef((function(e,t){var n=e.components,r=e.mdxType,i=e.originalType,p=e.parentName,c=s(e,["components","mdxType","originalType","parentName"]),d=l(n),m=r,h=d["".concat(p,".").concat(m)]||d[m]||u[m]||i;return n?a.createElement(h,o(o({ref:t},c),{},{components:n})):a.createElement(h,o({ref:t},c))}));function h(e,t){var n=arguments,r=t&&t.mdxType;if("string"==typeof e||r){var i=n.length,o=new Array(i);o[0]=m;var s={};for(var p in t)hasOwnProperty.call(t,p)&&(s[p]=t[p]);s.originalType=e,s[d]="string"==typeof e?e:r,o[1]=s;for(var l=2;l<i;l++)o[l]=n[l];return a.createElement.apply(null,o)}return a.createElement.apply(null,n)}m.displayName="MDXCreateElement"},9770:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>p,contentTitle:()=>o,default:()=>u,frontMatter:()=>i,metadata:()=>s,toc:()=>l});var a=n(7462),r=(n(7294),n(3905));const i={sidebar_position:11,title:"Using TypeORM",description:"Learn how to create and register TypeORM entities and perform transactional updates"},o=void 0,s={unversionedId:"tutorials/using-typeorm",id:"tutorials/using-typeorm",title:"Using TypeORM",description:"Learn how to create and register TypeORM entities and perform transactional updates",source:"@site/docs/tutorials/using-typeorm.md",sourceDirName:"tutorials",slug:"/tutorials/using-typeorm",permalink:"/tutorials/using-typeorm",draft:!1,tags:[],version:"current",sidebarPosition:11,frontMatter:{sidebar_position:11,title:"Using TypeORM",description:"Learn how to create and register TypeORM entities and perform transactional updates"},sidebar:"tutorialSidebar",previous:{title:"Using Prisma",permalink:"/tutorials/using-prisma"},next:{title:"Demo Applications",permalink:"/tutorials/demo-apps"}},p={},l=[{value:"TypeORM Overview",id:"typeorm-overview",level:2},{value:"Usage",id:"usage",level:2},{value:"Setting Up The Database Connection",id:"setting-up-the-database-connection",level:3},{value:"Setting Up Entities",id:"setting-up-entities",level:3},{value:"Setting Up The Schema",id:"setting-up-the-schema",level:3},{value:"Invoking Transactions",id:"invoking-transactions",level:3},{value:"Unit Testing",id:"unit-testing",level:3},{value:"TypeORM Example",id:"typeorm-example",level:2}],c={toc:l},d="wrapper";function u(e){let{components:t,...n}=e;return(0,r.kt)(d,(0,a.Z)({},c,n,{components:t,mdxType:"MDXLayout"}),(0,r.kt)("h2",{id:"typeorm-overview"},"TypeORM Overview"),(0,r.kt)("p",null,(0,r.kt)("a",{parentName:"p",href:"https://typeorm.io"},"TypeORM")," is an ORM for TypeScript.  It is based on the idea of creating ",(0,r.kt)("a",{parentName:"p",href:"https://typeorm.io/entities"},(0,r.kt)("inlineCode",{parentName:"a"},"Entity"))," classes to represent each database table, with the persistent and join key fields marked with ",(0,r.kt)("a",{parentName:"p",href:"https://typeorm.io/decorator-reference"},"decorators"),".  Once entity classes are defined, TypeORM provides methods for storing, updating, and querying the entities via the ",(0,r.kt)("a",{parentName:"p",href:"https://typeorm.io/working-with-entity-manager"},(0,r.kt)("inlineCode",{parentName:"a"},"EntityManager")),".  TypeORM can also be used to create and maintain the database schema."),(0,r.kt)("p",null,"If you are using TypeORM, Operon needs to know about it for inserting workflow status updates along the transactions used for application code."),(0,r.kt)("p",null,"Use of TypeORM is optional.  Operon supports several other libraries for transactional data management."),(0,r.kt)("h2",{id:"usage"},"Usage"),(0,r.kt)("p",null,"Operon supports what is essentially direct use of TypeORM, but a few additional steps are necessary to inform Operon about the TypeORM entity list, provide the information for establishing the database connection, and use a transaction in the context of a workflow."),(0,r.kt)("h3",{id:"setting-up-the-database-connection"},"Setting Up The Database Connection"),(0,r.kt)("p",null,"In order to set up the database connection (",(0,r.kt)("a",{parentName:"p",href:"https://typeorm.io/data-source"},(0,r.kt)("inlineCode",{parentName:"a"},"DataSource")),"), configuration information is provided to Operon instead of creating a separate configuration file or instantiating ",(0,r.kt)("inlineCode",{parentName:"p"},"DataSource")," directly.  Of particular interest is the line ",(0,r.kt)("inlineCode",{parentName:"p"},"user_dbclient: 'typeorm'"),", which indicates that TypeORM is to be loaded and a ",(0,r.kt)("inlineCode",{parentName:"p"},"DataSource")," configured."),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-yaml"},"database:\n  hostname: ${POSTGRES_HOST}\n  port: ${POSTGRES_PORT}\n  username: ${POSTGRES_USERNAME}\n  password: ${POSTGRES_PASSWORD}\n  user_database: ${POSTGRES_DATABASE}\n  system_database: 'opsys'\n  connectionTimeoutMillis: 3000\n  user_dbclient: 'typeorm'\n")),(0,r.kt)("h3",{id:"setting-up-entities"},"Setting Up Entities"),(0,r.kt)("p",null,"In Operon, TypeORM entities are ",(0,r.kt)("a",{parentName:"p",href:"https://typeorm.io/entities"},"defined in the same way as any other TypeORM project"),", for example:"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-typescript"},'import { Entity, Column, PrimaryColumn } from "typeorm";\n\n@Entity()\nexport class KV {\n  @PrimaryColumn()\n  id: string = "t";\n\n  @Column()\n  value: string = "v";\n}\n')),(0,r.kt)("p",null,"Operon handles the entity registration that would otherwise be done in a TypeORM ",(0,r.kt)("inlineCode",{parentName:"p"},"DataSource")," instantiation or configuration file.  To make Operon aware of the entities, a class-level decorator is used on each class containing Operon transaction methods:"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-typescript"},"@OrmEntities([KV])\nclass KVOperations {\n}\n")),(0,r.kt)("h3",{id:"setting-up-the-schema"},"Setting Up The Schema"),(0,r.kt)("p",null,"TypeORM can use the entity classes to create/migrate (synchronize) and drop the database schema.  (This behavior is optional, for those hesitating to use such automation in production scenarios.)"),(0,r.kt)("p",null,"This may be invoked from an Operon user database instance:"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre"},"  await operon.userDatabase.createSchema();\n  await operon.userDatabase.dropSchema();\n")),(0,r.kt)("p",null,"Or from the ",(0,r.kt)("a",{parentName:"p",href:".."},"testing runtime"),":"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-typescript"},"    await testRuntime.dropUserSchema();\n    await testRuntime.createUserSchema();\n")),(0,r.kt)("p",null,"Additional options for triggering schema migration during the application deployment process are forthcoming."),(0,r.kt)("h3",{id:"invoking-transactions"},"Invoking Transactions"),(0,r.kt)("p",null,"In TypeORM (and many other frameworks), the pattern is to run ",(0,r.kt)("a",{parentName:"p",href:"https://typeorm.io/transactions"},"transactions")," as callback functions.  (This allows the framework to ensure that the transaction is opened and closed properly, and to ensure that all statements run on the same connection from the connection pool.)"),(0,r.kt)("p",null,"Operon provides a wrapper around TypeORM's transaction functionality so that its workflow state can be kept consistent with the application database."),(0,r.kt)("p",null,"First, Operon transactions are declared.  The easiest way is with a class method decorated with ",(0,r.kt)("a",{parentName:"p",href:"/api-reference/decorators#operontransaction"},(0,r.kt)("inlineCode",{parentName:"a"},"@OperonTransaction")),", and the first argument will be an Operon ",(0,r.kt)("a",{parentName:"p",href:"/api-reference/contexts#transactioncontext"},(0,r.kt)("inlineCode",{parentName:"a"},"TransactionContext"))," with an ",(0,r.kt)("inlineCode",{parentName:"p"},"EntityManager")," named ",(0,r.kt)("inlineCode",{parentName:"p"},"client")," inside."),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-typescript"},'@OrmEntities([KV])\nclass KVOperations {\n  @OperonTransaction()\n  static async writeTxn(txnCtxt: TransactionContext<EntityManager>, id: string, value: string) {\n    const kv: KV = new KV();\n    kv.id = id;\n    kv.value = value;\n    const res = await txnCtxt.client.save(kv);\n    return res.id;\n  }\n\n  // eslint-disable-next-line @typescript-eslint/require-await\n  @OperonTransaction({ readOnly: true })\n  static async readTxn(txnCtxt: TransactionContext<EntityManager>, id: string) {\n    const kvp = await txnCtxt.client.findOneBy(KV, {id: id});\n    return kvp?.value || "<Not Found>";\n  }\n}\n')),(0,r.kt)("p",null,"If preferred, it is possible to define a ",(0,r.kt)("inlineCode",{parentName:"p"},"type")," to clean up the transaction method prototypes a little bit."),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-typescript"},"type TypeORMTransactionContext = TransactionContext<EntityManager>;\n")),(0,r.kt)("h3",{id:"unit-testing"},"Unit Testing"),(0,r.kt)("p",null,"Use of TypeORM in the testing runtime is quite similar to using TypeORM in development, with the addition of appropriate placement of calls to set up and tear down the database schema."),(0,r.kt)("p",null,"In ",(0,r.kt)("inlineCode",{parentName:"p"},"jest"),", to set up the database once at the beginning of the test and tear down at the end:"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-typescript"},'beforeAll(async () => {\n  testRuntime = await createTestingRuntime([OperonAppClasses], "operon-config.yaml");\n  await testRuntime.dropUserSchema(); // Optional\n  await testRuntime.createUserSchema();\n});\n\nafterAll(async () => {\n  await testRuntime.dropUserSchema();\n  await testRuntime.destroy();\n});\n')),(0,r.kt)("p",null,"This will create the testing runtime, load TypeORM, and register the entities according to the decorators in ",(0,r.kt)("inlineCode",{parentName:"p"},"OperonAppClasses"),". The database will be configured according to the ",(0,r.kt)("inlineCode",{parentName:"p"},"database")," section of the specified configuration ",(0,r.kt)("inlineCode",{parentName:"p"},"operon-config.yaml")," file:"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-yaml"},"database:\n  hostname: ${POSTGRES_HOST}\n  port: ${POSTGRES_PORT}\n  username: ${POSTGRES_USERNAME}\n  password: ${POSTGRES_PASSWORD}\n  user_database: ${POSTGRES_DATABASE}\n  system_database: 'opsys'\n  connectionTimeoutMillis: 3000\n  user_dbclient: 'typeorm'\n")),(0,r.kt)("p",null,"The testing runtime can be used to invoke Operon methods directly, or exercise handlers:"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-typescript"},"  testRuntime.invoke(KVController, readUUID).readTxn(\"oaootest\"),\n  const response = await request(testRuntime.getHandlersCallback()).get('/');\n")),(0,r.kt)("h2",{id:"typeorm-example"},"TypeORM Example"),(0,r.kt)("p",null,"The ",(0,r.kt)("a",{parentName:"p",href:"https://github.com/dbos-inc/operon-demo-apps/tree/main/yky-social"},"YKY Social")," example uses TypeORM."))}u.isMDXComponent=!0}}]);