const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const compress = require('compression');
const methodOverride = require('method-override');
const cors = require('cors');
const helmet = require('helmet');
const passport = require('passport');
const routes = require('../api/routes/v1');
const { logs } = require('./vars');
const strategies = require('./passport');
const error = require('../api/middlewares/error');

const multipart = require('connect-multiparty');
const multipartMiddleware = multipart();

const crypto = require('crypto');

/**
* Express instance
* @public
*/
const app = express();

// request logging. dev: console | production: file
app.use(morgan(logs));

// bodyParser.raw 必须放在最前面，不然使用不了
app.use(bodyParser.raw({ type: '*/*', limit: "300mb",
  verify: function(req, res, buf, encoding) {
    console.log('111111111');
    if (buf && buf.length) {
      req.rawBody = buf;    
      console.log('111111111');
    }
  }
}));


//app.use('/upload1', (req, res) => {
//  let buffer = [];
//
//  req.on('data', (chunk) => {
//      buffer.push(chunk);
//  });
//
//  req.on('end', () => {
//      req.rawBody = Buffer.concat(buffer);
//      res.end(req.rawBody);
//  });
//
//});

// parse body params and attache them to req.body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));



// gzip compression
app.use(compress());

// lets you use HTTP verbs such as PUT or DELETE
// in places where the client doesn't support it
app.use(methodOverride());

// secure apps by setting various HTTP headers
app.use(helmet());

// enable CORS - Cross Origin Resource Sharing
app.use(cors());

// enable authentication
app.use(passport.initialize());
passport.use('jwt', strategies.jwt);
passport.use('facebook', strategies.facebook);
passport.use('google', strategies.google);

app.get('/', (req, res) => {
  res.send('111111111111111122222222');
});

app.get('/test1', (req, res) => {
  res.json({
    message: 'Hello World!'
  });
});

// 利用 connect-multiparty 解析二进制数据
app.post('/upload', multipartMiddleware, (req, res) => {
  console.log('isBuffer:', Buffer.isBuffer(req.body));
  res.send(req.body);
});






// 利用 bodyParser.raw() 解析二进制数据
app.post('/upload1', (req, res) => {  

  console.log('isBuffer:', Buffer.isBuffer(req.rawBody));

  
  //res.send(req.rawBody);

  //const key = Buffer.from([0x4B,0xD9,0xDE,0x08,0xA5,0xA7,0x49,0xAD,0x81,0x92,0xE0,0x8E,0xDC,0x54,0x24,0xD3]);
  var publicKey = "12345678";
  var key = crypto.createHash("md5").update(publicKey).digest('hex');

  console.log("md5: %s", key);
  var iv = "";
  
  var clearEncoding = 'binary';
  var cipherEncoding = 'binary';
  var cipherChunks = [];
  var cipher = crypto.createCipheriv('aes-256-ecb', key, iv);
  cipher.setAutoPadding(true);

  

  cipherChunks.push(cipher.update(req.rawBody, clearEncoding, cipherEncoding));
  cipherChunks.push(cipher.final(cipherEncoding));  

  

  //res.send(cipherChunks.join(''));

  var source = new Buffer(cipherChunks.join(''), 'binary');


  //res.send(source);

  var decrypted = [];
  var decipher = crypto.createDecipheriv('aes-256-ecb', key, iv);
  decipher.setAutoPadding(true);
  decrypted.push(decipher.update(source, 'buffer', 'binary'));
  decrypted.push(decipher.final('binary'));
//
  res.send(decrypted.join(''));

  

  
});





app.post('/upload2', (req, res, next) => {  

  console.log('isBuffer:', Buffer.isBuffer(req.body));

  res.send(req.body);
});

// mount api v1 routes
app.use('/v1', routes);

// if error is not an instanceOf APIError, convert it.
app.use(error.converter);

// catch 404 and forward to error handler
app.use(error.notFound);

// error handler, send stacktrace only during development
app.use(error.handler);

module.exports = app;
