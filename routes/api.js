
var Signer = require('../lib/signer').Signer,
    config = require('../config'),
    url    = require('url');

var signer = new Signer();

function returnError(res, type, message) {
  var data = {
    result: 'error',
    error: type,
    error_message: message
  };
  res.send(JSON.stringify(data));
}

function doCors(req, res)
{
  var origin = req.headers.Origin;
  if (config.allowedOriginDomains &&
      Array.isArray(config.allowedOriginDomains)) {
    var allowed = false;
    var parsedUrl = url.parse(origin);
    var hostname = parsedUrl.hostname;
    config.allowedOriginDomains.forEach(function (domain) {
      if (config.allowSubdomainOrigin) {
        // Check if hostname ends with allowed domain
        if (hostname.indexOf(domain, origin.length - domain.length) !== -1) {
          allowed = true;
        }
      } else {
        if (hostname === domain) {
          allowed = true;
        }
      }
    });

    if (!config.allowNonSslOrigin && parsedUrl.protocol !== "https:") {
      allowed = false;
    }

    if (allowed) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Methods', 'POST');
    }
  }
}
exports.cors = function(req, res, next)
{
  doCors(req, res);
  res.end();
};

exports.sign = function(req, res, next)
{
  doCors(req, res);

  var signres;
  try {
    if ("string" !== typeof req.body.info) {
      returnError(res, "missingInfo", "Public information is missing.");
    }
    if ("string" !== typeof req.body.signreq) {
      returnError(res, "missingSignreq", "Signature request is missing.");
    }
    signres = signer.sign(""+req.body.info, ""+req.body.signreq);
  } catch (e) {
    returnError(res, "internalError", e.message);
    return;
  }
  var data = {
    result: 'success',
    signres: signres
  };
  res.send(JSON.stringify(data));
};
