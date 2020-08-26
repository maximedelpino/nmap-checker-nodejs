const express = require("express");
const bodyParser = require("body-parser");
const router = express.Router();
const app = express();
const nmap = require('node-nmap');
const isIp = require('is-ip');
var ping = require('ping');
//const nmap = require('libnmap');
nmap.nmapLocation = 'nmap'; //default
var application_root = __dirname;

app.use(express.static(application_root));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

/* Router */

/* Route ('/'), methods='GET' */
app.get('/',(req, res) => {
    res.sendfile("index.html");
  });

  /* Route ('/checkPorts'), methods='POST' */
app.post('/checkPorts', (req, res) => {
    
    var serverID=req.body.id;
    var serverIP=req.body.ip;
    let boolPing;
    let portsData = new Array();

    if (isIp(serverIP))
    {

      var hosts = [serverIP];
      hosts.forEach(function(host){
        ping.sys.probe(host, function(isAlive){
            boolPing = isAlive ? true : false;

            if (boolPing) {

              let status = "up";
        
              var quickscan = new nmap.NmapScan(serverIP);
        
              quickscan.on('complete', function(data){
        
                data[0].openPorts.forEach(pushPortsToArray);
        
                function pushPortsToArray(item, index) {
                  let Obj = { [item.port]: "up"};
                  portsData.push(Obj);
                }
        
                res.setHeader('Content-Type', 'application/json');
                  res.send(JSON.stringify({ 
                    'id' : serverID,
                    'status' : status,
                    'ports' : portsData,
                    }));
              });
              
              quickscan.on('error', function(error){
                console.log(error);
              });
        
              quickscan.startScan();
        
            }
            else {
        
              let status = "down";
              let Obj = { 22: "down", 25: "down" };
              portsData.push(Obj);
              res.setHeader('Content-Type', 'application/json');
              res.send(JSON.stringify({ 
                'id' : serverID,
                'status' : status,
                'ports' : portsData,
                }));
            }
        });
      });
    }
  });
  
app.listen(3000,() => {
    console.log("Started on PORT 3000");
  })