"use strict";(self.webpackChunkdbos_docs=self.webpackChunkdbos_docs||[]).push([[5155],{6647:(e,n,s)=>{s.r(n),s.d(n,{assets:()=>c,contentTitle:()=>o,default:()=>u,frontMatter:()=>a,metadata:()=>r,toc:()=>l});var i=s(5893),t=s(1151);const a={sidebar_position:10,title:"Configuring Class Instances",description:"Learn how to make workflows, transactions, and communicators reusable and configurable"},o=void 0,r={id:"tutorials/configured-instances",title:"Configuring Class Instances",description:"Learn how to make workflows, transactions, and communicators reusable and configurable",source:"@site/docs/tutorials/configured-instances.md",sourceDirName:"tutorials",slug:"/tutorials/configured-instances",permalink:"/tutorials/configured-instances",draft:!1,unlisted:!1,tags:[],version:"current",sidebarPosition:10,frontMatter:{sidebar_position:10,title:"Configuring Class Instances",description:"Learn how to make workflows, transactions, and communicators reusable and configurable"},sidebar:"tutorialSidebar",previous:{title:"Authentication and Authorization",permalink:"/tutorials/authentication-authorization"},next:{title:"Using Knex",permalink:"/tutorials/using-knex"}},c={},l=[{value:"Concepts",id:"concepts",level:2},{value:"Instances",id:"instances",level:3},{value:"Names",id:"names",level:3},{value:"Using Configured Class Instances",id:"using-configured-class-instances",level:2},{value:"Creating",id:"creating",level:3},{value:"Invoking",id:"invoking",level:3},{value:"Writing New Configured Classes",id:"writing-new-configured-classes",level:2},{value:"Declaring",id:"declaring",level:3},{value:"<code>initialize()</code> Method",id:"initialize-method",level:3},{value:"Notes",id:"notes",level:2}];function d(e){const n={code:"code",h2:"h2",h3:"h3",li:"li",p:"p",pre:"pre",ul:"ul",...(0,t.a)(),...e.components};return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(n.p,{children:"In this guide, you'll learn how to make your DBOS functions configurable using instances."}),"\n",(0,i.jsx)(n.h2,{id:"concepts",children:"Concepts"}),"\n",(0,i.jsx)(n.p,{children:"Basic DBOS transactions, communicators, and workflows are just functions - they accept input parameters, apply those parameters to the database, or use them to place calls to external services."}),"\n",(0,i.jsxs)(n.p,{children:["However, it is sometimes desirable to have configuration information available to DBOS functions.  Using function parameters for items such as access URLs, API keys, port numbers, and so on is a bad idea, so these are generally stored as configuration data in ",(0,i.jsx)(n.code,{children:"dbos-config.yaml"})," or otherwise accessed from context."]}),"\n",(0,i.jsx)(n.p,{children:"If a function needs more than one configuration, such global settings are not adequate.  For example, an email-sending function may send email with one set of addresses and credentials for promotional materials to prospects, or another set of credentials for replies to support inquiries from existing customers."}),"\n",(0,i.jsx)(n.h3,{id:"instances",children:"Instances"}),"\n",(0,i.jsxs)(n.p,{children:["Configured class instances are the DBOS Transact mechanism for creating multiple configurations for the same code.  Rather than having ",(0,i.jsx)(n.code,{children:"static"})," class member functions, configured instances have non-static member functions that can access configuration information through ",(0,i.jsx)(n.code,{children:"this"}),"."]}),"\n",(0,i.jsx)(n.h3,{id:"names",children:"Names"}),"\n",(0,i.jsx)(n.p,{children:"Configured instances have names, which are simple strings identifying the configuration.  These names are used by DBOS Transact internally, but are also potentially useful for monitoring, tracing, and debugging."}),"\n",(0,i.jsx)(n.h2,{id:"using-configured-class-instances",children:"Using Configured Class Instances"}),"\n",(0,i.jsx)(n.p,{children:"Configured class instances should be created and named when the application starts, before any workflows can run.  This ensures that they weill all be initialized before any processing begins."}),"\n",(0,i.jsx)(n.h3,{id:"creating",children:"Creating"}),"\n",(0,i.jsxs)(n.p,{children:["To create and register a class instance, the ",(0,i.jsx)(n.code,{children:"configureInstance"})," function is used:"]}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-typescript",children:"import { configureInstance } from \"@dbos-inc/dbos-sdk\";\nconst myObj = configureInstance(MyClass, 'myname', args);\n"})}),"\n",(0,i.jsxs)(n.p,{children:["The arguments to ",(0,i.jsx)(n.code,{children:"configureInstance"})," are:"]}),"\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsx)(n.li,{children:"The class to be instantiated and configured"}),"\n",(0,i.jsx)(n.li,{children:"The name for the configured instance (which must be unique within the set of instances of the same class)"}),"\n",(0,i.jsx)(n.li,{children:"Any additional arguments to pass to the class constructor"}),"\n"]}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-typescript",children:"configureInstance(cls: Constructor, name: string, ...args: unknown[]) : R\n"})}),"\n",(0,i.jsxs)(n.p,{children:["Note that while this will create and register the object instance, initialization via the object's ",(0,i.jsx)(n.code,{children:"initialize()"})," method will not occur until later, after database connections have been established."]}),"\n",(0,i.jsx)(n.h3,{id:"invoking",children:"Invoking"}),"\n",(0,i.jsx)(n.p,{children:"Methods of configured instances can be invoked from contexts (and the testing runtime) in a manner syntactically similar to static class methods:"}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-typescript",children:"ctx.invoke(MyClass).myStaticFunction(args); // Use on a static function\nctx.invoke(myObj).myMemberFunction(args); // Use on a configured object instance\n"})}),"\n",(0,i.jsx)(n.h2,{id:"writing-new-configured-classes",children:"Writing New Configured Classes"}),"\n",(0,i.jsx)(n.h3,{id:"declaring",children:"Declaring"}),"\n",(0,i.jsx)(n.p,{children:"All configured classes must:"}),"\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsxs)(n.li,{children:["Extend from the ",(0,i.jsx)(n.code,{children:"ConfiguredInstance"})," base class"]}),"\n",(0,i.jsxs)(n.li,{children:["Provide a constructor, which can take any arguments, but must provide a name to the base ",(0,i.jsx)(n.code,{children:"ConfiguredInstance"})," constructor"]}),"\n",(0,i.jsxs)(n.li,{children:["Have an ",(0,i.jsx)(n.code,{children:"initialize(ctx: InitContext)"})," that will be called after all objects have been created, but before request handling commences"]}),"\n",(0,i.jsxs)(n.li,{children:["Have ",(0,i.jsx)(n.code,{children:"@Transaction"}),", ",(0,i.jsx)(n.code,{children:"@Communicator"}),", and/or ",(0,i.jsx)(n.code,{children:"@Workflow"})," methods to be called on the instances"]}),"\n"]}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-typescript",children:"class MyConfiguredClass extends ConfiguredInstance {\n  cfg: MyConfig;\n  constructor(name: string, config: MyConfig) {\n    super(name);\n    this.cfg = cfg;\n  }\n\n  initialize(_ctx: InitContext) : Promise<void> {\n    // Validate this.cfg\n    return Promise.resolve();\n  }\n\n  @Transaction()\n  testTransaction(_txnCtxt: TestTransactionContext) {\n    // Operations that use this.cfg\n    return Promise.resolve();\n  }\n\n  @Communicator()\n  testCommunicator(_ctxt: CommunicatorContext) {\n    // Operations that use this.cfg\n    return Promise.resolve();\n  }\n\n  @Workflow()\n  async testWorkflow(ctxt: WorkflowContext, p: string): Promise<void> {\n    // Operations that use this.cfg\n    return Promise.resolve();\n  }\n}\n"})}),"\n",(0,i.jsxs)(n.h3,{id:"initialize-method",children:[(0,i.jsx)(n.code,{children:"initialize()"})," Method"]}),"\n",(0,i.jsxs)(n.p,{children:["The ",(0,i.jsx)(n.code,{children:"initialize(ctx: InitContext)"})," method will be called during application initialization, after the code modules have been loaded, but before request and workflow processing commences.  The ",(0,i.jsx)(n.code,{children:"InitContext"})," argument provides configuration file, logging, and database access services, so any validation of connection information (complete with diagnostic logging and reporting of any problems) should be performed in ",(0,i.jsx)(n.code,{children:"initialize()"}),"."]}),"\n",(0,i.jsx)(n.h2,{id:"notes",children:"Notes"}),"\n",(0,i.jsxs)(n.p,{children:["As ",(0,i.jsx)(n.code,{children:"@GetApi"}),", ",(0,i.jsx)(n.code,{children:"@PutApi"}),", and similar handler registration decorators specify the URL directly, it does not make sense to use these on configured class instances, as there is no way to tell which instance is to handle the request."]}),"\n",(0,i.jsx)(n.p,{children:"The name of a workflow, and the name of the configuration in use, is kept in the DBOS system database so that interrupted workflows can be resumed.  It is therefore important to keep names consistent across application deployments, unless there is no chance that a pending workflow will need to be recovered."})]})}function u(e={}){const{wrapper:n}={...(0,t.a)(),...e.components};return n?(0,i.jsx)(n,{...e,children:(0,i.jsx)(d,{...e})}):d(e)}},1151:(e,n,s)=>{s.d(n,{Z:()=>r,a:()=>o});var i=s(7294);const t={},a=i.createContext(t);function o(e){const n=i.useContext(a);return i.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function r(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(t):e.components||t:o(e.components),i.createElement(a.Provider,{value:n},e.children)}}}]);