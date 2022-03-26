//Entry point to web server
//Should be visible at 44.203.161.83 once deployed + port 80 opened

const http = require('http');
const fs = require('fs');
const redis = require('redis');

(async () => {
    const client = redis.createClient();
    client.on('error', (err) => console.log('Redis Client Error: ', err));

    await client.connect();
    const subscriber = client.duplicate();
    await subscriber.connect();

    let __data;

    await subscriber.subscribe('network-data', message => {
        //fires when message is received
        //console.log('message received' + message);
        console.log('[network-data] ' + message);
        __data = message;
    });

    const server = http.createServer(async (request, response) => {
        console.log(request.url);
        if(request.url === '/') {
            console.log('GET /');
            fs.readFile(__dirname + '/WebAssets/index.html', (err, data) => {
                if(err) {
                    response.writeHead(404);
                    response.end(JSON.stringify(err));
                }
                response.writeHead(200);
                response.end(data);
            });    
        }
        if(request.url === '/data') {
            console.log('GET /data');
            response.writeHead(200);
            response.end(__data);
        }
    });
    server.listen(3000);
})();


//serve index.html file
//create backend api with statistics
//create graph with statistics?

