# Supabase

> :::info

#  Use DBOS With Supabase

To learn more about how DBOS and Supabase are working together, check out [this blog post](https://supabase.com/blog/durable-workflows-in-postgres-dbos)!

:::

Here's how to connect your DBOS application running on your computer or cloud environment to your Supabase.

### 1. Set up a Local Application

If you haven't already, follow the [quickstart](../quickstart.md) to set up a DBOS application locally.
The rest of this guide will assume you have a local application.

### 2. Connect to Your Supabase Database

Next, open your Supabase dashboard at [`supabase.com/dashboard`](https://supabase.com/dashboard), select a project, and click "Connect" to retrieve connection information for your Supabase database.
You should see a screen that looks like this, showing the connection string for your database:

:::tip
Make sure your connection method is set to "Direct connection" (if your database supports it) or to "Session pooler".
:::

When you are ready, copy the connection string (filling in your Supabase password) from the dashboard and set the `DBOS_SYSTEM_DATABASE_URL` environment variable to it:

```
export DBOS_SYSTEM_DATABASE_URL="<your connection string>"
```

### 3. Launch Your Application

Now, launch your DBOS application.
It should successfully connect to your Supabase database, printing your masked Supabase database URL on startup.

After connecting your DBOS application to Supabase, you can use the Supabase console to view your DBOS system tables.
Open the "Table Editor" tab in the Supabase console.
For your schema, select "dbos". 
You can now see DBOS durably checkpoint your workflows to your Supabase database:
