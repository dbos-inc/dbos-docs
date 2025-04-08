"use strict";(self.webpackChunkdbos_docs=self.webpackChunkdbos_docs||[]).push([[9425],{3869:(e,n,t)=>{t.r(n),t.d(n,{assets:()=>l,contentTitle:()=>i,default:()=>h,frontMatter:()=>a,metadata:()=>o,toc:()=>d});const o=JSON.parse('{"id":"integrations/django","title":"Django","description":"This guide shows you how to add the open source DBOS Transact library to your existing Django application to durably execute it and make it resilient to any failure.","source":"@site/docs/integrations/django.md","sourceDirName":"integrations","slug":"/integrations/django","permalink":"/integrations/django","draft":false,"unlisted":false,"tags":[],"version":"current","sidebarPosition":39,"frontMatter":{"sidebar_position":39,"title":"Django"},"sidebar":"tutorialSidebar","previous":{"title":"Nest.js","permalink":"/integrations/nestjs"},"next":{"title":"Next.js","permalink":"/integrations/adding-dbos-to-next"}}');var s=t(4848),r=t(8453);const a={sidebar_position:39,title:"Django"},i="Make Your Django App Reliable with DBOS",l={},d=[{value:"Installation and Requirements",id:"installation-and-requirements",level:2},{value:"Starting DBOS",id:"starting-dbos",level:2},{value:"Making Your Views Reliable",id:"making-your-views-reliable",level:2}];function c(e){const n={a:"a",admonition:"admonition",code:"code",h1:"h1",h2:"h2",header:"header",li:"li",p:"p",pre:"pre",strong:"strong",ul:"ul",...(0,r.R)(),...e.components},{Details:t}=n;return t||function(e,n){throw new Error("Expected "+(n?"component":"object")+" `"+e+"` to be defined: you likely forgot to import, pass, or provide it.")}("Details",!0),(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(n.header,{children:(0,s.jsx)(n.h1,{id:"make-your-django-app-reliable-with-dbos",children:"Make Your Django App Reliable with DBOS"})}),"\n",(0,s.jsxs)(n.p,{children:["This guide shows you how to add the open source ",(0,s.jsx)(n.a,{href:"https://github.com/dbos-inc/dbos-transact-py",children:"DBOS Transact"})," library to your existing ",(0,s.jsx)(n.a,{href:"https://www.djangoproject.com/",children:"Django"})," application to ",(0,s.jsx)(n.strong,{children:"durably execute"})," it and make it resilient to any failure."]}),"\n",(0,s.jsx)(n.p,{children:"In summary you'll need to:"}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsxs)(n.li,{children:["Start DBOS with your ",(0,s.jsx)(n.a,{href:"https://docs.djangoproject.com/en/5.2/ref/applications/#django.apps.AppConfig.ready",children:"AppConfig's ready method"})]}),"\n",(0,s.jsx)(n.li,{children:"Annotate your service methods with DBOS decorators to make them durable"}),"\n",(0,s.jsxs)(n.li,{children:["Start Django with the ",(0,s.jsx)(n.code,{children:"--noreload"})," flag."]}),"\n"]}),"\n",(0,s.jsx)(n.h2,{id:"installation-and-requirements",children:"Installation and Requirements"}),"\n",(0,s.jsx)(n.admonition,{type:"info",children:(0,s.jsxs)(n.p,{children:["The guide is based on the Django ",(0,s.jsx)(n.a,{href:"https://docs.djangoproject.com/en/5.2/intro/tutorial01/",children:"quickstart"}),", will show you how to make your application reliable with ",(0,s.jsx)(n.a,{href:"https://github.com/dbos-inc/dbos-transact-py",children:"DBOS Transact"}),"."]})}),"\n",(0,s.jsxs)(t,{children:[(0,s.jsx)("summary",{children:"Setting up the Django quickstart"}),(0,s.jsx)(n.p,{children:"This application was created with:"}),(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-shell",children:"python3 -m venv .venv\nsource .venv/bin/activate\npip install django\ndjango-admin startproject djangodbos .\npython manage.py startapp polls\n"})}),(0,s.jsxs)(n.p,{children:["Then, configure ",(0,s.jsx)(n.code,{children:"djangodbos/settings.py"})," to ",(0,s.jsx)(n.a,{href:"https://docs.djangoproject.com/en/5.2/ref/settings/#databases",children:"use Postgres"})," and run ",(0,s.jsx)(n.code,{children:"python manage.py migrate"}),"."]})]}),"\n",(0,s.jsx)(n.p,{children:"Install DBOS Python with:"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-shell",children:"pip install dbos\n"})}),"\n",(0,s.jsx)(n.h2,{id:"starting-dbos",children:"Starting DBOS"}),"\n",(0,s.jsxs)(n.p,{children:["In your Django application ",(0,s.jsx)(n.code,{children:"AppConfig"}),", start DBOS inside the ",(0,s.jsx)(n.code,{children:"ready"})," method. You can ",(0,s.jsx)(n.a,{href:"https://docs.dbos.dev/python/reference/configuration",children:"configure the DBOS instance"})," before ",(0,s.jsx)(n.a,{href:"https://docs.dbos.dev/python/reference/dbos-class#launch",children:"launching DBOS"}),"."]}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-python",children:'from django.apps import AppConfig\nfrom dbos import DBOS\nimport os\n\nclass PollsConfig(AppConfig):\n    default_auto_field = \'django.db.models.BigAutoField\'\n    name = \'polls\'\n\n    def ready(self):\n        dbos_config = {\n            "name": name,\n            "database_url": os.environ.get("DBOS_DATABASE_URL"),\n        }\n        dbos = DBOS(config=dbos_config)\n        dbos.launch()\n        return super().ready()\n'})}),"\n",(0,s.jsxs)(n.p,{children:["Because launching DBOS triggers worfklow recovery, it is advised you call ",(0,s.jsx)(n.code,{children:"python manage.py runserver"})," with the ",(0,s.jsx)(n.code,{children:"--noreload"})," flag."]}),"\n",(0,s.jsx)(n.h2,{id:"making-your-views-reliable",children:"Making Your Views Reliable"}),"\n",(0,s.jsxs)(n.p,{children:["You can make a Django view durable by annotating your functions with ",(0,s.jsx)(n.a,{href:"https://docs.dbos.dev/python/reference/decorators",children:"DBOS decorators"}),"."]}),"\n",(0,s.jsxs)(n.p,{children:["In this example, we'll augment an existing endpoint ",(0,s.jsx)(n.code,{children:"callWorkflow"})," to invoke a ",(0,s.jsx)(n.a,{href:"../python/tutorials/workflow-tutorial",children:"workflow"})," of two steps."]}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-python",children:'def callWorkflow(request, a, b):\n    return JsonResponse(workflow(a, b))\n\n# Annotate the workflow() function to make it a durable workflow\n@DBOS.workflow()\ndef workflow(a, b):\n    res1 = step1(a)\n    res2 = step2(b)\n    result = res1 + res2\n    return {"result": result}\n\n# Make step1() a durable step\n@DBOS.step()\ndef step1(var):\n    return var\n\n# Make step2 a durable transaction (special step with ACID properties)\n@DBOS.transaction()\ndef step2(var):\n    rows = DBOS.sql_session.execute(sa.text("SELECT 1")).fetchall()\n    return var + str(rows[0][0])\n'})}),"\n",(0,s.jsxs)(n.p,{children:["Update ",(0,s.jsx)(n.code,{children:"polls/urls.py"})," and run your app with ",(0,s.jsx)(n.code,{children:"python manage.py runserver --noreload"})," to access the view at ",(0,s.jsx)(n.code,{children:"http://localhost:8000/polls/callWorkflow/a/b"}),"."]})]})}function h(e={}){const{wrapper:n}={...(0,r.R)(),...e.components};return n?(0,s.jsx)(n,{...e,children:(0,s.jsx)(c,{...e})}):c(e)}},8453:(e,n,t)=>{t.d(n,{R:()=>a,x:()=>i});var o=t(6540);const s={},r=o.createContext(s);function a(e){const n=o.useContext(r);return o.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function i(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(s):e.components||s:a(e.components),o.createElement(r.Provider,{value:n},e.children)}}}]);