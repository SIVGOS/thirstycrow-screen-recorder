let useGainNode = true;
let cameraStream = null;
let screenStream = null;
let cameraVideo = null;
let screenVideo = null;
let startBtn = document.getElementById("startbtn");
let screenBtn = document.getElementById("sharescreen");
let recordbtn = document.getElementById("recordbtn");
let mediaRecorder = null;

let frameInterval = 10;
let width = parseInt(window.innerWidth*0.8);
let height = parseInt(window.innerHeight*0.8);
let camVideoRatio = 0.3

let canvas = document.getElementById("videocanvas");
canvas.style.height = height;
canvas.style.width = width;
canvas.style.marginLeft = parseInt(width*0.1);
canvas.style.marginTop = 20;
canvas.width = width;
canvas.height = height;
let context = canvas.getContext('2d');

// Detect if a mobile browser is being used
if(/Mobi/.test(navigator.userAgent)) {
    alert("Screen sharing is currently not supported in mobile devices.");
    screenBtn.hidden = true;
}

async function getVideo(stream) {
    var video = document.createElement('video');
    video.srcObject = new MediaStream(stream.getTracks());
    video.muted = true;
    video.volume = 0;
    video.play();
    return video;
}

function drawVideosToCanvas(){
    if(screenVideo){
        screenVideo.width = width;
        screenVideo.height = height;
        context.drawImage(screenVideo, 0, 0, width, height);
    }
    if(cameraVideo){
        if(screenVideo){
            context.drawImage(cameraVideo, parseInt(width*(1-camVideoRatio)), parseInt(height*(1-camVideoRatio)),
                    parseInt(width*camVideoRatio), parseInt(height*camVideoRatio));
        }
        else{
            context.drawImage(cameraVideo, 0, 0, width, height);
        }
    }
    setTimeout(drawVideosToCanvas, frameInterval);
}


startBtn.addEventListener("click", async function(){
    if (!cameraStream) {
        cameraStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });
        cameraVideo = await getVideo(cameraStream);
        startBtn.innerText = "STOP CAMERA";
    }
    else {
        cameraStream.getTracks().forEach(z => {
            z.stop();
        });
        cameraStream = null;
        cameraVideo = null;
        startBtn.innerText = "START CAMERA";
    }
});

function removeScreenStream(){
    screenStream.getTracks().forEach(z => {
        z.stop();
    });
    screenStream = null;
    screenVideo = null;
    screenBtn.innerText = "START SHARING SCREEN";
}

screenBtn.addEventListener("click", async function(){
    if (!screenStream) {
        screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: true
        });
        screenStream.fullcanvas = true;
        screenStream.width = width;
        screenStream.height = height;
        screenVideo = await getVideo(screenStream);
        screenBtn.innerText = "STOP SHARING SCREEN";
        screenStream.addEventListener("ended", removeScreenStream);
        screenStream.addEventListener("inactive", removeScreenStream);
    }
    else {
        removeScreenStream()
    }
});

recordbtn.addEventListener("click", async function(){
    if(!mediaRecorder){
        let capturedStream = canvas.captureStream();
        let mediaStream = new MediaStream();
        capturedStream.getTracks().forEach((track)=>{
            if(track.kind === 'video'){
                mediaStream.addTrack(track)
            }
        })
        cameraStream.getTracks().forEach((track)=>{
            if(track.kind === 'audio'){
                mediaStream.addTrack(track);
            }
        })
        let recordedChunks = [];
        mediaRecorder = new MediaRecorder(mediaStream);
        mediaRecorder.ondataavailable = (e) => { recordedChunks.push(e.data) };
        mediaRecorder.start();
        mediaRecorder.onstop = (e) => {
            let blob = new Blob(recordedChunks, {
                type: "video/mp4",//your own type here
            });
            let url = URL.createObjectURL(blob);
            let a = document.createElement("a");
            document.body.appendChild(a);
            a.style = "display: none";
            a.href = url;
            a.download = "test.mp4";//your own name here
            a.click();
            window.URL.revokeObjectURL(url);
        }
        recordbtn.innerText = "STOP RECORDING";
        recordbtn.classList.push('button-recording');
    }
    else{
        mediaRecorder.stop();
        recordbtn.innerText = "START RECORDING";
        recordbtn.classList.pop();
    }
})

drawVideosToCanvas();
