/**************
 * This is a slightly modified version of its source:
 * https://gist.github.com/mizzy/1342667/f861258311df61b0691ebf9c3d59e1a0030d32de#gistcomment-2870324
 */
const http = require('http');
const url = require('url');

/**********
 * Set these to connect to your Nagios server
 */
const NAGIOS_HOST = '192.168.1.100';
// Leave USER and PASS blank if you'd disabled Auth on the Nagios Server
const NAGIOS_USER = 'nagiosadmin';
const NAGIOS_PASS = 'mypassword';

/**********
 * Use these to control the local proxy 
 */
const PROXY_PORT = 8080;
const DEBUG = false;


/**********
 * Create the proxy and run it.
 */
const proxy = http.createServer((req, res) => {

    const request = url.parse(req.url);

    const options = {
        host:    request.hostname,
        port:    request.port || 80,
        path:    request.path,
        method:  req.method,
        headers: req.headers,
    };
    options.host = NAGIOS_HOST;
    if (NAGIOS_USER && NAGIOS_PASS) {
        const auth = 'Basic ' + Buffer.from(NAGIOS_USER + ':' + NAGIOS_PASS).toString('base64');
        options.headers['Authorization'] = auth;
    }

    console.log(`${options.method} http://${options.host}${options.path}`);
    if (DEBUG) console.log(options.headers);

    const backend_req = http.request(options, (backend_res) => {
        // CORS don't care header
        backend_res.headers['Access-Control-Allow-Origin'] = '*';
        if (DEBUG) console.log(backend_res.headers)

        console.log('RESP', backend_res.statusCode, backend_res.statusMessage, backend_res.url)
        res.writeHead(backend_res.statusCode, backend_res.headers);
        


        backend_res.on('data', (chunk) => {
            res.write(chunk);
        });

        backend_res.on('end', () => {
            res.end();
        });
    });

    backend_req.on('error', err => console.error(`ERROR PROXYING REQUEST TO ${options.host}\n`, err));

    req.on('error', err => {
        console.error('ERROR:', err)
    });

    req.on('data', (chunk) => {
        backend_req.write(chunk);
    });

    req.on('end', () => {
        backend_req.end();
    });


});
proxy.on('listening', ()=>{
    console.log(`[Nagios Proxy Server]
    Listening at : http://localhost:${PROXY_PORT}/
    username     : ${NAGIOS_USER}
    `);
})
proxy.listen(PROXY_PORT);

