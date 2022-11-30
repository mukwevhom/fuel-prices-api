# Fuel Price API

Fuel Price API is an api for various fuel type in South Africa. The source for this API is [SAPIA](https://www.sapia.org.za/fuel-prices/)

## Developing

Once you've cloned the project project, use the command below for the start a development server:

```bash
deno run --allow-net --allow-env main.ts

# or start the server and watch file changes
deno run --allow-net --allow-env --watch main.ts

# or start the server and debug on the browser
deno run --unstable --inspect --allow-net --allow-env main.ts
```
