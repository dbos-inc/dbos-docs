"use strict";(self.webpackChunkoperon_docs=self.webpackChunkoperon_docs||[]).push([[664],{3905:(e,t,n)=>{n.d(t,{Zo:()=>u,kt:()=>m});var r=n(7294);function i(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function o(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function a(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?o(Object(n),!0).forEach((function(t){i(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):o(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function s(e,t){if(null==e)return{};var n,r,i=function(e,t){if(null==e)return{};var n,r,i={},o=Object.keys(e);for(r=0;r<o.length;r++)n=o[r],t.indexOf(n)>=0||(i[n]=e[n]);return i}(e,t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(r=0;r<o.length;r++)n=o[r],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(i[n]=e[n])}return i}var l=r.createContext({}),p=function(e){var t=r.useContext(l),n=t;return e&&(n="function"==typeof e?e(t):a(a({},t),e)),n},u=function(e){var t=p(e.components);return r.createElement(l.Provider,{value:t},e.children)},c="mdxType",d={inlineCode:"code",wrapper:function(e){var t=e.children;return r.createElement(r.Fragment,{},t)}},g=r.forwardRef((function(e,t){var n=e.components,i=e.mdxType,o=e.originalType,l=e.parentName,u=s(e,["components","mdxType","originalType","parentName"]),c=p(n),g=i,m=c["".concat(l,".").concat(g)]||c[g]||d[g]||o;return n?r.createElement(m,a(a({ref:t},u),{},{components:n})):r.createElement(m,a({ref:t},u))}));function m(e,t){var n=arguments,i=t&&t.mdxType;if("string"==typeof e||i){var o=n.length,a=new Array(o);a[0]=g;var s={};for(var l in t)hasOwnProperty.call(t,l)&&(s[l]=t[l]);s.originalType=e,s[c]="string"==typeof e?e:i,a[1]=s;for(var p=2;p<o;p++)a[p]=n[p];return r.createElement.apply(null,a)}return r.createElement.apply(null,n)}g.displayName="MDXCreateElement"},7680:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>l,contentTitle:()=>a,default:()=>d,frontMatter:()=>o,metadata:()=>s,toc:()=>p});var r=n(7462),i=(n(7294),n(3905));const o={sidebar_position:9,title:"Testing",description:"Learn how to use the testing runtime for unit tests."},a=void 0,s={unversionedId:"tutorials/testing-tutorial",id:"tutorials/testing-tutorial",title:"Testing",description:"Learn how to use the testing runtime for unit tests.",source:"@site/docs/tutorials/testing-tutorial.md",sourceDirName:"tutorials",slug:"/tutorials/testing-tutorial",permalink:"/operon-docs/tutorials/testing-tutorial",draft:!1,tags:[],version:"current",sidebarPosition:9,frontMatter:{sidebar_position:9,title:"Testing",description:"Learn how to use the testing runtime for unit tests."},sidebar:"tutorialSidebar",previous:{title:"Logging and Tracing",permalink:"/operon-docs/tutorials/logging"},next:{title:"Communication Example",permalink:"/operon-docs/tutorials/ping-pong-tutorial"}},l={},p=[{value:"Creating Testing Runtime",id:"creating-testing-runtime",level:3},{value:"Invoking Functions",id:"invoking-functions",level:3},{value:"Testing HTTP Endpoints",id:"testing-http-endpoints",level:3},{value:"Cleaning Up",id:"cleaning-up",level:3},{value:"Further Reading",id:"further-reading",level:3}],u={toc:p},c="wrapper";function d(e){let{components:t,...n}=e;return(0,i.kt)(c,(0,r.Z)({},u,n,{components:t,mdxType:"MDXLayout"}),(0,i.kt)("p",null,"In this guide, you'll learn how to test your Operon applications."),(0,i.kt)("p",null,"Operon provides a ",(0,i.kt)("a",{parentName:"p",href:".."},"testing runtime")," that allows you to test your applications without starting an HTTP server.\nThe testing runtime provides useful methods for you to invoke decorated Operon functions, communicate with workflows, test HTTP endpoints, and query the user database.\nThis is especially helpful if you want to thoroughly test your applications with unit tests and debug individual functions within complex workflows."),(0,i.kt)("p",null,"We'll show you how to write unit tests for the ",(0,i.kt)("inlineCode",{parentName:"p"},"Hello")," class we introduced in ",(0,i.kt)("a",{parentName:"p",href:"/operon-docs/getting-started/quickstart-programming-1"},"Programming Quickstart: Part 1"),". We use ",(0,i.kt)("a",{parentName:"p",href:"https://jestjs.io/"},"Jest")," as an example, however, Operon testing runtime works with any testing framework."),(0,i.kt)("h3",{id:"creating-testing-runtime"},"Creating Testing Runtime"),(0,i.kt)("p",null,"First, let's create an ",(0,i.kt)("inlineCode",{parentName:"p"},"OperonTestingRuntime")," object:"),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-javascript"},"testRuntime = await createTestingRuntime([Hello]);\n")),(0,i.kt)("p",null,"You simply pass in a list of classes you want to test. For example, we pass in ",(0,i.kt)("inlineCode",{parentName:"p"},"[Hello]")," here."),(0,i.kt)("h3",{id:"invoking-functions"},"Invoking Functions"),(0,i.kt)("p",null,"A testing runtime object can invoke workflows, transactions, and communicators using the ",(0,i.kt)("inlineCode",{parentName:"p"},"invoke")," method.\nFor example, we can invoke ",(0,i.kt)("inlineCode",{parentName:"p"},"helloTransaction")," and verify the output is as expected:"),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-javascript"},'const res = await testRuntime.invoke(Hello).helloTransaction("operon");\nexpect(res).toMatch("Hello, operon! You have been greeted");\n')),(0,i.kt)("p",null,"In this code, we invoke the transaction with the input string ",(0,i.kt)("inlineCode",{parentName:"p"},'"operon"'),"."),(0,i.kt)("h3",{id:"testing-http-endpoints"},"Testing HTTP Endpoints"),(0,i.kt)("p",null,"The testing runtime provides a ",(0,i.kt)("inlineCode",{parentName:"p"},"getHandlersCallback()")," function, which  returns a callback function for node's native http/http2 server. This allows you to test Operon handlers, for example, with ",(0,i.kt)("a",{parentName:"p",href:"https://www.npmjs.com/package/supertest"},"supertest"),":"),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-javascript"},'const res = await request(testRuntime.getHandlersCallback()).get(\n  "/greeting/operon"\n);\nexpect(res.statusCode).toBe(200);\nexpect(res.text).toMatch("Hello, operon! You have been greeted");\n')),(0,i.kt)("p",null,"In this code, we send a ",(0,i.kt)("inlineCode",{parentName:"p"},"GET")," request to our ",(0,i.kt)("inlineCode",{parentName:"p"},"/greeting/operon")," URL and verify the response."),(0,i.kt)("h3",{id:"cleaning-up"},"Cleaning Up"),(0,i.kt)("p",null,"Finally, after your tests, you can clean up the testing runtime and release its resources:"),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-javascript"},"await testRuntime.destroy();\n")),(0,i.kt)("h3",{id:"further-reading"},"Further Reading"),(0,i.kt)("p",null,"To learn the full testing runtime interface, please see ",(0,i.kt)("a",{parentName:"p",href:".."},"our testing runtime references"),".\nYou can find the source code for this tutorial in ",(0,i.kt)("a",{parentName:"p",href:".."},"operations.test.ts"),"."))}d.isMDXComponent=!0}}]);