// ==UserScript==
// @name         bilibiliEXP
// @namespace    dazo66
// @version      0.1
// @description  自动投币 点击分享链接来刷经验
// @author       dazo66
// @homepage     https://github.com/dazo66/bilibiliEXP
// @supportURL   https://github.com/dazo66/bilibiliEXP/issues
// @run-at       document-end
// @updateURL    https://raw.githubusercontent.com/dazo66/bilibiliEXP/master/bilibiliEXP.js
// @include      *://www.bilibili.com/video/av*
// @icon         https://raw.githubusercontent.com/the1812/Bilibili-Evolved/master/images/logo-small.png
// @grant        none
// ==/UserScript==

var aid = window.aid;
var loc_url = window.location.href;
var currentDate = (new Date()).getDate();
var lastDate = localStorage.getItem("lastDate");
var sendedCoin = localStorage.getItem("sendedCoin");
var csrf = getCookie("bili_jct");

function setTimeOut(){
    window.setTimeout(function() {
        if(loc_url != window.location.href) {
            run();
            loc_url = window.location.href;
        }
        setTimeOut();
    }, 10000);
}

function _post(path, params, hender, onload) {
    var req = new XMLHttpRequest();
    req.withCredentials = true;
    req.open("POST", path);
    hender(req)
    //req.setRequestHeader("Content-type","application/x-www-form-urlencoded");
    req.onreadystatechange = function() { // Call a function when the state changes.
        if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
            onload(req.responseText);
        }
    };
    req.send(params);
}

function _get(site, dates, onload) {
    var req = new XMLHttpRequest();
    req.withCredentials = true;
    req.open('GET', site, true);
    req.onload = onload;
    req.send(dates);
}

function sendLog(msg) {
    window.console.log(msg);
}

function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function silver2coin() {
    var params = new FormData();
    params.append('platform', 'pc');
    params.append('csrf_token', csrf);
    _post('https://api.live.bilibili.com/pay/v1/Exchange/silver2coin', params,
        function(_){},
        function(responseText){
        sendLog(`[银瓜子换硬币]${responseText}`);
    })
}

function autoSendCoin() {

    var video_date = window.vd;
    var copyright = video_date.copyright;
    var coin_num = 50;
    _get("https://www.bilibili.com/plus/account/exp.php", {},
    function() {
        var reqJson = JSON.parse(this.responseText);
        coin_num = reqJson["number"];
        sendLog(`[自动投币]今天投币获得的经验为:${coin_num}`);
        sendLog(`[自动投币]当前视频的av号为：${aid}`);
        sendLog(`[自动投币]当前视频的版权：${copyright}`);
        if (coin_num < 50) {

            var o = Math.random().toString().substr(2);
            var timestamp = new Date().getTime();
            var site = `https://api.bilibili.com/x/web-interface/archive/coins?callback=jqueryCallback_bili_${o}&jsonp=jsonp&aid=${aid}&_=${timestamp}`;
            _get(site, {},
            function() {
                sendLog(`[自动投币]${this.responseText}`)
                var matchs = this.responseText.match(/"multiply":\d/);
                var multiply = matchs[0][matchs[0].length - 1];
                sendLog(`[自动投币]当前稿件已投币数量为：${multiply}`);
                multiply = parseInt(multiply);
                multiply = (3 - copyright - multiply);
                if (coin_num / 10 + multiply > 5) {
                    multiply = 1;
                }
                var params = new FormData();
                params.append('aid', aid);
                params.append('multiply', multiply);
                params.append('select_like', 1);
                params.append('cross_domain', true);
                params.append('csrf', csrf);
                if(multiply != 0) {
                    sendLog(`[自动投币]尝试投币 投币数量${multiply}`);
                    _post("https://api.bilibili.com/x/web-interface/coin/add", params,
                    function(req){},
                    function(responseText2) {
                        sendLog(responseText2);
                        sendedCoin = coin_num / 10 + multiply
                        localStorage.setItem('sendedCoin',sendedCoin);
                        sendLog(`[自动投币]今天已经投了${sendedCoin}`)
                    });
                } else {
                    sendLog(`[自动投币]当前稿件没有可投币数`);
                }
            })

        } else {
            sendLog(`[自动投币]今天已经投了5个硬币啦`);
        }
    });
}
function autoShare(){
    var params = 'aid='+aid +'&'+'csrf='+getCookie("bili_jct");
    _post("https://api.bilibili.com/x/web-interface/share/add", params,
    function(req){
        req.setRequestHeader("Content-type","application/x-www-form-urlencoded");
    },
    function(responseText) {
        sendLog(`[AutoShare]${responseText}`);
    });
}


function run() {
    if(lastDate === '' || lastDate === null || lastDate != currentDate) {
        sendLog(`[bilibiliEXP]开始换硬币`)
        silver2coin();
    } else {
        sendLog(`[bilibiliEXP]今天不再需要换硬币了`)
    }
    if(lastDate === '' || lastDate === null || lastDate != currentDate) {
        sendLog(`[bilibiliEXP]开始自动分享`)
        autoShare();
    } else {
        sendLog(`[bilibiliEXP]今天不再分享了`)
    }
    if(lastDate === '' || lastDate === null || lastDate != currentDate || sendedCoin < 5) {
        sendLog(`[bilibiliEXP]开始送硬币`)
        autoSendCoin();
    } else {
        sendLog(`[bilibiliEXP]今天已经不需要送硬币了`)
    }
    localStorage.setItem("lastDate", currentDate)
};
setTimeOut();
run();