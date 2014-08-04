$(function () {
  
  var audioContext, tuna;
  var sounds = [ ];
  var channels = [ ];
  var tempo = 70;

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
  
  function playSoundAt(time, soundIndex) {
  	 var source = audioContext.createBufferSource();
  	 source.buffer = sounds[soundIndex];
  	 if (!channels[soundIndex]) {
  	 	initChannel(soundIndex);
  	 }
  	 source.connect(channels[soundIndex].input);
    source.start(time);
  }
  
  function initChannel(soundIndex) {
    channels[soundIndex] = new ChannelBus();
    channels[soundIndex].connect(audioContext.destination);
  }
  
  function playSong() {
  	 var tempoFactor = (60/tempo);
  	 for (var bar = 0; bar < 2; bar++) {
  	 	var offset = bar*2*tempoFactor+audioContext.currentTime;
      //bassdrum every half note
      for (var bassdrum = 0; bassdrum < 2; bassdrum+=1) {
      	  playSoundAt(bassdrum*tempoFactor+offset, 0);
      	}
      	//snare every dotted quarter note
      	for (var snare = 0.75; snare < 2; snare+=0.75) {
      	  playSoundAt(snare*tempoFactor+offset, 1);
      	}
      	//hihat every eighth note
      for (var hihat = 0; hihat < 2; hihat+=0.25) {
      	  playSoundAt(hihat*tempoFactor+offset, 2);
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

    $('[id^="record"]').click(function (e) {
      e.preventDefault();
      var buttonIndex = $(e.target).attr('id').slice(-1);
      
      if (recording === false) {
        startRecorder(recorder);
        recording = true;
      } else {
        stopRecorder(recorder, buttonIndex);
        recording = false;
      }

    });

    $('[id^="play"]').click(function (e) {
      e.preventDefault();
      var buttonIndex = $(e.target).attr('id').slice(-1);
      playSoundAt(0, buttonIndex);
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
    var output = audioContext.createGain();
  
    var delay = new tuna.Delay();
    var convolver = new tuna.Convolver();
    var compressor = new tuna.Compressor();
  
    //equalizer -> delay -> convolver
    this.input.connect(compressor.input);
    //this.input.connect(output);
    compressor.connect(delay.input);
    delay.connect(convolver.input);
    convolver.connect(output);
  
    delay.delayTime = 300;
    delay.feedback = .2;
    convolver.wetLevel = .2;
  
    this.connect = function(target){
      output.connect(target);
    };
  }
  
})