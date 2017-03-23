var sim_mode = 0;
// 0: heat
// 1: wave

var N = 50;  // range of y
var M = 50;  // range of x
var T = new Array(N).fill(0).map(x => new Array(M).fill(0));
var T1 = new Array(N).fill(0).map(x => new Array(M).fill(0));

var inv_Cv = 0.001;

var lambda = 0.1;

var bw = 8;

var dt = 0.05;
var dx = 0.1;
var dy = 0.1;

var stepN = 100;

var intensity = [1, 0.25][sim_mode];
var intoffset = [0, 25  ][sim_mode];

//var lambda2 =  new Array(N).fill(0).map((_1,y) => new Array(M).fill(0).map((_2,x)=>   (21<=x&&x<=27&&21<=y&&y<=27)?0.0001:1    ));
var lambda2 =  new Array(N).fill(0).map((_1,y) => new Array(M).fill(1));

var timer = setTimeout("onTick()",30);

/****************************************************/

function updateT() {
  var T2 = new Array(N).fill(0).map(x => new Array(M).fill(0));

  for(var y = 1; y < N - 1; y++) {
    for(var x = 1; x < M - 1; x++) {
      var temp = 0; 
      temp += (Math.min(lambda2[y][x-1], lambda2[y][x]) * (T[y][x-1] - T[y][x]) - Math.min(lambda2[y][x], lambda2[y][x+1]) * (T[y][x] - T[y][x+1])) / (dx * dx);
      temp += (Math.min(lambda2[y-1][x], lambda2[y][x]) * (T[y-1][x] - T[y][x]) - Math.min(lambda2[y][x], lambda2[y+1][x]) * (T[y][x] - T[y+1][x])) / (dy * dy);
      if(sim_mode == 0) {
        T2[y][x] = (temp * dt * lambda * inv_Cv) + T[y][x];
      }else if(sim_mode == 1) {
        T2[y][x] = 0.9999 * ((temp * dt * lambda * inv_Cv) + T[y][x] - T1[y][x]) + T[y][x];
      }
    }
  }

  // Neumann条件
  for(var y = 1; y < N - 1; y++) {
    T2[y][0]   = T[y][1];
    T2[y][M-1] = T[y][M-2];
  }
  for(var x = 1; x < M - 1; x++) {
    T2[0][x]   = T[1][x];
    T2[N-1][x] = T[N-2][x];
  }
  T2[0][0]     = T[1][1];
  T2[0][M-1]   = T[1][M-2];
  T2[N-1][0]   = T[N-2][1];
  T2[N-1][M-1] = T[N-2][M-2];

  T1 = T;
  T = T2;
}

function clamp(a,b,c) {
  var arr = [a,b,c];
  arr.sort((x,y) => x-y);
  return arr[1];
}

function drawT() {
  var mycanvas=document.getElementById("myCanvasTag");
  var mycontext=mycanvas.getContext('2d');

  for(var y = 1; y < N-1; y++) {
    for(var x = 1; x < M-1; x++) {
       var wall = false;
       var intens = Math.round((intoffset + 3 * T[y][x] * intensity) / 100 * 255);
       var int2 = Math.round((-0.2*Math.log10(lambda2[y][x])) * 255);
       if(!wall) {
         mycontext.fillStyle='rgb('+clamp(intens,0,255)+','+clamp(intens-255,0,255)+','+clamp(Math.max(intens-510,int2),0,255)+')';
       }else {
         mycontext.fillStyle='rgb(128,128,128)';
       }
       mycontext.fillRect(x*bw,y*bw,bw,bw);   
    }
  }
}

var heatSources = [[Math.min(10,N-2),Math.min(5,M-2),100]];  // [[y,x,temp], ...]

function onClick(e) {
    var rect = e.target.getBoundingClientRect();
    var heatX = Math.floor((e.clientX - rect.left) / bw);
    var heatY = Math.floor((e.clientY - rect.top)  / bw);

    var temperature = e.ctrlKey ? 0 : 100;

    if(heatY < 1 || heatY > N-2) { return; }
    if(heatX < 1 || heatX > M-2) { return; }

    if(e.shiftKey) {
      //lmbda[heatY][heatX] = !lmbda[heatY][heatX] - 0;
    }else if(heatSources.some(yxt => yxt[0] == heatY && yxt[1] == heatX)) {
      heatSources = heatSources.filter(yxt => !(yxt[0] == heatY && yxt[1] == heatX));
    }else {
      heatSources.push([heatY, heatX, temperature]);
    }

    updateHeatSources();

    if(timer == null) {
      drawT();
    }
}

function updateHeatSources() {
    heatSources.map(yxt => (T[yxt[0]][yxt[1]] += 0.01 * (yxt[2] - T[yxt[0]][yxt[1]])));
}

function onTick() {
  timer = null;

  for(var i = 0; i < stepN; i++) {
    updateT();

    updateHeatSources();
  }

  drawT();

  timer = setTimeout("onTick()",30); 
}

function onClickStartPause() {
  if(timer == null) {
    setTimeout("onTick()",30);
    //document.getElementById("startPauseButton").class = "btn btn-danger";
    $('#startPauseButton').removeClass('btn-danger').addClass('btn-info');
  }else {
    clearTimeout(timer);
    timer = null;
    $('#startPauseButton').removeClass('btn-info').addClass('btn-danger');
  }
}

function onClickRemoveAllHeatSources() {
  heatSources=[];
}

function onClickExportToClipboard() {
  txt = "";

  txt = "{\"heatSources\":";
  txt += "[[" + heatSources.map(x => x.join(",")).join("], [") + "]]";
  txt += "}";

  clipboadCopy(txt);
}

// forked from: http://www.bloguchi.info/599
var clipboadCopy = function(arg){
  var urltext = document.getElementById("clipboardText");
  urltext.value = arg + "";
  urltext.select();
  document.execCommand("copy");
}

function onClickImportFromTextarea() {
  text = document.getElementById("clipboardText").value;
  data = JSON.parse(text);

  heatSources = data.heatSources;

  T = new Array(N).fill(0).map(x => new Array(M).fill(0));  // initializeは1箇所に描くべきでは

  heatSources.map(yxt => (T[yxt[0]][yxt[1]] = yxt[2]));

  if(timer == null) {
    drawT();
  }
}
