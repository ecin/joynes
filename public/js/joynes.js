joynes = {
  Base : {},
  
  Master : function(nes) {
    var self = this;
    
    this.initialize();
    this.socket = new WebSocket('ws://' + document.location.hostname + ':8080/');
    this.socket.onopen = function(evt){
      self.socket.send('m');
    }

    this.nes = nes;
    this.frameRate = null;
    this.lastSendTime = null;
    this.nes.ui.romSelect.unbind('change');
    
    this.nes.ui.romSelect.bind('change', function(){
      self.loadRom(self.nes.ui.romSelect.val());
      self.sendImageData();
    });
    
    this.socket.onmessage = function(evt){
      var data = JSON.parse(evt.data);
      var now = Date.now();
      if(data.key){ self.nes.keyboard.setKey(data.key, data.value) };
      if(data.ok){ 
        if(!self.lastSendTime){ self.lastSendTime = Date.now() }
        else{ 
          var frameRate = 1/(now - self.lastSendTime) * 1000;
          console.log(frameRate);
          if(frameRate < 15){ frameRate = 15 }
          else if(frameRate > 60){ frameRate = 60 };
          // Set to frameRate + 1 so we can increase until reaching limit.
          self.setFrameRate(frameRate + 1);
        }
        self.sendImageData();
        self.lastSendTime = now;
      };
      if(data.close){
        self.setFrameRate(60);
      }
    }
  },
  
  Slave : function() {
    var self = this;

    this.initialize();
    this.socket.onopen = function(evt){
      self.socket.send('s');
      self.socket.send(JSON.stringify({ok: 1})); 
    }
    this.socket.onmessage = function(evt){
      self.drawCanvas(evt.data);
      self.socket.send(JSON.stringify({ok: 1}));
    };
    

    this.canvas = $('<canvas class="nes-screen" width="256" height="240">').appendTo('#emulator_2')[0];

    $(document).
    bind('keydown', function(evt) {
      self.sendKey(evt.keyCode, 0x41);
    }).
    bind('keyup', function(evt) {
      self.sendKey(evt.keyCode, 0x40);
    }).
    bind('keypress', function(evt) {
        evt.preventDefault()
    });
  }
};