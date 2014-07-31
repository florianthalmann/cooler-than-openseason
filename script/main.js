$(function () {
	
  var sounds = [ ];
  var tempo = 120;

  var startRecorder = function(recorder) {
    recorder.clear();
    recorder.record();
  }

  var stopRecorder = function(recorder, soundIndex, context) {
    recorder.stop();
    recorder.getBuffer(function (buffers) {
      var newBuffer = context.createBuffer(1, buffers[0].length, 44100);
      newBuffer.getChannelData(0).set(buffers[0]);
      sounds[soundIndex] = newBuffer;
    });
  }
  
  function playSoundAt(time, soundIndex, context) {
    var source = context.createBufferSource();
    source.buffer = sounds[soundIndex];
    source.connect(context.destination);
    source.start(time);
  }
  
  function playSong(context) {
  	 var tempoFactor = (60/tempo);
  	 for (var bar = 0; bar < 2; bar++) {
  	 	var offset = bar*2*tempoFactor+context.currentTime;
      //bassdrum every half note
      for (var bassdrum = 0; bassdrum < 2; bassdrum+=1) {
      	  playSoundAt(bassdrum*tempoFactor+offset, 0, context);
      	}
      	//snare every dotted quarter note
      	for (var snare = 0.75; snare < 2; snare+=0.75) {
      	  playSoundAt(snare*tempoFactor+offset, 1, context);
      	}
      	//hihat every eighth note
      for (var hihat = 0; hihat < 2; hihat+=0.25) {
      	  playSoundAt(hihat*tempoFactor+offset, 2, context);
      	}
    }
  }
  
  navigator.getUserMedia  = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
  navigator.getUserMedia({"audio": true}, function(stream) {

    $("#shown").toggle();
    $("#hidden").toggle();

    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    var audioContext = new AudioContext();
    window.mediaStreamSource = audioContext.createMediaStreamSource( stream );

    var recorder = new Recorder(window.mediaStreamSource, {
      workerPath: "http://localhost/~flo/script/lib/recorderjs/recorderWorker.js"
    });
    var recording = false;

    $('[id^="record"]').click(function (e) {
      e.preventDefault();
      var buttonIndex = $(e.target).attr('id').slice(-1);
      
      if (recording === false) {
        startRecorder(recorder);
        recording = true;
      } else {
        stopRecorder(recorder, buttonIndex, audioContext);
        recording = false;
      }

    });

    $('[id^="play"]').click(function (e) {
      e.preventDefault();
      var buttonIndex = $(e.target).attr('id').slice(-1);
      playSoundAt(0, buttonIndex, audioContext);
    })
    
    $("button#song").click(function (e) {
      e.preventDefault();
      playSong(audioContext);
    })

  }, 

  function(error) {
    $("body").text("Error: you need to allow this sample to use the microphone.")
  });
})