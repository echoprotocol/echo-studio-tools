# `echo-debugger`
# (Echo debugger has been deprecated and is not maintained anymore - the `echo-debug` module can be used to build your own debugger)
 
The Echo Debugger is a webapp to debug the Echo VM and transactions.

+ [Installation](#installation)
+ [Development](#development)
+ [First steps](#firststeps)
+ [Tests](#tests)

## Installation

Make sure Node is [installed on your setup](https://docs.npmjs.com/getting-started/installing-node), and that a [local `echo` node is running](../README.md).

```bash
git clone https://github.com/echoprotocol/echo-studio-tools.git
cd echo-studio-tools/echo-debugger
npm install
```

This will build the debugger. Start it by opening `index.html` in your browser.

## Development

Run `npm run start_dev` to start a local webserver, accessible at `http://127.0.0.1:8080`. Your browser will reload when files are updated.

## <a name="firststeps"></a>First steps

Once Echo Tools is connected to a node, you will be able to debug transactions.

You can do that:
 - using a block number and a transaction index.
 - using a transaction hash.

After loading the transaction succeeded, the hash, from and to field will show up. The VM trace is then loaded.

The debugger itself contains several controls that allow stepping over the trace and seing the current state of a selected step:

#### Slider and Stepping action

The slider allows to move quickly from a state to another.

Stepping actions are:
- Step Into Back
- Step Over Back
- Step Over Forward
- Step Into Forward
- Jump Next Call: this will select the next state that refers to a context changes - CALL, CALLCODE, DELEGATECALL, CREATE.

#### State Viewer

The upper right panel contains basic informations about the current step:
- VMTraceStep: the index in the trace of the current step.
- Step
- Add memory
- Gas: gas used by this step
- Remaining gas: gas left
- Loaded address: the current code loaded, refers to the executing code.

The other 6 panels describe the current selected state:
 - Instructions list: list of all the instruction that defines the current executing code.
 - Stack
 - Storage Changes
 - Memory
 - Call Data$
 - Call Stack

## Tests

* To run unit tests, run `npm test`.

* For local headless browser tests:
  * To install `selenium`: `npm run selenium-install`
  * Every time you want to run local browser tests, run: `npm run test-browser`


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
