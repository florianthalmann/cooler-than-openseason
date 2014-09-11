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
  
  } else {
    //reset in case own version opened again
    User.openUsername = '';
    User.openVersion  = 1;
  
  }

  // If version is supposed to be listened to go to listening panel
  if( User.openUsername !== '' ) {
    $('#container').load('/main.html', function() { initMainPanel(null, User.openUsername, User.openVersion, true ); });
  }
  // If no version listening and the user is logged in, go straight to main panel
  else if( User.sessionRunning() !== '' ) {

    navigator.getUserMedia  = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
    navigator.getUserMedia({ 'audio': true }, function(stream) {
        $('#container').load('/main.html', function() { initMainPanel(stream, User.username, User.openVersion, false ); });
    },
    function() {
      $('#container').load('/error.html');
    });
  }
  // otherwise load signup panel
  else {
    $('#container').load('/signup.html', function() { initSignupPanel(stream); });
  }
      
  
  /**
   * Callback when loading Main Panel
   * ++ also menu panel!
   */
  function initMainPanel(stream, username, version, justListening) {
    
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    Sound.audioContext = new AudioContext();
    Sound.tuna = new Tuna(Sound.audioContext);
    if (stream) {
      window.mediaStreamSource = Sound.audioContext.createMediaStreamSource(stream);
    }
  
    initTracksAndChannels(username, version, justListening);
    
    $('#producer-name').html(username);
    
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
  function initTracksAndChannels(username, version, justListening) {
    $('.global-status').show();
    
    initTracks('/script/midi/wedancebassdrum.mid', 0, !justListening, 'Bassdrum', .6, 0);
    initTracks('/script/midi/wedancesnare.mid', 1, !justListening, 'Snare', .5, -.05);
    initTracks('/script/midi/wedancehihat.mid', 2, !justListening, 'Hihat', .4, .15);
    initTracks('/script/midi/wedancetom.mid', 3, !justListening, 'Tom', .4, -.15);
    initTracks('/script/midi/wedanceshaker.mid', 4, !justListening, 'Shaker', .3, -.3);
    initTracks('/script/midi/wedancehey.mid', 5, !justListening, 'Hey', .4, .15);
    initTracks('/script/midi/wedanceyeah.mid', 6, !justListening, 'Yeah', .3, .3);
    initTracks('/script/midi/wedanceyo.mid', 7, !justListening, 'Yo', .3, -.3);
    initTracks('/script/midi/wedancename.mid', 8, !justListening, 'Producer name', .4, .1);
    initTracks('/script/midi/wedancedrink.mid', 9, !justListening, 'Favorite drink', .4, -.1);
    initTracks('/script/midi/wedancemusic.mid', 10, !justListening, 'Favorite music', .4, .1);
    initTracks('/script/midi/wedancemix.mid', 11, false, null, 1, 0, '/script/wav/wedancemix.wav');
    
    // Remove html template
    $('.tracklist li').first().remove();
  
    //load sound files potentially existing from previous sessions
    Sound.loadUserSoundFiles(11, username, version);
  
    if (justListening) {
      $('.share').hide();
      $('#are-you-cooler').html('Are you cooler than ' + username + '?');
      $('.make-your-own-area').show();
    } else {
      $('.make-your-own-area').hide();
      var link = window.location.hostname + '/' + username;
      $('#share-link').html(link + '!');
      $('#share-link').attr("href", link);
      $('.share').show();
    }
  
  }
  
  function initTracks(midiUrl, trackIndex, makeHtmlTrack, trackName, gain, pan, soundUrl) {
  
    // init html track only if necessary
    if (makeHtmlTrack) {
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