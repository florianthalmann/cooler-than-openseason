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
      startingTime,
      longSoundSources = [ ];

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
      //save to soundIndex.wav!!
      recorder.exportWAV(function(blob) {
        saveSoundFile(soundIndex, blob);
        /*var url = URL.createObjectURL(blob);
        var li = document.createElement('li');
        var au = document.createElement('audio');
        var hf = document.createElement('a');
        
        au.controls = true;
        au.src = url;
        hf.href = url;
        hf.download = new Date().toISOString() + '.wav';
        hf.innerHTML = hf.download;
        li.appendChild(au);
        li.appendChild(hf);
        $('#hidden').append(li);*/
      });
    });
  }
  
  function playSoundAt(time, soundIndex, volume, pitch) {
    console.log(soundIndex + " " + volume);
    if (!pitch) {
      pitch = 60;
    }
    if (sounds[soundIndex]) {
      var source = audioContext.createBufferSource();
      source.buffer = sounds[soundIndex];
      source.connect(channels[soundIndex].input);
      channels[soundIndex].output.gain.value = volume;
      //playBack normally at 60, and pitchShifted otherwise
      var pitchRatio = Math.pow(Math.pow(2, 1/12),(pitch-60));
      source.playbackRate.value = pitchRatio;
      source.start(time);
      //so that voc track is stoppable
      if (soundIndex == 9) {
        longSoundSources.push(source);
      }
    }
  }
  
  function togglePlaySong() {
    playingSong = !playingSong;
    console.log(longSoundSources);
    if (playingSong) { // start playing
        startingTime = audioContext.currentTime;
        scheduleMidiEvents(); // kick off scheduling
    } else {
        window.clearTimeout(timerID);
        for (var i = 0; i < midiFiles.length; i++) {
          midiFiles[i].reset();
        }
        for (var i = 0; i < longSoundSources.length; i++) {
          longSoundSources[i].stop();
        }
        longSoundSources = [ ];
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
    
    initTracksAndChannels();
    

    $('[id^="record"]').click(function (e) {
      e.preventDefault();
      var buttonIndex = $(e.target).attr('id').slice(-1);
      
      if (!recorder) {
        recorder = new Recorder(window.mediaStreamSource, {
          workerPath: "script/lib/recorderjs/recorderWorker2.js"
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
    });
    
    $("button#song").click(function (e) {
      e.preventDefault();
      togglePlaySong();
      if (playingSong) {
        $(this).addClass('active');
      } else {
        $(this).removeClass('active');
      }
    });

  },

  function(error) {
    $("body").text("Error: you need to allow this sample to use the microphone.");
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
  
  function initTracksAndChannels() {
    initTracks('script/midi/wedancedrums.mid', 0, ['Bassdrum', 'Snare', 'Hihat'], 1);
    initTracks('script/midi/wedancetom.mid', 3, ['Tom'], 1);
    initTracks('script/midi/wedancebass.mid', 4, ['Bass'], 1);
    initTracks('script/midi/wedanceshaker.mid', 5, ['Shaker'], .5);
    initTracks('script/midi/wedancehey.mid', 6, ['Hey'], 1);
    initTracks('script/midi/wedanceyeah.mid', 7, ['Yeah'], 1);
    initTracks('script/midi/wedanceyo.mid', 8, ['Yo'], 1);
    initTracks('script/midi/wedancevoc.mid', 9, null, 1, 'script/wav/wedancevoc.wav');
    $('.tracklist li').first().remove();
  }
  
  function initTracks(midiUrl, firstIndex, trackNames, gain, soundUrl) {
    var trackCount = trackNames ? trackNames.length : 1;
    //init html tack
    if (trackNames) {
      //adapt trackist items
      for (var i = 0; i < trackNames.length; i++) {
        var currentTrack = $('.tracklist li').first().clone();
        currentTrack.find('#record').attr('id', 'record'+(firstIndex+i));
        currentTrack.find('#play').attr('id', 'play'+(firstIndex+i));
        currentTrack.find('.track-name').html(trackNames[i]);
        $('.tracklist').append(currentTrack);
      }
    }
    //init midifile
    loadMidiFile(midiUrl, function(data) {
      midiFiles.push(new PlayedMidiFile(MidiFile(data), trackCount>1, firstIndex));
    });
    //init soundfile
    if (soundUrl) {
      loadSoundFile(soundUrl, firstIndex);
    }
    //init channels
    for (var i = firstIndex; i < firstIndex+trackCount; i++) {
      channels[i] = new ChannelBus(gain);
      channels[i].connect(audioContext.destination);
    }
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
    };
    request.send();
  }
  
  function loadSoundFile(url, soundIndex) {
    $.ajax({
      type: 'GET',
      url: url,
      processData: false,
      success: function(data) {
        audioContext.decodeAudioData(data, function(buffer) {
          sounds[soundIndex] = buffer;
        });
      },
      dataType: "arraybuffer"
    });
  }
  
  function saveSoundFile(soundIndex, blob) {
    
    // Filename with producer name, need to add some sort of unique user ID
    var fname = $('#producer-name').html() + '-' + soundIndex + '.wav';

    var fd = new FormData();
    fd.append('data', blob, fname);

    $.ajax({
      type: 'POST',
      url: 'php/ajax.upload.php',
      data: fd,
      cache: false,
      processData: false,
      contentType: false,
      success: function(data) {
        console.log(data);
      },
      error: function(xhr, ajaxOptions, thrownError) {
        console.log(thrownError);
      }
    });
  }
  
  function upload(blob) {
  var xhr=new XMLHttpRequest();
  xhr.onload=function(e) {
      if(this.readyState === 4) {
          console.log("Server returned: ",e.target.responseText);
      }
  };
  var fd=new FormData();
  fd.append("that_random_filename.wav",blob);
  xhr.open("POST","<url>",true);
  xhr.send(fd);
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
    };
  
    this.reset = function() {
      this.currentTrackPositions = [ ];
      this.currentTrackEventTimes = [ ];
      for (var i = 0; i < midiFile.tracks.length; i++) {
        this.currentTrackPositions.push(0);
        this.currentTrackEventTimes.push(0);
      }
    };
  
    this.reset();
  }
  
  function ChannelBus(gain) {
    this.input = audioContext.createGain();
    this.output = audioContext.createGain();
  
    //var delay = new tuna.Delay();
    //var convolver = new tuna.Convolver();
    //var compressor = new tuna.Compressor();
    //var compressor = audioContext.createDynamicsCompressor();
  
    //equalizer -> delay -> convolver
    //this.input.connect(compressor);
    this.input.connect(this.output);
    //compressor.connect(delay.input);
    //delay.connect(this.output);
    //convolver.connect(this.output);
  
    this.output.gain.value = gain;
    /*delay.delayTime = 300;
    delay.feedback = .2;
    console.log(compressor);
    compressor.threshold = -100;
    compressor.ratio = 20;
  
    //compressor.makeupGain = 90;
    //compressor.automakeup = false;
    //convolver.wetLevel = .2;*/
  
    this.connect = function(target){
      this.output.connect(target);
    };
  }
  
  
  /**
   * Register ajax transports for blob send/recieve and array buffer send/receive via XMLHttpRequest Level 2
   * within the comfortable framework of the jquery ajax request, with full support for promises.
   *
   * Notice the +* in the dataType string? The + indicates we want this transport to be prepended to the list
   * of potential transports (so it gets first dibs if the request passes the conditions within to provide the
   * ajax transport, preventing the standard transport from hogging the request), and the * indicates that
   * potentially any request with any dataType might want to use the transports provided herein.
   *
   * Remember to specify 'processData:false' in the ajax options when attempting to send a blob or arraybuffer -
   * otherwise jquery will try (and fail) to convert the blob or buffer into a query string.
   */
  $.ajaxTransport("+*", function(options, originalOptions, jqXHR){
      // Test for the conditions that mean we can/want to send/receive blobs or arraybuffers - we need XMLHttpRequest
      // level 2 (so feature-detect against window.FormData), feature detect against window.Blob or window.ArrayBuffer,
      // and then check to see if the dataType is blob/arraybuffer or the data itself is a Blob/ArrayBuffer
      if (window.FormData && ((options.dataType && (options.dataType === 'blob' || options.dataType === 'arraybuffer')) ||
          (options.data && ((window.Blob && options.data instanceof Blob) ||
              (window.ArrayBuffer && options.data instanceof ArrayBuffer)))
          ))
      {
          return {
              /**
               * Return a transport capable of sending and/or receiving blobs - in this case, we instantiate
               * a new XMLHttpRequest and use it to actually perform the request, and funnel the result back
               * into the jquery complete callback (such as the success function, done blocks, etc.)
               *
               * @param headers
               * @param completeCallback
               */
              send: function(headers, completeCallback){
                  var xhr = new XMLHttpRequest(),
                      url = options.url || window.location.href,
                      type = options.type || 'GET',
                      dataType = options.dataType || 'text',
                      data = options.data || null,
                      async = options.async || true,
                      key;
   
                  xhr.addEventListener('load', function(){
                      var response = {}, status, isSuccess;
   
                      isSuccess = xhr.status >= 200 && xhr.status < 300 || xhr.status === 304;
   
                      if (isSuccess) {
                          response[dataType] = xhr.response;
                      } else {
                          // In case an error occured we assume that the response body contains
                          // text data - so let's convert the binary data to a string which we can
                          // pass to the complete callback.
                          response.text = String.fromCharCode.apply(null, new Uint8Array(xhr.response));
                      }
   
                      completeCallback(xhr.status, xhr.statusText, response, xhr.getAllResponseHeaders());
                  });
   
                  xhr.open(type, url, async);
                  xhr.responseType = dataType;
   
                  for (key in headers) {
                      if (headers.hasOwnProperty(key)) xhr.setRequestHeader(key, headers[key]);
                  }
                  xhr.send(data);
              },
              abort: function(){
                  jqXHR.abort();
              }
          };
      }
  });
  
});