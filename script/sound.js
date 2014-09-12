/* global User */

/*!
 * sound.js 
 * Audio handling
 */

var Sound = {
    
    recorder: null,
    recordingSoundIndex: 0,
    audioContext: {},
    tuna:      {},
    sounds:    [],
    channels:  [],
    sources: [],
  
    MAX_RECORDING_TIME: 3000, //in milliseconds
    
    
    /*
     * Start Recording
     */
    startRecorder: function(soundIndex) {
      Sound.recordingSoundIndex = soundIndex;
      Sound.recorder.clear();
      Sound.recorder.record(Sound.MAX_RECORDING_TIME, Sound.stoppedRecording);
    },
  
    /*
     * Stop Recording
     * Upload file to server
     */
    stopRecorder: function() {
      if (Sound.recorder) {
        Sound.recorder.stop();
        Sound.stoppedRecording();
      }
    },
  
    stoppedRecording: function() {
      var recorder = Sound.recorder;
      
      if (recorder) {
        Sound.recorder.getBuffer(function (buffers) {
          var newBuffer = Sound.audioContext.createBuffer(1, buffers[0].length, 44100);
          newBuffer.getChannelData(0).set(buffers[0]);
          Sound.sounds[Sound.recordingSoundIndex] = newBuffer;
          
          // Save to soundIndex.wav!!
          recorder.exportWAV(function(blob) {
            Sound.saveSoundFile(Sound.recordingSoundIndex, blob);
          });
        });
        
        recorder.disconnect();
        Sound.recorder = null;
      }
      
      // deactivate appropriate UI button
      $('[id^="record' + pad(Sound.recordingSoundIndex, 2) + '"]').removeClass('active');
      
      function pad(num, size) {
        var s = num+"";
        while (s.length < size) s = "0" + s;
        return s;
      }
    },
    
    /*
     * Upload sound file to server
     */
    saveSoundFile: function(soundIndex, blob) {
      // Only submit soundIndex as filename, and add (unique) username serverside from Session
      var fname = soundIndex + '.wav';
  
      var fd = new FormData();
      fd.append('data', blob, fname);
  
      $.ajax({
        type: 'POST',
        url: '/php/ajax.upload.php',
        data: fd,
        cache: false,
        processData: false,
        contentType: false,
        success: function(data) {
          // feedback!
        },
        beforeSend: function() {
            $('[data-index="' + soundIndex + '"] .track-status').show();
        },
        complete: function() {
            $('[data-index="' + soundIndex + '"] .track-status').fadeOut(200);
        },
        error: function(xhr, ajaxOptions, thrownError) {
          console.log(thrownError);
        }
      });
    },
    
    /*
     * Load sound file from server
     */
    loadSoundFile: function(url, soundIndex) {
      
      var cacheMix = false;
      if(soundIndex == 11) {
          cacheMix = true;
      }
    
      $.ajax({
        type: 'GET',
        url: url,
        processData: false,
        dataType: "arraybuffer",
        cache: cacheMix,
        
        success: function(data) {
          Sound.audioContext.decodeAudioData(data, function(buffer) {
            Sound.sounds[soundIndex] = buffer;
          });
        },
        beforeSend: function() {
            $('[data-index="' + soundIndex + '"] .track-status').show();
        },
        complete: function() {
            $('[data-index="' + soundIndex + '"] .track-status').fadeOut(200);
        }
      });
    },
    
    /*
     * Load all stored files from server
     */
    loadUserSoundFiles: function(numberOfFiles, username, version) {
      for (var i = 0; i < numberOfFiles; i++) {
        this.loadUserSoundFile(i, username, version);
      }
    },
    
    /*
     * Construct sound file name and load that specific  file
     * via this.loadSoundFile()
     */
    loadUserSoundFile: function(soundIndex, username, version) {
      var url = '/userfiles/' + username + '/' + soundIndex + '.wav';
      this.loadSoundFile(url, soundIndex);
    },
    
    
    /*
     * Play sound at position with volume and pitch
     */
    playSoundAt: function(time, soundIndex, volume, pitch) {
      if (!pitch) {
        pitch = 60;
      }
      if (this.sounds[soundIndex]) {
        //if a source is already playing this sound, stop it.
        if (this.sources[soundIndex]) {
          this.sources[soundIndex].stop();
        }
        
        //create the new source and start the sound at the given volume and pitch
        var source = this.audioContext.createBufferSource();
        source.buffer = this.sounds[soundIndex];
        source.connect(this.channels[soundIndex].input);
        this.channels[soundIndex].adjustVolume(volume);
        //play back normally at 60, and pitchShifted otherwise
        var pitchRatio = Math.pow(Math.pow(2, 1 / 12),(pitch - 60));
        source.playbackRate.value = pitchRatio;
        source.start(time);
        
        //save source so that it can be stopped later
        this.sources[soundIndex] = source;
      }
    },
  
    stopAllSounds: function() {
      var i;
      for (i = 0; i < this.sources.length; i++) {
        if (this.sources[i]) {
          this.sources[i].stop();
        }
      }
      this.sources = [ ];
    }
};


/*
 * Channel Bus Object
 */
function ChannelBus(gainFactor, pan) {
    this.input = Sound.audioContext.createGain();
    this.output = Sound.audioContext.createGain();
    
    //var delay = new Sound.tuna.Delay();
    //var convolver = Sound.audioContext.createConvolver();
    //loadReverbFile(convolver);
    if (pan != 0) {
      var panner = Sound.audioContext.createPanner();
      panner.setPosition(pan,0,-0.5);
    }
    //var convolver = new Sound.tuna.Convolver();
    //var compressor = new Sound.tuna.Compressor();
    //var compressor = audioContext.createDynamicsCompressor();
    
    //equalizer -> delay -> convolver
    //this.input.connect(compressor);
    if (panner) {
      this.input.connect(panner);
      panner.connect(this.output);
      //this.input.connect(delay.input);
      //delay.connect(this.output);
    } else {
      this.input.connect(this.output);
    }
    //compressor.connect(delay.input);
    //delay.connect(this.output);
    //convolver.connect(this.output);
    
    //initially volume is assumed to be 1
    this.output.gain.value = gainFactor;
    //delay.delayTime = 100;
    //delay.feedback = .1;
    /*console.log(compressor);
    compressor.threshold = -100;
    compressor.ratio = 20;
    
    //compressor.makeupGain = 90;
    //compressor.automakeup = false;
    //convolver.wetLevel = .2;*/
    
    this.connect = function(target){
        this.output.connect(target);
    };
    
    //gainFactor determines general gain level. volume can be changed within range of gainFactor
    this.adjustVolume = function(volume) {
        this.output.gain.value = gainFactor*volume;
    };
  
    /*
     * Load reverb file from server
     */
    function loadReverbFile(convolver) {
      $.ajax({
        type: 'GET',
        url: '/script/lib/tuna/impulses/ir_rev_short.wav',
        processData: false,
        dataType: "arraybuffer",
        
        success: function(data) {
          Sound.audioContext.decodeAudioData(data, function(buffer) {
            convolver.buffer = buffer;
          });
        }
      });
    };
  
}
