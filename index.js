const express = require('express');
const crypto = require('crypto');
const https = require('https');
const app = express();

const ACCESS_KEY = process.env.COUPANG_ACCESS_KEY;
const SECRET_KEY = process.env.COUPANG_SECRET_KEY;

function generateHmac(method, urlPath) {
  const now = new Date();
  const datetime = now.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'').slice(0,15)+'Z';
  const parts = urlPath.split('?');
  const path = parts[0];
  const query = parts[1] || '';
  const message = datetime + method + path + query;
  const signature = crypto.createHmac('sha256', SECRET_KEY).update(message).digest('hex');
  return `CEA algorithm=HmacSHA256, access-key=${ACCESS_KEY}, signed-date=${datetime}, signature=${signature}`;
}

app.get('/products/best', (req, res) => {
  const categoryId = req.query.categoryId || '1016';
  const limit = req.query.limit || '5';
  const apiPath = `/v2/providers/affiliate_open_api/apis/openapi/v1/products/bestcategories/${categoryId}?limit=${limit}`;
  const auth = generateHmac('GET', apiPath);
  const options = {
    hostname: 'api-gateway.coupang.com',
    path: apiPath,
    method: 'GET',
    headers: { 'Authorization': auth, 'Content-Type': 'application/json' }
  };
  const request = https.request(options, (response) => {
    let data = '';
    response.on('data', chunk => data += chunk);
    response.on('end', () => {
      try { res.json(JSON.parse(data)); }
      catch(e) { res.status(500).json({ error: 'Parse error', raw: data }); }
    });
  });
  request.on('error', e => res.status(500).json({ error: e.message }));
  request.end();
});

app.listen(process.env.PORT || 3000, () => console.log('Server running on port ' + (process.env.PORT || 3000)));
