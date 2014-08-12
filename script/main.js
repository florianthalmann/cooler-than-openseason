$(function () {
  
  var LOOK_AHEAD = 25.0, //how frequently to call scheduling function (milliseconds)
      SCHEDULE_AHEAD_TIME = 0.1; //how far ahead to schedule audio (seconds)
  var audioContext,
      tuna;
  var midiFiles = [ ],
      sounds = [ ],
      channels = [ ];
  var tempo = 125;
  var playingSong = false,
      timerID = 0,
      startingTime;

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
    //save to soundIndex.wav!!
  }
  
  function playSoundAt(time, soundIndex, volume, pitch) {
    if (!pitch) {
      pitch = 60;
    }
    var source = audioContext.createBufferSource();
    source.buffer = sounds[soundIndex];
    if (!channels[soundIndex]) {
      initChannel(soundIndex);
    }
    source.connect(channels[soundIndex].input);
    channels[soundIndex].output.gain.value = volume;
    //playBack normally at 60, and pitchShifted otherwise
    var pitchRatio = Math.pow(Math.pow(2, 1/12),(pitch-60));
    source.playbackRate.value = pitchRatio;
    source.start(time);
  }
  
  function initChannel(soundIndex) {
    channels[soundIndex] = new ChannelBus();
    channels[soundIndex].connect(audioContext.destination);
  }
  
  function togglePlaySong() {
    playingSong = !playingSong;
    if (playingSong) { // start playing
        startingTime = audioContext.currentTime;
        scheduleMidiEvents(); // kick off scheduling
    } else {
        window.clearTimeout(timerID);
        for (var i = 0; i < midiFiles.length; i++) {
          midiFiles[i].reset();
        }
    }
  }
  
  function scheduleMidiEvents() {
    // while there are notes that will need to play before the next interval, 
    // schedule them and advance the pointer.
    for (var i = 0; i < midiFiles.length; i++) {
      midiFiles[i].playEventsBefore(audioContext.currentTime + SCHEDULE_AHEAD_TIME);
    }
    timerID = window.setTimeout(scheduleMidiEvents, LOOK_AHEAD);
  }
  
  navigator.getUserMedia  = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
  navigator.getUserMedia({"audio": true}, function(stream) {

    $("#shown").toggle();
    $("#hidden").toggle();

    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContext();
    tuna = new Tuna(audioContext);
    window.mediaStreamSource = audioContext.createMediaStreamSource(stream);

    var recorder;
    
    loadMidiFiles();
    loadSoundFiles();
    

    $('[id^="record"]').click(function (e) {
      e.preventDefault();
      var buttonIndex = $(e.target).attr('id').slice(-1);
      
      if (!recorder) {
        recorder = new Recorder(window.mediaStreamSource, {
          workerPath: "script/lib/recorderjs/recorderWorker.js"
        });
        startRecorder(recorder);
        
        // start button animation
        $(this).addClass('active');
        
      } else {
        stopRecorder(recorder, buttonIndex);
        recorder.disconnect();
        recorder = null;
        
        // stop button animation
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
      togglePlaySong();
      if (playingSong) {
        $(this).addClass('active');
      } else {
        $(this).removeClass('active');
      }
    })

  }, 

  function(error) {
    $("body").text("Error: you need to allow this sample to use the microphone.")
  });
  
  // UI

  // Show name and e-mail input
  $('#title').click( function() {

    $('.wrapper').scroll();
    $('.wrapper').animate({ scrollTop: 62 }, 300);

  });

  // Update Name and toggle back to title
  $('#name-input button').click( function() {

    var pname = $('#input-producer-name').val();
    if( pname.length == 0 ) pname = '(Tap to enter name)';

    $('#producer-name').html( pname );

    $('.wrapper').scroll();
    $('.wrapper').animate({ scrollTop: 0 }, 300);

  });
  
  
  //additional methods and inner objects
  
  function loadMidiFiles() {
    loadMidiFile('script/midi/wedancedrums.mid', function(data) {
      midiFiles.push(new PlayedMidiFile(MidiFile(data), true, 0));
    });
    
    loadMidiFile('script/midi/wedancetom.mid', function(data) {
      midiFiles.push(new PlayedMidiFile(MidiFile(data), false, 3));
    });
    
    loadMidiFile('script/midi/wedancevoc.mid', function(data) {
      midiFiles.push(new PlayedMidiFile(MidiFile(data), false, 4));
    });
  }
  
  function loadSoundFiles() {
    loadSoundFile('script/wav/wedancevoc.wav', 4);
  }
  
  function loadMidiFile(url, callback) {
    var request = new XMLHttpRequest();
    request.open('GET', url);
    request.overrideMimeType("text/plain; charset=x-user-defined");
    request.onreadystatechange = function() {
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
    request.send();
  }
  
  function loadSoundFile(url, soundIndex) {
    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.responseType = 'arraybuffer';

    // Decode asynchronously
    request.onload = function() {
      audioContext.decodeAudioData(request.response, function(buffer) {
        sounds[soundIndex] = buffer;
      });
    }
    request.send();
  }
  
  function PlayedMidiFile(midiFile, isMultitrack, firstIndex) {
    this.playEventsBefore = function(time) {
      var tickLength = 60/tempo/midiFile.header.ticksPerBeat;
      for (var i = 0; i < midiFile.tracks.length; i++) {
        while (this.currentTrackPositions[i] < midiFile.tracks[i].length) {
          var currentEvent = midiFile.tracks[i][this.currentTrackPositions[i]];
          var currentEventMidiTime = this.currentTrackEventTimes[i] + (currentEvent.deltaTime * tickLength);
          var currentEventAudioClockTime = startingTime + currentEventMidiTime;
          if (currentEventAudioClockTime <= time) {
            if (currentEvent.subtype == "noteOn") {
              var volume = currentEvent.velocity / 127;
              if (isMultitrack) {
                //drum machine standard: first bassdrum at 36.
                var soundIndex = firstIndex + currentEvent.noteNumber - 36;
                playSoundAt(currentEventAudioClockTime, soundIndex, volume);
              } else {
                //play pitched sound
                var pitch = currentEvent.noteNumber;
                playSoundAt(currentEventAudioClockTime, firstIndex, volume, pitch);
              }
            }
            this.currentTrackPositions[i]++;
            this.currentTrackEventTimes[i] = currentEventMidiTime;
          } else {
            break;
          }
        }
      }
    }
  
    this.reset = function() {
      this.currentTrackPositions = [ ];
      this.currentTrackEventTimes = [ ];
      for (var i = 0; i < midiFile.tracks.length; i++) {
        this.currentTrackPositions.push(0);
        this.currentTrackEventTimes.push(0);
      }
    }
  
    this.reset();
  }
  
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
  
})