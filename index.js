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

      let status = "up";
      let portsData = new Array();
      
      nmap.scan(opts, function(err, report) {
        if (err) throw new Error(err);
      
        for (let item in report) {
          let data = report[item].host[0].ports[0].port;
          
          data.forEach(function(element) {
            let portid = element.item.portid;
            let Obj = { [portid]: "up"}
            portsData.push(Obj);
          });

          res.setHeader('Content-Type', 'application/json');
          res.send(JSON.stringify({ 
            'id' : serverID,
            'status' : status,
            'ports' : portsData,
            }));
        }
      });
  });
  
app.listen(3000,() => {
    console.log("Started on PORT 3000");
  })