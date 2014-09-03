/* global User */

/*!
 * sound.js 
 * Audio handling
 */

var Sound = {
    
    recorder: null,
    audioContext: {},
    tuna:      {},
    sounds:    [],
    channels:  [],
  
    longSoundSources: [],
    
    
    /*
     * Start Recording
     */
    startRecorder: function() {
      Sound.recorder.clear();
      Sound.recorder.record();
    },
  
    /*
     * Stop Recording
     * Upload file to server
     */
    stopRecorder: function(soundIndex) {
      var recorder = Sound.recorder;
      
      recorder.stop();
      recorder.getBuffer(function (buffers) {
        var newBuffer = Sound.audioContext.createBuffer(1, buffers[0].length, 44100);
        newBuffer.getChannelData(0).set(buffers[0]);
        Sound.sounds[soundIndex] = newBuffer;
        
        // Save to soundIndex.wav!!
        recorder.exportWAV(function(blob) {
          Sound.saveSoundFile(soundIndex, blob);
        });
      });
      
      recorder.disconnect();
      Sound.recorder = null;
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
        url: 'php/ajax.upload.php',
        data: fd,
        cache: false,
        processData: false,
        contentType: false,
        success: function(data) {
          // feedback!
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
      $.ajax({
        type: 'GET',
        url: url,
        processData: false,
        dataType: "arraybuffer",
        cache: false,
        
        success: function(data) {
          Sound.audioContext.decodeAudioData(data, function(buffer) {
            Sound.sounds[soundIndex] = buffer;
          });
        }
      });
    },
    
    /*
     * Load all stored files from server
     */
    loadUserSoundFiles: function() {
      // Check/Cache username if user just logged in/signed up
      if(User.sessionRunning()) {
        for (var i = 0; i < 9; i++) {
          this.loadUserSoundFile(i);
        }
      }
    },
    
    /*
     * Construct sound file name and load that specific  file
     * via this.loadSoundFile()
     */
    loadUserSoundFile: function(soundIndex) {
      var url = 'userfiles/' + User.username + '/' + soundIndex + '.wav';
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
        var source = this.audioContext.createBufferSource();
        source.buffer = this.sounds[soundIndex];
        source.connect(this.channels[soundIndex].input);
        this.channels[soundIndex].adjustVolume(volume);
        
        // Play back normally at 60, and pitchShifted otherwise
        var pitchRatio = Math.pow(Math.pow(2, 1 / 12),(pitch - 60));
        source.playbackRate.value = pitchRatio;
        source.start(time);
        
        // So that mix track is stoppable
        if (soundIndex === 11) {
          this.longSoundSources.push(source);
        }
      }
    }
};


/*
 * Channel Bus Object
 */
function ChannelBus(gainFactor) {
    this.input = Sound.audioContext.createGain();
    this.output = Sound.audioContext.createGain();
    
    var delay = new Sound.tuna.Delay();
    //var convolver = new Sound.tuna.Convolver();
    //var compressor = new Sound.tuna.Compressor();
    //var compressor = audioContext.createDynamicsCompressor();
    
    //equalizer -> delay -> convolver
    //this.input.connect(compressor);
    this.input.connect(this.output);
    //delay.connect(this.output);
    //compressor.connect(delay.input);
    //delay.connect(this.output);
    //convolver.connect(this.output);
    
    //initially volume is assumed to be 1
    this.output.gain.value = gainFactor;
    //delay.delayTime = 200;
    //delay.feedback = .2;
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
}