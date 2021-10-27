# zod-json-rpc

`zod-json-rpc` lets you rapidly build typesafe [JSON-RPC](https://www.jsonrpc.org/) servers and clients in TypeScript. Not only that, it is _self-describing_ via its advanced introspection API, which can output [JSON Schema](https://json-schema.org/) or source code in multiple languages.

## Why JSON-RPC?

It's super simple to use, easy to understand, and client libraries are widely available. When combined with a strong type system like TypeScript or JSON Schema it's a very nice way to build web apps.

## Getting started

```
npm install zod-json-rpc
```

## Creating a server

The following creates a server with one method named "hello" with introspection enabled.

```
// methods.ts

import { z } from "zod";
// You can import directly from zod-json-rpc/lib/server to avoid importing client-side
// dependencies
import { withIntrospection, method } from "zod-json-rpc";

export default withIntrospection({
  hello: method()
    .arg({ name: z.string() })
    .returns({ message: z.string() })
    .impl(({ name }) => {
      return { message: `hello, ${name}!` };
    }),
});
```

You can serve your app via the API:

```
import { createZodJsonRpcServer } from "zod-json-rpc";
import methods from "./methods"; // defined above

const expressApp = createZodJsonRpcServer(methods);
expressApp.listen(8000);
```

Or just use the CLI:

```
npx zod-json-rpc --transpile --module ./methods
```

You can remove the `--transpile` flag if you are precompiling your TypeScript ahead of time and aren't importing a `.ts` file directly.

## Calling the API via curl

```
$ curl -XPOST -H'Content-type: application/json' http://localhost:2288/rpc -d'{"id": "1", "jsonrpc":"2.0", "method": "hello", {"name": "Pete"}}'"Pete"}]}'

{"jsonrpc":"2.0","id":"1","result":{"message":"hello, Pete!"}}
```

## Calling the API via `jsonrpc2.0-cli`

```
$ npx jsonrpc2.0-cli --url http://localhost:2288/rpc --method hello --arg '{name: "pete"}' --pretty
{
  "message": "hello, pete!"
}
```

## Calling the API via the typesafe TypeScript client

```
import type methods from "./methods";
import { createZodJsonRpcClient } from "zod-json-rpc/lib/client";

const request = createZodJsonRpcClient<typeof methods>(
  `http://localhost:2288/rpc`
);
const response = await request("hello", { name: "pete" });
console.log(response.message);
```

## Built-in JSON Schema introspection

```
$ curl http://localhost:2288/rpc/schema

{    "$schema": "http://json-schema.org/draft-06/schema#",
    "definitions": {
        "HelloArg": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
                "name": {
                    "type": "string"
                }
            },
            "required": [
                "name"
            ],
            "title": "HelloArg"
        },
        "HelloRet": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
                "message": {
                    "type": "string"
                }
            },
            "required": [
                "message"
            ],
            "title": "HelloRet"
        },
        "ServerGetSchemaArg": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
                "lang": {
                    "type": "string"
                },
                "pattern": {
                    "type": "string"
                }
            },
            "required": [],
            "title": "ServerGetSchemaArg"
        },
        "ServerGetSchemaRet": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
                "source": {
                    "type": "string"
                }
            },
            "required": [
                "source"
            ],
            "title": "ServerGetSchemaRet"
        }
    }
}
```

This data is also available via JSON-RPC by calling the `server.getSchema` method. You can filter which methods are returned by passing a glob `pattern`:

```
$ curl http://localhost:2288/rpc/schema?pattern=hello
{
    "$schema": "http://json-schema.org/draft-06/schema#",
    "definitions": {
        "HelloArg": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
                "name": {
                    "type": "string"
                }
            },
            "required": [
                "name"
            ],
            "title": "HelloArg"
        },
        "HelloRet": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
                "message": {
                    "type": "string"
                }
            },
            "required": [
                "message"
            ],
            "title": "HelloRet"
        }
    }
}
```

You can also pass a `lang` parameter to generate types in your favorite programming language:

```
$ curl 'http://localhost:2288/rpc/schema?pattern=hello&lang=rust'
// Example code that deserializes and serializes the model.
// extern crate serde;
// #[macro_use]
// extern crate serde_derive;
// extern crate serde_json;
//
// use generated_module::[object Object];
//
// fn main() {
//     let json = r#"{"answer": 42}"#;
//     let model: [object Object] = serde_json::from_str(&json).unwrap();
// }

extern crate serde_derive;

#[derive(Serialize, Deserialize)]
pub struct HelloArg {
    #[serde(rename = "name")]
    name: String,
}

#[derive(Serialize, Deserialize)]
pub struct HelloRet {
    #[serde(rename = "message")]
    message: String,
}
```

## Future work

- Ideally, this should be split into separate packages for the client and server to minimize the number of dependencies that need to be installed.
- Support multiple lazy loaded namespaces / apps in a single server.
- The server CLI should integrate with `ts-node-dev` for automatic reloading
