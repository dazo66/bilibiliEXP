﻿// ==UserScript==
// @name         bilibiliEXP
// @namespace    dazo66
// @version      1.4
// @description  自动完成b站的每日投币 每日分享和每日银瓜子换硬币
// @author       dazo66
// @homepage     https://github.com/dazo66/bilibiliEXP
// @supportURL   https://github.com/dazo66/bilibiliEXP/issues
// @run-at       document-end
// @updateURL    https://raw.githubusercontent.com/dazo66/bilibiliEXP/master/bilibiliEXP.js
// @include      *://www.bilibili.com/video/*
// @icon         https://raw.githubusercontent.com/the1812/Bilibili-Evolved/master/images/logo-small.png
// @grant        GM_xmlhttpRequest
// ==/UserScript==


/**
 * 可以通过F12的控制台进行设置自动执行的行为
 * 使用方法：
 * 
 *     （默认开启）关闭自动银瓜子换硬币 
 *          localStorage.setItem('isSilver2coin', false)
 * 
 *     （默认开启）开启自动银瓜子换硬币 
 *          localStorage.setItem('isSilver2coin', true)
 *     
 *     设置每日投币最大数目（x表示每日自动投币的数目，在0-5之间，0表示不投币，默认为5） 
 *          localStorage.setItem('maxCoin', x)
 * 
 *     （默认关闭）开启大会员自动充电功能
 *          localStorage.setItem('isAutoCharge', true)
 * 
 *     （默认关闭）关闭大会员自动充电功能
 *          localStorage.setItem('isAutoCharge', false)
 *          
 * 
 * 指令执行后出现 [undefined] 字样就说明成功了
 */



var loc_url = this.location.href;
var currentDate = (new Date()).getDate();
var lastDate = localStorage.getItem("lastDate");
var sendedCoin = localStorage.getItem('sendedCoin');
var csrf = getCookie("bili_jct");
var lastQuick = localStorage.getItem('lastQuick');
var isAutoCharge = localStorage.getItem("isAutoCharge");

var isSilver2coin = localStorage.getItem("isSilver2coin");
var maxCoin = localStorage.getItem("maxCoin");
if (lastDate == null) {
    lastDate = currentDate - 1;
    localStorage.setItem('lastDate', lastDate);
}
if (isSilver2coin == null) {
    isSilver2coin = true;
    localStorage.setItem('isSilver2coin', true);
}
if (maxCoin == null) {
    maxCoin = 5;
    localStorage.setItem('maxCoin', 5);
}
if (sendedCoin == null) {
    sendedCoin = 0;
    localStorage.setItem('sendedCoin', 0);
}
if (sendedCoin == null) {
    sendedCoin = 0;
    localStorage.setItem('sendedCoin', 0);
}
if (lastQuick == null) {
    lastQuick = (new Date()).getMonth();
    localStorage.setItem('lastQuick', lastQuick);
}
if (isAutoCharge == null) {
    isAutoCharge = false;
    localStorage.setItem('isAutoCharge', isAutoCharge);
}
lastDate = parseInt(lastDate)
sendedCoin = parseInt(sendedCoin)
isSilver2coin = Boolean(isSilver2coin)
maxCoin = parseInt(maxCoin)
lastQuick = parseInt(parseInt)
isAutoCharge = Boolean(isAutoCharge)

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
    hender(req);
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
    if (lastDate != currentDate) {
        sendedCoin = 0;
    }
    var video_date = this.vd;
    var aid = video_date.aid;
    var copyright = video_date.copyright;
    var coin_num = 50;
    _get("https://www.bilibili.com/plus/account/exp.php", {},
    function() {
        var reqJson = JSON.parse(this.responseText);
        coin_num = reqJson["number"];
        sendLog(`[自动投币]今天投币获得的经验为:${coin_num}`);
        sendLog(`[自动投币]当前视频的av号为：${aid}`);
        sendLog(`[自动投币]当前视频的版权：${copyright}`);
        if (coin_num < 50 && sendedCoin * 10 <= coin_num) {

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
                if (sendedCoin + multiply > maxCoin) {
                    sendLog(`[自动投币]超过了可投币的数目 已停止投币`);
                    return
                }
                if (multiply == 2) {
                    if (sendedCoin + 1 > maxCoin) {
                        sendLog(`[自动投币]超过了可投币的数目 已停止投币`);
                        return
                    }
                }
                var params = "";
                params += 'aid' + '=' + aid + '&';
                params += 'multiply' + '=' + multiply + '&';
                params += 'select_like' + '=' + 1 + '&';
                params += 'cross_domain' + '=' + true + '&';
                params += 'csrf' + '=' + csrf;
            
                if(multiply != 0) {
                    sendLog(`[自动投币]尝试投币 投币数量${multiply}`);
                    _post("https://api.bilibili.com/x/web-interface/coin/add", params,
                    function(req){
                        req.setRequestHeader("Accept", "application/json, text/plain, */*")
                        req.setRequestHeader("Content-type","application/x-www-form-urlencoded");
                    },
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
            localStorage.setItem('sendedCoin', 5);
            sendLog(`[自动投币]今天已经投了5个硬币啦`);
        }
    });
}
function autoShare(){
    var video_date = this.vd;
    var aid = video_date.aid;
    var params = 'aid='+ aid +'&'+ 'csrf='+getCookie("bili_jct");
    _post("https://api.bilibili.com/x/web-interface/share/add", params,
    function(req){
        req.setRequestHeader("Content-type","application/x-www-form-urlencoded");
    },
    function(responseText) {
        sendLog(`[AutoShare]${responseText}`);
    });
}

function autoCharge(){
    var params = "";
    params += 'bp_num' + '=' + 5 + '&';
    params += 'is_bp_remains_prior' + '=' + true + '&';
    params += 'up_mid' + '=' + getCookie('DedeUserID') + '&';
    params += 'otype' + '=' + 'up' + '&';
    params += 'oid' + '=' + getCookie("DedeUserID") + '&';
    params += 'csrf' + '=' + csrf;
    sendLog(`[自动充电]尝试给自己充电`);
    _post("https://api.bilibili.com/x/ugcpay/web/v2/trade/elec/pay/quick", params,
        function(req){
            req.setRequestHeader("Accept", "application/json, text/plain, */*");
            req.setRequestHeader("Content-type","application/x-www-form-urlencoded");
        },
        function(responseText2) {
            sendLog(responseText2);
            sendLog(`[自动充电]自动给自己充电完成 下个月再执行`);
    });
    localStorage.setItem("lastQuick", (new Date()).getMonth());
}


function run() {
    if (isSilver2coin == "false") {
        if(lastDate === '' || lastDate === null || lastDate != currentDate) {
            sendLog(`[bilibiliEXP]开始换硬币`);
            silver2coin();
        } else {
            sendLog(`[bilibiliEXP]今天不再需要换硬币了`)
        }
    } else {
        sendLog(`[bilibiliEXP]换硬币功能已关闭`)
    }
    if(lastDate === '' || lastDate === null || lastDate != currentDate) {
        sendLog(`[bilibiliEXP]开始自动分享`)
        autoShare();
    } else {
        sendLog(`[bilibiliEXP]今天不再分享了`)
    }
    sendLog(`[bilibiliEXP]上次投币日期是${lastDate}当前投币数为${sendedCoin}`)
    if(lastDate === '' || lastDate === null || lastDate != currentDate || sendedCoin < 5) {
        sendLog(`[bilibiliEXP]开始送硬币`);
        autoSendCoin();
    } else {
        sendLog(`[bilibiliEXP]今天已经不需要送硬币了`)
    }
    if(isAutoCharge && lastQuick != (new Date()).getMonth()) {
        sendLog(`[bilibiliEXP]开始给自己充电`);
        autoCharge();
    } else {
        sendLog(`[bilibiliEXP]本月已经充过电了`);
    }
    localStorage.setItem("lastDate", currentDate);
};
setTimeOut();
window.setTimeout(function(){
    run();
}, 1000);