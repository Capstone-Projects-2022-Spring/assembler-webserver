//Entry point to web server
//Should be visible at 44.203.161.83 once deployed + port 80 opened

const http = require('http');
const fs = require('fs');
//const redis = require('redis');
const amqp = require('amqplib/callback_api');

(async () => {

    let __data = {in: 0, out: 0};
    //todo: set 5-second rolling window.
    //todo: set data every time we pull

    amqp.connect('amqp://localhost', async (e0, conn) => {
        if(e0) throw e0; //todo: fix

        conn.createChannel(async (e1, channel) => {
            if(e1) throw e1;

            const exchangeIn = 'data-in';

            channel.assertExchange(exchangeIn, 'fanout', {
                durable: false
            });

            channel.assertQueue('', {
                exclusive: true
            }, async (e2, q) => {
                if(e2) throw e2;

                console.log(`waiiting for messages in ${q.queue}`);
                channel.bindQueue(q.queue, exchangeIn, '');

                channel.consume(q.queue, msg => {
                    if(msg.content) {
                        console.log("[data-in] " + msg.content.toString());
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

                console.log(`waiiting for messages in ${q.queue}`);
                channel.bindQueue(q.queue, exchangeOut, '');

                channel.consume(q.queue, msg => {
                    if(msg.content) {
                        console.log("[data-out] " + msg.content.toString());
                        __data.out += parseInt(msg.content.toString());
                    }
                }, {noAck: true});
            });

        })

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
        if(request.url === '/data.json') {
            console.log('GET /data.json');
            response.writeHead(200);
            response.end(JSON.stringify(__data));
            __data = {in: 0, out: 0};
        }
    });
    server.listen(3000);
})();


//serve index.html file
//create backend api with statistics
//create graph with statistics?

