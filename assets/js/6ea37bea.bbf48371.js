"use strict";(self.webpackChunkdbos_docs=self.webpackChunkdbos_docs||[]).push([[517],{2134:(e,n,s)=>{s.r(n),s.d(n,{assets:()=>c,contentTitle:()=>a,default:()=>p,frontMatter:()=>o,metadata:()=>t,toc:()=>d});const t=JSON.parse('{"id":"integrations/nestjs","title":"Nest.js + DBOS","description":"This guide shows you how to add the open source DBOS Transact library to your existing Nest.js application to durably execute it and make it resilient to any failure.","source":"@site/docs/integrations/nestjs.md","sourceDirName":"integrations","slug":"/integrations/nestjs","permalink":"/integrations/nestjs","draft":false,"unlisted":false,"tags":[],"version":"current","sidebarPosition":2,"frontMatter":{"sidebar_position":2,"title":"Nest.js + DBOS"},"sidebar":"tutorialSidebar","previous":{"title":"Supabase","permalink":"/integrations/supabase"},"next":{"title":"Next.js + DBOS","permalink":"/integrations/adding-dbos-to-next"}}');var i=s(4848),r=s(8453);const o={sidebar_position:2,title:"Nest.js + DBOS"},a=void 0,c={},d=[{value:"Installation and Requirements",id:"installation-and-requirements",level:2},{value:"Bootstrapping DBOS",id:"bootstrapping-dbos",level:2},{value:"Register Services With DBOS",id:"register-services-with-dbos",level:2},{value:"Add Nest.js Providers",id:"add-nestjs-providers",level:2}];function l(e){const n={a:"a",admonition:"admonition",code:"code",h2:"h2",p:"p",pre:"pre",strong:"strong",...(0,r.R)(),...e.components};return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsxs)(n.p,{children:["This guide shows you how to add the open source ",(0,i.jsx)(n.a,{href:"https://github.com/dbos-inc/dbos-transact-ts",children:"DBOS Transact"})," library to your existing ",(0,i.jsx)(n.a,{href:"https://nestjs.com/",children:"Nest.js"})," application to ",(0,i.jsx)(n.strong,{children:"durably execute"})," it and make it resilient to any failure."]}),"\n",(0,i.jsx)(n.h2,{id:"installation-and-requirements",children:"Installation and Requirements"}),"\n",(0,i.jsxs)(n.p,{children:["Install DBOS TypeScript with ",(0,i.jsx)(n.code,{children:"npm install @dbos-inc/dbos-sdk"})," and add a ",(0,i.jsx)(n.code,{children:"dbos-config.yaml"})," file to the root of your project:"]}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-yaml",children:"language: node\ntelemetry:\n  logs:\n    logLevel: 'info'\n"})}),"\n",(0,i.jsx)(n.h2,{id:"bootstrapping-dbos",children:"Bootstrapping DBOS"}),"\n",(0,i.jsx)(n.admonition,{type:"info",children:(0,i.jsxs)(n.p,{children:["This example was bootstrapped with ",(0,i.jsx)(n.code,{children:"nest new nest-starter"})," and configured to use ",(0,i.jsx)(n.a,{href:"https://www.npmjs.com/",children:"NPM"}),"."]})}),"\n",(0,i.jsx)(n.p,{children:"Modify your bootstrap function to import and launch DBOS:"}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-typescript",children:"// main.ts\nimport { NestFactory } from '@nestjs/core';\nimport { AppModule } from './app.module';\n// highlight-next-line\nimport { DBOS } from \"@dbos-inc/dbos-sdk\";\n\nasync function bootstrap() {\n  const app = await NestFactory.create(AppModule);\n  // highlight-next-line\n  await DBOS.launch();\n  await app.listen(process.env.PORT ?? 3000);\n}\nbootstrap();\n"})}),"\n",(0,i.jsx)(n.h2,{id:"register-services-with-dbos",children:"Register Services With DBOS"}),"\n",(0,i.jsxs)(n.p,{children:["To integrate a Nest.js service with DBOS, your service class must extend the DBOS ",(0,i.jsx)(n.a,{href:"https://docs.dbos.dev/typescript/reference/transactapi/dbos-class#decorating-instance-methods",children:"ConfiguredInstance"})," class. By extending ",(0,i.jsx)(n.code,{children:"ConfiguredInstance"}),", you add your class instance methods to DBOS Transact's internal registry. During ",(0,i.jsx)(n.a,{href:"https://docs.dbos.dev/typescript/tutorials/workflow-tutorial#workflow-versioning-and-recovery",children:"workflow recovery"}),", this registry enables DBOS to recover workflows using the right class instance."]}),"\n",(0,i.jsx)(n.p,{children:"Here is an example of a Nest.js service implementing a simple two-step workflow:"}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-typescript",children:"// app.service.ts\nimport { Injectable } from '@nestjs/common';\nimport { PrismaService } from 'nestjs-prisma';\n// highlight-next-line\nimport { ConfiguredInstance, DBOS, InitContext } from '@dbos-inc/dbos-sdk';\n\n@Injectable()\n// highlight-next-line\nexport class AppService extends ConfiguredInstance {\n  constructor(\n    name: string, // You must provide a name to uniquely identify this class instance in DBOS's internal registry.\n    private readonly prisma: PrismaService, // An example service dependency\n  ) {\n    super(name);\n  }\n\n  // Optionally perform some asynchronous setup work\n  async initialize(): Promise<void> {}\n\n  // highlight-next-line\n  @DBOS.workflow()\n  async businessLogic() {\n    await this.step1();\n    await this.step2();\n  }\n\n  // highlight-next-line\n  @DBOS.step()\n  async step1() {\n    ...\n  }\n\n  // highlight-next-line\n  @DBOS.step()\n  async step2() {\n    ...\n  };\n}\n"})}),"\n",(0,i.jsx)(n.h2,{id:"add-nestjs-providers",children:"Add Nest.js Providers"}),"\n",(0,i.jsxs)(n.p,{children:["We also need to write the code that Nest will use to instantiate this service during dependency injection. We'll do this with a ",(0,i.jsx)(n.a,{href:"https://docs.nestjs.com/fundamentals/custom-providers#factory-providers-usefactory",children:"custom Factory Provider"}),". Here is an example:"]}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-typescript",children:"// app.modules.ts\nimport { Module } from '@nestjs/common';\nimport { Provider } from '@nestjs/common/interfaces';\nimport { AppController } from './app.controller';\nimport { AppService } from './app.service';\nimport { PrismaService, PrismaModule } from 'nestjs-prisma';\nimport { DBOS } from '@dbos-inc/dbos-sdk';\n\nexport const dbosProvider: Provider = {\n  provide: AppService,\n  useFactory: (prisma: PrismaService) => {\n    return new AppService(\"dbosService\", prisma);\n  },\n  inject: [PrismaService],\n};\n\n@Module({\n  imports: [PrismaModule.forRoot()],\n  controllers: [AppController],\n  providers: [dbosProvider],\n})\nexport class AppModule {}\n"})}),"\n",(0,i.jsxs)(n.p,{children:["If you need multiple instances of your DBOS class, you must give them distinct names (",(0,i.jsx)(n.code,{children:"dbosService"})," in this case). You can create a dedicated provider for each or use a single provider for multiple classes, at your convenience."]})]})}function p(e={}){const{wrapper:n}={...(0,r.R)(),...e.components};return n?(0,i.jsx)(n,{...e,children:(0,i.jsx)(l,{...e})}):l(e)}},8453:(e,n,s)=>{s.d(n,{R:()=>o,x:()=>a});var t=s(6540);const i={},r=t.createContext(i);function o(e){const n=t.useContext(r);return t.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function a(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(i):e.components||i:o(e.components),t.createElement(r.Provider,{value:n},e.children)}}}]);