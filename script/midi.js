/* global Sound */

/*!
 * midi.js 
 * MIDI controls and -file handling
 */

var Midi = {

    tempo: 125,    
    midiFiles: [],
    // How frequently to call scheduling function (milliseconds)
    LOOK_AHEAD: 25.0,
    // How far ahead to schedule midi (seconds)
    SCHEDULE_AHEAD_TIME: 0.1,
    // Offset that allows for more precise scheduling (makes late calls of playSoundAt(...) impossible)
    SCHEDULING_OFFSET: 0.1,
    timerID: 0,
    startingTime: 0,
    isPlaying: false,
    
    /*
     * While there are notes that will need to play before the next interval, 
     * schedule them and advance the pointer.
     */
    scheduleMidiEvents: function() {
        for (var i = 0; i < Midi.midiFiles.length; i++) {
            Midi.midiFiles[i].playEventsBefore(Sound.audioContext.currentTime + Midi.SCHEDULE_AHEAD_TIME);
        }
        Midi.timerID = window.setTimeout(Midi.scheduleMidiEvents, Midi.LOOK_AHEAD);
    },
  
    /*
     * Stops midi scheduling and resets the midi files to be played from the beginning.
     */
    stopMidiScheduling: function() {
        window.clearTimeout(Midi.timerID);
        for (var i = 0; i < Midi.midiFiles.length; i++) {
            Midi.midiFiles[i].reset();
        }
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
                var currentEventAudioClockTime = Midi.startingTime + currentEventMidiTime + Midi.SCHEDULING_OFFSET;
              
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