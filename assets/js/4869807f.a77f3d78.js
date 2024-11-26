"use strict";(self.webpackChunkdbos_docs=self.webpackChunkdbos_docs||[]).push([[6927],{8083:(e,n,t)=>{t.r(n),t.d(n,{assets:()=>c,contentTitle:()=>o,default:()=>m,frontMatter:()=>r,metadata:()=>i,toc:()=>l});var a=t(4848),s=t(8453);const r={sidebar_position:3,title:"Transactions",description:"Learn how to perform database operations"},o=void 0,i={id:"python/tutorials/transaction-tutorial",title:"Transactions",description:"Learn how to perform database operations",source:"@site/docs/python/tutorials/transaction-tutorial.md",sourceDirName:"python/tutorials",slug:"/python/tutorials/transaction-tutorial",permalink:"/python/tutorials/transaction-tutorial",draft:!1,unlisted:!1,tags:[],version:"current",sidebarPosition:3,frontMatter:{sidebar_position:3,title:"Transactions",description:"Learn how to perform database operations"},sidebar:"tutorialSidebar",previous:{title:"Steps",permalink:"/python/tutorials/step-tutorial"},next:{title:"Idempotency",permalink:"/python/tutorials/idempotency-tutorial"}},c={},l=[{value:"Schema Management",id:"schema-management",level:2}];function d(e){const n={a:"a",code:"code",em:"em",h2:"h2",p:"p",pre:"pre",...(0,s.R)(),...e.components},{TabItem:t,Tabs:r}=n;return t||h("TabItem",!0),r||h("Tabs",!0),(0,a.jsxs)(a.Fragment,{children:[(0,a.jsxs)(n.p,{children:["We recommend performing database operations in ",(0,a.jsx)(n.em,{children:"transactions"}),".\nThese are a special type of ",(0,a.jsx)(n.a,{href:"/python/tutorials/step-tutorial",children:"step"})," that are optimized for database accesses.\nThey execute as a single ",(0,a.jsx)(n.a,{href:"https://en.wikipedia.org/wiki/Database_transaction",children:"database transaction"}),"."]}),"\n",(0,a.jsxs)(n.p,{children:["To make a Python function a transaction, annotate it with the ",(0,a.jsx)(n.a,{href:"/python/reference/decorators#transaction",children:(0,a.jsx)(n.code,{children:"@DBOS.transaction"})})," decorator.\nThen, access the database using the ",(0,a.jsx)(n.a,{href:"/python/reference/contexts#sql_session",children:(0,a.jsx)(n.code,{children:"DBOS.sql_session"})})," client, which is a ",(0,a.jsx)(n.a,{href:"https://www.sqlalchemy.org/",children:"SQLAlchemy"})," client DBOS automatically connects to your database.\nHere are some examples:"]}),"\n",(0,a.jsxs)(r,{groupId:"database-clients",children:[(0,a.jsx)(t,{value:"sqlalchemy",label:"SQLAlchemy",children:(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-python",children:'greetings = Table(\n    "greetings", \n    MetaData(), \n    Column("name", String), \n    Column("note", String)\n)\n\n@DBOS.transaction()\ndef example_insert(name: str, note: str) -> None:\n    # Insert a new greeting into the database\n    DBOS.sql_session.execute(greetings.insert().values(name=name, note=note))\n\n@DBOS.transaction()\ndef example_select(name: str) -> Optional[str]:\n    # Select the first greeting to a particular name\n    row = DBOS.sql_session.execute(\n        select(greetings.c.note).where(greetings.c.name == name)\n    ).first()\n    return row[0] if row else None\n'})})}),(0,a.jsx)(t,{value:"raw",label:"Raw SQL",children:(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-python",children:'@DBOS.transaction()\ndef example_insert(name: str, note: str) -> None:\n    # Insert a new greeting into the database\n    sql = text("INSERT INTO greetings (name, note) VALUES (:name, :note)")\n    DBOS.sql_session.execute(sql, {"name": name, "note": note})\n\n\n@DBOS.transaction()\ndef example_select(name: str) -> Optional[str]:\n    # Select the first greeting to a particular name\n    sql = text("SELECT note FROM greetings WHERE name = :name LIMIT 1")\n    row = DBOS.sql_session.execute(sql, {"name": name}).first()\n    return row[0] if row else None\n'})})})]}),"\n",(0,a.jsx)(n.h2,{id:"schema-management",children:"Schema Management"}),"\n",(0,a.jsxs)(n.p,{children:["We strongly recommend you manage your database schema using migrations.\nDBOS supports any Python database migration tool, but by default uses ",(0,a.jsx)(n.a,{href:"https://alembic.sqlalchemy.org/en/latest/",children:"Alembic"}),"."]}),"\n",(0,a.jsxs)(n.p,{children:["Migration commands are configured in your ",(0,a.jsx)(n.a,{href:"/python/reference/configuration",children:(0,a.jsx)(n.code,{children:"dbos-config.yaml"})})," file.\nAt migration time, DBOS runs all migration commands.\nThe default configuration, using Alembic, is:"]}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-yaml",children:"database:\n  ...\n  migrate:\n    - alembic upgrade head\n"})}),"\n",(0,a.jsx)(n.p,{children:"To execute all migration commands, run:"}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-shell",children:"dbos migrate\n"})}),"\n",(0,a.jsx)(n.p,{children:"If you are using Alembic, you can generate a new migration with:"}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-shell",children:"alembic revision -m <migration-name>\n"})}),"\n",(0,a.jsxs)(n.p,{children:["This creates a new migration file in whose ",(0,a.jsx)(n.code,{children:"upgrade"})," and ",(0,a.jsx)(n.code,{children:"downgrade"})," functions you can implement your migration.\nFor example:"]}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-python",children:'def upgrade() -> None:\n    op.execute(sa.text("CREATE TABLE greetings (name TEXT, note TEXT)"))\n\n\ndef downgrade() -> None:\n    op.execute(sa.text("DROP TABLE greetings"))\n'})}),"\n",(0,a.jsxs)(n.p,{children:["You can also generate new migrations directly from your SQLAlchemy schema files using ",(0,a.jsx)(n.a,{href:"https://alembic.sqlalchemy.org/en/latest/autogenerate.html",children:"Alembic autogeneration"}),"."]})]})}function m(e={}){const{wrapper:n}={...(0,s.R)(),...e.components};return n?(0,a.jsx)(n,{...e,children:(0,a.jsx)(d,{...e})}):d(e)}function h(e,n){throw new Error("Expected "+(n?"component":"object")+" `"+e+"` to be defined: you likely forgot to import, pass, or provide it.")}},8453:(e,n,t)=>{t.d(n,{R:()=>o,x:()=>i});var a=t(6540);const s={},r=a.createContext(s);function o(e){const n=a.useContext(r);return a.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function i(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(s):e.components||s:o(e.components),a.createElement(r.Provider,{value:n},e.children)}}}]);