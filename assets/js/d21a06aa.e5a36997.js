"use strict";(self.webpackChunkoperon_docs=self.webpackChunkoperon_docs||[]).push([[608],{3905:(e,t,n)=>{n.d(t,{Zo:()=>s,kt:()=>f});var r=n(7294);function o(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function i(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function a(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?i(Object(n),!0).forEach((function(t){o(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):i(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function p(e,t){if(null==e)return{};var n,r,o=function(e,t){if(null==e)return{};var n,r,o={},i=Object.keys(e);for(r=0;r<i.length;r++)n=i[r],t.indexOf(n)>=0||(o[n]=e[n]);return o}(e,t);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);for(r=0;r<i.length;r++)n=i[r],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(o[n]=e[n])}return o}var l=r.createContext({}),c=function(e){var t=r.useContext(l),n=t;return e&&(n="function"==typeof e?e(t):a(a({},t),e)),n},s=function(e){var t=c(e.components);return r.createElement(l.Provider,{value:t},e.children)},u="mdxType",m={inlineCode:"code",wrapper:function(e){var t=e.children;return r.createElement(r.Fragment,{},t)}},d=r.forwardRef((function(e,t){var n=e.components,o=e.mdxType,i=e.originalType,l=e.parentName,s=p(e,["components","mdxType","originalType","parentName"]),u=c(n),d=o,f=u["".concat(l,".").concat(d)]||u[d]||m[d]||i;return n?r.createElement(f,a(a({ref:t},s),{},{components:n})):r.createElement(f,a({ref:t},s))}));function f(e,t){var n=arguments,o=t&&t.mdxType;if("string"==typeof e||o){var i=n.length,a=new Array(i);a[0]=d;var p={};for(var l in t)hasOwnProperty.call(t,l)&&(p[l]=t[l]);p.originalType=e,p[u]="string"==typeof e?e:o,a[1]=p;for(var c=2;c<i;c++)a[c]=n[c];return r.createElement.apply(null,a)}return r.createElement.apply(null,n)}d.displayName="MDXCreateElement"},4766:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>l,contentTitle:()=>a,default:()=>m,frontMatter:()=>i,metadata:()=>p,toc:()=>c});var r=n(7462),o=(n(7294),n(3905));const i={sidebar_position:2,title:"Operon CLI",description:"API documentation for the Operon CLI"},a=void 0,p={unversionedId:"api-reference/cli",id:"api-reference/cli",title:"Operon CLI",description:"API documentation for the Operon CLI",source:"@site/docs/api-reference/cli.md",sourceDirName:"api-reference",slug:"/api-reference/cli",permalink:"/operon-docs/api-reference/cli",draft:!1,tags:[],version:"current",sidebarPosition:2,frontMatter:{sidebar_position:2,title:"Operon CLI",description:"API documentation for the Operon CLI"},sidebar:"tutorialSidebar",previous:{title:"Operon Configuration",permalink:"/operon-docs/api-reference/configuration"},next:{title:"Decorator Reference",permalink:"/operon-docs/api-reference/decorators"}},l={},c=[{value:"Commands",id:"commands",level:2},{value:"<code>npx operon start</code>",id:"npx-operon-start",level:3},{value:"<code>npx operon init</code>",id:"npx-operon-init",level:3}],s={toc:c},u="wrapper";function m(e){let{components:t,...n}=e;return(0,o.kt)(u,(0,r.Z)({},s,n,{components:t,mdxType:"MDXLayout"}),(0,o.kt)("p",null,"The Operon CLI helps you manage Operon applications."),(0,o.kt)("h2",{id:"commands"},"Commands"),(0,o.kt)("hr",null),(0,o.kt)("h3",{id:"npx-operon-start"},(0,o.kt)("inlineCode",{parentName:"h3"},"npx operon start")),(0,o.kt)("p",null,(0,o.kt)("strong",{parentName:"p"},"Description:"),(0,o.kt)("br",{parentName:"p"}),"\n","This command launches the Operon runtime and HTTP server to serve an application. It registers all functions and serves all endpoints in classes exported from ",(0,o.kt)("inlineCode",{parentName:"p"},"src/operations.ts"),"."),(0,o.kt)("p",null,(0,o.kt)("strong",{parentName:"p"},"Parameters:"),"  "),(0,o.kt)("ul",null,(0,o.kt)("li",{parentName:"ul"},(0,o.kt)("inlineCode",{parentName:"li"},"-p, --port <port-number>"),": The port on which to serve the application."),(0,o.kt)("li",{parentName:"ul"},(0,o.kt)("inlineCode",{parentName:"li"},"-l, --logLevel <log-level>"),": The log level at which to run the application. Must be one of ",(0,o.kt)("inlineCode",{parentName:"li"},"DEBUG"),", ",(0,o.kt)("inlineCode",{parentName:"li"},"INFO"),", ",(0,o.kt)("inlineCode",{parentName:"li"},"WARN"),", ",(0,o.kt)("inlineCode",{parentName:"li"},"ERROR"),"."),(0,o.kt)("li",{parentName:"ul"},(0,o.kt)("inlineCode",{parentName:"li"},"-c, --configFile <config-file>"),": The path to an ",(0,o.kt)("a",{parentName:"li",href:"./configuration"},"Operon configuration file")," to use for this application.")),(0,o.kt)("hr",null),(0,o.kt)("h3",{id:"npx-operon-init"},(0,o.kt)("inlineCode",{parentName:"h3"},"npx operon init")),(0,o.kt)("p",null,(0,o.kt)("strong",{parentName:"p"},"Description:"),(0,o.kt)("br",{parentName:"p"}),"\n",'This command initializes a new Operon application from a template into a target directory. By default, the instantiated application is the "Hello, world!" application using ',(0,o.kt)("a",{parentName:"p",href:"https://knexjs.org/"},"knex.js")," used in the ",(0,o.kt)("a",{parentName:"p",href:"../getting-started/quickstart"},"quickstart"),"."),(0,o.kt)("p",null,(0,o.kt)("strong",{parentName:"p"},"Parameters:"),"  "),(0,o.kt)("ul",null,(0,o.kt)("li",{parentName:"ul"},(0,o.kt)("inlineCode",{parentName:"li"},"-n, --appName <application-name>"),": The name and directory to which to initialize the application.")))}m.isMDXComponent=!0}}]);