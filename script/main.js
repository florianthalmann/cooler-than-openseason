$(function () {
  
  var audioContext, tuna, midiFile;
  var sounds = [ ];
  var channels = [ ];
  var tempo = 98;

  function startRecorder(recorder) {
    recorder.clear();
    recorder.record();
  }

  function stopRecorder(recorder, soundIndex) {
    recorder.stop();
    recorder.getBuffer(function (buffers) {
      var newBuffer = audioContext.createBuffer(1, buffers[0].length, 44100);
      newBuffer.getChannelData(0).set(buffers[0]);
      sounds[soundIndex] = newBuffer;
    });
  }
  
  function playSoundAt(time, soundIndex, volume) {
    var source = audioContext.createBufferSource();
    source.buffer = sounds[soundIndex];
    if (!channels[soundIndex]) {
      initChannel(soundIndex);
    }
    source.connect(channels[soundIndex].input);
    channels[soundIndex].output.gain.value = volume;
    source.start(time);
  }
  
  function initChannel(soundIndex) {
    channels[soundIndex] = new ChannelBus();
    channels[soundIndex].connect(audioContext.destination);
  }
  
  function playSong() {
    var tickLength = 60/tempo/midiFile.header.ticksPerBeat;
    for (var i = 0; i < midiFile.tracks.length; i++) {
      var currentEventTime = 0;
      for (var j = 0; j < midiFile.tracks[i].length; j++) {
        var currentEvent = midiFile.tracks[i][j];
        currentEventTime += currentEvent.deltaTime * tickLength;
        if (currentEvent.subtype == "noteOn") {
          var time = audioContext.currentTime + currentEventTime;
          //drum machine standard: first at 36.
          var soundIndex = currentEvent.noteNumber - 36;
          var volume = currentEvent.velocity / 127;
          playSoundAt(time, soundIndex, volume);
        }
      }
    }
  }
  
  navigator.getUserMedia  = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
  navigator.getUserMedia({"audio": true}, function(stream) {

    $("#shown").toggle();
    $("#hidden").toggle();

    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContext();
    tuna = new Tuna(audioContext);
    window.mediaStreamSource = audioContext.createMediaStreamSource(stream);

    var recorder = new Recorder(window.mediaStreamSource, {
      workerPath: "script/lib/recorderjs/recorderWorker.js"
    });
    var recording = false;
    
    loadFileRemote('script/midi/drums.mid', function(data) {
      midiFile = MidiFile(data);
    });

    $('[id^="record"]').click(function (e) {
      e.preventDefault();
      var buttonIndex = $(e.target).attr('id').slice(-1);
      
      if (recording === false) {
        startRecorder(recorder);
        recording = true;
        
        $(this).addClass('active');
      } else {
        stopRecorder(recorder, buttonIndex);
        recording = false;
        
        $(this).removeClass('active');
      }

    });

    $('[id^="play"]').click(function (e) {
      e.preventDefault();
      var buttonIndex = $(e.target).attr('id').slice(-1);
      playSoundAt(0, buttonIndex, 1);
    })
    
    $("button#song").click(function (e) {
      e.preventDefault();
      playSong();
    })

  }, 

  function(error) {
    $("body").text("Error: you need to allow this sample to use the microphone.")
  });
  
  
  function ChannelBus() {
    this.input = audioContext.createGain();
    this.output = audioContext.createGain();
  
    var delay = new tuna.Delay();
    var convolver = new tuna.Convolver();
    var compressor = new tuna.Compressor();
  
    //equalizer -> delay -> convolver
    this.input.connect(compressor.input);
    //this.input.connect(output);
    compressor.connect(delay.input);
    delay.connect(convolver.input);
    convolver.connect(this.output);
  
    delay.delayTime = 300;
    delay.feedback = .2;
    convolver.wetLevel = .2;
  
    this.connect = function(target){
      this.output.connect(target);
    };
  }
  
  function loadFileRemote(path, callback) {
    var fetch = new XMLHttpRequest();
    fetch.open('GET', path);
    fetch.overrideMimeType("text/plain; charset=x-user-defined");
    fetch.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        /* munge response into a binary string */
        var t = this.responseText || "" ;
        var ff = [];
        var mx = t.length;
        var scc= String.fromCharCode;
        for (var z = 0; z < mx; z++) {
          ff[z] = scc(t.charCodeAt(z) & 255);
        }
        callback(ff.join(""));
      }
    }
    fetch.send();
  }
  
  // Toggle name and e-mail inputs
  $('#title').click( function() {
      
    $('.wrapper').scroll();
    $('.wrapper').animate({ scrollTop: 62 }, 300);
      
  });

  
  $('#name-input button').click( function() {
  
    var pname = $('#input-producer-name').val();
    if( pname.length == 0 ) pname = '(Tap to enter name)';

    $('#producer-name').html( pname );
    
    $('.wrapper').scroll();
    $('.wrapper').animate({ scrollTop: 0 }, 300);
      
  });
  
})