// The width and height of the captured photo. We will set the
// width to the value defined here, but the height will be
// calculated based on the aspect ratio of the input stream.
var width = 480,    // We will scale the photo width to this
    height = 0,     // This will be computed based on the input stream

    // |streaming| indicates whether or not we're currently streaming
    // video from the camera. Obviously, we start at false.
    streaming = false,

    // The various HTML elements we need to configure or control.
    preview = document.getElementById('preview'),
    video   = document.getElementById('video'),
    canvas  = document.getElementById('canvas'),
    photo   = document.getElementById('photo'),

    // Capture
    capturedFramesRaw  = [],
    capturedFramesList = [],
    captureFrame       = document.getElementById('captureFrame'),
    deleteLastFrame    = document.getElementById('deleteLastFrame'),
    noOfFrames         = null,
    lastFrame          = null,

    // Playback
    scrollFrames               = null,
    frameRate                  = 0,
    isPlaying                  = false,
    loopCheck                  = document.getElementById("loopCheckbox"),
    playbackButton             = document.getElementById("playbackFrames"),
    stopPlaybackButton         = document.getElementById("stopPlayback"),
    pausePlaybackButton        = document.getElementById("pausePlayback"),
    inputChangeFR              = document.querySelector(document.BoatsAnimator.getVariable("inputFRChange")),
    backCapturedFrameButton    = document.getElementById("backCapturedFrame"),
    forwardCapturedFrameButton = document.getElementById("forwardCapturedFrame"),

    // Captured Frames Timeline
    // TODO

    // Onion skin
    onionSkinFrame     = null,
    isOnionSkinEnabled = false,
    onionSkinPanel     = document.querySelector(document.BoatsAnimator.getVariable("onionSkinOptions")),
    onionSkinToggle    = document.querySelector(document.BoatsAnimator.getVariable("onionSkinToggle")),
    onionSkinWindow    = document.querySelector(document.BoatsAnimator.getVariable("onionSkinFrame"));

function startup() {
    noOfFrames     = capturedFramesRaw.length;
    lastFrame      = capturedFramesRaw[noOfFrames - 1];
    onionSkinFrame = capturedFramesList[capturedFramesList.length];
    frameRate      = 15;
    isPlaying      = false;

    updateframeslist();

    // Set default frame rate
    inputChangeFR.value = frameRate;


    navigator.getMedia = (navigator.getUserMedia ||
                           navigator.webkitGetUserMedia ||
                           navigator.mozGetUserMedia ||
                           navigator.msGetUserMedia);

    navigator.getMedia(
        {
            video: true,
            audio: false
        },
      function(stream) {
        if (navigator.mozGetUserMedia) {
          preview.mozSrcObject = stream;
          video.mozSrcObject = stream;
        } else {
          var vendorURL = window.URL || window.webkitURL;
          preview.src = vendorURL.createObjectURL(stream);
          video.src = vendorURL.createObjectURL(stream);
        }
        preview.play();
        video.play();
      },
      function(err) {
        console.log("An error occured! " + err);
      }
    );

    video.addEventListener('canplay', function(){
      if (!streaming) {
        height = video.videoHeight / (video.videoWidth/width);

        // Firefox currently has a bug where the height can't be read from
        // the video, so we will make assumptions if this happens.

        if (isNaN(height)) {
          height = width / (4/3);
        }

        video.setAttribute('width', width);
        video.setAttribute('height', height);
        canvas.setAttribute('width', width);
        canvas.setAttribute('height', height);
        streaming = true;
      }
    }, false);

/*==========================================================
=============== LISTENERS ==================================
===============================================================*/

    //Listen if capture frame button pressed
    captureFrame.addEventListener('click', function(ev){
      takepicture();
      ev.preventDefault();
    }, false);

    //Listen if undo last frame button pressed
    deleteLastFrame.addEventListener('click', function(ev){
        deleteframe();
        ev.preventDefault();
    }, false);

    //listen if onion skin toggle pressed
    onionSkinToggle.addEventListener('click', function() {
        toggleOnionSkin();
    }, false);

    //listen if playback button is pressed
    playbackButton.addEventListener('click', function(ev){
        //check pics have been taken
        if(noOfFrames > 0){
            if(isPlaying == false){
            playbackframes();
            }else{
                console.warn("Pressing play did nothing as already playing!");
            }

        }else{
            console.warn("Pressing play did nothing as no pictures have been taken!");
        }
        ev.preventDefault();
    }, false);

    //listen if stop playback button is pressed
    stopPlaybackButton.addEventListener('click', function(ev){
        //check pics have been taken
        if(noOfFrames > 0){
            if(loopCheck.checked){
                stopitwhenlooping();
            }else{
                stopit();
            }
        }else{
            console.warn("Pressing stop did nothing as no pictures have been taken!");
        }
        ev.preventDefault();
    }, false);

    //listen if pause playback button is pressed
    pausePlaybackButton.addEventListener('click', function(ev){
        //check pics have been taken
        if(noOfFrames > 0){
           if(isPlaying == true){
                pauseit();
            }else{
                console.warn("Pressing pause did nothing as not playing!");
            }
        }else{
            console.warn("Pressing pause did nothing as no pictures have been taken!");
        }
        ev.preventDefault();
    }, false);

    // Listen for frame rate changes
    inputChangeFR.addEventListener('change', function() {
        "use strict";
        frameRate = parseInt(this.value, 10);
        document.getElementById("currentFrameRate").innerHTML = "Playback is currently at " + this.value + " fps";
        stopitwhenlooping();
    }, false);

    //listen if left arrow button is pressed
    backCapturedFrameButton.addEventListener('click', function(ev){
        scrollFrames--;
        updateframeslist();
        ev.preventDefault();
    }, false);

    //listen if right arrow button is pressed
    forwardCapturedFrameButton.addEventListener('click', function(ev){
        scrollFrames++;
        updateframeslist();
        ev.preventDefault();
    }, false);



    clearphoto();
  }

  // Fill the photo with an indication that none has been
  // captured.

  function clearphoto() {
    var context = canvas.getContext('2d');
    context.fillStyle = "#AAA";
    context.fillRect(0, 0, canvas.width, canvas.height);
      console.log('canvas cleared');

    var data = canvas.toDataURL('image/png');
    //photo.setAttribute('src', data);
  }

    //update the various places frames appear when a picture is taken or deleted
    function updateframeslist() {
        //update number of frames taken
        noOfFrames = capturedFramesRaw.length;
        //update name of last frame captured
        lastFrame = capturedFramesRaw[noOfFrames - 1];

        // Update onion skin frame
        onionSkinWindow.setAttribute("src", lastFrame);

        //update frames preview (Thank you Anon)
        if(capturedFramesRaw.length > 4){
            document.getElementById("lastCapturedFrame1").setAttribute("src", capturedFramesRaw[scrollFrames - 5]);
        }else{
            document.getElementById("lastCapturedFrame1").setAttribute("src", "blanksquare.png");
        }


        if(capturedFramesRaw.length > 3){
            document.getElementById("lastCapturedFrame2").setAttribute("src", capturedFramesRaw[scrollFrames - 4]);
        }else{
            document.getElementById("lastCapturedFrame2").setAttribute("src", "blanksquare.png");
        }

        if(capturedFramesRaw.length > 2){
            document.getElementById("lastCapturedFrame3").setAttribute("src", capturedFramesRaw[scrollFrames - 3]);
        }else{
            document.getElementById("lastCapturedFrame3").setAttribute("src", "blanksquare.png");
        }

        if(capturedFramesRaw.length > 1){
            document.getElementById("lastCapturedFrame4").setAttribute("src", capturedFramesRaw[scrollFrames - 2]);
        }else{
            document.getElementById("lastCapturedFrame4").setAttribute("src", "blanksquare.png");
        }

        if(capturedFramesRaw.length > 0){
            document.getElementById("lastCapturedFrame5").setAttribute("src", capturedFramesRaw[scrollFrames - 1]);
        }else{
            document.getElementById("lastCapturedFrame5").setAttribute("src", "blanksquare.png");
        }

       // console.info('There are now: ' + noOfFrames + ' frames');

        //download indivdual frames WIP
        var check = document.getElementById("downloadCheckbox");
        if(check.checked){
        document.getElementById("debug1").innerHTML = "<a download href='" + lastFrame + "'>Download last frame</a>";
        }

        //display number of frames captured in status bar
        if (noOfFrames==1){
            document.getElementById("noOfFrames").innerHTML = noOfFrames + " frame captured";
        }else{
            document.getElementById("noOfFrames").innerHTML = noOfFrames + " frames captured";
        }
        //display current frame rate in status bar
        document.getElementById("currentFrameRate").innerHTML = "Playback is currently at " + frameRate.toString() + " fps";


        console.log("Scrollframes: " + scrollFrames);
    }

    function updatedeleteicons() {

    }


    function deleteframe() {
        var undoCheck = confirm("Are you sure you want to delete the last frame captured?");
        if (undoCheck == true) {
            //delete last frame from list of imgs
            capturedFramesList.splice((noOfFrames - 1),1);
            //delete last frame from list of img srcs
            capturedFramesRaw.splice((noOfFrames - 1),1);
            console.info('Deleted frame: ' + lastFrame.slice(100, 120) + ' There are now: ' + (noOfFrames - 1) + ' frames');
            //update frame scroller
            scrollFrames = capturedFramesRaw.length;
        }
        updateframeslist();
    }

/**
 * Toggle onion skinning on or off.
 */
function toggleOnionSkin() {
    "use strict";
    // Onion skin is currently enabled, turn it off
    if (isOnionSkinEnabled) {
      isOnionSkinEnabled = false;
      onionSkinToggle.innerHTML = "Off";
      onionSkinPanel.classList.remove("visible");
      onionSkinWindow.classList.remove("visible");

      // Onion skin is currently disabled, turn it on
    } else {
      isOnionSkinEnabled = true;
      onionSkinToggle.innerHTML = "On";
      onionSkinPanel.classList.add("visible");

      // Display last captured frame
      onionSkinWindow.classList.add("visible");
      onionSkinWindow.setAttribute("src", lastFrame);
    }
}

// Capture a photo by fetching the current contents of the video
  // and drawing it into a canvas, then converting that to a PNG
  // format data URL. By drawing it on an offscreen canvas and then
  // drawing that to the screen, we can change its size and/or apply
  // other changes before drawing it.
    function takepicture() {
        var context = canvas.getContext('2d');
        if (width && height) {
            canvas.width = width;
            canvas.height = height;
            context.drawImage(video, 0, 0, width, height);

            var data = canvas.toDataURL('image/png');
            photo.setAttribute('src', data);
            //add frame to list of imgs
            capturedFramesList.push("<img class='capturedFramesItem' id='" + noOfFrames + "' src='" + data + "'>");

            //add frame to list of img srcs
            capturedFramesRaw.push(data);

            scrollFrames = capturedFramesRaw.length;

            console.info('Captured frame: ' + data.slice(100, 120) + ' There are now: ' + (noOfFrames + 1) + ' frames');
            updateframeslist();
        } else {
            clearphoto();
        }

    }


//PLAYBACK
    var playbackFrameNo = -1,
        yoplayit;

function playbackframes() {
        yoplayit = setInterval(playit, (1000 / frameRate));
        console.info("Playback started");
}
function playit() {
    isPlaying = true;
    playbackFrameNo++;
    document.getElementById('playback').setAttribute("src",capturedFramesRaw[playbackFrameNo]);
    document.getElementById('currentFrame').innerHTML = "Playing frame " + (playbackFrameNo + 1);
    if((noOfFrames - 1) == playbackFrameNo){
            stopit();
    }
}
function stopit() {
    var loopCheck = document.getElementById("loopCheckbox");

    //reset playback to the first frame
    playbackFrameNo = -1;
    if(loopCheck.checked == true){
        //if loop check is true playback continues from frame 1
        console.info("Playback looped");
    }else{
        isPlaying = false;
        //stop increasing playback frame number
        clearInterval(yoplayit);
        //display final frame in playback window
        document.getElementById('playback').setAttribute("src",lastFrame);
        document.getElementById('currentFrame').innerHTML = "Playing frame " + noOfFrames;
        console.info("Playback stopped");
    }
}
function stopitwhenlooping() {
    isPlaying = false;
    //stop increasing playback frame number
    clearInterval(yoplayit);
    document.getElementById('playback').setAttribute("src",lastFrame);
    document.getElementById('currentFrame').innerHTML = "Playing frame " + noOfFrames;
    //reset playback frame
    playbackFrameNo = -1;
    console.info("Playback stopped with loop on");
}

function pauseit() {
    isPlaying = false;
    clearInterval(yoplayit);
    console.info("Playback paused");
}




  // Set up our event listener to run the startup process
  // once loading is complete.
  window.addEventListener('load', startup, false);




//SET AMOUNT OF ONION SKIN
function onionSkinAmount() {
    document.getElementById("onionSkinPercentage").innerHTML = document.getElementById("onionSkinAmount").value * 5 + "%";
    onionSkinWindow.style.opacity = (document.getElementById("onionSkinAmount").value * 5)/100;
}