var THRESHOLD = .1,
  FADE_LENGTH = 5000;

var recLength = 0,
  recBuffersL = [],
  recBuffersR = [],
  sampleRate,
  lastAboveThreshold;

this.onmessage = function(e){
  switch(e.data.command){
    case 'init':
      init(e.data.config);
      break;
    case 'record':
      record(e.data.buffer);
      break;
    case 'exportWAV':
      exportWAV(e.data.type);
      break;
    case 'getBuffer':
      getBuffer();
      break;
    case 'clear':
      clear();
      break;
  }
};

function init(config){
  sampleRate = config.sampleRate;
}

function record(inputBuffer, callback){
  //console.log(inputBuffer);
  var monoChannel = inputBuffer[0];
  var gatedBuffer = [ ];
  for (var i = 0; i < monoChannel.length; i++) {
    if (Math.abs(monoChannel[i]) > THRESHOLD) {
      lastAboveThreshold = Date.now();
      gatedBuffer.push(monoChannel[i]);
    } else if (Date.now()-lastAboveThreshold < 5000) {
      gatedBuffer.push(monoChannel[i]);
    } else {
      //STOP RECORDING!!!!
    }
  }
  recBuffersL.push(gatedBuffer);
  //recBuffersR.push(inputBuffer[1]);
  recLength += gatedBuffer.length;
}

function exportWAV(type){
  var bufferL = mergeAndFadeBuffers(recBuffersL, recLength);
  //var bufferR = mergeBuffers(recBuffersR, recLength);
  //var interleaved = interleave(bufferL, bufferR);
  //var dataview = encodeWAV(interleaved);
  var dataview = encodeWAV(bufferL);
  var audioBlob = new Blob([dataview], { type: type });
  this.postMessage(audioBlob);
}

function getBuffer() {
  var buffers = [];
  buffers.push( mergeAndFadeBuffers(recBuffersL, recLength) );
  buffers.push( mergeAndFadeBuffers(recBuffersR, recLength) );
  this.postMessage(buffers);
}

function clear(){
  recLength = 0;
  recBuffersL = [];
  recBuffersR = [];
}

function mergeAndFadeBuffers(recBuffers, recLength){
  var result = new Float32Array(recLength);
  var offset = 0;
  for (var i = 0; i < recBuffers.length; i++){
    result.set(recBuffers[i], offset);
    offset += recBuffers[i].length;
  }
  fadeIn(result);
  fadeOut(result);
  normalize(result);
  return result;
}

function fadeIn(buffer) {
  //fade in in beginning of recording to avoid clipping
  for (var i = 0; i < Math.min(buffer.length, FADE_LENGTH); i++) {
    buffer[i] *= i/FADE_LENGTH;
  }
}

function fadeOut(buffer) {
  //fade out at end of buffer to avoid clipping
  for (var i = 0; i < Math.min(buffer.length, FADE_LENGTH); i++) {
    var index = buffer.length-1-i;
    buffer[index] *= i/FADE_LENGTH;
  }
}

function normalize(buffer) {
  var maxAmplitude = 0;
  for (var i = 0; i < buffer.length; i++) {
    maxAmplitude = Math.max(maxAmplitude, buffer[i]);
  }
  var scaleFactor = 1/maxAmplitude;
  //console.log(scaleFactor);
  for (var i = 0; i < buffer.length; i++) {
    buffer[i] *= scaleFactor;
  }
}

function interleave(inputL, inputR){
  var length = inputL.length + inputR.length;
  var result = new Float32Array(length);

  var index = 0,
    inputIndex = 0;

  while (index < length){
    result[index++] = inputL[inputIndex];
    result[index++] = inputR[inputIndex];
    inputIndex++;
  }
  return result;
}

function floatTo16BitPCM(output, offset, input){
  for (var i = 0; i < input.length; i++, offset+=2){
    var s = Math.max(-1, Math.min(1, input[i]));
    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
}

function writeString(view, offset, string){
  for (var i = 0; i < string.length; i++){
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function encodeWAV(samples){
  var buffer = new ArrayBuffer(44 + samples.length * 2);
  var view = new DataView(buffer);

  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* file length */
  view.setUint32(4, 32 + samples.length * 2, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, 1, true);
  /* channel count */
  //view.setUint16(22, 2, true); /*STEREO*/
  view.setUint16(22, 1, true); /*MONO*/
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  //view.setUint32(28, sampleRate * 4, true); /*STEREO*/
  view.setUint32(28, sampleRate * 2, true); /*MONO*/
  /* block align (channel count * bytes per sample) */
  //view.setUint16(32, 4, true); /*STEREO*/
  view.setUint16(32, 2, true); /*MONO*/
  /* bits per sample */
  view.setUint16(34, 16, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, samples.length * 2, true);

  floatTo16BitPCM(view, 44, samples);

  return view;
}
