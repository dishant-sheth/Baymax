const express = require('express'),
http = require('http');
const csv = require('csv');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const app = express();
const server = http.createServer(app);
const symptms = require('../models/symptom');
const io = require('socket.io').listen(server);

const services = require('../services/index');

let obj = csv(); 

router.get('/', (req, res) => {
    res.send('This is the Baymax API');
});

router.get('/symptoms', (req, res) => {
    const symps = symptms.symptoms;
    console.log(symps.length);
    res.json({symptoms: symps});
});

router.get('/diseases', (req, res) => {

    services.getAllDiseases()
    .then((data) => {
        res.json({diseases: data});
    })
    .catch((error) => {
        res.json({err: error});
    });

});

router.post('/disease', (req, res) => {

    let longitude = req.body.longitude;
    let latitude = req.body.latitude;

    let user_symptoms = {
        s1: req.body.symptom1,
        s2: req.body.symptom2,
        s3: req.body.symptom3,
        s4: req.body.symptom4,
        s5: req.body.symptom5
    };

    console.log(user_symptoms);

    services.predictDiseases(user_symptoms)
    .then((data) => {
        res.json({diseases: data, count: data.count});
    })
    .catch((error) => {
        res.json({err: error});
    });


});

router.get('/landing', function(req, res){
    res.render('index');
});
	
function Sockets() {
  this.list = [ ];
}
Sockets.prototype.add = function(socket) {
  this.list.push(socket);

  let self = this;
  socket.on('disconnect', function() {
    self.remove(socket);
  });
}
Sockets.prototype.remove = function(socket) {
  let i = this.list.indexOf(socket);
  if (i != -1) {
    this.list.splice(i, 1);
  }
}
Sockets.prototype.emit = function(name, data, except) {
  let i = this.list.length;
  while(i--) {
    if (this.list[i] != except) {
      this.list[i].emit(name, data)
    }
  }
}

let collection = new Sockets();

io.sockets.on('connection', function(socket){

    console.log('Connected - ' + socket.id);
    collection.add(socket);

    socket.on('update', function(data){
        let message = 'A case of ' + data.disease + ' might have occured near you. Stay safe and take necessary precautions. ';
        collection.emit('update', {message: message}, socket);
    });

});

server.listen(3000, function(){
    console.log('Socket server running succesfully on port 3000');
});

module.exports = router;