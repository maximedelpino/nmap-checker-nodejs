const express = require("express");
const bodyParser = require("body-parser");
const router = express.Router();
const app = express();
//const nmap = require('node-nmap');
const nmap = require('libnmap');
nmap.nmapLocation = 'nmap'; //default
var application_root = __dirname;

app.use(express.static(application_root));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/',(req, res) => {
    res.sendfile("index.html");
  });

app.post('/checkPorts', (req, res) => {
    
    var serverID=req.body.id;
    var serverIP=req.body.ip;

    console.log(serverIP)

    const opts = {
        range: [serverIP]
      };
      
      
      nmap.scan(opts, function(err, report) {
        if (err) throw new Error(err);
      
        for (let item in report) {
          console.log(JSON.stringify(report[item], null, 2));
        }
      });

    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ id: serverID }));
  });
  
app.listen(3000,() => {
    console.log("Started on PORT 3000");
  })