"use strict";(self.webpackChunkdbos_docs=self.webpackChunkdbos_docs||[]).push([[5457],{2275:(e,n,s)=>{s.d(n,{Ay:()=>r,RM:()=>t});var a=s(4848),i=s(8453);const t=[];function o(e){const n={a:"a",code:"code",p:"p",pre:"pre",...(0,i.R)(),...e.components},{TabItem:s,Tabs:t}=n;return s||l("TabItem",!0),t||l("Tabs",!0),(0,a.jsxs)(t,{groupId:"operating-systems",className:"small-tabs",children:[(0,a.jsxs)(s,{value:"maclinux",label:"macOS or Linux",children:[(0,a.jsx)(n.p,{children:"Run the following commands in your terminal:"}),(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-bash",children:'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash\n\nexport NVM_DIR="$HOME/.nvm"\n[ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh"  # This loads nvm\n\nnvm install 22\nnvm use 22\n'})})]}),(0,a.jsx)(s,{value:"win-ps",label:"Windows",children:(0,a.jsxs)(n.p,{children:["Download Node.js 20 or later from the ",(0,a.jsx)(n.a,{href:"https://nodejs.org/en/download",children:"official Node.js download page"})," and install it.\nAfter installing Node.js, create the following folder: ",(0,a.jsx)(n.code,{children:"C:\\Users\\%user%\\AppData\\Roaming\\npm"}),"\n(",(0,a.jsx)(n.code,{children:"%user%"})," is the Windows user on which you are logged in)."]})})]})}function r(e={}){const{wrapper:n}={...(0,i.R)(),...e.components};return n?(0,a.jsx)(n,{...e,children:(0,a.jsx)(o,{...e})}):o(e)}function l(e,n){throw new Error("Expected "+(n?"component":"object")+" `"+e+"` to be defined: you likely forgot to import, pass, or provide it.")}},1468:(e,n,s)=>{s.r(n),s.d(n,{assets:()=>d,contentTitle:()=>r,default:()=>p,frontMatter:()=>o,metadata:()=>l,toc:()=>c});var a=s(4848),i=s(8453),t=s(2275);const o={displayed_sidebar:"examplesSidebar",sidebar_position:2,title:"OpenAI Quickstart",hide_table_of_contents:!1},r=void 0,l={id:"python/examples/ai-starter",title:"OpenAI Quickstart",description:"In this tutorial, you'll learn how to build an interactive AI application and deploy it to the cloud in just 9 lines of code.",source:"@site/docs/python/examples/ai-starter.md",sourceDirName:"python/examples",slug:"/python/examples/ai-starter",permalink:"/python/examples/ai-starter",draft:!1,unlisted:!1,tags:[],version:"current",sidebarPosition:2,frontMatter:{displayed_sidebar:"examplesSidebar",sidebar_position:2,title:"OpenAI Quickstart",hide_table_of_contents:!1},sidebar:"examplesSidebar",previous:{title:"Widget Store",permalink:"/python/examples/widget-store"},next:{title:"Hacker News Slackbot",permalink:"/python/examples/hacker-news-bot"}},d={},c=[{value:"Preparation",id:"preparation",level:3},{value:"Load Data and Build a Q&amp;A Engine",id:"load-data-and-build-a-qa-engine",level:3},{value:"HTTP Serving",id:"http-serving",level:3},{value:"Hosting on DBOS Cloud",id:"hosting-on-dbos-cloud",level:3},...t.RM,{value:"Next Steps",id:"next-steps",level:3}];function h(e){const n={a:"a",code:"code",h3:"h3",li:"li",p:"p",pre:"pre",strong:"strong",ul:"ul",...(0,i.R)(),...e.components},{BrowserWindow:s,Details:o,TabItem:r,Tabs:l}=n;return s||u("BrowserWindow",!0),o||u("Details",!0),r||u("TabItem",!0),l||u("Tabs",!0),(0,a.jsxs)(a.Fragment,{children:[(0,a.jsxs)(n.p,{children:["In this tutorial, you'll learn how to build an interactive AI application and deploy it to the cloud in just ",(0,a.jsx)(n.strong,{children:"9 lines of code"}),"."]}),"\n",(0,a.jsx)(n.h3,{id:"preparation",children:"Preparation"}),"\n",(0,a.jsxs)("section",{className:"row list",children:[(0,a.jsx)("article",{className:"col col--6",children:(0,a.jsx)(n.p,{children:"First, create a folder for your app and activate a virtual environment."})}),(0,a.jsx)("article",{className:"col col--6",children:(0,a.jsxs)(l,{groupId:"operating-systems",className:"small-tabs",children:[(0,a.jsx)(r,{value:"maclinux",label:"macOS/Linux",children:(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-shell",children:"python3 -m venv ai-app/.venv\ncd ai-app\nsource .venv/bin/activate\ntouch main.py\n"})})}),(0,a.jsx)(r,{value:"win-ps",label:"Windows (PowerShell)",children:(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-shell",children:"python3 -m venv ai-app/.venv\ncd ai-app\n.venv\\Scripts\\activate.ps1\nNew-Item main.py\n"})})}),(0,a.jsx)(r,{value:"win-cmd",label:"Windows (cmd)",children:(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-shell",children:"python3 -m venv ai-app/.venv\ncd ai-app\n.venv\\Scripts\\activate.bat\nTYPE nul > main.py\n"})})})]})}),(0,a.jsx)("article",{className:"col col--6",children:(0,a.jsx)(n.p,{children:"Then, install dependencies and initialize a DBOS config file."})}),(0,a.jsx)("article",{className:"col col--6",children:(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-shell",children:"pip install dbos llama-index\ndbos init --config\n"})})}),(0,a.jsx)("article",{className:"col col--6",children:(0,a.jsxs)(n.p,{children:["Next, to run this app, you need an OpenAI developer account. Obtain an API key ",(0,a.jsx)(n.a,{href:"https://platform.openai.com/api-keys",children:"here"}),". Set the API key as an environment variable."]})}),(0,a.jsx)("article",{className:"col col--6",children:(0,a.jsxs)(l,{groupId:"operating-systems",className:"small-tabs",children:[(0,a.jsx)(r,{value:"maclinux",label:"macOS/Linux",children:(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-shell",children:"export OPENAI_API_KEY=XXXXX\n"})})}),(0,a.jsx)(r,{value:"win-ps",label:"Windows (PowerShell)",children:(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-shell",children:"set OPENAI_API_KEY=XXXXX\n"})})}),(0,a.jsx)(r,{value:"win-cmd",label:"Windows (cmd)",children:(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-shell",children:"set OPENAI_API_KEY=XXXXX\n"})})})]})}),(0,a.jsx)("article",{className:"col col--6",children:(0,a.jsxs)(n.p,{children:["Declare the environment variable in ",(0,a.jsx)(n.code,{children:"dbos-config.yaml"}),":"]})}),(0,a.jsx)("article",{className:"col col--6",children:(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-yaml",metastring:'title="dbos-config.yaml"',children:"env:\n  OPENAI_API_KEY: ${OPENAI_API_KEY}\n"})})}),(0,a.jsxs)("article",{className:"col col--6",children:[(0,a.jsxs)(n.p,{children:["Finally, let's download some data. This app uses the text from Paul Graham's ",(0,a.jsx)(n.a,{href:"http://paulgraham.com/worked.html",children:'"What I Worked On"'}),". You can download the text from ",(0,a.jsx)(n.a,{href:"https://raw.githubusercontent.com/run-llama/llama_index/main/docs/docs/examples/data/paul_graham/paul_graham_essay.txt",children:"this link"})," and save it under ",(0,a.jsx)(n.code,{children:"data/paul_graham_essay.txt"})," of your app folder."]}),(0,a.jsx)(n.p,{children:"Now, your app folder structure should look like this:"})]}),(0,a.jsx)("article",{className:"col col--6",children:(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-shell",children:"ai-app/\n\u251c\u2500\u2500 dbos-config.yaml\n\u251c\u2500\u2500 main.py\n\u2514\u2500\u2500 data/\n    \u2514\u2500\u2500 paul_graham_essay.txt\n"})})})]}),"\n",(0,a.jsx)(n.h3,{id:"load-data-and-build-a-qa-engine",children:"Load Data and Build a Q&A Engine"}),"\n",(0,a.jsxs)(n.p,{children:["Now, let's use LlamaIndex to write a simple AI application in just 5 lines of code.\nAdd the following code to your ",(0,a.jsx)(n.code,{children:"main.py"}),":"]}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-python",metastring:'showLineNumbers title="main.py"',children:'from llama_index.core import VectorStoreIndex, SimpleDirectoryReader\n\ndocuments = SimpleDirectoryReader("data").load_data()\nindex = VectorStoreIndex.from_documents(documents)\n\nquery_engine = index.as_query_engine()\nresponse = query_engine.query("What did the author do growing up?")\nprint(response)\n'})}),"\n",(0,a.jsxs)(n.p,{children:["This script loads data and builds an index over the documents under the ",(0,a.jsx)(n.code,{children:"data/"})," folder, and it generates an answer by querying the index. You can run this script and it should give you a response, for example:"]}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-bash",children:"$ python3 main.py\n\nThe author worked on writing short stories and programming...\n"})}),"\n",(0,a.jsx)(n.h3,{id:"http-serving",children:"HTTP Serving"}),"\n",(0,a.jsxs)(n.p,{children:["Now, let's add a FastAPI endpoint to serve responses through HTTP. Modify your ",(0,a.jsx)(n.code,{children:"main.py"})," as follows:"]}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-python",metastring:'showLineNumbers title="main.py"',children:'from llama_index.core import VectorStoreIndex, SimpleDirectoryReader\n#highlight-next-line\nfrom fastapi import FastAPI\n\n#highlight-next-line\napp = FastAPI()\n\ndocuments = SimpleDirectoryReader("data").load_data()\nindex = VectorStoreIndex.from_documents(documents)\nquery_engine = index.as_query_engine()\n\n#highlight-start\n@app.get("/")\ndef get_answer():\n#highlight-end\n    response = query_engine.query("What did the author do growing up?")\n#highlight-next-line\n    return str(response)\n'})}),"\n",(0,a.jsxs)(n.p,{children:["Now you can start your app with ",(0,a.jsx)(n.code,{children:"fastapi run main.py"}),". To see that it's working, visit this URL: ",(0,a.jsx)(n.a,{href:"http://localhost:8000",children:"http://localhost:8000"})]}),"\n",(0,a.jsx)(s,{url:"http://localhost:8000",children:(0,a.jsx)(n.p,{children:'"The author worked on writing short stories and programming..."'})}),"\n",(0,a.jsx)(n.p,{children:"The result may be slightly different every time you refresh your browser window!"}),"\n",(0,a.jsx)(n.h3,{id:"hosting-on-dbos-cloud",children:"Hosting on DBOS Cloud"}),"\n",(0,a.jsxs)(n.p,{children:["To deploy your app to DBOS Cloud, you only need to add two lines to ",(0,a.jsx)(n.code,{children:"main.py"}),":"]}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-python",metastring:'showLineNumbers title="main.py"',children:'from llama_index.core import VectorStoreIndex, SimpleDirectoryReader\nfrom fastapi import FastAPI\n#highlight-next-line\nfrom dbos import DBOS\n\napp = FastAPI()\n#highlight-next-line\nDBOS(fastapi=app)\n\ndocuments = SimpleDirectoryReader("data").load_data()\nindex = VectorStoreIndex.from_documents(documents)\nquery_engine = index.as_query_engine()\n\n@app.get("/")\ndef get_answer():\n    response = query_engine.query("What did the author do growing up?")\n    return str(response)\n'})}),"\n",(0,a.jsx)(n.p,{children:"Now, install the DBOS Cloud CLI if you haven't already (requires Node.js):"}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-shell",children:"npm i -g @dbos-inc/dbos-cloud\n"})}),"\n",(0,a.jsxs)(o,{children:[(0,a.jsx)("summary",{children:"Instructions to install Node.js"}),(0,a.jsx)(t.Ay,{})]}),"\n",(0,a.jsxs)(n.p,{children:["Then freeze dependencies to ",(0,a.jsx)(n.code,{children:"requirements.txt"})," and deploy to DBOS Cloud:"]}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-shell",children:"pip freeze > requirements.txt\ndbos-cloud app deploy\n"})}),"\n",(0,a.jsxs)(n.p,{children:["In less than a minute, it should print ",(0,a.jsx)(n.code,{children:"Access your application at <URL>"}),".\nTo see that your app is working, visit ",(0,a.jsx)(n.code,{children:"<URL>"})," in your browser."]}),"\n",(0,a.jsx)(s,{url:"https://<username>-ai-app.cloud.dbos.dev",children:(0,a.jsx)(n.p,{children:'"The author worked on writing short stories and programming..."'})}),"\n",(0,a.jsxs)(n.p,{children:["Congratulations, you've successfully deployed your first AI app to DBOS Cloud! You can see your deployed app in the ",(0,a.jsx)(n.a,{href:"https://console.dbos.dev/login-redirect",children:"cloud console"}),"."]}),"\n",(0,a.jsx)(n.h3,{id:"next-steps",children:"Next Steps"}),"\n",(0,a.jsx)(n.p,{children:"This is just the beginning of your DBOS journey. Next, check out how DBOS can make your AI applications more scalable and resilient:"}),"\n",(0,a.jsxs)(n.ul,{children:["\n",(0,a.jsxs)(n.li,{children:["Use ",(0,a.jsx)(n.a,{href:"/python/programming-guide",children:"durable execution"})," to write crashproof workflows."]}),"\n",(0,a.jsxs)(n.li,{children:["Use ",(0,a.jsx)(n.a,{href:"/python/tutorials/queue-tutorial",children:"queues"})," to gracefully manage AI/LLM API rate limits."]}),"\n",(0,a.jsxs)(n.li,{children:["Want to build a more complex app? Check out the ",(0,a.jsx)(n.a,{href:"/python/examples/rag-slackbot",children:"AI-Powered Slackbot"}),"."]}),"\n"]})]})}function p(e={}){const{wrapper:n}={...(0,i.R)(),...e.components};return n?(0,a.jsx)(n,{...e,children:(0,a.jsx)(h,{...e})}):h(e)}function u(e,n){throw new Error("Expected "+(n?"component":"object")+" `"+e+"` to be defined: you likely forgot to import, pass, or provide it.")}},8453:(e,n,s)=>{s.d(n,{R:()=>o,x:()=>r});var a=s(6540);const i={},t=a.createContext(i);function o(e){const n=a.useContext(t);return a.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function r(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(i):e.components||i:o(e.components),a.createElement(t.Provider,{value:n},e.children)}}}]);