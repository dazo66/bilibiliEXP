// ==UserScript==
// @name         bilibiliEXP
// @namespace    dazo66
// @version      0.1
// @description  �Զ�Ͷ�� �������������ˢ����
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
        sendLog(`[�����ӻ�Ӳ��]${responseText}`);
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
        sendLog(`[�Զ�Ͷ��]����Ͷ�һ�õľ���Ϊ:${coin_num}`);
        sendLog(`[�Զ�Ͷ��]��ǰ��Ƶ��av��Ϊ��${aid}`);
        sendLog(`[�Զ�Ͷ��]��ǰ��Ƶ�İ�Ȩ��${copyright}`);
        if (coin_num < 50) {

            var o = Math.random().toString().substr(2);
            var timestamp = new Date().getTime();
            var site = `https://api.bilibili.com/x/web-interface/archive/coins?callback=jqueryCallback_bili_${o}&jsonp=jsonp&aid=${aid}&_=${timestamp}`;
            _get(site, {},
            function() {
                sendLog(`[�Զ�Ͷ��]${this.responseText}`)
                var matchs = this.responseText.match(/"multiply":\d/);
                var multiply = matchs[0][matchs[0].length - 1];
                sendLog(`[�Զ�Ͷ��]��ǰ�����Ͷ������Ϊ��${multiply}`);
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
                    sendLog(`[�Զ�Ͷ��]����Ͷ�� Ͷ������${multiply}`);
                    _post("https://api.bilibili.com/x/web-interface/coin/add", params,
                    function(req){},
                    function(responseText2) {
                        sendLog(responseText2);
                        sendedCoin = coin_num / 10 + multiply
                        localStorage.setItem('sendedCoin',sendedCoin);
                        sendLog(`[�Զ�Ͷ��]�����Ѿ�Ͷ��${sendedCoin}`)
                    });
                } else {
                    sendLog(`[�Զ�Ͷ��]��ǰ���û�п�Ͷ����`);
                }
            })

        } else {
            sendLog(`[�Զ�Ͷ��]�����Ѿ�Ͷ��5��Ӳ����`);
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
        sendLog(`[bilibiliEXP]��ʼ��Ӳ��`)
        silver2coin();
    } else {
        sendLog(`[bilibiliEXP]���첻����Ҫ��Ӳ����`)
    }
    if(lastDate === '' || lastDate === null || lastDate != currentDate) {
        sendLog(`[bilibiliEXP]��ʼ�Զ�����`)
        autoShare();
    } else {
        sendLog(`[bilibiliEXP]���첻�ٷ�����`)
    }
    if(lastDate === '' || lastDate === null || lastDate != currentDate || sendedCoin < 5) {
        sendLog(`[bilibiliEXP]��ʼ��Ӳ��`)
        autoSendCoin();
    } else {
        sendLog(`[bilibiliEXP]�����Ѿ�����Ҫ��Ӳ����`)
    }
    localStorage.setItem("lastDate", currentDate)
};
setTimeOut();
run();