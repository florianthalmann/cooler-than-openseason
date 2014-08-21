/* global User */
/* global Sound */
/* global Midi */
/* //global UI */

/*!
 * main.js 
 * Brings it all together
 */

$(function() {

  navigator.getUserMedia  = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
  navigator.getUserMedia({ 'audio': true }, function(stream) {

    // If the user is logged in, go straight to main panel
    // otherwise load signup panel
    var session = User.sessionRunning();
    
    if( session !== '' ) {
      $('#container').load('main.html', function() { initMainPanel(stream, session); });
    }
    else {
      $('#container').load('signup.html', function() { initSignupPanel(stream); });
    }
  },
  function() {
    $('#container').load('error.html');
  });
      
  
  /**
   * Callback when loading Main Panel
   * ++ also menu panel!
   */
  function initMainPanel(stream, data) {
    
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    Sound.audioContext = new AudioContext();
    // Sound.tuna = new tuna(Sound.audioContext);
    window.mediaStreamSource = Sound.audioContext.createMediaStreamSource(stream);
    
    initTracksAndChannels();
    Sound.loadUserSoundFiles();
    
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
        url: 'php/ajax.user.php',
        processData: false,
        contentType: false,
        data: fd,
        
        success: function(data) {
          if(data.success) {
            // Load main panel
            $('#container').load('main.html', function() { initMainPanel(stream, data.success); });
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
      $('#container').load('login.html', function() { initLoginPanel(stream); });
    });
    
    $('#container').on('submit', '#form-signup', function (e) {
      e.preventDefault();
      
      var fd = new FormData( $('#form-signup')[0] );
      
      $.ajax({
        type: 'POST',
        url: 'php/ajax.user.php',
        processData: false,
        contentType: false,
        data: fd,
        
        success: function(data) {
          if(data.success) {
            // Load main panel
            $('#container').load('main.html', function() { initMainPanel(stream, data.success); });
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
    initTracks('script/midi/wedancedrums.mid', 0, ['Bassdrum', 'Snare', 'Hihat'], 1);
    initTracks('script/midi/wedancetom.mid', 3, ['Tom'], 1);
    initTracks('script/midi/wedancebass.mid', 4, ['Bass'], 1);
    initTracks('script/midi/wedanceshaker.mid', 5, ['Shaker'], .5);
    initTracks('script/midi/wedancehey.mid', 6, ['Hey'], 1);
    initTracks('script/midi/wedanceyeah.mid', 7, ['Yeah'], 1);
    initTracks('script/midi/wedanceyo.mid', 8, ['Yo'], 1);
    initTracks('script/midi/wedancevoc.mid', 9, null, 1, 'script/wav/wedancevoc.wav');
    
    // Remove html template
    $('.tracklist li').first().remove();
  }
  
  function initTracks(midiUrl, firstIndex, trackNames, gain, soundUrl) {
    var trackCount = trackNames ? trackNames.length : 1;
    var i;
    
    // init html track
    if (trackNames) {
      //adapt trackist items
      for (i = 0; i < trackNames.length; i++) {
        var currentTrack = $('.tracklist li').first().clone();
        currentTrack.find('#record').attr('id', 'record'+(firstIndex+i));
        currentTrack.find('#play').attr('id', 'play'+(firstIndex+i));
        currentTrack.find('.track-name').html(trackNames[i]);
        $('.tracklist').append(currentTrack);
      }
    }

    // init midifile
    Midi.loadMidiFile(midiUrl, function(data) {
      Midi.midiFiles.push(new PlayedMidiFile(MidiFile(data), trackCount > 1, firstIndex));
    });
   
    // init soundfile
    if (soundUrl) {
      Sound.loadSoundFile(soundUrl, firstIndex);
    }
    
    // init channels
    for (i = firstIndex; i < firstIndex+trackCount; i++) {
      Sound.channels[i] = new ChannelBus(gain);
      Sound.channels[i].connect(Sound.audioContext.destination);
    }
  }
  
});