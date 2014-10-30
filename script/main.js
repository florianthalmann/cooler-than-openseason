/* global User */
/* global Sound */
/* global Midi */
/* global MidiFile */
/* global Tuna */
/* global AudioContext */
/* global UI */

/*!
 * main.js 
 * Brings it all together
 */

$(function() {

  var micStream = null;

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
    $('#container').load('/main.html', function() { initMainPanel(User.openUsername, User.openVersion, true ); });
  } else {
    initWelcomePanel();
  }
  
  function initWelcomePanel() {
    // If the user is logged in, go straight to main panel
    if( User.sessionRunning() !== '' ) {
      $('#container').load('/main.html', function() { initMainPanel(User.username, User.openVersion, false ); });
    // otherwise load signup panel
    } else {
      $('#container').load('/signup.html', function() { initSignupPanel(); });
    }
  }
  
  /*
   * Signup panel init
   */
  function initSignupPanel() {
    /*if( User.sessionRunning() !== '' ) {
      //welcome user back
    } else {
      //load signup stuff
    }*/
  
    updateRecentVersionsList();
    
    // Event Delegation for login link
    $('#container').on('click', '#goto-login', function(e) {
      e.preventDefault();
      $('#container').load('/login.html', function() { initLoginPanel(); });
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
            $('#container').load('/main.html', function() { initMainPanel(User.username, User.openVersion, false); });
          }
          else {
            $('#message').html(data.error).show();
          }
        }
      });
      
    });
  }
  
  
  function updateRecentVersionsList() {
    $.ajax({
        type: 'GET',
        url: '/php/ajax.recentusers.php',
        dataType: 'json',
        
        success: function(data) {
        
            //add a link for each username
            data.usernames.forEach( function(currentUsername, index) {
                var currentUserlink = $('.recent-users li').first().clone();
                currentUserlink.find('.userlink').attr('onclick', "location.href='/"+currentUsername+"'");
                currentUserlink.find('.userlink').html(currentUsername);
                $('.recent-users').append(currentUserlink);
            });
            // Remove html template
            $('.recent-users li').first().remove();
           
        }
      });
  }
      
  
  /**
   * Callback when loading Main Panel
   * ++ also menu panel!
   */
  function initMainPanel(username, version, justListening) {
    if (!justListening) {
      //load no permission by default...
      loadNoPermissionPanel();
      if (!micStream) {
        try {
          navigator.getUserMedia  = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
          navigator.getUserMedia({ 'audio': true },
            //success
            function(stream) {
              micStream = stream;
              $('#container').load('/main.html', function() { initAudioAndMainPanel(username, version, justListening); });
            },
            //failure
            function() {
              loadNoPermissionPanel();
          });
        } catch (err) {
          loadNoPermissionPanel();
        }
      }
    } else {
      initAudioAndMainPanel(username, version, justListening);
    }
  }
  
  function initAudioAndMainPanel(username, version, justListening) {
    if (!justListening) {
      // Show instructions
      $('#message').html('<strong>INSTRUCTIONS</strong><br><br><img src="/img/instruct-record.png"> Record your sounds and check out how they fit in the track <img src="/img/instruct-play.png"><br><img src="/img/instruct-share.png"> Share your hip-shaking masterpiece with your friends!<br>Open Season loves you!<br><br>Tap/click to close instructions...').show();
  
      //show competition
  
      updateRecentVersionsList();
    }
    
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    Sound.audioContext = new AudioContext();
    Sound.tuna = new Tuna(Sound.audioContext);
    if (micStream) {
      window.mediaStreamSource = Sound.audioContext.createMediaStreamSource(micStream);
    }
  
    //load large osmix soundfile only once for better performance!
    var mixIndex = 13;
    if (!Sound.sounds[mixIndex]) {
      initTracks('/script/midi/wedancemix.mid', mixIndex, false, null, 1, 0, '/script/audio/wedancemix.mp3');
    }
  
    initUserTracksAndChannels(username, version, justListening);
    
    $('#producer-name').html(username);
    
  }
  
  function loadNoPermissionPanel() {
    $('#container').load('/nopermission.html');
  }
  
  /*
   * Login panel init
   */
  function initLoginPanel() {
  
    // Event Delegation for signup link
    $('#container').on('click', '#goto-signup', function(e) {
      e.preventDefault();
      $('#container').load('signup.html', function() { initSignupPanel(); });
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
            $('#container').load('/main.html', function() { initMainPanel(data.success); });
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
  function initUserTracksAndChannels(username, version, justListening) {
    
    initTracks('/script/midi/wedancebassdrum.mid', 0, !justListening, 'Bassdrum', .55, 0);
    initTracks('/script/midi/wedancesnare.mid', 1, !justListening, 'Snare', .5, 0);
    initTracks('/script/midi/wedancehihat.mid', 2, !justListening, 'Hihat', .35, .15);
    initTracks('/script/midi/wedancetom.mid', 3, !justListening, 'Tom', .35, -.15);
    initTracks('/script/midi/wedanceshaker.mid', 4, !justListening, 'Shaker', .25, -.3);
    initTracks('/script/midi/wedanceclap.mid', 5, !justListening, 'Clap', .3, -.1);
    initTracks('/script/midi/wedancehey.mid', 6, !justListening, 'Hey', .3, .1);
    initTracks('/script/midi/wedanceyeah.mid', 7, !justListening, 'Yeah', .3, .2);
    initTracks('/script/midi/wedanceyo.mid', 8, !justListening, 'Yo', .3, -.2);
    initTracks('/script/midi/wedancename.mid', 9, !justListening, 'Producer name', .35, .1);
    initTracks('/script/midi/wedancehome.mid', 10, !justListening, 'Hometown', .35, -.05);
    initTracks('/script/midi/wedancedrink.mid', 11, !justListening, 'Favorite drink', .35, -.1);
    initTracks('/script/midi/wedancemusic.mid', 12, !justListening, 'Favorite music', .35, .1);
    
    // Remove html template
    $('.tracklist li').first().remove();
  
    //load sound files potentially existing from previous sessions
    Sound.loadUserSoundFiles(13, username, version);
  
    if (justListening) {
      $('.share').hide();
      $('#toggle-share').css('visibility', 'hidden');
      $('#are-you-cooler').html('Are you cooler than ' + username + '?');
      $('.make-your-own-area').show();
      $('.competition').hide();
    } else {
      $('.make-your-own-area').hide();
      $('.competition').show();
      var link = window.location.hostname + '/' + username;
      
      $(".share-link").each(function () {
        var href = $(this).attr('href');
        $(this).attr("href", href + 'http://' + link);
      });
      
      $('.share').show();
    }
  
  }
  
  function initTracks(midiUrl, trackIndex, makeHtmlTrack, trackName, gain, pan, soundUrl, fileType) {
  
    // init html track only if necessary
    if (makeHtmlTrack) {
      //adapt tracklist item
      var indexString = pad(trackIndex, 2);
      var currentTrack = $('.tracklist li').first().clone();
      currentTrack.find('#record').attr('id', 'record'+indexString);
      currentTrack.find('#play').attr('id', 'play'+indexString);
      currentTrack.find('#delete').attr('id', 'delete'+indexString);
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
      Sound.loadSoundFile(soundUrl, trackIndex, fileType);
    }
    
    // init channel
    Sound.channels[trackIndex] = new ChannelBus(gain, pan);
    Sound.channels[trackIndex].connect(Sound.audioContext.destination);

  }
  
  function pad(num, size) {
    var s = num+"";
    while (s.length < size) {
        s = "0" + s;
    }
    return s;
  }
  
});