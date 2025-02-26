"use strict";(self.webpackChunkdbos_docs=self.webpackChunkdbos_docs||[]).push([[7102],{9596:(e,n,t)=>{t.r(n),t.d(n,{assets:()=>c,contentTitle:()=>r,default:()=>p,frontMatter:()=>i,metadata:()=>s,toc:()=>d});const s=JSON.parse('{"id":"python/tutorials/testing","title":"Testing Your App","description":"Testing DBOS Functions","source":"@site/docs/python/tutorials/testing.md","sourceDirName":"python/tutorials","slug":"/python/tutorials/testing","permalink":"/python/tutorials/testing","draft":false,"unlisted":false,"tags":[],"version":"current","sidebarPosition":20,"frontMatter":{"sidebar_position":20,"title":"Testing Your App"},"sidebar":"tutorialSidebar","previous":{"title":"Working With Python Classes","permalink":"/python/tutorials/classes"},"next":{"title":"Adding DBOS To Your App","permalink":"/python/tutorials/integrating-dbos"}}');var o=t(4848),a=t(8453);const i={sidebar_position:20,title:"Testing Your App"},r=void 0,c={},d=[{value:"Testing DBOS Functions",id:"testing-dbos-functions",level:3},{value:"Custom Configuration",id:"custom-configuration",level:3},{value:"Resetting Your Database For Testing",id:"resetting-your-database-for-testing",level:3},{value:"Example Test Suite",id:"example-test-suite",level:3}];function l(e){const n={a:"a",code:"code",h3:"h3",p:"p",pre:"pre",strong:"strong",...(0,a.R)(),...e.components},{Details:t}=n;return t||function(e,n){throw new Error("Expected "+(n?"component":"object")+" `"+e+"` to be defined: you likely forgot to import, pass, or provide it.")}("Details",!0),(0,o.jsxs)(o.Fragment,{children:[(0,o.jsx)(n.h3,{id:"testing-dbos-functions",children:"Testing DBOS Functions"}),"\n",(0,o.jsxs)(n.p,{children:["Because DBOS workflows, steps, and transactions are ordinary Python functions, you can unit test them using any Python testing framework, like ",(0,o.jsx)(n.a,{href:"https://docs.pytest.org/en/stable/",children:"pytest"})," or ",(0,o.jsx)(n.a,{href:"https://docs.python.org/3/library/unittest.html",children:"unittest"}),"."]}),"\n",(0,o.jsx)(n.p,{children:(0,o.jsx)(n.strong,{children:"You must reset the DBOS runtime between each test like this:"})}),"\n",(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{className:"language-python",children:"def reset_dbos():\n    DBOS.destroy()\n    DBOS()\n    DBOS.reset_system_database()\n    DBOS.launch()\n"})}),"\n",(0,o.jsx)(n.p,{children:"First, destroy any existing DBOS instance.\nThen, create a new DBOS instance.\nNext, reset the internal state of DBOS in Postgres, cleaning up any state left over from previous tests.\nFinally, launch a new DBOS instance."}),"\n",(0,o.jsxs)(n.p,{children:["For example, if using pytest, declare ",(0,o.jsx)(n.code,{children:"reset_dbos"})," as a fixture and require it from every test of a DBOS function:"]}),"\n",(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{className:"language-python",metastring:'title="conftest.py"',children:"import pytest\nfrom dbos import DBOS\n\n@pytest.fixture()\ndef reset_dbos():\n    DBOS.destroy()\n    DBOS()\n    DBOS.reset_system_database()\n    DBOS.launch()\n"})}),"\n",(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{className:"language-python",metastring:'title="test_example.py"',children:"from example_app.main import example_workflow\n\ndef test_example_workflow(reset_dbos):\n    example_input = ...\n    example_output = ...\n    assert example_workflow(example_input) == example_output\n\n"})}),"\n",(0,o.jsx)(n.h3,{id:"custom-configuration",children:"Custom Configuration"}),"\n",(0,o.jsxs)(n.p,{children:["You may want to use a custom configuration of DBOS for testing.\nFor example, you likely want to test your application using an isolated development database.\nTo do this, save your custom configuration to a file (for example, ",(0,o.jsx)(n.code,{children:"dbos-config.testing.yaml"}),"), load it, and pass it to the DBOS object used by your tests:"]}),"\n",(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{className:"language-python",children:'def reset_dbos():\n    DBOS.destroy()\n    config = load_config("dbos-config.testing.yaml")\n    DBOS(config=config)\n    DBOS.reset_system_database()\n    DBOS.launch()\n'})}),"\n",(0,o.jsx)(n.p,{children:"Alternatively, you can load your default config then modify its values programatically:"}),"\n",(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{className:"language-python",children:'def reset_dbos():\n    DBOS.destroy()\n    config = load_config()\n    config["database"]["app_db_name"] = f"{config["database"]["app_db_name"]}_test"\n    DBOS(config=config)\n    DBOS.reset_system_database()\n    DBOS.launch()\n'})}),"\n",(0,o.jsx)(n.h3,{id:"resetting-your-database-for-testing",children:"Resetting Your Database For Testing"}),"\n",(0,o.jsx)(n.p,{children:"If your application extensively uses the database, it may be useful to reset your testing database between tests, to ensure tests are fully isolated.\nThis can be involved, as you must destroy your testing database then recreate it programatically using your migrations.\nHere is some example code for how to do it using SQLAlchemy, Alembic, and pytest:"}),"\n",(0,o.jsxs)(t,{children:[(0,o.jsx)("summary",{children:"Resetting a Database Between Tests"}),(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{className:"language-python",metastring:'title="conftest.py"',children:'import pytest\nimport sqlalchemy as sa\nfrom alembic import script\nfrom alembic.config import Config\nfrom alembic.operations import Operations\nfrom alembic.runtime.environment import EnvironmentContext\nfrom alembic.runtime.migration import MigrationContext\nfrom dbos import DBOS, ConfigFile, load_config\n\n\ndef reset_database(config: ConfigFile):\n    postgres_db_url = sa.URL.create(\n        "postgresql+psycopg",\n        username=config["database"]["username"],\n        password=config["database"]["password"],\n        host=config["database"]["hostname"],\n        port=config["database"]["port"],\n        database="postgres",\n    )\n    engine = sa.create_engine(postgres_db_url, isolation_level="AUTOCOMMIT")\n    with engine.connect() as conn:\n        conn.execute(\n            sa.text(\n                f"SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = \'{config["database"]["app_db_name"]}\'"\n            )\n        )\n        conn.execute(\n            sa.text(f"DROP DATABASE IF EXISTS {config["database"]["app_db_name"]}")\n        )\n        conn.execute(sa.text(f"CREATE DATABASE {config["database"]["app_db_name"]}"))\n\n\ndef run_migrations(config: ConfigFile):\n    app_db_url = sa.URL.create(\n        "postgresql+psycopg",\n        username=config["database"]["username"],\n        password=config["database"]["password"],\n        host=config["database"]["hostname"],\n        port=config["database"]["port"],\n        database=config["database"]["app_db_name"],\n    )\n    alembic_cfg = Config()\n    alembic_cfg.set_main_option("script_location", "./migrations")\n    script_dir = script.ScriptDirectory.from_config(alembic_cfg)\n\n    def do_run_migrations(connection):\n        context = MigrationContext.configure(connection)\n        with Operations.context(context):\n            for revision in script_dir.walk_revisions("base", "head"):\n                if script_dir._upgrade_revs(\n                    revision.revision, context.get_current_revision()\n                ):\n                    revision.module.upgrade()\n\n    with sa.create_engine(app_db_url).connect() as conn:\n        with EnvironmentContext(alembic_cfg, script_dir, fn=do_run_migrations):\n            with conn.begin():\n                do_run_migrations(conn)\n\n\n@pytest.fixture()\ndef dbos():\n    DBOS.destroy()\n    config = load_config()\n    config["database"]["app_db_name"] = f"{config["database"]["app_db_name"]}_test"\n    reset_database(config)\n    run_migrations(config)\n    DBOS(config=config)\n    DBOS.reset_system_database()\n    DBOS.launch()\n'})})]}),"\n",(0,o.jsx)(n.h3,{id:"example-test-suite",children:"Example Test Suite"}),"\n",(0,o.jsxs)(n.p,{children:["To see a DBOS app tested using pytest, check out the ",(0,o.jsx)(n.a,{href:"https://github.com/dbos-inc/dbos-demo-apps/tree/main/python/earthquake-tracker",children:"Earthquake Tracker"})," example on GitHub."]})]})}function p(e={}){const{wrapper:n}={...(0,a.R)(),...e.components};return n?(0,o.jsx)(n,{...e,children:(0,o.jsx)(l,{...e})}):l(e)}},8453:(e,n,t)=>{t.d(n,{R:()=>i,x:()=>r});var s=t(6540);const o={},a=s.createContext(o);function i(e){const n=s.useContext(a);return s.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function r(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(o):e.components||o:i(e.components),s.createElement(a.Provider,{value:n},e.children)}}}]);