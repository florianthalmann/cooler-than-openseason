/* global Sound */
/* global Midi */
/* global Recorder */

/*!
 * ui.js 
 * Handles all user interaction
 */

var UI = {
    
    // The container that content is loaded into
    container: '#container',
    
    // The container that delegated events are attached to
    delegate:  '#container'
    
};


/*
 * document ready
 */
$(function() {

    // Cache jquery objects
    UI.container = $(UI.container);
    UI.delegate  = $(UI.delegate);
    

    // Load permission message by default
    UI.container.load('nopermission.html');

    
    // Dismiss message box
    $('#message').click( function() {
        $(this).fadeOut();
    });
    
    
    /**
     * Main Panel interactions
     */
     
    /*
     * Record button event delegation
     */    
    UI.delegate.on('click', '[id^="record"]', function (e) {
      e.preventDefault();
      var buttonIndex = parseInt($(e.target).attr('id').slice(-2));
      
      if (!$(this).hasClass('active') && !Sound.recorder) {
        Sound.recorder = new Recorder(window.mediaStreamSource, {
          workerPath: "script/lib/recorderjs/recorderWorker2.js"
        });
        
        Sound.startRecorder(buttonIndex);
        
        // Start button animation
        $(this).addClass('active');
      }
      else {
        Sound.stopRecorder();
        
        // Stop button animation
        $(this).removeClass('active');
      }
  
    });
    
    /*
     * Play single button event delegation
     */      
    UI.delegate.on('click', '[id^="play"]', function (e) {
      e.preventDefault();
      var buttonIndex = parseInt($(e.target).attr('id').slice(-2));
      Sound.playSoundAt(0, buttonIndex, 1);
    });

    /*
     * Play Song button event delegation
     */  
    UI.delegate.on('click', 'button#song', function (e) {
      e.preventDefault();
      togglePlaySong();
      if (Midi.isPlaying) {
        $(this).addClass('active');
      } else {
        $(this).removeClass('active');
      }
    });
    
    
    /*
     * Toggle Menu panel
     */
    UI.delegate.on('click', '.sqbutton.menu', function(e) {
        e.preventDefault();
        $('#menu').slideDown();
    });
    
    
    function togglePlaySong() {
        
      Midi.isPlaying = !Midi.isPlaying;
      if (Midi.isPlaying) { // start playing
          Midi.startingTime = Sound.audioContext.currentTime;
          Midi.scheduleMidiEvents(); // kick off scheduling
      }
      else {
          Midi.stopMidiScheduling();
          Sound.stopAllSounds();
      }
    }
    
});