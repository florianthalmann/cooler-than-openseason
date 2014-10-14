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
    GAIN_FADE_TIME: .05, //in seconds (max midi scheduleahead time!!)
    
    
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
          var newBuffer = Sound.audioContext.createBuffer(1, buffers[0].length, Sound.audioContext.sampleRate);
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
      
      // mixIndex
      if(soundIndex == 13) {
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
            if(soundIndex == 13) {
                 $('.global-status').show();
            }
            else {
                $('[data-index="' + soundIndex + '"] .track-status').show();
            }
        },
        complete: function() {
            if(soundIndex == 13) {
                $('.global-status').fadeOut(1000);
            }
            else {
                $('[data-index="' + soundIndex + '"] .track-status').fadeOut(200);
            }
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
     * Delete sound at given index
     */
    deleteSoundAt: function(soundIndex) {
      if (this.sounds[soundIndex]) {
        //remove sound
        this.sounds[soundIndex] = null;
        
        //delete file
        var fname = soundIndex + '.wav';
      
        $.ajax({
          type: 'POST',
          data: {
            action: 'deletefile',
            filename: fname,
          },
          url: '/php/ajax.delete.php',
          success: function(msg) {
          }
        })
      }
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
        if (this.sources[soundIndex] && time > 0) {
          this.sources[soundIndex].fadeOutAndStop(time-this.GAIN_FADE_TIME-.01);//10ms of security silence ;)
        }
        
        //create the new source and start the sound at the given volume and pitch
        this.sources[soundIndex] = new FadeableSource(this.sounds[soundIndex], volume, pitch, time);
        this.sources[soundIndex].connect(this.channels[soundIndex].input);
      }
    },
  
    stopAllSounds: function() {
      var i;
      for (i = 0; i < this.sources.length; i++) {
        if (this.sources[i]) {
          this.sources[i].fadeOutAndStop(0);
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
    
    //gainFactor determines general gain level. volume can be changed within FadableSource object
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
  
/*
 * FadeableSource Object
 */
function FadeableSource(buffer, volume, pitch, startingTime) {
    this.output = Sound.audioContext.createGain();
    this.output.gain.value = volume;
    this.source = Sound.audioContext.createBufferSource();
    this.source.buffer = buffer;
    this.source.connect(this.output);
    //play back normally at 60, and pitchShifted otherwise
    var pitchRatio = Math.pow(Math.pow(2, 1 / 12),(pitch - 60));
    this.source.playbackRate.value = pitchRatio;
    this.source.start(startingTime);
  
    this.fadeOutAndStop = function(stoppingTime) {
        //console.log(stoppingTime);
        if (!stoppingTime || stoppingTime <= Sound.audioContext.currentTime) {
          stoppingTime = Sound.audioContext.currentTime;
        }
        //keep volume the same until fade time
        this.output.gain.setValueAtTime(this.output.gain.value, stoppingTime);
        //then fade out
        this.output.gain.linearRampToValueAtTime(0, stoppingTime + Sound.GAIN_FADE_TIME);
        this.source.stop(stoppingTime + Sound.GAIN_FADE_TIME); //needs an argument in safari!
    };
  
    this.connect = function(target){
        this.output.connect(target);
    };
  
}
