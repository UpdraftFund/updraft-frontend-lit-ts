# `/shared/`

Allow code to be reused across:

* Lit frontend
* Node.js API serverless functions

Some code is simply shared by multiple API routes.
Vercel won't allow serveless functions to import shared code in `/api` so it's here instead.
