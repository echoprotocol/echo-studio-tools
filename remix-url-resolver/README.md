## Echo URL resolver engine

`resolve(url, urlHandler)`

Returns `json` object with exact same path as `import` statement.

**Output**
```json
{
	content: 'pragma solidity ^0.5.0;\nimport "./mortal.sol";\n\ncontract Greeter is Mortal {\n    /* Define variable greeting of the type string */\n    string greeting;\n\n    /* This runs when the contract is executed */\n    constructor(string memory _greeting) public {\n        greeting = _greeting;\n    }\n\n    /* Main function */\n    function greet() public view returns (string memory) {\n        return greeting;\n    }\n}\n',
	cleanURL: '../greeter.sol',
	type: 'local'
}
```

#### Usage

`resolve(url, urlHandler)` function should be called from within `handleImportCb` function of `solc.compile(input, handleImportCb)`.

```ts
import { EchoURLResolver } from 'echo-url-resolver'

const urlResolver = new EchoURLResolver()
const fileName: string = '../greeter.sol'
urlResolver.resolve(fileName, urlHandler)
	.then((sources: object) => {
		console.log(sources)
	})
	.catch((e: Error) => {
		throw e
	})
```

#### References

* [TypeScript Publishing](http://www.typescriptlang.org/docs/handbook/declaration-files/publishing.html)
* [DefinitelyTyped 'Create a new package' guide](https://github.com/DefinitelyTyped/DefinitelyTyped#create-a-new-package)


## Contributing

Read our [Contributing Guide](CONTRIBUTING.md) to learn about our development process, how to propose bugfixes and improvements.

## License

The MIT License (MIT)

Copyright (c) 2019 Echo Technological Solutions LLC

Copyright (c) 2018 Remix Team

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
