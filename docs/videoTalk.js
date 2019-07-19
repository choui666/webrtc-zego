// import {ZegoClient} from "../sdk/wechatMini/zego.client.wechat";
var zg,
    now = new Date().getTime(),
    appid = 1739272706,
    bigRoom_appid = 1811473550,
    serverEnv = {
        pro: "wss://wsliveroom" + 1739272706 + "-api.zego.im:8282/ws",
        alpha: "wss://wsliveroom-alpha.zego.im:8282/ws",
        test: 'wss://wssliveroom-test.zego.im/ws',
        test2: 'wss://test2-wsliveroom-api.zego.im:8282/ws'
    },
    _config = {
        "appid": appid,
        "idName": now + '',
        "nickName": 'u' + now,
        "server": serverEnv.pro,
        "logLevel": 0,
        "logUrl": "",
        "remoteLogLevel": 0,
        "audienceCreateRoom": false,
        "testEnvironment": false
    },
    previewVideo,
    useLocalStreamList = [],
    isLogin = false,
    isPreviewed = false;

function init() {
    previewVideo = $('#previewVideo')[0];

    zg = new ZegoClient();
    zg.setUserStateUpdate(true);

    console.log("config param:" + JSON.stringify(_config));

    zg.config(_config);


    // 监听sdk回掉
    listen();
}
function getPreviewConfig(){
    return  {
        "audio":   true,
        "audioInput":   null,
        "video":  true,
        "videoInput":   null,
        "videoQuality":   2,
        "horizontal": true
    }
}

function openRoom(roomId, type,isVideoTalk) {
    if (isLogin) {
        return leaveRoom();
    }

    if (!roomId) {
        alert('请输入房间号');
        return;
    }

    //get token
    //tokenUrl = "https://wsliveroom"+_config.appid+"-api.zego.im:8282/token";
    tokenUrl = "https://wsliveroom-demo.zego.im:8282/token";
    $.get(tokenUrl, {
            app_id: _config.appid,
            id_name: _config.idName
        },
        function (token) {
            if (!token) {
                alert('get token failed')
            } else {
                console.log('gettoken success');
                startLogin(token, type,isVideoTalk)
            }
        }, 'text');


    //login
    function startLogin(token, type,isVideoTalk) {
        zg.login(roomId, type, token, function (streamList) {
            console.log('login success');
            loginSuccess(streamList, type,isVideoTalk);
        }, function (err) {
            loginFailed(err);
        })
    }

    function loginFailed(err) {
        alert('登录失败');
        console.error(err)

    }

    function loginSuccess(streamList, type,isVideoTalk) {
        if(isVideoTalk){
            zg.startVideoTalk({
                streamList,
                previewConfig: getPreviewConfig(),
                localVideo:previewVideo,
                remoteVide:$('.remoteVideo video:eq(0)')[0],
                streamId:_config.idName
            });
            return;
        }

    }

}


function listen() {
    var _config = {
        onPlayStateUpdate: function (type, streamid, error) {
            if (type == 0) {
                console.info('play  success');
                $('.remoteVideo video:eq(0)')[0].muted = false;
                $('.remoteVideo video:eq(0)')[0].play();
                $('.remoteVideo video:eq(0)')[0].play();
            } else if (type == 2) {
                console.info('play retry');
            } else {

                console.error("play error " + error.msg);

                var _msg = error.msg;
                if (error.msg.indexOf('server session closed, reason: ') > -1) {
                    var code = error.msg.replace('server session closed, reason: ', '');
                    if (code == 21) {
                        _msg = '音频编解码不支持(opus)';
                    } else if (code == 22) {
                        _msg = '视频编解码不支持(H264)'
                    } else if (code == 20) {
                        _msg = 'sdp 解释错误';
                    }
                }
                alert('拉流失败,reason = ' + _msg);
            }

        },
        onKickOut: function (error) {
            console.warn("onKickOut " + JSON.stringify(error));
            if (error.code === 'VideoTalkOut') {
                leaveRoom()
            }
        },
        onStreamUpdated: function (type, streamList) {
            if (type == 0) {
                for (var i = 0; i < streamList.length; i++) {
                    console.info(streamList[i].stream_id + ' was added');
                    useLocalStreamList.push(streamList[i]);
                }

            } else if (type == 1) {

                for (var k = 0; k < useLocalStreamList.length; k++) {

                    for (var j = 0; j < streamList.length; j++) {

                        if (useLocalStreamList[k].stream_id === streamList[j].stream_id) {
                            console.info(useLocalStreamList[k].stream_id + 'was devared');

                            useLocalStreamList.splice(k, 1);
                            break;
                        }
                    }
                }
            }

        },
    };

    for (var key in _config) {
        zg[key] = _config[key]
    }

}


function leaveRoom() {
    console.info('leave room  and close stream');

    zg.stopPreview(previewVideo);

    zg.stopPublishingStream(_config.idName);

    for (var i = 0; i < useLocalStreamList.length; i++) {
        zg.stopPlayingStream(useLocalStreamList[i].stream_id);
    }

    useLocalStreamList = [];
    isPreviewed = false;
    isLogin = false;
    zg.logout();
}


$(function () {

    console.log(ZegoClient.getCurrentVersion());
    if (ZegoClient.isSupportWebrtc()) {

        //初始化sdk
        init();

        $('#startVideoTalk').click(function () {
            openRoom($('#roomId').val(), 1, true);
        });

        $('#leaveRoom').click(function () {
            leaveRoom();
        });

        $('#openAudio').click(function () {
            $('.remoteVideo video:eq(0)')[0].muted = false;
            $('.remoteVideo video:eq(0)')[0].play();
        });

        $('#openVideo').click(function () {
            var start = new Date().getTime();

            setTimeout(function () {
                var end = new Date().getTime();
                alert(end-start);
                $('#otherVideo').attr('src','./lib/chrome.webm');
                $('#otherVideo')[0].play();
            },10000);
        });

    }
});

