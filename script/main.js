/* global User */
/* global Sound */
/* global Midi */
/* //global UI */

/*!
 * main.js 
 * Brings it all together
 */

$(function() {

  // Check if another producer should be loaded
  if( $('body').data('open-username') ) {
  
    // ++ Do the do...
    User.openUsername = $('body').data('open-username');
    User.openVersion  = $('body').data('open-version');
    
    console.log( 'View user: ' + User.openUsername );
    console.log( 'View version: ' + User.openVersion );
      
  }
  //


  navigator.getUserMedia  = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
  navigator.getUserMedia({ 'audio': true }, function(stream) {

    // If the user is logged in, go straight to main panel
    // otherwise load signup panel
    var session = User.sessionRunning();
    
    if( session !== '' ) {
      $('#container').load('/main.html', function() { initMainPanel(stream, session); });
    }
    else {
      $('#container').load('/signup.html', function() { initSignupPanel(stream); });
    }
  },
  function() {
    $('#container').load('/error.html');
  });
      
  
  /**
   * Callback when loading Main Panel
   * ++ also menu panel!
   */
  function initMainPanel(stream, data) {
    
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    Sound.audioContext = new AudioContext();
    Sound.tuna = new Tuna(Sound.audioContext);
    window.mediaStreamSource = Sound.audioContext.createMediaStreamSource(stream);
    
    initTracksAndChannels();
    
    $('#producer-name').html(data);
    
  }
  
  /*
   * Login panel init
   */
  function initLoginPanel(stream) {
  
    // Event Delegation for signup link
    $('#container').on('click', '#goto-signup', function(e) {
      e.preventDefault();
      $('#container').load('signup.html', function() { initSignupPanel(stream); });
    });
      
    $('#container').on('submit', '#form-login', function (e) {
      e.preventDefault();
      
      var fd = new FormData( $('#form-login')[0] );
      
      $.ajax({
        type: 'POST',
        url: '/php/ajax.user.php',
        processData: false,
        contentType: false,
        data: fd,
        
        success: function(data) {
          if(data.success) {
            // Load main panel
            $('#container').load('/main.html', function() { initMainPanel(stream, data.success); });
          }
          else {
            $('#message').html(data.error).show();
          }
        }
      });
      
    });
  }
  
  /*
   * Signup panel init
   */
  function initSignupPanel(stream) {
    
    // Event Delegation for login link
    $('#container').on('click', '#goto-login', function(e) {
      e.preventDefault();
      $('#container').load('/login.html', function() { initLoginPanel(stream); });
    });
    
    $('#container').on('submit', '#form-signup', function (e) {
      e.preventDefault();
      
      var fd = new FormData( $('#form-signup')[0] );
      
      $.ajax({
        type: 'POST',
        url: '/php/ajax.user.php',
        processData: false,
        contentType: false,
        data: fd,
        
        success: function(data) {
          if(data.success) {
            // Load main panel
            $('#container').load('/main.html', function() { initMainPanel(stream, data.success); });
          }
          else {
            $('#message').html(data.error).show();
          }
        }
      });
      
    });
  }
  
  /*
   * Tracklist init
   */
  function initTracksAndChannels() {
    $('.global-status').show();
    
    initTracks('/script/midi/wedancebassdrum.mid', 0, 'Bassdrum', .6, 0);
    initTracks('/script/midi/wedancesnare.mid', 1, 'Snare', .5, -.1);
    initTracks('/script/midi/wedancehihat.mid', 2, 'Hihat', .4, .15);
    initTracks('/script/midi/wedancetom.mid', 3, 'Tom', .4, -.15);
    initTracks('/script/midi/wedanceshaker.mid', 4, 'Shaker', .3, -.3);
    initTracks('/script/midi/wedancehey.mid', 5, 'Hey', .4, .15);
    initTracks('/script/midi/wedanceyeah.mid', 6, 'Yeah', .3, .3);
    initTracks('/script/midi/wedanceyo.mid', 7, 'Yo', .3, -.3);
    initTracks('/script/midi/wedancename.mid', 8, 'Producer name', .4, .1);
    initTracks('/script/midi/wedancedrink.mid', 9, 'Favorite drink', .4, -.1);
    initTracks('/script/midi/wedancemusic.mid', 10, 'Favorite music', .4, .1);
    initTracks('/script/midi/wedancemix.mid', 11, null, 1, 0, '/script/wav/wedancemix.wav');
    
    // Remove html template
    $('.tracklist li').first().remove();
  
    //load sound files potentially existing from previous sessions
    Sound.loadUserSoundFiles(11);
  }
  
  function initTracks(midiUrl, trackIndex, trackName, gain, pan, soundUrl) {
  
    // init html track, only there's a name for it
    if (trackName) {
      //adapt tracklist item
      var indexString = pad(trackIndex, 2);
      var currentTrack = $('.tracklist li').first().clone();
      currentTrack.find('#record').attr('id', 'record'+indexString);
      currentTrack.find('#play').attr('id', 'play'+indexString);
      currentTrack.find('.track-name').html(trackName);
      currentTrack.attr('data-index', trackIndex);
      $('.tracklist').append(currentTrack);
    }

    // init midifile
    Midi.loadMidiFile(midiUrl, function(data) {
      Midi.midiFiles.push(new PlayedMidiFile(MidiFile(data), trackIndex));
    });
   
    // init soundfile
    if (soundUrl) {
      Sound.loadSoundFile(soundUrl, trackIndex);
    }
    
    // init channel
    Sound.channels[trackIndex] = new ChannelBus(gain, pan);
    Sound.channels[trackIndex].connect(Sound.audioContext.destination);
    
    $('.global-status').fadeOut(300);
  }
  
  function pad(num, size) {
    var s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
  }
  
});