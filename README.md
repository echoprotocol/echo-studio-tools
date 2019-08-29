# Echo Studio Tools

![Travis (.com) branch](https://img.shields.io/travis/com/echoprotocol/echo-studio-tools/master?label=build%20master)
![Travis (.com) branch](https://img.shields.io/travis/com/echoprotocol/echo-studio-tools/develop?label=build%20develop)

**Echo Studio Tools** is a suite of tools to interact with the [Echo](https://echo.org) blockchain in order to debug transactions, stored in this Git repository. A Echo Studio is available [here](https://github.com/echoprotocol/echo-studio), and its source code is part of this repository.

## Installation Prerequisites

Before installing, [download and install Node.js](https://nodejs.org/en/download/).
Node.js 8.x.x or higher is required.

## Install Echo Studio from github source:

Use the following steps to install the wallet from github source:

Clone the git repository:

```bash
git clone https://github.com/echoprotocol/echo-studio-tools.git
```

Go into the `echo-studio-tools` repository:

```bash
cd echo-studio-tools
```

Use the package manager [npm](https://www.npmjs.com/) to install dependencies:

```bash
npm install
```

Bootstrap the packages in the repository:

```bash
npm run bootstrap
```


## <a name="modules"></a>Echo Studio Tools Modules

Echo Studio Tools is built out of several different modules:

+ [`echo-analyzer`](remix-analyzer/README.md)
+ [`echo-solidity`](remix-solidity/README.md) provides Solidity analysis and decoding functions.
+ [`echo-lib`](remix-lib/README.md)
+ [`echo-debug`](remix-debug/README.md) allo debuggin transaction.
+ [`echo-tests`](remix-tests/README.md) provides unit testing for solidity.
+ [`echo-astwalker`](remix-tests/README.md) provides a tool for parsing solidity AST.
+ [`echo-url-resolver`](remix-url-resolver/README.md) provides helpers for resolving external content (github, swarm, ipfs, ...).

Each generally has their own npm package and test suite, as well as basic documentation.

## Contributing

Read our [Contributing Guide](CONTRIBUTING.md) to learn about our development process, how to propose bugfixes and improvements.

## License

The MIT License (MIT)

Copyright (c) 2019 Echo Technological Solutions LLC

Copyright (c) 2016-2018 Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
