/* global Sound */

/*!
 * midi.js 
 * MIDI controls and -file handling
 */

var Midi = {

    tempo: 125,    
    midiFiles: [],

    
    /*
     * While there are notes that will need to play before the next interval, 
     * schedule them and advance the pointer.
     */
    scheduleMidiEvents: function() {
        console.log(this.midiFiles);
        
        for (var i = 0; i < this.midiFiles.length; i++) {
            this.midiFiles[i].playEventsBefore(Sound.audioContext.currentTime + Sound.SCHEDULE_AHEAD_TIME);
        }
        
        Sound.timerID = window.setTimeout(Midi.scheduleMidiEvents, Sound.LOOK_AHEAD);
    },
    
    /*
     * Load Midi File
     */
    loadMidiFile: function(url, callback) {
        var request = new XMLHttpRequest();
        request.open('GET', url);
        request.overrideMimeType("text/plain; charset=x-user-defined");
        
        request.onreadystatechange = function() {
            if (this.readyState === 4 && this.status === 200) {
              // Munge response into a binary string
              var t   = this.responseText || "";
              var ff  = [];
              var mx  = t.length;
              var scc = String.fromCharCode;
              
              for (var z = 0; z < mx; z++) {
                ff[z] = scc(t.charCodeAt(z) & 255);
              }
              callback(ff.join(""));
            }
        };
        
        request.send();
    }
    
};


function PlayedMidiFile(midiFile, isMultitrack, firstIndex) {
    
    this.playEventsBefore = function(time) {
        var tickLength = 60 / Midi.tempo / midiFile.header.ticksPerBeat;
        
        for (var i = 0; i < midiFile.tracks.length; i++) {
            while (this.currentTrackPositions[i] < midiFile.tracks[i].length) {
                var currentEvent               = midiFile.tracks[i][this.currentTrackPositions[i]];
                var currentEventMidiTime       = this.currentTrackEventTimes[i] + (currentEvent.deltaTime * tickLength);
                var currentEventAudioClockTime = Sound.startingTime + currentEventMidiTime;
                
                if (currentEventAudioClockTime <= time) {
                    if (currentEvent.subtype === "noteOn") {
                        var volume = currentEvent.velocity / 127;
                        if (isMultitrack) {
                            //drum machine standard: first bassdrum at 36.
                            var soundIndex = firstIndex + currentEvent.noteNumber - 36;
                            Sound.playSoundAt(currentEventAudioClockTime, soundIndex, volume);
                        }
                        else {
                            //play pitched sound
                            var pitch = currentEvent.noteNumber;
                            Sound.playSoundAt(currentEventAudioClockTime, firstIndex, volume, pitch);
                        }
                    }
                    this.currentTrackPositions[i]++;
                    this.currentTrackEventTimes[i] = currentEventMidiTime;
                }
                else {
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