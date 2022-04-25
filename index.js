//Entry point to web server
//Should be visible at 44.203.161.83 once deployed + port 80 opened

//https://plotly.com/javascript/line-charts/

const http = require('http');
const https = require('https');

const fs = require('fs');
//const redis = require('redis');
const amqp = require('amqplib/callback_api');
require('dotenv').config();

(async () => {
    let __data = {in: 0, out: 0, rtt: 0, time: 0, connected: false, players: 0};
    //todo: set 5-second rolling window.
    //todo: set data every time we pull

    if(process.env.BOX === "DEV") {
        __data.connected = true;
        __data.in = Math.floor(Math.random() * 100);
        __data.out = Math.floor(Math.random() * 100);

        setInterval(() => {
            __data.time += 1;
            __data.in = Math.floor(Math.random() * 100);
            __data.out = Math.floor(Math.random() * 100);
            __data.rtt = Math.floor(Math.random() * 100);
        }, 1000);
    } else {
        amqp.connect('amqp://localhost', async (e0, conn) => {
            if(e0) throw e0; //todo: fix
    
            conn.createChannel(async (e1, channel) => {
                if(e1) throw e1;
    
                __data.connected = true;
    
                const exchangeIn = 'data-in';
    
                channel.assertExchange(exchangeIn, 'fanout', {
                    durable: false
                });
    
                channel.assertQueue('', {
                    exclusive: true
                }, async (e2, q) => {
                    if(e2) throw e2;
    
                    console.log(`waiting for messages in ${q.queue}`);
                    channel.bindQueue(q.queue, exchangeIn, '');
    
                    channel.consume(q.queue, msg => {
                        if(msg.content) {
                            if(process.env.BOX === "DEV") console.log("[data-in] " + msg.content.toString());
                            __data.in += parseInt(msg.content.toString());
                        }
                    }, {noAck: true});
                });
                const exchangeOut = 'data-out';
    
                channel.assertExchange(exchangeOut, 'fanout', {
                    durable: false
                });
    
                channel.assertQueue('', {
                    exclusive: true
                }, async (e2, q) => {
                    if(e2) throw e2;
    
                    console.log(`waiting for messages in ${q.queue}`);
                    channel.bindQueue(q.queue, exchangeOut, '');
    
                    channel.consume(q.queue, msg => {
                        if(msg.content) {
                            if(process.env.BOX === "DEV") console.log("[data-out] " + msg.content.toString());
                            __data.out += parseInt(msg.content.toString());
                        }
                    }, {noAck: true});
                });
    
                channel.assertExchange('data-rtt', 'fanout', { durable: false });
                channel.assertQueue('', {
                    exclusive: true
                }, async (e3, q) => {
                    if(e3) throw e3;
    
                    console.log(`waiting for messages in ${q.queue}`);
                    channel.bindQueue(q.queue, 'data-rtt', '');
    
                    channel.consume(q.queue, msg => {
                        if(msg.content) {
                            if(process.env.BOX === "DEV") console.log('data[rtt] ' + msg.content.toString());
                            __data.rtt = msg.content.toString();
                        }
                    }, {noAck: true});
                });
    
                channel.assertExchange('data-time', 'fanout', { durable: false });
                channel.assertQueue('', {
                    exclusive: true
                }, async (e3, q) => {
                    if(e3) throw e3;
    
                    console.log(`waiting for messages in ${q.queue}`);
                    channel.bindQueue(q.queue, 'data-time', '');
    
                    channel.consume(q.queue, msg => {
                        if(msg.content) {
                            if(process.env.BOX === "DEV") console.log('data[time] ' + msg.content.toString());
                            __data.time = msg.content.toString();
                        }
                    }, {noAck: true});
                });
                
                channel.assertExchange('data-players', 'fanout', { durable: false });
                channel.assertQueue('', {
                    exclusive: true
                }, async (e3, q) => {
                    if(e3) throw e3;
    
                    console.log(`waiting for messages in ${q.queue}`);
                    channel.bindQueue(q.queue, 'data-players', '');
    
                    channel.consume(q.queue, msg => {
                        if(msg.content) {
                            if(process.env.BOX === "DEV") console.log('data[players] ' + msg.content.toString());
                            __data.players = msg.content.toString();
                        }
                    }, {noAck: true});
                });

            })
        });
        /*setInterval(() => {
            __data.in = 0;
            __data.out = 0;
        }, 1000);    */
    }

    const server = http.createServer(async (request, response) => {
        switch(request.url) {
            case '/':
                console.log('GET /');
                fs.readFile(__dirname + '/WebAssets/index.html', (err, data) => {
                    if(err) {
                        response.writeHead(404);
                        response.end(JSON.stringify(err));
                    }
                    response.writeHead(200);
                    response.end(data);
                });
                break;
            case '/download': 
                console.log('GET /download');
                fs.readFile(__dirname + '/WebAssets/download.html', (err, data) => {
                    if(err) {
                        response.writeHead(404);
                        response.end(JSON.stringify(err));
                    }
                    response.writeHead(200);
                    response.end(data);
                });
                break;
            case '/status':
                console.log('GET /status');
                fs.readFile(__dirname + '/WebAssets/status.html', (err, data) => {
                    if(err) {
                        response.writeHead(404);
                        response.end(JSON.stringify(err));
                    }
                    response.writeHead(200);
                    response.end(data);
                });
                break;
            case '/data.json':
                console.log('GET /data.json');
                response.writeHead(200, {
                    'Content-Type': 'application/json'
                });
                response.end(JSON.stringify(__data));
                //flush data
                //__data.in = 0;
                //__data.out = 0;
                break;
            default:
                console.log('GET ' + request.url);
                fs.readFile(__dirname + '/WebAssets/static' + request.url, (err, data) => {
                    if(err) {
                        response.writeHead(404);
                        response.end(JSON.stringify(err));
                    }
                    response.writeHead(200);
                    response.end(data);
                    __data.in = 0;
                    __data.out = 0;
                });
        }

    });
    server.listen(3000);

})();

//serve index.html file
//create backend api with statistics
//create graph with statistics?